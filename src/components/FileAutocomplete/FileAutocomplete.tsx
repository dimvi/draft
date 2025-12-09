import { useState, useEffect, useRef } from 'react';

interface FileAutocompleteProps {
  files: string[];
  query: string;
  position: { top: number; left: number };
  onSelect: (file: string) => void;
  onClose: () => void;
}

export function FileAutocomplete({
  files,
  query,
  position,
  onSelect,
  onClose,
}: FileAutocompleteProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);

  // Filter files based on query
  const filteredFiles = files.filter((file) =>
    file.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < filteredFiles.length - 1 ? prev + 1 : prev
        );
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredFiles[selectedIndex]) {
          onSelect(filteredFiles[selectedIndex]);
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [filteredFiles, selectedIndex, onSelect, onClose]);

  if (filteredFiles.length === 0) {
    return null;
  }

  // Highlight matching text
  const highlightText = (text: string, query: string) => {
    if (!query) return text;

    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return (
      <>
        {parts.map((part, index) =>
          part.toLowerCase() === query.toLowerCase() ? (
            <mark key={index} className="bg-yellow-200 dark:bg-yellow-600 text-gray-900 dark:text-white">
              {part}
            </mark>
          ) : (
            part
          )
        )}
      </>
    );
  };

  return (
    <div
      ref={listRef}
      className="fixed bg-bg-light-primary dark:bg-bg-dark-secondary border border-gray-300 dark:border-gray-700 rounded-lg shadow-lg max-h-64 overflow-y-auto z-50"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
        minWidth: '300px',
        maxWidth: '500px',
      }}
    >
      {filteredFiles.map((file, index) => (
        <div
          key={file}
          className={`px-4 py-2 cursor-pointer transition-colors ${
            index === selectedIndex
              ? 'bg-imessage-blue text-white'
              : 'hover:bg-bg-light-secondary dark:hover:bg-bg-dark-primary'
          }`}
          onClick={() => onSelect(file)}
          onMouseEnter={() => setSelectedIndex(index)}
        >
          <div className="flex items-center gap-2">
            <svg
              className="w-4 h-4 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
              />
            </svg>
            <span className="text-sm truncate">
              {highlightText(file, query)}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
