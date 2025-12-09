import { useState, useRef, KeyboardEvent, ChangeEvent } from 'react';
import { FileAutocomplete } from '../FileAutocomplete';

interface InputFieldProps {
  placeholder: string;
  files: string[];
  onSubmit: (value: string) => void;
  onEmpty: () => void;
}

export function InputField({ placeholder, files, onSubmit, onEmpty }: InputFieldProps) {
  const [value, setValue] = useState('');
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [autocompleteQuery, setAutocompleteQuery] = useState('');
  const [autocompletePosition, setAutocompletePosition] = useState({ top: 0, left: 0 });
  const [atSymbolIndex, setAtSymbolIndex] = useState(-1);
  const [isComposing, setIsComposing] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setValue(newValue);

    // Check for @ symbol
    const cursorPosition = e.target.selectionStart;
    const textBeforeCursor = newValue.slice(0, cursorPosition);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');

    if (lastAtIndex !== -1) {
      // Check if @ is at the start or preceded by whitespace
      const charBeforeAt = textBeforeCursor[lastAtIndex - 1];
      if (!charBeforeAt || /\s/.test(charBeforeAt)) {
        const query = textBeforeCursor.slice(lastAtIndex + 1);

        // Only show autocomplete if there's no space after @
        if (!query.includes(' ')) {
          setAtSymbolIndex(lastAtIndex);
          setAutocompleteQuery(query);
          setShowAutocomplete(true);

          // Calculate autocomplete position
          if (textareaRef.current) {
            const rect = textareaRef.current.getBoundingClientRect();
            setAutocompletePosition({
              top: rect.top - 270, // Show above input
              left: rect.left,
            });
          }
          return;
        }
      }
    }

    setShowAutocomplete(false);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // If autocomplete is open, don't handle Enter, ArrowUp, ArrowDown, or Escape
    if (showAutocomplete && (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter' || e.key === 'Escape')) {
      return;
    }

    // Ignore Enter key during IME composition (Korean, Japanese, Chinese input)
    if (e.key === 'Enter' && !e.shiftKey && !isComposing) {
      // Enter without shift: Submit message (Ctrl/Cmd+Enter also works)
      e.preventDefault();
      if (value.trim()) {
        onSubmit(value.trim());
        setValue('');
      } else {
        onEmpty();
      }
    }
    // Shift+Enter: New line (default behavior)
  };

  const handleFileSelect = (file: string) => {
    const newValue =
      value.slice(0, atSymbolIndex) +
      `@${file}` +
      value.slice(atSymbolIndex + autocompleteQuery.length + 1);

    setValue(newValue);
    setShowAutocomplete(false);
    textareaRef.current?.focus();
  };

  return (
    <div className="relative p-4">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onCompositionStart={() => setIsComposing(true)}
        onCompositionEnd={() => setIsComposing(false)}
        placeholder={placeholder}
        className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-bg-light-primary dark:bg-bg-dark-primary text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-imessage-blue resize-none"
        rows={3}
      />

      {showAutocomplete && (
        <FileAutocomplete
          files={files}
          query={autocompleteQuery}
          position={autocompletePosition}
          onSelect={handleFileSelect}
          onClose={() => setShowAutocomplete(false)}
        />
      )}

      <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 flex justify-between">
        <span>Enter: 전송 | Shift+Enter: 줄바꿈 | Ctrl+Enter: 다음 단계</span>
        <span>빈 칸 입력 시 다음 단계로 이동</span>
      </div>
    </div>
  );
}
