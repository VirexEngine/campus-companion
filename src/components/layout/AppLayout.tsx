import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import AppSidebar from './AppSidebar';
import { useAppStore } from '@/store/appStore';

export default function AppLayout() {
  const { sidebarOpen, fetchDashboardData } = useAppStore();

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  return (
    <div className="min-h-screen bg-background">
      <AppSidebar />
      <main
        className={`transition-all duration-300 min-h-screen ${
          sidebarOpen ? 'lg:ml-[260px]' : 'lg:ml-[72px]'
        }`}
      >
        <div className="p-4 pt-16 lg:pt-6 lg:p-8 max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
