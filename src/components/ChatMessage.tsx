import React from 'react';
import { Message } from '../types';

interface ChatMessageProps {
  message: Message;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isUser = message.role === 'user';
  
  const getActionLabel = () => {
    if (!message.actionResult) return null;
    
    switch (message.actionResult.action) {
      case 'multiple': return '✅ Moved Pieces';
      case 'set_piece': return '🎯 Set Piece';
      case 'drill': return '🏋️ Drill Setup';
      case 'training_session': return '📋 Training Session';
      case 'tactical_phase': return '🛡️ Tactical Phase';
      case 'reset': return '🔄 Reset Board';
      default: return '✅ Action Executed';
    }
  };

  const actionLabel = getActionLabel();
  
  return (
    <div className={`flex w-full mb-4 ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[85%] rounded-lg px-4 py-3 text-sm shadow-sm ${
          isUser
            ? 'bg-indigo-600 text-white rounded-tr-none'
            : 'bg-gray-700 text-gray-200 rounded-tl-none border border-gray-600'
        }`}
      >
        <div className="whitespace-pre-wrap leading-relaxed">{message.content}</div>
        {actionLabel && (
           <div className="mt-2 text-xs opacity-75 border-t border-white/20 pt-2 flex items-center gap-1 font-medium text-emerald-300">
             {actionLabel}
           </div>
        )}
      </div>
    </div>
  );
};

export default ChatMessage;
