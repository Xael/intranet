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

interface SidebarProps {
  currentView: ViewType;
  setCurrentView: (view: ViewType) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, setCurrentView }) => {
  const { logout, user } = useAuth();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: HomeIcon },
    { id: 'calendario', label: 'Calendário', icon: CalendarIcon },
    { id: 'status', label: 'Status', icon: ClipboardListIcon },
    { id: 'materiais', label: 'Controle de Materiais', icon: ArchiveIcon },
    { id: 'empenhos', label: 'Controle de Empenhos', icon: DocumentTextIcon },
    { id: 'epi', label: 'Controle de EPI', icon: ShieldIcon },
  ];

  return (
    <div className="hidden md:flex flex-col w-64 bg-primary text-white">
      <div className="flex items-center justify-center h-20 border-b border-blue-800">
        <h1 className="text-2xl font-bold">C.R.B Serviços</h1>
      </div>
      <nav className="flex-1 px-2 py-4 space-y-2">
        {navItems.map((item) => (
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
