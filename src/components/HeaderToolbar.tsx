import React, { useState, useRef, useEffect } from 'react';
import { FieldType } from '../types';
import { FIELD_CONFIGS } from '../config/fieldConfig';
import { User } from 'firebase/auth';

interface HeaderToolbarProps {
  onSaveAnimation: () => void;
  onSavePlaybook: () => void;
  onLoad: () => void;
  onReset: () => void;
  onAICommand: () => void;
  fieldType: FieldType;
  onFieldTypeChange: (fieldType: FieldType) => void;
  redTeamCount: number;
  blueTeamCount: number;
  onOpenTeamSettings: () => void;
  onOpenPlaybook: () => void;
  user: User | null;
  onOpenAuth: () => void;
  onSignOut: () => void;
  onOpenHelp: () => void;
}

const HeaderToolbar: React.FC<HeaderToolbarProps> = ({
  onSaveAnimation,
  onSavePlaybook,
  onLoad,
  onReset,
  onAICommand,
  fieldType,
  onFieldTypeChange,
  redTeamCount,
  blueTeamCount,
  onOpenTeamSettings,
  onOpenPlaybook,
  user,
  onOpenAuth,
  onSignOut,
  onOpenHelp,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleAction = (action: () => void) => {
    action();
    setIsMenuOpen(false);
    setIsUserMenuOpen(false);
  };

  return (
    <header className="h-14 bg-gray-900 border-b border-gray-800 flex items-center justify-between px-4 sticky top-0 z-40 w-full shadow-md">
      {/* Left Section: Brand & Team Stats */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1">
          <span className="font-bold text-xl text-white tracking-tight">Tactic</span>
          <span className="font-bold text-xl text-emerald-400 tracking-tight">Board</span>
        </div>

        <div className="h-5 w-px bg-gray-700 mx-2 hidden md:block"></div>

        {/* Live Counters */}
        <button
          onClick={onOpenTeamSettings}
          className="flex items-center gap-3 text-sm font-medium text-gray-300 hover:text-white transition-colors group"
          title="Manage Teams"
        >
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-600"></span>
              <span>Red</span>
              <span className="bg-gray-800 text-gray-300 px-1.5 py-0.5 rounded text-xs border border-gray-700">{redTeamCount}</span>
            </div>
            <span className="text-gray-600 text-xs">vs</span>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
              <span>Blue</span>
              <span className="bg-gray-800 text-gray-300 px-1.5 py-0.5 rounded text-xs border border-gray-700">{blueTeamCount}</span>
            </div>
          </div>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-gray-500 group-hover:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {/* Center Section: Mode Description - Removed */}

      {/* Right Section: Controls & Actions */}
      <div className="flex items-center gap-4">
        {/* AI Trigger */}
        <button
          onClick={onAICommand}
          className="flex items-center gap-2 px-4 py-1.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-md text-sm font-medium shadow-lg shadow-indigo-900/20 transition-all hover:scale-105"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          <span className="hidden md:inline">AI Copilot</span>
        </button>

        {/* Mode Switch - Removed (Auto-inferred) */}

        {/* Settings Menu (only shown when not authenticated) */}
        {!user && (
          <div ref={menuRef} className="relative">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded-md transition-colors"
              title="Settings"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>

            {isMenuOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-gray-800 rounded-lg shadow-xl py-2 border border-gray-700">
                {/* Animations Group */}
                <div className="px-4 py-2 border-b border-gray-700 bg-gray-800/50">
                  <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Animations
                  </span>
                </div>
                <button
                  onClick={() => handleAction(onLoad)}
                  className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors flex items-center gap-3 pl-6"
                >
                  Load Animation
                </button>
                <button
                  onClick={() => handleAction(onSaveAnimation)}
                  className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors flex items-center gap-3 pl-6"
                >
                  Save Animation
                </button>

                {/* Playbook Group */}
                <div className="px-4 py-2 border-y border-gray-700 bg-gray-800/50 mt-1">
                  <span className="text-xs font-semibold text-purple-400 uppercase tracking-wider flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                    Playbook
                  </span>
                </div>
                <button
                  onClick={() => handleAction(onOpenPlaybook)}
                  className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors flex items-center gap-3 pl-6"
                >
                  Open Playbook
                </button>
                <button
                  onClick={() => handleAction(onSavePlaybook)}
                  className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors flex items-center gap-3 pl-6"
                >
                  Save to Playbook
                </button>

                <div className="my-1 border-t border-gray-700"></div>
                <button
                  onClick={() => handleAction(onOpenHelp)}
                  className="w-full text-left px-4 py-2 text-sm text-emerald-400 hover:bg-gray-700 transition-colors flex items-center gap-3"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Saving & Storage Help
                </button>

                <div className="my-1 border-t border-gray-700"></div>
                <div className="px-4 py-2">
                  <label className="text-xs text-gray-400 mb-1.5 block">Field Configuration</label>
                  <select
                    value={fieldType}
                    onChange={(e) => onFieldTypeChange(e.target.value as FieldType)}
                    className="w-full bg-gray-900 text-white text-sm rounded-md px-2 py-1.5 border border-gray-600 focus:ring-1 focus:ring-indigo-500 outline-none"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {Object.values(FIELD_CONFIGS).map((config) => (
                      <option key={config.type} value={config.type}>
                        {config.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="my-1 border-t border-gray-700"></div>
                <button
                  onClick={() => handleAction(onReset)}
                  className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-900/30 hover:text-red-300 transition-colors flex items-center gap-3"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Reset Board
                </button>
              </div>
            )}
          </div>
        )}

        {/* Auth / User Menu */}
        <div className="h-5 w-px bg-gray-700 hidden md:block"></div>
        
        {user ? (
          <div ref={userMenuRef} className="relative">
            <button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-300 hover:text-white hover:bg-gray-800 rounded-md transition-colors"
              title="User Menu"
            >
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white font-semibold text-xs">
                  {user.email?.charAt(0).toUpperCase() || 'U'}
                </div>
                <span className="hidden lg:inline text-gray-400 text-xs max-w-[120px] truncate">
                  {user.email}
                </span>
              </div>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {isUserMenuOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-gray-800 rounded-lg shadow-xl py-2 border border-gray-700 max-h-[80vh] overflow-y-auto">
                {/* User Info Header */}
                <div className="px-4 py-3 border-b border-gray-700">
                  <p className="text-sm font-medium text-white truncate">{user.email}</p>
                  <p className="text-xs text-gray-400 mt-0.5">Signed in</p>
                </div>

                {/* Help Section */}
                <button
                  onClick={() => handleAction(onOpenHelp)}
                  className="w-full text-left px-4 py-2 text-sm text-emerald-400 hover:bg-gray-700 transition-colors flex items-center gap-3"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Saving & Storage Help
                </button>

                {/* Animations Group */}
                <div className="px-4 py-2 border-y border-gray-700 bg-gray-800/50">
                  <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Animations
                  </span>
                </div>
                <button
                  onClick={() => handleAction(onLoad)}
                  className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors flex items-center gap-3 pl-6"
                >
                  Load Animation
                </button>
                <button
                  onClick={() => handleAction(onSaveAnimation)}
                  className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors flex items-center gap-3 pl-6"
                >
                  Save Animation
                </button>

                {/* Playbook Group */}
                <div className="px-4 py-2 border-y border-gray-700 bg-gray-800/50 mt-1">
                  <span className="text-xs font-semibold text-purple-400 uppercase tracking-wider flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                    Playbook
                  </span>
                </div>
                <button
                  onClick={() => handleAction(onOpenPlaybook)}
                  className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors flex items-center gap-3 pl-6"
                >
                  Open Playbook
                </button>
                <button
                  onClick={() => handleAction(onSavePlaybook)}
                  className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors flex items-center gap-3 pl-6"
                >
                  Save to Playbook
                </button>

                {/* Settings */}
                <div className="my-1 border-t border-gray-700"></div>
                <div className="px-4 py-2 border-b border-gray-700">
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Settings</span>
                </div>
                <button
                  onClick={() => handleAction(onOpenTeamSettings)}
                  className="w-full text-left px-4 py-2 text-sm text-white hover:bg-gray-700 transition-colors flex items-center gap-3"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                  Team Settings
                </button>
                <div className="px-4 py-2">
                  <label className="text-xs text-gray-400 mb-1.5 block">Field Configuration</label>
                  <select
                    value={fieldType}
                    onChange={(e) => {
                      onFieldTypeChange(e.target.value as FieldType);
                      e.stopPropagation();
                    }}
                    className="w-full bg-gray-900 text-white text-sm rounded-md px-2 py-1.5 border border-gray-600 focus:ring-1 focus:ring-indigo-500 outline-none"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {Object.values(FIELD_CONFIGS).map((config) => (
                      <option key={config.type} value={config.type}>
                        {config.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Actions */}
                <div className="my-1 border-t border-gray-700"></div>
                <button
                  onClick={() => handleAction(onReset)}
                  className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-900/30 hover:text-red-300 transition-colors flex items-center gap-3"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Reset Board
                </button>

                {/* Sign Out */}
                <div className="my-1 border-t border-gray-700"></div>
                <button
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    onSignOut();
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-900/30 hover:text-red-300 transition-colors flex items-center gap-3"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Sign Out
                </button>
              </div>
            )}
          </div>
        ) : (
          <button
            onClick={onOpenAuth}
            className="px-4 py-1.5 bg-gray-800 hover:bg-gray-700 text-white rounded-md text-sm font-medium transition-colors border border-gray-700"
            title="Sign In"
          >
            Sign In
          </button>
        )}
      </div>
    </header>
  );
};

export default HeaderToolbar;
