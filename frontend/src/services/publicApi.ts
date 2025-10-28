import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const publicApi = axios.create({
  baseURL: `${API_URL}/api/public`,
});

export interface PublicPlantProfile {
  plant: {
    id: string;
    petName: string | null;
    botanicalName: string | null;
    commonName: string | null;
    slug: string | null;
    type: string | null;
    city: string | null;
    careLevel: any;
    sunRequirements: any;
    createdAt: string;
    photo: {
      secureUrl: string;
      takenAt: string;
    } | null;
  };
  owner: {
    id: string;
    name: string | null;
    username: string | null;
    avatarUrl: string | null;
  };
  tasks: Array<{
    id: string;
    taskKey: string;
    frequencyDays: number;
    nextDueOn: string;
    lastCompletedOn: string | null;
  }>;
  healthScore: number;
  careStreak: number;
  daysThriving: number;
  badge: {
    name: string;
    quote: string;
    image: string;
  };
  appreciations: {
    count: number;
    users: Array<{
      id: string;
      name: string | null;
      avatarUrl: string | null;
    }>;
  };
  comments: Array<{
    id: string;
    comment: string;
    createdAt: string;
    user: {
      id: string;
      name: string | null;
      avatarUrl: string | null;
    };
  }>;
}

export const getPublicPlantProfile = async (
  username: string,
  plantSlug: string
): Promise<PublicPlantProfile> => {
  const response = await publicApi.get(`/u/${username}/${plantSlug}`);
  return response.data.data;
};

export interface PublicGardenProfile {
  owner: {
    id: string;
    name: string | null;
    username: string | null;
    avatarUrl: string | null;
  };
  plants: Array<{
    id: string;
    petName: string | null;
    botanicalName: string | null;
    commonName: string | null;
    type: string | null;
    photo: {
      secureUrl: string;
      takenAt: string;
    } | null;
    tasks: Array<{
      id: string;
      taskKey: string;
      frequencyDays: number;
      nextDueOn: string;
      lastCompletedOn: string | null;
    }>;
    healthScore: number;
    careLevel: any;
    sunRequirements: any;
  }>;
  appreciations: {
    count: number;
    users: Array<{
      id: string;
      name: string | null;
      avatarUrl: string | null;
    }>;
  };
  comments: Array<{
    id: string;
    comment: string;
    createdAt: string;
    user: {
      id: string;
      name: string | null;
      avatarUrl: string | null;
    };
  }>;
}

export const getPublicGardenProfile = async (
  username: string
): Promise<PublicGardenProfile> => {
  const response = await publicApi.get(`/garden/${username}`);
  return response.data.data;
};

