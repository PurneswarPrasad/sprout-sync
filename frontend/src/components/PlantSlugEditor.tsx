import React, { useState } from 'react';
import { Edit2, Check, X, Link as LinkIcon, Share2 } from 'lucide-react';
import { plantsAPI, usersAPI } from '../services/api';

interface PlantSlugEditorProps {
  plantId: string;
  slug: string | null;
  onSlugUpdated: (newSlug: string) => void;
}

export function PlantSlugEditor({ plantId, slug, onSlugUpdated }: PlantSlugEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [slugInput, setSlugInput] = useState(slug || '');
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [username, setUsername] = useState<string | null>(null);

  React.useEffect(() => {
    fetchUsername();
  }, []);

  const fetchUsername = async () => {
    try {
      const response = await usersAPI.getProfile();
      if (response.data.success) {
        setUsername(response.data.data.username);
      }
    } catch (error) {
      console.error('Error fetching username:', error);
    }
  };

  const handleStartEdit = () => {
    setIsEditing(true);
    setError('');
  };

  const handleCancel = () => {
    setIsEditing(false);
    setSlugInput(slug || '');
    setError('');
  };

  const handleSave = async () => {
    if (!slugInput.trim()) {
      setError('Slug cannot be empty');
      return;
    }

    // Validate slug format
    if (!/^[a-z0-9-]+$/.test(slugInput)) {
      setError('Slug can only contain lowercase letters, numbers, and hyphens');
      return;
    }

    try {
      setIsSaving(true);
      setError('');
      const response = await plantsAPI.updateSlug(plantId, slugInput);
      if (response.data.success) {
        onSlugUpdated(response.data.data.slug);
        setIsEditing(false);
      }
    } catch (error: any) {
      console.error('Error updating slug:', error);
      setError(
        error.response?.data?.error || 'Failed to update slug. Please try again.'
      );
    } finally {
      setIsSaving(false);
    }
  };

  const getProfileUrl = () => {
    if (!username || !slug) return null;
    return `${window.location.origin}/u/${username}/${slug}`;
  };

  const handleShare = () => {
    const url = getProfileUrl();
    if (!url) return;

    if (navigator.share) {
      navigator.share({
        title: 'Check out my plant!',
        url,
      });
    } else {
      navigator.clipboard.writeText(url);
      alert('Link copied to clipboard!');
    }
  };

  const profileUrl = getProfileUrl();

  return (
    <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-lg p-4 border border-emerald-200">
      {isEditing ? (
        <div className="space-y-2">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-gray-700">Edit Slug</h3>
            <button
              onClick={handleCancel}
              disabled={isSaving}
              className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-700"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">
              /u/{username || '...'}/ 
            </span>
            <input
              type="text"
              value={slugInput}
              onChange={(e) => setSlugInput(e.target.value.toLowerCase())}
              placeholder="plant-slug"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex items-center gap-2">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-sm"
            >
              <Check className="w-4 h-4" />
              Save
            </button>
            <button
              onClick={handleCancel}
              disabled={isSaving}
              className="flex items-center gap-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div>
          {profileUrl ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3 flex-wrap">
                <Share2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                <a
                  href={profileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-emerald-700 hover:text-emerald-800 underline font-mono break-all flex-1 min-w-0"
                >
                  {profileUrl}
                </a>
                {slug && (
                  <button
                    onClick={handleStartEdit}
                    className="flex items-center gap-1 text-sm text-emerald-600 hover:text-emerald-700 flex-shrink-0 px-2 py-1"
                  >
                    <Edit2 className="w-4 h-4" />
                    Edit
                  </button>
                )}
              </div>
              <button
                onClick={handleShare}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm font-medium w-full justify-center"
              >
                <Share2 className="w-4 h-4" />
                Share Profile
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-gray-600 italic">
                {!username
                  ? 'Set your username in Settings to enable shareable profiles'
                  : 'No slug set for this plant'}
              </p>
              {username && !slug && (
                <button
                  onClick={handleStartEdit}
                  className="flex items-center gap-1 text-sm text-emerald-600 hover:text-emerald-700"
                >
                  <Edit2 className="w-4 h-4" />
                  Create slug
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

