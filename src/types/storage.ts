import { Workflow } from './workflow';
import { DraftHistory } from './draft';

export interface StorageSchema {
  workflows: Workflow[];
  currentWorkflow: string;
  projectFolder: string;
  fileCache: {
    lastScanned: string;
    files: string[];
  };
  theme: 'light' | 'dark';
  draftHistory: DraftHistory[];
}
