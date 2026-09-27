/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Customer, ScreenType } from './types';
import { getCustomerById } from './data/mockCustomers';

// Importação unificada a partir da pasta única './components'
import {
  AndroidFrame,
  CustomerSelectorBar,
  DjangoArchitectureDrawer,
  Screen1ItauHome,
  Screen2Chat,
  Screen3Communication,
  Screen1Skeleton,
  Screen2Skeleton,
} from './components';

export default function App() {
  const [activeScreen, setActiveScreen] = useState<ScreenType>('home');
  const [customerId, setCustomerId] = useState<number>(42);
  const [isDeviceFrame, setIsDeviceFrame] = useState<boolean>(true);
  const [isDjangoDrawerOpen, setIsDjangoDrawerOpen] = useState<boolean>(false);
  
  // Chave ON - OFF sobre o ponto de 'inteiração-tela-iai' (Padrão: ON -> Liga o modo Neutro)
  const [isChaveAtiva, setIsChaveAtiva] = useState<boolean>(true);

  // Modo Duas Dinâmicas em Tela (Visualização simultânea de ambas as telas com lazing/skeleton)
  const [isDualDynamics, setIsDualDynamics] = useState<boolean>(false);

  // Estado do formato lazing / lazy loading durante transições
  const [isLazing, setIsLazing] = useState<boolean>(false);

  // Perfil determinístico do cliente (1 a 1000)
  const currentCustomer: Customer = getCustomerById(customerId);

  const triggerLazingAnimation = () => {
    setIsLazing(true);
    setTimeout(() => {
      setIsLazing(false);
    }, 600);
  };

  const handleSelectCustomer = (id: number) => {
    setCustomerId(id);
    triggerLazingAnimation();
  };

  const handleNextCustomer = () => {
    const nextId = (customerId % 1000) + 1;
    setCustomerId(nextId);
    setActiveScreen('home');
    triggerLazingAnimation();
  };

  const handleToggleChave = () => {
    setIsChaveAtiva((prev) => !prev);
  };

  const handleSelectScreenWithLazing = (screen: ScreenType) => {
    setActiveScreen(screen);
    triggerLazingAnimation();
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-900">
      
      {/* Top Testing Control Bar & Architecture Trigger */}
      <CustomerSelectorBar
        currentCustomer={currentCustomer}
        onSelectCustomerId={handleSelectCustomer}
        activeScreen={activeScreen}
        onSelectScreen={handleSelectScreenWithLazing}
        onOpenDjangoInspector={() => setIsDjangoDrawerOpen(true)}
        isDualDynamics={isDualDynamics}
        onToggleDualDynamics={() => setIsDualDynamics(!isDualDynamics)}
        isLazySimulated={isLazing}
        onTriggerLazy={triggerLazingAnimation}
      />

      {/* Main App Container */}
      <main className="flex-1 flex flex-col items-center justify-center p-2 sm:p-4">
        
        {/* DUAS DINÂMICAS EM TELA (LADO A LADO - CONFORME IMAGEM DO USUÁRIO) */}
        {isDualDynamics ? (
          <div className="w-full max-w-6xl mx-auto flex flex-col items-center gap-4">
            
            {/* Header explicativo da visualização comparativa */}
            <div className="bg-white/90 backdrop-blur-xs border border-slate-200 px-4 py-2 rounded-xl text-xs flex items-center justify-between gap-4 w-full max-w-4xl shadow-xs">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#EC7000] animate-pulse"></span>
                <span className="font-bold text-[#001E62]">Modo Duas Dinâmicas em Tela</span>
                <span className="text-slate-400">|</span>
                <span className="text-slate-600">
                  {isLazing ? 'Carregando formato lazing...' : 'Dinâmica 1 (Home Itaú) & Dinâmica 2 (Conversa / Aceite)'}
                </span>
              </div>
              <button
                onClick={triggerLazingAnimation}
                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-mono text-[11px] rounded-lg transition-colors font-bold"
              >
                Recarregar Lazing ↺
              </button>
            </div>

            {/* As duas telas em formato mobile lado a lado */}
            <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10">
              
              {/* DINÂMICA 1: Tela 1 (Home Itaú com Botão Estrela FAB no canto inferior direito) */}
              <div className="flex flex-col items-center">
                <div className="text-[11px] font-bold text-slate-500 mb-2 uppercase tracking-wider">
                  Dinâmica 1 · Home Itaú
                </div>
                <div className="relative w-[360px] sm:w-[380px] h-[720px] bg-slate-950 rounded-[40px] p-2.5 shadow-2xl border-[3px] border-slate-800 ring-1 ring-slate-700/50 flex flex-col overflow-hidden">
                  <div className="w-full h-full bg-[#F5F6F8] rounded-[32px] flex flex-col overflow-hidden relative select-none">
                    {/* Status bar */}
                    <div className="h-8 bg-white/95 px-5 flex items-center justify-between text-[10px] font-semibold text-slate-600 shrink-0 border-b border-slate-100">
                      <span>10:30</span>
                      <div className="w-2.5 h-2.5 rounded-full bg-slate-950 ring-2 ring-slate-200"></div>
                      <span className="font-mono text-[9px]">100%</span>
                    </div>

                    {/* Conteúdo: Se estiver em lazing exibe o Screen1Skeleton, senão a tela renderizada */}
                    <div className="flex-1 flex flex-col overflow-y-auto">
                      {isLazing ? (
                        <Screen1Skeleton />
                      ) : (
                        <Screen1ItauHome
                          customer={currentCustomer}
                          onOpenChat={() => {
                            setActiveScreen('chat');
                            triggerLazingAnimation();
                          }}
                        />
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* DINÂMICA 2: Tela 2 (Conversa / Variável 1 com Botão "E agora?" no mesmo nível) */}
              <div className="flex flex-col items-center">
                <div className="text-[11px] font-bold text-slate-500 mb-2 uppercase tracking-wider">
                  Dinâmica 2 · Conversa com Aceite
                </div>
                <div className="relative w-[360px] sm:w-[380px] h-[720px] bg-slate-950 rounded-[40px] p-2.5 shadow-2xl border-[3px] border-slate-800 ring-1 ring-slate-700/50 flex flex-col overflow-hidden">
                  <div className="w-full h-full bg-[#F5F6F8] rounded-[32px] flex flex-col overflow-hidden relative select-none">
                    {/* Status bar */}
                    <div className="h-8 bg-white/95 px-5 flex items-center justify-between text-[10px] font-semibold text-slate-600 shrink-0 border-b border-slate-100">
                      <span>10:30</span>
                      <div className="w-2.5 h-2.5 rounded-full bg-slate-950 ring-2 ring-slate-200"></div>
                      <span className="font-mono text-[9px]">100%</span>
                    </div>

                    {/* Conteúdo: Se estiver em lazing exibe o Screen2Skeleton, senão a tela renderizada */}
                    <div className="flex-1 flex flex-col overflow-y-auto">
                      {isLazing ? (
                        <Screen2Skeleton />
                      ) : (
                        <Screen2Chat
                          key={`${currentCustomer.id}-${isChaveAtiva}`}
                          customer={currentCustomer}
                          onBack={() => {
                            setActiveScreen('home');
                            triggerLazingAnimation();
                          }}
                          onTriggerCommunication={() => {
                            setIsDualDynamics(false);
                            setActiveScreen('communication');
                            triggerLazingAnimation();
                          }}
                          isChaveAtiva={isChaveAtiva}
                          onToggleChave={handleToggleChave}
                        />
                      )}
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        ) : (
          /* MODO SINGLE FRAME (VISUALIZAÇÃO PADRÃO COM FORMATO LAZING NA TRANSIÇÃO) */
          <AndroidFrame
            activeScreen={activeScreen}
            onNavigateHome={() => {
              setActiveScreen('home');
              triggerLazingAnimation();
            }}
            onNavigateBack={() => {
              if (activeScreen === 'communication') {
                setActiveScreen('chat');
                triggerLazingAnimation();
              } else if (activeScreen === 'chat') {
                setActiveScreen('home');
                triggerLazingAnimation();
              }
            }}
            isDeviceFrame={isDeviceFrame}
            onToggleDeviceFrame={() => setIsDeviceFrame(!isDeviceFrame)}
          >
            {isLazing ? (
              activeScreen === 'home' ? (
                <Screen1Skeleton />
              ) : (
                <Screen2Skeleton />
              )
            ) : (
              <>
                {/* TELA 1: Itaú Minimalist Home with Star FAB */}
                {activeScreen === 'home' && (
                  <Screen1ItauHome
                    customer={currentCustomer}
                    onOpenChat={() => {
                      setActiveScreen('chat');
                      triggerLazingAnimation();
                    }}
                  />
                )}

                {/* TELA 2: Conversa Pré-Preenchida com Chave ON-OFF (Neutro Ativo) & Botão "E agora?" */}
                {activeScreen === 'chat' && (
                  <Screen2Chat
                    key={`${currentCustomer.id}-${isChaveAtiva}`}
                    customer={currentCustomer}
                    onBack={() => {
                      setActiveScreen('home');
                      triggerLazingAnimation();
                    }}
                    onTriggerCommunication={() => {
                      setActiveScreen('communication');
                      triggerLazingAnimation();
                    }}
                    isChaveAtiva={isChaveAtiva}
                    onToggleChave={handleToggleChave}
                  />
                )}

                {/* TELA 3: Interface de Comunicação com Template 3 (Planilha Fixa) & Contexto */}
                {activeScreen === 'communication' && (
                  <Screen3Communication
                    customer={currentCustomer}
                    onBackToChat={() => {
                      setActiveScreen('chat');
                      triggerLazingAnimation();
                    }}
                    onRestart={() => {
                      setActiveScreen('home');
                      triggerLazingAnimation();
                    }}
                    onNextCustomer={handleNextCustomer}
                  />
                )}
              </>
            )}
          </AndroidFrame>
        )}
      </main>

      {/* Django Backend Architecture Modal Drawer */}
      <DjangoArchitectureDrawer
        isOpen={isDjangoDrawerOpen}
        onClose={() => setIsDjangoDrawerOpen(false)}
        currentCustomer={currentCustomer}
      />

    </div>
  );
}
