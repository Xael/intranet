import React, { useRef } from 'react';
import { ConfigData } from '../types';
import { Input } from './Input';
import { Upload, ShieldCheck, Server } from 'lucide-react';

interface ConfigFormProps {
  data: ConfigData;
  onChange: (data: ConfigData) => void;
}

export const ConfigForm: React.FC<ConfigFormProps> = ({ data, onChange }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onChange({ ...data, certificado: e.target.files[0] });
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 animate-fade-in">
      <div className="flex items-center mb-6 pb-2 border-b border-gray-100">
         <div className="p-2 bg-indigo-100 rounded-lg mr-3">
             <Server className="w-5 h-5 text-indigo-600" />
         </div>
         <div>
            <h2 className="text-xl font-semibold text-gray-800">Configuração do Emissor</h2>
            <p className="text-sm text-gray-500">Defina o ambiente e as credenciais de assinatura.</p>
         </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Environment Selection */}
        <div className="space-y-4">
            <label className="block text-sm font-medium text-gray-700">Ambiente de Emissão</label>
            <div className="grid grid-cols-2 gap-3">
                <button
                    onClick={() => onChange({...data, ambiente: '2'})}
                    className={`flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-all ${data.ambiente === '2' ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-gray-200 hover:border-gray-300'}`}
                >
                    <span className="font-semibold">Homologação</span>
                    <span className="text-xs mt-1">Ambiente de Testes</span>
                </button>
                <button
                    onClick={() => onChange({...data, ambiente: '1'})}
                    className={`flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-all ${data.ambiente === '1' ? 'border-red-500 bg-red-50 text-red-700' : 'border-gray-200 hover:border-gray-300'}`}
                >
                    <span className="font-semibold">Produção</span>
                    <span className="text-xs mt-1">Com validade Jurídica</span>
                </button>
            </div>
            
            <div className="mt-4">
                <Input
                    label="Próximo Número da Nota"
                    value={data.proximoNumeroNota}
                    onChange={(e) => onChange({...data, proximoNumeroNota: e.target.value})}
                    type="number"
                />
                 <Input
                    label="Série"
                    value={data.serie}
                    onChange={(e) => onChange({...data, serie: e.target.value})}
                    type="number"
                />
            </div>
        </div>

        {/* Certificate Upload */}
        <div className="space-y-4">
            <label className="block text-sm font-medium text-gray-700">Certificado Digital (A1)</label>
            
            <div 
                className={`border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-colors ${data.certificado ? 'border-green-400 bg-green-50' : 'border-gray-300 hover:border-primary-400'}`}
                onClick={() => fileInputRef.current?.click()}
            >
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept=".pfx,.p12" 
                    onChange={handleFileChange}
                />
                
                {data.certificado ? (
                    <>
                        <ShieldCheck className="w-10 h-10 text-green-600 mb-2" />
                        <p className="font-medium text-green-800">{data.certificado.name}</p>
                        <p className="text-xs text-green-600 mt-1">Certificado carregado com sucesso</p>
                    </>
                ) : (
                    <>
                        <Upload className="w-10 h-10 text-gray-400 mb-2" />
                        <p className="font-medium text-gray-600">Clique para carregar o arquivo .PFX</p>
                        <p className="text-xs text-gray-400 mt-1">Necessário para assinatura digital</p>
                    </>
                )}
            </div>

            <Input
                label="Senha do Certificado"
                type="password"
                value={data.senhaCertificado || ''}
                onChange={(e) => onChange({...data, senhaCertificado: e.target.value})}
                placeholder="********"
            />
        </div>

      </div>
    </div>
  );
};