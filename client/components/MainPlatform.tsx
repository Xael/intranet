import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import Dashboard from './Dashboard';
import CalendarioLicitacoes from './CalendarioLicitacoes';
import StatusLicitacoes from './StatusLicitacoes';
import ControleMateriais from './ControleMateriais';
import ControleEPI from './ControleEPI';
import ControleEmpenhos from './ControleEmpenhos';
import { LicitacaoDetalhada, EventoCalendarioDetalhado, Municipio, EPIEntrega, SimulacaoSalva } from '../types';
import { api } from '../utils/api';


export type ViewType = 'dashboard' | 'calendario' | 'status' | 'materiais' | 'empenhos' | 'epi';

const MainPlatform: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  const [isLoading, setIsLoading] = useState(true);

  const [licitacoes, setLicitacoes] = useState<LicitacaoDetalhada[]>([]);
  const [eventos, setEventos] = useState<EventoCalendarioDetalhado[]>([]);
  const [materiaisData, setMateriaisData] = useState<Municipio[]>([]);
  const [epiData, setEpiData] = useState<EPIEntrega[]>([]);
  const [simulacoesSalvas, setSimulacoesSalvas] = useState<SimulacaoSalva[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [
          licitacoesRes,
          eventosRes,
          materiaisRes,
          epiRes,
          simulacoesRes
        ] = await Promise.all([
          api.get('/api/licitacoes'),
          api.get('/api/events'),
          api.get('/api/materiais'),
          api.get('/api/epi'),
          api.get('/api/simulacoes')
        ]);

        if (licitacoesRes) setLicitacoes(licitacoesRes);
        if (eventosRes) setEventos(eventosRes);
        if (materiaisRes) setMateriaisData(materiaisRes);
        if (epiRes) setEpiData(epiRes);
        if (simulacoesRes) setSimulacoesSalvas(simulacoesRes);

      } catch (error) {
        console.error("Falha ao carregar dados da plataforma:", error);
        // Aqui você pode adicionar um estado de erro para exibir na UI
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);


  const renderView = () => {
    if (isLoading) {
       return (
        <div className="flex items-center justify-center h-full">
            <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-primary"></div>
        </div>
      );
    }

    switch (currentView) {
      case 'dashboard':
        return <Dashboard bids={licitacoes} events={eventos} materiaisData={materiaisData} epiData={epiData} />;
      case 'calendario':
        // NOTE: You will need to update this component to use API calls instead of direct state setters for CUD operations.
        return <CalendarioLicitacoes events={eventos} setEvents={setEventos} />;
      case 'status':
         // NOTE: You will need to update this component to use API calls instead of direct state setters for CUD operations.
        return <StatusLicitacoes bids={licitacoes} setBids={setLicitacoes} />;
      case 'materiais':
         // NOTE: You will need to update this component to use API calls instead of direct state setters for CUD operations.
        return <ControleMateriais data={materiaisData} setData={setMateriaisData} simulacoesSalvas={simulacoesSalvas} setSimulacoesSalvas={setSimulacoesSalvas} />;
      case 'empenhos':
         // NOTE: You will need to update this component to use API calls instead of direct state setters for CUD operations.
        return <ControleEmpenhos data={materiaisData} setData={setMateriaisData} />;
      case 'epi':
         // NOTE: You will need to update this component to use API calls instead of direct state setters for CUD operations.
        return <ControleEPI entregas={epiData} setEntregas={setEpiData} />;
      default:
        return <Dashboard bids={licitacoes} events={eventos} materiaisData={materiaisData} epiData={epiData} />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar currentView={currentView} setCurrentView={setCurrentView} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-4 md:p-8">
          {renderView()}
        </main>
      </div>
    </div>
  );
};

export default MainPlatform;
