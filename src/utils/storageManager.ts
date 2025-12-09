import { StorageSchema } from '../types/storage';
import { Workflow, WorkflowStep } from '../types/workflow';

const STORAGE_KEY = 'draft-generator-storage';

const DEFAULT_WORKFLOW: Workflow = {
  name: 'default',
  steps: [
    {
      id: 'goal',
      name: '목표',
      prompt: '목표를 입력해주세요',
    },
    {
      id: 'context',
      name: '컨텍스트',
      prompt: '컨텍스트를 입력해주세요',
    },
    {
      id: 'steps',
      name: '단계',
      prompt: '단계를 입력해주세요',
    },
    {
      id: 'constraints',
      name: '제약사항',
      prompt: '제약사항을 입력해주세요',
    },
  ],
};

const DEFAULT_STORAGE: StorageSchema = {
  workflows: [DEFAULT_WORKFLOW],
  currentWorkflow: 'default',
  projectFolder: '',
  fileCache: {
    lastScanned: new Date().toISOString(),
    files: [],
  },
  theme: 'light',
  draftHistory: [],
};

export const storageManager = {
  get(): StorageSchema {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) {
        return DEFAULT_STORAGE;
      }
      return { ...DEFAULT_STORAGE, ...JSON.parse(stored) };
    } catch {
      return DEFAULT_STORAGE;
    }
  },

  set(data: Partial<StorageSchema>): void {
    try {
      const current = this.get();
      const updated = { ...current, ...data };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
    }
  },

  getWorkflow(name: string): Workflow | undefined {
    const storage = this.get();
    return storage.workflows.find((w) => w.name === name);
  },

  getCurrentWorkflow(): Workflow {
    const storage = this.get();
    const workflow = this.getWorkflow(storage.currentWorkflow);
    return workflow || DEFAULT_WORKFLOW;
  },

  addWorkflow(workflow: Workflow): void {
    const storage = this.get();
    const exists = storage.workflows.some((w) => w.name === workflow.name);
    if (!exists) {
      this.set({
        workflows: [...storage.workflows, workflow],
      });
    }
  },

  removeWorkflow(name: string): void {
    const storage = this.get();
    if (name !== 'default') {
      this.set({
        workflows: storage.workflows.filter((w) => w.name !== name),
      });
    }
  },

  setTheme(theme: 'light' | 'dark'): void {
    this.set({ theme });
  },

  getTheme(): 'light' | 'dark' {
    return this.get().theme;
  },

  setProjectFolder(path: string): void {
    this.set({ projectFolder: path });
  },

  getProjectFolder(): string {
    return this.get().projectFolder;
  },

  setFileCache(files: string[]): void {
    this.set({
      fileCache: {
        lastScanned: new Date().toISOString(),
        files,
      },
    });
  },

  getFileCache(): string[] {
    return this.get().fileCache.files;
  },

  addDraftHistory(name: string, content: string, originalContent: any): void {
    const storage = this.get();
    const newHistory = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      name,
      content,
      originalContent,
    };
    this.set({
      draftHistory: [newHistory, ...storage.draftHistory],
    });
  },

  getDraftHistory() {
    return this.get().draftHistory;
  },

  clearDraftHistory(): void {
    this.set({ draftHistory: [] });
  },

  reset(): void {
    localStorage.removeItem(STORAGE_KEY);
  },
};
