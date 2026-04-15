import { getCategoryInfo } from '@/lib/smartSegregation';
import { Enums } from '@/integrations/supabase/types';

type FoodCategory = Enums<'food_category'>;
type FoodStatus = Enums<'food_status'>;
type DistributionStatus = Enums<'distribution_status'>;
type AnyStatus = FoodStatus | DistributionStatus;

interface CategoryBadgeProps {
  category:          FoodCategory;
  /** If provided, shows a downgrade warning pulse when live !== original */
  originalCategory?: FoodCategory;
  safetyScore?:      number;
}

const CATEGORY_ORDER: FoodCategory[] = ['compost', 'biogas', 'animal-feed', 'human-consumption'];

export function CategoryBadge({ category, originalCategory, safetyScore }: CategoryBadgeProps) {
  const info = getCategoryInfo(category);

  const hasDegraded =
    originalCategory !== undefined &&
    CATEGORY_ORDER.indexOf(category) < CATEGORY_ORDER.indexOf(originalCategory);

  return (
    <span
      className={[
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold',
        info.color,
        hasDegraded ? 'ring-2 ring-offset-1 ring-orange-400 animate-pulse' : '',
      ].join(' ')}
      title={hasDegraded ? `⚠️ Downgraded from ${originalCategory} due to spoilage` : undefined}
    >
      {info.icon} {info.label}
      {safetyScore !== undefined && (
        <span className="ml-1 opacity-75 font-normal">{safetyScore}%</span>
      )}
      {hasDegraded && (
        <span className="ml-0.5 text-orange-300 text-[10px]">▼</span>
      )}
    </span>
  );
}

const statusColors: Record<string, string> = {
  submitted: 'bg-muted text-muted-foreground',
  categorized: 'bg-info/15 text-info',
  assigned: 'bg-warning/15 text-warning',
  'picked-up': 'bg-primary/15 text-primary',
  delivered: 'bg-success/15 text-success',
  completed: 'bg-accent text-accent-foreground',
  pending: 'bg-warning/15 text-warning',
  'in-transit': 'bg-info/15 text-info',
};

export function StatusBadge({ status }: { status: AnyStatus }) {
  return (
    <span
      className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${statusColors[status] || 'bg-muted text-muted-foreground'}`}
    >
      {status.replace('-', ' ')}
    </span>
  );
}
