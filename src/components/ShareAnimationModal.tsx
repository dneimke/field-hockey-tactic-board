import React, { useState, useEffect } from 'react';
import { StoredAnimation } from '../types';
import {
  getOrCreateShareToken,
  regenerateShareToken,
  unshareAnimation,
  getUserAnimations,
} from '../services/animationService';
import { getCurrentUser } from '../services/authService';
import { User } from 'firebase/auth';

interface ShareAnimationModalProps {
  isOpen: boolean;
  onClose: () => void;
  animation: StoredAnimation | null;
}

const ShareAnimationModal: React.FC<ShareAnimationModalProps> = ({
  isOpen,
  onClose,
  animation,
}) => {
  const [shareToken, setShareToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sharedWith, setSharedWith] = useState<string[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen && animation) {
      const currentUser = getCurrentUser();
      setUser(currentUser);
      setSharedWith(animation.sharedWith || []);
      loadShareToken();
    } else {
      setShareToken(null);
      setError(null);
      setCopied(false);
    }
  }, [isOpen, animation]);

  const loadShareToken = async () => {
    if (!animation || !user || animation.userId !== user.uid) return;

    setIsLoading(true);
    setError(null);
    try {
      const token = await getOrCreateShareToken(user.uid, animation.id);
      setShareToken(token);
    } catch (err) {
      console.error('Failed to load share token:', err);
      setError('Failed to load share link. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegenerateToken = async () => {
    if (!animation || !user) return;

    setIsLoading(true);
    setError(null);
    try {
      const newToken = await regenerateShareToken(user.uid, animation.id);
      setShareToken(newToken);
      setCopied(false);
    } catch (err) {
      console.error('Failed to regenerate share token:', err);
      setError('Failed to regenerate share link. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyLink = async () => {
    if (!shareToken) return;

    const shareUrl = `${window.location.origin}${window.location.pathname}?share=${shareToken}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy link:', err);
      setError('Failed to copy link. Please try again.');
    }
  };

  const handleRemoveShare = async (userIdToRemove: string) => {
    if (!animation || !user) return;

    if (!window.confirm('Are you sure you want to remove access for this user?')) {
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      await unshareAnimation(user.uid, animation.id, userIdToRemove);
      setSharedWith(sharedWith.filter(id => id !== userIdToRemove));
      
      // Refresh animation data
      const animations = await getUserAnimations(user.uid);
      const updated = animations.find(a => a.id === animation.id);
      if (updated) {
        setSharedWith(updated.sharedWith || []);
      }
    } catch (err) {
      console.error('Failed to remove share access:', err);
      setError('Failed to remove share access. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen || !animation) {
    return null;
  }

  const shareUrl = shareToken ? `${window.location.origin}${window.location.pathname}?share=${shareToken}` : '';

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-gray-800 p-8 rounded-lg shadow-xl w-full max-w-2xl flex flex-col"
        style={{ maxHeight: '90vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">Share Animation</h2>
          <button
            onClick={onClose}
            title="Close"
            className="text-gray-400 hover:text-white text-3xl leading-none"
          >
            &times;
          </button>
        </div>

        <div className="mb-4">
          <h3 className="text-lg font-semibold text-white mb-2">{animation.name}</h3>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-900/30 border border-red-800 rounded-md text-red-200 text-sm">
            {error}
          </div>
        )}

        {/* Shareable Link Section */}
        <div className="mb-6">
          <h4 className="text-md font-semibold text-gray-300 mb-3">Shareable Link</h4>
          <div className="bg-gray-700 rounded-md p-4 space-y-3">
            {isLoading ? (
              <div className="text-gray-400 text-sm">Loading share link...</div>
            ) : shareToken ? (
              <>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={shareUrl}
                    readOnly
                    className="flex-1 bg-gray-600 text-white rounded-md p-2 border border-gray-500 text-sm"
                  />
                  <button
                    onClick={handleCopyLink}
                    className={`px-4 py-2 rounded-md font-semibold transition-colors ${
                      copied
                        ? 'bg-green-600 hover:bg-green-700'
                        : 'bg-blue-600 hover:bg-blue-700'
                    } text-white`}
                  >
                    {copied ? 'Copied!' : 'Copy Link'}
                  </button>
                </div>
                <button
                  onClick={handleRegenerateToken}
                  className="text-sm text-gray-400 hover:text-gray-300 underline"
                  disabled={isLoading}
                >
                  Regenerate Link (revokes old link)
                </button>
                <p className="text-xs text-gray-400 mt-2">
                  Anyone with this link can view this animation. They will need to sign in to access it.
                </p>
              </>
            ) : (
              <div className="text-gray-400 text-sm">Failed to load share link.</div>
            )}
          </div>
        </div>

        {/* Currently Shared With Section */}
        <div className="mb-6">
          <h4 className="text-md font-semibold text-gray-300 mb-3">
            Currently Shared With ({sharedWith.length})
          </h4>
          {sharedWith.length > 0 ? (
            <div className="bg-gray-700 rounded-md p-4 space-y-2">
              {sharedWith.map((userId) => (
                <div
                  key={userId}
                  className="flex items-center justify-between bg-gray-600 rounded-md p-2"
                >
                  <span className="text-white text-sm">{userId}</span>
                  <button
                    onClick={() => handleRemoveShare(userId)}
                    className="px-3 py-1 text-sm bg-red-600 hover:bg-red-700 rounded-md transition-colors font-semibold"
                    disabled={isLoading}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-gray-700 rounded-md p-4 text-gray-400 text-sm">
              No users have been granted access yet. Share the link above to grant access.
            </div>
          )}
        </div>

        <div className="mt-auto pt-4 border-t border-gray-700 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-md font-semibold transition-colors text-white"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShareAnimationModal;
