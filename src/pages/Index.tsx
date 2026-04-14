import { useFoodStore } from '@/lib/foodStore';
import { UserRole } from '@/lib/foodStore';
import Navbar from '@/components/Navbar';
import DonorPage from '@/pages/DonorPage';
import VolunteerPage from '@/pages/VolunteerPage';
import ReceiverPage from '@/pages/ReceiverPage';
import AdminPage from '@/pages/AdminPage';

export default function Index() {
  const { currentRole } = useFoodStore();

  const pages: Record<UserRole, React.ReactNode> = {
    donor: <DonorPage />,
    volunteer: <VolunteerPage />,
    receiver: <ReceiverPage />,
    admin: <AdminPage />,
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-6 max-w-6xl">
        {pages[currentRole]}
      </main>
      <footer className="border-t border-border py-4 text-center text-xs text-muted-foreground">
        Smart Food Redistribution System — Aligned with SDG 2, 12 & 13
      </footer>
    </div>
  );
}
