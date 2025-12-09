import { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { ChatInterface } from './components/ChatInterface';
import { InputField } from './components/InputField';
import { WorkflowSettings } from './components/WorkflowSettings';
import { WorkflowProgress } from './components/WorkflowProgress';
import { useTheme } from './contexts/ThemeContext';
import { useWorkflow } from './contexts/WorkflowContext';
import { useFileSystem } from './contexts/FileSystemContext';
import { generateDraftYAML, downloadDraftFile } from './utils/yamlGenerator';
import { translateWorkflowData } from './utils/translator';

function App() {
  const { isDark, toggleTheme } = useTheme();
  const { workflow, workflowState, messages, addUserMessage, goToNextStep, isCompleted, getCurrentStepPrompt, getWorkflowData, reset, updateWorkflow } = useWorkflow();
  const { folderPath, files, selectFolder } = useFileSystem();
  const [yamlContent, setYamlContent] = useState<string>('');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);

  useEffect(() => {
    if (isCompleted && !isTranslating) {
      // Translate and generate YAML when workflow is completed
      const translateAndGenerate = async () => {
        setIsTranslating(true);
        try {
          const data = getWorkflowData();
          // Translate data
          const translatedData = await translateWorkflowData(data);
          // Generate YAML from translated data
          const yaml = generateDraftYAML(translatedData);
          setYamlContent(yaml);
        } catch (error) {
          console.error('Translation or YAML generation failed:', error);
          // Fallback to non-translated version
          const data = getWorkflowData();
          const yaml = generateDraftYAML(data);
          setYamlContent(yaml);
        } finally {
          setIsTranslating(false);
        }
      };

      translateAndGenerate();
    }
  }, [isCompleted, getWorkflowData]);

  const handleSubmit = (value: string) => {
    addUserMessage(value);
  };

  const handleEmpty = () => {
    goToNextStep();
  };

  const handleDownload = () => {
    if (yamlContent) {
      downloadDraftFile(yamlContent);
    }
  };

  const handleReset = () => {
    setYamlContent('');
    reset();
  };

  return (
    <div className="h-screen flex flex-col bg-bg-light-secondary dark:bg-bg-dark-secondary">
      <Header
        onSelectFolder={selectFolder}
        onToggleTheme={toggleTheme}
        onOpenSettings={() => setIsSettingsOpen(true)}
        isDark={isDark}
        folderPath={folderPath}
      />

      <WorkflowSettings
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        workflow={workflow}
        onSave={updateWorkflow}
      />

      {!isCompleted && (
        <WorkflowProgress workflow={workflow} workflowState={workflowState} />
      )}

      <main className="flex-1 flex flex-col overflow-hidden">
        {!isCompleted ? (
          <ChatInterface messages={messages}>
            <InputField
              placeholder={getCurrentStepPrompt()}
              files={files}
              onSubmit={handleSubmit}
              onEmpty={handleEmpty}
            />
          </ChatInterface>
        ) : (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="max-w-2xl w-full space-y-6">
              <div className="text-center space-y-4">
                <div className="text-6xl">🎉</div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  워크플로우가 완료되었습니다!
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  {isTranslating ? '번역 중입니다...' : '번역된 YAML 파일이 생성되었습니다. 다운로드할 수 있습니다.'}
                </p>
              </div>

              {/* YAML Preview */}
              <div className="bg-gray-800 rounded-lg p-4 overflow-auto max-h-96">
                {isTranslating ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="flex flex-col items-center gap-4">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-imessage-blue"></div>
                      <p className="text-gray-400 text-sm">번역 모델 로딩 및 번역 중...</p>
                    </div>
                  </div>
                ) : (
                  <pre className="text-green-400 text-sm font-mono">
                    {yamlContent}
                  </pre>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 justify-center">
                <button
                  onClick={handleDownload}
                  disabled={isTranslating}
                  className="px-6 py-3 bg-imessage-blue text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  다운로드
                </button>
                <button
                  onClick={handleReset}
                  className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  새로 시작하기
                </button>
              </div>

              <p className="text-center text-sm text-gray-500 dark:text-gray-400">
                💡 HuggingFace nllb-200-distilled-600M 모델을 사용하여 한영 번역되었습니다
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
