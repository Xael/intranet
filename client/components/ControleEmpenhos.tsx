import React, { useState, useMemo, useCallback } from 'react';
import { Municipio, Edital, Empenho, ArquivoAnexado } from '../types';
import { PlusIcon } from './icons/PlusIcon';
import { TrashIcon } from './icons/TrashIcon';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { ExclamationCircleIcon } from './icons/ExclamationCircleIcon';
import { api } from '../utils/api';

// --- FUNÇÕES HELPER ---
const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
        const result = reader.result as string;
        // Retorna apenas a parte base64 dos dados
        resolve(result.split(',')[1]);
    }
    reader.onerror = (error) => reject(error);
  });

const downloadBase64File = (base64Data: string, fileName: string, mimeType: string) => {
    try {
        const linkSource = `data:${mimeType};base64,${base64Data}`;
        const downloadLink = document.createElement("a");
        downloadLink.href = linkSource;
        downloadLink.download = fileName;
        downloadLink.click();
    } catch (error) {
        console.error("Erro ao iniciar download:", error);
        alert("Não foi possível realizar o download do arquivo.");
    }
};

const formatarMoeda = (valor?: number) => {
  if (typeof valor !== 'number' || isNaN(valor)) return 'N/A';
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('pt-BR', {timeZone: 'UTC'});
    } catch {
      return dateString;
    }
};


// --- COMPONENTE DE ADMINISTRAÇÃO ---
const AdminPanel: React.FC<{
  data: Municipio[];
  setData: React.Dispatch<React.SetStateAction<Municipio[]>>;
}> = ({ data, setData }) => {

  const handleAddMunicipio = async () => {
    const nome = prompt("Nome do novo município:");
    if (nome && nome.trim()) {
      try {
        const newMunicipio = await api.post('/api/municipios', { nome: nome.trim() });
        setData(prev => [...prev, { ...newMunicipio, editais: [] }]);
      } catch (error) {
        alert(`Erro ao adicionar município: ${(error as Error).message}`);
      }
    }
  };

  const handleRemoveMunicipio = async (id: string, nome: string) => {
    if (window.confirm(`Tem certeza que deseja remover "${nome}" e todos os seus editais?`)) {
      try {
        await api.delete(`/api/municipios/${id}`);
        setData(prev => prev.filter(m => m.id !== id));
      } catch (error) {
        alert(`Erro ao remover município: ${(error as Error).message}`);
      }
    }
  }

  const handleAddEdital = async (munId: string) => {
    const nome = prompt("Nome do novo edital:");
    if (nome && nome.trim()) {
      try {
        const newEdital = await api.post(`/api/municipios/${munId}/editais`, { nome: nome.trim() });
        setData(prev => prev.map(mun => {
          if (mun.id === munId) {
            return { ...mun, editais: [...mun.editais, newEdital] };
          }
          return mun;
        }));
      } catch (error) {
        alert(`Erro ao adicionar edital: ${(error as Error).message}`);
      }
    }
  };

  const handleRemoveEdital = async (editalId: string, editalNome: string) => {
    if (window.confirm(`Tem certeza que deseja remover o edital "${editalNome}"?`)) {
      try {
        await api.delete(`/api/editais/${editalId}`);
        setData(prev => prev.map(mun => ({
          ...mun,
          editais: mun.editais.filter(ed => ed.id !== editalId)
        })));
      } catch (error) {
        alert(`Erro ao remover edital: ${(error as Error).message}`);
      }
    }
  };

  return (
    <div className="bg-gray-50 p-4 rounded-lg shadow-md mt-8">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Administrar Municípios e Editais</h2>
      <div className="space-y-4">
        {data.map((mun) => (
          <div key={mun.id} className="p-3 bg-white border rounded-md">
            <div className="flex justify-between items-center">
              <h3 className="font-bold">{mun.nome}</h3>
              <div className="space-x-2">
                <button onClick={() => handleAddEdital(mun.id)} className="text-xs text-green-600 hover:text-green-800">Adicionar Edital</button>
                <button onClick={() => handleRemoveMunicipio(mun.id, mun.nome)} className="text-xs text-red-600 hover:text-red-800">Remover Município</button>
              </div>
            </div>
            <ul className="mt-2 space-y-1 text-sm">
              {mun.editais.map((ed) => (
                <li key={ed.id} className="flex justify-between items-center bg-gray-50 p-2 rounded">
                  <span>{ed.nome}</span>
                  <button onClick={() => handleRemoveEdital(ed.id, ed.nome)} className="text-xs text-red-500 hover:text-red-700">Remover</button>
                </li>
              ))}
            </ul>
          </div>
        ))}
        <button onClick={handleAddMunicipio} className="w-full px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300">
          Adicionar Município
        </button>
      </div>
    </div>
  );
};


// --- COMPONENTE PRINCIPAL ---
interface ControleEmpenhosProps {
  data: Municipio[];
  setData: React.Dispatch<React.SetStateAction<Municipio[]>>;
}

const ControleEmpenhos: React.FC<ControleEmpenhosProps> = ({ data, setData }) => {
  const [filtroMunicipioIdx, setFiltroMunicipioIdx] = useState<string>('');
  const [filtroEditalIdx, setFiltroEditalIdx] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const municipioAtual = useMemo(() => {
    const idx = parseInt(filtroMunicipioIdx, 10);
    return !isNaN(idx) && data[idx] ? data[idx] : null;
  }, [data, filtroMunicipioIdx]);

  const editalAtual = useMemo(() => {
    const munIdx = parseInt(filtroMunicipioIdx, 10);
    const edIdx = parseInt(filtroEditalIdx, 10);
    return !isNaN(munIdx) && !isNaN(edIdx) && data[munIdx]?.editais[edIdx] ? data[munIdx].editais[edIdx] : null;
  }, [data, filtroMunicipioIdx, filtroEditalIdx]);
  
  const updateEditalBackend = async (edital: Edital) => {
      try {
          const updatedEdital = await api.put(`/api/editais/${edital.id}`, edital);
          setData(prevData => prevData.map(mun => {
              if (mun.id === municipioAtual?.id) {
                  return {
                      ...mun,
                      editais: mun.editais.map(ed => ed.id === edital.id ? updatedEdital : ed)
                  };
              }
              return mun;
          }));
      } catch (error) {
          alert(`Erro ao atualizar empenhos: ${(error as Error).message}`);
      }
  };
  
  const handleSaveEmpenho = useCallback(async (formData: Omit<Empenho, 'id'>) => {
    if (!editalAtual) return;

    const newEmpenho = { ...formData, id: `new-${Date.now()}` };
    const updatedEdital = {
        ...editalAtual,
        empenhos: [...(editalAtual.empenhos || []), newEmpenho]
    };

    await updateEditalBackend(updatedEdital);
  }, [editalAtual, setData, municipioAtual]);

  const handleRemoveEmpenho = useCallback(async (empenhoId: string) => {
    if(!window.confirm("Tem certeza que deseja remover este empenho?") || !editalAtual) return;
    
    const updatedEdital = {
        ...editalAtual,
        empenhos: (editalAtual.empenhos || []).filter(emp => emp.id !== empenhoId)
    };

    await updateEditalBackend(updatedEdital);
  }, [editalAtual, setData, municipioAtual]);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-800">Controle de Empenhos</h1>
      
      {/* Filtros */}
      <div className="bg-white p-4 rounded-lg shadow-md space-y-4">
        <h2 className="text-xl font-semibold">Filtro de Visualização</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <select value={filtroMunicipioIdx} onChange={e => { setFiltroMunicipioIdx(e.target.value); setFiltroEditalIdx(''); }} className="w-full border-gray-300 rounded-md"><option value="">Selecione Município</option>{data.map((m, i) => <option key={m.id} value={i}>{m.nome}</option>)}</select>
          <select value={filtroEditalIdx} onChange={e => setFiltroEditalIdx(e.target.value)} className="w-full border-gray-300 rounded-md" disabled={!municipioAtual}><option value="">Selecione Edital</option>{municipioAtual?.editais.map((e, i) => <option key={e.id} value={i}>{e.nome}</option>)}</select>
        </div>
      </div>
      
      {/* Tabela de Empenhos */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="flex justify-between items-center p-4 border-b">
            <h2 className="text-xl font-semibold">Registros de Empenho</h2>
            <button onClick={() => setIsModalOpen(true)} disabled={!editalAtual} className="flex items-center px-4 py-2 bg-primary text-white rounded-lg shadow hover:bg-secondary disabled:bg-gray-400">
                <PlusIcon className="w-5 h-5 mr-2"/> Novo Empenho
            </button>
        </div>
        <div className="overflow-x-auto">
            <table className="w-full text-sm">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                    <tr>
                        <th className="px-4 py-3 text-center">Status</th>
                        <th className="px-4 py-3">Data Pedido</th>
                        <th className="px-4 py-3">N° Pedido</th>
                        <th className="px-4 py-3">N° Processo</th>
                        <th className="px-4 py-3 text-right">Valor NF</th>
                        <th className="px-4 py-3 text-center">Anexos</th>
                        <th className="px-4 py-3 text-center">Ações</th>
                    </tr>
                </thead>
                <tbody>
                    {editalAtual?.empenhos?.map(empenho => (
                        <tr key={empenho.id} className="border-b hover:bg-gray-50">
                            <td className="px-4 py-2 text-center">
                                {empenho.notaFiscalPDF ? 
                                    <CheckCircleIcon className="w-6 h-6 text-green-500 inline-block" title="Concluído"/> : 
                                    <ExclamationCircleIcon className="w-6 h-6 text-yellow-500 inline-block" title="Pendente"/>
                                }
                            </td>
                            <td className="px-4 py-2">{formatDate(empenho.dataPedido)}</td>
                            <td className="px-4 py-2">{empenho.numeroPedido}</td>
                            <td className="px-4 py-2">{empenho.numeroProcesso}</td>
                            <td className="px-4 py-2 text-right font-semibold">{formatarMoeda(empenho.valorNotaFiscal)}</td>
                            <td className="px-4 py-2 text-center space-x-2">
                                {empenho.empenhoPDF && <button onClick={() => downloadBase64File(empenho.empenhoPDF!.dados, empenho.empenhoPDF!.nome, empenho.empenhoPDF!.tipo)} className="text-blue-600 hover:underline text-xs">Empenho</button>}
                                {empenho.notaFiscalPDF && <button onClick={() => downloadBase64File(empenho.notaFiscalPDF!.dados, empenho.notaFiscalPDF!.nome, empenho.notaFiscalPDF!.tipo)} className="text-green-600 hover:underline text-xs">Nota Fiscal</button>}
                            </td>
                            <td className="px-4 py-2 text-center">
                                <button onClick={() => handleRemoveEmpenho(empenho.id)} className="text-red-500 p-1"><TrashIcon className="w-4 h-4"/></button>
                            </td>
                        </tr>
                    ))}
                    {(!editalAtual?.empenhos || editalAtual.empenhos.length === 0) && <tr><td colSpan={7} className="text-center py-6 text-gray-500">Nenhum empenho registrado para este edital.</td></tr>}
                </tbody>
            </table>
        </div>
      </div>

      {isModalOpen && <EmpenhoModal onClose={() => setIsModalOpen(false)} onSave={handleSaveEmpenho} />}
      
      <AdminPanel data={data} setData={setData} />
    </div>
  );
};

// --- MODAL COMPONENT ---
interface EmpenhoModalProps {
    onClose: () => void;
    onSave: (formData: Omit<Empenho, 'id'>) => Promise<void>;
}

const EmpenhoModal: React.FC<EmpenhoModalProps> = ({ onClose, onSave }) => {
    const [formData, setFormData] = useState<Partial<Omit<Empenho, 'id'>>>({ dataPedido: new Date().toISOString().split('T')[0] });
    const [files, setFiles] = useState<{ empenho?: File, nf?: File }>({});

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, files: fileList } = e.target;
        if (fileList && fileList.length > 0) {
            setFiles(prev => ({ ...prev, [name]: fileList[0] }));
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if(!formData.dataPedido || !formData.numeroPedido || !formData.numeroProcesso) {
            alert("Preencha todos os campos obrigatórios do pedido.");
            return;
        }

        let empenhoPDF: ArquivoAnexado | undefined;
        let notaFiscalPDF: ArquivoAnexado | undefined;
        
        try {
            if (files.empenho) {
                const dados = await fileToBase64(files.empenho);
                empenhoPDF = { nome: files.empenho.name, tipo: files.empenho.type, dados };
            }
            if (files.nf) {
                const dados = await fileToBase64(files.nf);
                notaFiscalPDF = { nome: files.nf.name, tipo: files.nf.type, dados };
            }
        } catch (error) {
            alert("Erro ao processar os arquivos. Tente novamente.");
            return;
        }

        const finalData: Omit<Empenho, 'id'> = {
            dataPedido: formData.dataPedido,
            numeroPedido: formData.numeroPedido,
            numeroProcesso: formData.numeroProcesso,
            empenhoPDF,
            notaFiscalPDF,
            dataNotaFiscal: formData.dataNotaFiscal,
            valorNotaFiscal: formData.valorNotaFiscal ? parseFloat(formData.valorNotaFiscal.toString()) : undefined,
        };

        await onSave(finalData);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                <form onSubmit={handleSubmit}>
                    <h3 className="text-xl font-bold p-6 border-b">Novo Registro de Empenho</h3>
                    <div className="p-6 space-y-4">
                        <fieldset className="border p-4 rounded-md">
                            <legend className="px-2 font-semibold text-sm">Dados do Pedido</legend>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div><label className="text-sm">Data</label><input type="date" name="dataPedido" value={formData.dataPedido || ''} onChange={handleChange} required className="w-full mt-1 border-gray-300 rounded-md"/></div>
                                <div><label className="text-sm">N° Pedido</label><input type="text" name="numeroPedido" onChange={handleChange} required className="w-full mt-1 border-gray-300 rounded-md"/></div>
                                <div><label className="text-sm">N° Processo</label><input type="text" name="numeroProcesso" onChange={handleChange} required className="w-full mt-1 border-gray-300 rounded-md"/></div>
                            </div>
                            <div className="mt-4"><label className="text-sm">Anexar Empenho (PDF)</label><input type="file" name="empenho" onChange={handleFileChange} accept=".pdf" className="w-full mt-1 text-sm"/></div>
                        </fieldset>
                        <fieldset className="border p-4 rounded-md">
                             <legend className="px-2 font-semibold text-sm">Dados da Nota Fiscal</legend>
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div><label className="text-sm">Data NF</label><input type="date" name="dataNotaFiscal" onChange={handleChange} className="w-full mt-1 border-gray-300 rounded-md"/></div>
                                <div><label className="text-sm">Valor NF</label><input type="number" step="0.01" name="valorNotaFiscal" onChange={handleChange} placeholder="0.00" className="w-full mt-1 border-gray-300 rounded-md"/></div>
                             </div>
                             <div className="mt-4"><label className="text-sm">Anexar Nota Fiscal (PDF)</label><input type="file" name="nf" onChange={handleFileChange} accept=".pdf" className="w-full mt-1 text-sm"/></div>
                        </fieldset>
                    </div>
                    <div className="p-6 bg-gray-50 flex justify-end gap-3">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-white border rounded-md">Cancelar</button>
                        <button type="submit" className="px-4 py-2 bg-primary text-white rounded-md">Salvar</button>
                    </div>
                </form>
            </div>
        </div>
    );
};


export default ControleEmpenhos;