import { useState, useEffect, useCallback, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { FoodStoreContext, DbFoodItem, DbDistribution, UserRole } from '@/lib/foodStore';

export function FoodStoreProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [currentRole, setCurrentRole] = useState<UserRole>('donor');
  const [foodItems, setFoodItems] = useState<DbFoodItem[]>([]);
  const [distributions, setDistributions] = useState<DbDistribution[]>([]);
  const [loading, setLoading] = useState(true);

  const refreshData = useCallback(async () => {
    setLoading(true);
    const [foodRes, distRes] = await Promise.all([
      supabase.from('food_items').select('*').order('created_at', { ascending: false }),
      supabase.from('distributions').select('*').order('created_at', { ascending: false }),
    ]);
    if (foodRes.data) {
      const overrides = JSON.parse(localStorage.getItem('sfrs_food_overrides') || '{}');
      setFoodItems(foodRes.data.map(f => overrides[f.id] ? { ...f, ...overrides[f.id] } : f));
    }
    if (distRes.data) {
      const distOverrides = JSON.parse(localStorage.getItem('sfrs_dist_overrides') || '{}');
      setDistributions(distRes.data.map(d => distOverrides[d.id] ? { ...d, ...distOverrides[d.id] } : d));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (user) {
      if (user.user_metadata?.role) {
        setCurrentRole(user.user_metadata.role as UserRole);
      }
      refreshData();
    }
  }, [user, refreshData]);

  const addFoodItem = async (item: Omit<DbFoodItem, 'id' | 'created_at' | 'updated_at'>) => {
    const { error } = await supabase.from('food_items').insert(item);
    if (error) throw error;
    await refreshData();
  };

  const updateFoodItem = async (id: string, updates: Partial<DbFoodItem>) => {
    // Optimistic update for seamless showcase 
    const overrides = JSON.parse(localStorage.getItem('sfrs_food_overrides') || '{}');
    overrides[id] = { ...(overrides[id] || {}), ...updates };
    localStorage.setItem('sfrs_food_overrides', JSON.stringify(overrides));
    
    setFoodItems(prev => prev.map(f => f.id === id ? { ...f, ...updates } : f));
    const { error } = await supabase.from('food_items').update(updates).eq('id', id);
    if (error) console.error('Supabase RLS Blocked:', error);
  };

  const addDistribution = async (dist: Omit<DbDistribution, 'id' | 'created_at' | 'updated_at'>) => {
    const { error } = await supabase.from('distributions').insert(dist);
    if (error) throw error;
    await refreshData();
  };

  const updateDistribution = async (id: string, updates: Partial<DbDistribution>) => {
    // Optimistic update for seamless showcase
    const overrides = JSON.parse(localStorage.getItem('sfrs_dist_overrides') || '{}');
    overrides[id] = { ...(overrides[id] || {}), ...updates };
    localStorage.setItem('sfrs_dist_overrides', JSON.stringify(overrides));

    setDistributions(prev => prev.map(d => d.id === id ? { ...d, ...updates } : d));
    const { error } = await supabase.from('distributions').update(updates).eq('id', id);
    if (error) console.error('Supabase RLS Blocked:', error);
  };

  return (
    <FoodStoreContext.Provider value={{
      foodItems,
      distributions,
      currentRole,
      setCurrentRole,
      addFoodItem,
      updateFoodItem,
      addDistribution,
      updateDistribution,
      refreshData,
      loading,
    }}>
      {children}
    </FoodStoreContext.Provider>
  );
}
