import React, { useState } from 'react';
import { Customer, ScreenType } from '../types';
import { getRandomCustomerId } from '../data/mockCustomers';
import {
  Shuffle,
  Terminal,
  ChevronRight,
  Columns,
  Smartphone,
  Sparkles,
} from 'lucide-react';

interface CustomerSelectorBarProps {
  currentCustomer: Customer;
  onSelectCustomerId: (id: number) => void;
  activeScreen: ScreenType;
  onSelectScreen: (screen: ScreenType) => void;
  onOpenDjangoInspector: () => void;
  isDualDynamics: boolean;
  onToggleDualDynamics: () => void;
  isLazySimulated: boolean;
  onTriggerLazy: () => void;
}

export const CustomerSelectorBar: React.FC<CustomerSelectorBarProps> = ({
  currentCustomer,
  onSelectCustomerId,
  activeScreen,
  onSelectScreen,
  onOpenDjangoInspector,
  isDualDynamics,
  onToggleDualDynamics,
  isLazySimulated,
  onTriggerLazy,
}) => {
  const [inputVal, setInputVal] = useState<string>(String(currentCustomer.id));

  const handleRandomClick = () => {
    const randomId = getRandomCustomerId();
    setInputVal(String(randomId));
    onSelectCustomerId(randomId);
    onTriggerLazy();
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseInt(inputVal, 10);
    if (!isNaN(parsed) && parsed >= 1 && parsed <= 1000) {
      onSelectCustomerId(parsed);
      onTriggerLazy();
    } else {
      setInputVal(String(currentCustomer.id));
    }
  };

  return (
    <header className="bg-white border-b border-slate-200 py-2.5 px-4 shadow-xs sticky top-0 z-40">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        
        {/* Brand & Title */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-[#EC7000] text-white flex items-center justify-center font-bold text-sm shadow-xs">
              i
            </span>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-[#001E62] tracking-tight">Itaú Agentes</span>
                <span className="text-[10px] bg-orange-100 text-[#EC7000] font-bold px-1.5 py-0.2 rounded">Time 2</span>
              </div>
              <p className="text-[11px] text-slate-500 hidden sm:block">
                Recorte de 1.000 clientes · Processamento de Score na Fase 3
              </p>
            </div>
          </div>
        </div>

        {/* 3-Layer Screen Stepper Navigation */}
        <nav aria-label="Navegação das telas da aplicação" className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs">
          <button
            onClick={() => {
              onSelectScreen('home');
              onTriggerLazy();
            }}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              activeScreen === 'home'
                ? 'bg-white text-[#001E62] shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            1. Home Itaú
          </button>

          <ChevronRight className="w-3 h-3 text-slate-400" />

          <button
            onClick={() => {
              onSelectScreen('chat');
              onTriggerLazy();
            }}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              activeScreen === 'chat'
                ? 'bg-white text-[#001E62] shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            2. Conversa (Variável 1)
          </button>

          <ChevronRight className="w-3 h-3 text-slate-400" />

          <button
            onClick={() => {
              onSelectScreen('communication');
              onTriggerLazy();
            }}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              activeScreen === 'communication'
                ? 'bg-white text-[#001E62] shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            3. Comunicação (Novo Chat · Harness)
          </button>
        </nav>

        {/* Controls: Dual Dynamics, Lazy toggle, Customer Switcher & Django */}
        <div className="flex items-center gap-2 flex-wrap">
          
          {/* Botão de Alternar Duas Dinâmicas em Tela (Matching Screenshot) */}
          <button
            onClick={onToggleDualDynamics}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-xs ${
              isDualDynamics
                ? 'bg-[#001E62] text-white ring-2 ring-orange-400'
                : 'bg-white hover:bg-slate-50 border border-slate-300 text-slate-700'
            }`}
            title="Alternar entre visualização única ou duas dinâmicas em tela lado a lado"
          >
            <Columns className="w-3.5 h-3.5 text-orange-400" />
            <span>Duas Dinâmicas em Tela</span>
            {isDualDynamics && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse ml-0.5"></span>
            )}
          </button>

          {/* Botão para testar o formato Lazy Loading */}
          <button
            onClick={onTriggerLazy}
            disabled={isLazySimulated}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 rounded-lg text-xs font-semibold transition-colors"
            title="Simular animação do formato lazing / shimmer de carregamento"
          >
            <Sparkles className={`w-3.5 h-3.5 text-sky-600 ${isLazySimulated ? 'animate-spin' : ''}`} />
            <span className="hidden md:inline">Testar Lazing</span>
          </button>

          {/* Quick Randomizer button */}
          <button
            onClick={handleRandomClick}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 hover:bg-orange-100 text-[#EC7000] border border-orange-200/80 rounded-lg text-xs font-semibold transition-colors"
            title="Sorteia um cliente entre 1 e 1.000 para testar variação de F e M e score"
          >
            <Shuffle className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">Sortear (1-1000)</span>
          </button>

          {/* Quick ID Input Form */}
          <form onSubmit={handleFormSubmit} className="flex items-center gap-1">
            <span className="text-xs text-slate-400">ID:</span>
            <input
              type="number"
              min="1"
              max="1000"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              onBlur={handleFormSubmit}
              className="w-14 px-2 py-1 bg-slate-50 border border-slate-200 rounded-md text-xs font-mono font-bold text-center text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-400"
              title="Digite um ID de 1 a 1000"
            />
          </form>

          {/* Active Profile Pill */}
          <div className="hidden xl:flex items-center gap-2 text-xs bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg">
            <span className="font-semibold text-slate-700">{currentCustomer.nome}</span>
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
              currentCustomer.genero === 'F' ? 'bg-pink-100 text-pink-700' : 'bg-blue-100 text-blue-700'
            }`}>
              {currentCustomer.genero === 'F' ? 'F' : 'M'}
            </span>
          </div>

          {/* Django Backend Inspector Toggle */}
          <button
            onClick={onOpenDjangoInspector}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
            title="Abrir o Inspetor do Projeto Django desafio-itau-batalha-de-agentes-time2"
          >
            <Terminal className="w-3.5 h-3.5 text-orange-400" />
            <span className="hidden sm:inline">Django</span>
          </button>
        </div>

      </div>
    </header>
  );
};
