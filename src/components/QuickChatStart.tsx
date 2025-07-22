import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { createDMRoomId } from '../utils/roomId';

export const QuickChatStart: React.FC = () => {
  const { user } = useUser();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [targetUserId, setTargetUserId] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleStartChat = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user?.id || !targetUserId.trim()) {
      return;
    }

    setIsLoading(true);

    try {
      const roomId = createDMRoomId(user.id, targetUserId.trim());
      console.log(`Starting chat with user ${targetUserId.trim()}`);
      navigate(`/room/${roomId}`);
      
      // Reset form
      setTargetUserId('');
      setIsOpen(false);
    } catch (error) {
      console.error('Error starting chat:', error);
      alert('Error starting chat. Please check the user ID.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="relative">
      {/* Quick Chat Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center w-full px-4 py-2 mb-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors text-sm"
        title="Start chat by User ID"
      >
        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
        Quick Chat
      </button>

      {/* Input Modal */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black bg-opacity-25 z-40"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Input Panel */}
          <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border dark:border-gray-700 z-50">
            <form onSubmit={handleStartChat} className="p-4">
              <div className="mb-4">
                <label htmlFor="targetUserId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Enter User ID to chat with:
                </label>
                <input
                  id="targetUserId"
                  type="text"
                  value={targetUserId}
                  onChange={(e) => setTargetUserId(e.target.value)}
                  placeholder="e.g., user_456"
                  className="w-full px-3 py-2 border rounded-lg dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                  autoFocus
                  required
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={!targetUserId.trim() || isLoading}
                  className="flex-1 px-4 py-2 bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white rounded-lg transition-colors text-sm"
                >
                  {isLoading ? 'Starting...' : 'Start Chat'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors text-sm"
                >
                  Cancel
                </button>
              </div>

              <div className="mt-3 text-xs text-gray-500 dark:text-gray-400">
                Note: Chat will be created even if the user doesn't exist yet.
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  );
};