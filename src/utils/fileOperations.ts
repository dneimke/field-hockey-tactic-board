import { Tactic } from '../types';

/**
 * Exports a tactic to a JSON file for download
 */
export const exportTacticToFile = (tactic: Tactic): void => {
  const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
    JSON.stringify(tactic, null, 2),
  )}`;
  const link = document.createElement('a');
  link.href = jsonString;
  link.download = `${tactic.name.replace(/\s+/g, '_').toLowerCase()}.json`;

  // The link must be added to the DOM for the click to work in some browsers
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Imports a tactic from a JSON file
 */
export const importTacticFromFile = (
  onSuccess: (tactic: Tactic) => void,
  onError: (error: string) => void,
): void => {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json,application/json';
  input.onchange = (event) => {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) {
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result;
        if (typeof text !== 'string') {
          throw new Error('File content is not a string.');
        }
        const tactic = JSON.parse(text) as Tactic;
        if (
          tactic &&
          typeof tactic.name === 'string' &&
          Array.isArray(tactic.frames) &&
          Array.isArray(tactic.paths)
        ) {
          onSuccess(tactic);
        } else {
          throw new Error('Invalid tactic file format.');
        }
      } catch (err) {
        onError((err as Error).message);
      }
    };
    reader.onerror = () => {
      onError('Failed to read the file.');
    };
    reader.readAsText(file);
  };
  input.click();
};

