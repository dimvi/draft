import { Message } from '../../types/message';

interface MessageBubbleProps {
  message: Message;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.type === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4 animate-fade-in`}>
      <div
        className={`${
          isUser
            ? 'message-bubble-user'
            : 'message-bubble-system'
        } shadow-sm`}
      >
        <p className="whitespace-pre-wrap">{message.content}</p>
        <span className={`text-xs ${isUser ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'} mt-1 block`}>
          {new Date(message.timestamp).toLocaleTimeString('ko-KR', {
            hour: '2-digit',
            minute: '2-digit'
          })}
        </span>
      </div>
    </div>
  );
}
