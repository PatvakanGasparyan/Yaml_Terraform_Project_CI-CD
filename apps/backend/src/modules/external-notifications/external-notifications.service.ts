import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

export interface ExternalNotificationPayload {
  title: string;
  message: string;
  userId?: string;
}

@Injectable()
export class ExternalNotificationsService {
  private readonly logger = new Logger(ExternalNotificationsService.name);
  private mailTransporter: nodemailer.Transporter | null = null;

  constructor(private readonly config: ConfigService) {
    const host = this.config.get('SMTP_HOST');
    if (host) {
      this.mailTransporter = nodemailer.createTransport({
        host,
        port: this.config.get<number>('SMTP_PORT', 587),
        secure: this.config.get('SMTP_SECURE') === 'true',
        auth: {
          user: this.config.get('SMTP_USER'),
          pass: this.config.get('SMTP_PASSWORD'),
        },
      });
    }
  }

  async sendAll(payload: ExternalNotificationPayload, channels?: { email?: string; slack?: boolean; telegram?: boolean }) {
    const results: Record<string, boolean> = {};
    if (channels?.email) {
      results.email = await this.sendEmail(channels.email, payload.title, payload.message);
    }
    if (channels?.slack !== false && this.config.get('SLACK_WEBHOOK_URL')) {
      results.slack = await this.sendSlack(payload.title, payload.message);
    }
    if (channels?.telegram !== false && this.config.get('TELEGRAM_BOT_TOKEN') && this.config.get('TELEGRAM_CHAT_ID')) {
      results.telegram = await this.sendTelegram(payload.title, payload.message);
    }
    return results;
  }

  async sendEmail(to: string, subject: string, body: string): Promise<boolean> {
    if (!this.mailTransporter) {
      this.logger.warn('SMTP not configured');
      return false;
    }
    try {
      await this.mailTransporter.sendMail({
        from: this.config.get('SMTP_FROM', 'iac-platform@localhost'),
        to,
        subject,
        text: body,
        html: `<p>${body.replace(/\n/g, '<br>')}</p>`,
      });
      return true;
    } catch (e) {
      this.logger.error(`Email failed: ${(e as Error).message}`);
      return false;
    }
  }

  async sendSlack(title: string, message: string): Promise<boolean> {
    const webhook = this.config.get('SLACK_WEBHOOK_URL');
    if (!webhook) return false;
    try {
      const res = await fetch(webhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: `*${title}*\n${message}` }),
      });
      return res.ok;
    } catch (e) {
      this.logger.error(`Slack failed: ${(e as Error).message}`);
      return false;
    }
  }

  async sendTelegram(title: string, message: string): Promise<boolean> {
    const token = this.config.get('TELEGRAM_BOT_TOKEN');
    const chatId = this.config.get('TELEGRAM_CHAT_ID');
    if (!token || !chatId) return false;
    try {
      const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text: `*${title}*\n${message}`, parse_mode: 'Markdown' }),
      });
      return res.ok;
    } catch (e) {
      this.logger.error(`Telegram failed: ${(e as Error).message}`);
      return false;
    }
  }

  getConfiguredChannels() {
    return {
      email: !!this.mailTransporter,
      slack: !!this.config.get('SLACK_WEBHOOK_URL'),
      telegram: !!(this.config.get('TELEGRAM_BOT_TOKEN') && this.config.get('TELEGRAM_CHAT_ID')),
    };
  }
}
