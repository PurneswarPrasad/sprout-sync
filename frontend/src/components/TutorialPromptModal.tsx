import React from 'react';

interface TutorialPromptModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onDecline: () => void;
}

export const TutorialPromptModal: React.FC<TutorialPromptModalProps> = ({
  isOpen,
  onConfirm,
  onDecline,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[10050] bg-black/60 backdrop-blur-sm flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl p-8 space-y-6 animate-in fade-in-0 zoom-in-95 duration-200">
        <div className="space-y-3 text-center">
          <p className="text-sm uppercase tracking-[0.2em] text-emerald-500 font-semibold">Welcome to SproutSync</p>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
            The place where you and your plant get to know and grow together
          </h2>
          <p className="text-base sm:text-lg text-gray-600 leading-relaxed">
            Let&apos;s walk you through adding your first plant buddy on SproutSync. Are you ready?
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <button
            onClick={onDecline}
            className="flex-1 rounded-xl border border-gray-300 px-5 py-3 text-sm sm:text-base font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            No, I&apos;m fine
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 rounded-xl bg-emerald-600 px-5 py-3 text-sm sm:text-base font-semibold text-white shadow-lg shadow-emerald-200/60 hover:bg-emerald-700 transition-colors"
          >
            Let&apos;s go!
          </button>
        </div>
      </div>
    </div>
  );
};


