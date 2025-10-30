import React, {
  useState,
  useMemo,
  useRef,
  useEffect,
  useCallback
} from 'react';
import {
  Municipio,
  Edital,
  EstoqueItem,
  SaidaItem,
  SimulacaoItem,
  SimulacaoSalva
} from '../types';
import { SearchIcon } from './icons/SearchIcon';
import { PlusIcon } from './icons/PlusIcon';
import { TrashIcon } from './icons/TrashIcon';
import { EditIcon } from './icons/EditIcon';
import { Chart } from 'chart.js/auto';
import { api } from '../utils/api';

// --- DECLARAÇÕES GLOBAIS (scripts carregados no index.html) ---
declare var XLSX: any;
declare var jsPDF: any;

// --- HELPERS DE API (segundo seu backend) ---
const saveEditalItens = async (editalId: string, itens: EstoqueItem[]) => {
  return api.put(`/api/editais/${editalId}/itens`, { itens });
};

const saveEditalSaidas = async (editalId: string, saidas: SaidaItem[]) => {
  return api.put(`/api/editais/${editalId}/saidas`, { saidas });
};

// --- HELPERS ---
const formatarMoeda = (valor: number | undefined) => {
  if (typeof valor !== 'number' || isNaN(valor)) return 'R$ 0,00';
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

const parseDataBR = (dateString: string): Date | null => {
  if (!dateString) return null;
  try {
    const [dia, mes, ano] = dateString.split('/');
    const date = new Date(Number(ano), Number(mes) - 1, Number(dia));
    return isNaN(date.getTime()) ? null : date;
  } catch (e) {
    return null;
  }
};

// -------------------- ESTOQUE --------------------
const EstoqueView: React.FC<{
  edital: Edital;
  onUpdate: () => void;
}> = ({ edital, onUpdate }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddItemForm, setShowAddItemForm] = useState(false);
  const [newItem, setNewItem] = useState({
    descricao: '',
    marca: '',
    unidade: '',
    quantidade: '',
    valorUnitario: ''
  });

  // soma de saídas por índice de item
  const saidasPorItem = useMemo(() => {
    const map = new Map<number, number>();
    (edital.saidas || []).forEach((saida) => {
      map.set(saida.itemIndex, (map.get(saida.itemIndex) || 0) + saida.quantidade);
    });
    return map;
  }, [edital.saidas]);

  const itensComSaldo = useMemo(() => {
    return (edital.itens || [])
      .map((item, index) => {
        const qtdSaida = saidasPorItem.get(index) || 0;
        const qtdRestante = item.quantidade - qtdSaida;
        return {
          ...item,
          itemIndex: index,
          qtdInicial: item.quantidade,
          qtdSaida,
          qtdRestante,
          valorTotalRestante: qtdRestante * item.valorUnitario
        };
      })
      .filter(
        (item) =>
          item.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (item.marca || '').toLowerCase().includes(searchTerm.toLowerCase())
      );
  }, [edital.itens, saidasPorItem, searchTerm]);

  const totalEstoque = useMemo(
    () => itensComSaldo.reduce((acc, item) => acc + item.valorTotalRestante, 0),
    [itensComSaldo]
  );

  const updateEditalItens = async (itensAtualizados: EstoqueItem[]) => {
    try {
      await saveEditalItens(edital.id, itensAtualizados);
      onUpdate();
    } catch (error) {
      alert(`Erro ao atualizar itens do edital: ${(error as Error).message}`);
    }
  };

  const handleEditQuantidadeInicial = (itemIndex: number, valorAtual: number) => {
    const novoValorStr = prompt(
      'Digite a nova quantidade TOTAL (inicial) do item:',
      valorAtual.toString()
    );
    if (novoValorStr) {
      const novoValor = parseFloat(novoValorStr);
      if (!isNaN(novoValor) && novoValor >= 0) {
        const itensAtualizados = edital.itens.map((it, idx) =>
          idx === itemIndex
            ? {
                ...it,
                quantidade: novoValor,
                valorTotal: novoValor * it.valorUnitario
              }
            : it
        );
        updateEditalItens(itensAtualizados);
      } else {
        alert('Valor inválido.');
      }
    }
  };

  const handleRemoveItem = (itemIndex: number) => {
    if (
      window.confirm(
        `Tem certeza que deseja remover o item "${edital.itens[itemIndex].descricao}"?`
      )
    ) {
      const itensAtualizados = edital.itens.filter((_, idx) => idx !== itemIndex);
      updateEditalItens(itensAtualizados);
    }
  };

  const handleAddItemSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const { descricao, marca, unidade, quantidade, valorUnitario } = newItem;
    const qtdNum = parseFloat(quantidade);
    const valorNum = parseFloat(valorUnitario);

    if (!descricao.trim() || !unidade.trim() || isNaN(qtdNum) || isNaN(valorNum)) {
      alert('Preencha todos os campos corretamente.');
      return;
    }

    const novoItem: EstoqueItem = {
      id: `new-${Date.now()}`,
      descricao: descricao.trim(),
      marca: marca.trim(),
      unidade: unidade.trim(),
      quantidade: qtdNum,
      valorUnitario: valorNum,
      valorTotal: qtdNum * valorNum
    };

    const itensAtualizados = [...edital.itens, novoItem];
    updateEditalItens(itensAtualizados);

    setNewItem({
      descricao: '',
      marca: '',
      unidade: '',
      quantidade: '',
      valorUnitario: ''
    });
    setShowAddItemForm(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="relative w-full max-w-md">
          <input
            type="text"
            placeholder="Buscar item..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg"
          />
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        </div>
      </div>

      <div className="overflow-x-auto border rounded-lg">
        <table className="w-full text-sm">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50">
            <tr>
              <th className="px-4 py-3">Descrição</th>
              <th className="px-4 py-3">Marca</th>
              <th className="px-4 py-3 text-center">Un.</th>
              <th className="px-4 py-3 text-center">Qtd. Inicial</th>
              <th className="px-4 py-3 text-center">Qtd. Saída</th>
              <th className="px-4 py-3 text-center font-bold">Qtd. Restante</th>
              <th className="px-4 py-3 text-right">V. Unitário</th>
              <th className="px-4 py-3 text-right font-bold">V. Total Restante</th>
              <th className="px-4 py-3 text-center">Ações</th>
            </tr>
          </thead>
          <tbody>
            {itensComSaldo.map((item) => (
              <tr key={item.id} className="bg-white border-b hover:bg-gray-50">
                <td className="px-4 py-2 font-medium text-gray-900">
                  {item.descricao}
                </td>
                <td className="px-4 py-2">{item.marca}</td>
                <td className="px-4 py-2 text-center">{item.unidade}</td>
                <td className="px-4 py-2 text-center">{item.qtdInicial}</td>
                <td className="px-4 py-2 text-center">{item.qtdSaida}</td>
                <td className="px-4 py-2 text-center font-bold text-lg">
                  {item.qtdRestante}
                </td>
                <td className="px-4 py-2 text-right">
                  {formatarMoeda(item.valorUnitario)}
                </td>
                <td className="px-4 py-2 text-right font-bold">
                  {formatarMoeda(item.valorTotalRestante)}
                </td>
                <td className="px-4 py-2 text-center flex items-center justify-center space-x-2">
                  <button
                    onClick={() =>
                      handleEditQuantidadeInicial(item.itemIndex, item.qtdInicial)
                    }
                    className="text-blue-500 hover:text-blue-700 p-1"
                    title="Editar Qtd. Inicial"
                  >
                    <EditIcon className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleRemoveItem(item.itemIndex)}
                    className="text-red-500 hover:text-red-700 p-1"
                    title="Remover Item"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="font-bold bg-gray-50">
              <td colSpan={7} className="px-4 py-2 text-right">
                Total em Estoque:
              </td>
              <td className="px-4 py-2 text-right">
                {formatarMoeda(totalEstoque)}
              </td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="mt-6">
        <button
          onClick={() => setShowAddItemForm(!showAddItemForm)}
          className="flex items-center px-4 py-2 bg-primary text-white rounded-lg shadow hover:bg-secondary"
        >
          <PlusIcon className="w-5 h-5 mr-2" />{' '}
          {showAddItemForm ? 'Cancelar' : 'Adicionar Item Manualmente'}
        </button>
        {showAddItemForm && (
          <form
            onSubmit={handleAddItemSubmit}
            className="p-4 mt-4 bg-light rounded-lg border space-y-4"
          >
            <h3 className="font-semibold text-lg">Novo Item no Estoque</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <input
                type="text"
                placeholder="Descrição"
                value={newItem.descricao}
                onChange={(e) =>
                  setNewItem({ ...newItem, descricao: e.target.value })
                }
                className="border-gray-300 rounded-md"
                required
              />
              <input
                type="text"
                placeholder="Marca"
                value={newItem.marca}
                onChange={(e) =>
                  setNewItem({ ...newItem, marca: e.target.value })
                }
                className="border-gray-300 rounded-md"
              />
              <input
                type="text"
                placeholder="Unidade (Ex: un, kg)"
                value={newItem.unidade}
                onChange={(e) =>
                  setNewItem({ ...newItem, unidade: e.target.value })
                }
                className="border-gray-300 rounded-md"
                required
              />
              <input
                type="number"
                placeholder="Quantidade"
                value={newItem.quantidade}
                onChange={(e) =>
                  setNewItem({ ...newItem, quantidade: e.target.value })
                }
                className="border-gray-300 rounded-md"
                required
              />
              <input
                type="number"
                step="0.01"
                placeholder="Valor Unitário"
                value={newItem.valorUnitario}
                onChange={(e) =>
                  setNewItem({ ...newItem, valorUnitario: e.target.value })
                }
                className="border-gray-300 rounded-md"
                required
              />
              <button
                type="submit"
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Adicionar
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

// -------------------- SAÍDAS --------------------
const SaidasView: React.FC<{
  edital: Edital;
  onUpdate: () => void;
}> = ({ edital, onUpdate }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);

  const today = new Date().toISOString().split('T')[0];
  const [newSaida, setNewSaida] = useState({
    itemIndex: '',
    quantidade: '',
    notaFiscal: '',
    data: today
  });

  const saidasOrdenadas = useMemo(() => {
    return [...(edital.saidas || [])].sort((a, b) => {
      const dateA = parseDataBR(a.data);
      const dateB = parseDataBR(b.data);
      if (!dateA || !dateB) return 0;
      return dateB.getTime() - dateA.getTime();
    });
  }, [edital.saidas]);

  const filteredSaidas = useMemo(() => {
    return saidasOrdenadas.filter(
      (s) =>
        s.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.notaFiscal.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [saidasOrdenadas, searchTerm]);

  const handleFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setNewSaida((prev) => ({ ...prev, [name]: value }));
  };

  const updateEditalSaidas = async (saidasAtualizadas: SaidaItem[]) => {
    try {
      await saveEditalSaidas(edital.id, saidasAtualizadas);
      onUpdate();
    } catch (error) {
      alert(`Erro ao atualizar saídas: ${(error as Error).message}`);
    }
  };

  const handleAddSaida = (e: React.FormEvent) => {
    e.preventDefault();

    const itemIndex = parseInt(newSaida.itemIndex, 10);
    const quantidade = parseInt(newSaida.quantidade, 10);

    if (
      isNaN(itemIndex) ||
      !edital.itens[itemIndex] ||
      isNaN(quantidade) ||
      quantidade <= 0 ||
      !newSaida.notaFiscal.trim() ||
      !newSaida.data
    ) {
      alert('Por favor, preencha todos os campos corretamente.');
      return;
    }

    const itemSelecionado = edital.itens[itemIndex];
    const novaSaida: SaidaItem = {
      id: `new-${Date.now()}`,
      itemIndex: itemIndex,
      descricao: itemSelecionado.descricao,
      marca: itemSelecionado.marca,
      quantidade,
      valorUnitario: itemSelecionado.valorUnitario,
      valorTotal: quantidade * itemSelecionado.valorUnitario,
      data: newSaida.data.split('-').reverse().join('/'), // YYYY-MM-DD → DD/MM/YYYY
      notaFiscal: newSaida.notaFiscal.trim()
    };

    const saidasAtualizadas = [...(edital.saidas || []), novaSaida];
    updateEditalSaidas(saidasAtualizadas);

    setNewSaida({
      itemIndex: '',
      quantidade: '',
      notaFiscal: '',
      data: today
    });
    setShowForm(false);
  };

  const handleRemoveSaida = (saidaId: string) => {
    if (window.confirm('Tem certeza que deseja remover este registro de saída?')) {
      const saidasAtualizadas = (edital.saidas || []).filter(
        (s) => s.id !== saidaId
      );
      updateEditalSaidas(saidasAtualizadas);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="relative w-full max-w-md">
          <input
            type="text"
            placeholder="Buscar por descrição ou nota fiscal..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg"
          />
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center px-4 py-2 bg-primary text-white rounded-lg shadow hover:bg-secondary"
        >
          <PlusIcon className="w-5 h-5 mr-2" />{' '}
          {showForm ? 'Cancelar' : 'Nova Saída'}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleAddSaida}
          className="p-4 bg-light rounded-lg border space-y-4"
        >
          <h3 className="font-semibold text-lg">Registrar Nova Saída</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
            <div>
              <label className="block text-sm font-medium">Item</label>
              <select
                name="itemIndex"
                value={newSaida.itemIndex}
                onChange={handleFormChange}
                required
                className="mt-1 w-full border-gray-300 rounded-md shadow-sm"
              >
                <option value="">Selecione...</option>
                {edital.itens.map((item, index) => (
                  <option key={item.id} value={index}>
                    {item.descricao}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium">Quantidade</label>
              <input
                type="number"
                name="quantidade"
                value={newSaida.quantidade}
                onChange={handleFormChange}
                required
                className="mt-1 w-full border-gray-300 rounded-md shadow-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Nota Fiscal</label>
              <input
                type="text"
                name="notaFiscal"
                value={newSaida.notaFiscal}
                onChange={handleFormChange}
                required
                className="mt-1 w-full border-gray-300 rounded-md shadow-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Data</label>
              <input
                type="date"
                name="data"
                value={newSaida.data}
                onChange={handleFormChange}
                required
                className="mt-1 w-full border-gray-300 rounded-md shadow-sm"
              />
            </div>
            <div className="lg:col-span-4">
              <button
                type="submit"
                className="w-full md:w-auto px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Salvar Saída
              </button>
            </div>
          </div>
        </form>
      )}

      <div className="overflow-x-auto border rounded-lg">
        <table className="w-full text-sm">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50">
            <tr>
              <th className="px-4 py-3">Data</th>
              <th className="px-4 py-3">Nota Fiscal</th>
              <th className="px-4 py-3">Descrição</th>
              <th className="px-4 py-3 text-center">Qtd.</th>
              <th className="px-4 py-3 text-right">V. Unitário</th>
              <th className="px-4 py-3 text-right">V. Total</th>
              <th className="px-4 py-3 text-center">Ações</th>
            </tr>
          </thead>
          <tbody>
            {filteredSaidas.map((saida) => (
              <tr key={saida.id} className="bg-white border-b hover:bg-gray-50">
                <td className="px-4 py-2">{saida.data}</td>
                <td className="px-4 py-2">{saida.notaFiscal}</td>
                <td className="px-4 py-2 font-medium text-gray-900">
                  {saida.descricao}
                </td>
                <td className="px-4 py-2 text-center">{saida.quantidade}</td>
                <td className="px-4 py-2 text-right">
                  {formatarMoeda(saida.valorUnitario)}
                </td>
                <td className="px-4 py-2 text-right font-semibold">
                  {formatarMoeda(saida.valorTotal)}
                </td>
                <td className="px-4 py-2 text-center">
                  <button
                    onClick={() => handleRemoveSaida(saida.id)}
                    className="text-red-500 hover:text-red-700 p-1"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
            {filteredSaidas.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center py-6 text-gray-400">
                  Nenhum registro de saída encontrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// -------------------- SIMULAÇÃO --------------------
const SimulacaoView: React.FC<{
  edital: Edital;
  simulacaoItens: SimulacaoItem[];
  setSimulacaoItens: React.Dispatch<React.SetStateAction<SimulacaoItem[]>>;
  onUpdate: () => void;
  salvarSimulacao: (municipio: string, editalNome: string) => void;
  municipioNome: string;
}> = ({
  edital,
  simulacaoItens,
  setSimulacaoItens,
  onUpdate,
  salvarSimulacao,
  municipioNome
}) => {
  const [selectedItemIndex, setSelectedItemIndex] = useState<string>('');
  const [simulacaoQtd, setSimulacaoQtd] = useState<string>('1');

  const totalSimulado = useMemo(
    () => simulacaoItens.reduce((acc, item) => acc + item.valorTotal, 0),
    [simulacaoItens]
  );

  const handleAdicionarSimulacao = () => {
    const itemIndex = parseInt(selectedItemIndex, 10);
    const quantidade = parseInt(simulacaoQtd, 10);

    if (isNaN(itemIndex) || !edital.itens[itemIndex] || isNaN(quantidade) || quantidade <= 0) {
      alert('Selecione um item e uma quantidade válida.');
      return;
    }

    const item = edital.itens[itemIndex];
    const itemSimulado: SimulacaoItem = {
      itemIndex,
      descricao: item.descricao,
      marca: item.marca,
      unidade: item.unidade,
      quantidade,
      valorUnitario: item.valorUnitario,
      valorTotal: quantidade * item.valorUnitario
    };

    setSimulacaoItens((prev) => [...prev, itemSimulado]);
    setSelectedItemIndex('');
    setSimulacaoQtd('1');
  };

  const handleRemoverSimulacao = (index: number) => {
    setSimulacaoItens((prev) => prev.filter((_, i) => i !== index));
  };

  const confirmSimulacaoOnBackend = async (saidasNovas: SaidaItem[]) => {
    try {
      const saidasAtualizadas = [...(edital.saidas || []), ...saidasNovas];
      await saveEditalSaidas(edital.id, saidasAtualizadas);
      onUpdate();
      setSimulacaoItens([]);
      alert('Saídas registradas com sucesso a partir da simulação!');
    } catch (error) {
      alert(`Erro ao confirmar saídas: ${(error as Error).message}`);
    }
  };

  const handleConfirmarSimulacao = () => {
    if (simulacaoItens.length === 0) {
      alert('Nenhum item na simulação.');
      return;
    }
    const notaFiscal = prompt('Digite o número da Nota Fiscal para estas saídas:');
    if (!notaFiscal || !notaFiscal.trim()) return;

    const data = new Date().toLocaleDateString('pt-BR');

    const novasSaidas: SaidaItem[] = simulacaoItens.map((sim) => ({
      id: `saida-${Date.now()}-${sim.itemIndex}-${Math.random()}`,
      itemIndex: sim.itemIndex,
      descricao: sim.descricao,
      marca: sim.marca,
      quantidade: sim.quantidade,
      valorUnitario: sim.valorUnitario,
      valorTotal: sim.valorTotal,
      data,
      notaFiscal
    }));

    confirmSimulacaoOnBackend(novasSaidas);
  };

  const handleExportarPDF = (simplificado: boolean) => {
    if (simulacaoItens.length === 0) return;
    const doc = new jsPDF.default();
    const title = simplificado
      ? `Lista de Materiais - ${municipioNome} - ${edital.nome}`
      : `Simulação de Saída - ${municipioNome} - ${edital.nome}`;
    doc.text(title, 14, 20);

    const head = simplificado
      ? [['Descrição', 'Marca', 'Unidade', 'Quantidade']]
      : [['Descrição', 'Marca', 'Unidade', 'Qtd', 'V. Unit.', 'V. Total']];

    const body = simulacaoItens.map((item) =>
      simplificado
        ? [item.descricao, item.marca, item.unidade, item.quantidade]
        : [
            item.descricao,
            item.marca,
            item.unidade,
            item.quantidade,
            formatarMoeda(item.valorUnitario),
            formatarMoeda(item.valorTotal)
          ]
    );

    doc.autoTable({ head, body, startY: 30 });

    if (!simplificado) {
      const finalY = (doc as any).lastAutoTable.finalY + 10;
      doc.text(`Total Simulado: ${formatarMoeda(totalSimulado)}`, 14, finalY);
    }

    doc.save(
      `simulacao_${simplificado ? 'simplificada' : 'completa'}_${new Date()
        .toISOString()
        .slice(0, 10)}.pdf`
    );
  };

  return (
    <div className="space-y-4">
      <div className="p-4 bg-light rounded-lg border grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
        <select
          value={selectedItemIndex}
          onChange={(e) => setSelectedItemIndex(e.target.value)}
          className="w-full border-gray-300 rounded-md"
        >
          <option value="">Selecione um item...</option>
          {edital.itens.map((item, index) => (
            <option key={item.id} value={index}>
              {item.descricao}
            </option>
          ))}
        </select>
        <input
          type="number"
          value={simulacaoQtd}
          onChange={(e) => setSimulacaoQtd(e.target.value)}
          min="1"
          className="w-full border-gray-300 rounded-md"
          placeholder="Quantidade"
        />
        <button
          onClick={handleAdicionarSimulacao}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg"
        >
          Adicionar à Simulação
        </button>
      </div>

      <div className="overflow-x-auto border rounded-lg">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2">Descrição</th>
              <th className="px-4 py-2">Qtd</th>
              <th className="px-4 py-2 text-right">V. Total</th>
              <th className="px-4 py-2 text-center">Ações</th>
            </tr>
          </thead>
          <tbody>
            {simulacaoItens.map((item, index) => (
              <tr key={index} className="border-b">
                <td className="px-4 py-2">{item.descricao}</td>
                <td className="px-4 py-2">{item.quantidade}</td>
                <td className="px-4 py-2 text-right">
                  {formatarMoeda(item.valorTotal)}
                </td>
                <td className="px-4 py-2 text-center">
                  <button
                    onClick={() => handleRemoverSimulacao(index)}
                    className="text-red-500"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
            {simulacaoItens.length === 0 && (
              <tr>
                <td colSpan={4} className="text-center py-4 text-gray-400">
                  Nenhum item na simulação.
                </td>
              </tr>
            )}
          </tbody>
          <tfoot>
            <tr className="font-bold bg-gray-50">
              <td colSpan={2} className="px-4 py-2 text-right">
                Total:
              </td>
              <td className="px-4 py-2 text-right">
                {formatarMoeda(totalSimulado)}
              </td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={handleConfirmarSimulacao}
          className="px-4 py-2 bg-green-600 text-white rounded-lg"
        >
          Confirmar Saídas
        </button>
        <button
          onClick={() => salvarSimulacao(municipioNome, edital.nome)}
          className="px-4 py-2 bg-orange-500 text-white rounded-lg"
        >
          Salvar Simulação
        </button>
        <button
          onClick={() => setSimulacaoItens([])}
          className="px-4 py-2 bg-red-600 text-white rounded-lg"
        >
          Limpar
        </button>
        <button
          onClick={() => handleExportarPDF(false)}
          className="px-4 py-2 bg-gray-700 text-white rounded-lg"
        >
          PDF Completo
        </button>
        <button
          onClick={() => handleExportarPDF(true)}
          className="px-4 py-2 bg-gray-500 text-white rounded-lg"
        >
          PDF Simplificado
        </button>
      </div>
    </div>
  );
};

// -------------------- SIMULAÇÕES SALVAS --------------------
const SimulacoesSalvasView: React.FC<{
  simulacoesSalvas: SimulacaoSalva[];
  setSimulacoesSalvas: React.Dispatch<React.SetStateAction<SimulacaoSalva[]>>;
  restaurarSimulacao: (simulacao: SimulacaoSalva) => void;
}> = ({ simulacoesSalvas, setSimulacoesSalvas, restaurarSimulacao }) => {
  const handleExcluir = async (id: string) => {
    if (window.confirm('Deseja excluir esta simulação salva?')) {
      try {
        await api.delete(`/api/simulacoes/${id}`);
        setSimulacoesSalvas((prev) => prev.filter((s) => s.id !== id));
      } catch (error) {
        alert(`Erro ao excluir simulação: ${(error as Error).message}`);
      }
    }
  };

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto border rounded-lg">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2">Data</th>
              <th className="px-4 py-2">Município</th>
              <th className="px-4 py-2">Edital</th>
              <th className="px-4 py-2 text-center">Itens</th>
              <th className="px-4 py-2 text-center">Ações</th>
            </tr>
          </thead>
          <tbody>
            {simulacoesSalvas.map((sim) => (
              <tr key={sim.id} className="border-b">
                <td className="px-4 py-2">
                  {new Date(sim.data).toLocaleString('pt-BR')}
                </td>
                <td className="px-4 py-2">{sim.municipio}</td>
                <td className="px-4 py-2">{sim.edital}</td>
                <td className="px-4 py-2 text-center">{sim.itens.length}</td>
                <td className="px-4 py-2 text-center space-x-2">
                  <button
                    onClick={() => restaurarSimulacao(sim)}
                    className="text-blue-600"
                  >
                    Restarar
                  </button>
                  <button
                    onClick={() => handleExcluir(sim.id)}
                    className="text-red-600"
                  >
                    Excluir
                  </button>
                </td>
              </tr>
            ))}
            {simulacoesSalvas.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center py-4">
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

// -------------------- IMPORTAR --------------------
const ImportarView: React.FC<{
  data: Municipio[];
  onUpdate: () => void;
}> = ({ data, onUpdate }) => {
  const importFileRef = useRef<HTMLInputElement>(null);
  const [target, setTarget] = useState({ munNome: '', edNome: '' });

  const handleImportar = async () => {
    const file = importFileRef.current?.files?.[0];
    const { munNome, edNome } = target;
    if (!file || !munNome.trim() || !edNome.trim()) {
      alert('Selecione um arquivo e preencha o nome do Município e do Edital de destino.');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const workbook = XLSX.read(e.target?.result, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const importedItems: any[] = XLSX.utils.sheet_to_json(sheet, { header: 1 });

        const novosItens: Omit<EstoqueItem, 'id'>[] = importedItems.slice(1).map((row, i) => {
          const [descricao, marca, unidade, quantidade, valorUnitario] = row;
          const qtdNum = parseFloat(quantidade);
          const valorNum = parseFloat(valorUnitario);
          if (!descricao || !unidade || isNaN(qtdNum) || isNaN(valorNum))
            throw new Error(`Linha ${i + 2} da planilha está inválida.`);
          return {
            descricao,
            marca: marca || '',
            unidade,
            quantidade: qtdNum,
            valorUnitario: valorNum,
            valorTotal: qtdNum * valorNum
          };
        });

        // 1. Encontra ou cria município
        let municipio: Municipio | undefined = data.find(
          (m) => m.nome.toLowerCase() === munNome.trim().toLowerCase()
        );
        if (!municipio) {
          const newMunicipio = await api.post('/api/municipios', {
            nome: munNome.trim()
          });
          if (!newMunicipio || !newMunicipio.id) {
            throw new Error(
              'Falha ao criar o município. O servidor não retornou um objeto válido.'
            );
          }
          municipio = { ...newMunicipio, editais: [] };
        }

        if (!municipio) {
          throw new Error('Município não pôde ser encontrado ou criado.');
        }

        // 2. Encontra ou cria edital
        let edital: Edital | undefined = municipio.editais.find(
          (e) => e.nome.toLowerCase() === edNome.trim().toLowerCase()
        );
        if (!edital) {
          const newEdital = await api.post(`/api/municipios/${municipio.id}/editais`, {
            nome: edNome.trim()
          });
          if (!newEdital || !newEdital.id) {
            throw new Error(
              'Falha ao criar o edital. O servidor não retornou um objeto válido.'
            );
          }
          edital = { ...newEdital, itens: [], saidas: [], empenhos: [] };
        }

        if (!edital) {
          throw new Error('Edital não pôde ser encontrado ou criado.');
        }

        // 3. Atualiza itens
        const itensExistentes = edital.itens || [];
        const itensComNovosIds: EstoqueItem[] = novosItens.map((item) => ({
          ...item,
          id: `new-${Date.now()}-${Math.random()}`
        }));
        const itensFinal = [...itensExistentes, ...itensComNovosIds];

        await saveEditalItens(edital.id, itensFinal);

        alert(
          `${novosItens.length} itens importados com sucesso para ${munNome} / ${edNome}!`
        );
        onUpdate();
      } catch (error) {
        alert(`Erro ao importar: ${(error as Error).message}`);
      }
    };
    reader.readAsBinaryString(file);
  };

  return (
    <div className="space-y-4 p-4 border rounded-lg bg-light">
      <h3 className="font-semibold text-lg">
        Importar Itens de Planilha Excel (.xlsx)
      </h3>
      <p className="text-sm text-gray-600">
        A planilha deve ter o cabeçalho: Descrição, Marca, Unidade, Quantidade,
        Valor Unitário (nessa ordem).
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <input
          type="text"
          placeholder="Nome do Município de Destino"
          value={target.munNome}
          onChange={(e) => setTarget({ ...target, munNome: e.target.value })}
          className="border-gray-300 rounded-md"
        />
        <input
          type="text"
          placeholder="Nome do Edital de Destino"
          value={target.edNome}
          onChange={(e) => setTarget({ ...target, edNome: e.target.value })}
          className="border-gray-300 rounded-md"
        />
      </div>
      <input
        type="file"
        ref={importFileRef}
        accept=".xlsx, .xls"
        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
      />
      <button onClick={handleImportar} className="px-4 py-2 bg-primary text-white rounded-lg">
        Importar Arquivo
      </button>
    </div>
  );
};

// -------------------- RELATÓRIOS --------------------
const RelatoriosView: React.FC<{ data: Municipio[] }> = ({ data }) => {
  const chartGeralRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);

  const relatorioGeral = useMemo(() => {
    const geral = { totalInicial: 0, totalEntregue: 0 };
    const porMunicipio: {
      [key: string]: { totalInicial: 0; totalEntregue: 0 };
    } = {};

    data.forEach((mun) => {
      if (!porMunicipio[mun.nome])
        porMunicipio[mun.nome] = { totalInicial: 0, totalEntregue: 0 };
      (mun.editais || []).forEach((ed) => {
        const totalInicialEdital = (ed.itens || []).reduce(
          (sum, item) => sum + item.valorTotal,
          0
        );
        const totalEntregueEdital = (ed.saidas || []).reduce(
          (sum, s) => sum + s.valorTotal,
          0
        );

        geral.totalInicial += totalInicialEdital;
        geral.totalEntregue += totalEntregueEdital;
        porMunicipio[mun.nome].totalInicial += totalInicialEdital;
        porMunicipio[mun.nome].totalEntregue += totalEntregueEdital;
      });
    });

    return { geral, porMunicipio };
  }, [data]);

  useEffect(() => {
    if (chartGeralRef.current) {
      if (chartInstance.current) chartInstance.current.destroy();
      const ctx = chartGeralRef.current.getContext('2d');
      if (ctx) {
        const labels = Object.keys(relatorioGeral.porMunicipio);
        const dataInicial = labels.map(
          (l) => relatorioGeral.porMunicipio[l].totalInicial
        );
        const dataEntregue = labels.map(
          (l) => relatorioGeral.porMunicipio[l].totalEntregue
        );

        chartInstance.current = new Chart(ctx, {
          type: 'bar',
          data: {
            labels,
            datasets: [
              {
                label: 'Valor Total Inicial',
                data: dataInicial,
                backgroundColor: 'rgba(54, 162, 235, 0.6)'
              },
              {
                label: 'Valor Total Entregue',
                data: dataEntregue,
                backgroundColor: 'rgba(75, 192, 192, 0.6)'
              }
            ]
          },
          options: {
            responsive: true,
            scales: { y: { beginAtZero: true } }
          }
        });
      }
    }
    return () => {
      if (chartInstance.current) chartInstance.current.destroy();
    };
  }, [relatorioGeral]);

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-lg">Relatório Geral Consolidado</h3>
      <div className="p-4 bg-light rounded-lg border">
        <p>
          Total Geral dos Editais:{' '}
          <span className="font-bold">
            {formatarMoeda(relatorioGeral.geral.totalInicial)}
          </span>
        </p>
        <p>
          Total Geral Entregue:{' '}
          <span className="font-bold">
            {formatarMoeda(relatorioGeral.geral.totalEntregue)}
          </span>
        </p>
        <p>
          Saldo Geral:{' '}
          <span className="font-bold">
            {formatarMoeda(
              relatorioGeral.geral.totalInicial - relatorioGeral.geral.totalEntregue
            )}
          </span>
        </p>
      </div>
      <div>
        <canvas ref={chartGeralRef}></canvas>
      </div>
    </div>
  );
};

// -------------------- ADMIN --------------------
const AdminPanel: React.FC<{
  data: Municipio[];
  setData: React.Dispatch<React.SetStateAction<Municipio[]>>;
}> = ({ data, setData }) => {
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const restoreBackupRef = useRef<HTMLInputElement>(null);

  const handleAddMunicipio = async () => {
    const nome = prompt('Nome do novo município:');
    if (nome && nome.trim()) {
      try {
        const newMunicipio = await api.post('/api/municipios', {
          nome: nome.trim()
        });
        setData((prev) => [...prev, { ...newMunicipio, editais: [] }]);
      } catch (error) {
        alert(`Erro ao adicionar município: ${(error as Error).message}`);
      }
    }
  };

  const handleRemoveMunicipio = async (id: string, nome: string) => {
    if (
      window.confirm(
        `Tem certeza que deseja remover "${nome}" e todos os seus editais?`
      )
    ) {
      try {
        await api.delete(`/api/municipios/${id}`);
        setData((prev) => prev.filter((m) => m.id !== id));
      } catch (error) {
        alert(`Erro ao remover município: ${(error as Error).message}`);
      }
    }
  };

  const handleAddEdital = async (munId: string) => {
    const nome = prompt('Nome do novo edital:');
    if (nome && nome.trim()) {
      try {
        const newEdital = await api.post(`/api/municipios/${munId}/editais`, {
          nome: nome.trim()
        });
        setData((prev) =>
          prev.map((mun) => {
            if (mun.id === munId) {
              return { ...mun, editais: [...mun.editais, newEdital] };
            }
            return mun;
          })
        );
      } catch (error) {
        alert(`Erro ao adicionar edital: ${(error as Error).message}`);
      }
    }
  };

  const handleRemoveEdital = async (editalId: string, editalNome: string) => {
    if (window.confirm(`Tem certeza que deseja remover o edital "${editalNome}"?`)) {
      try {
        await api.delete(`/api/editais/${editalId}`);
        setData((prev) =>
          prev.map((mun) => ({
            ...mun,
            editais: mun.editais.filter((ed) => ed.id !== editalId)
          }))
        );
      } catch (error) {
        alert(`Erro ao remover edital: ${(error as Error).message}`);
      }
    }
  };

  const handleBackup = () => {
    if (data.length === 0) {
      alert('Não há dados de materiais para fazer backup.');
      return;
    }
    const dataStr = JSON.stringify(data, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup_materiais_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleRestore = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const text = e.target?.result as string;
        if (!text) throw new Error('Arquivo vazio ou ilegível.');

        const parsedJson = JSON.parse(text);
        let municipiosToRestore: Municipio[];

        // formato antigo
        if (
          parsedJson &&
          typeof parsedJson === 'object' &&
          !Array.isArray(parsedJson) &&
          'municipios' in parsedJson &&
          Array.isArray(parsedJson.municipios)
        ) {
          municipiosToRestore = parsedJson.municipios.map(
            (mun: any, munIndex: number): Municipio => ({
              id: `migrated-mun-${Date.now()}-${munIndex}`,
              nome: mun.nome,
              editais: (mun.editais || []).map(
                (ed: any, edIndex: number): Edital => ({
                  id: `migrated-ed-${Date.now()}-${edIndex}`,
                  nome: ed.nome,
                  itens: (ed.itens || []).map(
                    (item: any, itemIndex: number): EstoqueItem => ({
                      id: `migrated-item-${Date.now()}-${itemIndex}`,
                      descricao: item.descricao || '',
                      marca: item.marca || '',
                      unidade: item.unidade || '',
                      quantidade: parseFloat(item.quantidade) || 0,
                      valorUnitario: parseFloat(item.valorUnitario) || 0,
                      valorTotal:
                        parseFloat(item.valorTotal) ||
                        (parseFloat(item.quantidade) *
                          parseFloat(item.valorUnitario)) ||
                        0
                    })
                  ),
                  saidas: (ed.saidas || []).map(
                    (saida: any, saidaIndex: number): SaidaItem => ({
                      id: `migrated-saida-${Date.now()}-${saidaIndex}`,
                      itemIndex:
                        typeof saida.itemIndex === 'string'
                          ? parseInt(saida.itemIndex, 10)
                          : saida.itemIndex,
                      descricao: saida.descricao || '',
                      marca: saida.marca || '',
                      quantidade: parseFloat(saida.quantidade) || 0,
                      valorUnitario: parseFloat(saida.valorUnitario) || 0,
                      valorTotal: parseFloat(saida.valorTotal) || 0,
                      data: saida.data || '',
                      notaFiscal: saida.notaFiscal || ''
                    })
                  ),
                  empenhos: []
                })
              )
            })
          );
        }
        // formato novo (igual ao que o componente backup gera)
        else if (
          Array.isArray(parsedJson) &&
          (parsedJson.length === 0 ||
            ('nome' in parsedJson[0] && 'editais' in parsedJson[0]))
        ) {
          municipiosToRestore = parsedJson;
        } else {
          throw new Error('Formato de arquivo de backup inválido ou não reconhecido.');
        }

        if (window.confirm('Isso irá substituir TODOS os dados de materiais. Continuar?')) {
          await api.post('/api/materiais/restore', municipiosToRestore);
          setData(municipiosToRestore);
          alert('Backup restaurado com sucesso! Os dados foram atualizados.');
        }
      } catch (error) {
        alert(
          `Erro ao restaurar backup: ${
            error instanceof Error ? error.message : String(error)
          }`
        );
      } finally {
        if (event.target) event.target.value = '';
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="bg-gray-50 p-4 rounded-lg shadow-md mt-8">
      <div
        onClick={() => setIsAdminOpen(!isAdminOpen)}
        className="flex justify-between items-center cursor-pointer"
      >
        <h2 className="text-xl font-semibold text-gray-800">Cadastro Geral</h2>
        <svg
          className={`w-6 h-6 transform transition-transform ${
            isAdminOpen ? 'rotate-180' : ''
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
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
                    <button
                      onClick={() => handleAddEdital(mun.id)}
                      className="text-xs text-green-600 hover:text-green-800"
                    >
                      Adicionar Edital
                    </button>
                    <button
                      onClick={() => handleRemoveMunicipio(mun.id, mun.nome)}
                      className="text-xs text-red-600 hover:text-red-800"
                    >
                      Remover Município
                    </button>
                  </div>
                </div>
                <ul className="mt-2 space-y-1 text-sm">
                  {mun.editais.map((ed) => (
                    <li
                      key={ed.id}
                      className="flex justify-between items-center bg-gray-50 p-2 rounded"
                    >
                      <span>{ed.nome}</span>
                      <button
                        onClick={() => handleRemoveEdital(ed.id, ed.nome)}
                        className="text-xs text-red-500 hover:text-red-700"
                      >
                        Remover
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            <button
              onClick={handleAddMunicipio}
              className="w-full px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
            >
              Adicionar Município
            </button>
          </div>
          <div className="mt-6 border-t pt-4 flex gap-2">
            <button
              onClick={handleBackup}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700"
            >
              Backup Completo
            </button>
            <button
              onClick={() => restoreBackupRef.current?.click()}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg shadow hover:bg-gray-700"
            >
              Restaurar Backup
            </button>
            <input
              type="file"
              ref={restoreBackupRef}
              onChange={handleRestore}
              accept=".json"
              className="hidden"
            />
          </div>
        </div>
      )}
    </div>
  );
};

// -------------------- COMPONENTE PRINCIPAL --------------------
interface ControleMateriaisProps {
  data: Municipio[];
  setData: React.Dispatch<React.SetStateAction<Municipio[]>>;
  simulacoesSalvas: SimulacaoSalva[];
  setSimulacoesSalvas: React.Dispatch<React.SetStateAction<SimulacaoSalva[]>>;
}

const ControleMateriais: React.FC<ControleMateriaisProps> = ({
  data,
  setData,
  simulacoesSalvas,
  setSimulacoesSalvas
}) => {
  const [activeTab, setActiveTab] = useState('estoque');
  const [filtroMunicipioIdx, setFiltroMunicipioIdx] = useState<string>('0');
  const [filtroEditalIdx, setFiltroEditalIdx] = useState<string>('0');
  const [simulacaoItens, setSimulacaoItens] = useState<SimulacaoItem[]>([]);

  const onUpdate = useCallback(() => {
    api
      .get('/api/materiais')
      .then(setData)
      .catch((e) => alert('Falha ao recarregar dados: ' + e.message));
  }, [setData]);

  const municipioAtual = useMemo(() => {
    const idx = parseInt(filtroMunicipioIdx, 10);
    return !isNaN(idx) && data[idx] ? data[idx] : null;
  }, [data, filtroMunicipioIdx]);

  const editalAtual = useMemo(() => {
    const munIdx = parseInt(filtroMunicipioIdx, 10);
    const edIdx = parseInt(filtroEditalIdx, 10);
    return !isNaN(munIdx) &&
      !isNaN(edIdx) &&
      data[munIdx]?.editais[edIdx]
      ? data[munIdx].editais[edIdx]
      : null;
  }, [data, filtroMunicipioIdx, filtroEditalIdx]);

  const resumoFinanceiro = useMemo(() => {
    if (!editalAtual) return null;
    const totalInicial = (editalAtual.itens || []).reduce(
      (sum, item) => sum + item.valorTotal,
      0
    );
    const totalEntregue = (editalAtual.saidas || []).reduce(
      (sum, s) => sum + s.valorTotal,
      0
    );

    const restante = totalInicial - totalEntregue;
    const percEntregue = totalInicial > 0 ? Math.round((totalEntregue / totalInicial) * 100) : 0;

    return { totalInicial, totalEntregue, restante, percEntregue };
  }, [editalAtual]);

  useEffect(() => {
    // garante seleção inicial quando chegar data
    if (data.length > 0 && filtroMunicipioIdx === '') {
      if (data[0] && data[0].editais.length > 0) {
        setFiltroMunicipioIdx('0');
        setFiltroEditalIdx('0');
      }
    }
  }, [data, filtroMunicipioIdx]);

  const handleMunicipioChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFiltroMunicipioIdx(e.target.value);
    setFiltroEditalIdx('0');
  };

  const handleEditalChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFiltroEditalIdx(e.target.value);
  };

  const salvarSimulacao = async (municipio: string, editalNome: string) => {
    if (simulacaoItens.length === 0) {
      alert('Adicione itens à simulação para poder salvar.');
      return;
    }
    const novaSimulacaoPayload = {
      data: new Date().toISOString(),
      municipio,
      edital: editalNome,
      itens: simulacaoItens
    };
    try {
      const savedSimulacao = await api.post(
        '/api/simulacoes',
        novaSimulacaoPayload
      );
      setSimulacoesSalvas((prev) => [savedSimulacao, ...prev]);
      alert('Simulação salva com sucesso!');
    } catch (error) {
      alert(`Erro ao salvar simulação: ${(error as Error).message}`);
    }
  };

  const restaurarSimulacao = (simulacao: SimulacaoSalva) => {
    const munIdx = data.findIndex((m) => m.nome === simulacao.municipio);
    if (munIdx === -1) {
      alert('Município da simulação não encontrado.');
      return;
    }
    const edIdx = data[munIdx].editais.findIndex(
      (e) => e.nome === simulacao.edital
    );
    if (edIdx === -1) {
      alert('Edital da simulação não encontrado.');
      return;
    }

    setFiltroMunicipioIdx(munIdx.toString());
    setFiltroEditalIdx(edIdx.toString());
    setSimulacaoItens(simulacao.itens);
    setActiveTab('simulacao');
    alert(
      `Simulação de ${simulacao.municipio} restaurada. Navegando para a aba de simulação.`
    );
  };

  const TabButton: React.FC<{ tabId: string; label: string }> = ({
    tabId,
    label
  }) => (
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
      <h1 className="text-3xl font-bold text-gray-800">Controle de Materiais</h1>

      {/* FILTRO */}
      <div className="bg-white p-4 rounded-lg shadow-md space-y-4">
        <h2 className="text-xl font-semibold">Filtro de Visualização</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <select
            value={filtroMunicipioIdx}
            onChange={handleMunicipioChange}
            className="w-full border-gray-300 rounded-md"
          >
            <option value="">Selecione Município</option>
            {data.map((m, i) => (
              <option key={m.id} value={i}>
                {m.nome}
              </option>
            ))}
          </select>
          <select
            value={filtroEditalIdx}
            onChange={handleEditalChange}
            className="w-full border-gray-300 rounded-md"
            disabled={!municipioAtual}
          >
            <option value="">Selecione Edital</option>
            {municipioAtual?.editais.map((e, i) => (
              <option key={e.id} value={i}>
                {e.nome}
              </option>
            ))}
          </select>
        </div>
        {resumoFinanceiro && (
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4">
            <p className="font-bold">
              {municipioAtual?.nome} - {editalAtual?.nome}
            </p>
            <div className="text-sm mt-2 grid grid-cols-2 md:grid-cols-4 gap-2">
              <p>
                Total:{' '}
                <span className="font-semibold">
                  {formatarMoeda(resumoFinanceiro.totalInicial)}
                </span>
              </p>
              <p>
                Entregue:{' '}
                <span className="font-semibold">
                  {formatarMoeda(resumoFinanceiro.totalEntregue)}
                </span>
              </p>
              <p>
                Restante:{' '}
                <span className="font-semibold">
                  {formatarMoeda(resumoFinanceiro.restante)}
                </span>
              </p>
              <div>
                <div className="w-full bg-gray-200 rounded-full h-2.5 mt-1">
                  <div
                    className="bg-green-500 h-2.5 rounded-full"
                    style={{ width: `${resumoFinanceiro.percEntregue}%` }}
                  ></div>
                </div>
                <p className="text-xs text-right">
                  {resumoFinanceiro.percEntregue}%
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* TABS */}
      <div className="border-b border-gray-200 bg-white rounded-t-lg shadow-sm">
        <nav className="-mb-px flex space-x-2">
          <TabButton tabId="estoque" label="Estoque" />
          <TabButton tabId="saidas" label="Saídas" />
          <TabButton tabId="simulacao" label="Simulação" />
          <TabButton tabId="simulacoesSalvas" label="Simulações Salvas" />
          <TabButton tabId="importar" label="Importar Itens" />
          <TabButton tabId="relatorios" label="Relatórios" />
        </nav>
      </div>

      {/* CONTEÚDO DA ABA */}
      <div className="bg-white p-6 rounded-b-lg shadow-md min-h-[300px]">
        {!editalAtual && activeTab !== 'simulacoesSalvas' && activeTab !== 'importar' && activeTab !== 'relatorios' && (
          <div className="text-center py-10 text-gray-500">
            Selecione um município e edital para ver os dados.
          </div>
        )}

        {editalAtual && activeTab === 'estoque' && (
          <EstoqueView edital={editalAtual} onUpdate={onUpdate} />
        )}

        {editalAtual && activeTab === 'saidas' && (
          <SaidasView edital={editalAtual} onUpdate={onUpdate} />
        )}

        {editalAtual && municipioAtual && activeTab === 'simulacao' && (
          <SimulacaoView
            edital={editalAtual}
            municipioNome={municipioAtual.nome}
            simulacaoItens={simulacaoItens}
            setSimulacaoItens={setSimulacaoItens}
            onUpdate={onUpdate}
            salvarSimulacao={salvarSimulacao}
          />
        )}

        {activeTab === 'simulacoesSalvas' && (
          <SimulacoesSalvasView
            simulacoesSalvas={simulacoesSalvas}
            setSimulacoesSalvas={setSimulacoesSalvas}
            restaurarSimulacao={restaurarSimulacao}
          />
        )}

        {activeTab === 'importar' && <ImportarView data={data} onUpdate={onUpdate} />}

        {activeTab === 'relatorios' && <RelatoriosView data={data} />}
      </div>

      {/* ADMIN */}
      <AdminPanel data={data} setData={setData} />
    </div>
  );
};

export default ControleMateriais;
