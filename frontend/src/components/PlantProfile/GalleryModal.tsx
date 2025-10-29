import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState, useEffect } from 'react';

interface GalleryPhoto {
  id: string;
  photoUrl: string;
  createdAt: string;
}

interface GalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
  photos: GalleryPhoto[];
  initialIndex?: number;
}

const GalleryModal = ({ isOpen, onClose, photos, initialIndex = 0 }: GalleryModalProps) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex);
    }
  }, [isOpen, initialIndex]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft') {
        handlePrevious();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentIndex, photos.length]);

  if (!isOpen || photos.length === 0) return null;

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? photos.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === photos.length - 1 ? 0 : prev + 1));
  };

  const handleImageClick = (index: number) => {
    setCurrentIndex(index);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4">
      <div className="relative w-full h-full flex flex-col max-w-7xl mx-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 text-white hover:text-gray-300 transition-colors p-2"
          aria-label="Close gallery"
        >
          <X className="w-6 h-6 sm:w-8 sm:h-8" />
        </button>

        {/* Main Image */}
        <div className="flex-1 flex items-center justify-center relative">
          {photos.length > 1 && (
            <button
              onClick={handlePrevious}
              className="absolute left-4 z-10 text-white hover:text-gray-300 transition-colors p-2 bg-black/50 rounded-full"
              aria-label="Previous image"
            >
              <ChevronLeft className="w-6 h-6 sm:w-8 sm:h-8" />
            </button>
          )}

          <div className="w-full h-full flex items-center justify-center">
            <img
              src={photos[currentIndex].photoUrl}
              alt={`Gallery image ${currentIndex + 1}`}
              className="max-w-full max-h-full object-contain"
            />
          </div>

          {photos.length > 1 && (
            <button
              onClick={handleNext}
              className="absolute right-4 z-10 text-white hover:text-gray-300 transition-colors p-2 bg-black/50 rounded-full"
              aria-label="Next image"
            >
              <ChevronRight className="w-6 h-6 sm:w-8 sm:h-8" />
            </button>
          )}
        </div>

        {/* Image Counter */}
        {photos.length > 1 && (
          <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 text-white bg-black/50 px-4 py-2 rounded-full text-sm sm:text-base">
            {currentIndex + 1} / {photos.length}
          </div>
        )}

        {/* Thumbnail Strip */}
        {photos.length > 1 && (
          <div className="absolute bottom-4 left-0 right-0 overflow-x-auto">
            <div className="flex gap-2 justify-center px-4 pb-4">
              {photos.map((photo, index) => (
                <button
                  key={photo.id}
                  onClick={() => handleImageClick(index)}
                  className={`flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden border-2 transition-all ${
                    index === currentIndex
                      ? 'border-white scale-105'
                      : 'border-transparent opacity-60 hover:opacity-100'
                  }`}
                >
                  <img
                    src={photo.photoUrl}
                    alt={`Thumbnail ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GalleryModal;

