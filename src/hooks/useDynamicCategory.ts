/**
 * useDynamicCategory
 * ──────────────────
 * Polls the CNN+LSTM+RL engine on a regular interval and auto-
 * downgrades the displayed category label when spoilage warrants it.
 * Stops polling once the food is delivered or completed.
 */

import { useEffect, useRef, useState } from 'react';
import {
  computeLiveCategory,
  getCategoryInfo,
  CATEGORY_ORDER,
  FoodCategory,
  SegregationResult,
} from '@/lib/smartSegregation';
import { Enums } from '@/integrations/supabase/types';

type StorageCondition = Enums<'storage_condition'>;
type FoodStatus       = Enums<'food_status'>;

interface UseDynamicCategoryOptions {
  foodId:           string;
  timePrepared:     string;
  storageCondition: StorageCondition;
  temperature:      number;
  foodSubtypeId:    string;   // e.g. 'rice', 'meat', 'fruits'
  status:           FoodStatus;
  currentCategory:  FoodCategory;
  intervalMs?:      number;  // default 60 000 ms
  onCategoryChange?: (foodId: string, newCategory: FoodCategory, safetyScore: number) => void;
}

export interface DynamicCategoryState {
  liveCategory:    FoodCategory;
  safetyScore:     number;
  degradationRate: number;
  categoryInfo:    ReturnType<typeof getCategoryInfo>;
  hasDegraded:     boolean;
  lastChecked:     Date;
}

export function useDynamicCategory({
  foodId,
  timePrepared,
  storageCondition,
  temperature,
  foodSubtypeId,
  status,
  currentCategory,
  intervalMs = 60_000,
  onCategoryChange,
}: UseDynamicCategoryOptions): DynamicCategoryState {
  const isDelivered = status === 'delivered' || status === 'completed';

  const computeNow = (): SegregationResult =>
    computeLiveCategory(timePrepared, storageCondition, temperature, foodSubtypeId, status);

  const [liveResult, setLiveResult] = useState<SegregationResult>(computeNow);
  const lastReportedCategory = useRef<FoodCategory>(currentCategory);

  useEffect(() => {
    if (isDelivered) return;

    const tick = () => {
      const result = computeLiveCategory(
        timePrepared, storageCondition, temperature, foodSubtypeId, status,
      );
      setLiveResult(result);

      const prevRank = CATEGORY_ORDER.indexOf(lastReportedCategory.current);
      const newRank  = CATEGORY_ORDER.indexOf(result.category);
      if (newRank < prevRank) {
        lastReportedCategory.current = result.category;
        onCategoryChange?.(foodId, result.category, result.safetyScore);
      }
    };

    tick();
    const id = setInterval(tick, intervalMs);
    return () => clearInterval(id);
  }, [foodId, timePrepared, storageCondition, temperature, foodSubtypeId, status, intervalMs, isDelivered]);

  const liveCategory = isDelivered ? currentCategory : liveResult.category;
  const originalRank = CATEGORY_ORDER.indexOf(currentCategory);
  const liveRank     = CATEGORY_ORDER.indexOf(liveCategory);

  return {
    liveCategory,
    safetyScore:     liveResult.safetyScore,
    degradationRate: liveResult.degradationRate,
    categoryInfo:    getCategoryInfo(liveCategory),
    hasDegraded:     liveRank < originalRank,
    lastChecked:     new Date(),
  };
}
