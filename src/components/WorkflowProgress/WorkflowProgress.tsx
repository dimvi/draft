import { Workflow, WorkflowState } from '../../types/workflow';

interface WorkflowProgressProps {
  workflow: Workflow;
  workflowState: WorkflowState;
}

export function WorkflowProgress({ workflow, workflowState }: WorkflowProgressProps) {
  const { currentStepIndex, isCompleted } = workflowState;
  const progress = isCompleted ? 100 : ((currentStepIndex + 1) / workflow.steps.length) * 100;

  return (
    <div className="bg-bg-light-primary dark:bg-bg-dark-secondary border-b border-gray-200 dark:border-gray-800 px-6 py-2">
      <div className="flex items-center gap-4">
        {/* Progress Text */}
        <div className="text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
          {isCompleted ? '완료' : `${currentStepIndex + 1}/${workflow.steps.length}`}
          <span className="ml-2 font-medium text-gray-900 dark:text-white">
            {isCompleted ? '모든 단계 완료' : workflow.steps[currentStepIndex]?.name}
          </span>
        </div>

        {/* Progress Bar */}
        <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-imessage-blue transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Percentage */}
        <div className="text-sm font-semibold text-imessage-blue whitespace-nowrap">
          {Math.round(progress)}%
        </div>
      </div>
    </div>
  );
}
