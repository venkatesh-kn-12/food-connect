import { getCategoryInfo } from '@/lib/smartSegregation';
import { Enums } from '@/integrations/supabase/types';

type FoodCategory = Enums<'food_category'>;
type FoodStatus = Enums<'food_status'>;
type DistributionStatus = Enums<'distribution_status'>;
type AnyStatus = FoodStatus | DistributionStatus;

export function CategoryBadge({ category }: { category: FoodCategory }) {
  const info = getCategoryInfo(category);
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${info.color}`}>
      {info.icon} {info.label}
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
    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${statusColors[status] || 'bg-muted text-muted-foreground'}`}>
      {status.replace('-', ' ')}
    </span>
  );
}
