import React, { useState, useMemo, useRef } from 'react';
import {
  Cotacao,
  CotacaoItem,
  // ValorReferencia, // REMOVIDO
  SimulacaoCotacaoItem,
  SimulacaoCotacaoSalva,
} from '../types';
import { PlusIcon } from './icons/PlusIcon';
import { TrashIcon } from './icons/TrashIcon';
import { SearchIcon } from './icons/SearchIcon';
import { EditIcon } from './icons/EditIcon';
import { api } from '../utils/api';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

// XLSX ainda está vindo via CDN no index.html
declare var XLSX: any;

const formatarMoeda = (valor: number) =>
  valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

// --- Helpers de fallback para simulações antigas ---
function ensureCotacaoOrigem(item: SimulacaoCotacaoItem): SimulacaoCotacaoItem {
  // alguns itens salvos antes da mudança não têm cotacaoOrigem
  if (!item.cotacaoOrigem) {
    return {
      ...item,
      cotacaoOrigem: {
        id: 'legacy',
        local: 'Origem não informada',
        data: new Date().toISOString().slice(0, 10),
      },
    };
  }
  return item;
}

interface CotacoesProps {
  cotacoes: Cotacao[];
  setCotacoes: React.Dispatch<React.SetStateAction<Cotacao[]>>;
  // valoresReferencia: ValorReferencia[]; // REMOVIDO
  // setValoresReferencia: React.Dispatch<React.SetStateAction<ValorReferencia[]>>; // REMOVIDO
  simulacoesSalvas: SimulacaoCotacaoSalva[];
  setSimulacoesSalvas: React.Dispatch<React.SetStateAction<SimulacaoCotacaoSalva[]>>;
}

const Cotacoes: React.FC<CotacoesProps> = ({
  cotacoes,
  setCotacoes,
  // valoresReferencia, // REMOVIDO
  // setValoresReferencia, // REMOVIDO
  simulacoesSalvas,
  setSimulacoesSalvas,
}) => {
  const [activeTab, setActiveTab] = useState<
    'cotacoes' | 'simulacao' | 'simulacoes_salvas' // 'referencia' REMOVIDO
  >('cotacoes');
  const [simulacaoItens, setSimulacaoItens] = useState<SimulacaoCotacaoItem[]>([]);
  const importFileRef = useRef<HTMLInputElement>(null);

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json: any[] = XLSX.utils.sheet_to_json(worksheet);

        if (json.length === 0) throw new Error('A planilha está vazia.');

        const groupedByCotacao = json.reduce<Record<string, any[]>>((acc, row) => {
          const local = String(row['Local da Cotação'] || 'N/A').trim();
          let data = String(row['Data'] || '').trim();

          if (data.match(/^\d{1,2}\/\d{1,2}\/\d{4}$/)) {
            const [d, m, y] = data.split('/');
            data = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
          } else if (!data.match(/^\d{4}-\d{2}-\d{2}$/)) {
            data = new Date().toISOString().split('T')[0];
          }

          const key = `${local}|${data}`;
          if (!acc[key]) acc[key] = [];

          const qtd = parseFloat(row['Quantidade']);
          const valUnit = parseFloat(row['Valor Unitário']);

          if (row['Produto'] && !isNaN(qtd) && !isNaN(valUnit)) {
            acc[key].push({
              produto: String(row['Produto']),
              unidade: String(row['Unidade'] || 'UN'),
              quantidade: qtd,
              valorUnitario: valUnit,
              valorTotal: qtd * valUnit,
              marca: String(row['Marca'] || ''),
            });
          }
          return acc;
        }, {});

        const novasCotacoes = Object.entries(groupedByCotacao).map(([key, itens]) => {
          const [local, data] = key.split('|');
          return { local, data, itens };
        });

        await api.post('/api/cotacoes/import', { cotacoes: novasCotacoes });
        const updatedCotacoes = await api.get('/api/cotacoes');
        setCotacoes(updatedCotacoes);

        alert(`${novasCotacoes.length} cotação(ões) importada(s) com sucesso!`);
      } catch (error) {
        alert(
          `Erro ao importar: ${(error as Error).message}. Verifique se a planilha tem as colunas: Produto, Unidade, Quantidade, Valor Unitário, Marca, Local da Cotação, Data.`
        );
      } finally {
        if (importFileRef.current) importFileRef.current.value = '';
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const TabButton: React.FC<{ tabId: typeof activeTab; label: string }> = ({ tabId, label }) => (
    <button
      onClick={() => setActiveTab(tabId)}
      className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
        activeTab === tabId
          ? 'border-primary text-primary'
          : 'border-transparent text-gray-500 hover:border-gray-300'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-800">Cotações e Simulações</h1>
      <div className="border-b border-gray-200 bg-white rounded-t-lg shadow-sm">
        <nav className="-mb-px flex space-x-2">
          <TabButton tabId="cotacoes" label="Cotações Salvas" />
          <TabButton tabId="simulacao" label="Simulação Atual" />
          <TabButton tabId="simulacoes_salvas" label="Simulações Salvas" />
          {/* <TabButton tabId="referencia" label="Valores de Referência" /> // REMOVIDO */}
        </nav>
      </div>

      <div className="bg-white p-6 rounded-b-lg shadow-md">
        {activeTab === 'cotacoes' && (
          <CotacoesSalvasView
            cotacoes={cotacoes}
            setCotacoes={setCotacoes}
            setSimulacaoItens={setSimulacaoItens}
            // valoresReferencia={valoresReferencia} // REMOVIDO
            handleImportClick={() => importFileRef.current?.click()}
          />
        )}
        {activeTab === 'simulacao' && (
          <SimulacaoAtualView
            simulacaoItens={simulacaoItens}
            setSimulacaoItens={setSimulacaoItens}
            setSimulacoesSalvas={setSimulacoesSalvas}
            // valoresReferencia={valoresReferencia} // REMOVIDO
          />
        )}
        {activeTab === 'simulacoes_salvas' && (
          <SimulacoesSalvasView
            simulacoesSalvas={simulacoesSalvas}
            setSimulacoesSalvas={setSimulacoesSalvas}
            setSimulacaoItens={setSimulacaoItens}
            setActiveTab={setActiveTab}
          />
        )}
        {/* Bloco 'referencia' REMOVIDO */}
      </div>
      <input
        type="file"
        ref={importFileRef}
        onChange={handleImport}
        accept=".xlsx, .xls"
        className="hidden"
      />
    </div>
  );
};

// ===================== NOVO MODAL DE EDIÇÃO DE ITEM =====================
const EditItemModal: React.FC<{
  item: CotacaoItem;
  cotacaoId: string;
  onSave: (cotacaoId: string, item: CotacaoItem) => Promise<void>;
  onClose: () => void;
}> = ({ item, cotacaoId, onSave, onClose }) => {
  const [form, setForm] = useState(item);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const valorTotal = form.quantidade * form.valorUnitario;
    onSave(cotacaoId, { ...form, valorTotal });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
        <form onSubmit={handleSubmit}>
          <h3 className="text-xl font-bold p-6 border-b">Editar Item da Cotação</h3>
          <div className="p-6 space-y-4">
            <div>
              <label className="text-sm">Produto</label>
              <input type="text" name="produto" value={form.produto} onChange={handleChange} className="w-full mt-1 border-gray-300 rounded-md" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm">Marca</label>
                <input type="text" name="marca" value={form.marca} onChange={handleChange} className="w-full mt-1 border-gray-300 rounded-md" />
              </div>
              <div>
                <label className="text-sm">Unidade</label>
                <input type="text" name="unidade" value={form.unidade} onChange={handleChange} className="w-full mt-1 border-gray-300 rounded-md" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm">Quantidade</label>
                <input type="number" name="quantidade" value={form.quantidade} onChange={handleChange} className="w-full mt-1 border-gray-300 rounded-md" />
              </div>
              <div>
                <label className="text-sm">Valor Unitário</label>
                <input type="number" step="0.01" name="valorUnitario" value={form.valorUnitario} onChange={handleChange} className="w-full mt-1 border-gray-300 rounded-md" />
              </div>
            </div>
          </div>
          <div className="p-6 bg-gray-50 flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-white border rounded-md">Cancelar</button>
            <button type="submit" className="px-4 py-2 bg-primary text-white rounded-md">Salvar Alterações</button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ===================== COTAÇÕES SALVAS =====================
const CotacoesSalvasView: React.FC<{
  cotacoes: Cotacao[];
  setCotacoes: React.Dispatch<React.SetStateAction<Cotacao[]>>;
  setSimulacaoItens: React.Dispatch<React.SetStateAction<SimulacaoCotacaoItem[]>>;
  // valoresReferencia: ValorReferencia[]; // REMOVIDO
  handleImportClick: () => void;
}> = ({ cotacoes, setCotacoes, setSimulacaoItens, handleImportClick }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedCotacaoId, setExpandedCotacaoId] = useState<string | null>(null);
  
  // NOVO: Estado para controlar o modal de edição
  const [editingItem, setEditingItem] = useState<{ cotacaoId: string; item: CotacaoItem } | null>(null);

  const filteredItems = useMemo(() => {
    if (!searchTerm.trim()) return [];
    const results: (CotacaoItem & { cotacao: Cotacao })[] = [];
    cotacoes.forEach((c) => {
      c.itens.forEach((item) => {
        if (
          item.produto.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.marca.toLowerCase().includes(searchTerm.toLowerCase())
        ) {
          results.push({ ...item, cotacao: c });
        }
      });
    });
    return results;
  }, [searchTerm, cotacoes]);

  // Lógica de referência REMOVIDA
  // const referenciaMap = useMemo(...)
  // const getComparisonClass = (...)

  const handleAddToSimulacao = (item: CotacaoItem, cotacao: Cotacao) => {
    setSimulacaoItens((prev) => {
      const newItem: SimulacaoCotacaoItem = {
        ...item,
        cotacaoOrigem: { id: cotacao.id, local: cotacao.local, data: cotacao.data },
      };
      return [...prev, newItem];
    });
    alert(`'${item.produto}' adicionado à simulação.`);
  };

  const handleDeleteCotacao = async (cotacaoId: string, local: string) => {
    if (window.confirm(`Tem certeza que deseja excluir a cotação de "${local}"?`)) {
      try {
        await api.delete(`/api/cotacoes/${cotacaoId}`);
        setCotacoes((prev) => prev.filter((cot) => cot.id !== cotacaoId));
      } catch (error) {
        alert(`Erro ao excluir cotação: ${(error as Error).message}`);
      }
    }
  };

  // NOVO: Função para salvar o item editado
  const handleSaveItemEdit = async (cotacaoId: string, updatedItem: CotacaoItem) => {
    try {
      const cotacaoToUpdate = cotacoes.find(c => c.id === cotacaoId);
      if (!cotacaoToUpdate) throw new Error("Cotação não encontrada");

      const updatedItens = cotacaoToUpdate.itens.map(i => 
        i.id === updatedItem.id ? updatedItem : i
      );
      
      const updatedCotacao = { ...cotacaoToUpdate, itens: updatedItens };

      // Assumindo que a API aceita um PUT no ID da cotação com o corpo da cotação atualizado
      const savedCotacao = await api.put(`/api/cotacoes/${cotacaoId}`, updatedCotacao);

      setCotacoes(prev => prev.map(c => 
        c.id === cotacaoId ? savedCotacao : c
      ));
      setEditingItem(null);
      alert("Item atualizado com sucesso!");
    } catch (error) {
      alert(`Erro ao atualizar item: ${(error as Error).message}`);
    }
  };


  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center gap-4">
        <div className="relative w-full max-w-md">
          <input
            type="text"
            placeholder="Buscar item em todas as cotações..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg"
          />
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        </div>
        <div className="text-right flex-shrink-0">
          <button
            onClick={handleImportClick}
            className="flex items-center px-4 py-2 bg-primary text-white rounded-lg shadow hover:bg-secondary ml-auto"
          >
            <PlusIcon className="w-5 h-5 mr-2" /> Importar Cotação
          </button>
          <p className="text-xs text-gray-500 mt-1">
            A planilha deve ter: Produto, Unidade, Quantidade, Valor Unitário, Marca, Local da
            Cotação, Data.
          </p>
        </div>
      </div>

      {searchTerm ? (
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2">Produto</th>
                <th className="px-4 py-2">Origem</th>
                <th className="px-4 py-2 text-right">Valor</th>
                <th className="px-4 py-2 text-center">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((item) => (
                <tr key={item.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-2 font-medium">
                    {item.produto} ({item.marca})
                  </td>
                  <td className="px-4 py-2 text-gray-600">
                    {item.cotacao.local} -{' '}
                    {new Date(item.cotacao.data + 'T00:00:00').toLocaleDateString('pt-BR')}
                  </td>
                  <td
                    // className com getComparisonClass REMOVIDO
                    className="px-4 py-2 text-right font-semibold"
                  >
                    {formatarMoeda(item.valorUnitario)}
                  </td>
                  <td className="px-4 py-2 text-center">
                    <button
                      onClick={() => handleAddToSimulacao(item, item.cotacao)}
                      className="text-blue-600 text-xs"
                    >
                      Add à Simulação
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="space-y-3">
          {cotacoes.map((c) => (
            <div key={c.id} className="border rounded-lg">
              <div
                onClick={() =>
                  setExpandedCotacaoId(expandedCotacaoId === c.id ? null : c.id)
                }
                className="p-4 flex justify-between items-center cursor-pointer hover:bg-gray-50"
              >
                <div>
                  <p className="font-bold">{c.local}</p>
                  <p className="text-sm text-gray-500">
                    {new Date(c.data + 'T00:00:00').toLocaleDateString('pt-BR')} - {c.itens.length}{' '}
                    itens
                  </p>
                </div>
                <TrashIcon
                  className="w-5 h-5 text-gray-400 hover:text-red-600"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteCotacao(c.id, c.local);
                  }}
                />
              </div>
              {expandedCotacaoId === c.id && (
                <div className="border-t p-2">
                  <table className="w-full text-sm">
                    <tbody>
                      {c.itens.map((item) => (
                        <tr key={item.id} className="hover:bg-blue-50">
                          <td className="px-2 py-1">{item.produto}</td>
                          <td
                            // className com getComparisonClass REMOVIDO
                            className="px-2 py-1 text-right"
                          >
                            {formatarMoeda(item.valorUnitario)}
                          </td>
                          {/* NOVO: Botão de Edição */}
                          <td className="px-2 py-1 text-center">
                             <button
                              onClick={() => setEditingItem({ cotacaoId: c.id, item: item })}
                              className="text-blue-600 p-1"
                              title="Editar Item"
                            >
                              <EditIcon className="w-4 h-4" />
                            </button>
                          </td>
                          <td className="px-2 py-1 text-center">
                            <button
                              onClick={() => handleAddToSimulacao(item, c)}
                              className="text-green-600 text-xs"
                            >
                              Add
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* NOVO: Renderiza o modal de edição se um item estiver selecionado */}
      {editingItem && (
        <EditItemModal 
          item={editingItem.item}
          cotacaoId={editingItem.cotacaoId}
          onSave={handleSaveItemEdit}
          onClose={() => setEditingItem(null)}
        />
      )}
    </div>
  );
};

// ===================== SIMULAÇÃO ATUAL =====================
const SimulacaoAtualView: React.FC<{
  simulacaoItens: SimulacaoCotacaoItem[];
  setSimulacaoItens: React.Dispatch<React.SetStateAction<SimulacaoCotacaoItem[]>>;
  setSimulacoesSalvas: React.Dispatch<React.SetStateAction<SimulacaoCotacaoSalva[]>>;
  // valoresReferencia: ValorReferencia[]; // REMOVIDO
}> = ({ simulacaoItens, setSimulacaoItens, setSimulacoesSalvas }) => {
  
  // NOVO: Estado para armazenar os valores de referência da simulação atual
  // A chave é o 'index' do item na lista simulacaoItens
  const [referenciaValues, setReferenciaValues] = useState<Record<number, number>>({});

  // NOVO: Lógica de totais atualizada
  const { totalCotacao, totalReferencia } = useMemo(() => {
    let totalCot = 0;
    let totalRef = 0;

    simulacaoItens.forEach((item, index) => {
      totalCot += item.valorTotal;
      const refUnitValor = referenciaValues[index] || 0;
      if (refUnitValor > 0) {
        totalRef += refUnitValor * item.quantidade;
      }
    });

    return { totalCotacao: totalCot, totalReferencia: totalRef };
  }, [simulacaoItens, referenciaValues]);


  // Lógica de referência antiga REMOVIDA
  // const referenciaMap = useMemo(...)
  // const getComparisonClass = (...)

  // NOVO: Handler para atualizar o valor de referência
  const handleReferenciaChange = (index: number, valor: string) => {
    const numValor = parseFloat(valor);
    setReferenciaValues(prev => ({
      ...prev,
      [index]: isNaN(numValor) ? 0 : numValor
    }));
  };

  const handleSave = async () => {
    const nome = prompt('Digite um nome para esta simulação:');
    if (nome && nome.trim()) {
      const novaSimulacaoPayload = {
        nome,
        data: new Date().toISOString(),
        itens: simulacaoItens,
        // Nota: Os valores de referência não são salvos, eles são apenas para simulação em tela.
        // Se precisar salvar, teríamos que adicionar 'referenciaValues' ao payload.
      };
      try {
        const savedSimulacao = await api.post('/api/simulacoes-cotacoes', novaSimulacaoPayload);
        setSimulacoesSalvas((prev) => [savedSimulacao, ...prev]);
        alert('Simulação salva com sucesso!');
      } catch (error) {
        alert(`Erro ao salvar simulação: ${(error as Error).message}`);
      }
    }
  };

  // ================== FUNÇÃO handleExport ATUALIZADA ==================
  const handleExport = async (type: 'pdf' | 'excel') => {
    if (simulacaoItens.length === 0) return;

    const itensNormalizados = simulacaoItens.map(ensureCotacaoOrigem);

    // ATUALIZADO: Cabeçalhos para PDF/Excel
    const head = [
      'Produto/Un.',
      'Qtd',
      'V.Unit(Cot)',
      'V.Unit(Ref)',
      'V.Total(Cot)',
      'V.Total(Ref)',
      'Diferença',
      'Marca',
      'Origem'
    ];
    
    const body = itensNormalizados.map((item, index) => {
      const refUnit = referenciaValues[index] || 0;
      const totalCot = item.valorTotal;
      const totalRef = item.quantidade * refUnit;
      const diferenca = totalCot - totalRef;

      return [
        `${item.produto} (${item.unidade})`,
        item.quantidade,
        formatarMoeda(item.valorUnitario),
        formatarMoeda(refUnit),
        formatarMoeda(totalCot),
        formatarMoeda(totalRef),
        formatarMoeda(diferenca),
        item.marca,
        `${item.cotacaoOrigem.local} (${new Date(
          item.cotacaoOrigem.data + 'T00:00:00'
        ).toLocaleDateString('pt-BR')})`,
      ];
    });

    if (type === 'pdf') {
      const doc = new jsPDF({ orientation: 'landscape' });

      doc.setFontSize(14);
      doc.text('Simulação de Cotação Comparativa', 14, 20);

      const styles = { font: 'helvetica', fontSize: 8 };
      const headStyles = { fillColor: [41, 128, 185], textColor: 255, fontStyle: 'bold' };
      
      const columnStyles = {
        0: { cellWidth: 45, overflow: 'linebreak' }, // Produto/Un.
        1: { cellWidth: 15, halign: 'right' }, // Qtd
        2: { cellWidth: 25, halign: 'right' }, // V.Unit(Cot)
        3: { cellWidth: 25, halign: 'right' }, // V.Unit(Ref)
        4: { cellWidth: 25, halign: 'right' }, // V.Total(Cot)
        5: { cellWidth: 25, halign: 'right' }, // V.Total(Ref)
        6: { cellWidth: 25, halign: 'right' }, // Diferença
        7: { cellWidth: 25, overflow: 'linebreak' }, // Marca
        8: { cellWidth: 'auto', overflow: 'linebreak' }, // Origem
      };

      autoTable(doc, {
        head: [head],
        body: body as any,
        startY: 25,
        styles: styles as any,
        headStyles: headStyles as any,
        columnStyles: columnStyles as any,
        alternateRowStyles: { fillColor: [245, 245, 245] },
        margin: { top: 25, left: 14, right: 14 },
      });

      const finalY = (doc as any).lastAutoTable?.finalY || 40;
      
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      
      // Reseta a cor para preto (padrão)
      doc.setTextColor('#000000');
      doc.text(`Total Cotação: ${formatarMoeda(totalCotacao)}`, 14, finalY + 10);
      doc.text(`Total Referência: ${formatarMoeda(totalReferencia)}`, 14, finalY + 16);
      
      doc.setFont('helvetica', 'bold');
      
      // CORREÇÃO: Usar string Hexadecimal ao invés de array RGB
      const diffColor = totalCotacao <= totalReferencia ? '#006400' : '#C80000'; // Verde escuro / Vermelho escuro
      doc.setTextColor(diffColor);
      
      doc.text(`Diferença (Cotação - Ref.): ${formatarMoeda(totalCotacao - totalReferencia)}`, 14, finalY + 22);
      
      // Reseta a cor novamente para garantir
      doc.setTextColor('#000000'); 

      doc.save(`simulacao_comparativa_${Date.now()}.pdf`);

    } else {
      // Lógica do Excel (mantida)
      const dataToExport = itensNormalizados.map((item, index) => {
         const refUnit = referenciaValues[index] || 0;
         const totalCot = item.valorTotal;
         const totalRef = item.quantidade * refUnit;
         const diferenca = totalCot - totalRef;
        return {
          'Produto': item.produto,
          'Unidade': item.unidade,
          'Marca': item.marca,
          'Quantidade': item.quantidade,
          'V. Unit. (Cotação)': item.valorUnitario,
          'V. Unit. (Ref.)': refUnit,
          'V. Total (Cotação)': totalCot,
          'V. Total (Ref.)': totalRef,
          'Diferença': diferenca,
          'Origem Cotação': item.cotacaoOrigem.local,
          'Data Cotação': item.cotacaoOrigem.data,
        };
      });
      dataToExport.push({} as any); 
      dataToExport.push({
        'Produto': 'TOTAIS',
        'V. Total (Cotação)': totalCotacao,
        'V. Total (Ref.)': totalReferencia,
        'Diferença': totalCotacao - totalReferencia,
      } as any);

      const ws = XLSX.utils.json_to_sheet(dataToExport);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Simulação Comparativa');
      XLSX.writeFile(wb, `simulacao_comparativa_${Date.now()}.xlsx`);
    }
  };
  // ================== FIM DA FUNÇÃO ATUALIZADA ==================


  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold">Itens na Simulação Atual</h3>
      <div className="border rounded-lg overflow-x-auto"> {/* Adicionado overflow-x-auto */}
        <table className="w-full text-sm min-w-[1024px]"> {/* Adicionado min-w-full ou um valor fixo */}
          <thead className="bg-gray-50">
            {/* ATUALIZADO: Cabeçalho da Tabela */}
            <tr>
              <th className="px-4 py-2 text-left">Produto/Un.</th>
              <th className="px-4 py-2 text-left">Origem</th>
              <th className="px-4 py-2 text-right">Qtd</th>
              <th className="px-4 py-2 text-right">V.Unit (Cot)</th>
              <th className="px-4 py-2 text-right">V.Total (Cot)</th>
              <th className="px-4 py-2 text-center w-36">V.Unit (Ref)</th>
              <th className="px-4 py-2 text-right">V.Total (Ref)</th>
              <th className="px-4 py-2 text-right">Diferença</th>
              <th className="px-4 py-2 text-center">Ações</th>
            </tr>
          </thead>
          <tbody>
            {simulacaoItens.map((rawItem, index) => {
              const item = ensureCotacaoOrigem(rawItem);
              
              // NOVO: Cálculos de referência
              const refUnit = referenciaValues[index] || 0;
              const totalRef = item.quantidade * refUnit;
              const diferenca = item.valorTotal - totalRef;
              const diffClass = diferenca === 0 ? '' : (diferenca < 0 ? 'text-green-600' : 'text-red-600');

              return (
                <tr key={`${item.id}-${index}`} className="border-b">
                  <td className="px-4 py-2">
                    <span className="font-medium">{item.produto}</span>
                    <span className="text-xs text-gray-500"> ({item.unidade})</span>
                  </td>
                  <td className="px-4 py-2 text-xs text-gray-500">{item.cotacaoOrigem.local}</td>
                  <td className="px-4 py-2 text-right">{item.quantidade}</td>
                  <td className="px-4 py-2 text-right">
                    {formatarMoeda(item.valorUnitario)}
                  </td>
                  <td className="px-4 py-2 text-right font-semibold">
                    {formatarMoeda(item.valorTotal)}
                  </td>
                  {/* NOVO: Input de Referência */}
                  <td className="px-2 py-1 align-middle">
                    <input 
                      type="number"
                      step="0.01"
                      placeholder="R$ 0,00"
                      className="w-full text-right border-gray-300 rounded-md p-1"
                      value={referenciaValues[index] || ''}
                      onChange={(e) => handleReferenciaChange(index, e.target.value)}
                    />
                  </td>
                  {/* NOVO: Total Referência */}
                  <td className={`px-4 py-2 text-right font-semibold ${diffClass}`}>
                    {formatarMoeda(totalRef)}
                  </td>
                  {/* NOVO: Diferença */}
                  <td className={`px-4 py-2 text-right font-semibold ${diffClass}`}>
                    {refUnit > 0 ? formatarMoeda(diferenca) : 'N/A'}
                  </td>
                  <td className="px-4 py-2 text-center">
                    <button
                      onClick={() =>
                        setSimulacaoItens((prev) => prev.filter((_, i) => i !== index))
                      }
                      className="text-red-500"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
          {/* ATUALIZADO: Rodapé com Totais */}
          <tfoot>
            <tr className="font-bold bg-gray-50 border-t-2">
              <td colSpan={4} className="px-4 py-2 text-right">
                Total Cotação:
              </td>
              <td className="px-4 py-2 text-right">{formatarMoeda(totalCotacao)}</td>
              <td></td> {/* Coluna do Input */}
              <td className="px-4 py-2 text-right">{formatarMoeda(totalReferencia)}</td>
              <td className="px-4 py-2 text-right">
                {totalReferencia > 0 ? formatarMoeda(totalCotacao - totalReferencia) : 'N/A'}
              </td>
              <td></td> {/* Coluna Ações */}
            </tr>
          </tfoot>
        </table>
      </div>
      <div className="flex flex-wrap gap-2">
        <button onClick={handleSave} className="px-4 py-2 bg-green-600 text-white rounded-lg">
          Salvar Simulação
        </button>
        <button onClick={() => handleExport('pdf')} className="px-4 py-2 bg-gray-700 text-white rounded-lg">
          Exportar PDF
        </button>
        <button onClick={() => handleExport('excel')} className="px-4 py-2 bg-gray-600 text-white rounded-lg">
          Exportar Excel
        </button>
        <button onClick={() => {
          setSimulacaoItens([]);
          setReferenciaValues({}); // Limpa também os valores de referência
        }} className="px-4 py-2 bg-red-600 text-white rounded-lg">
          Limpar
        </button>
      </div>
    </div>
  );
};

// ===================== SIMULAÇÕES SALVAS =====================
const SimulacoesSalvasView: React.FC<{
  simulacoesSalvas: SimulacaoCotacaoSalva[];
  setSimulacoesSalvas: React.Dispatch<React.SetStateAction<SimulacaoCotacaoSalva[]>>;
  setSimulacaoItens: React.Dispatch<React.SetStateAction<SimulacaoCotacaoItem[]>>;
  setActiveTab: React.Dispatch<
    React.SetStateAction<'cotacoes' | 'simulacao' | 'simulacoes_salvas'> // 'referencia' REMOVIDO
  >;
}> = ({ simulacoesSalvas, setSimulacoesSalvas, setSimulacaoItens, setActiveTab }) => {
  const handleRestore = (simulacao: SimulacaoCotacaoSalva) => {
    // normaliza todos os itens ao restaurar
    const itensNormalizados = (simulacao.itens || []).map(ensureCotacaoOrigem);
    setSimulacaoItens(itensNormalizados);
    setActiveTab('simulacao');
    alert(`Simulação '${simulacao.nome}' restaurada.`);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Deseja excluir esta simulação salva?')) {
      try {
        await api.delete(`/api/simulacoes-cotacoes/${id}`);
        setSimulacoesSalvas((prev) => prev.filter((s) => s.id !== id));
      } catch (error) {
        alert(`Erro ao excluir simulação: ${(error as Error).message}`);
      }
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold">Simulações de Cotação Salvas</h3>
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2">Nome</th>
              <th className="px-4 py-2">Data</th>
              <th className="px-4 py-2 text-right">Valor Total</th>
              <th className="px-4 py-2 text-center">Ações</th>
            </tr>
          </thead>
          <tbody>
            {simulacoesSalvas.map((sim) => (
              <tr key={sim.id} className="border-b hover:bg-gray-50">
                <td className="px-4 py-2 font-medium">{sim.nome}</td>
                <td className="px-4 py-2">{new Date(sim.data).toLocaleString('pt-BR')}</td>
                <td className="px-4 py-2 text-right">
                  {formatarMoeda(
                    (sim.itens || []).reduce((acc, item) => acc + (item.valorTotal || 0), 0)
                  )}
                </td>
                <td className="px-4 py-2 text-center space-x-2">
                  <button onClick={() => handleRestore(sim)} className="text-blue-600">
                    Restaurar
                  </button>
                  <button onClick={() => handleDelete(sim.id)} className="text-red-600">
                    Excluir
                  </button>
                </td>
              </tr>
            ))}
            {simulacoesSalvas.length === 0 && (
              <tr>
                <td colSpan={4} className="text-center py-4 text-gray-500">
                  Nenhuma simulação salva.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ===================== VALORES DE REFERÊNCIA =====================
// Componente ValoresReferenciaView REMOVIDO

export default Cotacoes;
