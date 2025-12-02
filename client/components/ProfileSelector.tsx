import React from 'react';
import { Entity } from '../types';
import { Building2, PlusCircle, CheckCircle2 } from 'lucide-react';

interface ProfileSelectorProps {
  profiles: Entity[];
  activeProfileId: string | null;
  onSelect: (profile: Entity) => void;
  onCreateNew: () => void;
}

export const ProfileSelector: React.FC<ProfileSelectorProps> = ({ 
  profiles, 
  activeProfileId, 
  onSelect, 
  onCreateNew 
}) => {
  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-95 z-[1000] flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-fade-in">
        <div className="bg-gradient-to-r from-blue-700 to-blue-900 p-6 text-white text-center">
          <Building2 className="w-12 h-12 mx-auto mb-3 opacity-90" />
          <h2 className="text-2xl font-bold">Selecione o Emissor</h2>
          <p className="text-blue-100 text-sm mt-1">Escolha a empresa para operar o sistema</p>
        </div>
        
        <div className="p-6 max-h-[400px] overflow-y-auto">
          {profiles.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">Nenhum emissor cadastrado.</p>
              <button 
                onClick={onCreateNew}
                className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md font-medium"
              >
                <PlusCircle className="w-5 h-5 mr-2" />
                Cadastrar Primeira Empresa
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {profiles.map(profile => (
                <button
                  key={profile.id}
                  onClick={() => onSelect(profile)}
                  className={`w-full flex items-center justify-between p-4 rounded-lg border-2 transition-all group ${
                    activeProfileId === profile.id 
                      ? 'border-blue-600 bg-blue-50' 
                      : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="text-left">
                    <p className="font-bold text-gray-800 group-hover:text-blue-700">{profile.razaoSocial}</p>
                    <p className="text-sm text-gray-500">CNPJ: {profile.cnpj}</p>
                  </div>
                  {activeProfileId === profile.id && (
                    <CheckCircle2 className="w-6 h-6 text-blue-600" />
                  )}
                </button>
              ))}
              
              <button 
                onClick={onCreateNew}
                className="w-full mt-4 flex items-center justify-center p-3 border border-dashed border-gray-300 rounded-lg text-gray-500 hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50 transition-all"
              >
                <PlusCircle className="w-5 h-5 mr-2" />
                Cadastrar Nova Empresa
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};