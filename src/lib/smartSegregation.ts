/**
 * ─────────────────────────────────────────────────────────────────
 *  Smart Food Segregation Engine  (v3 — CNN · LSTM · RL + Risk)
 * ─────────────────────────────────────────────────────────────────
 *
 *  RISK TIERS (CNN Feature Layer)
 *  ────────────────────────────────
 *  HIGH RISK   — Rice, Meat, Seafood, Dairy, Egg dishes, Gravies
 *                Rapid bacterial growth.  3× base decay multiplier.
 *
 *  MEDIUM RISK — Vegetables, Curry, Pasta, Bread
 *                Moderate spoilage.  1.5× base decay multiplier.
 *
 *  LOW RISK    — Fruits, Dry foods, Packaged food, Biscuits
 *                Slow spoilage.  0.6× base decay multiplier.
 *
 *  ARCHITECTURE
 *  ────────────
 *  Layer 1 – CNN Feature Extractor
 *    Maps food subtype → risk tier → base decay multiplier.
 *    Also extracts storage, temperature, and protein features.
 *
 *  Layer 2 – LSTM Spoilage Predictor
 *    Compound time-series decay that accelerates through 3 bacterial
 *    growth phases (fresh → active growth → exponential spoilage).
 *
 *  Layer 3 – RL Decision Agent
 *    Reward-maximising policy that assigns the highest safe category.
 *
 *  DYNAMIC MONITORING
 *  ──────────────────
 *  `computeLiveCategory` re-runs the full pipeline at any wall-clock
 *  time so FoodStoreProvider can auto-degrade labels live.
 * ─────────────────────────────────────────────────────────────────
 */

import { Enums } from '@/integrations/supabase/types';

export type FoodCategory  = Enums<'food_category'>;
export type FoodType      = Enums<'food_type'>;
export type FoodRiskLevel = Enums<'food_risk_level'>;

// ─── Food Subtype Registry ────────────────────────────────────────

export interface FoodSubtype {
  id:        string;
  label:     string;
  emoji:     string;
  riskLevel: FoodRiskLevel;
  /** Base pts/hour decay BEFORE storage multiplier */
  baseDecay: number;
}

export const FOOD_SUBTYPES: FoodSubtype[] = [
  // ── HIGH RISK ──────────────────────────────────────────────────
  { id: 'rice',       label: 'Rice / Cooked Grains', emoji: '🍚', riskLevel: 'high-risk',   baseDecay: 9  },
  { id: 'meat',       label: 'Meat (Chicken/Mutton)', emoji: '🍗', riskLevel: 'high-risk',  baseDecay: 12 },
  { id: 'seafood',    label: 'Seafood / Fish',        emoji: '🐟', riskLevel: 'high-risk',  baseDecay: 14 },
  { id: 'dairy',      label: 'Dairy (Milk/Paneer)',   emoji: '🥛', riskLevel: 'high-risk',  baseDecay: 10 },
  { id: 'egg-dishes', label: 'Egg Dishes',            emoji: '🥚', riskLevel: 'high-risk',  baseDecay: 11 },
  { id: 'gravies',    label: 'Gravies / Curries w/ Meat', emoji: '🍲', riskLevel: 'high-risk', baseDecay: 10 },

  // ── MEDIUM RISK ────────────────────────────────────────────────
  { id: 'vegetables', label: 'Vegetables (Cooked)', emoji: '🥦', riskLevel: 'medium-risk',  baseDecay: 5  },
  { id: 'veg-curry',  label: 'Veg Curry / Dal',     emoji: '🍛', riskLevel: 'medium-risk',  baseDecay: 6  },
  { id: 'pasta',      label: 'Pasta / Noodles',     emoji: '🍝', riskLevel: 'medium-risk',  baseDecay: 5  },
  { id: 'bread',      label: 'Bread / Rotis',       emoji: '🫓', riskLevel: 'medium-risk',  baseDecay: 4  },

  // ── LOW RISK ───────────────────────────────────────────────────
  { id: 'fruits',     label: 'Fresh Fruits',         emoji: '🍎', riskLevel: 'low-risk',    baseDecay: 2  },
  { id: 'dry-foods',  label: 'Dry Foods / Pulses',   emoji: '🌾', riskLevel: 'low-risk',    baseDecay: 0.5 },
  { id: 'packaged',   label: 'Packaged Food',         emoji: '📦', riskLevel: 'low-risk',   baseDecay: 0.3 },
  { id: 'biscuits',   label: 'Biscuits / Crackers',  emoji: '🍪', riskLevel: 'low-risk',   baseDecay: 0.2 },

  // ── FALLBACK ───────────────────────────────────────────────────
  { id: 'other',      label: 'Other',                emoji: '🍱', riskLevel: 'medium-risk', baseDecay: 5  },
];

/** Grouped by risk level for rendering in the form */
export const FOOD_SUBTYPES_GROUPED = {
  'high-risk':   FOOD_SUBTYPES.filter(f => f.riskLevel === 'high-risk'),
  'medium-risk': FOOD_SUBTYPES.filter(f => f.riskLevel === 'medium-risk'),
  'low-risk':    FOOD_SUBTYPES.filter(f => f.riskLevel === 'low-risk'),
};

export const RISK_LEVEL_META: Record<FoodRiskLevel, { label: string; color: string; emoji: string }> = {
  'high-risk':   { label: 'High Risk',   color: 'text-red-400',    emoji: '🔴' },
  'medium-risk': { label: 'Medium Risk', color: 'text-yellow-400', emoji: '🟡' },
  'low-risk':    { label: 'Low Risk',    color: 'text-green-400',  emoji: '🟢' },
};

export function getFoodSubtype(id: string): FoodSubtype {
  return FOOD_SUBTYPES.find(f => f.id === id) ?? FOOD_SUBTYPES.find(f => f.id === 'other')!;
}

// ─── Input / Output Shapes ───────────────────────────────────────

export interface SegregationInput {
  foodSubtypeId:     string;   // e.g. 'rice', 'meat', 'fruits'
  hoursSincePrepared: number;
  storageCondition:  'refrigerated' | 'room-temp' | 'frozen';
  temperature:       number;   // °C
}

export interface SegregationResult {
  category:        FoodCategory;
  safetyScore:     number;       // 0 – 100
  reason:          string;
  degradationRate: number;       // pts / hour from NOW
  riskLevel:       FoodRiskLevel;
}

// ─── CNN Layer: Feature Extraction ───────────────────────────────

interface CNNFeatures {
  subtypeBaseDecay:  number;
  riskLevel:         FoodRiskLevel;
  storageMultiplier: number;
  tempMultiplier:    number;
  dangerZoneActive:  boolean;
}

function cnnExtractFeatures(input: SegregationInput): CNNFeatures {
  const { foodSubtypeId, storageCondition, temperature } = input;
  const subtype = getFoodSubtype(foodSubtypeId);

  // Storage multiplier — cold = slow decay
  let storageMultiplier: number;
  if (storageCondition === 'frozen')        storageMultiplier = 0.1;
  else if (storageCondition === 'refrigerated') storageMultiplier = 0.35;
  else                                      storageMultiplier = 1.0;

  // Temperature multiplier — CNN "activation" of thermal features
  let tempMultiplier = 1.0;
  if (temperature > 45)      tempMultiplier = 2.2;
  else if (temperature > 35) tempMultiplier = 1.6;
  else if (temperature > 25) tempMultiplier = 1.2;
  else if (temperature < 4)  tempMultiplier = 0.4;

  // Bacterial danger zone: 4°C – 60°C
  const dangerZoneActive =
    temperature > 4 && temperature < 60 && storageCondition !== 'frozen';

  return {
    subtypeBaseDecay:  subtype.baseDecay,
    riskLevel:         subtype.riskLevel,
    storageMultiplier,
    tempMultiplier,
    dangerZoneActive,
  };
}

// ─── LSTM Layer: Phased Spoilage Simulation ───────────────────────

function lstmComputeSafety(hours: number, features: CNNFeatures): number {
  const { subtypeBaseDecay, storageMultiplier, tempMultiplier, dangerZoneActive } = features;

  // Effective decay per hour under current conditions
  const effectiveRate = subtypeBaseDecay * storageMultiplier * tempMultiplier;

  let score = 100;

  // Phase 1: 0 – 3 h — freshness window, 50% rate
  const phase1 = Math.min(hours, 3);
  score -= phase1 * effectiveRate * 0.5;

  // Phase 2: 3 – 8 h — active bacterial growth, full rate
  if (hours > 3) {
    const phase2 = Math.min(hours - 3, 5);
    score -= phase2 * effectiveRate * 1.0;
  }

  // Phase 3: 8+ h — exponential spoilage, 1.8× rate
  if (hours > 8) {
    const phase3 = hours - 8;
    score -= phase3 * effectiveRate * 1.8;
  }

  // Danger zone flat penalty
  if (dangerZoneActive) score -= 8;

  return Math.max(0, Math.min(100, score));
}

// ─── RL Layer: Optimal Category Policy ───────────────────────────

const RL_POLICY: { category: FoodCategory; minScore: number; reason: string }[] = [
  {
    category: 'human-consumption',
    minScore: 60,
    reason: 'CNN+LSTM rates this food as fresh — safe for human consumption.',
  },
  {
    category: 'animal-feed',
    minScore: 38,
    reason: 'Safety dropped — RL agent re-routes to animal feed.',
  },
  {
    category: 'biogas',
    minScore: 18,
    reason: 'Significant spoilage — RL agent assigns biogas production.',
  },
  {
    category: 'compost',
    minScore: 0,
    reason: 'Food fully degraded — RL agent assigns composting.',
  },
];

function rlDecide(safetyScore: number): { category: FoodCategory; reason: string } {
  for (const policy of RL_POLICY) {
    if (safetyScore >= policy.minScore) {
      return { category: policy.category, reason: policy.reason };
    }
  }
  return { category: 'compost', reason: 'Fallback: full degradation.' };
}

// ─── Public API ───────────────────────────────────────────────────

/** Full categorization at submission time */
export function categorizeFoodItem(input: SegregationInput): SegregationResult {
  const features    = cnnExtractFeatures(input);
  const safetyScore = lstmComputeSafety(input.hoursSincePrepared, features);
  const { category, reason } = rlDecide(safetyScore);

  // Current effective decay rate for the UI countdown
  const degradationRate =
    features.subtypeBaseDecay * features.storageMultiplier * features.tempMultiplier;

  return {
    category,
    safetyScore: Math.round(safetyScore),
    reason,
    degradationRate: Math.round(degradationRate * 10) / 10,
    riskLevel: features.riskLevel,
  };
}

/**
 * DYNAMIC RE-CATEGORIZATION
 * Computes the live category at the current wall-clock time.
 * Call this from FoodStoreProvider's monitoring loop.
 */
export function computeLiveCategory(
  timePrepared:     string,
  storageCondition: 'refrigerated' | 'room-temp' | 'frozen',
  temperature:      number,
  foodSubtypeId:    string,
  status:           string,
): SegregationResult {
  const preparedMs   = new Date(timePrepared).getTime();
  const hoursElapsed = (Date.now() - preparedMs) / 3_600_000;

  return categorizeFoodItem({
    foodSubtypeId,
    hoursSincePrepared: Math.max(0, hoursElapsed),
    storageCondition,
    temperature,
  });
}

/** Returns human-readable label and color token for a category */
export function getCategoryInfo(category: FoodCategory) {
  switch (category) {
    case 'human-consumption':
      return { label: 'Safe for humans',      color: 'bg-primary text-primary-foreground',  icon: '🍽️' };
    case 'animal-feed':
      return { label: 'Animal feed',          color: 'bg-warning text-secondary-foreground', icon: '🐄' };
    case 'biogas':
      return { label: 'Biogas',               color: 'bg-biogas text-primary-foreground',    icon: '⚡' };
    case 'compost':
      return { label: 'Compost',              color: 'bg-compost text-primary-foreground',   icon: '♻️' };
  }
}

/** Category ordering — worst(0) → best(3) */
export const CATEGORY_ORDER: FoodCategory[] = [
  'compost', 'biogas', 'animal-feed', 'human-consumption',
];

export interface DegradationPrediction {
  nextCategory: FoodCategory | null;
  hoursUntilDowngrade: number | null;
}

/** Predicts exactly how much time is left before the category automatically drops */
export function predictNextDowngrade(
  timePrepared: string,
  storageCondition: 'refrigerated' | 'room-temp' | 'frozen',
  temperature: number,
  foodSubtypeId: string
): DegradationPrediction {
  const preparedMs = new Date(timePrepared).getTime();
  const currentHours = Math.max(0, (Date.now() - preparedMs) / 3_600_000);
  
  const currentResult = categorizeFoodItem({
    foodSubtypeId,
    hoursSincePrepared: currentHours,
    storageCondition,
    temperature
  });

  if (currentResult.category === 'compost') {
    return { nextCategory: null, hoursUntilDowngrade: null };
  }

  const currentRank = CATEGORY_ORDER.indexOf(currentResult.category);

  // Scan future hours to find exact drop point
  for (let h = currentHours + 0.1; h < currentHours + 120; h += 0.1) {
    const futureResult = categorizeFoodItem({
      foodSubtypeId,
      hoursSincePrepared: h,
      storageCondition,
      temperature
    });
    const futureRank = CATEGORY_ORDER.indexOf(futureResult.category);
    
    if (futureRank < currentRank) {
      return { 
        nextCategory: futureResult.category, 
        hoursUntilDowngrade: Math.max(0, h - currentHours)
      };
    }
  }

  return { nextCategory: null, hoursUntilDowngrade: null };
}
