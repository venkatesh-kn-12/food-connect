import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Leaf, Heart, Truck, Shield, ArrowRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import AuthPage from './AuthPage';

export default function RoleGateway() {
  const { loginAsDemo } = useAuth();
  const { toast } = useToast();
  const [loadingRole, setLoadingRole] = useState<string | null>(null);
  const [showAdminLogin, setShowAdminLogin] = useState(false);

  const handleDemoAccess = async (role: string) => {
    setLoadingRole(role);
    try {
      await loginAsDemo(role);
      toast({ title: `Logged in as Demo ${role.charAt(0).toUpperCase() + role.slice(1)}` });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
      setLoadingRole(null);
    }
  };

  if (showAdminLogin) {
    return (
      <div className="relative">
        <button 
          onClick={() => setShowAdminLogin(false)} 
          className="absolute top-4 left-4 z-50 text-sm font-medium text-muted-foreground hover:text-foreground flex items-center gap-2 px-3 py-1.5 rounded-lg bg-card border border-border shadow-sm"
        >
          ← Back to Gateway
        </button>
        <AuthPage />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-3xl space-y-10">
        
        <div className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 rounded-2xl shadow-elevated gradient-hero flex items-center justify-center mb-6">
            <Leaf className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-foreground">
            Smart Food Redistribution
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Select an operational role below to instantly explore the dashboard payload.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <button
            onClick={() => handleDemoAccess('donor')}
            disabled={loadingRole !== null}
            className="group relative flex flex-col items-center text-center p-8 bg-card rounded-2xl border border-border shadow-card hover:shadow-elevated hover:border-primary/30 hover:-translate-y-1 transition-all duration-300"
          >
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary group-hover:text-primary-foreground transition-colors text-primary">
              <Heart className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2">Food Donor</h3>
            <p className="text-sm text-muted-foreground mb-6">Post surplus food logistics, manage batches, and check safety segregation metrics.</p>
            <div className="mt-auto flex items-center text-sm font-semibold text-primary">
              {loadingRole === 'donor' ? 'Entering portal...' : 'Proceed as Donor'} <ArrowRight className="w-4 h-4 ml-1 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
            </div>
          </button>

          <button
            onClick={() => handleDemoAccess('volunteer')}
            disabled={loadingRole !== null}
            className="group relative flex flex-col items-center text-center p-8 bg-card rounded-2xl border border-border shadow-card hover:shadow-elevated hover:border-info/30 hover:-translate-y-1 transition-all duration-300"
          >
             <div className="w-16 h-16 rounded-full bg-info/10 flex items-center justify-center mb-6 group-hover:bg-info group-hover:text-primary-foreground transition-colors text-info">
              <Truck className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2">Volunteer Fleet</h3>
            <p className="text-sm text-muted-foreground mb-6">Inspect incoming logistics, assign packages to shelters, and trace distribution tracking.</p>
            <div className="mt-auto flex items-center text-sm font-semibold text-info">
              {loadingRole === 'volunteer' ? 'Entering portal...' : 'Proceed as Volunteer'} <ArrowRight className="w-4 h-4 ml-1 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
            </div>
          </button>

          <button
            onClick={() => handleDemoAccess('receiver')}
            disabled={loadingRole !== null}
            className="group relative flex flex-col items-center text-center p-8 bg-card rounded-2xl border border-border shadow-card hover:shadow-elevated hover:border-success/30 hover:-translate-y-1 transition-all duration-300"
          >
            <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mb-6 group-hover:bg-success group-hover:text-primary-foreground transition-colors text-success">
              <Shield className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2">Shelter Receiver</h3>
            <p className="text-sm text-muted-foreground mb-6">View scheduled fleet drop-offs, track incoming metrics, and finalize delivery receipts.</p>
            <div className="mt-auto flex items-center text-sm font-semibold text-success">
              {loadingRole === 'receiver' ? 'Entering portal...' : 'Proceed as Receiver'} <ArrowRight className="w-4 h-4 ml-1 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
            </div>
          </button>
        </div>

        <div className="pt-10 flex flex-col items-center justify-center space-y-4">
          <div className="h-px bg-border w-1/2"></div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setShowAdminLogin(true)}
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors underline underline-offset-4"
            >
              Administrative Sign-In 
            </button>
            <span className="text-muted-foreground text-sm">•</span>
            <button 
              onClick={() => {
                localStorage.removeItem('sfrs_food_overrides');
                localStorage.removeItem('sfrs_dist_overrides');
                localStorage.setItem('sfrs_db_wipe_timestamp', Date.now().toString());
                window.location.reload();
              }}
              className="text-sm font-medium text-destructive hover:text-destructive/80 transition-colors underline underline-offset-4"
            >
              Force Wipe Database
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
