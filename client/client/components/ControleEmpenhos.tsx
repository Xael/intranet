import React, { useState, useMemo, useCallback } from 'react';
import { Municipio, Edital, Empenho, ArquivoAnexado } from '../types';
import { PlusIcon } from './icons/PlusIcon';
import { TrashIcon } from './icons/TrashIcon';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { ExclamationCircleIcon } from './icons/ExclamationCircleIcon';
import { EditIcon } from './icons/EditIcon';
import { api } from '../utils/api';

declare var XLSX: any;

// --- FUNÇÕES HELPER ---
const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
        const result = reader.result as string;
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
        const cleanDateString = dateString.split('T')[0];
        return new Date(cleanDateString).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
    } catch {
      return dateString;
    }
};


// --- Componente de Administração ---
const AdminPanel: React.FC<{data: Municipio[], setData: React.Dispatch<React.SetStateAction<Municipio[]>>}> = ({ data, setData }) => {
    const [isAdminOpen, setIsAdminOpen] = useState(false);
    
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
            <div onClick={() => setIsAdminOpen(!isAdminOpen)} className="flex justify-between items-center cursor-pointer">
                <h2 className="text-xl font-semibold text-gray-800">Cadastro Geral</h2>
                <svg className={`w-6 h-6 transform transition-transform ${isAdminOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </div>
            {isAdminOpen && (
                <div className="mt-4 pt-4 border-t">
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
            )}
        </div>
    );
};


// --- COMPONENTE PRINCIPAL ---
interface ControleEmpenhosProps {
  data: Municipio[];
  setData: React.Dispatch<React.SetStateAction<Municipio[]>>;
}

type PendingEmpenho = {
  municipioNome: string;
  editalNome: string;
  empenho: Empenho;
}

const ControleEmpenhos: React.FC<ControleEmpenhosProps> = ({ data, setData }) => {
  const [filtroMunicipioIdx, setFiltroMunicipioIdx] = useState<string>('');
  const [filtroEditalIdx, setFiltroEditalIdx] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [empenhoToEdit, setEmpenhoToEdit] = useState<Empenho | null>(null);
  
  const municipioAtual = useMemo(() => {
    const idx = parseInt(filtroMunicipioIdx, 10);
    return !isNaN(idx) && data[idx] ? data[idx] : null;
  }, [data, filtroMunicipioIdx]);

  const editalAtual = useMemo(() => {
    const munIdx = parseInt(filtroMunicipioIdx, 10);
    const edIdx = parseInt(filtroEditalIdx, 10);
    return !isNaN(munIdx) && !isNaN(edIdx) && data[munIdx]?.editais[edIdx] ? data[munIdx].editais[edIdx] : null;
  }, [data, filtroMunicipioIdx, filtroEditalIdx]);
  
  const allPendingEmpenhos = useMemo((): PendingEmpenho[] => {
    const pending: PendingEmpenho[] = [];
    data.forEach(municipio => {
      municipio.editais.forEach(edital => {
        if (edital.empenhos) {
          edital.empenhos.forEach(empenho => {
            if (!empenho.notaFiscalPDF) {
              pending.push({
                municipioNome: municipio.nome,
                editalNome: edital.nome,
                empenho: empenho
              });
            }
          });
        }
      });
    });
    return pending.sort((a, b) => new Date(a.empenho.dataPedido).getTime() - new Date(b.empenho.dataPedido).getTime());
  }, [data]);


  const updateEditalBackend = async (edital: Edital) => {
      try {
          const updatedEdital = await api.put(`/api/editais/${edital.id}/empenhos`, { empenhos: edital.empenhos });
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
  
  const handleSaveNewEmpenho = useCallback(async (formData: Omit<Empenho, 'id'>) => {
    if (!editalAtual) return;

    const newEmpenho = { ...formData, id: `new-${Date.now()}` };
    const updatedEdital = {
        ...editalAtual,
        empenhos: [...(editalAtual.empenhos || []), newEmpenho]
    };

    await updateEditalBackend(updatedEdital);
  }, [editalAtual, setData, municipioAtual]);

  const handleSaveEditedEmpenho = useCallback(async (formData: Empenho) => {
    if (!editalAtual) return;

    const updatedEdital = {
        ...editalAtual,
        empenhos: (editalAtual.empenhos || []).map(emp => emp.id === formData.id ? formData : emp)
    };

    await updateEditalBackend(updatedEdital);
    setEmpenhoToEdit(null);
  }, [editalAtual, setData, municipioAtual]);


  const handleRemoveEmpenho = useCallback(async (empenhoId: string) => {
    if(!window.confirm("Tem certeza que deseja remover este empenho?") || !editalAtual) return;
    
    const updatedEdital = {
        ...editalAtual,
        empenhos: (editalAtual.empenhos || []).filter(emp => emp.id !== empenhoId)
    };

    await updateEditalBackend(updatedEdital);
  }, [editalAtual, setData, municipioAtual]);

  const handleOpenEditModal = (empenho: Empenho) => {
    setEmpenhoToEdit(empenho);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEmpenhoToEdit(null);
  };

  const handleExportAllToExcel = () => {
      if (data.length === 0) {
          alert('Não há dados para exportar.');
          return;
      }

      const exportData: any[] = [];

      data.forEach(municipio => {
          municipio.editais.forEach(edital => {
              if (edital.empenhos && edital.empenhos.length > 0) {
                  edital.empenhos.forEach(emp => {
                      exportData.push({
                          'Município': municipio.nome,
                          'Edital': edital.nome,
                          'Data Pedido': formatDate(emp.dataPedido),
                          'Nº Pedido': emp.numeroPedido,
                          'Nº Processo': emp.numeroProcesso,
                          'Data NF': formatDate(emp.dataNotaFiscal),
                          'Valor NF': emp.valorNotaFiscal || 0,
                          'Status NF': emp.notaFiscalPDF ? 'Entregue' : 'Pendente',
                          'Status Pagamento': emp.statusPagamento || 'PENDENTE',
                          'Data Pagamento': formatDate(emp.dataPagamento),
                          'Arquivo Empenho': emp.empenhoPDF ? emp.empenhoPDF.nome : 'N/A',
                          'Arquivo NF': emp.notaFiscalPDF ? emp.notaFiscalPDF.nome : 'N/A'
                      });
                  });
              } else {
                   exportData.push({
                      'Município': municipio.nome,
                      'Edital': edital.nome,
                      'Status NF': 'Sem empenhos'
                   });
              }
          });
      });

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Relatório Geral");
      XLSX.writeFile(wb, `relatorio_empenhos_completo_${new Date().toISOString().slice(0,10)}.xlsx`);
  };

  return (
    <div className="space-y-6">
        <div className="flex flex-wrap justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-800">Controle de Empenhos</h1>
            <button onClick={handleExportAllToExcel} className="px-4 py-2 bg-green-700 text-white rounded-lg shadow hover:bg-green-800 text-sm">
                Exportar Relatório Completo (Excel)
            </button>
        </div>
      
      <div className="bg-white p-4 rounded-lg shadow-md space-y-4">
        <h2 className="text-xl font-semibold">Filtro de Visualização</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <select value={filtroMunicipioIdx} onChange={e => { setFiltroMunicipioIdx(e.target.value); setFiltroEditalIdx(''); }} className="w-full border-gray-300 rounded-md"><option value="">Selecione Município</option>{data.map((m, i) => <option key={m.id} value={i}>{m.nome}</option>)}</select>
          <select value={filtroEditalIdx} onChange={e => setFiltroEditalIdx(e.target.value)} className="w-full border-gray-300 rounded-md" disabled={!municipioAtual}><option value="">Selecione Edital</option>{municipioAtual?.editais.map((e, i) => <option key={e.id} value={i}>{e.nome}</option>)}</select>
        </div>
      </div>
      
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
                        <th className="px-4 py-3 text-center">Doc.</th>
                        <th className="px-4 py-3">Data Pedido</th>
                        <th className="px-4 py-3">N° Pedido</th>
                        <th className="px-4 py-3">N° Processo</th>
                        <th className="px-4 py-3 text-right">Valor NF</th>
                        <th className="px-4 py-3 text-center">Pagamento</th>
                        <th className="px-4 py-3 text-center">Data Baixa</th>
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
                            <td className="px-4 py-2 text-center">
                                <span className={`px-2 py-1 rounded text-xs font-bold ${empenho.statusPagamento === 'PAGO' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                    {empenho.statusPagamento || 'PENDENTE'}
                                </span>
                            </td>
                            <td className="px-4 py-2 text-center">{formatDate(empenho.dataPagamento)}</td>
                            <td className="px-4 py-2 text-center space-x-2">
                                {empenho.empenhoPDF && <button onClick={() => downloadBase64File(empenho.empenhoPDF!.dados, empenho.empenhoPDF!.nome, empenho.empenhoPDF!.tipo)} className="text-blue-600 hover:underline text-xs">Empenho</button>}
                                {empenho.notaFiscalPDF && <button onClick={() => downloadBase64File(empenho.notaFiscalPDF!.dados, empenho.notaFiscalPDF!.nome, empenho.notaFiscalPDF!.tipo)} className="text-green-600 hover:underline text-xs">Nota Fiscal</button>}
                            </td>
                            <td className="px-4 py-2 text-center space-x-2">
                                <button 
                                    onClick={() => handleOpenEditModal(empenho)} 
                                    className="text-blue-500 p-1 hover:text-blue-700"
                                    title="Editar Empenho"
                                >
                                    <EditIcon className="w-4 h-4"/>
                                </button>
                                <button onClick={() => handleRemoveEmpenho(empenho.id)} className="text-red-500 p-1 hover:text-red-700" title="Excluir Empenho"><TrashIcon className="w-4 h-4"/></button>
                            </td>
                        </tr>
                    ))}
                    {(!editalAtual?.empenhos || editalAtual.empenhos.length === 0) && <tr><td colSpan={9} className="text-center py-6 text-gray-500">Nenhum empenho registrado para este edital.</td></tr>}
                </tbody>
            </table>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md mt-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
          <ExclamationCircleIcon className="w-6 h-6 text-yellow-500 mr-2" />
          Resumo de Documentação Pendente
        </h2>
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {allPendingEmpenhos.length > 0 ? (
            allPendingEmpenhos.map(item => (
              <div key={item.empenho.id} className="p-4 border border-yellow-200 bg-yellow-50 rounded-md">
                <p className="font-bold text-gray-800">
                  <span className="text-sm font-normal text-gray-600">Município:</span> {item.municipioNome}
                </p>
                <p className="font-semibold text-gray-700">
                  <span className="text-sm font-normal text-gray-600">Edital:</span> {item.editalNome}
                </p>
                <div className="mt-2 text-sm text-gray-600">
                  <p><span className="font-medium">N° Pedido:</span> {item.empenho.numeroPedido}</p>
                  <p><span className="font-medium">Data:</span> {formatDate(item.empenho.dataPedido)}</p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-500">Nenhuma documentação de empenho pendente no momento.</p>
          )}
        </div>
      </div>

      {isModalOpen && <EmpenhoModal isNew onSave={handleSaveNewEmpenho} onClose={handleCloseModal} />}
      {empenhoToEdit && <EmpenhoModal isNew={false} empenho={empenhoToEdit} onSave={handleSaveEditedEmpenho} onClose={handleCloseModal} />}
      
      <AdminPanel data={data} setData={setData} />
    </div>
  );
};

interface EmpenhoModalProps {
    onClose: () => void;
    onSave: (formData: any) => Promise<void>;
    isNew: boolean;
    empenho?: Empenho;
}

const EmpenhoModal: React.FC<EmpenhoModalProps> = ({ onClose, onSave, isNew, empenho }) => {
    const [formData, setFormData] = useState<Partial<Empenho>>(empenho ? {
        ...empenho,
        dataPedido: empenho.dataPedido ? empenho.dataPedido.split('T')[0] : '', 
        dataNotaFiscal: empenho.dataNotaFiscal ? empenho.dataNotaFiscal.split('T')[0] : '',
        dataPagamento: empenho.dataPagamento ? empenho.dataPagamento.split('T')[0] : '',
        statusPagamento: empenho.statusPagamento || 'PENDENTE' // Default para registros antigos
    } : { 
        dataPedido: new Date().toISOString().split('T')[0],
        statusPagamento: 'PENDENTE'
    });
    
    const [files, setFiles] = useState<{ empenho?: File, nf?: File }>({});

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, files: fileList } = e.target;
        if (fileList && fileList.length > 0) {
            setFiles(prev => ({ ...prev, [name]: fileList[0] }));
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        let formattedValue: string | number = value;
        if (type === 'number') {
            formattedValue = parseFloat(value);
            if (isNaN(formattedValue)) formattedValue = ''; 
        }
        // Cast para qualquer tipo para evitar erro no 'statusPagamento' que é um enum
        setFormData(prev => ({ ...prev, [name]: formattedValue as any }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if(!formData.dataPedido || !formData.numeroPedido || !formData.numeroProcesso) {
            alert("Preencha todos os campos obrigatórios do pedido.");
            return;
        }

        let empenhoPDF: ArquivoAnexado | undefined = empenho?.empenhoPDF;
        let notaFiscalPDF: ArquivoAnexado | undefined = empenho?.notaFiscalPDF;
        
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

        const finalData: Empenho | Omit<Empenho, 'id'> = {
            ...(isNew ? {} : { id: empenho!.id }),
            dataPedido: formData.dataPedido!,
            numeroPedido: formData.numeroPedido!,
            numeroProcesso: formData.numeroProcesso!,
            empenhoPDF,
            notaFiscalPDF,
            dataNotaFiscal: formData.dataNotaFiscal,
            valorNotaFiscal: typeof formData.valorNotaFiscal === 'number' ? formData.valorNotaFiscal : undefined,
            statusPagamento: (formData.statusPagamento as 'PAGO' | 'PENDENTE') || 'PENDENTE',
            dataPagamento: formData.statusPagamento === 'PAGO' ? formData.dataPagamento : undefined
        } as Empenho;

        await onSave(finalData);
        onClose();
    };
    
    const title = isNew ? "Novo Registro de Empenho" : "Editar Registro de Empenho";

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                <form onSubmit={handleSubmit}>
                    <h3 className="text-xl font-bold p-6 border-b">{title}</h3>
                    <div className="p-6 space-y-4">
                        <fieldset className="border p-4 rounded-md">
                            <legend className="px-2 font-semibold text-sm">Dados do Pedido</legend>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div><label className="text-sm">Data</label><input type="date" name="dataPedido" value={formData.dataPedido || ''} onChange={handleChange} required className="w-full mt-1 border-gray-300 rounded-md" /></div>
                                <div><label className="text-sm">N° Pedido</label><input type="text" name="numeroPedido" value={formData.numeroPedido || ''} onChange={handleChange} required className="w-full mt-1 border-gray-300 rounded-md" /></div>
                                <div><label className="text-sm">N° Processo</label><input type="text" name="numeroProcesso" value={formData.numeroProcesso || ''} onChange={handleChange} required className="w-full mt-1 border-gray-300 rounded-md" /></div>
                            </div>
                            <div className="mt-4">
                                <label className="block text-sm font-medium text-gray-700">Arquivo do Empenho (PDF)</label>
                                <input type="file" name="empenho" accept="application/pdf" onChange={handleFileChange} className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"/>
                                {empenho?.empenhoPDF && <p className="text-xs text-green-600 mt-1">Arquivo atual: {empenho.empenhoPDF.nome}</p>}
                            </div>
                        </fieldset>

                        <fieldset className="border p-4 rounded-md">
                            <legend className="px-2 font-semibold text-sm">Dados da Nota Fiscal</legend>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div><label className="text-sm">Data da NF</label><input type="date" name="dataNotaFiscal" value={formData.dataNotaFiscal || ''} onChange={handleChange} className="w-full mt-1 border-gray-300 rounded-md" /></div>
                                <div><label className="text-sm">Valor da NF (R$)</label><input type="number" step="0.01" name="valorNotaFiscal" value={formData.valorNotaFiscal || ''} onChange={handleChange} className="w-full mt-1 border-gray-300 rounded-md" /></div>
                            </div>
                            <div className="mt-4">
                                <label className="block text-sm font-medium text-gray-700">Arquivo da Nota Fiscal (PDF)</label>
                                <input type="file" name="nf" accept="application/pdf" onChange={handleFileChange} className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"/>
                                {empenho?.notaFiscalPDF && <p className="text-xs text-green-600 mt-1">Arquivo atual: {empenho.notaFiscalPDF.nome}</p>}
                            </div>
                        </fieldset>

                        <fieldset className="border p-4 rounded-md">
                            <legend className="px-2 font-semibold text-sm">Pagamento</legend>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm">Status</label>
                                    <select name="statusPagamento" value={formData.statusPagamento} onChange={handleChange} className="w-full mt-1 border-gray-300 rounded-md">
                                        <option value="PENDENTE">Pendente</option>
                                        <option value="PAGO">Pago</option>
                                    </select>
                                </div>
                                {formData.statusPagamento === 'PAGO' && (
                                    <div><label className="text-sm">Data do Pagamento</label><input type="date" name="dataPagamento" value={formData.dataPagamento || ''} onChange={handleChange} required className="w-full mt-1 border-gray-300 rounded-md" /></div>
                                )}
                            </div>
                        </fieldset>
                    </div>
                    <div className="p-6 bg-gray-50 flex justify-end gap-3 border-t">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50">Cancelar</button>
                        <button type="submit" className="px-4 py-2 bg-primary border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-secondary">Salvar</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ControleEmpenhos;
