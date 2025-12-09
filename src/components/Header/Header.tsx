interface HeaderProps {
  onSelectFolder: () => void;
  onToggleTheme: () => void;
  onOpenSettings: () => void;
  isDark: boolean;
  folderPath?: string;
}

export function Header({ onSelectFolder, onToggleTheme, onOpenSettings, isDark, folderPath }: HeaderProps) {
  return (
    <header className="bg-bg-light-primary dark:bg-bg-dark-secondary border-b border-gray-200 dark:border-gray-800 px-6 py-4 flex-shrink-0">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Draft Generator
          </h1>
          {folderPath && (
            <span className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-md">
              📁 {folderPath}
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Folder Select Button */}
          <button
            onClick={onSelectFolder}
            className="flex items-center gap-2 px-4 py-2 bg-bg-light-secondary dark:bg-bg-dark-primary hover:bg-gray-200 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200 rounded-lg transition-colors"
            title="프로젝트 폴더 선택"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
              />
            </svg>
            <span className="hidden sm:inline">폴더 선택</span>
          </button>

          {/* Settings Button */}
          <button
            onClick={onOpenSettings}
            className="p-2 bg-bg-light-secondary dark:bg-bg-dark-primary hover:bg-gray-200 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200 rounded-lg transition-colors"
            title="워크플로우 설정"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>

          {/* Theme Toggle Button */}
          <button
            onClick={onToggleTheme}
            className="p-2 bg-bg-light-secondary dark:bg-bg-dark-primary hover:bg-gray-200 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200 rounded-lg transition-colors"
            title={isDark ? '라이트 모드로 전환' : '다크 모드로 전환'}
          >
            {isDark ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                />
              </svg>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
