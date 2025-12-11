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
import NFeModule from './NFeModule';
import { LicitacaoDetalhada, EventoCalendarioDetalhado, Municipio, EPIEntrega, SimulacaoSalva, Cotacao, SimulacaoCotacaoSalva, CalculadoraSalva, EPIEstoqueItem } from '../types';
import { api } from '../utils/api';

export type ViewType = 'dashboard' | 'calendario' | 'status' | 'materiais' | 'empenhos' | 'epi' | 'cotacoes' | 'configuracoes' | 'calculadora' | 'nfe';

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
  
  // Configuração Global (NFe habilitado?)
  const [nfeEnabled, setNfeEnabled] = useState(true);

  const fetchData = async () => {
    setIsLoading(true);
    try {
        const [
            bids, 
            events, 
            mats, 
            epi, 
            epiEstoque, 
            sims, 
            cots, 
            simCots,
            calcs,
            settings
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
            api.get('/api/settings').catch(() => ({ nfeEnabled: true })) 
        ]);

        setLicitacoes(bids);
        setEventos(events);
        setMateriaisData(mats);
        setEpiData(epi);
        setEpiEstoqueData(epiEstoque);
        setSimulacoesSalvas(sims);
        setCotacoesData(cots);
        setSimulacoesCotacoesSalvas(simCots);
        setCalculosSalvos(calcs);
        if (settings) setNfeEnabled(settings.nfeEnabled);

    } catch (error) {
        console.error("Erro ao carregar dados iniciais:", error);
    } finally {
        setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const renderContent = () => {
    if (isLoading) {
        return (
            <div className="flex h-full items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    switch (currentView) {
      case 'calendario':
        // CORREÇÃO: Removemos props 'events' e 'setEvents' pois o componente agora é independente
        return <CalendarioLicitacoes />;
      case 'status':
        return <StatusLicitacoes bids={licitacoes} setBids={setLicitacoes} />;
      case 'materiais':
        return <ControleMateriais 
            data={materiaisData} 
            setData={setMateriaisData} 
            simulacoesSalvas={simulacoesSalvas}
            setSimulacoesSalvas={setSimulacoesSalvas}
        />;
      case 'empenhos':
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
        return <Configuracoes nfeEnabled={nfeEnabled} setNfeEnabled={setNfeEnabled} />;
      case 'nfe':
        if (!nfeEnabled) return <div>Módulo desativado pelo administrador.</div>;
        return <NFeModule externalData={materiaisData} />;
      default:
        return <Dashboard bids={licitacoes} events={eventos} materiaisData={materiaisData} epiData={epiData} />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar currentView={currentView} setCurrentView={setCurrentView} nfeEnabled={nfeEnabled} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-4">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default MainPlatform;
