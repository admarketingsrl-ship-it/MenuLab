import React from 'react';
import { ShieldAlert } from 'lucide-react';

interface FooterProps {
  onOpenSuperAdmin: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenSuperAdmin }) => {
  return (
    <footer className="bg-zinc-900 border-t border-zinc-800 text-zinc-400 py-8 px-4 text-center text-xs space-y-4">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <p className="font-bold text-zinc-200">MenuLab SaaS - Piattaforma Digitale per Ristorazione</p>
          <p className="text-[11px] text-zinc-500 mt-0.5">Tutti i diritti riservati © 2026. Powered by Firebase & Google Drive.</p>
        </div>

        {/* Discreet SuperAdmin Link */}
        <button
          onClick={onOpenSuperAdmin}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors text-[11px] font-medium"
          title="Accesso riservato agenzia"
        >
          <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
          <span>Area Agenzia / SuperAdmin</span>
        </button>
      </div>
    </footer>
  );
};
