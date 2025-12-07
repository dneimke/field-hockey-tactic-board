import { useState, useCallback } from 'react';
import { Message } from '../types';
import { useCommandExecution, UseCommandExecutionProps } from './useCommandExecution';
import { v4 as uuidv4 } from 'uuid';

export const useChatSession = (props: UseCommandExecutionProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  
  // Pass props down to execution hook
  const { executeCommand, isLoading } = useCommandExecution(props);

  const toggleChat = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim()) return;

    // 1. Add User Message
    const userMessage: Message = {
      id: uuidv4(),
      role: 'user',
      content,
      timestamp: Date.now()
    };
    
    // Optimistic update
    setMessages(prev => [...prev, userMessage]);

    try {
      // 2. Execute Command (passing history)
      // We pass the current messages + the new user message as history
      const currentHistory = [...messages, userMessage];
      const result = await executeCommand(content, undefined, currentHistory);

      // 3. Add Assistant Message with result
      const assistantMessage: Message = {
        id: uuidv4(),
        role: 'assistant',
        content: result.explanation || 'Command executed successfully.',
        timestamp: Date.now(),
        actionResult: result
      };
      
      setMessages(prev => [...prev, assistantMessage]);

    } catch (err) {
      // 4. Handle Error
      const errorMessage: Message = {
        id: uuidv4(),
        role: 'assistant',
        content: err instanceof Error ? `Error: ${err.message}` : 'An unknown error occurred.',
        timestamp: Date.now()
      };
       setMessages(prev => [...prev, errorMessage]);
    }
  }, [messages, executeCommand]);

  const clearHistory = useCallback(() => {
      setMessages([]);
  }, []);

  return {
    messages,
    isOpen,
    toggleChat,
    sendMessage,
    isProcessing: isLoading,
    clearHistory
  };
};
