import { useFoodStore } from '@/lib/foodStore';
import { CategoryBadge, StatusBadge } from '@/components/Badges';
import StatsCard from '@/components/StatsCard';
import { Truck, CheckCircle, MapPin } from 'lucide-react';

export default function VolunteerPage() {
  const { foodItems, updateFoodItem, distributions, addDistribution, updateDistribution } = useFoodStore();

  const availablePickups = foodItems.filter(f => f.category === 'human-consumption' && (f.status === 'categorized' || f.status === 'assigned'));
  const myPickups = distributions.filter(d => d.volunteerId === 'vol-1');

  function handleAcceptPickup(foodId: string) {
    updateFoodItem(foodId, { status: 'assigned' });
    addDistribution({
      id: `dist-${Date.now()}`,
      foodId,
      volunteerId: 'vol-1',
      volunteerName: 'Aisha Khan',
      status: 'pending',
    });
  }

  function handleMarkCollected(distId: string, foodId: string) {
    updateDistribution(distId, { status: 'picked-up', pickupTime: new Date().toISOString() });
    updateFoodItem(foodId, { status: 'picked-up' });
  }

  function handleMarkDelivered(distId: string, foodId: string) {
    updateDistribution(distId, {
      status: 'delivered',
      deliveryTime: new Date().toISOString(),
      receiverId: 'rec-1',
      receiverName: 'Hope Shelter',
    });
    updateFoodItem(foodId, { status: 'delivered' });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Volunteer Dashboard</h1>
        <p className="text-muted-foreground text-sm">Pick up & deliver surplus food</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatsCard title="Available Pickups" value={availablePickups.length} icon={<MapPin className="w-5 h-5 text-primary" />} />
        <StatsCard title="My Pickups" value={myPickups.length} icon={<Truck className="w-5 h-5 text-info" />} accent="bg-info/10" />
        <StatsCard title="Delivered" value={myPickups.filter(d => d.status === 'delivered').length} icon={<CheckCircle className="w-5 h-5 text-success" />} accent="bg-success/10" />
      </div>

      {/* Available pickups */}
      <div className="space-y-3">
        <h2 className="font-semibold text-lg text-foreground">Available Pickups</h2>
        {availablePickups.length === 0 ? (
          <p className="text-muted-foreground text-sm">No pickups available right now.</p>
        ) : (
          availablePickups.map((item) => {
            const existingDist = distributions.find(d => d.foodId === item.id);
            return (
              <div key={item.id} className="bg-card rounded-xl p-4 shadow-card border border-border">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-foreground">{item.foodName}</p>
                    <p className="text-xs text-muted-foreground">From: {item.donorName} • {item.location} • {item.quantity} servings</p>
                    <div className="flex items-center gap-2 mt-2">
                      <CategoryBadge category={item.category} />
                      <StatusBadge status={item.status} />
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    {!existingDist && (
                      <button onClick={() => handleAcceptPickup(item.id)}
                        className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition">
                        Accept Pickup
                      </button>
                    )}
                    {existingDist && existingDist.status === 'pending' && (
                      <button onClick={() => handleMarkCollected(existingDist.id, item.id)}
                        className="px-4 py-2 rounded-lg bg-info text-primary-foreground text-sm font-semibold hover:opacity-90 transition">
                        Mark Collected
                      </button>
                    )}
                    {existingDist && existingDist.status === 'picked-up' && (
                      <button onClick={() => handleMarkDelivered(existingDist.id, item.id)}
                        className="px-4 py-2 rounded-lg bg-success text-primary-foreground text-sm font-semibold hover:opacity-90 transition">
                        Mark Delivered
                      </button>
                    )}
                  </div>
                </div>

                {/* Simulated route */}
                {existingDist && (
                  <div className="mt-3 p-3 bg-muted rounded-lg">
                    <p className="text-xs font-medium text-foreground mb-1">📍 Simulated Route</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="bg-primary/20 px-2 py-0.5 rounded text-primary font-medium">{item.location}</span>
                      <span>→</span>
                      <span className="bg-success/20 px-2 py-0.5 rounded text-success font-medium">Hope Shelter (North District)</span>
                      <span className="ml-auto">~15 min</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
