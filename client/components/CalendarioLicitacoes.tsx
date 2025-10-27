
import React, { useState, useRef, FormEvent, useEffect } from 'react';
import { EventoCalendarioDetalhado, DetalhesEvento } from '../types';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin, { DateClickArg } from '@fullcalendar/interaction';
import { EventClickArg, EventDropArg, EventApi } from '@fullcalendar/core';

// --- Modal Component ---
interface EventoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (details: DetalhesEvento) => void;
  onDelete?: () => void;
  isNew: boolean;
  eventData?: EventApi;
  dateStr?: string;
}

const EventoModal: React.FC<EventoModalProps> = ({ isOpen, onClose, onSave, onDelete, isNew, eventData, dateStr }) => {
  if (!isOpen) return null;

  const initialDetails: DetalhesEvento = isNew 
    ? { city: '', bid_number: '', time: '', location: '', description: '' }
    : eventData?.extendedProps as DetalhesEvento;

  const [details, setDetails] = useState<DetalhesEvento>(initialDetails);
  
  const modalTitle = isNew ? 'Nova Licitação' : 'Editar Licitação';
  const displayDate = new Date((dateStr || eventData?.startStr) + 'T00:00:00').toLocaleDateString('pt-BR');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setDetails(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!details.bid_number.trim()) {
        alert('O campo "Número Licitação" é obrigatório.');
        return;
    }
    onSave(details);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <form onSubmit={handleSubmit}>
          <div className="p-6 border-b">
            <h3 className="text-xl font-bold text-gray-800">{modalTitle}</h3>
            <p className="text-sm text-gray-600">Data: {displayDate}</p>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label htmlFor="bid_number" className="block text-sm font-medium text-gray-700">Número Licitação:</label>
              <input type="text" name="bid_number" id="bid_number" value={details.bid_number} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm" />
            </div>
            <div>
              <label htmlFor="city" className="block text-sm font-medium text-gray-700">Cidade:</label>
              <input type="text" name="city" id="city" value={details.city} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm" />
            </div>
            <div>
              <label htmlFor="time" className="block text-sm font-medium text-gray-700">Horário:</label>
              <input type="text" name="time" id="time" value={details.time} onChange={handleChange} placeholder="Ex: 10:00" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm" />
            </div>
            <div className="md:col-span-2">
              <label htmlFor="location" className="block text-sm font-medium text-gray-700">Local:</label>
              <input type="text" name="location" id="location" value={details.location} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm" />
            </div>
            <div className="md:col-span-2">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">Descrição:</label>
              <textarea name="description" id="description" value={details.description} onChange={handleChange} rows={3} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"></textarea>
            </div>
          </div>
          <div className="p-6 bg-gray-50 rounded-b-lg flex justify-between items-center gap-3">
             <div>
              {!isNew && onDelete && (
                <button type="button" onClick={onDelete} className="px-4 py-2 bg-red-600 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-red-700">Excluir</button>
              )}
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={onClose} className="px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50">Cancelar</button>
              <button type="submit" className="px-4 py-2 bg-primary border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-secondary">Salvar</button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};


// --- Main Calendar Component ---
interface CalendarioLicitacoesProps {
  events: EventoCalendarioDetalhado[];
  setEvents: React.Dispatch<React.SetStateAction<EventoCalendarioDetalhado[]>>;
}

const CalendarioLicitacoes: React.FC<CalendarioLicitacoesProps> = ({ events, setEvents }) => {
  const [modalState, setModalState] = useState<{ isOpen: boolean; isNew: boolean; dateStr?: string; event?: EventApi }>({
    isOpen: false,
    isNew: true,
  });
  const restoreInputRef = useRef<HTMLInputElement>(null);

  const openModalForNew = (arg: DateClickArg) => {
    setModalState({ isOpen: true, isNew: true, dateStr: arg.dateStr });
  };

  const openModalForEdit = (arg: EventClickArg) => {
    setModalState({ isOpen: true, isNew: false, event: arg.event });
  };

  const closeModal = () => {
    setModalState({ isOpen: false, isNew: true });
  };

  const handleSaveEvent = (details: DetalhesEvento) => {
    if (modalState.isNew && modalState.dateStr) {
      const newEvent: EventoCalendarioDetalhado = {
        id: Date.now().toString(),
        start: modalState.dateStr,
        title: details.bid_number,
        extendedProps: details,
      };
      setEvents(currentEvents => [...currentEvents, newEvent]);
    } else if (!modalState.isNew && modalState.event) {
      setEvents(currentEvents =>
        currentEvents.map(e =>
          e.id === modalState.event?.id
            ? { ...e, title: details.bid_number, extendedProps: details }
            : e
        )
      );
    }
    closeModal();
  };

  const handleDeleteEvent = () => {
    if (!modalState.isNew && modalState.event && window.confirm('Tem certeza que deseja excluir este evento?')) {
      setEvents(currentEvents => currentEvents.filter(e => e.id !== modalState.event?.id));
      closeModal();
    }
  };
  
  const handleEventDrop = (arg: EventDropArg) => {
      const { event } = arg;
      if (!event.startStr) return;
      
      setEvents(currentEvents => currentEvents.map(e => 
          e.id === event.id ? { ...e, start: event.startStr } : e
      ));
  };
  
  // Backup and Restore functionality remains the same
  const handleBackup = () => {
    if (events.length === 0) {
        alert('Não há dados no calendário para fazer backup.');
        return;
    }
    const dataStr = JSON.stringify({ events }, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const a = document.createElement('a');
    a.href = url;
    const date = new Date().toISOString().slice(0, 10);
    a.download = `backup_calendario_${date}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleRestoreClick = () => {
      restoreInputRef.current?.click();
  };
  
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/json') {
      alert('Por favor, selecione um arquivo de backup .json válido.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const text = e.target?.result as string;
            const data = JSON.parse(text);
            if (!data.events || !Array.isArray(data.events)) {
                throw new Error('Formato do arquivo de backup inválido.');
            }
            if (window.confirm('Restaurar este backup irá substituir TODOS os dados atuais do calendário. Deseja continuar?')) {
                setEvents(data.events);
                alert('Backup do calendário restaurado com sucesso!');
            }
        } catch (error) {
            console.error('Erro ao restaurar backup:', error);
            alert('Ocorreu um erro ao ler o arquivo de backup do calendário.');
        } finally {
            if(restoreInputRef.current) restoreInputRef.current.value = '';
        }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
       <style>{`
        /* Estilo da grade do calendário */
        .fc .fc-scrollgrid, .fc table {
            border-collapse: collapse;
        }
        .fc th, .fc td {
            border: 1px solid #ddd !important;
        }
        .fc .fc-col-header-cell {
            background-color: #f7f7f7;
        }
        .fc-day-today {
            background-color: #dbeafe !important;
        }
      `}</style>
      <div className="flex flex-wrap justify-between items-center gap-4">
        <h2 className="text-3xl font-bold text-gray-800">Calendário de Licitações</h2>
        <div className="flex items-center gap-2">
            <button onClick={handleBackup} className="px-4 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition-colors">Fazer Backup</button>
            <button onClick={handleRestoreClick} className="px-4 py-2 bg-gray-600 text-white rounded-lg shadow hover:bg-gray-700 transition-colors">Restaurar Backup</button>
            <input type="file" ref={restoreInputRef} onChange={handleFileSelect} accept=".json" className="hidden" />
            <button onClick={() => openModalForNew({ dateStr: new Date().toISOString().split('T')[0] } as any)} className="px-4 py-2 bg-primary text-white rounded-lg shadow hover:bg-secondary transition-colors">Novo Evento</button>
        </div>
      </div>
      <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md">
        <FullCalendar
          plugins={[dayGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          locale="pt-br"
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth'
          }}
          hiddenDays={[0, 6]} // Hide Sunday and Saturday
          events={events}
          selectable={true}
          editable={true}
          dateClick={openModalForNew}
          eventClick={openModalForEdit}
          eventDrop={handleEventDrop}
          dayCellDidMount={(arg) => {
              const dateStr = arg.date.toISOString().split('T')[0];
              const hasEvent = events.some(e => e.start === dateStr);
              arg.el.style.backgroundColor = hasEvent ? '#FFF9C4' : '#C8E6C9';
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