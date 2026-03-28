/**
 * Simple in-memory store using React state via context.
 * Wraps sample data and provides CRUD operations.
 */

import { createContext, useContext } from 'react';
import { FoodItem, Distribution, UserRole } from './types';
import { sampleFoodItems, sampleDistributions, sampleStats, sampleUsers } from './sampleData';

export interface FoodStore {
  foodItems: FoodItem[];
  distributions: Distribution[];
  stats: typeof sampleStats;
  currentRole: UserRole;
  setCurrentRole: (role: UserRole) => void;
  addFoodItem: (item: FoodItem) => void;
  updateFoodItem: (id: string, updates: Partial<FoodItem>) => void;
  addDistribution: (dist: Distribution) => void;
  updateDistribution: (id: string, updates: Partial<Distribution>) => void;
}

export const FoodStoreContext = createContext<FoodStore | null>(null);

export function useFoodStore() {
  const ctx = useContext(FoodStoreContext);
  if (!ctx) throw new Error('useFoodStore must be used within FoodStoreProvider');
  return ctx;
}

export { sampleFoodItems, sampleDistributions, sampleStats, sampleUsers };
