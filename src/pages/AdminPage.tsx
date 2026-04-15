import { useFoodStore } from '@/lib/foodStore';
import StatsCard from '@/components/StatsCard';
import { CategoryBadge, StatusBadge } from '@/components/Badges';
import { getFoodSubtype, RISK_LEVEL_META } from '@/lib/smartSegregation';
import PredictionTimer from '@/components/PredictionTimer';
import { motion } from 'framer-motion';
import { Users, Truck, Heart, Leaf, Zap, BarChart3, ShieldCheck, Recycle } from 'lucide-react';

export default function AdminPage() {
  const { foodItems, distributions } = useFoodStore();

  const totalQuantity = foodItems.reduce((s, f) => s + f.quantity, 0);
  const humanItems = foodItems.filter(f => f.category === 'human-consumption');
  
  // Harmonized logic: Count quantity from items that are in a 'delivered' distribution
  const peopleFed = distributions
    .filter(d => d.status === 'delivered')
    .reduce((sum, d) => {
      const food = foodItems.find(f => f.id === d.food_id);
      return sum + (food?.quantity || 0);
    }, 0);

  const categoryBreakdown = {
    human: humanItems.length,
    animal: foodItems.filter(f => f.category === 'animal-feed').length,
    biogas: foodItems.filter(f => f.category === 'biogas').length,
    compost: foodItems.filter(f => f.category === 'compost').length,
  };

  const iotItems = foodItems.filter(f => f.donor_name?.startsWith('Smart Box'));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>
        <p className="text-muted-foreground text-sm">System overview & analytics</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title="Total Servings" value={totalQuantity} icon={<BarChart3 className="w-5 h-5 text-primary" />} />
        <StatsCard title="People Fed" value={peopleFed} icon={<Heart className="w-5 h-5 text-destructive" />} accent="bg-destructive/10" description="Meals served" />
        <StatsCard title="Animals Fed" value={categoryBreakdown.animal * 5} icon={<span className="text-lg">🐄</span>} accent="bg-warning/10" />
        <StatsCard title="CO₂ Reduced" value={`${Math.round(totalQuantity * 0.4)} kg`} icon={<Leaf className="w-5 h-5 text-primary" />} description="Emissions prevented" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title="Biogas Produced" value={`${categoryBreakdown.biogas * 2} kg`} icon={<Zap className="w-5 h-5 text-biogas" />} accent="bg-biogas/10" />
        <StatsCard title="Food Items" value={foodItems.length} icon={<Users className="w-5 h-5 text-primary" />} />
        <StatsCard title="Distributions" value={distributions.length} icon={<Truck className="w-5 h-5 text-info" />} accent="bg-info/10" />
        <StatsCard title="Delivered" value={distributions.filter(d => d.status === 'delivered').length} icon={<ShieldCheck className="w-5 h-5 text-success" />} accent="bg-success/10" />
        <StatsCard title="🤖 IoT Deposits" value={iotItems.length} icon={<span className="text-lg">📦</span>} accent="bg-biogas/10" description="Auto-detected" />
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        className="bg-card rounded-xl p-6 shadow-card border border-border">
        <h2 className="font-semibold text-lg text-foreground mb-4 flex items-center gap-2">
          <Recycle className="w-5 h-5 text-primary" /> Smart Segregation Breakdown
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { cat: 'human-consumption' as const, label: 'Human', count: categoryBreakdown.human, emoji: '🍽️', color: 'bg-primary/10 border-primary/20' },
            { cat: 'animal-feed' as const, label: 'Animal Feed', count: categoryBreakdown.animal, emoji: '🐄', color: 'bg-warning/10 border-warning/20' },
            { cat: 'biogas' as const, label: 'Biogas', count: categoryBreakdown.biogas, emoji: '⚡', color: 'bg-biogas/10 border-biogas/20' },
            { cat: 'compost' as const, label: 'Compost', count: categoryBreakdown.compost, emoji: '♻️', color: 'bg-compost/10 border-compost/20' },
          ].map(item => (
            <div key={item.cat} className={`rounded-xl p-4 border ${item.color} text-center`}>
              <span className="text-2xl">{item.emoji}</span>
              <p className="text-2xl font-bold text-foreground mt-1">{item.count}</p>
              <p className="text-xs text-muted-foreground">{item.label}</p>
            </div>
          ))}
        </div>
      </motion.div>

      <div className="bg-card rounded-xl p-6 shadow-card border border-border">
        <h2 className="font-semibold text-lg text-foreground mb-4">Recent Food Items</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-muted-foreground border-b border-border">
                <th className="pb-2 font-medium">Food</th>
                <th className="pb-2 font-medium">Donor</th>
                <th className="pb-2 font-medium">Qty</th>
                <th className="pb-2 font-medium">Category</th>
                <th className="pb-2 font-medium">Assigned Org</th>
                <th className="pb-2 font-medium">Status</th>
                <th className="pb-2 font-medium">Safety</th>
              </tr>
            </thead>
            <tbody>
              {foodItems.map(item => {
                const dist = distributions.find(d => d.food_id === item.id);
                const currentStatus = dist ? dist.status : item.status;
                const isDelivered = currentStatus === 'delivered';
                
                return (
                <tr key={item.id} className="border-b border-border/50">
                  <td className="py-3 font-medium text-foreground">
                    <span className="mr-1">{getFoodSubtype((item as any).food_subtype ?? 'other').emoji}</span>
                    {item.food_name}
                    {item.donor_name?.startsWith('Smart Box') && (
                      <span className="ml-1.5 text-xs font-bold bg-biogas/20 text-biogas border border-biogas/30 px-1.5 py-0.5 rounded-full">
                        🤖 IoT
                      </span>
                    )}
                  </td>
                  <td className="py-3 text-muted-foreground">{item.donor_name}</td>
                  <td className="py-3 text-muted-foreground">{item.quantity}</td>
                  <td className="py-3">
                    <div className="flex items-center gap-1.5">
                      <CategoryBadge category={item.category} safetyScore={item.safety_score} />
                      <div className="flex flex-col gap-1.5 mt-1">
                        <span className={`text-xs w-max ${RISK_LEVEL_META[getFoodSubtype((item as any).food_subtype ?? 'other').riskLevel]?.color ?? ''}`}>
                          {RISK_LEVEL_META[getFoodSubtype((item as any).food_subtype ?? 'other').riskLevel]?.emoji} {RISK_LEVEL_META[getFoodSubtype((item as any).food_subtype ?? 'other').riskLevel]?.label}
                        </span>
                        {!isDelivered && (
                          <PredictionTimer 
                             timePrepared={item.time_prepared}
                             storageCondition={item.storage_condition as any}
                             temperature={item.temperature}
                             foodSubtypeId={(item as any).food_subtype ?? 'other'}
                          />
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="py-3">
                    {dist?.receiver_name ? (
                      <span className="text-xs font-medium text-foreground bg-accent px-2 py-1 rounded-md">
                        {dist.receiver_name.replace('Org ', '')}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground italic">Unassigned</span>
                    )}
                  </td>
                  <td className="py-3">
                    {/* Look up distribution status if it exists */}
                    <StatusBadge status={currentStatus} />
                  </td>
                  <td className="py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-2 rounded-full bg-muted overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            item.safety_score >= 60 ? 'bg-primary' :
                            item.safety_score >= 38 ? 'bg-warning' :
                            item.safety_score >= 18 ? 'bg-biogas' : 'bg-compost'
                          }`}
                          style={{ width: `${item.safety_score}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground">{item.safety_score}</span>
                    </div>
                  </td>
                </tr>
              )})}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-card rounded-xl p-6 shadow-card border border-border">
        <h2 className="font-semibold text-lg text-foreground mb-3">🌍 SDG Alignment</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[
            { sdg: 'SDG 2', title: 'Zero Hunger', desc: 'Redistributing food to those in need' },
            { sdg: 'SDG 12', title: 'Responsible Consumption', desc: 'Reducing food waste through smart segregation' },
            { sdg: 'SDG 13', title: 'Climate Action', desc: 'Reducing CO₂ via biogas & composting' },
          ].map(s => (
            <div key={s.sdg} className="p-3 rounded-lg bg-accent/50 border border-border">
              <p className="text-sm font-bold text-primary">{s.sdg}</p>
              <p className="text-sm font-semibold text-foreground">{s.title}</p>
              <p className="text-xs text-muted-foreground">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
