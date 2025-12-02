
import React from 'react';
import { Entity, CRT } from '../types';
import { Input } from './Input';

interface EntityFormProps {
  data: Entity;
  onChange: (data: Entity) => void;
  title: string;
}

export const EntityForm: React.FC<EntityFormProps> = ({ data, onChange, title }) => {
  const handleChange = (field: keyof Entity, value: any) => {
    onChange({ ...data, [field]: value });
  };

  const handleAddressChange = (field: keyof Entity['endereco'], value: string) => {
    onChange({
      ...data,
      endereco: { ...data.endereco, [field]: value }
    });
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 animate-fade-in">
      <h2 className="text-xl font-semibold text-gray-800 mb-6 pb-2 border-b border-gray-100">{title}</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="CNPJ"
          value={data.cnpj}
          onChange={(e) => handleChange('cnpj', e.target.value)}
          placeholder="00.000.000/0000-00"
        />
        <Input
          label="Razão Social / Nome"
          value={data.razaoSocial}
          onChange={(e) => handleChange('razaoSocial', e.target.value)}
          placeholder="Nome da Empresa LTDA"
        />
        <Input
          label="Inscrição Estadual"
          value={data.inscricaoEstadual}
          onChange={(e) => handleChange('inscricaoEstadual', e.target.value)}
          placeholder="000.000.000.000"
        />
        <Input
          label="Email"
          type="email"
          value={data.email || ''}
          onChange={(e) => handleChange('email', e.target.value)}
          placeholder="contato@empresa.com"
        />
        
        <div className="mb-4 md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Regime Tributário (CRT)</label>
            <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                value={data.crt || '1'}
                onChange={(e) => handleChange('crt', e.target.value as CRT)}
            >
                <option value="1">1 - Simples Nacional</option>
                <option value="2">2 - Simples Nacional (Excesso de Sublimite)</option>
                <option value="3">3 - Regime Normal (Lucro Presumido/Real)</option>
            </select>
        </div>
      </div>

      <h3 className="text-md font-medium text-gray-700 mt-6 mb-3">Endereço</h3>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Input
          label="CEP"
          value={data.endereco.cep}
          onChange={(e) => handleAddressChange('cep', e.target.value)}
          className="md:col-span-1"
        />
        <Input
          label="Logradouro"
          value={data.endereco.logradouro}
          onChange={(e) => handleAddressChange('logradouro', e.target.value)}
          className="md:col-span-2"
        />
        <Input
          label="Número"
          value={data.endereco.numero}
          onChange={(e) => handleAddressChange('numero', e.target.value)}
          className="md:col-span-1"
        />
        <Input
          label="Bairro"
          value={data.endereco.bairro}
          onChange={(e) => handleAddressChange('bairro', e.target.value)}
          className="md:col-span-1"
        />
        <Input
          label="Município"
          value={data.endereco.municipio}
          onChange={(e) => handleAddressChange('municipio', e.target.value)}
          className="md:col-span-1"
        />
        <Input
          label="Cód. IBGE Município"
          value={data.endereco.codigoIbge}
          onChange={(e) => handleAddressChange('codigoIbge', e.target.value)}
          placeholder="Ex: 3550308"
          title="Consulte a tabela do IBGE"
          className="md:col-span-1"
        />
        <Input
          label="UF"
          value={data.endereco.uf}
          onChange={(e) => handleAddressChange('uf', e.target.value.toUpperCase())}
          maxLength={2}
          placeholder="SP"
          className="md:col-span-1"
        />
      </div>
    </div>
  );
};
