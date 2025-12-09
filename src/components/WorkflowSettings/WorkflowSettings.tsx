import { useState, useEffect } from 'react';
import { Workflow, WorkflowStep } from '../../types/workflow';

interface WorkflowSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  workflow: Workflow;
  onSave: (workflow: Workflow) => void;
}

export function WorkflowSettings({ isOpen, onClose, workflow, onSave }: WorkflowSettingsProps) {
  const [editedWorkflow, setEditedWorkflow] = useState<Workflow>(workflow);

  const handleSave = () => {
    onSave(editedWorkflow);
    onClose();
  };

  const handleAddStep = () => {
    const newStep: WorkflowStep = {
      id: `step_${Date.now()}`,
      name: '새 단계',
      prompt: '내용을 입력해주세요',
    };
    setEditedWorkflow({
      ...editedWorkflow,
      steps: [...editedWorkflow.steps, newStep],
    });
  };

  const handleRemoveStep = (index: number) => {
    const newSteps = editedWorkflow.steps.filter((_, i) => i !== index);
    setEditedWorkflow({
      ...editedWorkflow,
      steps: newSteps,
    });
  };

  const handleUpdateStep = (index: number, field: keyof WorkflowStep, value: string) => {
    const newSteps = [...editedWorkflow.steps];
    newSteps[index] = { ...newSteps[index], [field]: value };

    // Auto-generate prompt based on id and name
    if (field === 'id' || field === 'name') {
      const step = newSteps[index];
      newSteps[index].prompt = `${step.name}${step.name && step.id ? '(' : ''}${step.id}${step.name && step.id ? ')' : ''}을 입력해주세요`;
    }

    setEditedWorkflow((prev) => ({
      ...prev,
      steps: newSteps,
    }));
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  useEffect(() => {
    setEditedWorkflow(workflow);
  }, [workflow, isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
        // Cmd+Enter or Ctrl+Enter to save
        handleSave();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, handleSave]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-bg-light-primary dark:bg-bg-dark-secondary rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            워크플로우 설정
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-bg-light-secondary dark:hover:bg-bg-dark-primary rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {editedWorkflow.steps.map((step, index) => (
            <div
              key={index}
              className="p-4 bg-bg-light-secondary dark:bg-bg-dark-primary rounded-lg space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-500 dark:text-gray-400">
                  단계 {index + 1}
                </span>
                <button
                  onClick={() => handleRemoveStep(index)}
                  className="text-red-500 hover:text-red-700 dark:hover:text-red-400 p-1"
                  disabled={editedWorkflow.steps.length === 1}
                  title={editedWorkflow.steps.length === 1 ? '최소 1개의 단계가 필요합니다' : '단계 삭제'}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  ID
                </label>
                <input
                  type="text"
                  value={step.id}
                  onChange={(e) => handleUpdateStep(index, 'id', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-bg-light-primary dark:bg-bg-dark-secondary text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-imessage-blue"
                  placeholder="goal, context, steps..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  이름
                </label>
                <input
                  type="text"
                  value={step.name}
                  onChange={(e) => handleUpdateStep(index, 'name', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-bg-light-primary dark:bg-bg-dark-secondary text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-imessage-blue"
                  placeholder="목표, 컨텍스트, 단계..."
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  안내 메시지: "{step.prompt}"
                </p>
              </div>
            </div>
          ))}

          <button
            onClick={handleAddStep}
            className="w-full py-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-400 hover:border-imessage-blue hover:text-imessage-blue transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            단계 추가
          </button>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors"
          >
            취소
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-imessage-blue hover:bg-blue-600 text-white rounded-lg transition-colors"
          >
            저장
          </button>
        </div>
      </div>
    </div>
  );
}
