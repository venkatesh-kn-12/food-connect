import { useFoodStore, UserRole } from '@/lib/foodStore';
import { useAuth } from '@/hooks/useAuth';
import { Leaf, Truck, Heart, Shield, Menu, X, LogOut } from 'lucide-react';
import { useState } from 'react';

const roleConfig: Record<UserRole, { label: string; icon: React.ReactNode }> = {
  donor: { label: 'Donor', icon: <Heart className="w-4 h-4" /> },
  volunteer: { label: 'Volunteer', icon: <Truck className="w-4 h-4" /> },
  receiver: { label: 'Receiver', icon: <Leaf className="w-4 h-4" /> },
  admin: { label: 'Admin', icon: <Shield className="w-4 h-4" /> },
};

export default function Navbar() {
  const { currentRole, setCurrentRole } = useFoodStore();
  const { user, signOut } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-md">
      <div className="container mx-auto flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg gradient-hero flex items-center justify-center">
            <Leaf className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="font-bold text-lg text-foreground">SFRS</span>
        </div>

        <div className="hidden md:flex items-center gap-1 bg-muted rounded-lg p-1">
          {(Object.keys(roleConfig) as UserRole[]).map((role) => (
            <button
              key={role}
              onClick={() => setCurrentRole(role)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                currentRole === role
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {roleConfig[role].icon}
              {roleConfig[role].label}
            </button>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-3">
          <span className="text-xs text-muted-foreground">{user?.email}</span>
          <button onClick={() => signOut()} className="text-muted-foreground hover:text-foreground transition">
            <LogOut className="w-4 h-4" />
          </button>
        </div>

        <button className="md:hidden" onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {menuOpen && (
        <div className="md:hidden border-t border-border px-4 py-2 bg-card space-y-1">
          {(Object.keys(roleConfig) as UserRole[]).map((role) => (
            <button
              key={role}
              onClick={() => { setCurrentRole(role); setMenuOpen(false); }}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium ${
                currentRole === role
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted'
              }`}
            >
              {roleConfig[role].icon}
              {roleConfig[role].label}
            </button>
          ))}
          <button onClick={() => signOut()}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:bg-muted">
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      )}
    </nav>
  );
}
