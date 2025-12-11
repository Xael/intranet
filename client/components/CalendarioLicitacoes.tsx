import React, { useState, useRef, FormEvent, ChangeEvent, useEffect } from 'react';
import { DetalhesEvento } from '../types';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin, { DateClickArg } from '@fullcalendar/interaction';
import { EventClickArg, EventDropArg, EventApi } from '@fullcalendar/core';
import { api } from '../utils/api';
import { Download, Eye, Trash2 } from 'lucide-react';

// --- Função Auxiliar para Datas ---
const formatDateToYMD = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// --- Tipos Extendidos ---
export type DetalhesEventoComDoc = DetalhesEvento & {
  documentationStatus?: 'OK' | 'PENDENTE';
  estimatedValue?: string;
  distance?: string;
  avgEmployees?: string;
  warranty?: string;
  editalFile?: string; 
  editalFileName?: string; 
};

// --- Componente Modal ---
interface EventoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (details: DetalhesEventoComDoc) => void;
  onDelete?: () => void;
  isNew: boolean;
  eventData?: EventApi;
  dateStr?: string;
}

const EventoModal: React.FC<EventoModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  isNew,
  eventData,
  dateStr,
}) => {
  if (!isOpen) return null;

  const getInitialState = (): DetalhesEventoComDoc => {
    if (isNew) {
      return {
        city: '', bid_number: '', time: '', location: '', description: '',
        documentationStatus: 'PENDENTE', estimatedValue: '', distance: '', avgEmployees: '', warranty: '', editalFile: '', editalFileName: ''
      };
    } else if (eventData) {
      const props = eventData.extendedProps;
      return {
        city: props.city || '', bid_number: props.bid_number || '', time: props.time || '', location: props.location || '', description: props.description || '',
        documentationStatus: props.documentationStatus || 'PENDENTE', estimatedValue: props.estimatedValue || '', distance: props.distance || '', avgEmployees: props.avgEmployees || '', warranty: props.warranty || '', editalFile: props.editalFile || '', editalFileName: props.editalFileName || ''
      };
    }
    return {} as DetalhesEventoComDoc;
  };

  const [formData, setFormData] = useState<DetalhesEventoComDoc>(getInitialState());
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        alert('Por favor, selecione apenas arquivos PDF.');
        return;
      }
      
      // --- ALTERAÇÃO: LIMITE AGORA É 50MB ---
      // 50 MB = 50 * 1024 * 1024 bytes
      if (file.size > 50 * 1024 * 1024) {
        alert('O arquivo excede o limite máximo de 50MB.');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({
          ...prev,
          editalFile: reader.result as string,
          editalFileName: file.name
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const removeFile = () => {
    setFormData(prev => ({ ...prev, editalFile: '', editalFileName: '' }));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const downloadFile = () => {
    if (formData.editalFile) {
      const link = document.createElement('a');
      link.href = formData.editalFile;
      link.download = formData.editalFileName || 'edital.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // --- Visualizar PDF ---
  const viewFile = () => {
    if (!formData.editalFile) return;
    try {
        let base64Content = formData.editalFile;
        if (base64Content.includes(',')) base64Content = base64Content.split(',')[1];
        
        const byteCharacters = atob(base64Content);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
    } catch (error) {
        console.error("Erro ao visualizar PDF", error);
        alert("Não foi possível visualizar o PDF.");
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 overflow-y-auto backdrop-blur-sm">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-gray-100">
        <div className="flex justify-between items-center p-4 border-b bg-gray-50">
          <h3 className="text-xl font-bold text-gray-800">
            {isNew ? 'Nova Licitação' : 'Editar Licitação'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="bg-blue-50 p-2 rounded text-blue-800 font-semibold text-center border border-blue-100">
             Data: {isNew ? dateStr?.split('-').reverse().join('/') : eventData?.startStr.split('-').reverse().join('/')}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Identificação</label>
              <input type="text" name="bid_number" value={formData.bid_number} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-primary focus:border-primary" placeholder="Ex: Pref. Jandira - 001/2025" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Horário</label>
              <input type="time" name="time" value={formData.time} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" required />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Cidade</label>
              <input type="text" name="city" value={formData.city} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" placeholder="Nome da Cidade" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Documentação</label>
              <select name="documentationStatus" value={formData.documentationStatus} onChange={handleChange} className={`mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 font-medium ${formData.documentationStatus === 'OK' ? 'text-green-600 bg-green-50' : 'text-yellow-600 bg-yellow-50'}`}>
                <option value="PENDENTE">⚠️ Pendente</option>
                <option value="OK">✅ OK</option>
              </select>
            </div>
          </div>

          {/* Novos Campos */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div><label className="block text-sm font-medium text-gray-700">Valor Estimado</label><input type="text" name="estimatedValue" value={formData.estimatedValue} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md p-2" placeholder="R$ 0,00" /></div>
             <div><label className="block text-sm font-medium text-gray-700">Distância</label><input type="text" name="distance" value={formData.distance} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md p-2" placeholder="Ex: 50 km" /></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div><label className="block text-sm font-medium text-gray-700">Média Funcionários</label><input type="number" name="avgEmployees" value={formData.avgEmployees} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md p-2" placeholder="Ex: 5" /></div>
             <div><label className="block text-sm font-medium text-gray-700">Garantia</label><input type="text" name="warranty" value={formData.warranty} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md p-2" placeholder="Valor ou 'Sem Garantia'" /></div>
          </div>

          <div>
             <label className="block text-sm font-medium text-gray-700">Local (Site / Portal)</label>
             <input type="text" name="location" value={formData.location} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md p-2" placeholder="Ex: www.bll.org.br" />
          </div>
          <div>
             <label className="block text-sm font-medium text-gray-700">Descrição</label>
             <textarea name="description" value={formData.description} onChange={handleChange} rows={3} className="mt-1 block w-full border border-gray-300 rounded-md p-2" placeholder="Objeto da licitação..." />
          </div>

          {/* Upload Section */}
          <div className="border-t border-gray-100 pt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Edital (PDF)</label>
            {!formData.editalFile ? (
              <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
                  <div className="flex flex-col items-center justify-center pt-2 pb-3">
                    <p className="mb-1 text-sm text-gray-500"><span className="font-semibold text-primary">Clique para enviar</span> ou arraste</p>
                    <p className="text-xs text-gray-400">PDF (MAX. 50MB)</p>
                  </div>
                  <input ref={fileInputRef} type="file" accept="application/pdf" className="hidden" onChange={handleFileChange} />
              </label>
            ) : (
              <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center overflow-hidden">
                  <span className="text-sm text-gray-700 font-medium truncate mr-2">{formData.editalFileName}</span>
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={viewFile} className="text-indigo-600 hover:bg-indigo-50 p-1.5 rounded" title="Visualizar"><Eye size={18} /></button>
                  <button type="button" onClick={downloadFile} className="text-blue-600 hover:bg-blue-50 p-1.5 rounded" title="Baixar"><Download size={18} /></button>
                  <button type="button" onClick={removeFile} className="text-red-600 hover:bg-red-50 p-1.5 rounded" title="Remover"><Trash2 size={18} /></button>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-between pt-4 mt-6 border-t border-gray-100">
            {(!isNew && onDelete) ? (
               <button type="button" onClick={() => { if(confirm("Tem certeza?")) onDelete(); }} className="px-4 py-2 bg-red-50 text-red-600 border border-red-200 rounded hover:bg-red-100">Excluir</button>
            ) : <div/>}
            <div className="flex gap-3">
              <button type="button" onClick={onClose} className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50">Cancelar</button>
              <button type="submit" className="px-6 py-2 bg-primary text-white rounded hover:bg-blue-700 shadow-md">Salvar</button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

// --- Componente Principal ---
const CalendarioLicitacoes: React.FC = () => {
  const [events, setEvents] = useState<any[]>([]);
  const [lastUpdated, setLastUpdated] = useState(Date.now());
  const [modalState, setModalState] = useState<{ isOpen: boolean; isNew: boolean; dateStr?: string; event?: EventApi; }>({ isOpen: false, isNew: false });

  useEffect(() => { fetchEvents(); }, []);

  const fetchEvents = async () => {
    try {
      const data = await api.get('/api/events');
      const formattedEvents = data.map((evt: any) => ({
        id: evt.id,
        title: `${evt.time || ''} - ${evt.city}`, 
        start: evt.date || evt.start, 
        allDay: true,
        backgroundColor: 'transparent', 
        borderColor: 'transparent',
        extendedProps: { ...evt }
      }));
      setEvents(formattedEvents);
      setLastUpdated(Date.now());
    } catch (error) { console.error("Erro ao buscar eventos", error); }
  };

  const openModalForNew = (arg: DateClickArg) => setModalState({ isOpen: true, isNew: true, dateStr: arg.dateStr });
  const openModalForEdit = (arg: EventClickArg) => setModalState({ isOpen: true, isNew: false, event: arg.event });
  const closeModal = () => setModalState({ isOpen: false, isNew: false });

  const handleSaveEvent = async (details: DetalhesEventoComDoc) => {
    try {
      const payload = {
        city: details.city, bid_number: details.bid_number, time: details.time, location: details.location, description: details.description, documentationStatus: details.documentationStatus,
        estimatedValue: details.estimatedValue, distance: details.distance, avgEmployees: details.avgEmployees, warranty: details.warranty, editalFile: details.editalFile, editalFileName: details.editalFileName,
        date: modalState.isNew ? modalState.dateStr : modalState.event?.startStr,
        start: modalState.isNew ? modalState.dateStr : modalState.event?.startStr,
        title: `${details.time} - ${details.city}`,
      };
      if (modalState.isNew) await api.post('/api/events', payload);
      else if (modalState.event) await api.put(`/api/events/${modalState.event.id}`, payload);
      closeModal();
      await fetchEvents();
    } catch (error) { alert('Erro ao salvar. Verifique se o arquivo não é muito grande para o servidor.'); }
  };

  const handleDeleteEvent = async () => {
    if (modalState.event) {
      try { await api.delete(`/api/events/${modalState.event.id}`); closeModal(); await fetchEvents(); } catch { alert('Erro ao excluir.'); }
    }
  };

  const handleEventDrop = async (arg: EventDropArg) => {
     try {
        const payload = { ...arg.event.extendedProps, date: arg.event.startStr, start: arg.event.startStr };
        await api.put(`/api/events/${arg.event.id}`, payload);
        await fetchEvents();
     } catch { arg.revert(); alert("Erro ao mover."); }
  };

  return (
    <div className="h-full flex flex-col p-4 bg-gray-50">
      <style>{`
        .fc-toolbar-chunk button {
            background-color: #1E40AF !important;
            border-color: #1E40AF !important;
            color: white !important;
            text-transform: capitalize;
            font-weight: 500;
            padding: 0.5rem 1rem !important;
            border-radius: 0.5rem !important;
            opacity: 1;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            margin: 0 2px;
        }
        .fc-toolbar-chunk button:hover {
            background-color: #1D4ED8 !important;
        }
        .fc-toolbar-title {
            color: #1E40AF !important;
            font-weight: 700 !important;
            font-size: 1.5rem !important;
        }
        .fc-col-header-cell {
            background-color: #F3F4F6;
            color: #4B5563;
            padding: 10px 0 !important;
            text-transform: uppercase;
            font-size: 0.75rem;
        }
        .fc-daygrid-day-number {
            color: #374151;
            font-weight: 600;
            text-decoration: none !important;
            margin: 4px;
        }
        .fc-event {
            border: none !important;
            background: transparent !important;
            box-shadow: none !important;
        }
        @keyframes subtle-pulse {
            0% { box-shadow: inset 0 0 0 2px rgba(37, 99, 235, 0.4); }
            50% { box-shadow: inset 0 0 0 4px rgba(37, 99, 235, 0.1); }
            100% { box-shadow: inset 0 0 0 2px rgba(37, 99, 235, 0.4); }
        }
        .evento-hoje-ativo {
            animation: subtle-pulse 3s infinite;
        }
      `}</style>

      <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 h-full">
        <FullCalendar
          key={`${events.length}-${lastUpdated}`} 
          plugins={[dayGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          locale="pt-br"
          buttonText={{
            today: 'Hoje',
            month: 'Mês',
          }}
          headerToolbar={{
            left: 'prev,next today', 
            center: 'title',
            right: 'dayGridMonth', 
          }}
          hiddenDays={[0, 6]}
          events={events}
          selectable={true}
          editable={true}
          dateClick={openModalForNew}
          eventClick={openModalForEdit}
          eventDrop={handleEventDrop}
          eventContent={(arg) => {
              const props = arg.event.extendedProps;
              const isPending = props.documentationStatus === 'PENDENTE';
              
              return (
                  <div className="p-1.5 overflow-hidden cursor-pointer hover:scale-[1.02] transition-transform rounded shadow-sm w-full h-full flex flex-col justify-center bg-white border-l-4"
                       style={{ borderLeftColor: isPending ? '#FBBF24' : '#22C55E' }}>
                      <div className="flex justify-between items-center mb-0.5">
                          <span className="font-bold text-xs text-gray-800">{arg.timeText}</span>
                          {isPending && <span className="text-[9px] bg-yellow-100 text-yellow-800 px-1 rounded font-bold">DOC</span>}
                      </div>
                      <div className="font-bold text-xs text-blue-700 truncate">{props.bid_number}</div>
                      <div className="text-[10px] text-gray-500 truncate">{props.city}</div>
                  </div>
              )
          }}
          dayCellDidMount={(arg) => {
            const cellDate = formatDateToYMD(arg.date);
            const todayStr = formatDateToYMD(new Date());
            const isToday = cellDate === todayStr;

            const eventOnThisDay = events.find((e) => {
                const eDate = typeof e.start === 'string' ? e.start : (e.start instanceof Date ? formatDateToYMD(e.start) : '');
                return eDate === cellDate;
            });

            if (eventOnThisDay) {
                const isPending = eventOnThisDay.extendedProps.documentationStatus === 'PENDENTE';
                arg.el.style.backgroundColor = isPending ? '#FFFBEB' : '#F0FDF4'; 
                arg.el.style.border = isPending ? '1px solid #FCD34D' : '1px solid #86EFAC';
                if (isToday) {
                    arg.el.classList.add('evento-hoje-ativo');
                    arg.el.style.backgroundColor = '#DBEAFE'; 
                }
            } else if (isToday) {
                arg.el.style.backgroundColor = '#EFF6FF';
            }
          }}
          height="auto"
        />
      </div>
      
      <EventoModal
        isOpen={modalState.isOpen}
        onClose={closeModal}
        onSave={handleSaveEvent}
        onDelete={!modalState.isNew ? handleDeleteEvent : undefined}
        isNew={modalState.isNew}
        dateStr={modalState.dateStr}
        eventData={modalState.event}
      />
    </div>
  );
};

export default CalendarioLicitacoes;
