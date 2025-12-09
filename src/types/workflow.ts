export interface WorkflowStep {
  id: string;
  name: string;
  prompt: string;
}

export interface Workflow {
  name: string;
  steps: WorkflowStep[];
}

export interface WorkflowData {
  [stepId: string]: string[];
}

export interface WorkflowState {
  currentStepIndex: number;
  data: WorkflowData;
  isCompleted: boolean;
}
