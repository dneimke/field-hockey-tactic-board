import React, { useState } from 'react';
import { Message } from '../types';

interface DebugPaneProps {
  messages: Message[];
}

const DebugPane: React.FC<DebugPaneProps> = ({ messages }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Filter messages that have rawResponse
  const debugMessages = messages.filter(m => m.actionResult?.rawResponse);
  const lastMessage = debugMessages.length > 0 ? debugMessages[debugMessages.length - 1] : null;

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  if (!lastMessage) return null;

  return (
    <div className="w-full mt-4 p-2 bg-gray-900/70 backdrop-blur-sm border border-gray-700 rounded-xl">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center text-gray-300 hover:text-white px-2 py-1"
      >
        <span className="font-semibold text-sm">Latest AI Debug Log</span>
        <svg 
          className={`w-4 h-4 transform transition-transform ${isOpen ? 'rotate-180' : ''}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      
      {isOpen && (
        <div className="mt-2 max-h-64 overflow-y-auto px-2 custom-scrollbar">
          <div key={lastMessage.id} className="bg-gray-800 rounded p-3 text-xs font-mono border border-gray-700">
            <div className="text-gray-400 mb-1 border-b border-gray-700 pb-1 flex justify-between items-center">
              <span>{new Date(lastMessage.timestamp).toLocaleTimeString()}</span>
              <div className="flex items-center gap-2">
                <span className="text-indigo-400">Assistant Response</span>
                <button
                  onClick={() => lastMessage.actionResult?.rawResponse && handleCopy(lastMessage.actionResult.rawResponse, lastMessage.id)}
                  className="p-1 hover:bg-gray-700 rounded transition-colors text-gray-400 hover:text-white"
                  title="Copy raw response"
                >
                  {copiedId === lastMessage.id ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
            <div className="whitespace-pre-wrap text-green-400 overflow-x-auto">
              {lastMessage.actionResult?.rawResponse}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DebugPane;
