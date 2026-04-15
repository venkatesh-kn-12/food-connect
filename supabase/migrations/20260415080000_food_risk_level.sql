-- ──────────────────────────────────────────────────────────────────
-- Migration: Food Risk Level & Subtype
-- Adds per-food-item risk classification to power the CNN/LSTM/RL
-- decay algorithm with food-specific spoilage rates.
-- ──────────────────────────────────────────────────────────────────

-- 1. New enum: risk tier
CREATE TYPE public.food_risk_level AS ENUM ('high-risk', 'medium-risk', 'low-risk');

-- 2. Add risk_level column (defaults to medium-risk for existing rows)
ALTER TABLE public.food_items
  ADD COLUMN food_risk_level public.food_risk_level NOT NULL DEFAULT 'medium-risk';

-- 3. Add food_subtype column (free-text slug, e.g. 'rice', 'meat', 'fruits')
ALTER TABLE public.food_items
  ADD COLUMN food_subtype TEXT NOT NULL DEFAULT 'other';
