import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  FileFormat,
  ValidationIssue,
  ValidationResult,
  HoverExplainResult,
  SecurityAuditResult,
  OptimizationSuggestion,
  UserSettings,
  Theme,
  SupportedLanguage,
} from '@iac-platform/shared';
import { DEFAULT_USER_SETTINGS } from '@iac-platform/shared';
import { detectFormat } from '@iac-platform/shared';
import { api } from '@/lib/api';

export interface EditorTab {
  id: string;
  name: string;
  content: string;
  format: FileFormat;
  isDirty: boolean;
  fileId?: string;
}

interface EditorState {
  tabs: EditorTab[];
  activeTabId: string | null;
  validationResult: ValidationResult | null;
  fixDiff: string | null;
  hoverExplain: HoverExplainResult | null;
  isValidating: boolean;
  isFixing: boolean;
  explanation: string | null;
  securityResult: SecurityAuditResult | null;
  optimizeResult: OptimizationSuggestion[] | null;
  isOptimizing: boolean;
  isAuditing: boolean;
  error: string | null;

  addTab: (name: string, content: string) => void;
  closeTab: (id: string) => void;
  setActiveTab: (id: string) => void;
  updateTabContent: (id: string, content: string) => void;
  getActiveTab: () => EditorTab | null;

  validate: (useAi?: boolean) => Promise<void>;
  fixAll: () => Promise<void>;
  explain: (level?: string) => Promise<void>;
  hoverLine: (line: number) => Promise<void>;
  securityAudit: () => Promise<void>;
  optimize: () => Promise<void>;
}

export const useEditorStore = create<EditorState>((set, get) => ({
  tabs: [],
  activeTabId: null,
  validationResult: null,
  fixDiff: null,
  hoverExplain: null,
  isValidating: false,
  isFixing: false,
  explanation: null,
  securityResult: null,
  optimizeResult: null,
  isOptimizing: false,
  isAuditing: false,
  error: null,

  addTab: (name, content) => {
    const id = crypto.randomUUID();
    const tab: EditorTab = {
      id,
      name,
      content,
      format: detectFormat(name, content),
      isDirty: false,
    };
    set((s) => ({ tabs: [...s.tabs, tab], activeTabId: id }));
  },

  closeTab: (id) => {
    set((s) => {
      const tabs = s.tabs.filter((t) => t.id !== id);
      const activeTabId = s.activeTabId === id ? tabs[tabs.length - 1]?.id || null : s.activeTabId;
      return { tabs, activeTabId };
    });
  },

  setActiveTab: (id) => set({ activeTabId: id }),

  updateTabContent: (id, content) => {
    set((s) => ({
      tabs: s.tabs.map((t) =>
        t.id === id ? { ...t, content, isDirty: true, format: detectFormat(t.name, content) } : t,
      ),
    }));
  },

  getActiveTab: () => {
    const { tabs, activeTabId } = get();
    return tabs.find((t) => t.id === activeTabId) || null;
  },

  validate: async (useAi = false) => {
    const tab = get().getActiveTab();
    if (!tab) return;
    set({ isValidating: true });
    try {
      const result = await api.post<ValidationResult>('/validation', {
        content: tab.content,
        fileName: tab.name,
        format: tab.format,
        useAi,
      });
      set({ validationResult: result });
    } finally {
      set({ isValidating: false });
    }
  },

  fixAll: async () => {
    const tab = get().getActiveTab();
    if (!tab) return;
    set({ isFixing: true });
    try {
      const result = await api.post<{ original: string; fixed: string; diff: string }>('/validation/fix', {
        content: tab.content,
        fileName: tab.name,
        format: tab.format,
      });
      set({ fixDiff: result.diff });
      get().updateTabContent(tab.id, result.fixed);
    } finally {
      set({ isFixing: false });
    }
  },

  explain: async (level = 'detailed') => {
    const tab = get().getActiveTab();
    if (!tab) return;
    const result = await api.post<{ explanation: string }>('/ai/explain', {
      content: tab.content,
      format: tab.format,
      level,
    });
    set({ explanation: result.explanation });
  },

  hoverLine: async (line) => {
    const tab = get().getActiveTab();
    if (!tab) return;
    const result = await api.post<HoverExplainResult>('/ai/hover-explain', {
      content: tab.content,
      format: tab.format,
      line,
    });
    set({ hoverExplain: result });
    useUIStore.getState().setRightPanel('hover');
  },

  securityAudit: async () => {
    const tab = get().getActiveTab();
    if (!tab) return;
    set({ isAuditing: true, error: null });
    try {
      const result = await api.post<SecurityAuditResult>('/ai/security-audit', {
        content: tab.content,
        format: tab.format,
      });
      set({ securityResult: result });
    } catch (e) {
      set({ error: (e as Error).message });
    } finally {
      set({ isAuditing: false });
    }
  },

  optimize: async () => {
    const tab = get().getActiveTab();
    if (!tab) return;
    set({ isOptimizing: true, error: null });
    try {
      const result = await api.post<{ suggestions: OptimizationSuggestion[] }>('/ai/optimize', {
        content: tab.content,
        format: tab.format,
      });
      set({ optimizeResult: result.suggestions });
    } catch (e) {
      set({ error: (e as Error).message });
    } finally {
      set({ isOptimizing: false });
    }
  },
}));

interface AuthState {
  user: { id: string; email: string; name: string; avatarUrl?: string } | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  loadUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,

  login: async (email, password) => {
    const result = await api.post<{ accessToken: string; user: AuthState['user'] }>('/auth/login', { email, password });
    api.setToken(result.accessToken);
    set({ user: result.user, isAuthenticated: true });
  },

  register: async (email, password, name) => {
    const result = await api.post<{ accessToken: string; user: AuthState['user'] }>('/auth/register', { email, password, name });
    api.setToken(result.accessToken);
    set({ user: result.user, isAuthenticated: true });
  },

  logout: () => {
    api.setToken(null);
    set({ user: null, isAuthenticated: false });
  },

  loadUser: async () => {
    const token = api.getToken();
    if (!token) return;
    try {
      const result = await api.get<{ user: AuthState['user'] }>('/auth/me');
      set({ user: result.user, isAuthenticated: true });
      const settings = await api.get<Record<string, unknown>>('/settings');
      useSettingsStore.getState().updateSettings({
        theme: (settings.theme as Theme) || 'system',
        language: (settings.language as SupportedLanguage) || 'en',
        editorFontSize: (settings.editorFontSize as number) || 14,
        editorTheme: (settings.editorTheme as string) || 'vs-dark',
        autoSave: (settings.autoSave as boolean | undefined) ?? true,
        autoFixOnUpload: (settings.autoFixOnUpload as boolean | undefined) ?? false,
        aiModel: (settings.aiModel as string) || 'gpt-4o',
      });
    } catch {
      api.setToken(null);
      set({ user: null, isAuthenticated: false });
    }
  },
}));

interface SettingsState extends UserSettings {
  updateSettings: (settings: Partial<UserSettings>) => void;
  setLanguage: (lang: SupportedLanguage) => void;
  setTheme: (theme: Theme) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      ...DEFAULT_USER_SETTINGS,
      updateSettings: (settings) => {
        set(settings);
        if (api.getToken()) {
          api.put('/settings', settings).catch(() => {});
        }
      },
      setLanguage: (language) => {
        set({ language });
        if (api.getToken()) {
          api.put('/settings', { language }).catch(() => {});
        }
      },
      setTheme: (theme) => {
        set({ theme });
        if (api.getToken()) {
          api.put('/settings', { theme }).catch(() => {});
        }
      },
    }),
    { name: 'iac-settings' },
  ),
);

interface UIState {
  sidebarOpen: boolean;
  commandPaletteOpen: boolean;
  rightPanel: 'issues' | 'explain' | 'chat' | 'hover' | 'security' | 'optimize' | null;
  toggleSidebar: () => void;
  setCommandPaletteOpen: (open: boolean) => void;
  setRightPanel: (panel: UIState['rightPanel']) => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  commandPaletteOpen: false,
  rightPanel: 'issues',
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),
  setRightPanel: (panel) => set({ rightPanel: panel }),
}));
