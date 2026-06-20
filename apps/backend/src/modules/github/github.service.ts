import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';
import * as diff from 'diff';
import type { BranchCompareResult, GitHubWorkflowRun, PrReviewResult, MergeConflictResolution, GitHubIssueResult } from '@iac-platform/shared';
import { User, GithubAction, CommitMessage, PrReview } from '../../entities';
import { OpenAIService } from '../../services/openai';
import { AuditService } from '../audit/audit.service';
import { NotificationsService } from '../notifications/notifications.service';
import { ActivityService } from '../activity/activity.service';
import { VersionsService } from '../versions/versions.service';

@Injectable()
export class GithubService {
  constructor(
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(GithubAction) private readonly githubActionRepo: Repository<GithubAction>,
    @InjectRepository(CommitMessage) private readonly commitMsgRepo: Repository<CommitMessage>,
    @InjectRepository(PrReview) private readonly prReviewRepo: Repository<PrReview>,
    private readonly config: ConfigService,
    private readonly openai: OpenAIService,
    private readonly audit: AuditService,
    private readonly notifications: NotificationsService,
    private readonly activity: ActivityService,
    private readonly versions: VersionsService,
  ) {}

  async getRepositories(userId: string) {
    const token = await this.getToken(userId);
    const response = await fetch('https://api.github.com/user/repos?per_page=100&sort=updated', {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github.v3+json' },
    });
    if (!response.ok) throw new BadRequestException('Failed to fetch repositories');
    const repos = await response.json() as Array<{ full_name: string; default_branch: string; private: boolean }>;
    return repos.map((r) => ({ fullName: r.full_name, defaultBranch: r.default_branch, isPrivate: r.private }));
  }

  async getBranches(userId: string, repo: string) {
    const token = await this.getToken(userId);
    const response = await fetch(`https://api.github.com/repos/${repo}/branches?per_page=100`, {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github.v3+json' },
    });
    if (!response.ok) throw new BadRequestException('Failed to fetch branches');
    const branches = await response.json() as Array<{ name: string; commit: { sha: string } }>;
    return branches.map((b) => ({ name: b.name, sha: b.commit.sha }));
  }

  async compareBranches(userId: string, repo: string, base: string, head: string): Promise<BranchCompareResult> {
    const token = await this.getToken(userId);
    const response = await fetch(`https://api.github.com/repos/${repo}/compare/${base}...${head}`, {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github.v3+json' },
    });
    if (!response.ok) throw new BadRequestException('Failed to compare branches');
    const data = await response.json() as {
      files: Array<{ filename: string; status: string; additions: number; deletions: number; patch?: string }>;
      commits: Array<{ sha: string; commit: { message: string; author: { name: string; date: string } } }>;
    };
    return {
      files: data.files.map((f) => ({
        filename: f.filename,
        status: f.status as 'added' | 'removed' | 'modified' | 'renamed',
        additions: f.additions,
        deletions: f.deletions,
        patch: f.patch,
      })),
      totalAdditions: data.files.reduce((s, f) => s + f.additions, 0),
      totalDeletions: data.files.reduce((s, f) => s + f.deletions, 0),
      commits: data.commits.map((c) => ({
        sha: c.sha,
        message: c.commit.message,
        author: c.commit.author.name,
        date: c.commit.author.date,
      })),
    };
  }

  async getWorkflowRuns(userId: string, repo: string): Promise<GitHubWorkflowRun[]> {
    const token = await this.getToken(userId);
    const response = await fetch(`https://api.github.com/repos/${repo}/actions/runs?per_page=30`, {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github.v3+json' },
    });
    if (!response.ok) throw new BadRequestException('Failed to fetch workflow runs');
    const data = await response.json() as {
      workflow_runs: Array<{
        id: number;
        name: string;
        status: string;
        conclusion: string | null;
        head_branch: string;
        event: string;
        actor: { login: string };
        html_url: string;
        created_at: string;
        updated_at: string;
        run_started_at?: string;
      }>;
    };
    return data.workflow_runs.map((r) => ({
      id: r.id,
      name: r.name || 'Workflow',
      status: r.status as GitHubWorkflowRun['status'],
      conclusion: r.conclusion as GitHubWorkflowRun['conclusion'],
      branch: r.head_branch,
      event: r.event,
      actor: r.actor.login,
      htmlUrl: r.html_url,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
      durationSeconds: r.run_started_at
        ? Math.round((new Date(r.updated_at).getTime() - new Date(r.run_started_at).getTime()) / 1000)
        : undefined,
    }));
  }

  async getWorkflowLogs(userId: string, repo: string, runId: number) {
    const token = await this.getToken(userId);
    const jobsRes = await fetch(`https://api.github.com/repos/${repo}/actions/runs/${runId}/jobs`, {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github.v3+json' },
    });
    if (!jobsRes.ok) throw new BadRequestException('Failed to fetch workflow jobs');
    const jobs = await jobsRes.json() as { jobs: Array<{ id: number; name: string; status: string; conclusion: string | null; html_url: string }> };
    return jobs.jobs;
  }

  async rerunWorkflow(userId: string, repo: string, runId: number) {
    const token = await this.getToken(userId);
    const response = await fetch(`https://api.github.com/repos/${repo}/actions/runs/${runId}/rerun`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github.v3+json' },
    });
    if (!response.ok) throw new BadRequestException('Failed to rerun workflow');
    return { success: true };
  }

  async generateCommitMessage(
    userId: string,
    originalContent: string,
    newContent: string,
    fileName: string,
    format: string,
    repository?: string,
  ) {
    const diffText = diff.createPatch(fileName, originalContent, newContent);
    const generated = await this.openai.generateCommitMessage(diffText, fileName, format, userId);
    const record = await this.commitMsgRepo.save({
      id: uuidv4(),
      userId,
      repository,
      fileName,
      diff: diffText,
      message: generated.message,
      wasUsed: false,
    });
    return { id: record.id, ...generated, diff: diffText };
  }

  async createBranch(userId: string, repo: string, branchName: string, fromBranch: string) {
    const token = await this.getToken(userId);
    const refResponse = await fetch(`https://api.github.com/repos/${repo}/git/ref/heads/${fromBranch}`, {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github.v3+json' },
    });
    if (!refResponse.ok) throw new BadRequestException('Failed to get base branch');
    const ref = await refResponse.json() as { object: { sha: string } };

    const response = await fetch(`https://api.github.com/repos/${repo}/git/refs`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github.v3+json', 'Content-Type': 'application/json' },
      body: JSON.stringify({ ref: `refs/heads/${branchName}`, sha: ref.object.sha }),
    });
    if (!response.ok) throw new BadRequestException('Failed to create branch');
    await this.logAction(userId, 'branch', repo, { branch: branchName });
    return { branch: branchName, sha: ref.object.sha };
  }

  async commitFile(userId: string, repo: string, path: string, content: string, message: string, branch: string, commitMessageId?: string) {
    const token = await this.getToken(userId);
    let sha: string | undefined;
    const existing = await fetch(`https://api.github.com/repos/${repo}/contents/${path}?ref=${branch}`, {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github.v3+json' },
    });
    if (existing.ok) {
      const data = await existing.json() as { sha: string };
      sha = data.sha;
    }

    const response = await fetch(`https://api.github.com/repos/${repo}/contents/${path}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github.v3+json', 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, content: Buffer.from(content).toString('base64'), branch, ...(sha ? { sha } : {}) }),
    });
    if (!response.ok) throw new BadRequestException('Failed to commit file');
    const result = await response.json() as { commit: { sha: string } };

    if (commitMessageId) {
      await this.commitMsgRepo.update({ id: commitMessageId, userId }, { wasUsed: true });
    }

    await this.logAction(userId, 'commit', repo, { branch, path, sha: result.commit.sha, message });
    await this.audit.log({ userId, action: 'github_commit', module: 'github', resourceType: 'commit', resourceId: result.commit.sha, details: { repo, path, branch, message } });
    await this.notifications.create(userId, 'github_commit', 'Commit Successful', `Committed ${path} to ${repo}`, { repo, sha: result.commit.sha });
    this.activity.publish(userId, 'committed code', { resourceType: 'github', resourceName: repo, metadata: { path, sha: result.commit.sha } });
    return { commitSha: result.commit.sha };
  }

  async rollbackCommit(userId: string, repo: string, commitSha: string, path: string, branch: string) {
    const token = await this.getToken(userId);
    const commitRes = await fetch(`https://api.github.com/repos/${repo}/commits/${commitSha}`, {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github.v3+json' },
    });
    if (!commitRes.ok) throw new BadRequestException('Commit not found');
    const commitData = await commitRes.json() as { commit: { message: string; author: { name: string; date: string } }; files?: Array<{ filename: string; patch?: string }> };

    const parentRes = await fetch(`https://api.github.com/repos/${repo}/commits/${commitSha}`, {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github.v3+json' },
    });
    const parentData = await parentRes.json() as { parents: Array<{ sha: string }> };
    if (!parentData.parents?.[0]) throw new BadRequestException('Cannot rollback: no parent commit');

    const parentSha = parentData.parents[0].sha;
    const parentCommitRes = await fetch(`https://api.github.com/repos/${repo}/contents/${path}?ref=${parentSha}`, {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github.v3+json' },
    });

    let restoredContent = '';
    if (parentCommitRes.ok) {
      const fileData = await parentCommitRes.json() as { content: string };
      restoredContent = Buffer.from(fileData.content, 'base64').toString('utf-8');
    }

    const rollbackMessage = `Revert to ${commitSha.slice(0, 7)}: ${commitData.commit.message.split('\n')[0]}`;
    const result = await this.commitFile(userId, repo, path, restoredContent, rollbackMessage, branch);

    await this.audit.log({
      userId,
      action: 'github_rollback',
      module: 'github',
      resourceType: 'commit',
      resourceId: commitSha,
      beforeValue: commitSha,
      afterValue: result.commitSha,
      details: { repo, path, branch, originalMessage: commitData.commit.message, author: commitData.commit.author.name, date: commitData.commit.author.date },
    });
    await this.notifications.create(userId, 'github_rollback', 'Rollback Complete', `Restored ${path} to state before ${commitSha.slice(0, 7)}`, { repo, commitSha: result.commitSha });

    return {
      commitSha: result.commitSha,
      restoredContent,
      rolledBackFrom: { sha: commitSha, message: commitData.commit.message, author: commitData.commit.author.name, date: commitData.commit.author.date },
    };
  }

  async createPullRequest(userId: string, repo: string, title: string, body: string, head: string, base: string) {
    const token = await this.getToken(userId);
    const response = await fetch(`https://api.github.com/repos/${repo}/pulls`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github.v3+json', 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, body, head, base }),
    });
    if (!response.ok) throw new BadRequestException('Failed to create pull request');
    const pr = await response.json() as { number: number; html_url: string };
    await this.logAction(userId, 'pull_request', repo, { prNumber: pr.number, prUrl: pr.html_url });
    await this.notifications.create(userId, 'github_pr', 'Pull Request Created', title, { repo, prUrl: pr.html_url });
    return { prNumber: pr.number, prUrl: pr.html_url };
  }

  async getCommitHistory(userId: string, repo: string, path?: string) {
    const token = await this.getToken(userId);
    const url = path
      ? `https://api.github.com/repos/${repo}/commits?path=${path}&per_page=30`
      : `https://api.github.com/repos/${repo}/commits?per_page=30`;
    const response = await fetch(url, { headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github.v3+json' } });
    if (!response.ok) throw new BadRequestException('Failed to fetch commits');
    const commits = await response.json() as Array<{ sha: string; commit: { message: string; author: { name: string; date: string } } }>;
    return commits.map((c) => ({ sha: c.sha, message: c.commit.message, author: c.commit.author.name, date: c.commit.author.date }));
  }

  async getCommitMessages(userId: string) {
    return this.commitMsgRepo.find({ where: { userId }, order: { createdAt: 'DESC' }, take: 50 });
  }

  async getActionHistory(userId: string) {
    return this.githubActionRepo.find({ where: { userId }, order: { createdAt: 'DESC' }, take: 50 });
  }

  async listPullRequests(userId: string, repo: string, state = 'open') {
    const token = await this.getToken(userId);
    const response = await fetch(`https://api.github.com/repos/${repo}/pulls?state=${state}&per_page=30`, {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github.v3+json' },
    });
    if (!response.ok) throw new BadRequestException('Failed to fetch pull requests');
    const prs = await response.json() as Array<{ number: number; title: string; user: { login: string }; head: { ref: string }; base: { ref: string }; html_url: string; created_at: string }>;
    return prs.map((p) => ({ number: p.number, title: p.title, author: p.user.login, head: p.head.ref, base: p.base.ref, url: p.html_url, createdAt: p.created_at }));
  }

  async reviewPullRequest(userId: string, repo: string, prNumber: number): Promise<PrReviewResult> {
    const token = await this.getToken(userId);
    const prRes = await fetch(`https://api.github.com/repos/${repo}/pulls/${prNumber}`, {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github.v3+json' },
    });
    if (!prRes.ok) throw new BadRequestException('Pull request not found');
    const pr = await prRes.json() as { title: string; body: string | null };

    const filesRes = await fetch(`https://api.github.com/repos/${repo}/pulls/${prNumber}/files?per_page=100`, {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github.v3+json' },
    });
    if (!filesRes.ok) throw new BadRequestException('Failed to fetch PR files');
    const files = await filesRes.json() as Array<{ filename: string; patch?: string; status: string }>;

    const aiReview = await this.openai.reviewPullRequest(pr.title, pr.body || '', files, userId);
    const record = await this.prReviewRepo.save({
      id: uuidv4(),
      userId,
      repository: repo,
      prNumber,
      analysis: aiReview.analysis,
      riskScore: aiReview.riskScore,
      recommendation: aiReview.recommendation,
    });

    await this.audit.log({ userId, action: 'pr_review', module: 'github', resourceType: 'pull_request', resourceId: String(prNumber), details: { repo, riskScore: aiReview.riskScore, recommendation: aiReview.recommendation } });
    await this.notifications.create(userId, 'pr_review', 'PR Review Complete', `PR #${prNumber}: ${aiReview.recommendation} (risk ${aiReview.riskScore})`, { repo, prNumber });
    this.activity.publish(userId, 'reviewed pull request', { resourceType: 'github', resourceName: repo, metadata: { prNumber, riskScore: aiReview.riskScore } });

    return {
      id: record.id,
      repository: repo,
      prNumber,
      analysis: aiReview.analysis,
      riskScore: aiReview.riskScore,
      recommendation: aiReview.recommendation,
      findings: aiReview.findings,
      createdAt: record.createdAt.toISOString(),
    };
  }

  async listPrReviews(userId: string) {
    const reviews = await this.prReviewRepo.find({ where: { userId }, order: { createdAt: 'DESC' }, take: 20 });
    return reviews.map((r) => ({
      id: r.id,
      repository: r.repository,
      prNumber: r.prNumber,
      analysis: r.analysis,
      riskScore: Number(r.riskScore),
      recommendation: r.recommendation,
      findings: [],
      createdAt: r.createdAt.toISOString(),
    }));
  }

  async resolveMergeConflicts(userId: string, fileName: string, conflictContent: string): Promise<MergeConflictResolution> {
    const result = await this.openai.resolveMergeConflicts(conflictContent, fileName, userId);
    await this.audit.log({ userId, action: 'resolve_conflicts', module: 'github', resourceType: 'file', resourceId: fileName, details: { conflictCount: result.conflicts.length } });
    this.activity.publish(userId, 'resolved merge conflicts', { resourceType: 'github', resourceName: fileName });
    return result;
  }

  async createIssueFromValidation(
    userId: string,
    repo: string,
    issue: { message: string; line?: number; severity?: string; rule?: string },
    content: string,
    format: string,
  ): Promise<GitHubIssueResult> {
    const generated = await this.openai.generateIssueFromError(issue, content, format, userId);
    return this.createIssue(userId, repo, generated.title, generated.body, generated.labels);
  }

  async createIssue(userId: string, repo: string, title: string, body: string, labels?: string[]): Promise<GitHubIssueResult> {
    const token = await this.getToken(userId);
    const response = await fetch(`https://api.github.com/repos/${repo}/issues`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github.v3+json', 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, body, labels: labels || ['iac'] }),
    });
    if (!response.ok) throw new BadRequestException('Failed to create issue');
    const issue = await response.json() as { number: number; html_url: string; title: string };
    await this.logAction(userId, 'commit', repo, { issueNumber: issue.number, issueUrl: issue.html_url });
    await this.notifications.create(userId, 'github_issue', 'Issue Created', title, { repo, issueUrl: issue.html_url });
    return { issueNumber: issue.number, issueUrl: issue.html_url, title: issue.title };
  }

  private async getToken(userId: string): Promise<string> {
    const user = await this.userRepo.findOne({ where: { id: userId }, select: ['githubToken'] });
    if (!user?.githubToken) throw new BadRequestException('GitHub not connected. Set your GitHub token in profile settings.');
    return user.githubToken;
  }

  private async logAction(userId: string, actionType: GithubAction['actionType'], repository: string, metadata: Record<string, unknown>) {
    await this.githubActionRepo.save({
      id: uuidv4(),
      userId,
      actionType,
      repository,
      status: 'success',
      metadata,
      branch: metadata.branch as string | undefined,
      commitSha: metadata.sha as string | undefined,
      prNumber: metadata.prNumber as number | undefined,
      prUrl: metadata.prUrl as string | undefined,
    });
  }
}
