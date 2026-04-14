import { createContext, useContext } from 'react';
import { TablesInsert, TablesUpdate, Tables } from '@/integrations/supabase/types';

export type DbFoodItem = Tables<'food_items'>;
export type DbDistribution = Tables<'distributions'>;
export type UserRole = 'donor' | 'volunteer' | 'receiver' | 'admin';

export interface FoodStore {
  foodItems: DbFoodItem[];
  distributions: DbDistribution[];
  currentRole: UserRole;
  setCurrentRole: (role: UserRole) => void;
  addFoodItem: (item: TablesInsert<'food_items'>) => Promise<void>;
  updateFoodItem: (id: string, updates: TablesUpdate<'food_items'>) => Promise<void>;
  addDistribution: (dist: TablesInsert<'distributions'>) => Promise<void>;
  updateDistribution: (id: string, updates: TablesUpdate<'distributions'>) => Promise<void>;
  refreshData: () => Promise<void>;
  loading: boolean;
}

export const FoodStoreContext = createContext<FoodStore | null>(null);

export function useFoodStore() {
  const ctx = useContext(FoodStoreContext);
  if (!ctx) throw new Error('useFoodStore must be used within FoodStoreProvider');
  return ctx;
}
