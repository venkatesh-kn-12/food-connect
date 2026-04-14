/**
 * Food store using Supabase for persistent data.
 * Falls back to sample data when user is not authenticated.
 */

import { createContext, useContext } from 'react';
import { Tables } from '@/integrations/supabase/types';

export type DbFoodItem = Tables<'food_items'>;
export type DbDistribution = Tables<'distributions'>;

export type UserRole = 'donor' | 'volunteer' | 'receiver' | 'admin';

export interface FoodStore {
  foodItems: DbFoodItem[];
  distributions: DbDistribution[];
  currentRole: UserRole;
  setCurrentRole: (role: UserRole) => void;
  addFoodItem: (item: Omit<DbFoodItem, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateFoodItem: (id: string, updates: Partial<DbFoodItem>) => Promise<void>;
  addDistribution: (dist: Omit<DbDistribution, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateDistribution: (id: string, updates: Partial<DbDistribution>) => Promise<void>;
  refreshData: () => Promise<void>;
  loading: boolean;
}

export const FoodStoreContext = createContext<FoodStore | null>(null);

export function useFoodStore() {
  const ctx = useContext(FoodStoreContext);
  if (!ctx) throw new Error('useFoodStore must be used within FoodStoreProvider');
  return ctx;
}
