import { useState } from 'react';
import { useFoodStore } from '@/lib/foodStore';
import { useAuth } from '@/hooks/useAuth';
import { CategoryBadge } from '@/components/Badges';
import StatsCard from '@/components/StatsCard';
import { Heart, CheckCircle, Package, Building2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { RECEIVER_ORGANIZATIONS } from '@/lib/organizations';

export default function ReceiverPage() {
  const { foodItems, distributions, updateFoodItem, updateDistribution } = useFoodStore();
  const { user } = useAuth();
  const { toast } = useToast();

  // For the demo, let the receiver switch between different organizations
  const [activeOrgId, setActiveOrgId] = useState<string>(RECEIVER_ORGANIZATIONS[0].id);
  const activeOrg = RECEIVER_ORGANIZATIONS.find(org => org.id === activeOrgId)!;

  // Filter deliveries meant for the currently active organization
  const incomingDists = distributions.filter(d => 
    d.receiver_id === activeOrg.id || d.receiver_name === activeOrg.name
  );
  
  const confirmedItems = incomingDists.filter(d => {
    const food = foodItems.find(f => f.id === d.food_id);
    return food?.status === 'completed';
  });

  async function handleConfirmReceived(distId: string, foodId: string) {
    try {
      // The food item status 'completed' is the ACTUAL confirmation marker
      await updateFoodItem(foodId, { status: 'completed' });
      toast({ title: 'Receipt Confirmed' });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Receiver Portal</h1>
          <p className="text-muted-foreground text-sm">View & accept incoming food deliveries</p>
        </div>

        {/* Demo Organization Switcher */}
        <div className="bg-card border border-border rounded-lg p-2 flex items-center gap-3">
          <div className="flex items-center gap-2 px-2 border-r border-border">
            <Building2 className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Active Org</span>
          </div>
          <select 
            value={activeOrgId} 
            onChange={e => setActiveOrgId(e.target.value)}
            className="bg-transparent border-none text-sm font-semibold focus:ring-0 cursor-pointer outline-none w-48"
          >
            {RECEIVER_ORGANIZATIONS.map(org => (
              <option key={org.id} value={org.id}>
                {org.emoji} {org.name} ({org.category})
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatsCard title="Incoming Deliveries" value={incomingDists.length} icon={<Package className="w-5 h-5 text-primary" />} />
        <StatsCard title="Received" value={confirmedItems.length} icon={<CheckCircle className="w-5 h-5 text-success" />} accent="bg-success/10" />
        <StatsCard title="People/Animals Fed" value={confirmedItems.reduce((sum, d) => {
          const food = foodItems.find(f => f.id === d.food_id);
          return sum + (food?.quantity || 0);
        }, 0)} icon={<Heart className="w-5 h-5 text-destructive" />} accent="bg-destructive/10" />
      </div>

      <div className="space-y-3">
        <h2 className="font-semibold text-lg text-foreground flex items-center gap-2">
          {activeOrg.emoji} Incoming for {activeOrg.name} 
        </h2>
        {incomingDists.length === 0 ? (
          <div className="bg-card rounded-xl p-8 text-center border border-border border-dashed">
            <p className="text-muted-foreground">No incoming deliveries assigned to this organization yet.</p>
            <p className="text-xs text-muted-foreground mt-1">
              Food labeled as "{activeOrg.category}" will be routed here.
            </p>
          </div>
        ) : (
          incomingDists.map((dist) => {
            const food = foodItems.find(f => f.id === dist.food_id);
            if (!food) return null;
            return (
              <div key={dist.id} className="bg-card rounded-xl p-4 shadow-card border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-foreground text-lg">{food.food_name}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    From: {food.donor_name} • Via: {dist.volunteer_name} • {food.quantity} servings
                  </p>
                  <div className="mt-3 flex items-center gap-2">
                    <CategoryBadge category={food.category} safetyScore={food.safety_score} />
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  {food.status === 'completed' ? (
                    <span className="text-sm text-success font-bold flex items-center gap-1.5 py-2">
                       <CheckCircle className="w-5 h-5" /> Confirmed Received
                    </span>
                  ) : dist.status === 'delivered' ? (
                    <button onClick={() => handleConfirmReceived(dist.id, food.id)}
                      className="px-6 py-2 rounded-lg bg-primary text-white text-sm font-bold shadow-md hover:bg-primary/90 transition transform active:scale-95">
                      Confirm Receipt ✓
                    </button>
                  ) : dist.status === 'picked-up' ? (
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-xs font-semibold text-info animate-pulse flex items-center gap-1">
                        🚚 On the way...
                      </span>
                      <span className="text-[10px] text-muted-foreground italic">Volunteer is in transit</span>
                    </div>
                  ) : (
                    <span className="text-xs font-medium text-muted-foreground flex items-center gap-1 py-2">
                       Awaiting Pickup...
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
