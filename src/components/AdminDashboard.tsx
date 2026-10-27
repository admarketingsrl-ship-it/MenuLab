import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, UtensilsCrossed, FileSpreadsheet, Bell, QrCode, Settings, 
  Plus, Edit3, Trash2, CheckCircle, AlertCircle, LogOut, Search, Sparkles, 
  Check, Save, RefreshCw, Printer, ShieldCheck, HardDrive, CloudUpload, DownloadCloud, Tag, Percent, Copy, ExternalLink 
} from 'lucide-react';
import { Dish, RestaurantInfo, WaiterCall, ReviewItem, CouponCode } from '../types';
import { 
  getStoredDishes, saveStoredDishes, 
  getStoredRestaurant, saveStoredRestaurant, 
  getStoredCategories, saveStoredCategories,
  getStoredWaiterCalls, saveStoredWaiterCalls,
  getStoredReviews 
} from '../services/store';
import { ExcelImportModal } from './ExcelImportModal';
import { googleSignInWithDrive, getAccessToken, logoutUser, initAuth } from '../services/firebase';
import { exportMenuToGoogleDrive, listMenuBackupsFromGoogleDrive, downloadMenuFromGoogleDrive, DriveFileItem } from '../services/drive';
import { User } from 'firebase/auth';

export const AdminDashboard: React.FC = () => {
  // Auth state
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [email, setEmail] = useState('admin@menulab.it');
  const [password, setPassword] = useState('admin123');
  const [loginError, setLoginError] = useState('');

  // Google Drive & Firebase Auth user state
  const [googleUser, setGoogleUser] = useState<User | null>(null);
  const [isGoogleSigningIn, setIsGoogleSigningIn] = useState(false);
  const [driveFiles, setDriveFiles] = useState<DriveFileItem[]>([]);
  const [driveLoading, setDriveLoading] = useState(false);
  const [driveSuccessMsg, setDriveSuccessMsg] = useState<string | null>(null);
  const [driveErrorMsg, setDriveErrorMsg] = useState<string | null>(null);

  // Active admin tab
  const [activeTab, setActiveTab] = useState<'overview' | 'menu' | 'calls' | 'qr' | 'drive' | 'coupons' | 'settings'>('overview');

  // Data states
  const [restaurant, setRestaurant] = useState<RestaurantInfo>(getStoredRestaurant());
  const [dishes, setDishes] = useState<Dish[]>(getStoredDishes());
  const [categories] = useState<string[]>(getStoredCategories());
  const [waiterCalls, setWaiterCalls] = useState<WaiterCall[]>(getStoredWaiterCalls());
  const [reviews] = useState<ReviewItem[]>(getStoredReviews());

  // New Table Input State
  const [newTableName, setNewTableName] = useState('');
  const [copyToast, setCopyToast] = useState<string | null>(null);

  // Modal for Excel Import
  const [isExcelModalOpen, setIsExcelModalOpen] = useState(false);

  // Dish Editor Modal / Form state
  const [editingDish, setEditingDish] = useState<Partial<Dish> | null>(null);
  const [isDishFormOpen, setIsDishFormOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // New Coupon Form state
  const [newCouponCode, setNewCouponCode] = useState('');
  const [newDiscountPercent, setNewDiscountPercent] = useState(10);
  const [newCouponDesc, setNewCouponDesc] = useState('');

  // Sync auth and waiter calls
  useEffect(() => {
    const unsubscribe = initAuth(
      (user) => {
        setGoogleUser(user);
      },
      () => {
        setGoogleUser(null);
      }
    );
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setWaiterCalls(getStoredWaiterCalls());
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const rest = getStoredRestaurant();
    
    // Check subscription expiration
    if (rest.subscription && new Date(rest.subscription.endDate) < new Date()) {
      setLoginError('Abbonamento scaduto. Contatta l\'agenzia per rinnovare l\'accesso.');
      return;
    }

    // Check credentials
    if (email === (rest.adminEmail || 'admin@menulab.it') && password === (rest.adminPassword || 'admin123')) {
      setIsLoggedIn(true);
      setLoginError('');
    } else {
      setLoginError('Credenziali non valide.');
    }
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleSigningIn(true);
    setDriveErrorMsg(null);
    try {
      const res = await googleSignInWithDrive();
      setGoogleUser(res.user);
      setDriveSuccessMsg('Autenticazione Google Drive riuscita!');
      fetchDriveBackups();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setDriveErrorMsg(err.message || 'Errore durante il login con Google.');
      } else {
        setDriveErrorMsg('Errore durante il login con Google.');
      }
    } finally {
      setIsGoogleSigningIn(false);
    }
  };

  const fetchDriveBackups = async () => {
    setDriveLoading(true);
    setDriveErrorMsg(null);
    try {
      const files = await listMenuBackupsFromGoogleDrive();
      setDriveFiles(files);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setDriveErrorMsg(err.message || 'Impossibile recuperare i file da Google Drive.');
      } else {
        setDriveErrorMsg('Impossibile recuperare i file da Google Drive.');
      }
    } finally {
      setDriveLoading(false);
    }
  };

  const handleExportToDrive = async () => {
    setDriveLoading(true);
    setDriveErrorMsg(null);
    setDriveSuccessMsg(null);
    try {
      const fileId = await exportMenuToGoogleDrive(restaurant, dishes);
      setDriveSuccessMsg(`Menu salvato con successo su Google Drive! (ID: ${fileId})`);
      fetchDriveBackups();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setDriveErrorMsg(err.message || 'Errore durante l\'esportazione su Google Drive.');
      } else {
        setDriveErrorMsg('Errore durante l\'esportazione su Google Drive.');
      }
    } finally {
      setDriveLoading(false);
    }
  };

  const handleRestoreFromDrive = async (fileId: string) => {
    if (!confirm('Vuoi ripristinare il menu da questo backup di Google Drive? I dati attuali verranno aggiornati.')) return;
    setDriveLoading(true);
    setDriveErrorMsg(null);
    try {
      const data = await downloadMenuFromGoogleDrive(fileId);
      if (data.restaurant) {
        setRestaurant(data.restaurant);
        saveStoredRestaurant(data.restaurant);
      }
      if (data.dishes && Array.isArray(data.dishes)) {
        setDishes(data.dishes);
        saveStoredDishes(data.dishes);
      }
      setDriveSuccessMsg('Menu ripristinato con successo da Google Drive!');
    } catch (err: unknown) {
      if (err instanceof Error) {
        setDriveErrorMsg(err.message || 'Errore durante il ripristino da Google Drive.');
      } else {
        setDriveErrorMsg('Errore durante il ripristino da Google Drive.');
      }
    } finally {
      setDriveLoading(false);
    }
  };

  const handleSaveDish = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDish || !editingDish.name || !editingDish.price) return;

    if (editingDish.id) {
      const updated = dishes.map((d) => (d.id === editingDish.id ? (editingDish as Dish) : d));
      setDishes(updated);
      saveStoredDishes(updated);
    } else {
      const newDish: Dish = {
        id: `dish_${Date.now()}`,
        name: editingDish.name,
        description: editingDish.description || '',
        price: Number(editingDish.price),
        category: editingDish.category || categories[0],
        image: editingDish.image || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=600&q=80',
        allergens: editingDish.allergens || [],
        isAvailable: editingDish.isAvailable ?? true,
        isSpecial: editingDish.isSpecial ?? false,
        badges: editingDish.badges || [],
        dietary: editingDish.dietary || [],
      };
      const updated = [newDish, ...dishes];
      setDishes(updated);
      saveStoredDishes(updated);
    }

    setIsDishFormOpen(false);
    setEditingDish(null);
  };

  const handleDeleteDish = (id: string) => {
    if (confirm('Sei sicuro di voler eliminare questo piatto?')) {
      const updated = dishes.filter((d) => d.id !== id);
      setDishes(updated);
      saveStoredDishes(updated);
    }
  };

  const handleToggleAvailability = (id: string) => {
    const updated = dishes.map((d) => (d.id === id ? { ...d, isAvailable: !d.isAvailable } : d));
    setDishes(updated);
    saveStoredDishes(updated);
  };

  const handleResolveCall = (id: string) => {
    const updated = waiterCalls.map((c) => (c.id === id ? { ...c, status: 'resolved' as const } : c));
    setWaiterCalls(updated);
    saveStoredWaiterCalls(updated);
  };

  const handleSaveRestaurantSettings = (e: React.FormEvent) => {
    e.preventDefault();
    saveStoredRestaurant(restaurant);
    alert('Impostazioni del locale salvate con successo!');
  };

  const handleAddTable = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTableName.trim()) return;
    const currentTables = restaurant.tables || ['Tavolo 1', 'Tavolo 2'];
    const formattedName = newTableName.trim().startsWith('Tavolo') || newTableName.trim().startsWith('Terrazza') || newTableName.trim().startsWith('VIP') 
      ? newTableName.trim() 
      : `Tavolo ${newTableName.trim()}`;

    if (currentTables.includes(formattedName)) {
      alert('Questo tavolo esiste già.');
      return;
    }

    const updatedTables = [...currentTables, formattedName];
    const updatedRest = { ...restaurant, tables: updatedTables };
    setRestaurant(updatedRest);
    saveStoredRestaurant(updatedRest);
    setNewTableName('');
  };

  const handleDeleteTable = (tableName: string) => {
    if (confirm(`Vuoi rimuovere il ${tableName}?`)) {
      const updatedTables = (restaurant.tables || []).filter((t) => t !== tableName);
      const updatedRest = { ...restaurant, tables: updatedTables };
      setRestaurant(updatedRest);
      saveStoredRestaurant(updatedRest);
    }
  };

  const handleAddCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCouponCode.trim()) return;

    const newCoupon: CouponCode = {
      id: `coup_${Date.now()}`,
      code: newCouponCode.trim().toUpperCase(),
      discountPercent: Number(newDiscountPercent),
      description: newCouponDesc.trim() || `Sconto del ${newDiscountPercent}%`,
      active: true,
    };

    const updatedCoupons = [...(restaurant.coupons || []), newCoupon];
    const updatedRest = { ...restaurant, coupons: updatedCoupons };
    setRestaurant(updatedRest);
    saveStoredRestaurant(updatedRest);
    setNewCouponCode('');
    setNewCouponDesc('');
    alert('Nuovo coupon creato con successo!');
  };

  const handleDeleteCoupon = (id: string) => {
    const updatedCoupons = (restaurant.coupons || []).filter((c) => c.id !== id);
    const updatedRest = { ...restaurant, coupons: updatedCoupons };
    setRestaurant(updatedRest);
    saveStoredRestaurant(updatedRest);
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-[85vh] flex items-center justify-center p-4 bg-zinc-50 dark:bg-zinc-950">
        <div className="bg-white dark:bg-zinc-900 rounded-3xl p-8 max-w-md w-full shadow-2xl border border-zinc-200 dark:border-zinc-800 space-y-6">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-amber-500 text-white flex items-center justify-center mx-auto shadow-lg shadow-amber-500/30">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <h2 className="text-2xl font-black">Dashboard Ristoratore</h2>
            <p className="text-xs text-zinc-500">Accesso riservato con Firebase Auth e Google Drive Sync</p>
          </div>

          {loginError && (
            <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 rounded-xl text-red-600 text-xs text-center font-medium">
              {loginError}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Email Admin</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm shadow-lg shadow-amber-500/25 transition-all"
            >
              Accedi alla Dashboard
            </button>
          </form>

          <div className="text-center pt-2 border-t border-zinc-100 dark:border-zinc-800">
            <p className="text-[11px] text-zinc-400">Credenziali precompilate per test immediato.</p>
          </div>
        </div>
      </div>
    );
  }

  const pendingCallsCount = waiterCalls.filter((c) => c.status === 'pending').length;
  const tableList = restaurant.tables || ['Tavolo 1', 'Tavolo 2', 'Tavolo 3', 'Tavolo 4', 'Tavolo 5'];

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 pb-20">
      
      {/* Admin Top Header */}
      <div className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 py-6 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img src={restaurant.logo} alt="Logo" className="w-12 h-12 rounded-2xl object-cover shadow-md" />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black">{restaurant.name}</h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                  QR Dinamici & Tavoli
                </span>
              </div>
              <p className="text-xs text-zinc-500">Pannello di controllo con gestione avanzata tavoli e QR code funzionanti</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsExcelModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-colors"
            >
              <FileSpreadsheet className="w-4 h-4" />
              Importa da Excel
            </button>
            <button
              onClick={() => setIsLoggedIn(false)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 text-zinc-700 dark:text-zinc-300 text-xs font-bold transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Esci
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="max-w-7xl mx-auto mt-6 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'overview'
                ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-sm'
                : 'bg-zinc-100 dark:bg-zinc-800/60 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            Panoramica
          </button>

          <button
            onClick={() => setActiveTab('menu')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'menu'
                ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-sm'
                : 'bg-zinc-100 dark:bg-zinc-800/60 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200'
            }`}
          >
            <UtensilsCrossed className="w-4 h-4" />
            Gestione Menu ({dishes.length})
          </button>

          <button
            onClick={() => setActiveTab('calls')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap relative ${
              activeTab === 'calls'
                ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-sm'
                : 'bg-zinc-100 dark:bg-zinc-800/60 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200'
            }`}
          >
            <Bell className="w-4 h-4" />
            Chiamate Tavoli
            {pendingCallsCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-black flex items-center justify-center animate-pulse">
                {pendingCallsCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('qr')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'qr'
                ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-sm'
                : 'bg-zinc-100 dark:bg-zinc-800/60 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200'
            }`}
          >
            <QrCode className="w-4 h-4" />
            QR Code Tavoli ({tableList.length})
          </button>

          <button
            onClick={() => setActiveTab('drive')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'drive'
                ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-sm'
                : 'bg-zinc-100 dark:bg-zinc-800/60 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200'
            }`}
          >
            <HardDrive className="w-4 h-4 text-blue-500" />
            Google Drive Sync
          </button>

          <button
            onClick={() => setActiveTab('coupons')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'coupons'
                ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-sm'
                : 'bg-zinc-100 dark:bg-zinc-800/60 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200'
            }`}
          >
            <Tag className="w-4 h-4 text-amber-500" />
            Coupon & Promo Pop-up
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'settings'
                ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-sm'
                : 'bg-zinc-100 dark:bg-zinc-800/60 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200'
            }`}
          >
            <Settings className="w-4 h-4" />
            Impostazioni & Banner
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8">
        
        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-8 animate-fadeIn">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
                <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Piatti nel Menu</p>
                <h3 className="text-3xl font-black mt-2 text-zinc-900 dark:text-white">{dishes.length}</h3>
                <p className="text-xs text-emerald-600 font-medium mt-1">Sincronizzati con Firebase</p>
              </div>

              <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
                <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Tavoli Attivi</p>
                <h3 className="text-3xl font-black mt-2 text-amber-600">{tableList.length}</h3>
                <p className="text-xs text-zinc-500 mt-1">QR code configurati</p>
              </div>

              <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
                <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Chiamate Tavoli</p>
                <h3 className="text-3xl font-black mt-2 text-red-500">{pendingCallsCount}</h3>
                <p className="text-xs text-zinc-500 mt-1">In attesa di gestione</p>
              </div>

              <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
                <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Google Drive Backup</p>
                <h3 className="text-3xl font-black mt-2 text-blue-500">{googleUser ? 'Connesso' : 'Non Connesso'}</h3>
                <p className="text-xs text-zinc-500 mt-1">{googleUser ? googleUser.email : 'Accedi in Drive Sync'}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 bg-white dark:bg-zinc-900 rounded-3xl p-6 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold">Ultime Chiamate dai Tavoli</h3>
                  <button onClick={() => setActiveTab('calls')} className="text-xs font-bold text-amber-600 hover:underline">
                    Vedi tutte ➔
                  </button>
                </div>

                <div className="space-y-3">
                  {waiterCalls.slice(0, 3).map((call) => (
                    <div key={call.id} className="flex items-center justify-between p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/50 dark:border-zinc-700/50">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs ${call.status === 'pending' ? 'bg-amber-100 text-amber-700 animate-pulse' : 'bg-emerald-100 text-emerald-700'}`}>
                          {call.tableNumber.replace('Tavolo ', 'T')}
                        </div>
                        <div>
                          <p className="text-sm font-bold">{call.tableNumber} - {call.type === 'call_waiter' ? 'Chiamata Cameriere' : 'Richiesta Conto'}</p>
                          <p className="text-xs text-zinc-500">{call.message || 'Nessuna nota aggiuntiva'}</p>
                        </div>
                      </div>
                      {call.status === 'pending' ? (
                        <button
                          onClick={() => handleResolveCall(call.id)}
                          className="px-3.5 py-1.5 rounded-xl bg-amber-500 text-white text-xs font-bold hover:bg-amber-600 transition-colors"
                        >
                          Segna come gestito
                        </button>
                      ) : (
                        <span className="px-3 py-1 rounded-xl bg-emerald-100 text-emerald-800 text-xs font-semibold">Risolto</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-3xl p-6 text-white shadow-xl space-y-4">
                <h3 className="text-xl font-black">QR Code Funzionanti</h3>
                <p className="text-xs text-white/90 leading-relaxed">
                  Crea nuovi tavoli (es. salette, terrazze) e genera QR code dinamici che collegano direttamente i clienti al menu con il numero di tavolo preimpostato.
                </p>
                <div className="pt-2">
                  <button
                    onClick={() => setActiveTab('qr')}
                    className="w-full py-3 rounded-xl bg-white text-zinc-900 font-bold text-xs shadow-md hover:bg-zinc-100 transition-colors"
                  >
                    Gestisci Tavoli e QR Code
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: MENU CRUD */}
        {activeTab === 'menu' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <input
                  type="text"
                  placeholder="Cerca piatto nel menu..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button
                  onClick={() => {
                    setEditingDish({ category: categories[0], isAvailable: true, price: 10 });
                    setIsDishFormOpen(true);
                  }}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-lg shadow-amber-500/25 transition-all"
                >
                  <Plus className="w-4 h-4" />
                  Aggiungi Nuovo Piatto
                </button>
              </div>
            </div>

            <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 text-xs font-bold text-zinc-400 uppercase">
                      <th className="p-4">Piatto</th>
                      <th className="p-4">Categoria</th>
                      <th className="p-4">Prezzo</th>
                      <th className="p-4">Stato</th>
                      <th className="p-4 text-right">Azioni</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 text-sm">
                    {dishes
                      .filter((d) => d.name.toLowerCase().includes(searchTerm.toLowerCase()))
                      .map((dish) => (
                        <tr key={dish.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors">
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <img src={dish.image} alt="" className="w-12 h-12 rounded-xl object-cover flex-shrink-0" />
                              <div>
                                <p className="font-bold text-zinc-900 dark:text-white">{dish.name}</p>
                                <p className="text-xs text-zinc-400 line-clamp-1">{dish.description}</p>
                              </div>
                            </div>
                          </td>
                          <td className="p-4">
                            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                              {dish.category}
                            </span>
                          </td>
                          <td className="p-4 font-black text-amber-600 dark:text-amber-400">
                            {dish.price.toFixed(2)} {restaurant.currency}
                          </td>
                          <td className="p-4">
                            <button
                              onClick={() => handleToggleAvailability(dish.id)}
                              className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                                dish.isAvailable
                                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-400'
                                  : 'bg-red-100 text-red-800 dark:bg-red-950/50 dark:text-red-400'
                              }`}
                            >
                              {dish.isAvailable ? 'Disponibile' : 'Esaurito'}
                            </button>
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => {
                                  setEditingDish(dish);
                                  setIsDishFormOpen(true);
                                }}
                                className="p-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 transition-colors"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteDish(dish.id)}
                                className="p-2 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-600 hover:bg-red-100 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: WAITER CALLS LIVE */}
        {activeTab === 'calls' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold">Chiamate e Richieste dai Tavoli</h3>
                <p className="text-xs text-zinc-500">Aggiornamento in tempo reale dalla sala</p>
              </div>
              <button
                onClick={() => setWaiterCalls(getStoredWaiterCalls())}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-xs font-bold"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Aggiorna
              </button>
            </div>

            <div className="space-y-4">
              {waiterCalls.length === 0 ? (
                <div className="py-16 text-center bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-8 space-y-2">
                  <Bell className="w-10 h-10 text-zinc-400 mx-auto" />
                  <h4 className="font-bold">Nessuna chiamata attiva</h4>
                  <p className="text-xs text-zinc-500">I clienti dal menu digitale possono chiamare il cameriere o chiedere il conto.</p>
                </div>
              ) : (
                waiterCalls.map((call) => (
                  <div key={call.id} className={`p-5 rounded-3xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                    call.status === 'pending'
                      ? 'bg-amber-50/60 dark:bg-amber-950/20 border-amber-300 dark:border-amber-900/50 shadow-md'
                      : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 opacity-75'
                  }`}>
                    <div className="flex items-center gap-4">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-lg ${
                        call.status === 'pending' ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/30' : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                      }`}>
                        {call.tableNumber.replace('Tavolo ', 'T')}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-base font-bold">{call.tableNumber}</h4>
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold ${
                            call.type === 'call_waiter' ? 'bg-orange-100 text-orange-700' : 'bg-purple-100 text-purple-700'
                          }`}>
                            {call.type === 'call_waiter' ? '🔔 Chiamata Cameriere' : '🧾 Richiesta Conto'}
                          </span>
                        </div>
                        <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">{call.message || 'Nessuna nota aggiuntiva'}</p>
                        <p className="text-[10px] text-zinc-400 mt-1">Ricevuto alle {new Date(call.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                      </div>
                    </div>

                    {call.status === 'pending' ? (
                      <button
                        onClick={() => handleResolveCall(call.id)}
                        className="w-full sm:w-auto px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-lg shadow-amber-500/25 transition-all"
                      >
                        Segna come Risolto
                      </button>
                    ) : (
                      <span className="px-4 py-2 rounded-xl bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 text-xs font-semibold">
                        ✓ Gestito
                      </span>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 4: QR CODE TAVOLI DINAMICI */}
        {activeTab === 'qr' && (
          <div className="space-y-8 animate-fadeIn">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-bold">Gestione Avanzata Tavoli & QR Code Funzionanti</h3>
                <p className="text-xs text-zinc-500">Aggiungi nuovi tavoli, salette o postazioni e genera QR code che interagiscono con l'app</p>
              </div>

              {/* Add Table Form */}
              <form onSubmit={handleAddTable} className="flex items-center gap-2 w-full sm:w-auto">
                <input
                  type="text"
                  placeholder="Nome Tavolo (es. Tavolo 13, Terrazza 2)"
                  value={newTableName}
                  onChange={(e) => setNewTableName(e.target.value)}
                  className="px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                <button
                  type="submit"
                  className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold flex items-center gap-1.5 shadow-md whitespace-nowrap"
                >
                  <Plus className="w-4 h-4" />
                  Aggiungi Tavolo
                </button>
              </form>
            </div>

            {copyToast && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 rounded-xl text-emerald-700 text-xs font-bold text-center">
                {copyToast}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {tableList.map((tableName) => {
                const tableUrl = `${window.location.origin}${window.location.pathname}?view=menu&table=${encodeURIComponent(tableName)}`;
                const qrImageSrc = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(tableUrl)}`;

                return (
                  <div key={tableName} className="bg-white dark:bg-zinc-900 rounded-3xl p-6 border border-zinc-200 dark:border-zinc-800 shadow-sm text-center space-y-4 relative group">
                    <button
                      onClick={() => handleDeleteTable(tableName)}
                      className="absolute top-4 right-4 p-2 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl transition-colors"
                      title="Elimina Tavolo"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto font-black text-lg">
                      {tableName.replace(/[^0-9A-Za-z]/g, '').slice(0, 4)}
                    </div>
                    <div>
                      <h4 className="text-lg font-bold">{tableName}</h4>
                      <p className="text-[11px] text-zinc-400 mt-0.5">Scansione imposta il tavolo automatico</p>
                    </div>

                    {/* Functional QR Code Image */}
                    <div className="bg-zinc-50 dark:bg-zinc-800 p-4 rounded-2xl inline-block border border-zinc-200 dark:border-zinc-700">
                      <img src={qrImageSrc} alt={`QR Code ${tableName}`} className="w-36 h-36 mx-auto rounded-lg" />
                    </div>

                    <div className="space-y-2">
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(tableUrl);
                          setCopyToast(`Link diretto per ${tableName} copiato negli appunti!`);
                          setTimeout(() => setCopyToast(null), 3000);
                        }}
                        className="w-full py-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 text-zinc-700 dark:text-zinc-300 font-bold text-xs flex items-center justify-center gap-2 transition-colors"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        Copia Link Tavolo
                      </button>

                      <button
                        onClick={() => alert(`Stampa cartello ufficiale per ${tableName} avviata!`)}
                        className="w-full py-2.5 rounded-xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 font-bold text-xs flex items-center justify-center gap-2 shadow-sm"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        Stampa Cartello Tavolo
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 5: GOOGLE DRIVE SYNC */}
        {activeTab === 'drive' && (
          <div className="space-y-6 animate-fadeIn max-w-3xl">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <HardDrive className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold">Integrazione Google Drive</h3>
                <p className="text-xs text-zinc-500">Esporta e sincronizza i backup del menu sul tuo Google Drive</p>
              </div>
            </div>

            <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-6">
              {!googleUser ? (
                <div className="text-center py-6 space-y-4">
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    Effettua l'accesso con il tuo account Google per abilitare la sincronizzazione con Google Drive.
                  </p>
                  
                  <button
                    onClick={handleGoogleSignIn}
                    disabled={isGoogleSigningIn}
                    className="gsi-material-button mx-auto flex items-center justify-center gap-3 px-6 py-3 rounded-2xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-zinc-50 transition-all shadow-sm cursor-pointer font-medium text-sm"
                  >
                    <div className="gsi-material-button-icon">
                      <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-5 h-5">
                        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                        <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                      </svg>
                    </div>
                    <span>{isGoogleSigningIn ? 'Accesso in corso...' : 'Sign in with Google'}</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="flex items-center justify-between p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center">
                        {googleUser.email?.[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-bold">{googleUser.displayName || googleUser.email}</p>
                        <p className="text-xs text-blue-600 dark:text-blue-400">Connesso a Google Drive</p>
                      </div>
                    </div>
                    <button
                      onClick={logoutUser}
                      className="px-4 py-2 rounded-xl bg-white dark:bg-zinc-800 text-xs font-semibold shadow-sm"
                    >
                      Disconnetti
                    </button>
                  </div>

                  {driveSuccessMsg && (
                    <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 rounded-xl text-emerald-700 text-xs flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 flex-shrink-0" />
                      <span>{driveSuccessMsg}</span>
                    </div>
                  )}

                  {driveErrorMsg && (
                    <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 rounded-xl text-red-600 text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      <span>{driveErrorMsg}</span>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row gap-4">
                    <button
                      onClick={handleExportToDrive}
                      disabled={driveLoading}
                      className="flex-1 py-3.5 px-6 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-600/25 transition-all"
                    >
                      <CloudUpload className="w-4 h-4" />
                      {driveLoading ? 'Caricamento...' : 'Salva Backup Menu su Drive'}
                    </button>

                    <button
                      onClick={fetchDriveBackups}
                      disabled={driveLoading}
                      className="py-3.5 px-6 rounded-2xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 text-zinc-700 dark:text-zinc-300 font-bold text-xs flex items-center justify-center gap-2 transition-all"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Aggiorna Lista Backup
                    </button>
                  </div>

                  <div className="space-y-3 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                    <h4 className="text-sm font-bold">Backup Disponibili su Google Drive</h4>
                    {driveFiles.length === 0 ? (
                      <p className="text-xs text-zinc-400">Nessun backup trovato su Google Drive. Clicca "Salva Backup Menu su Drive" per crearne uno.</p>
                    ) : (
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {driveFiles.map((file) => (
                          <div key={file.id} className="flex items-center justify-between p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/50 dark:border-zinc-700/50">
                            <div>
                              <p className="text-xs font-bold">{file.name}</p>
                              <p className="text-[10px] text-zinc-400">ID: {file.id}</p>
                            </div>
                            <button
                              onClick={() => handleRestoreFromDrive(file.id)}
                              disabled={driveLoading}
                              className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5"
                            >
                              <DownloadCloud className="w-3.5 h-3.5" />
                              Ripristina
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 6: COUPONS & PROMO POPUP MANAGEMENT */}
        {activeTab === 'coupons' && (
          <div className="space-y-8 animate-fadeIn max-w-3xl">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <Tag className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold">Gestione Coupon Sconto & Pop-up Promozionale</h3>
                <p className="text-xs text-zinc-500">Crea codici sconto e personalizza il pop-up iniziale per i clienti</p>
              </div>
            </div>

            <form onSubmit={handleSaveRestaurantSettings} className="bg-white dark:bg-zinc-900 rounded-3xl p-6 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4">
              <h4 className="text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                Configurazione Pop-up di Benvenuto
              </h4>

              <div className="space-y-1">
                <label className="text-xs font-semibold">Titolo del Pop-up</label>
                <input
                  type="text"
                  value={restaurant.promoPopup?.title || ''}
                  onChange={(e) => setRestaurant({
                    ...restaurant,
                    promoPopup: { ...(restaurant.promoPopup || { subtitle: '', active: true }), title: e.target.value }
                  })}
                  className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800 text-sm"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold">Testo / Sottotitolo</label>
                <textarea
                  rows={2}
                  value={restaurant.promoPopup?.subtitle || ''}
                  onChange={(e) => setRestaurant({
                    ...restaurant,
                    promoPopup: { ...(restaurant.promoPopup || { title: '', active: true }), subtitle: e.target.value }
                  })}
                  className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800 text-sm resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold">Codice Coupon da Mostrare nel Pop-up</label>
                  <input
                    type="text"
                    value={restaurant.promoPopup?.couponCode || ''}
                    onChange={(e) => setRestaurant({
                      ...restaurant,
                      promoPopup: { ...(restaurant.promoPopup || { title: '', subtitle: '', active: true }), couponCode: e.target.value }
                    })}
                    className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800 text-sm uppercase"
                  />
                </div>

                <div className="flex items-center pt-6">
                  <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={restaurant.promoPopup?.active ?? true}
                      onChange={(e) => setRestaurant({
                        ...restaurant,
                        promoPopup: { ...(restaurant.promoPopup || { title: '', subtitle: '' }), active: e.target.checked }
                      })}
                      className="w-4 h-4 rounded text-amber-500"
                    />
                    Attiva Pop-up all'apertura del menu
                  </label>
                </div>
              </div>

              <button
                type="submit"
                className="py-2.5 px-6 rounded-xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 font-bold text-xs"
              >
                Salva Impostazioni Pop-up
              </button>
            </form>

            <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4">
              <h4 className="text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                <Percent className="w-4 h-4 text-amber-500" />
                Crea Nuovo Codice Sconto Coupon
              </h4>

              <form onSubmit={handleAddCoupon} className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
                <div className="space-y-1">
                  <label className="text-xs font-semibold">Codice (es. SUMMER20)</label>
                  <input
                    type="text"
                    required
                    placeholder="ES. SCONTO15"
                    value={newCouponCode}
                    onChange={(e) => setNewCouponCode(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800 text-sm uppercase"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold">Percentuale Sconto (%)</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    required
                    value={newDiscountPercent}
                    onChange={(e) => setNewDiscountPercent(Number(e.target.value))}
                    className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800 text-sm"
                  />
                </div>

                <button
                  type="submit"
                  className="py-3 px-6 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-md"
                >
                  Crea Coupon
                </button>
              </form>

              <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 space-y-3">
                <h5 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Coupon Attivi nel Sistema</h5>
                <div className="space-y-2">
                  {restaurant.coupons?.map((coup) => (
                    <div key={coup.id} className="flex items-center justify-between p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/50 dark:border-zinc-700/50">
                      <div className="flex items-center gap-3">
                        <span className="px-3 py-1 bg-amber-500/10 text-amber-600 dark:text-amber-400 font-mono font-bold text-xs rounded-lg border border-amber-500/20">
                          {coup.code}
                        </span>
                        <div>
                          <p className="text-xs font-bold">-{coup.discountPercent}% di sconto sul totale</p>
                          <p className="text-[10px] text-zinc-400">{coup.description}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteCoupon(coup.id)}
                        className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 7: SETTINGS & BANNER */}
        {activeTab === 'settings' && (
          <div className="space-y-6 animate-fadeIn max-w-2xl">
            <div>
              <h3 className="text-xl font-bold">Impostazioni Locale & Banner Marketing</h3>
              <p className="text-xs text-zinc-500">Personalizza le informazioni del ristorante e l'offerta in primo piano</p>
            </div>

            <form onSubmit={handleSaveRestaurantSettings} className="bg-white dark:bg-zinc-900 rounded-3xl p-6 sm:p-8 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-6">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Nome del Ristorante</label>
                <input
                  type="text"
                  value={restaurant.name}
                  onChange={(e) => setRestaurant({ ...restaurant, name: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Slogan / Descrizione Breve</label>
                <input
                  type="text"
                  value={restaurant.tagline}
                  onChange={(e) => setRestaurant({ ...restaurant, tagline: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Indirizzo</label>
                  <input
                    type="text"
                    value={restaurant.address}
                    onChange={(e) => setRestaurant({ ...restaurant, address: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Orari di Apertura</label>
                  <input
                    type="text"
                    value={restaurant.openingHours}
                    onChange={(e) => setRestaurant({ ...restaurant, openingHours: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 space-y-4">
                <h4 className="text-sm font-bold text-zinc-900 dark:text-white">Banner Promozionale in cima al Menu</h4>
                
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Titolo Banner</label>
                  <input
                    type="text"
                    value={restaurant.activeBanner?.title || ''}
                    onChange={(e) => setRestaurant({
                      ...restaurant,
                      activeBanner: { ...(restaurant.activeBanner || { subtitle: '', active: true }), title: e.target.value }
                    })}
                    className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Sottotitolo Banner</label>
                  <input
                    type="text"
                    value={restaurant.activeBanner?.subtitle || ''}
                    onChange={(e) => setRestaurant({
                      ...restaurant,
                      activeBanner: { ...(restaurant.activeBanner || { title: '', active: true }), subtitle: e.target.value }
                    })}
                    className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm shadow-lg shadow-amber-500/25 transition-all flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                Salva Modifiche
              </button>
            </form>
          </div>
        )}

      </div>

      {/* Excel Import Modal */}
      <ExcelImportModal
        isOpen={isExcelModalOpen}
        onClose={() => setIsExcelModalOpen(false)}
        onImportDishes={(imported) => {
          const combined = [...imported, ...dishes];
          setDishes(combined);
          saveStoredDishes(combined);
        }}
        existingCategories={categories}
      />

      {/* Dish Add/Edit Modal */}
      {isDishFormOpen && editingDish && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-zinc-200 dark:border-zinc-800 p-6 relative max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">{editingDish.id ? 'Modifica Piatto' : 'Nuovo Piatto'}</h3>
            
            <form onSubmit={handleSaveDish} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold">Nome Piatto</label>
                <input
                  type="text"
                  required
                  value={editingDish.name || ''}
                  onChange={(e) => setEditingDish({ ...editingDish, name: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold">Prezzo (€)</label>
                  <input
                    type="number"
                    step="0.50"
                    required
                    value={editingDish.price || 10}
                    onChange={(e) => setEditingDish({ ...editingDish, price: parseFloat(e.target.value) })}
                    className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800 text-sm"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold">Categoria</label>
                  <select
                    value={editingDish.category || categories[0]}
                    onChange={(e) => setEditingDish({ ...editingDish, category: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800 text-sm"
                  >
                    {categories.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold">URL Immagine (Unsplash)</label>
                <input
                  type="url"
                  value={editingDish.image || ''}
                  onChange={(e) => setEditingDish({ ...editingDish, image: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800 text-sm"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold">Descrizione</label>
                <textarea
                  rows={3}
                  value={editingDish.description || ''}
                  onChange={(e) => setEditingDish({ ...editingDish, description: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800 text-sm resize-none"
                />
              </div>

              <div className="flex items-center gap-6 pt-2">
                <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingDish.isAvailable ?? true}
                    onChange={(e) => setEditingDish({ ...editingDish, isAvailable: e.target.checked })}
                    className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500"
                  />
                  Disponibile al tavolo
                </label>

                <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingDish.isSpecial ?? false}
                    onChange={(e) => setEditingDish({ ...editingDish, isSpecial: e.target.checked })}
                    className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500"
                  />
                  Offerta / In Evidenza
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-200 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsDishFormOpen(false)}
                  className="px-5 py-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-xs font-bold"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-650 text-white text-xs font-bold shadow-md"
                >
                  Salva Piatto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
