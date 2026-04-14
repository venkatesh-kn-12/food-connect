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
    if (foodRes.data) setFoodItems(foodRes.data);
    if (distRes.data) setDistributions(distRes.data);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (user) refreshData();
  }, [user, refreshData]);

  const addFoodItem = async (item: Omit<DbFoodItem, 'id' | 'created_at' | 'updated_at'>) => {
    const { error } = await supabase.from('food_items').insert(item);
    if (error) throw error;
    await refreshData();
  };

  const updateFoodItem = async (id: string, updates: Partial<DbFoodItem>) => {
    const { error } = await supabase.from('food_items').update(updates).eq('id', id);
    if (error) throw error;
    await refreshData();
  };

  const addDistribution = async (dist: Omit<DbDistribution, 'id' | 'created_at' | 'updated_at'>) => {
    const { error } = await supabase.from('distributions').insert(dist);
    if (error) throw error;
    await refreshData();
  };

  const updateDistribution = async (id: string, updates: Partial<DbDistribution>) => {
    const { error } = await supabase.from('distributions').update(updates).eq('id', id);
    if (error) throw error;
    await refreshData();
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
