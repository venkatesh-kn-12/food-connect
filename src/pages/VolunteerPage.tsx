import { useFoodStore } from '@/lib/foodStore';
import { useAuth } from '@/hooks/useAuth';
import { CategoryBadge, StatusBadge } from '@/components/Badges';
import StatsCard from '@/components/StatsCard';
import { Truck, CheckCircle, MapPin } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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

  async function handleAcceptPickup(foodId: string) {
    try {
      await updateFoodItem(foodId, { status: 'assigned' });
      await addDistribution({
        food_id: foodId,
        volunteer_id: user!.id,
        volunteer_name: user?.user_metadata?.name || user?.email || '',
        receiver_name: 'Open Receiver Pool', // Default to pool so receivers see it immediately
        status: 'pending',
      });
      toast({ title: 'Task accepted!', description: 'Moved to your active deliveries.' });
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
    const receiverName = window.prompt('Enter Receiver Name (or click OK to assign to Open Pool):', 'Open Receiver Pool');
    if (receiverName === null) return; // user cancelled

    try {
      await updateDistribution(distId, {
        status: 'delivered',
        delivery_time: new Date().toISOString(),
        receiver_name: receiverName,
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
        <p className="text-muted-foreground text-sm">Pick up & deliver surplus food</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatsCard title="Available Now" value={unassignedItems.length} icon={<MapPin className="w-5 h-5 text-primary" />} />
        <StatsCard title="My Active Tasks" value={myActiveDistributions.length} icon={<Truck className="w-5 h-5 text-info" />} accent="bg-info/10" />
        <StatsCard title="Total Completed" value={myCompletedDistributions.length} icon={<CheckCircle className="w-5 h-5 text-success" />} accent="bg-success/10" />
      </div>

      <div className="space-y-6">
        {/* SECTION 1: ACTIVE TASKS */}
        {myActiveDistributions.length > 0 && (
          <div className="space-y-3">
            <h2 className="font-bold text-lg text-primary flex items-center gap-2">
              <Truck className="w-5 h-5" /> Your Active Deliveries
            </h2>
            {myActiveDistributions.map((dist) => {
              const item = foodItems.find(f => f.id === dist.food_id);
              if (!item) return null;
              return (
                <div key={dist.id} className="bg-card rounded-xl p-4 shadow-elevated border-2 border-primary/20">
                   <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-foreground text-lg">{item.food_name}</p>
                      <p className="text-xs text-muted-foreground">From: {item.donor_name} • {item.location} • {item.quantity} servings</p>
                      <div className="flex items-center gap-2 mt-2">
                        <CategoryBadge category={item.category} />
                        <StatusBadge status={dist.status} />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {dist.status === 'pending' && (
                        <button onClick={() => handleMarkCollected(dist.id, item.id)}
                          className="px-6 py-2 rounded-lg bg-info text-white text-sm font-bold shadow-sm hover:opacity-90 transition">
                          Picked Up
                        </button>
                      )}
                      {dist.status === 'picked-up' && (
                        <button onClick={() => handleMarkDelivered(dist.id, item.id)}
                          className="px-6 py-2 rounded-lg bg-success text-white text-sm font-bold shadow-sm hover:opacity-90 transition">
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

        {/* SECTION 2: AVAILABLE PICKUPS */}
        <div className="space-y-3 pt-4 border-t border-border">
          <h2 className="font-semibold text-lg text-foreground">Open Pickups</h2>
          {unassignedItems.length === 0 ? (
            <p className="text-muted-foreground text-sm py-4 italic">No new food matches currently available.</p>
          ) : (
            unassignedItems.map((item) => (
              <div key={item.id} className="bg-card rounded-xl p-4 shadow-card border border-border opacity-90 hover:opacity-100 transition-opacity">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-foreground">{item.food_name}</p>
                    <p className="text-xs text-muted-foreground">From: {item.donor_name} • {item.location} • {item.quantity} servings</p>
                    <div className="flex items-center gap-2 mt-2">
                      <CategoryBadge category={item.category} />
                    </div>
                  </div>
                  <button onClick={() => handleAcceptPickup(item.id)}
                    className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition">
                    Accept Task
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
