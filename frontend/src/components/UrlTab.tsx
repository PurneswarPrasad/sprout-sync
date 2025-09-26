import React from 'react';
import { Loader2 } from 'lucide-react';

interface UrlTabProps {
  imageUrl: string;
  loading: boolean;
  onUrlChange: (url: string) => void;
  onAnalyze: () => void;
}

export const UrlTab: React.FC<UrlTabProps> = ({
  imageUrl,
  loading,
  onUrlChange,
  onAnalyze,
}) => {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Image URL
        </label>
        <input
          type="url"
          value={imageUrl}
          onChange={(e) => onUrlChange(e.target.value)}
          placeholder="https://example.com/plant-image.jpg"
          className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
        />
        <p className="text-xs text-gray-500 mt-1">
          Use direct image URLs (ending in .jpg, .png, etc.) - not search engine pages
        </p>
      </div>
      <button
        onClick={onAnalyze}
        disabled={loading || !imageUrl.trim()}
        className="w-full py-3 bg-emerald-500 text-white rounded-xl font-medium hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Analyzing...
          </>
        ) : (
          'Analyze Plant'
        )}
      </button>
    </div>
  );
};
