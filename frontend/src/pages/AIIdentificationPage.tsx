import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AIPlantIdentification } from '../components/AIPlantIdentification';

export const AIIdentificationPage: React.FC = () => {
  const navigate = useNavigate();

  const handleIdentificationComplete = (aiData: any) => {
    // Navigate to AddPlantPage with AI data
    navigate('/add-plant', { 
      state: { 
        aiData,
        fromAI: true 
      } 
    });
  };

  const handleBack = () => {
    navigate('/plants');
  };

  return (
    <AIPlantIdentification
      onBack={handleBack}
      onIdentificationComplete={handleIdentificationComplete}
    />
  );
};
