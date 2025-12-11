import React from 'react';
import { LicitacaoDetalhada, EventoCalendarioDetalhado, StatusLicitacaoDetalhada, Municipio, EPIEntrega } from '../types';
import { CalendarIcon } from './icons/CalendarIcon';
import { ClipboardListIcon } from './icons/ClipboardListIcon';
import { ArchiveIcon } from './icons/ArchiveIcon';
import { ShieldIcon } from './icons/ShieldIcon';
import { ExclamationCircleIcon } from './icons/ExclamationCircleIcon';

const StatCard: React.FC<{ title: string; value: string | number; icon: React.FC<{className: string}>, highlight?: boolean }> = ({ title, value, icon: Icon, highlight }) => (
    <div className={`p-6 rounded-lg shadow-md flex items-center ${highlight ? 'bg-blue-50 border border-blue-200' : 'bg-white'}`}>
        <div className={`p-3 rounded-full mr-4 ${highlight ? 'bg-blue-200' : 'bg-primary/10'}`}>
            <Icon className={`w-6 h-6 ${highlight ? 'text-blue-800' : 'text-primary'}`} />
        </div>
        <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-gray-500 truncate">{title}</p>
            <p className={`text-2xl font-bold ${highlight ? 'text-blue-800' : 'text-gray-800'}`}>{value}</p>
        </div>
    </div>
);

const Dashboard: React.FC<{ bids: LicitacaoDetalhada[], events: EventoCalendarioDetalhado[], materiaisData: Municipio[], epiData: EPIEntrega[] }> = ({ bids, events, materiaisData, epiData }) => {
  
  const getTodayStr = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  const todayStr = getTodayStr();

  const licitacoesHoje = events.filter(e => e.start === todayStr).length;
  const statusEmAndamento = bids.filter(b => b.status === StatusLicitacaoDetalhada.EM_ANDAMENTO).length;
  const proximosEventos = events.filter(e => e.start > todayStr).length;

  const { itensEmEstoque, totalSaidas, empenhosPendentes } = React.useMemo(() => {
    let itemCount = 0;
    let outputCount = 0;
    let pendingCount = 0;

    materiaisData.forEach(municipio => {
      municipio.editais.forEach(edital => {
        itemCount += edital.itens?.length || 0;
        outputCount += edital.saidas?.length || 0;

        if (edital.empenhos) {
          edital.empenhos.forEach(empenho => {
            if (!empenho.notaFiscalPDF) {
              pendingCount++;
            }
          });
        }
      });
    });

    outputCount += epiData.length;
    return { itensEmEstoque: itemCount, totalSaidas: outputCount, empenhosPendentes: pendingCount };
  }, [materiaisData, epiData]);


  const proximosEventosList = events
    .filter(e => e.start >= todayStr)
    .sort((a, b) => a.start.localeCompare(b.start))
    .slice(0, 3);

  const licitacoesRecentes = bids
    .sort((a,b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime())
    .slice(0,3);

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      <h2 className="text-3xl font-bold text-gray-800">Painel de Controle</h2>
        
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Licitações Hoje" value={licitacoesHoje} icon={CalendarIcon} highlight={true} />
        <StatCard title="Em Andamento" value={statusEmAndamento} icon={ClipboardListIcon} />
        <StatCard title="Itens em Estoque" value={itensEmEstoque} icon={ArchiveIcon} />
        <StatCard title="Total de Saídas" value={totalSaidas} icon={ShieldIcon} />
        <StatCard title="Empenhos Pendentes" value={empenhosPendentes} icon={ExclamationCircleIcon} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* BLOCO AGENDA PRÓXIMA (CORRIGIDO) */}
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100 flex flex-col h-full">
            <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                <CalendarIcon className="w-5 h-5 mr-2 text-primary"/>
                Agenda Próxima
            </h3>
            <div className="space-y-4 flex-1">
                {proximosEventosList.length > 0 ? proximosEventosList.map(evento => {
                    const isToday = evento.start === todayStr;
                    return (
                        <div key={evento.id} className={`p-4 rounded-lg transition-all flex flex-col justify-center ${isToday ? 'bg-blue-50 border border-blue-200 shadow-sm' : 'bg-gray-50 border border-gray-100'}`}>
                            <div className="flex justify-between items-start w-full min-w-0">
                                <div className="flex-1 min-w-0 pr-2"> {/* min-w-0 evita estouro */}
                                    <p 
                                        className={`font-bold truncate ${isToday ? 'text-blue-700' : 'text-gray-800'}`}
                                        title={evento.title} // Tooltip nativo
                                    >
                                        {evento.title}
                                    </p>
                                    
                                    <div className="flex items-center text-sm text-gray-600 mt-1 flex-wrap gap-2">
                                        <span className="font-medium whitespace-nowrap">
                                            {new Date(evento.start + 'T00:00:00').toLocaleDateString('pt-BR')}
                                        </span>
                                        {evento.time && <span className="px-2 py-0.5 bg-gray-200 rounded text-xs whitespace-nowrap">{evento.time}</span>}
                                        {isToday && <span className="px-2 py-0.5 bg-blue-600 text-white rounded text-xs font-bold animate-pulse whitespace-nowrap">HOJE</span>}
                                    </div>
                                    
                                    <p 
                                        className="text-sm text-gray-500 mt-1 truncate"
                                        title={evento.description || evento.city}
                                    >
                                        {evento.description || evento.city}
                                    </p>
                                </div>
                            </div>
                        </div>
                    );
                }) : <div className="flex items-center justify-center h-full text-gray-500 italic">Nenhum evento próximo agendado.</div>}
            </div>
        </div>

        {/* BLOCO ÚLTIMAS ATUALIZAÇÕES (CORRIGIDO) */}
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100 flex flex-col h-full">
            <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                <ClipboardListIcon className="w-5 h-5 mr-2 text-accent"/>
                Últimas Atualizações
            </h3>
            <div className="space-y-3 flex-1">
                {licitacoesRecentes.length > 0 ? licitacoesRecentes.map(licitacao => (
                    <div key={licitacao.id} className="p-4 border-l-4 border-accent bg-orange-50 rounded-r-lg">
                        <div className="flex justify-between items-start min-w-0">
                            <div className="flex-1 min-w-0 pr-2">
                                <p className="font-bold text-gray-800 truncate" title={licitacao.bidNumber}>
                                    {licitacao.bidNumber}
                                </p>
                                <p className="text-sm text-gray-600 truncate mt-1" title={licitacao.city}>
                                    {licitacao.city}
                                </p>
                            </div>
                            <span className="text-[10px] sm:text-xs text-orange-800 bg-orange-100 px-2 py-1 rounded-full whitespace-nowrap flex-shrink-0">
                                {licitacao.status}
                            </span>
                        </div>
                    </div>
                )) : <div className="flex items-center justify-center h-full text-gray-500 italic">Nenhuma licitação cadastrada.</div>}
            </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
