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

  // ─── IoT Local Proxy Polling ───────────────────────────────────
  useEffect(() => {
    const IOT_POLL_INTERVAL_MS = 5000; // 5 seconds
    
    const pollIotServer = async () => {
      try {
        const response = await fetch('http://localhost:3001/api/iot/status');
        const data = await response.json();
        
        if (data.deposits && data.deposits.length > 0) {
          const iotFoods: DbFoodItem[] = data.deposits.map((d: any) => {
            // Run AI categorization on sensor data
            const aiResult = categorizeFoodItem({
              foodSubtypeId: 'other',
              hoursSincePrepared: 0,
              storageCondition: 'room-temp',
              temperature: d.temperature,
            });

            // Rule: IoT deposits are never for human consumption
            let finalCategory = aiResult.category;
            if (finalCategory === 'human-consumption') {
              finalCategory = 'animal-feed'; // Downgrade to safest non-human option
            }

            return {
              id: d.id,
              donor_id: 'iot-system',
              donor_name: d.box_id,
              food_name: 'IoT Box Deposit',
              quantity: 10,
              food_type: 'veg',
              food_subtype: 'other',
              category: finalCategory,
              status: 'categorized',
              safety_score: aiResult.safetyScore,
              storage_condition: 'room-temp',
              temperature: d.temperature,
              location: d.location,
              time_prepared: d.timestamp,
              expiry_estimate: new Date(new Date(d.timestamp).getTime() + 4 * 3600000).toISOString(),
              created_at: d.timestamp,
              updated_at: d.timestamp,
              image_url: null,
              // Add custom field for sensor data display
              humidity: d.humidity,
              distance: d.distance
            } as any;
          });

          setFoodItems(prev => {
            const existingIds = new Set(prev.map(f => f.id));
            const newItems = iotFoods.filter(f => !existingIds.has(f.id));
            if (newItems.length === 0) return prev;
            return [...newItems, ...prev]; // New IoT items at top
          });
        }
      } catch (e) {
        // IoT server might be offline, ignore silently
      }
    };

    const intervalId = setInterval(pollIotServer, IOT_POLL_INTERVAL_MS);
    pollIotServer(); // Initial call
    
    return () => clearInterval(intervalId);
  }, []);

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
