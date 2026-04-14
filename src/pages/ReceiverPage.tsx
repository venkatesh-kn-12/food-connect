import { useFoodStore } from '@/lib/foodStore';
import { useAuth } from '@/hooks/useAuth';
import { CategoryBadge } from '@/components/Badges';
import StatsCard from '@/components/StatsCard';
import { Heart, CheckCircle, Package } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function ReceiverPage() {
  const { foodItems, distributions, updateFoodItem, updateDistribution } = useFoodStore();
  const { user } = useAuth();
  const { toast } = useToast();

  const incomingDists = distributions.filter(d => d.receiver_id === user?.id || d.receiver_name === 'Hope Shelter');
  const deliveredItems = incomingDists.filter(d => d.status === 'delivered');

  async function handleConfirmReceived(distId: string, foodId: string) {
    try {
      await updateDistribution(distId, { status: 'delivered' });
      await updateFoodItem(foodId, { status: 'completed' });
      toast({ title: 'Delivery confirmed!' });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Receiver Portal</h1>
        <p className="text-muted-foreground text-sm">View & accept incoming food deliveries</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatsCard title="Incoming Deliveries" value={incomingDists.length} icon={<Package className="w-5 h-5 text-primary" />} />
        <StatsCard title="Received" value={deliveredItems.length} icon={<CheckCircle className="w-5 h-5 text-success" />} accent="bg-success/10" />
        <StatsCard title="People Fed" value={deliveredItems.reduce((sum, d) => {
          const food = foodItems.find(f => f.id === d.food_id);
          return sum + (food?.quantity || 0);
        }, 0)} icon={<Heart className="w-5 h-5 text-destructive" />} accent="bg-destructive/10" />
      </div>

      <div className="space-y-3">
        <h2 className="font-semibold text-lg text-foreground">Incoming Food</h2>
        {incomingDists.length === 0 ? (
          <p className="text-muted-foreground text-sm">No incoming deliveries.</p>
        ) : (
          incomingDists.map((dist) => {
            const food = foodItems.find(f => f.id === dist.food_id);
            if (!food) return null;
            return (
              <div key={dist.id} className="bg-card rounded-xl p-4 shadow-card border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-foreground">{food.food_name}</p>
                  <p className="text-xs text-muted-foreground">
                    From: {food.donor_name} • Via: {dist.volunteer_name} • {food.quantity} servings
                  </p>
                  <div className="mt-2"><CategoryBadge category={food.category} /></div>
                </div>
                <div>
                  {dist.status === 'delivered' && food.status !== 'completed' ? (
                    <button onClick={() => handleConfirmReceived(dist.id, food.id)}
                      className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition">
                      Confirm Received ✓
                    </button>
                  ) : food.status === 'completed' ? (
                    <span className="text-sm text-success font-semibold">✓ Received</span>
                  ) : (
                    <span className="text-sm text-muted-foreground">In transit...</span>
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
