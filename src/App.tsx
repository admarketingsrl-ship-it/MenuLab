import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { LandingHome } from './components/LandingHome';
import { PublicMenu } from './components/PublicMenu';
import { AdminDashboard } from './components/AdminDashboard';
import { SuperAdminDashboard } from './components/SuperAdminDashboard';
import { Footer } from './components/Footer';
import { getStoredRestaurant } from './services/store';
import { RestaurantInfo } from './types';

export default function App() {
  const [currentView, setCurrentView] = useState<'landing' | 'menu' | 'admin' | 'superadmin'>(() => {
    const params = new URLSearchParams(window.location.search);
    const view = params.get('view');
    if (view === 'menu' || params.has('table')) return 'menu';
    if (view === 'admin') return 'admin';
    return 'landing';
  });
  const [restaurant, setRestaurant] = useState<RestaurantInfo>(getStoredRestaurant());

  useEffect(() => {
    const handleUpdate = () => {
      setRestaurant(getStoredRestaurant());
    };
    window.addEventListener('menulab_data_updated', handleUpdate);
    return () => window.removeEventListener('menulab_data_updated', handleUpdate);
  }, []);

  if (currentView === 'superadmin') {
    return (
      <SuperAdminDashboard
        onBackToApp={() => setCurrentView('landing')}
        onSelectRestaurant={() => setCurrentView('menu')}
      />
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-sans selection:bg-amber-500 selection:text-white flex flex-col justify-between">
      <div>
        <Navbar
          currentView={currentView as 'landing' | 'menu' | 'admin'}
          onNavigate={setCurrentView}
          restaurantName={restaurant.name}
        />

        <main>
          {currentView === 'landing' && (
            <LandingHome onNavigate={setCurrentView} restaurant={restaurant} />
          )}
          {currentView === 'menu' && (
            <PublicMenu />
          )}
          {currentView === 'admin' && (
            <AdminDashboard />
          )}
        </main>
      </div>

      <Footer onOpenSuperAdmin={() => setCurrentView('superadmin')} />
    </div>
  );
}
