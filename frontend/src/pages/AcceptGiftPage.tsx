import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Leaf, AlertCircle, CheckCircle } from 'lucide-react';
import { Layout } from '../components/Layout';
import { plantGiftsAPI } from '../services/api';

interface GiftData {
  id: string;
  giftToken: string;
  status: string;
  message?: string;
  createdAt: string;
  plant: {
    id: string;
    petName: string | null;
    botanicalName: string | null;
    commonName: string | null;
    type: string | null;
    acquisitionDate: string | null;
    city: string | null;
    careLevel: string | null;
    sunRequirements: string | null;
    toxicityLevel: string | null;
    tasks: Array<{
      id: string;
      taskKey: string;
      frequencyDays: number;
      nextDueOn: string;
      lastCompletedOn: string | null;
      active: boolean;
    }>;
    photos: Array<{
      id: string;
      cloudinaryPublicId: string;
      secureUrl: string;
      takenAt: string;
      pointsAwarded: number;
    }>;
    tags: Array<{
      tag: {
        id: string;
        name: string;
        colorHex: string | null;
      };
    }>;
  };
  sender: {
    id: string;
    name: string | null;
    email: string;
  };
}

export function AcceptGiftPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [gift, setGift] = useState<GiftData | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (token) {
      fetchGift();
    }
  }, [token]);

  const fetchGift = async () => {
    try {
      const response = await plantGiftsAPI.getGiftByToken(token!);
      setGift(response.data.data);
    } catch (error: any) {
      console.error('Error fetching gift:', error);
      if (error.response?.status === 404) {
        setError('Gift not found or has already been claimed');
      } else if (error.response?.status === 410) {
        setError('This gift has expired');
      } else {
        setError('Failed to load gift details');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptGift = async () => {
    if (!token) return;

    setAccepting(true);
    try {
      await plantGiftsAPI.acceptGift({ giftToken: token });
      setSuccess(true);
      
      // Redirect to plants page after a short delay
      setTimeout(() => {
        navigate('/plants');
      }, 2000);
    } catch (error: any) {
      console.error('Error accepting gift:', error);
      if (error.response?.status === 400) {
        setError('You cannot accept your own gifts');
      } else if (error.response?.status === 404) {
        setError('Gift not found or has already been claimed');
      } else if (error.response?.status === 410) {
        setError('This gift has expired');
      } else {
        setError('Failed to accept gift');
      }
    } finally {
      setAccepting(false);
    }
  };

  const getPlantDisplayName = (plant: GiftData['plant']): string => {
    if (plant.petName && plant.commonName) {
      return `${plant.petName} (${plant.commonName})`;
    } else if (plant.petName) {
      return plant.petName;
    } else if (plant.commonName) {
      return plant.commonName;
    } else if (plant.botanicalName) {
      return plant.botanicalName;
    } else {
      return 'Unknown Plant';
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading gift details...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center max-w-md mx-auto">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">There was a problem</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={() => navigate('/plants')}
              className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
            >
              Back to Plants
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  if (success) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center max-w-md mx-auto">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-emerald-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Gift Accepted!</h2>
            <p className="text-gray-600 mb-6">
              Your {getPlantDisplayName(gift!.plant)} has been added to your plant collection.
            </p>
            <p className="text-sm text-gray-500">Redirecting to your plants...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!gift) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <p className="text-gray-600 mb-2">Gift not found</p>
            <button
              onClick={() => navigate('/plants')}
              className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
            >
              Back to Plants
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3 sm:gap-4">
          <button
            onClick={() => navigate('/plants')}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors flex-shrink-0"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
            {gift.plant.photos && gift.plant.photos.length > 0 ? (
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-lg overflow-hidden flex-shrink-0">
                <img
                  src={gift.plant.photos[0].secureUrl}
                  alt={getPlantDisplayName(gift.plant)}
                  className="w-full h-full object-contain"
                />
              </div>
            ) : (
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Leaf className="w-6 h-6 sm:w-8 sm:h-8 text-emerald-600" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <h1 className="text-lg sm:text-2xl font-bold text-gray-800 truncate" title={getPlantDisplayName(gift.plant)}>
                {getPlantDisplayName(gift.plant)}
              </h1>
              <p className="text-sm sm:text-base text-emerald-600 truncate" title={gift.plant.type || 'Unknown type'}>
                {gift.plant.type || 'Unknown type'}
              </p>
            </div>
          </div>
        </div>

        {/* Gift Info */}
        <div className="bg-emerald-50 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
              <Leaf className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Gift from {gift.sender.name || gift.sender.email}</h2>
              <p className="text-sm text-gray-600">Sent on {new Date(gift.createdAt).toLocaleDateString()}</p>
            </div>
          </div>
          
          {gift.message && (
            <div className="bg-white rounded-lg p-4 mb-4">
              <p className="text-gray-700 italic">"{gift.message}"</p>
            </div>
          )}

          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Plant Type:</span>
              <span className="text-sm font-medium text-gray-900">{gift.plant.type || 'Unknown'}</span>
            </div>
            {gift.plant.careLevel && (
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Care Level:</span>
                <span className="text-sm font-medium text-gray-900">{gift.plant.careLevel}</span>
              </div>
            )}
            {gift.plant.sunRequirements && (
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Sun Requirements:</span>
                <span className="text-sm font-medium text-gray-900">{gift.plant.sunRequirements}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Care Tasks:</span>
              <span className="text-sm font-medium text-gray-900">{gift.plant.tasks.length} tasks</span>
            </div>
          </div>
        </div>

        {/* Care Tasks Preview */}
        {gift.plant.tasks.length > 0 && (
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Care Schedule</h3>
            <div className="space-y-3">
              {gift.plant.tasks.map((task) => (
                <div key={task.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                      <Leaf className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 capitalize">{task.taskKey.replace(/([A-Z])/g, ' $1').trim()}</p>
                      <p className="text-sm text-gray-600">Every {task.frequencyDays} days</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Accept Button */}
        <div className="flex gap-3">
          <button
            onClick={() => navigate('/plants')}
            className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleAcceptGift}
            disabled={accepting}
            className="flex-1 px-4 py-3 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {accepting ? 'Accepting...' : 'Accept Gift'}
          </button>
        </div>
      </div>
    </Layout>
  );
}

