import React, { useMemo, useState } from 'react';
import { Entity, CRT } from '../types';
import { Input } from './Input';

interface EntityFormProps {
  data: Entity;
  onChange: (data: Entity) => void;
  title: string;
}

export const EntityForm: React.FC<EntityFormProps> = ({ data, onChange, title }) => {
  const [certFileName, setCertFileName] = useState<string>('');
  const [certLoading, setCertLoading] = useState<boolean>(false);
  const [certError, setCertError] = useState<string>('');

  // Mostra status amigável sem confiar no valor "Presente" como base64
  const certStatus = useMemo(() => {
    if (!data?.certificadoArquivo) return 'Não cadastrado';
    if (data.certificadoArquivo === 'Presente') return 'Cadastrado';
    // Se vier base64 mesmo (em um cadastro novo) também é "cadastrado"
    return 'Cadastrado';
  }, [data?.certificadoArquivo]);

  const sanitize = (next: Entity) => {
    // ⚠️ MUITO IMPORTANTE:
    // O backend retorna certificadoArquivo = "Presente" na listagem.
    // Isso NÃO é base64. Então não podemos re-enviar isso em update.
    if ((next as any).certificadoArquivo === 'Presente') {
      // remove pra não sobrescrever no backend
      // (mantém o certificado já salvo lá)
      delete (next as any).certificadoArquivo;
    }
    // senha também pode vir "***" na listagem; não deve ser re-enviada
    if ((next as any).certificadoSenha === '***') {
      delete (next as any).certificadoSenha;
    }
    return next;
  };

  const handleChange = (field: keyof Entity, value: any) => {
    const next = sanitize({ ...data, [field]: value });
    onChange(next);
  };

  const handleAddressChange = (field: keyof Entity['endereco'], value: string) => {
    const next = sanitize({
      ...data,
      endereco: { ...data.endereco, [field]: value }
    });
    onChange(next);
  };

  const fileToBase64 = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = String(reader.result || '');
        // data:application/x-pkcs12;base64,XXXX
        const base64 = result.includes(',') ? result.split(',')[1] : result;
        resolve(base64);
      };
      reader.onerror = () => reject(new Error('Falha ao ler o arquivo do certificado.'));
      reader.readAsDataURL(file);
    });

  const handleCertFileChange = async (file: File | null) => {
    setCertError('');
    setCertFileName(file?.name || '');

    if (!file) {
      // não remove certificado do backend (só limpa o que estava sendo editado)
      handleChange('certificadoArquivo', undefined);
      return;
    }

    // valida extensão (leve, só pra UX)
    const lower = file.name.toLowerCase();
    if (!lower.endsWith('.pfx') && !lower.endsWith('.p12')) {
      setCertError('Arquivo inválido. Envie um certificado .pfx ou .p12');
      return;
    }

    setCertLoading(true);
    try {
      const base64 = await fileToBase64(file);
      handleChange('certificadoArquivo', base64);
    } catch (e: any) {
      setCertError(e?.message || 'Erro ao processar o certificado.');
    } finally {
      setCertLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 animate-fade-in">
      <h2 className="text-xl font-semibold text-gray-800 mb-6 pb-2 border-b border-gray-100">
        {title}
      </h2>

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
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Regime Tributário (CRT)
          </label>
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

        {/* ✅ NOVO BLOCO: CERTIFICADO DIGITAL */}
        <div className="md:col-span-2 mt-2 p-4 rounded-md border border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between gap-3 mb-2">
            <h3 className="text-md font-medium text-gray-700">Certificado Digital (A1)</h3>
            <span className="text-xs px-2 py-1 rounded bg-white border border-gray-200 text-gray-700">
              Status: {certStatus}
            </span>
          </div>

          <label className="block text-sm font-medium text-gray-700 mb-1">
            Arquivo do Certificado (.pfx / .p12)
          </label>
          <input
            type="file"
            accept=".pfx,.p12,application/x-pkcs12"
            className="block w-full text-sm text-gray-700 file:mr-3 file:px-3 file:py-2 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-white file:text-gray-700 border border-gray-300 rounded-md"
            onChange={(e) => handleCertFileChange(e.target.files?.[0] || null)}
          />

          <div className="mt-2 text-xs text-gray-600">
            {certLoading ? 'Processando certificado...' : (certFileName ? `Selecionado: ${certFileName}` : 'Nenhum arquivo selecionado')}
          </div>

          {certError ? (
            <div className="mt-2 text-sm text-red-600">{certError}</div>
          ) : null}

          <div className="mt-4">
            <Input
              label="Senha do Certificado"
              type="password"
              value={(data.certificadoSenha === '***' ? '' : (data.certificadoSenha || ''))}
              onChange={(e) => handleChange('certificadoSenha', e.target.value)}
              placeholder="Digite a senha do A1"
            />
            <div className="text-xs text-gray-600 mt-1">
              Se você não quiser trocar a senha/certificado, deixe em branco.
            </div>
          </div>
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
