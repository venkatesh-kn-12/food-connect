import { useFoodStore } from '@/lib/foodStore';
import { Progress } from '@/components/ui/progress';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Trash2, AlertCircle, CheckCircle2, Truck } from 'lucide-react';

export function SmartFoodBin({ onPickup }: { onPickup?: () => void }) {
  const { iotDistance } = useFoodStore();

  const calculateFillPercentage = (distance: number | null) => {
    if (distance === null) return 0;
    if (distance <= 2.5) return 100; // Less than 2.5 is Full
    if (distance >= 8.4) return 0;   // 8.4cm and above is empty
    // Range: 8.4cm (0%) to 2.5cm (100%)
    return Math.round(((8.4 - distance) / (8.4 - 2.5)) * 100);
  };

  const fillPercent = calculateFillPercentage(iotDistance);
  
  const getStatus = () => {
    if (iotDistance === null) return { label: 'OFFLINE', color: 'text-muted-foreground', icon: <AlertCircle className="w-5 h-5" />, bg: 'bg-muted/10' };
    if (iotDistance <= 2.5) return { label: 'FULL - PICKUP READY', color: 'text-red-500', icon: <Trash2 className="w-5 h-5" />, bg: 'bg-red-500/5' };
    if (iotDistance <= 5.5) return { label: 'HALF FILLED', color: 'text-yellow-500', icon: <AlertCircle className="w-5 h-5" />, bg: 'bg-yellow-500/5' };
    if (iotDistance <= 7.5) return { label: 'FILLING UP', color: 'text-green-500', icon: <Trash2 className="w-5 h-5" />, bg: 'bg-green-500/5' };
    return { label: 'AVAILABLE', color: 'text-emerald-500', icon: <CheckCircle2 className="w-5 h-5" />, bg: 'bg-emerald-500/5' };
  };

  const status = getStatus();

  return (
    <Card className={`overflow-hidden border-2 shadow-xl transition-all hover:shadow-2xl ${status.bg} border-primary/20`}>
      <CardContent className="p-0">
        <div className="flex flex-col md:flex-row items-stretch">
          <div className="p-8 flex-1 space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-primary/10 rounded-2xl">
                  <Trash2 className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-foreground">Smart IoT Bin #01</h3>
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest">Bangalore Hub Monitor</p>
                </div>
              </div>
              <div className={`flex items-center gap-2 px-4 py-2 rounded-full border bg-background font-bold text-xs tracking-tighter ${status.color}`}>
                <span className="relative flex h-2 w-2">
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${status.color.replace('text', 'bg')}`}></span>
                  <span className={`relative inline-flex rounded-full h-2 w-2 ${status.color.replace('text', 'bg')}`}></span>
                </span>
                {status.label}
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-end">
                <span className="text-4xl font-black tracking-tighter text-foreground">{fillPercent}% <span className="text-lg font-medium text-muted-foreground ml-1">full</span></span>
                <div className="text-right">
                  <p className="text-xl font-bold text-primary">{iotDistance?.toFixed(1) ?? '--'} cm</p>
                  <p className="text-[10px] text-muted-foreground uppercase font-bold">Current Range</p>
                </div>
              </div>
              <div className="h-4 w-full bg-muted/30 rounded-full overflow-hidden p-1 border border-border/50">
                <div 
                  className={`h-full rounded-full transition-all duration-1000 ease-out relative ${
                    fillPercent >= 90 ? 'bg-gradient-to-r from-red-500 to-orange-500 shadow-[0_0_15px_rgba(239,68,68,0.5)]' :
                    fillPercent >= 50 ? 'bg-gradient-to-r from-yellow-500 to-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.3)]' : 
                    'bg-gradient-to-r from-green-500 to-emerald-500'
                  }`}
                  style={{ width: `${fillPercent}%` }}
                >
                  <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                </div>
              </div>
            </div>

            <div className="flex gap-6 pt-2">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-muted-foreground uppercase opacity-70">Trigger Point</span>
                <span className="text-sm font-bold text-foreground inline-flex items-center gap-1.5"><AlertCircle className="w-3 h-3 text-primary" /> &lt; 6cm</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-muted-foreground uppercase opacity-70">Uptime State</span>
                <span className="text-sm font-bold text-success inline-flex items-center gap-1.5"><CheckCircle2 className="w-3 h-3" /> ACTIVE</span>
              </div>
            </div>
          </div>

          {onPickup && iotDistance !== null && iotDistance <= 6 && (
            <div className="bg-red-500/10 border-l border-red-500/20 p-8 flex items-center justify-center min-w-[280px]">
              <button
                onClick={onPickup}
                className="w-full group relative overflow-hidden bg-red-600 hover:bg-red-700 text-white p-6 rounded-2xl font-black text-lg transition-all shadow-xl hover:scale-105 active:scale-95"
              >
                <div className="flex flex-col items-center gap-2 relative z-10">
                  <Truck className="w-8 h-8 animate-bounce" />
                  <span>CLAIM PICKUP NOW</span>
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
              </button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
