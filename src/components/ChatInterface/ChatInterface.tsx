import { useEffect, useRef } from 'react';
import { Message } from '../../types/message';
import { MessageBubble } from '../MessageBubble';

interface ChatInterfaceProps {
  messages: Message[];
  children?: React.ReactNode;
}

export function ChatInterface({ messages, children }: ChatInterfaceProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <div className="flex flex-col h-full">
      {/* Messages Container - Always fill screen, messages stick to bottom */}
      <div className="flex-1 overflow-y-auto px-4 py-6 flex flex-col justify-end">
        {messages.length === 0 ? (
          <div className="flex items-end justify-center pb-4 text-gray-400 dark:text-gray-600">
            <p className="text-center">
              대화를 시작하려면 아래에서 입력해주세요.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Area */}
      {children && (
        <div className="border-t border-gray-200 dark:border-gray-800 bg-bg-light-primary dark:bg-bg-dark-secondary flex-shrink-0">
          {children}
        </div>
      )}
    </div>
  );
}
