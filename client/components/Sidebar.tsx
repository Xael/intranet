import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { ViewType } from './MainPlatform';
import { HomeIcon } from './icons/HomeIcon';
import { CalendarIcon } from './icons/CalendarIcon';
import { ClipboardListIcon } from './icons/ClipboardListIcon';
import { ArchiveIcon } from './icons/ArchiveIcon';
import { LogoutIcon } from './icons/LogoutIcon';
import { ExternalLinkIcon } from './icons/ExternalLinkIcon';
import { ShieldIcon } from './icons/ShieldIcon';
import { DocumentTextIcon } from './icons/DocumentTextIcon';
import { PriceTagIcon } from './icons/PriceTagIcon';
import { CogIcon } from './icons/CogIcon';
import { CalculatorIcon } from './icons/CalculatorIcon';

interface SidebarProps {
  currentView: ViewType;
  setCurrentView: (view: ViewType) => void;
  nfeEnabled: boolean; // Nova prop
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, setCurrentView, nfeEnabled }) => {
  const { logout, user } = useAuth();

  const allNavItems = [
    { id: 'dashboard', label: 'Painel de Controle', icon: HomeIcon },
    { id: 'calendario', label: 'Calendário', icon: CalendarIcon },
    { id: 'status', label: 'Status', icon: ClipboardListIcon },
    // NFe será filtrado dinamicamente abaixo
    { id: 'nfe', label: 'Emissor NFe', icon: DocumentTextIcon },
    { id: 'materiais', label: 'Controle de Materiais', icon: ArchiveIcon },
    { id: 'empenhos', label: 'Controle de Empenhos', icon: DocumentTextIcon },
    { id: 'epi', label: 'Controle de EPI', icon: ShieldIcon },
    { id: 'cotacoes', label: 'Cotações', icon: PriceTagIcon },
    { id: 'calculadora', label: 'Calculadora', icon: CalculatorIcon },
    { id: 'configuracoes', label: 'Configurações', icon: CogIcon },
  ];

  // Garante que o usuário 'admincrb' seja sempre admin, além de checar o 'role'
  const isAdmin = user?.role === 'ADMIN' || user?.username === 'admincrb';

  // Lógica de Visibilidade:
  // 1. Configurações: Apenas Admin
  // 2. NFe: Apenas Admin E se estiver habilitado globalmente (nfeEnabled)
  // 3. Demais: Disponíveis para Operacional (exceto os acima)
  
  const operationalViews: ViewType[] = ['dashboard', 'calendario', 'status', 'cotacoes', 'epi'];

  const visibleNavItems = allNavItems.filter(item => {
      // Regra específica para NFe
      if (item.id === 'nfe') {
          return isAdmin && nfeEnabled;
      }
      // Regra específica para Configurações
      if (item.id === 'configuracoes') {
          return isAdmin;
      }
      // Regra geral para Admin (vê tudo, exceto o que foi filtrado acima se nfeEnabled for false)
      if (isAdmin) {
          return true;
      }
      // Regra para Operacional
      return operationalViews.includes(item.id as ViewType);
  });


  return (
    <div className="hidden md:flex flex-col w-64 bg-primary text-white">
      <div className="flex items-center justify-center h-20 border-b border-blue-800">
        <h1 className="text-2xl font-bold">C.R.B Serviços</h1>
      </div>
      <nav className="flex-1 px-2 py-4 space-y-2">
        {visibleNavItems.map((item) => (
          <a
            key={item.id}
            href="#"
            onClick={(e) => {
              e.preventDefault();
              setCurrentView(item.id as ViewType);
            }}
            className={`flex items-center px-4 py-2.5 text-sm font-medium rounded-md transition-colors duration-200 ${
              currentView === item.id
                ? 'bg-secondary text-white'
                : 'text-blue-100 hover:bg-blue-700 hover:text-white'
            }`}
          >
            <item.icon className="w-5 h-5 mr-3" />
            {item.label}
          </a>
        ))}
      </nav>
      <div className="px-4 py-2">
         <a
          href="https://app-crb.cloud/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center px-4 py-2.5 text-sm font-medium rounded-md text-blue-100 hover:bg-blue-700 hover:text-white transition-colors duration-200"
        >
          <ExternalLinkIcon className="w-5 h-5 mr-3" />
          Acessar App CRB
        </a>
      </div>
      <div className="p-4 border-t border-blue-800">
         <div className="text-center text-sm text-blue-200 mb-4">
            Logado como: <strong>{user?.name || user?.username}</strong>
        </div>
        <button
          onClick={logout}
          className="flex items-center justify-center w-full px-4 py-2.5 text-sm font-medium rounded-md bg-blue-700 hover:bg-red-600 transition-colors duration-200"
        >
          <LogoutIcon className="w-5 h-5 mr-3" />
          Sair
        </button>
      </div>
    </div>
  );
};

export default Sidebar;