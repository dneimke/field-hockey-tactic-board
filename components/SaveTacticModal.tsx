// Fix: Implement the SaveTacticModal component to provide a user interface for saving tactics.
import React, { useState, useEffect } from 'react';

interface SaveTacticModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string) => void;
  title: string;
  confirmButtonText: string;
  placeholderText: string;
  initialValue?: string;
}

const SaveTacticModal: React.FC<SaveTacticModalProps> = ({ 
    isOpen, 
    onClose, 
    onSave, 
    title, 
    confirmButtonText, 
    placeholderText,
    initialValue = ''
}) => {
  const [tacticName, setTacticName] = useState(initialValue);

  useEffect(() => {
    // Reset name when modal opens or initial value changes
    if (isOpen) {
      setTacticName(initialValue);
    }
  }, [isOpen, initialValue]);

  if (!isOpen) {
    return null;
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (tacticName.trim()) {
      onSave(tacticName.trim());
    } else {
      alert('Please enter a name for the tactic.');
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div 
        className="bg-gray-800 p-8 rounded-lg shadow-xl w-full max-w-md"
        onClick={e => e.stopPropagation()}
      >
        <h2 className="text-2xl font-bold mb-6 text-white">{title}</h2>
        <form onSubmit={handleSave}>
          <label htmlFor="tacticName" className="block text-sm font-medium text-gray-300 mb-2">
            Tactic Name
          </label>
          <input
            id="tacticName"
            type="text"
            value={tacticName}
            onChange={(e) => setTacticName(e.target.value)}
            className="w-full bg-gray-700 text-white rounded-md p-2 border border-gray-600 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
            placeholder={placeholderText}
            autoFocus
          />
          <div className="mt-6 flex justify-end gap-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded-md font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-md font-semibold transition-colors"
            >
              {confirmButtonText}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SaveTacticModal;