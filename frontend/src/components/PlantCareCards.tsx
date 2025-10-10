import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';

// Add CSS for hover animations and modal
const cardStyles = `
  .card-hover-zoom {
    transition: transform 0.3s ease-in-out;
  }

  .card-hover-zoom:hover {
    transform: scale(1.05);
  }

  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(9, 45, 26, 0.45);
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100vw;
    height: 100vh;
    z-index: 2000;
    backdrop-filter: blur(4px);
  }

  .modal-content {
    background: white;
    border-radius: 1.25rem;
    padding: 2rem 2.5rem;
    width: min(420px, 92vw);
    max-width: min(420px, 92vw);
    max-height: 85vh;
    overflow-y: auto;
    position: relative;
    box-shadow: 0 30px 60px -25px rgba(0, 0, 0, 0.45);
    border: 1px solid rgba(255, 255, 255, 0.2);
    animation: modalSlideIn 0.3s ease-out;
  }

  @keyframes modalSlideIn {
    from {
      opacity: 0;
      transform: translateY(-20px) scale(0.95);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }

  .modal-close {
    position: absolute;
    top: 1rem;
    right: 1rem;
    background: none;
    border: none;
    font-size: 1.5rem;
    cursor: pointer;
    color: #6b7280;
    transition: color 0.2s;
  }

  .modal-close:hover {
    color: #374151;
  }
`;

// Inject styles (once)
if (typeof document !== 'undefined' && !document.getElementById('plant-care-card-styles')) {
  const styleElement = document.createElement('style');
  styleElement.id = 'plant-care-card-styles';
  styleElement.textContent = cardStyles;
  document.head.appendChild(styleElement);
}

interface PlantCareCardsProps {
  careLevel?: string | {
    level: 'Easy' | 'Moderate' | 'Difficult';
    description: string;
    maintenanceTips: string;
  };
  waterFrequency?: number; // in days
  sunRequirements?: string | {
    level: 'No sun' | 'Part to Full' | 'Full sun';
    description: string;
    placementTips: string;
  };
  toxicityLevel?: string | {
    level: 'Low' | 'Medium' | 'High';
    description: string;
    safetyTips: string;
  };
  className?: string;
}

// Helper function to convert frequency days to readable text (same logic as PlantDetailPage)
const getFrequencyText = (frequencyDays: number) => {
  if (frequencyDays === 1) return 'Every day';
  if (frequencyDays === 2) return 'Every 2 days';
  if (frequencyDays === 7) return 'Every week';
  if (frequencyDays === 14) return 'Every 2 weeks';
  if (frequencyDays === 30) return 'Every month';
  if (frequencyDays === 90) return 'Every 3 months';
  if (frequencyDays === 180) return 'Every 6 months';
  if (frequencyDays === 365) return 'Every year';
  if (frequencyDays === 540) return 'Every 18 months';
  return `Every ${frequencyDays} days`;
};

// Helper function to get care level color
const getCareLevelColor = (level: string) => {
  switch (level) {
    case 'Easy': return 'text-green-600';
    case 'Moderate': return 'text-yellow-600';
    case 'Difficult': return 'text-red-600';
    default: return 'text-gray-600';
  }
};

// Helper function to get toxicity level color
const getToxicityLevelColor = (level: string) => {
  switch (level) {
    case 'Low': return 'text-green-600';
    case 'Medium': return 'text-yellow-600';
    case 'High': return 'text-red-600';
    default: return 'text-gray-600';
  }
};

// Helper function to get sun requirements color
const getSunRequirementsColor = (level: string) => {
  switch (level) {
    case 'No sun': return 'text-blue-600';
    case 'Part to Full': return 'text-yellow-600';
    case 'Full sun': return 'text-orange-600';
    default: return 'text-gray-600';
  }
};

// Modal Component
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen || typeof document === 'undefined') return null;

  const modalNode = (
    <motion.div
      className="modal-overlay"
      onClick={onClose}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      <motion.div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, y: -20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.95 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
      >
        <button className="modal-close" onClick={onClose}>
          ×
        </button>
        <h2 className="text-xl font-semibold text-gray-800 mb-4 pr-8">{title}</h2>
        <div className="text-sm text-gray-600 space-y-3">
          {children}
        </div>
        <div className="mt-6 flex justify-center">
          <motion.button
            onClick={onClose}
            className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Close
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );

  return createPortal(modalNode, document.body);
};

// Card Component with hover zoom
interface CareCardProps {
  title: string;
  icon: string;
  iconAlt: string;
  frontContent: React.ReactNode;
  onClick: () => void;
}

const CareCard: React.FC<CareCardProps> = ({ title, icon, iconAlt, frontContent, onClick }) => {
  return (
    <motion.div
      className="bg-white rounded-lg p-4 shadow-sm border border-gray-100 card-hover-zoom cursor-pointer"
      onClick={onClick}
      whileHover={{ scale: 1.05 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
    >
      <div className="flex flex-col items-center text-center h-full justify-center">
        <div className="w-8 h-8 mb-2 flex items-center justify-center">
          <img src={icon} alt={iconAlt} className="w-6 h-6" />
        </div>
        <h3 className="font-semibold text-gray-800 text-sm mb-1">{title}</h3>
        {frontContent}
      </div>
    </motion.div>
  );
};

export const PlantCareCards: React.FC<PlantCareCardsProps> = ({
  careLevel,
  waterFrequency = 7,
  sunRequirements,
  toxicityLevel,
  className = ''
}) => {
  const [openModal, setOpenModal] = useState<string | null>(null);

  useEffect(() => {
    if (typeof document === 'undefined') return;

    const originalOverflow = document.body.style.overflow;
    const originalPadding = document.body.style.paddingRight;

    if (openModal) {
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      if (scrollbarWidth > 0) {
        document.body.style.paddingRight = `${scrollbarWidth}px`;
      }
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.paddingRight = originalPadding;
    };
  }, [openModal]);

  // Helper function to handle backward compatibility
  const getCareLevelValue = (careLevel: any) => {
    return typeof careLevel === 'string' ? careLevel : careLevel.level;
  };

  const getSunRequirementsValue = (sunRequirements: any) => {
    return typeof sunRequirements === 'string' ? sunRequirements : sunRequirements.level;
  };

  const getToxicityLevelValue = (toxicityLevel: any) => {
    return typeof toxicityLevel === 'string' ? toxicityLevel : toxicityLevel.level;
  };

  const handleCardClick = (cardType: string) => {
    setOpenModal(cardType);
  };

  const handleCloseModal = () => {
    setOpenModal(null);
  };

  return (
    <>
      <div className={`grid grid-cols-2 lg:grid-cols-4 gap-3 ${className}`}>
        {/* Care Level Card */}
        <CareCard
          title="Care"
          icon="/plant.png"
          iconAlt="Plant care"
          frontContent={
            <p className={`text-xs font-medium ${getCareLevelColor(getCareLevelValue(careLevel))}`}>
              {getCareLevelValue(careLevel)}
            </p>
          }
          onClick={() => handleCardClick('care')}
        />

        {/* Water Frequency Card */}
        <CareCard
          title="Water"
          icon="/watering-plants.png"
          iconAlt="Watering plants"
          frontContent={
            <p className="text-xs text-gray-600">
              {getFrequencyText(waterFrequency)}
            </p>
          }
          onClick={() => handleCardClick('water')}
        />

        {/* Sun Requirements Card */}
        <CareCard
          title="Sun"
          icon="/happy.png"
          iconAlt="Sun requirements"
          frontContent={
            <p className={`text-xs font-medium ${getSunRequirementsColor(getSunRequirementsValue(sunRequirements))}`}>
              {getSunRequirementsValue(sunRequirements)}
            </p>
          }
          onClick={() => handleCardClick('sun')}
        />

        {/* Toxicity Level Card */}
        <CareCard
          title="Toxicity"
          icon="/danger.png"
          iconAlt="Toxicity level"
          frontContent={
            <p className={`text-xs font-medium ${getToxicityLevelColor(getToxicityLevelValue(toxicityLevel))}`}>
              {getToxicityLevelValue(toxicityLevel)}
            </p>
          }
          onClick={() => handleCardClick('toxicity')}
        />
      </div>

      {/* Modals */}
      <AnimatePresence>
        <Modal
          isOpen={openModal === 'care'}
          onClose={handleCloseModal}
          title="Care Details"
        >
          <p className="text-gray-600 mb-3">
            {typeof careLevel === 'object' ? careLevel.description : 'Standard houseplant care requirements'}
          </p>
          <p className="text-gray-600">
            <strong>Maintenance Tips:</strong> {typeof careLevel === 'object' ? careLevel.maintenanceTips : 'Regular watering and occasional fertilizing'}
          </p>
        </Modal>

        <Modal
          isOpen={openModal === 'water'}
          onClose={handleCloseModal}
          title="Watering Guide"
        >
          <p className="text-gray-600">
            Water every {waterFrequency} days. Check soil moisture before watering to avoid overwatering. Allow top inch of soil to dry between waterings.
          </p>
        </Modal>

        <Modal
          isOpen={openModal === 'sun'}
          onClose={handleCloseModal}
          title="Light Requirements"
        >
          <p className="text-gray-600 mb-3">
            {typeof sunRequirements === 'object' ? sunRequirements.description : 'Moderate light conditions'}
          </p>
          <p className="text-gray-600">
            <strong>Placement:</strong> {typeof sunRequirements === 'object' ? sunRequirements.placementTips : 'Place near east or west facing windows'}
          </p>
        </Modal>

        <Modal
          isOpen={openModal === 'toxicity'}
          onClose={handleCloseModal}
          title="Safety Information"
        >
          <p className="text-gray-600 mb-3">
            {typeof toxicityLevel === 'object' ? toxicityLevel.description : 'Generally safe for households'}
          </p>
          <p className="text-gray-600">
            <strong>Safety Tips:</strong> {typeof toxicityLevel === 'object' ? toxicityLevel.safetyTips : 'Safe for most environments'}
          </p>
        </Modal>
      </AnimatePresence>
    </>
  );
};
