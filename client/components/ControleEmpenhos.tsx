
import React, { useState, useMemo, useCallback } from 'react';
import { Municipio, Edital, Empenho, ArquivoAnexado } from '../types';
import { PlusIcon } from './icons/PlusIcon';
import { TrashIcon } from './icons/TrashIcon';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { ExclamationCircleIcon } from './icons/ExclamationCircleIcon';

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
    const [year, month, day] = dateString.split('-');
    return `${day}/${month}/${year}`;
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
  
  const handleSaveEmpenho = useCallback(async (formData: Omit<Empenho, 'id'>) => {
    const munIdx = parseInt(filtroMunicipioIdx, 10);
    const edIdx = parseInt(filtroEditalIdx, 10);
    if (isNaN(munIdx) || isNaN(edIdx)) return;

    const newEmpenho = { ...formData, id: Date.now().toString() };

    setData(prevData =>
      prevData.map((mun, mIdx) => {
        if (mIdx !== munIdx) return mun;
        return {
          ...mun,
          editais: mun.editais.map((ed, eIdx) => {
            if (eIdx !== edIdx) return ed;
            const existingEmpenhos = ed.empenhos || [];
            return { ...ed, empenhos: [...existingEmpenhos, newEmpenho] };
          })
        };
      })
    );
  }, [filtroMunicipioIdx, filtroEditalIdx, setData]);

  const handleRemoveEmpenho = useCallback((empenhoId: string) => {
    if(!window.confirm("Tem certeza que deseja remover este empenho?")) return;
    const munIdx = parseInt(filtroMunicipioIdx, 10);
    const edIdx = parseInt(filtroEditalIdx, 10);
    if (isNaN(munIdx) || isNaN(edIdx)) return;

     setData(prevData =>
      prevData.map((mun, mIdx) => {
        if (mIdx !== munIdx) return mun;
        return {
          ...mun,
          editais: mun.editais.map((ed, eIdx) => {
            if (eIdx !== edIdx) return ed;
            const updatedEmpenhos = (ed.empenhos || []).filter(emp => emp.id !== empenhoId);
            return { ...ed, empenhos: updatedEmpenhos };
          })
        };
      })
    );
  }, [filtroMunicipioIdx, filtroEditalIdx, setData]);

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
                    {!editalAtual?.empenhos?.length && <tr><td colSpan={7} className="text-center py-6 text-gray-500">Nenhum empenho registrado para este edital.</td></tr>}
                </tbody>
            </table>
        </div>
      </div>

      {isModalOpen && <EmpenhoModal onClose={() => setIsModalOpen(false)} onSave={handleSaveEmpenho} />}
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