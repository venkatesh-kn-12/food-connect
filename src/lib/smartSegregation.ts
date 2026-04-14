/**
 * Smart Food Segregation Algorithm
 * 
 * Categorizes surplus food into:
 * 1. Human Consumption - safe, fresh food
 * 2. Animal Feed - slightly past prime but safe for animals
 * 3. Biogas Production - decomposing organic matter
 * 4. Compost / Recycling - unusable food waste
 * 
 * Decision factors: food type, time since preparation,
 * storage condition, temperature, and safety risk
 */

import { Enums } from '@/integrations/supabase/types';

type FoodCategory = Enums<'food_category'>;
type FoodType = Enums<'food_type'>;

interface SegregationInput {
  foodType: FoodType;
  hoursSincePrepared: number;
  storageCondition: 'refrigerated' | 'room-temp' | 'frozen';
  temperature: number; // celsius
}

interface SegregationResult {
  category: FoodCategory;
  safetyScore: number;
  reason: string;
}

export function categorizeFoodItem(input: SegregationInput): SegregationResult {
  const { foodType, hoursSincePrepared, storageCondition, temperature } = input;

  // Calculate safety score (0-100, higher = safer)
  let safetyScore = 100;

  // Time decay: food loses safety over time
  if (storageCondition === 'frozen') {
    safetyScore -= hoursSincePrepared * 0.5; // Very slow decay
  } else if (storageCondition === 'refrigerated') {
    safetyScore -= hoursSincePrepared * 2; // Moderate decay
  } else {
    safetyScore -= hoursSincePrepared * 5; // Fast decay at room temp
  }

  // Non-veg spoils faster
  if (foodType === 'non-veg') {
    safetyScore -= 10;
  }

  // Temperature risk: danger zone is 4°C - 60°C
  if (temperature > 4 && temperature < 60 && storageCondition === 'room-temp') {
    safetyScore -= 15;
  }

  // High temperature accelerates spoilage
  if (temperature > 35) {
    safetyScore -= 10;
  }

  // Clamp score
  safetyScore = Math.max(0, Math.min(100, safetyScore));

  // Categorize based on safety score
  if (safetyScore >= 70) {
    return {
      category: 'human-consumption',
      safetyScore,
      reason: 'Food is fresh or medium fresh.',
    };
  } else if (safetyScore >= 45) {
    return {
      category: 'animal-feed',
      safetyScore,
      reason: 'Food is below medium quality.',
    };
  } else if (safetyScore >= 20) {
    return {
      category: 'biogas',
      safetyScore,
      reason: 'Food is in the completely worst state.',
    };
  } else {
    return {
      category: 'compost',
      safetyScore,
      reason: 'Food waste is in the completely worst state.',
    };
  }
}

/** Returns human-readable label and color token for a category */
export function getCategoryInfo(category: FoodCategory) {
  switch (category) {
    case 'human-consumption':
      return { label: 'Suitable for humans', color: 'bg-primary text-primary-foreground', icon: '🍽️' };
    case 'animal-feed':
      return { label: 'Suitable for animals', color: 'bg-warning text-secondary-foreground', icon: '🐄' };
    case 'biogas':
      return { label: 'Suitable for bio gas', color: 'bg-biogas text-primary-foreground', icon: '⚡' };
    case 'compost':
      return { label: 'Suitable for bio gas', color: 'bg-compost text-primary-foreground', icon: '♻️' };
  }
}
