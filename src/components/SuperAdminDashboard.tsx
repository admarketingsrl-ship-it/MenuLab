import React, { useState } from 'react';
import { ShieldAlert, Building2, Calendar, DollarSign, Plus, Edit3, CheckCircle, AlertTriangle, ArrowLeft, LogOut, KeyRound } from 'lucide-react';
import { RestaurantInfo } from '../types';
import { getStoredRestaurantsList, saveStoredRestaurantsList, setCurrentRestaurantId } from '../services/store';

interface SuperAdminDashboardProps {
  onBackToApp: () => void;
  onSelectRestaurant: (restaurantId: string) => void;
}

export const SuperAdminDashboard: React.FC<SuperAdminDashboardProps> = ({ onBackToApp, onSelectRestaurant }) => {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  const [restaurants, setRestaurants] = useState<RestaurantInfo[]>(getStoredRestaurantsList());
  const [editingRest, setEditingRest] = useState<RestaurantInfo | null>(null);

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === '1234' || pin === 'superadmin' || pin === 'agency') {
      setIsUnlocked(true);
      setError('');
    } else {
      setError('PIN non valido. (Suggerimento: usa "1234" o "agency")');
    }
  };

  const handleUpdateSubscription = (restId: string, newEndDate: string, newStatus: 'Attivo' | 'In Scadenza' | 'Scaduto') => {
    const updated = restaurants.map((r) => {
      if (r.id === restId) {
        return {
          ...r,
          subscription: {
            planName: r.subscription?.planName || 'Abbonamento Mensile Pro',
            monthlyFee: r.subscription?.monthlyFee || 49,
            endDate: newEndDate,
            status: newStatus,
          },
        };
      }
      return r;
    });
    setRestaurants(updated);
    saveStoredRestaurantsList(updated);
    alert('Abbonamento aggiornato con successo!');
  };

  const totalMonthlyRevenue = restaurants.reduce((acc, r) => acc + (r.subscription?.status === 'Attivo' ? (r.subscription.monthlyFee || 49) : 0), 0);

  if (!isUnlocked) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-zinc-950 text-white">
        <div className="bg-zinc-900 rounded-3xl p-8 max-w-md w-full shadow-2xl border border-zinc-800 space-y-6 text-center">
          <div className="w-16 h-16 rounded-3xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto border border-amber-500/20">
            <KeyRound className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-black">Area Riservata Agenzia</h2>
            <p className="text-xs text-zinc-400">Inserisci il PIN di sblocco SuperAdmin per gestire i clienti e gli abbonamenti mensili.</p>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-red-950/40 border border-red-900/50 text-red-400 text-xs">
              {error}
            </div>
          )}

          <form onSubmit={handleUnlock} className="space-y-4">
            <input
              type="password"
              placeholder="Inserisci PIN (es. 1234)"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-zinc-800 border border-zinc-700 text-center text-lg tracking-widest text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
            <button
              type="submit"
              className="w-full py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-sm shadow-lg shadow-amber-500/20 transition-all"
            >
              Sblocca SuperAdmin
            </button>
          </form>

          <button
            onClick={onBackToApp}
            className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            ← Torna all'applicazione principale
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 pb-20">
      {/* SuperAdmin Top Header */}
      <div className="bg-zinc-900 border-b border-zinc-800 py-6 px-6 sm:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white flex items-center justify-center font-black shadow-lg">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight">SuperAdmin Agency Control Center</h1>
              <p className="text-xs text-zinc-400">Gestione multi-cliente e scadenze abbonamenti mensili</p>
            </div>
          </div>

          <button
            onClick={onBackToApp}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Esci da SuperAdmin
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 sm:px-8 py-8 space-y-8">
        
        {/* KPI Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="bg-zinc-900 rounded-3xl p-6 border border-zinc-800 shadow-sm">
            <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Clienti Ristoranti Attivi</p>
            <h3 className="text-3xl font-black mt-2 text-white">{restaurants.length}</h3>
            <p className="text-xs text-emerald-400 mt-1">Tutti i menu digitali online</p>
          </div>

          <div className="bg-zinc-900 rounded-3xl p-6 border border-zinc-800 shadow-sm">
            <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Fatturato Ricorrente Mensile (MRR)</p>
            <h3 className="text-3xl font-black mt-2 text-amber-400">€{totalMonthlyRevenue}</h3>
            <p className="text-xs text-zinc-400 mt-1">Abbonamenti SaaS attivi</p>
          </div>

          <div className="bg-zinc-900 rounded-3xl p-6 border border-zinc-800 shadow-sm">
            <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Stato Piattaforma</p>
            <h3 className="text-3xl font-black mt-2 text-emerald-400">Operativo</h3>
            <p className="text-xs text-zinc-400 mt-1">Firebase + Google Drive Sync</p>
          </div>
        </div>

        {/* Clients Table */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold">Elenco Ristoranti Clienti & Abbonamenti</h3>
          </div>

          <div className="bg-zinc-900 rounded-3xl border border-zinc-800 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-zinc-800 bg-zinc-800/50 text-xs font-bold text-zinc-400 uppercase">
                    <th className="p-4">Ristorante / Locale</th>
                    <th className="p-4">Piano Abbonamento</th>
                    <th className="p-4">Stato</th>
                    <th className="p-4">Data Fine Abbonamento</th>
                    <th className="p-4 text-right">Azioni / Gestione</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800 text-sm">
                  {restaurants.map((rest) => (
                    <tr key={rest.id} className="hover:bg-zinc-800/30 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <img src={rest.logo} alt="" className="w-12 h-12 rounded-xl object-cover" />
                          <div>
                            <p className="font-bold text-white">{rest.name}</p>
                            <p className="text-xs text-zinc-400">{rest.address}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 font-medium">
                        {rest.subscription?.planName || 'Abbonamento Mensile'}
                        <span className="block text-xs text-amber-400">€{rest.subscription?.monthlyFee || 49}/mese</span>
                      </td>
                      <td className="p-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                          rest.subscription?.status === 'Attivo' ? 'bg-emerald-950 text-emerald-400 border border-emerald-900/50' : 'bg-red-950 text-red-400 border border-red-900/50'
                        }`}>
                          {rest.subscription?.status || 'Attivo'}
                        </span>
                      </td>
                      <td className="p-4 font-mono text-xs text-zinc-300">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-amber-500" />
                          <input
                            type="date"
                            value={rest.subscription?.endDate || '2026-12-31'}
                            onChange={(e) => handleUpdateSubscription(rest.id, e.target.value, rest.subscription?.status || 'Attivo')}
                            className="bg-zinc-800 border border-zinc-700 px-2.5 py-1 rounded-lg text-white font-mono text-xs focus:outline-none focus:ring-1 focus:ring-amber-500"
                          />
                        </div>
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => {
                            setCurrentRestaurantId(rest.id);
                            onSelectRestaurant(rest.id);
                          }}
                          className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-md transition-all"
                        >
                          Accedi al Menu ➔
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
