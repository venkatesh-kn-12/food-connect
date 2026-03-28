import { useState } from 'react';
import { FoodStoreContext } from '@/lib/foodStore';
import { sampleFoodItems, sampleDistributions, sampleStats } from '@/lib/sampleData';
import { FoodItem, Distribution, UserRole } from '@/lib/types';
import Navbar from '@/components/Navbar';
import DonorPage from '@/pages/DonorPage';
import VolunteerPage from '@/pages/VolunteerPage';
import ReceiverPage from '@/pages/ReceiverPage';
import AdminPage from '@/pages/AdminPage';

export default function Index() {
  const [currentRole, setCurrentRole] = useState<UserRole>('admin');
  const [foodItems, setFoodItems] = useState<FoodItem[]>([...sampleFoodItems]);
  const [distributions, setDistributions] = useState<Distribution[]>([...sampleDistributions]);

  const store = {
    foodItems,
    distributions,
    stats: sampleStats,
    currentRole,
    setCurrentRole,
    addFoodItem: (item: FoodItem) => setFoodItems(prev => [item, ...prev]),
    updateFoodItem: (id: string, updates: Partial<FoodItem>) =>
      setFoodItems(prev => prev.map(f => f.id === id ? { ...f, ...updates } : f)),
    addDistribution: (dist: Distribution) => setDistributions(prev => [dist, ...prev]),
    updateDistribution: (id: string, updates: Partial<Distribution>) =>
      setDistributions(prev => prev.map(d => d.id === id ? { ...d, ...updates } : d)),
  };

  const pages: Record<UserRole, React.ReactNode> = {
    donor: <DonorPage />,
    volunteer: <VolunteerPage />,
    receiver: <ReceiverPage />,
    admin: <AdminPage />,
  };

  return (
    <FoodStoreContext.Provider value={store}>
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 py-6 max-w-6xl">
          {pages[currentRole]}
        </main>
        <footer className="border-t border-border py-4 text-center text-xs text-muted-foreground">
          Smart Food Redistribution System — Aligned with SDG 2, 12 & 13
        </footer>
      </div>
    </FoodStoreContext.Provider>
  );
}
