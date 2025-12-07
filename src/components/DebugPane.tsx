import React, { useState } from 'react';
import { Message } from '../types';

interface DebugPaneProps {
  messages: Message[];
}

const DebugPane: React.FC<DebugPaneProps> = ({ messages }) => {
  const [isOpen, setIsOpen] = useState(false);

  // Filter messages that have rawResponse
  const debugMessages = messages.filter(m => m.actionResult?.rawResponse);

  if (debugMessages.length === 0) return null;

  return (
    <div className="w-full mt-4 p-2 bg-gray-900/70 backdrop-blur-sm border border-gray-700 rounded-xl">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center text-gray-300 hover:text-white px-2 py-1"
      >
        <span className="font-semibold text-sm">AI Debug Log ({debugMessages.length})</span>
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
        <div className="mt-2 space-y-4 max-h-64 overflow-y-auto px-2 custom-scrollbar">
          {debugMessages.slice().reverse().map((msg) => (
            <div key={msg.id} className="bg-gray-800 rounded p-3 text-xs font-mono border border-gray-700">
              <div className="text-gray-400 mb-1 border-b border-gray-700 pb-1 flex justify-between">
                <span>{new Date(msg.timestamp).toLocaleTimeString()}</span>
                <span className="text-indigo-400">Assistant Response</span>
              </div>
              <div className="whitespace-pre-wrap text-green-400 overflow-x-auto">
                {msg.actionResult?.rawResponse}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DebugPane;
