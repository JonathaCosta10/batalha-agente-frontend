import React from 'react';
import { Wifi, BatteryMedium, Signal, ChevronLeft, RotateCcw, Smartphone, Maximize2, Minimize2 } from 'lucide-react';

interface AndroidFrameProps {
  children: React.ReactNode;
  activeScreen: 'home' | 'chat' | 'communication';
  onNavigateHome: () => void;
  onNavigateBack: () => void;
  isDeviceFrame: boolean;
  onToggleDeviceFrame: () => void;
}

export const AndroidFrame: React.FC<AndroidFrameProps> = ({
  children,
  activeScreen,
  onNavigateHome,
  onNavigateBack,
  isDeviceFrame,
  onToggleDeviceFrame,
}) => {
  // Current time display for the Android status bar
  const now = new Date();
  const timeString = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  if (!isDeviceFrame) {
    return (
      <div className="w-full max-w-4xl mx-auto bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden min-h-[720px] flex flex-col relative">
        {/* Web View Navigation Bar */}
        <div className="bg-slate-900 text-white px-4 py-2.5 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#EC7000]"></span>
            <span className="font-semibold tracking-wide">Android App Demo · Itaú</span>
            <span className="text-slate-400">|</span>
            <span className="text-slate-300">
              {activeScreen === 'home' && 'Tela 1: Home Itaú'}
              {activeScreen === 'chat' && 'Tela 2: Conversa Pré-Preenchida'}
              {activeScreen === 'communication' && 'Tela 3: Interface de Comunicação (Template 3)'}
            </span>
          </div>
          <button
            onClick={onToggleDeviceFrame}
            className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-md transition-colors"
            title="Alternar para visualizador em formato de celular Android"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Modo Celular</span>
          </button>
        </div>
        <div className="flex-1 flex flex-col overflow-y-auto">
          {children}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center p-2 sm:p-6">
      {/* Device Frame Wrapper with Android Aesthetics */}
      <div className="relative w-full max-w-[412px] h-[840px] bg-slate-950 rounded-[44px] p-3 shadow-2xl shadow-slate-900/40 border-[4px] border-slate-800 ring-1 ring-slate-700/50 flex flex-col overflow-hidden">
        
        {/* Android Screen Surface */}
        <div className="w-full h-full bg-[#F5F6F8] rounded-[36px] flex flex-col overflow-hidden relative select-none">
          
          {/* Android Status Bar */}
          <div className="h-10 bg-white/95 backdrop-blur-sm px-6 flex items-center justify-between text-slate-700 text-[11px] font-semibold shrink-0 z-30 border-b border-slate-100">
            <span>{timeString}</span>
            
            {/* Front Camera Hole-punch */}
            <div className="w-3.5 h-3.5 rounded-full bg-slate-950 ring-2 ring-slate-200 flex items-center justify-center">
              <div className="w-1 h-1 rounded-full bg-blue-950/80"></div>
            </div>

            {/* Status Icons */}
            <div className="flex items-center gap-1.5 text-slate-600">
              <Signal className="w-3 h-3" />
              <Wifi className="w-3 h-3" />
              <div className="flex items-center gap-0.5">
                <span className="text-[10px] tabular-nums font-mono">88%</span>
                <BatteryMedium className="w-3.5 h-3.5 text-slate-700" />
              </div>
            </div>
          </div>

          {/* Screen Content Body */}
          <div className="flex-1 flex flex-col overflow-y-auto relative bg-[#F8F9FA]">
            {children}
          </div>

          {/* Android Bottom Navigation Pill Bar */}
          <div className="h-6 bg-white/95 backdrop-blur-sm border-t border-slate-100 flex items-center justify-center shrink-0 z-30">
            <div className="w-32 h-1 bg-slate-300 rounded-full"></div>
          </div>
        </div>
      </div>

      {/* Floating Mode Toggle Button beneath the phone */}
      <div className="mt-3 flex items-center gap-3 text-xs text-slate-500">
        <button
          onClick={onToggleDeviceFrame}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-lg shadow-sm transition-all"
        >
          <Maximize2 className="w-3.5 h-3.5 text-[#EC7000]" />
          <span>Expandir para Tela Completa</span>
        </button>
      </div>
    </div>
  );
};
