import { useState, useEffect } from 'react';
import { Heart, MessageCircle, Share2, QrCode } from 'lucide-react';
import { plantsAPI } from '../../services/api';
import QRCode from 'react-qr-code';

interface User {
  id: string;
  name: string | null;
  avatarUrl: string | null;
}

interface Comment {
  id: string;
  comment: string;
  createdAt: string;
  user: User;
}

interface SocialInteractionZoneProps {
  plantId: string;
  initialAppreciations: {
    count: number;
    users: User[];
  };
  initialComments: Comment[];
  profileUrl: string;
  isAuthenticated: boolean;
  currentUserId?: string;
}

const SocialInteractionZone = ({
  plantId,
  initialAppreciations,
  initialComments,
  profileUrl,
  isAuthenticated,
  currentUserId,
}: SocialInteractionZoneProps) => {
  const [appreciated, setAppreciated] = useState(false);
  const [appreciationCount, setAppreciationCount] = useState(initialAppreciations.count);
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [newComment, setNewComment] = useState('');
  const [showQR, setShowQR] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Check if current user has appreciated
    if (currentUserId) {
      const hasAppreciated = initialAppreciations.users.some(
        (user) => user.id === currentUserId
      );
      setAppreciated(hasAppreciated);
    }
  }, [currentUserId, initialAppreciations]);

  const handleAppreciate = async () => {
    if (!isAuthenticated) {
      alert('Please log in to appreciate this plant');
      return;
    }

    try {
      const response = await plantsAPI.appreciate(plantId);
      const isAppreciated = response.data.data.appreciated;
      setAppreciated(isAppreciated);
      setAppreciationCount((prev) => (isAppreciated ? prev + 1 : prev - 1));
    } catch (error) {
      console.error('Error toggling appreciation:', error);
      alert('Failed to update appreciation');
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      alert('Please log in to comment');
      return;
    }

    if (!newComment.trim()) return;

    setIsSubmitting(true);
    try {
      const response = await plantsAPI.addComment(plantId, newComment);
      setComments([response.data.data, ...comments]);
      setNewComment('');
    } catch (error) {
      console.error('Error adding comment:', error);
      alert('Failed to add comment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Check out this plant!',
          url: profileUrl,
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(profileUrl);
      alert('Link copied to clipboard!');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
      <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4 sm:mb-6">Community</h2>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2 sm:gap-4 mb-4 sm:mb-6">
        <button
          onClick={handleAppreciate}
          className={`flex items-center gap-1 sm:gap-2 px-4 sm:px-6 py-2 sm:py-3 rounded-full text-sm sm:text-base font-semibold transition-all ${
            appreciated
              ? 'bg-red-500 text-white hover:bg-red-600'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <span className="hidden xs:inline">{appreciated ? 'Appreciated' : 'Appreciate'}</span>
          <span className="xs:hidden">❤️</span> ({appreciationCount})
        </button>

        <button
          onClick={() => setShowQR(!showQR)}
          className="flex items-center gap-1 sm:gap-2 px-4 sm:px-6 py-2 sm:py-3 rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200 text-sm sm:text-base font-semibold transition-all"
        >
          <QrCode className="w-4 h-4 sm:w-5 sm:h-5" />
          <span className="hidden sm:inline">QR Code</span>
          <span className="sm:hidden">QR</span>
        </button>

        <button
          onClick={handleShare}
          className="flex items-center gap-1 sm:gap-2 px-4 sm:px-6 py-2 sm:py-3 rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200 text-sm sm:text-base font-semibold transition-all"
        >
          <Share2 className="w-4 h-4 sm:w-5 sm:h-5" />
          Share
        </button>
      </div>

      {/* QR Code Display */}
      {showQR && (
        <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-gray-50 rounded-lg flex flex-col items-center">
          <QRCode value={profileUrl} size={window.innerWidth < 640 ? 150 : 200} />
          <p className="mt-2 text-xs sm:text-sm text-gray-600 text-center">Scan to view this plant profile</p>
        </div>
      )}

      {/* Comments Section */}
      <div className="border-t pt-4 sm:pt-6">
        <h3 className="flex items-center gap-2 text-lg sm:text-xl font-semibold text-gray-800 mb-3 sm:mb-4">
          <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5" />
          Comments ({comments.length})
        </h3>

        {/* Add Comment Form */}
        {isAuthenticated ? (
          <form onSubmit={handleAddComment} className="mb-4 sm:mb-6">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment..."
              className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none text-sm sm:text-base"
              rows={3}
              maxLength={500}
            />
            <div className="flex justify-between items-center mt-2">
              <span className="text-xs sm:text-sm text-gray-500">{newComment.length}/500</span>
              <button
                type="submit"
                disabled={!newComment.trim() || isSubmitting}
                className="px-3 sm:px-4 py-1.5 sm:py-2 text-sm sm:text-base bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting ? 'Posting...' : 'Post Comment'}
              </button>
            </div>
          </form>
        ) : (
          <div className="mb-4 sm:mb-6 flex items-center gap-4">
            <button
              onClick={() => window.location.href = '/'}
              className="px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium text-sm sm:text-base shadow-sm"
            >
              Sign in to Join the Conversation
            </button>
            {comments.length === 0 && (
              <p className="text-sm sm:text-base text-gray-500">
                No comments yet. Be the first to comment!
              </p>
            )}
          </div>
        )}

        {/* Comments List */}
        <div className="space-y-3 sm:space-y-4">
          {comments.length === 0 && isAuthenticated ? (
            <p className="text-sm sm:text-base text-gray-500 text-center py-6 sm:py-8">
              No comments yet. Be the first to comment!
            </p>
          ) : comments.length === 0 ? null : (
            comments.map((comment) => (
              <div key={comment.id} className="flex gap-2 sm:gap-3 p-3 sm:p-4 bg-gray-50 rounded-lg">
                <div className="flex-shrink-0">
                  {comment.user.avatarUrl ? (
                    <img
                      src={comment.user.avatarUrl}
                      alt={comment.user.name || 'User'}
                      className="w-8 h-8 sm:w-10 sm:h-10 rounded-full"
                    />
                  ) : (
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-green-200 flex items-center justify-center">
                      <span className="text-sm sm:text-base text-green-700 font-semibold">
                        {(comment.user.name || 'U')[0].toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-1">
                    <span className="font-semibold text-sm sm:text-base text-gray-800 truncate">
                      {comment.user.name || 'Anonymous'}
                    </span>
                    <span className="text-xs sm:text-sm text-gray-500">
                      {formatDate(comment.createdAt)}
                    </span>
                  </div>
                  <p className="text-sm sm:text-base text-gray-700 break-words">{comment.comment}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default SocialInteractionZone;

