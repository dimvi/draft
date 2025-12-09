import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Workflow, WorkflowData, WorkflowState } from '../types/workflow';
import { Message } from '../types/message';
import { storageManager } from '../utils/storageManager';

interface WorkflowContextType {
  workflow: Workflow;
  workflowState: WorkflowState;
  messages: Message[];
  addUserMessage: (content: string) => void;
  goToNextStep: () => void;
  isCompleted: boolean;
  getCurrentStepPrompt: () => string;
  getWorkflowData: () => WorkflowData;
  reset: () => void;
  updateWorkflow: (workflow: Workflow) => void;
}

const WorkflowContext = createContext<WorkflowContextType | undefined>(undefined);

export function WorkflowProvider({ children }: { children: ReactNode }) {
  const [workflow, setWorkflow] = useState<Workflow>(() => storageManager.getCurrentWorkflow());
  const [workflowState, setWorkflowState] = useState<WorkflowState>({
    currentStepIndex: 0,
    data: {},
    isCompleted: false,
  });
  const [messages, setMessages] = useState<Message[]>([]);

  // Initialize with first step prompt
  useEffect(() => {
    if (messages.length === 0) {
      const firstPrompt = workflow.steps[0]?.prompt || '';
      setMessages([
        {
          id: Date.now().toString(),
          type: 'system',
          content: firstPrompt,
          timestamp: new Date(),
        },
      ]);
    }
  }, []);

  const addUserMessage = (content: string) => {
    const currentStep = workflow.steps[workflowState.currentStepIndex];

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);

    // Update workflow data
    setWorkflowState((prev) => {
      const currentData = prev.data[currentStep.id] || [];
      return {
        ...prev,
        data: {
          ...prev.data,
          [currentStep.id]: [...currentData, content],
        },
      };
    });
  };

  const goToNextStep = () => {
    const nextIndex = workflowState.currentStepIndex + 1;

    if (nextIndex >= workflow.steps.length) {
      // Workflow completed
      setWorkflowState((prev) => ({ ...prev, isCompleted: true }));

      const completionMessage: Message = {
        id: Date.now().toString(),
        type: 'system',
        content: '모든 단계가 완료되었습니다! 번역을 시작합니다...',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, completionMessage]);
    } else {
      // Move to next step
      setWorkflowState((prev) => ({ ...prev, currentStepIndex: nextIndex }));

      const nextStepMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'system',
        content: workflow.steps[nextIndex].prompt,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, nextStepMessage]);
    }
  };

  const getCurrentStepPrompt = () => {
    return workflow.steps[workflowState.currentStepIndex]?.prompt || '';
  };

  const getWorkflowData = () => {
    return workflowState.data;
  };

  const reset = () => {
    setWorkflowState({
      currentStepIndex: 0,
      data: {},
      isCompleted: false,
    });
    setMessages([
      {
        id: Date.now().toString(),
        type: 'system',
        content: workflow.steps[0]?.prompt || '',
        timestamp: new Date(),
      },
    ]);
  };

  const updateWorkflow = (newWorkflow: Workflow) => {
    setWorkflow(newWorkflow);
    storageManager.addWorkflow(newWorkflow);
    storageManager.set({ currentWorkflow: newWorkflow.name });

    // Reset workflow state when workflow changes
    reset();
  };

  return (
    <WorkflowContext.Provider
      value={{
        workflow,
        workflowState,
        messages,
        addUserMessage,
        goToNextStep,
        isCompleted: workflowState.isCompleted,
        getCurrentStepPrompt,
        getWorkflowData,
        reset,
        updateWorkflow,
      }}
    >
      {children}
    </WorkflowContext.Provider>
  );
}

export function useWorkflow() {
  const context = useContext(WorkflowContext);
  if (!context) {
    throw new Error('useWorkflow must be used within WorkflowProvider');
  }
  return context;
}
