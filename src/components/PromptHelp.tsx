import React from 'react';

interface PromptHelpProps {
    isVisible: boolean;
    onSelectExample: (example: string) => void;
    onClose: () => void;
}

const PromptHelp: React.FC<PromptHelpProps> = ({ isVisible, onSelectExample, onClose }) => {
    if (!isVisible) return null;

    const categories = [
        {
            title: 'Training Drills',
            examples: [
                'Setup 2 small sided games (5v5) red vs blue',
                'Create a passing drill in a grid with 4 players',
                'Split into 3 groups of 4, each with a ball',
            ],
        },
        {
            title: 'Game Tactics',
            examples: [
                'Set Red team to 4-4-2 pressing high',
                'Blue team defending a penalty corner',
                'Reset for game start',
            ],
        },
        {
            title: 'Shapes & Formations',
            examples: [
                'Form a circle with all red players in the center',
                'Line up blue defenders on the 23m line',
                'Make a grid of 6 players in the attacking circle',
            ],
        },
    ];

    return (
        <div className="absolute bottom-full left-0 mb-2 w-full bg-gray-800 border border-gray-700 rounded-lg shadow-xl overflow-hidden z-50">
            <div className="p-3 border-b border-gray-700 flex justify-between items-center bg-gray-900">
                <h3 className="text-sm font-bold text-gray-200">Example Commands</h3>
                <button onClick={onClose} className="text-gray-400 hover:text-white">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                </button>
            </div>
            <div className="p-4 max-h-64 overflow-y-auto">
                <div className="space-y-4">
                    {categories.map((category, idx) => (
                        <div key={idx}>
                            <h4 className="text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-2">
                                {category.title}
                            </h4>
                            <ul className="space-y-1">
                                {category.examples.map((example, i) => (
                                    <li key={i}>
                                        <button
                                            onClick={() => onSelectExample(example)}
                                            className="w-full text-left text-sm text-gray-300 hover:text-white hover:bg-gray-700 px-2 py-1 rounded transition-colors truncate"
                                            title={example}
                                        >
                                            {example}
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default PromptHelp;
