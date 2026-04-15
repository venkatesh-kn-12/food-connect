import { useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { FoodStoreContext, DbFoodItem, DbDistribution, UserRole } from '@/lib/foodStore';
import { computeLiveCategory, CATEGORY_ORDER, FoodCategory, categorizeFoodItem } from '@/lib/smartSegregation';

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
      const wipeTime = parseInt(localStorage.getItem('sfrs_db_wipe_timestamp') || '0', 10);
      
      const mergedFoods = foodRes.data
        .filter(f => new Date(f.created_at).getTime() > wipeTime)
        .map(f => overrides[f.id] ? { ...f, ...overrides[f.id] } : f);
        
      setFoodItems(mergedFoods);
    }
    if (distRes.data) {
      const distOverrides = JSON.parse(localStorage.getItem('sfrs_dist_overrides') || '{}');
      const wipeTime = parseInt(localStorage.getItem('sfrs_db_wipe_timestamp') || '0', 10);

      const mergedDists = distRes.data
        .filter(d => new Date(d.created_at).getTime() > wipeTime)
        .map(d => distOverrides[d.id] ? { ...d, ...distOverrides[d.id] } : d);
        
      setDistributions(mergedDists);
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

  // ─── Background Dynamic Monitoring ─────────────────────────────
  // Keep a ref so the interval can always read the latest foodItems
  // without needing to be re-registered on every render.
  const foodItemsRef = useRef<DbFoodItem[]>([]);
  useEffect(() => { foodItemsRef.current = foodItems; }, [foodItems]);

  useEffect(() => {
    const MONITOR_INTERVAL_MS = 2 * 60 * 1000; // 2 minutes

    const monitorTick = () => {
      const items = foodItemsRef.current;
      const ACTIVE_STATUSES = ['submitted', 'categorized', 'assigned', 'picked-up'];

      items
        .filter(item => ACTIVE_STATUSES.includes(item.status))
        .forEach(item => {
          const live = computeLiveCategory(
            item.time_prepared,
            item.storage_condition,
            item.temperature,
            (item as any).food_subtype ?? 'other',
            item.status,
          );

          const currentRank = CATEGORY_ORDER.indexOf(item.category as FoodCategory);
          const liveRank    = CATEGORY_ORDER.indexOf(live.category);

          // Only downgrade, never upgrade
          if (liveRank < currentRank) {
            console.info(
              `[AI Monitor] ${item.food_name}: ${item.category} → ${live.category} (score: ${live.safetyScore})`
            );
            // Persist via the optimistic update path (works even without RLS write access)
            const overrides = JSON.parse(localStorage.getItem('sfrs_food_overrides') || '{}');
            overrides[item.id] = {
              ...(overrides[item.id] || {}),
              category: live.category,
              safety_score: live.safetyScore,
            };
            localStorage.setItem('sfrs_food_overrides', JSON.stringify(overrides));
            setFoodItems(prev =>
              prev.map(f =>
                f.id === item.id
                  ? { ...f, category: live.category, safety_score: live.safetyScore }
                  : f
              )
            );
            // Best-effort Supabase update
            supabase
              .from('food_items')
              .update({ category: live.category, safety_score: live.safetyScore })
              .eq('id', item.id)
              .then(({ error }) => {
                if (error) console.warn('[AI Monitor] Supabase update blocked (RLS):', error.message);
              });
          }
        });
    };

    const intervalId = setInterval(monitorTick, MONITOR_INTERVAL_MS);
    // Also run once shortly after load so demo sees immediate effect
    const initialDelay = setTimeout(monitorTick, 3000);

    return () => {
      clearInterval(intervalId);
      clearTimeout(initialDelay);
    };
  }, []); // no deps — uses ref for live data

  // ─── IoT Cloud Monitor (Direct Supabase) ──────────────────────
  const [iotDistance, setIotDistance] = useState<number | null>(null);
  const lastTriggeredRef = useRef<number>(0);

  useEffect(() => {
    const IOT_POLL_INTERVAL_MS = 3000; // 3 seconds for cloud polling
    
    const monitorCloudSensor = async () => {
      try {
        // Fetch latest reading for Box-01
        const { data, error } = await supabase
          .from('sensor_data' as any)
          .select('distance, created_at')
          .eq('box_id', 'BOX-01')
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (error) {
          if (error.code !== 'PGRST116') console.warn('[IoT Monitor] DB Error:', error.message);
          return;
        }

        if (data) {
          setIotDistance(data.distance);
        }
      } catch (e) {
        // Ignore
      }
    };

    const intervalId = setInterval(monitorCloudSensor, IOT_POLL_INTERVAL_MS);
    monitorCloudSensor();
    
    return () => clearInterval(intervalId);
  }, [refreshData]);

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
      iotDistance,
    }}>
      {children}
    </FoodStoreContext.Provider>
  );
}
