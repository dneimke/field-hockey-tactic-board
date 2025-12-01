import React from 'react';

interface HelpAndStorageModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const HelpAndStorageModal: React.FC<HelpAndStorageModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <span className="text-3xl">📚</span> Saving & Storage Guide
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
            aria-label="Close help modal"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          
          {/* Introduction */}
          <div className="bg-blue-900/30 border border-blue-800 rounded-lg p-4 text-blue-100">
            <p className="font-medium">
              Every time you click <span className="font-bold text-white">Save Tactic</span>, the system automatically saves your work in two different ways to give you the best of both worlds.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Animation Card */}
            <div className="bg-gray-700/50 rounded-xl p-5 border border-gray-600 flex flex-col">
              <div className="flex items-center gap-3 mb-4 text-emerald-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <h3 className="text-lg font-bold">Animations (Load Animation)</h3>
              </div>
              
              <ul className="space-y-3 text-gray-300 flex-1">
                <li className="flex gap-2">
                  <span className="text-emerald-400 font-bold">•</span>
                  <span>Saves the <strong>full sequence</strong> of frames and movements.</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-emerald-400 font-bold">•</span>
                  <span>Best for showing players exactly where to run.</span>
                </li>
              </ul>

              <div className="mt-4 pt-4 border-t border-gray-600">
                <div className="flex items-center gap-2 text-amber-400 text-sm font-bold mb-1">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span>Local Storage Only</span>
                </div>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Stored on this specific device/browser. <br/>
                  <span className="text-amber-400">⚠️ Lost if cache is cleared!</span>
                </p>
              </div>
            </div>

            {/* Playbook Card */}
            <div className="bg-gray-700/50 rounded-xl p-5 border border-gray-600 flex flex-col">
              <div className="flex items-center gap-3 mb-4 text-purple-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                </svg>
                <h3 className="text-lg font-bold">Playbook (AI Memory)</h3>
              </div>
              
              <ul className="space-y-3 text-gray-300 flex-1">
                <li className="flex gap-2">
                  <span className="text-purple-400 font-bold">•</span>
                  <span>Saves a <strong>snapshot</strong> of the current positions.</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-purple-400 font-bold">•</span>
                  <span>Teaches the AI your terms (e.g. "Setup Outlet A").</span>
                </li>
              </ul>

              <div className="mt-4 pt-4 border-t border-gray-600">
                <div className="flex items-center gap-2 text-blue-400 text-sm font-bold mb-1">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
                  </svg>
                  <span>Cloud Synced</span>
                </div>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Available on any device when you log in. <br/>
                  <span className="text-blue-400">Safe & Secure.</span>
                </p>
              </div>
            </div>
          </div>

          {/* Warning / Export Tip */}
          <div className="bg-amber-900/20 border border-amber-800/50 rounded-lg p-4 flex gap-3 items-start">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div className="text-sm text-gray-300">
              <p className="font-bold text-amber-400 mb-1">Don't lose your animations!</p>
              <p>
                Because complex animations are only saved locally, we recommend using the 
                <span className="inline-flex items-center px-2 py-0.5 mx-1 bg-gray-700 rounded text-xs font-mono text-white border border-gray-600">Export</span> 
                button in the "Load Animation" menu to back them up to your computer as a file.
              </p>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-700 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg transition-colors"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};

export default HelpAndStorageModal;
