import React from 'react';
import { LicitacaoDetalhada, EventoCalendarioDetalhado, StatusLicitacaoDetalhada, Municipio, EPIEntrega } from '../types';
import { CalendarIcon } from './icons/CalendarIcon';
import { ClipboardListIcon } from './icons/ClipboardListIcon';
import { ArchiveIcon } from './icons/ArchiveIcon';
import { ShieldIcon } from './icons/ShieldIcon';
// NOVO: Ícone para empenhos pendentes
import { ExclamationCircleIcon } from './icons/ExclamationCircleIcon';

const StatCard: React.FC<{ title: string; value: string | number; icon: React.FC<{className: string}> }> = ({ title, value, icon: Icon }) => (
    <div className="bg-white p-6 rounded-lg shadow-md flex items-center">
        <div className="p-3 bg-primary/10 rounded-full mr-4">
            <Icon className="w-6 h-6 text-primary" />
        </div>
        <div>
            <p className="text-sm font-medium text-gray-500">{title}</p>
            <p className="text-2xl font-bold text-gray-800">{value}</p>
        </div>
    </div>
);


const Dashboard: React.FC<{ bids: LicitacaoDetalhada[], events: EventoCalendarioDetalhado[], materiaisData: Municipio[], epiData: EPIEntrega[] }> = ({ bids, events, materiaisData, epiData }) => {
  const licitacoesAtivas = bids.filter(b => b.status === StatusLicitacaoDetalhada.EM_ANDAMENTO).length;
  
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const proximosEventos = events.filter(e => new Date(e.start) >= hoje).length;

  // ATUALIZADO: Adicionado 'empenhosPendentes' ao useMemo
  const { itensEmEstoque, totalSaidas, empenhosPendentes } = React.useMemo(() => {
    let itemCount = 0;
    let outputCount = 0;
    let pendingCount = 0; // Novo contador

    materiaisData.forEach(municipio => {
      municipio.editais.forEach(edital => {
        // Lógica existente (mantida com optional chaining por segurança)
        itemCount += edital.itens?.length || 0;
        outputCount += edital.saidas?.length || 0;

        // NOVO: Lógica para contar empenhos pendentes
        if (edital.empenhos) {
          edital.empenhos.forEach(empenho => {
            // Conta se a notaFiscalPDF NÃO existir
            if (!empenho.notaFiscalPDF) {
              pendingCount++;
            }
          });
        }
      });
    });

    outputCount += epiData.length;
    // Retorna o novo valor
    return { itensEmEstoque: itemCount, totalSaidas: outputCount, empenhosPendentes: pendingCount };
  }, [materiaisData, epiData]);


  const proximosEventosList = events
    .filter(e => new Date(e.start) >= hoje)
    .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
    .slice(0, 3);

  const licitacoesRecentes = bids
    .sort((a,b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime())
    .slice(0,3);

  return (
    <div className="space-y-8">
      <h2 className="text-3xl font-bold text-gray-800">Painel de Controle</h2>
        
      {/* ATUALIZADO: Adicionado o novo StatCard */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Licitações Ativas" value={licitacoesAtivas} icon={ClipboardListIcon} />
        <StatCard title="Próximos Eventos" value={proximosEventos} icon={CalendarIcon} />
        <StatCard title="Itens em Estoque" value={itensEmEstoque} icon={ArchiveIcon} />
        <StatCard title="Total de Saídas" value={totalSaidas} icon={ShieldIcon} />
        {/* NOVO CARD ADICIONADO: Ele ficará ao lado do "Total de Saídas" em telas grandes ou quebra para a linha de baixo */}
        <StatCard title="Empenhos Pendentes" value={empenhosPendentes} icon={ExclamationCircleIcon} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Próximos Eventos no Calendário</h3>
            <div className="space-y-4">
                {proximosEventosList.length > 0 ? proximosEventosList.map(evento => (
                    <div key={evento.id} className="p-4 bg-light rounded-md">
                        <p className="font-bold text-primary">{evento.title}</p>
                        <p className="text-sm text-gray-600">{new Date(evento.start).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</p>
                        <p className="text-sm text-gray-500 mt-1 truncate">{evento.description || evento.city}</p>
                    </div>
                )) : <p className="text-gray-500">Nenhum evento próximo.</p>}
            </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Últimas Licitações Atualizadas</h3>
            <div className="space-y-3">
                {licitacoesRecentes.map(licitacao => (
                    <div key={licitacao.id} className="p-4 border-l-4 border-accent bg-accent/10 rounded">
                        <p className="font-bold text-gray-700">{licitacao.bidNumber}</p>
                        <p className="text-sm text-gray-600 truncate">{licitacao.city}</p>
                        <p className="text-xs text-gray-500 mt-1">Status: {licitacao.status}</p>
                    </div>
                ))}
            </div>
        </div>
      </div>

    </div>
  );
};

export default Dashboard;
