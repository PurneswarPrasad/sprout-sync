import React, { useState, useEffect } from 'react';
import { X, MessageCircle, Send } from 'lucide-react';
import { plantsAPI } from '../services/api';

interface Comment {
  id: string;
  comment: string;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    avatarUrl: string | null;
  };
}

interface PlantCommentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  plantId: string;
  plantName: string;
}

export function PlantCommentsModal({
  isOpen,
  onClose,
  plantId,
  plantName,
}: PlantCommentsModalProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && plantId) {
      fetchComments();
    }
  }, [isOpen, plantId]);

  const fetchComments = async () => {
    setLoading(true);
    try {
      const response = await plantsAPI.getComments(plantId);
      if (response.data.success) {
        setComments(response.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setSubmitting(true);
    try {
      const response = await plantsAPI.addComment(plantId, newComment.trim());
      if (response.data.success) {
        setComments([response.data.data, ...comments]);
        setNewComment('');
      }
    } catch (error) {
      console.error('Error adding comment:', error);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-emerald-600" />
            Comments for {plantName}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Comments List */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin"></div>
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <MessageCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>No comments yet. Be the first to comment!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {comments.map((comment) => (
                <div key={comment.id} className="border-b border-gray-100 pb-4 last:border-0">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                      {comment.user.avatarUrl ? (
                        <img
                          src={comment.user.avatarUrl}
                          alt={comment.user.name || 'User'}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-emerald-600 font-semibold">
                          {(comment.user.name || 'U')[0].toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-gray-900">
                          {comment.user.name || 'Anonymous'}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(comment.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                      <p className="text-gray-700">{comment.comment}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Comment Form */}
        <div className="p-6 border-t border-gray-200">
          <form onSubmit={handleSubmit} className="flex gap-3">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              maxLength={500}
            />
            <button
              type="submit"
              disabled={!newComment.trim() || submitting}
              className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              {submitting ? 'Posting...' : 'Post'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

