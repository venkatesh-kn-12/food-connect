import { useState, useEffect } from 'react';
import { ClockAlert } from 'lucide-react';
import { predictNextDowngrade, getCategoryInfo } from '@/lib/smartSegregation';

interface PredictionTimerProps {
  timePrepared: string;
  storageCondition: 'refrigerated' | 'room-temp' | 'frozen';
  temperature: number;
  foodSubtypeId: string;
}

export default function PredictionTimer({
  timePrepared,
  storageCondition,
  temperature,
  foodSubtypeId,
}: PredictionTimerProps) {
  const [timeLeftStr, setTimeLeftStr] = useState<string>('');
  const [prediction, setPrediction] = useState<ReturnType<typeof predictNextDowngrade> | null>(null);

  useEffect(() => {
    // 1. Calculate the prediction exactly ONCE when the component mounts or inputs change
    const nextPred = predictNextDowngrade(
      timePrepared,
      storageCondition,
      temperature,
      foodSubtypeId
    );
    
    setPrediction(nextPred);

    if (!nextPred.hoursUntilDowngrade || !nextPred.nextCategory) {
      return; // It's already compost, no timer needed
    }

    // 2. Lock in the exact future target timestamp
    const targetTimeMs = Date.now() + nextPred.hoursUntilDowngrade * 3600 * 1000;

    // 3. Tick every second
    const interval = setInterval(() => {
      const now = Date.now();
      const diffMs = targetTimeMs - now;

      if (diffMs <= 0) {
        setTimeLeftStr('Updating...');
        // Force a page reload or system update 
        setTimeout(() => window.location.reload(), 2000);
        clearInterval(interval);
        return;
      }

      // Convert ms to h, m, s
      const totalSeconds = Math.floor(diffMs / 1000);
      const h = Math.floor(totalSeconds / 3600);
      const m = Math.floor((totalSeconds % 3600) / 60);
      const s = totalSeconds % 60;

      if (h > 0) {
        setTimeLeftStr(`${h}h ${m}m ${s}s`);
      } else {
        setTimeLeftStr(`${m}m ${s}s`);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [timePrepared, storageCondition, temperature, foodSubtypeId]);

  if (!prediction || !prediction.hoursUntilDowngrade || !prediction.nextCategory) return null;

  const nextInfo = getCategoryInfo(prediction.nextCategory);
  const isUrgent = prediction.hoursUntilDowngrade < 2;

  return (
    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${isUrgent ? 'bg-destructive/10 text-destructive' : 'bg-muted text-muted-foreground'}`}>
      <ClockAlert className={`w-3.5 h-3.5 ${isUrgent ? 'animate-pulse' : ''}`} />
      <span className="tabular-nums">Drops to {nextInfo.label} in {timeLeftStr || '...'}</span>
    </div>
  );
}
