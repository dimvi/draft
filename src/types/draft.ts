export interface DraftContent {
  goal?: string;
  context?: string[];
  steps?: string[];
  constraints?: string[];
  [key: string]: string | string[] | undefined;
}

export interface DraftHistory {
  id: string;
  timestamp: string;
  name: string;
  content: string;
  originalContent: DraftContent;
}
