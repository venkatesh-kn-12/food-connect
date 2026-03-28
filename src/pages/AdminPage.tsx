import { useFoodStore } from '@/lib/foodStore';
import StatsCard from '@/components/StatsCard';
import { CategoryBadge, StatusBadge } from '@/components/Badges';
import { motion } from 'framer-motion';
import { Users, Truck, Heart, Leaf, Zap, BarChart3, ShieldCheck, Recycle } from 'lucide-react';

export default function AdminPage() {
  const { stats, foodItems, distributions } = useFoodStore();

  const categoryBreakdown = {
    human: foodItems.filter(f => f.category === 'human-consumption').length,
    animal: foodItems.filter(f => f.category === 'animal-feed').length,
    biogas: foodItems.filter(f => f.category === 'biogas').length,
    compost: foodItems.filter(f => f.category === 'compost').length,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>
        <p className="text-muted-foreground text-sm">System overview & analytics</p>
      </div>

      {/* Primary stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title="Food Collected" value={`${stats.totalFoodCollected} kg`} icon={<BarChart3 className="w-5 h-5 text-primary" />} />
        <StatsCard title="People Fed" value={stats.peopleFed} icon={<Heart className="w-5 h-5 text-destructive" />} accent="bg-destructive/10" description="Meals served" />
        <StatsCard title="Animals Fed" value={stats.animalsFed} icon={<span className="text-lg">🐄</span>} accent="bg-warning/10" />
        <StatsCard title="CO₂ Reduced" value={`${stats.co2Reduced} kg`} icon={<Leaf className="w-5 h-5 text-primary" />} description="Emissions prevented" />
      </div>

      {/* Secondary stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title="Biogas Produced" value={`${stats.biogasProduced} kg`} icon={<Zap className="w-5 h-5 text-biogas" />} accent="bg-biogas/10" />
        <StatsCard title="Active Donors" value={stats.activeDonors} icon={<Users className="w-5 h-5 text-primary" />} />
        <StatsCard title="Active Volunteers" value={stats.activeVolunteers} icon={<Truck className="w-5 h-5 text-info" />} accent="bg-info/10" />
        <StatsCard title="Active Receivers" value={stats.activeReceivers} icon={<ShieldCheck className="w-5 h-5 text-success" />} accent="bg-success/10" />
      </div>

      {/* Category breakdown */}
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

      {/* Recent activity */}
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
                <th className="pb-2 font-medium">Status</th>
                <th className="pb-2 font-medium">Safety</th>
              </tr>
            </thead>
            <tbody>
              {foodItems.map(item => (
                <tr key={item.id} className="border-b border-border/50">
                  <td className="py-3 font-medium text-foreground">{item.foodName}</td>
                  <td className="py-3 text-muted-foreground">{item.donorName}</td>
                  <td className="py-3 text-muted-foreground">{item.quantity}</td>
                  <td className="py-3"><CategoryBadge category={item.category} /></td>
                  <td className="py-3"><StatusBadge status={item.status} /></td>
                  <td className="py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-2 rounded-full bg-muted overflow-hidden">
                        <div className="h-full rounded-full bg-primary" style={{ width: `${item.safetyScore}%` }} />
                      </div>
                      <span className="text-xs text-muted-foreground">{item.safetyScore}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* SDG alignment */}
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
