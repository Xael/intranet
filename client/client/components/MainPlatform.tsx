import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import Dashboard from './Dashboard';
import CalendarioLicitacoes from './CalendarioLicitacoes';
import StatusLicitacoes from './StatusLicitacoes';
import ControleMateriais from './ControleMateriais';
import ControleEPI from './ControleEPI';
import ControleEmpenhos from './ControleEmpenhos';
import Cotacoes from './Cotacoes';
import Configuracoes from './Configuracoes';
import Calculadora from './Calculadora';
import { LicitacaoDetalhada, EventoCalendarioDetalhado, Municipio, EPIEntrega, SimulacaoSalva, Cotacao, SimulacaoCotacaoSalva, CalculadoraSalva, EPIEstoqueItem } from '../types';
import { api } from '../utils/api';


export type ViewType = 'dashboard' | 'calendario' | 'status' | 'materiais' | 'empenhos' | 'epi' | 'cotacoes' | 'configuracoes' | 'calculadora';

const MainPlatform: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  const [isLoading, setIsLoading] = useState(true);
  const [licitacoes, setLicitacoes] = useState<LicitacaoDetalhada[]>([]);
  const [eventos, setEventos] = useState<EventoCalendarioDetalhado[]>([]);
  const [materiaisData, setMateriaisData] = useState<Municipio[]>([]);
  const [epiData, setEpiData] = useState<EPIEntrega[]>([]);
  const [epiEstoqueData, setEpiEstoqueData] = useState<EPIEstoqueItem[]>([]);
  const [simulacoesSalvas, setSimulacoesSalvas] = useState<SimulacaoSalva[]>([]);
  const [cotacoesData, setCotacoesData] = useState<Cotacao[]>([]);
  const [simulacoesCotacoesSalvas, setSimulacoesCotacoesSalvas] = useState<SimulacaoCotacaoSalva[]>([]);
  const [calculosSalvos, setCalculosSalvos] = useState<CalculadoraSalva[]>([]);


  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [
          licitacoesRes,
          eventosRes,
          materiaisRes,
          epiRes,
          epiEstoqueRes,
          simulacoesRes,
          cotacoesRes,
          simulacoesCotacoesRes,
          calculosRes,
        ] = await Promise.all([
          api.get('/api/licitacoes'),
          api.get('/api/events'),
          api.get('/api/materiais'),
          api.get('/api/epi'),
          api.get('/api/epi-estoque'),
          api.get('/api/simulacoes'),
          api.get('/api/cotacoes'),
          api.get('/api/simulacoes-cotacoes'),
          api.get('/api/calculadora'),
        ]);

        if (licitacoesRes) setLicitacoes(licitacoesRes);
        if (eventosRes) setEventos(eventosRes);
        if (materiaisRes) setMateriaisData(materiaisRes);
        if (epiRes) setEpiData(epiRes);
        if (epiEstoqueRes) setEpiEstoqueData(epiEstoqueRes);
        if (simulacoesRes) setSimulacoesSalvas(simulacoesRes);
        if (cotacoesRes) setCotacoesData(cotacoesRes);
        if (simulacoesCotacoesRes) setSimulacoesCotacoesSalvas(simulacoesCotacoesRes);
        if (calculosRes) setCalculosSalvos(calculosRes);

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
        return <CalendarioLicitacoes events={eventos} setEvents={setEventos} />;
      case 'status':
        return <StatusLicitacoes bids={licitacoes} setBids={setLicitacoes} />;
      case 'materiais':
        return <ControleMateriais data={materiaisData} setData={setMateriaisData} simulacoesSalvas={simulacoesSalvas} setSimulacoesSalvas={setSimulacoesSalvas} />;
      case 'empenhos':
        // FIX: Pass the correct state setter function 'setMateriaisData' to the 'setData' prop.
        return <ControleEmpenhos data={materiaisData} setData={setMateriaisData} />;
      case 'epi':
        return <ControleEPI entregas={epiData} setEntregas={setEpiData} estoque={epiEstoqueData} setEstoque={setEpiEstoqueData} />;
      case 'cotacoes':
        return <Cotacoes 
          cotacoes={cotacoesData}
          setCotacoes={setCotacoesData}
          simulacoesSalvas={simulacoesCotacoesSalvas}
          setSimulacoesSalvas={setSimulacoesCotacoesSalvas}
        />;
       case 'calculadora':
        return <Calculadora calculosSalvos={calculosSalvos} setCalculosSalvos={setCalculosSalvos} />;
      case 'configuracoes':
        return <Configuracoes />;
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
