import { useFoodStore } from '@/lib/foodStore';
import PredictionTimer from '@/components/PredictionTimer';
import { useAuth } from '@/hooks/useAuth';
import { CategoryBadge, StatusBadge } from '@/components/Badges';
import { getFoodSubtype, RISK_LEVEL_META } from '@/lib/smartSegregation';
import StatsCard from '@/components/StatsCard';
import { Truck, CheckCircle, MapPin } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { autoAssignOrganization, RECEIVER_ORGANIZATIONS } from '@/lib/organizations';
import { SmartFoodBin } from '@/components/SmartFoodBin';
import { supabase } from '@/integrations/supabase/client';

export default function VolunteerPage() {
  const { foodItems, updateFoodItem, distributions, addDistribution, updateDistribution } = useFoodStore();
  const { user } = useAuth();
  const { toast } = useToast();

  const unassignedItems = foodItems.filter(f => f.status === 'categorized');
  const myActiveDistributions = distributions.filter(d =>
    d.volunteer_id === user?.id && d.status !== 'delivered'
  );
  const myCompletedDistributions = distributions.filter(d =>
    d.volunteer_id === user?.id && d.status === 'delivered'
  );

  async function handleAcceptPickup(foodId: string, itemCategory: string) {
    try {
      // System automatically allocates receiver based on category & availability
      const assignedOrg = autoAssignOrganization(itemCategory as any, distributions);

      await updateFoodItem(foodId, { status: 'assigned' });
      await addDistribution({
        food_id: foodId,
        volunteer_id: user!.id,
        volunteer_name: user?.user_metadata?.name || user?.email || '',
        receiver_name: assignedOrg.name,
        receiver_id: null, // Null to avoid UUID type crash with mock org strings
        status: 'pending',
      });
      toast({ title: 'Task accepted!', description: `System assigned to ${assignedOrg.name}` });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  }

  async function handleMarkCollected(distId: string, foodId: string) {
    try {
      await updateDistribution(distId, { status: 'picked-up', pickup_time: new Date().toISOString() });
      await updateFoodItem(foodId, { status: 'picked-up' });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  }

  async function handleMarkDelivered(distId: string, foodId: string) {
    try {
      await updateDistribution(distId, {
        status: 'delivered',
        delivery_time: new Date().toISOString(),
      });
      await updateFoodItem(foodId, { status: 'delivered' });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Volunteer Dashboard</h1>
        <p className="text-muted-foreground text-sm">Pick up &amp; deliver surplus food</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatsCard title="Available Now"   value={unassignedItems.length}           icon={<MapPin    className="w-5 h-5 text-primary" />} />
        <StatsCard title="My Active Tasks" value={myActiveDistributions.length}     icon={<Truck     className="w-5 h-5 text-info"    />} accent="bg-info/10" />
        <StatsCard title="Total Completed" value={myCompletedDistributions.length}  icon={<CheckCircle className="w-5 h-5 text-success" />} accent="bg-success/10" />
      </div>

      {/* ── HERO SMART BIN ── */}
      <SmartFoodBin 
        onPickup={async () => {
          try {
            // 1. Manually create the food item
            const newIotItem = {
              donor_id: user?.id,
              donor_name: 'Smart Bin #01',
              food_name: 'Automated IoT Deposit',
              quantity: 5,
              food_type: 'veg' as const,
              location: 'Bangalore Hub',
              category: 'animal-feed' as const,
              status: 'categorized' as const,
              safety_score: 45,
              storage_condition: 'room-temp' as const,
              temperature: 25,
              time_prepared: new Date().toISOString(),
              expiry_estimate: new Date(Date.now() + 6 * 3600000).toISOString(),
            };

            const { data, error } = await supabase
              .from('food_items')
              .insert(newIotItem)
              .select('id')
              .single();

            if (error) throw error;

            // 2. Immediately accept the pickup
            if (data) {
              await handleAcceptPickup(data.id, 'animal-feed');
              toast({ title: 'Success!', description: 'IoT Bin claimed and assigned to you.' });
            }
          } catch (err: any) {
            toast({ title: 'Error', description: err.message, variant: 'destructive' });
          }
        }} 
      />

      <div className="space-y-6">
        {/* ── ACTIVE TASKS ── */}
        {myActiveDistributions.length > 0 && (
          <div className="space-y-3">
            <h2 className="font-bold text-lg text-primary flex items-center gap-2">
              <Truck className="w-5 h-5" /> Your Active Deliveries
            </h2>
            {myActiveDistributions.map((dist) => {
              const item = foodItems.find(f => f.id === dist.food_id);
              if (!item) return null;
              const subtype   = getFoodSubtype((item as any).food_subtype ?? 'other');
              const riskMeta  = RISK_LEVEL_META[subtype.riskLevel];

              return (
                <div key={dist.id} className="bg-card rounded-xl p-4 shadow-elevated border-2 border-primary/20">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-lg">{subtype.emoji}</span>
                        <p className="font-semibold text-foreground text-lg">{item.food_name}</p>
                        <span className={`text-xs font-medium ${riskMeta.color}`}>
                          {riskMeta.emoji} {riskMeta.label}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1.5 space-y-1">
                        <p className="flex items-start gap-1">
                          <span className="text-muted-foreground">📍 Pickup:</span> 
                          <span className="font-medium text-foreground">{item.location}</span> 
                          <span className="opacity-70">(from {item.donor_name} • {item.quantity} servings)</span>
                        </p>
                        <p className="flex items-start gap-1">
                          <span className="text-muted-foreground">🏢 Deliver To:</span> 
                          <span className="font-medium text-foreground">{dist.receiver_name}</span>
                          {(() => {
                            const org = RECEIVER_ORGANIZATIONS.find(o => o.name === dist.receiver_name);
                            return org ? <span className="opacity-70"> • {org.address}</span> : null;
                          })()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <CategoryBadge category={item.category} safetyScore={item.safety_score} />
                        <StatusBadge status={dist.status} />
                      </div>
                    </div>

                    <div className="flex gap-2 flex-shrink-0">
                      {dist.status === 'pending' && (
                        <button
                          onClick={() => handleMarkCollected(dist.id, item.id)}
                          className="px-6 py-2 rounded-lg bg-info text-white text-sm font-bold shadow-sm hover:opacity-90 transition"
                        >
                          Picked Up
                        </button>
                      )}
                      {dist.status === 'picked-up' && (
                        <button
                          onClick={() => handleMarkDelivered(dist.id, item.id)}
                          className="px-6 py-2 rounded-lg bg-success text-white text-sm font-bold shadow-sm hover:opacity-90 transition"
                        >
                          Deliver
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── OPEN PICKUPS ── */}
        <div className="space-y-3 pt-4 border-t border-border">
          <div className="flex flex-col gap-1 mb-4">
            <h2 className="font-semibold text-lg text-foreground">Other Open Pickups</h2>
            <p className="text-xs text-muted-foreground italic">Manual donations nearby</p>
          </div>

          {unassignedItems.filter(f => !f.donor_name?.includes('Smart')).length === 0 ? (
            <p className="text-muted-foreground text-sm py-4 italic">No other donations currently available.</p>
          ) : (
            unassignedItems
              .filter(f => !f.donor_name?.includes('Smart'))
              .map((item) => {
                const subtype  = getFoodSubtype((item as any).food_subtype ?? 'other');
                const riskMeta = RISK_LEVEL_META[subtype.riskLevel];
                const isIoT    = item.donor_name?.includes('Smart');

              return (
                <div
                  key={item.id}
                  className={`bg-card rounded-xl p-4 shadow-card border opacity-90 hover:opacity-100 transition-opacity ${
                    isIoT ? 'border-biogas/40 bg-biogas/5' : 'border-border'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {isIoT ? (
                          <span className="text-base">📦</span>
                        ) : (
                          <span className="text-base">{subtype.emoji}</span>
                        )}
                        <p className="font-semibold text-foreground">{item.food_name}</p>
                        {isIoT && (
                          <span className="inline-flex items-center gap-1 text-xs font-bold bg-biogas/20 text-biogas border border-biogas/30 px-2 py-0.5 rounded-full">
                            🤖 IoT Auto-Detected
                          </span>
                        )}
                        {!isIoT && (
                          <span className={`text-xs font-medium ${riskMeta.color}`}>
                            {riskMeta.emoji} {riskMeta.label}
                          </span>
                        )}
                      </div>
                      {isIoT ? (
                        <div className="mt-2 space-y-2">
                          <div className="flex flex-wrap gap-2">
                            <span className="flex items-center gap-1 text-[10px] font-bold bg-background/50 border border-border px-2 py-0.5 rounded-md text-foreground">
                              🌡️ {(item as any).temperature}°C (Avg)
                            </span>
                            <span className="flex items-center gap-1 text-[10px] font-bold bg-background/50 border border-border px-2 py-0.5 rounded-md text-foreground">
                              📏 {(item as any).distance}cm Dist
                            </span>
                          </div>
                          <p className="text-xs text-biogas font-semibold flex items-center gap-1">
                            <span className="animate-pulse">●</span> Machine Learning: Item routed to {item.category.replace('-', ' ')}
                          </p>
                          <p className="text-[10px] text-muted-foreground italic">
                            Sensor Location: {item.location} • ID: {item.donor_name}
                          </p>
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          From: {item.donor_name} • {item.location} • {item.quantity} servings
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        <CategoryBadge category={item.category} safetyScore={item.safety_score} />
                        {!isIoT && (
                          <PredictionTimer 
                             timePrepared={item.time_prepared}
                             storageCondition={item.storage_condition as any}
                             temperature={item.temperature}
                             foodSubtypeId={(item as any).food_subtype ?? 'other'}
                          />
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => handleAcceptPickup(item.id, item.category)}
                      className={`px-4 py-2 rounded-lg text-sm font-semibold hover:opacity-90 transition flex-shrink-0 ${
                        isIoT
                          ? 'bg-biogas text-white'
                          : 'bg-primary text-primary-foreground'
                      }`}
                    >
                      {isIoT ? '📦 Collect Box' : 'Accept Task'}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
