import { useState } from 'react';
import { useFoodStore } from '@/lib/foodStore';
import { useAuth } from '@/hooks/useAuth';
import { categorizeFoodItem } from '@/lib/smartSegregation';
import { CategoryBadge, StatusBadge } from '@/components/Badges';
import StatsCard from '@/components/StatsCard';
import { motion } from 'framer-motion';
import { Plus, Package, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function DonorPage() {
  const { foodItems, addFoodItem } = useFoodStore();
  const { user } = useAuth();
  const { toast } = useToast();
  const donorItems = foodItems.filter((f) => f.donor_id === user?.id);
  const [showForm, setShowForm] = useState(false);

  const [foodName, setFoodName] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [location, setLocation] = useState('');
  const [foodType, setFoodType] = useState<'veg' | 'non-veg'>('veg');
  const [hoursSince, setHoursSince] = useState(1);
  const [storage, setStorage] = useState<'refrigerated' | 'room-temp' | 'frozen'>('refrigerated');
  const [temperature, setTemperature] = useState(4);
  const [result, setResult] = useState<{ category: string; safetyScore: number; reason: string } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    const seg = categorizeFoodItem({ foodType, hoursSincePrepared: hoursSince, storageCondition: storage, temperature });
    setResult(seg);

    const now = new Date();
    try {
      await addFoodItem({
        donor_id: user.id,
        donor_name: user.user_metadata?.name || user.email || '',
        food_name: foodName,
        quantity,
        food_type: foodType,
        time_prepared: new Date(now.getTime() - hoursSince * 3600000).toISOString(),
        expiry_estimate: new Date(now.getTime() + 12 * 3600000).toISOString(),
        location: location || 'Unknown',
        category: seg.category as any,
        status: 'categorized',
        safety_score: seg.safetyScore,
        storage_condition: storage,
        temperature,
      });
      setFoodName('');
      setQuantity(1);
      setLocation('');
      setHoursSince(1);
      toast({ title: 'Food submitted successfully!' });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Food Donor Portal</h1>
          <p className="text-muted-foreground text-sm">Submit surplus food for redistribution</p>
        </div>
        <button
          onClick={() => { setShowForm(!showForm); setResult(null); }}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition"
        >
          <Plus className="w-4 h-4" /> Donate Food
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatsCard title="Total Donated" value={donorItems.length} icon={<Package className="w-5 h-5 text-primary" />} />
        <StatsCard title="For Humans" value={donorItems.filter(f => f.category === 'human-consumption').length} icon={<span>🍽️</span>} accent="bg-success/10" />
        <StatsCard title="Recycled" value={donorItems.filter(f => f.category !== 'human-consumption').length} icon={<span>♻️</span>} accent="bg-warning/10" />
      </div>

      {showForm && (
        <motion.form
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          onSubmit={handleSubmit}
          className="bg-card rounded-xl p-6 shadow-card border border-border space-y-4"
        >
          <h2 className="font-semibold text-lg text-foreground">Submit Surplus Food</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Food Name</label>
              <input value={foodName} onChange={e => setFoodName(e.target.value)} required
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" placeholder="e.g. Vegetable Curry" />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Quantity (servings)</label>
              <input type="number" min={1} value={quantity} onChange={e => setQuantity(+e.target.value)}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Location (Address/Area)</label>
              <input value={location} onChange={e => setLocation(e.target.value)} required
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" placeholder="e.g. 123 Main St" />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Food Type</label>
              <select value={foodType} onChange={e => setFoodType(e.target.value as any)}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
                <option value="veg">🥬 Vegetarian</option>
                <option value="non-veg">🍗 Non-Vegetarian</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Hours Since Prepared</label>
              <input type="number" min={0} value={hoursSince} onChange={e => setHoursSince(+e.target.value)}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Storage Condition</label>
              <select value={storage} onChange={e => setStorage(e.target.value as any)}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
                <option value="frozen">❄️ Frozen</option>
                <option value="refrigerated">🧊 Refrigerated</option>
                <option value="room-temp">🌡️ Room Temperature</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Temperature (°C)</label>
              <input type="number" value={temperature} onChange={e => setTemperature(+e.target.value)}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
            </div>
          </div>
          <button type="submit" className="px-6 py-2 rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition">
            Submit & Categorize
          </button>

          {result && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="mt-4 p-4 rounded-lg bg-accent/50 border border-border">
              <p className="text-sm font-medium text-foreground mb-2">🤖 Smart Segregation Result:</p>
              <div className="flex items-center gap-3 mb-2">
                <CategoryBadge category={result.category as any} />
                <span className="text-sm text-muted-foreground">Safety Score: <strong>{result.safetyScore}/100</strong></span>
              </div>
              <p className="text-sm text-muted-foreground">{result.reason}</p>
            </motion.div>
          )}
        </motion.form>
      )}

      <div className="space-y-3">
        <h2 className="font-semibold text-lg text-foreground">Your Donations</h2>
        {donorItems.length === 0 ? (
          <p className="text-muted-foreground text-sm">No donations yet. Click "Donate Food" to get started!</p>
        ) : (
          donorItems.map((item) => (
            <div key={item.id} className="bg-card rounded-xl p-4 shadow-card border border-border flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-foreground">{item.food_name}</span>
                  <span className="text-xs text-muted-foreground">{item.food_type === 'veg' ? '🥬' : '🍗'}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="w-3 h-3" /> {new Date(item.created_at).toLocaleString()}
                  <span>•</span>
                  <span>{item.quantity} servings</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <CategoryBadge category={item.category} />
                <StatusBadge status={item.status} />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
