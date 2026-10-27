import React, { useState } from 'react';
import { X, Bell, Receipt, Send, CheckCircle2 } from 'lucide-react';
import { WaiterCall } from '../types';

interface WaiterCallModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitCall: (call: Omit<WaiterCall, 'id' | 'timestamp' | 'status'>) => void;
}

export const WaiterCallModal: React.FC<WaiterCallModalProps> = ({ isOpen, onClose, onSubmitCall }) => {
  const [tableNumber, setTableNumber] = useState('Tavolo 1');
  const [callType, setCallType] = useState<'call_waiter' | 'request_bill'>('call_waiter');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmitCall({
      tableNumber,
      type: callType,
      message: message.trim() || (callType === 'call_waiter' ? 'Assistenza al tavolo' : 'Richiesta conto'),
    });
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      onClose();
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div 
        className="bg-white dark:bg-zinc-900 rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-zinc-200 dark:border-zinc-800 p-6 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {submitted ? (
          <div className="py-12 text-center space-y-4 animate-fadeIn">
            <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-zinc-900 dark:text-white">Richiesta Inviata con Successo!</h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Il personale è stato notificato e arriverà al {tableNumber} in pochi istanti.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <Bell className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-zinc-900 dark:text-white">Assistenza Tavolo</h3>
                <p className="text-xs text-zinc-500">Chiama il cameriere o richiedi il conto istantaneamente</p>
              </div>
            </div>

            {/* Type Selector */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setCallType('call_waiter')}
                className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all ${
                  callType === 'call_waiter'
                    ? 'border-amber-500 bg-amber-50/50 dark:bg-amber-950/30 text-amber-900 dark:text-amber-300'
                    : 'border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300'
                }`}
              >
                <Bell className="w-6 h-6 mb-2" />
                <span className="text-sm font-semibold">Chiama Cameriere</span>
              </button>
              <button
                type="button"
                onClick={() => setCallType('request_bill')}
                className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all ${
                  callType === 'request_bill'
                    ? 'border-amber-500 bg-amber-50/50 dark:bg-amber-950/30 text-amber-900 dark:text-amber-300'
                    : 'border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300'
                }`}
              >
                <Receipt className="w-6 h-6 mb-2" />
                <span className="text-sm font-semibold">Chiedi il Conto</span>
              </button>
            </div>

            {/* Table Number */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                Numero Tavolo
              </label>
              <select
                value={tableNumber}
                onChange={(e) => setTableNumber(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 text-zinc-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                {Array.from({ length: 25 }, (_, i) => `Tavolo ${i + 1}`).map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            {/* Optional Note */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                Note Aggiuntive (Opzionale)
              </label>
              <input
                type="text"
                placeholder="Es. Sedia alta bambini, conto diviso..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 text-zinc-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3.5 px-6 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-bold flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25 transition-all"
            >
              <Send className="w-4 h-4" />
              Invia Richiesta al Personale
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
