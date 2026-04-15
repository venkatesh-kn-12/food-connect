import { useState } from 'react';
import { useFoodStore } from '@/lib/foodStore';
import { useAuth } from '@/hooks/useAuth';
import {
  categorizeFoodItem,
  FOOD_SUBTYPES_GROUPED,
  RISK_LEVEL_META,
  getFoodSubtype,
  FoodRiskLevel,
} from '@/lib/smartSegregation';
import { CategoryBadge, StatusBadge } from '@/components/Badges';
import StatsCard from '@/components/StatsCard';
import { motion } from 'framer-motion';
import { Plus, Package, Clock, AlertTriangle, ShieldCheck, Leaf } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const RISK_ICONS: Record<FoodRiskLevel, React.ReactNode> = {
  'high-risk':   <AlertTriangle className="w-3.5 h-3.5 text-red-400" />,
  'medium-risk': <ShieldCheck   className="w-3.5 h-3.5 text-yellow-400" />,
  'low-risk':    <Leaf          className="w-3.5 h-3.5 text-green-400" />,
};

const RISK_GROUP_LABELS: Record<FoodRiskLevel, string> = {
  'high-risk':   '🔴 High Risk — Spoils Very Fast',
  'medium-risk': '🟡 Medium Risk — Moderate Spoilage',
  'low-risk':    '🟢 Low Risk — Slow Spoilage',
};

export default function DonorPage() {
  const { foodItems, addFoodItem } = useFoodStore();
  const { user } = useAuth();
  const { toast } = useToast();
  const donorItems = foodItems.filter((f) => f.donor_id === user?.id);
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [foodName, setFoodName]         = useState('');
  const [quantity, setQuantity]         = useState(1);
  const [location, setLocation]         = useState('');
  const [foodSubtypeId, setFoodSubtypeId] = useState('rice');
  const [hoursSince, setHoursSince]     = useState(1);
  const [storage, setStorage]           = useState<'refrigerated' | 'room-temp' | 'frozen'>('refrigerated');
  const [temperature, setTemperature]   = useState(4);
  const [result, setResult]             = useState<ReturnType<typeof categorizeFoodItem> | null>(null);

  // Derived subtype info for live risk display
  const selectedSubtype = getFoodSubtype(foodSubtypeId);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;

    const seg = categorizeFoodItem({
      foodSubtypeId,
      hoursSincePrepared: hoursSince,
      storageCondition: storage,
      temperature,
    });
    setResult(seg);

    const now = new Date();
    try {
      await addFoodItem({
        donor_id:          user.id,
        donor_name:        user.user_metadata?.name || user.email || '',
        food_name:         foodName,
        quantity,
        food_type:         selectedSubtype.riskLevel === 'high-risk' ? 'non-veg' : 'veg',
        food_subtype:      foodSubtypeId,
        food_risk_level:   selectedSubtype.riskLevel,
        time_prepared:     new Date(now.getTime() - hoursSince * 3_600_000).toISOString(),
        expiry_estimate:   new Date(now.getTime() + 12 * 3_600_000).toISOString(),
        location:          location || 'Unknown',
        category:          seg.category as any,
        status:            'categorized',
        safety_score:      seg.safetyScore,
        storage_condition: storage,
        temperature,
      } as any);
      setFoodName('');
      setQuantity(1);
      setLocation('');
      setHoursSince(1);
      setStorage('refrigerated');
      setTemperature(4);
      setFoodSubtypeId('rice');
      setResult(null);
      setShowForm(false);
      toast({ title: 'Food submitted & categorised by AI!' });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Food Donor Portal</h1>
          <p className="text-muted-foreground text-sm">Submit surplus food — AI classifies & monitors automatically</p>
        </div>
        <button
          onClick={() => { setShowForm(!showForm); setResult(null); }}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition"
        >
          <Plus className="w-4 h-4" /> Donate Food
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatsCard title="Total Donated"   value={donorItems.length} icon={<Package className="w-5 h-5 text-primary" />} />
        <StatsCard title="For Humans"      value={donorItems.filter(f => f.category === 'human-consumption').length} icon={<span>🍽️</span>} accent="bg-success/10" />
        <StatsCard title="Re-used / Recycled" value={donorItems.filter(f => f.category !== 'human-consumption').length} icon={<span>♻️</span>} accent="bg-warning/10" />
      </div>

      {/* Donation Form */}
      {showForm && (
        <motion.form
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          onSubmit={handleSubmit}
          className="bg-card rounded-xl p-6 shadow-card border border-border space-y-5"
        >
          <h2 className="font-semibold text-lg text-foreground">Submit Surplus Food</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Food Name */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Food Name</label>
              <input
                value={foodName} onChange={e => setFoodName(e.target.value)} required
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                placeholder="e.g. Chicken Biryani"
              />
            </div>

            {/* Quantity */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Quantity (servings)</label>
              <input
                type="number" min={1} value={quantity} onChange={e => setQuantity(+e.target.value)}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
              />
            </div>

            {/* Location */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-foreground mb-1">Pickup Location</label>
              <input
                value={location} onChange={e => setLocation(e.target.value)} required
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                placeholder="e.g. 123 Main St, Hyderabad"
              />
            </div>

            {/* Food Subtype — grouped select */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-foreground mb-1">
                Food Type
                {selectedSubtype && (
                  <span className={`ml-2 text-xs font-normal ${RISK_LEVEL_META[selectedSubtype.riskLevel].color}`}>
                    {RISK_ICONS[selectedSubtype.riskLevel]}{' '}
                    {RISK_LEVEL_META[selectedSubtype.riskLevel].label}
                  </span>
                )}
              </label>
              <select
                value={foodSubtypeId}
                onChange={e => setFoodSubtypeId(e.target.value)}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
              >
                {(['high-risk', 'medium-risk', 'low-risk'] as FoodRiskLevel[]).map(risk => (
                  <optgroup key={risk} label={RISK_GROUP_LABELS[risk]}>
                    {FOOD_SUBTYPES_GROUPED[risk].map(sub => (
                      <option key={sub.id} value={sub.id}>
                        {sub.emoji} {sub.label}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>

              {/* Risk indicator bar */}
              <div className="mt-2 flex items-center gap-2">
                <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      selectedSubtype.riskLevel === 'high-risk'   ? 'w-full bg-red-400' :
                      selectedSubtype.riskLevel === 'medium-risk' ? 'w-2/3 bg-yellow-400' :
                                                                    'w-1/4 bg-green-400'
                    }`}
                  />
                </div>
                <span className="text-xs text-muted-foreground">
                  Decay: {selectedSubtype.baseDecay} pts/hr base
                </span>
              </div>
            </div>

            {/* Hours since prepared */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Hours Since Prepared</label>
              <input
                type="number" min={0} value={hoursSince} onChange={e => setHoursSince(+e.target.value)}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
              />
            </div>

            {/* Storage condition */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Storage Condition</label>
              <select
                value={storage} 
                onChange={(e) => {
                  const val = e.target.value as any;
                  setStorage(val);
                  if (val === 'room-temp') setTemperature(25);
                  if (val === 'refrigerated') setTemperature(4);
                  if (val === 'frozen') setTemperature(-18);
                }}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="frozen">❄️ Frozen</option>
                <option value="refrigerated">🧊 Refrigerated</option>
                <option value="room-temp">🌡️ Room Temperature</option>
              </select>
            </div>

            {/* Temperature */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Temperature (°C)</label>
              <input
                type="number" value={temperature} onChange={e => setTemperature(+e.target.value)}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
              />
            </div>
          </div>

          <button type="submit" className="px-6 py-2 rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition">
            Submit &amp; Categorise via AI
          </button>

          {/* AI Result Panel */}
          {result && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="mt-2 p-4 rounded-xl bg-accent/50 border border-border space-y-3"
            >
              <p className="text-sm font-semibold text-foreground">🤖 CNN · LSTM · RL Result</p>

              <div className="flex flex-wrap items-center gap-3">
                <CategoryBadge category={result.category} safetyScore={result.safetyScore} />
                <span className={`text-xs font-medium ${RISK_LEVEL_META[result.riskLevel].color}`}>
                  {RISK_LEVEL_META[result.riskLevel].emoji} {RISK_LEVEL_META[result.riskLevel].label}
                </span>
                <span className="text-xs text-muted-foreground">
                  Decay: <strong>{result.degradationRate} pts/hr</strong>
                </span>
              </div>

              <p className="text-sm text-muted-foreground">{result.reason}</p>

              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      result.safetyScore >= 60 ? 'bg-primary' :
                      result.safetyScore >= 38 ? 'bg-warning' :
                      result.safetyScore >= 18 ? 'bg-biogas'  : 'bg-compost'
                    }`}
                    style={{ width: `${result.safetyScore}%` }}
                  />
                </div>
                <span className="text-xs text-muted-foreground w-12 text-right">{result.safetyScore}/100</span>
              </div>

              <p className="text-xs text-muted-foreground opacity-70">
                ⏱ Label will auto-downgrade if not collected in time.
              </p>
            </motion.div>
          )}
        </motion.form>
      )}

      {/* Donation list */}
      <div className="space-y-3">
        <h2 className="font-semibold text-lg text-foreground">Your Donations</h2>
        {donorItems.length === 0 ? (
          <p className="text-muted-foreground text-sm">No donations yet. Click "Donate Food" to get started!</p>
        ) : (
          donorItems.map((item) => {
            const subtype = getFoodSubtype((item as any).food_subtype ?? 'other');
            return (
              <div key={item.id} className="bg-card rounded-xl p-4 shadow-card border border-border flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-base">{subtype.emoji}</span>
                    <span className="font-semibold text-foreground">{item.food_name}</span>
                    <span className={`text-xs ${RISK_LEVEL_META[subtype.riskLevel].color}`}>
                      {RISK_LEVEL_META[subtype.riskLevel].emoji}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    {new Date(item.created_at).toLocaleString()}
                    <span>•</span>
                    <span>{item.quantity} servings</span>
                    <span>•</span>
                    <span>{subtype.label}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <CategoryBadge category={item.category} safetyScore={item.safety_score} />
                  <StatusBadge status={item.status} />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
