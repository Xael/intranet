import React, { useState, useRef, FormEvent, ChangeEvent } from 'react';
import { DetalhesEvento } from '../types';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin, { DateClickArg } from '@fullcalendar/interaction';
import { EventClickArg, EventDropArg, EventApi } from '@fullcalendar/core';
import { api } from '../utils/api';

// --- Modal Component ---
interface EventoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (details: DetalhesEventoComDoc) => void;
  onDelete?: () => void;
  isNew: boolean;
  eventData?: EventApi;
  dateStr?: string;
}

/**
 * Estendemos o tipo para incluir os novos campos solicitados
 */
export type DetalhesEventoComDoc = DetalhesEvento & {
  documentationStatus?: 'OK' | 'PENDENTE';
  estimatedValue?: string;
  distance?: string;
  avgEmployees?: string;
  warranty?: string;
  editalFile?: string; // Armazenará o Base64 do PDF
  editalFileName?: string; // Nome do arquivo para exibição
};

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

  // Helper para inicializar os estados
  const getInitialState = (): DetalhesEventoComDoc => {
    if (isNew) {
      return {
        city: '',
        bid_number: '',
        time: '',
        location: '',
        description: '',
        documentationStatus: 'PENDENTE',
        estimatedValue: '',
        distance: '',
        avgEmployees: '',
        warranty: '',
        editalFile: '',
        editalFileName: ''
      };
    } else if (eventData) {
      // Busca dados estendidos (extendedProps) do evento existente
      const props = eventData.extendedProps;
      return {
        city: props.city || '',
        bid_number: props.bid_number || '',
        time: props.time || '',
        location: props.location || '',
        description: props.description || '',
        documentationStatus: props.documentationStatus || 'PENDENTE',
        estimatedValue: props.estimatedValue || '',
        distance: props.distance || '',
        avgEmployees: props.avgEmployees || '',
        warranty: props.warranty || '',
        editalFile: props.editalFile || '',
        editalFileName: props.editalFileName || ''
      };
    }
    return {} as DetalhesEventoComDoc;
  };

  const [formData, setFormData] = useState<DetalhesEventoComDoc>(getInitialState());
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Lógica para converter PDF em Base64
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        alert('Por favor, selecione apenas arquivos PDF.');
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({
          ...prev,
          editalFile: reader.result as string, // Base64 completo
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

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="text-xl font-semibold text-gray-800">
            {isNew ? 'Nova Licitação' : 'Editar Licitação'}
          </h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {/* Data (Exibição apenas, pois vem do calendário) */}
          <div className="bg-blue-50 p-2 rounded text-blue-800 font-medium text-center">
             Data: {isNew ? dateStr?.split('-').reverse().join('/') : eventData?.startStr.split('-').reverse().join('/')}
          </div>

          {/* Identificação e Horário */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Identificação (Entidade + nº)</label>
              <input
                type="text"
                name="bid_number"
                value={formData.bid_number}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-primary focus:border-primary"
                placeholder="Ex: Pref. Jandira - 001/2025"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Horário</label>
              <input
                type="time"
                name="time"
                value={formData.time}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                required
              />
            </div>
          </div>

          {/* Cidade e Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Cidade</label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                placeholder="Nome da Cidade"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Documentação</label>
              <select
                name="documentationStatus"
                value={formData.documentationStatus}
                onChange={handleChange}
                className={`mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 font-medium ${
                  formData.documentationStatus === 'OK' ? 'text-green-600 bg-green-50' : 'text-yellow-600 bg-yellow-50'
                }`}
              >
                <option value="PENDENTE">⚠️ Documentação Pendente</option>
                <option value="OK">✅ Documentação OK</option>
              </select>
            </div>
          </div>

          {/* NOVOS CAMPOS - Linha 1 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Valor Estimado</label>
              <input
                type="text"
                name="estimatedValue"
                value={formData.estimatedValue}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                placeholder="R$ 0,00"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Distância Jandira/Itapuí</label>
              <input
                type="text"
                name="distance"
                value={formData.distance}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                placeholder="Ex: 50 km"
              />
            </div>
          </div>

          {/* NOVOS CAMPOS - Linha 2 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Média de Funcionários</label>
              <input
                type="number"
                name="avgEmployees"
                value={formData.avgEmployees}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                placeholder="Ex: 5"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Garantia</label>
              <input
                type="text"
                name="warranty"
                value={formData.warranty}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                placeholder="Valor ou 'Sem Garantia'"
              />
            </div>
          </div>

          {/* Local (Site) */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Local (Site / Portal)</label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
              placeholder="Ex: www.bll.org.br"
            />
          </div>

          {/* Descrição */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Descrição / Objeto</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
              placeholder="Detalhes do objeto da licitação..."
            />
          </div>

          {/* Campo de Anexo (Edital) */}
          <div className="border-t pt-4 mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Edital (PDF)</label>
            
            {!formData.editalFile ? (
              <div className="flex items-center justify-center w-full">
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <svg className="w-8 h-8 mb-4 text-gray-500" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
                      <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/>
                    </svg>
                    <p className="mb-2 text-sm text-gray-500"><span className="font-semibold">Clique para enviar</span> ou arraste</p>
                    <p className="text-xs text-gray-500">PDF (MAX. 5MB)</p>
                  </div>
                  <input ref={fileInputRef} type="file" accept="application/pdf" className="hidden" onChange={handleFileChange} />
                </label>
              </div>
            ) : (
              <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center">
                  <svg className="w-6 h-6 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                  <span className="text-sm text-gray-700 font-medium truncate max-w-[200px]">{formData.editalFileName}</span>
                </div>
                <div className="flex space-x-2">
                  <button type="button" onClick={downloadFile} className="text-sm text-blue-600 hover:text-blue-800 font-medium px-2 py-1 rounded hover:bg-blue-100">
                    Baixar
                  </button>
                  <button type="button" onClick={removeFile} className="text-sm text-red-600 hover:text-red-800 font-medium px-2 py-1 rounded hover:bg-red-100">
                    Remover
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-between pt-4 mt-6 border-t border-gray-100">
            {!isNew && onDelete ? (
               <button
                type="button"
                onClick={() => {
                   if(confirm("Tem certeza que deseja excluir esta licitação?")) onDelete();
                }}
                className="px-4 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
              >
                Excluir
              </button>
            ) : <div></div>}
            
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 shadow-md"
              >
                Salvar
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

// --- Main Calendar Component ---
const CalendarioLicitacoes: React.FC = () => {
  const [events, setEvents] = useState<EventApi[]>([]);
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    isNew: boolean;
    dateStr?: string;
    event?: EventApi;
  }>({ isOpen: false, isNew: false });

  // Load events from API on mount
  React.useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const data = await api.get('/api/events');
      // Mapeia os dados do banco para o formato do FullCalendar
      const formattedEvents = data.map((evt: any) => ({
        id: evt.id,
        title: `${evt.time || ''} - ${evt.city}`, // Título no calendário
        start: evt.date, // Data (YYYY-MM-DD)
        allDay: true,
        backgroundColor: evt.documentationStatus === 'OK' ? '#C8E6C9' : '#FFF9C4',
        borderColor: evt.documentationStatus === 'OK' ? '#2E7D32' : '#FBC02D',
        textColor: '#000',
        extendedProps: {
          city: evt.city,
          bid_number: evt.bid_number,
          time: evt.time,
          location: evt.location,
          description: evt.description,
          documentationStatus: evt.documentationStatus,
          // Novos campos mapeados do banco
          estimatedValue: evt.estimatedValue,
          distance: evt.distance,
          avgEmployees: evt.avgEmployees,
          warranty: evt.warranty,
          editalFile: evt.editalFile,
          editalFileName: evt.editalFileName
        }
      }));
      setEvents(formattedEvents);
    } catch (error) {
      console.error("Erro ao buscar eventos", error);
    }
  };

  const openModalForNew = (arg: DateClickArg) => {
    setModalState({
      isOpen: true,
      isNew: true,
      dateStr: arg.dateStr,
    });
  };

  const openModalForEdit = (arg: EventClickArg) => {
    setModalState({
      isOpen: true,
      isNew: false,
      event: arg.event,
    });
  };

  const closeModal = () => {
    setModalState({ isOpen: false, isNew: false });
  };

  const handleSaveEvent = async (details: DetalhesEventoComDoc) => {
    try {
      const payload = {
        city: details.city,
        bid_number: details.bid_number,
        time: details.time,
        location: details.location,
        description: details.description,
        documentationStatus: details.documentationStatus,
        // Novos campos
        estimatedValue: details.estimatedValue,
        distance: details.distance,
        avgEmployees: details.avgEmployees,
        warranty: details.warranty,
        editalFile: details.editalFile,
        editalFileName: details.editalFileName,
        // Campos obrigatórios do banco
        date: modalState.isNew ? modalState.dateStr : modalState.event?.startStr,
        title: `${details.time} - ${details.city}`, // Campo redundante usado em visualizações simples
      };

      if (modalState.isNew) {
        await api.post('/api/events', payload);
      } else if (modalState.event) {
        await api.put(`/api/events/${modalState.event.id}`, payload);
      }
      
      closeModal();
      fetchEvents(); // Recarrega calendário
    } catch (error) {
      alert('Erro ao salvar o evento.');
      console.error(error);
    }
  };

  const handleDeleteEvent = async () => {
    if (modalState.event) {
      try {
        await api.delete(`/api/events/${modalState.event.id}`);
        closeModal();
        fetchEvents();
      } catch (error) {
        alert('Erro ao excluir evento.');
      }
    }
  };

  const handleEventDrop = async (arg: EventDropArg) => {
     try {
        const updatedDate = arg.event.startStr; // YYYY-MM-DD
        // Mantém os dados antigos, só muda a data
        const payload = {
            ...arg.event.extendedProps,
            date: updatedDate
        };
        await api.put(`/api/events/${arg.event.id}`, payload);
     } catch (error) {
         arg.revert(); // Volta se der erro
         alert("Erro ao mover evento.");
     }
  };

  return (
    <div className="h-full flex flex-col p-4 bg-gray-100">
      <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md">
        <FullCalendar
          plugins={[dayGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          locale="pt-br"
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth',
          }}
          hiddenDays={[0, 6]}
          events={events} // Usa o state local formatado
          selectable={true}
          editable={true}
          dateClick={openModalForNew}
          eventClick={openModalForEdit}
          eventDrop={handleEventDrop}
          eventContent={(arg) => {
              // Customização visual do evento no calendário
              const props = arg.event.extendedProps;
              return (
                  <div className="p-1 overflow-hidden">
                      <div className="font-bold text-xs">{arg.timeText}</div>
                      <div className="font-bold text-xs truncate">{props.bid_number}</div>
                      <div className="text-xs truncate">{props.city}</div>
                      {props.documentationStatus === 'PENDENTE' && (
                          <div className="text-[10px] text-red-600 font-bold">⚠️ DOC PENDENTE</div>
                      )}
                  </div>
              )
          }}
          dayCellDidMount={(arg) => {
            // Pinta o fundo do dia se tiver evento
            const dateStr = arg.date.toISOString().split('T')[0];
            const hasEvent = events.some((e) => e.start === dateStr);
            if (hasEvent) {
                // Se o evento tem doc pendente, pinta o dia de amarelo claro, senão verde claro
                const evt = events.find(e => e.start === dateStr);
                const isPending = evt?.extendedProps.documentationStatus === 'PENDENTE';
                arg.el.style.backgroundColor = isPending ? '#FFFDE7' : '#E8F5E9';
            }
          }}
          height="auto"
        />
      </div>
      
      {/* O Modal agora é renderizado dentro do componente principal */}
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
