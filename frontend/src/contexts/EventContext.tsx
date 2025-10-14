import React, { createContext, useContext, useReducer, useCallback } from 'react';
import { Evento, EventoForm, EventInscription } from '@shared/index';
import { eventService } from '../services/eventService';
import { useAuth } from './AuthContext';

interface EventState {
  eventos: Evento[];
  currentEvent: Evento | null;
  myInscripciones: EventInscription[];
  isLoading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  filters: {
    type?: string;
    status?: string;
    search?: string;
  };
}

type EventAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_EVENTOS'; payload: { eventos: Evento[]; pagination: any } }
  | { type: 'SET_CURRENT_EVENT'; payload: Evento | null }
  | { type: 'ADD_EVENTO'; payload: Evento }
  | { type: 'UPDATE_EVENTO'; payload: Evento }
  | { type: 'DELETE_EVENTO'; payload: number }
  | { type: 'SET_MY_INSCRIPCIONES'; payload: EventInscription[] }
  | { type: 'ADD_INSCRIPCION'; payload: EventInscription }
  | { type: 'REMOVE_INSCRIPCION'; payload: number }
  | { type: 'SET_FILTERS'; payload: Partial<EventState['filters']> };

const initialState: EventState = {
  eventos: [],
  currentEvent: null,
  myInscripciones: [],
  isLoading: false,
  error: null,
  pagination: {
    page: 1,
    limit: 12,
    total: 0,
    pages: 0,
  },
  filters: {},
};

const eventReducer = (state: EventState, action: EventAction): EventState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_EVENTOS':
      return {
        ...state,
        eventos: action.payload.eventos,
        pagination: action.payload.pagination,
      };
    case 'SET_CURRENT_EVENT':
      return { ...state, currentEvent: action.payload };
    case 'ADD_EVENTO':
      return {
        ...state,
        eventos: [action.payload, ...state.eventos],
      };
    case 'UPDATE_EVENTO':
      return {
        ...state,
        eventos: state.eventos.map((evento) =>
          evento.id === action.payload.id ? action.payload : evento
        ),
        currentEvent:
          state.currentEvent?.id === action.payload.id
            ? action.payload
            : state.currentEvent,
      };
    case 'DELETE_EVENTO':
      return {
        ...state,
        eventos: state.eventos.filter((evento) => evento.id !== action.payload),
        currentEvent:
          state.currentEvent?.id === action.payload ? null : state.currentEvent,
      };
    case 'SET_MY_INSCRIPCIONES':
      return { ...state, myInscripciones: action.payload };
    case 'ADD_INSCRIPCION':
      return {
        ...state,
        myInscripciones: [...state.myInscripciones, action.payload],
        currentEvent: state.currentEvent
          ? {
              ...state.currentEvent,
              currentParticipants: state.currentEvent.currentParticipants + 1,
            }
          : null,
      };
    case 'REMOVE_INSCRIPCION':
      return {
        ...state,
        myInscripciones: state.myInscripciones.filter(
          (inscripcion) => inscripcion.id !== action.payload
        ),
        currentEvent: state.currentEvent
          ? {
              ...state.currentEvent,
              currentParticipants: Math.max(0, state.currentEvent.currentParticipants - 1),
            }
          : null,
      };
    case 'SET_FILTERS':
      return {
        ...state,
        filters: { ...state.filters, ...action.payload },
      };
    default:
      return state;
  }
};

interface EventContextType extends EventState {
  fetchEventos: (page?: number) => Promise<void>;
  fetchEvento: (id: number) => Promise<void>;
  createEvento: (eventoData: EventoForm) => Promise<Evento>;
  updateEvento: (id: number, eventoData: Partial<EventoForm>) => Promise<Evento>;
  deleteEvento: (id: number) => Promise<void>;
  inscribirseEvento: (eventId: number) => Promise<void>;
  cancelarInscripcion: (inscriptionId: number) => Promise<void>;
  fetchMyInscripciones: () => Promise<void>;
  setFilters: (filters: Partial<EventState['filters']>) => void;
  clearError: () => void;
  isUserInscribed: (eventId: number) => boolean;
  canUserEditEvent: (evento: Evento) => boolean;
}

const EventContext = createContext<EventContextType | null>(null);

export const useEvents = () => {
  const context = useContext(EventContext);
  if (!context) {
    throw new Error('useEvents debe ser usado dentro de un EventProvider');
  }
  return context;
};

interface EventProviderProps {
  children: React.ReactNode;
}

export const EventProvider: React.FC<EventProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(eventReducer, initialState);
  const { user } = useAuth();

  const fetchEventos = useCallback(async (page?: number) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const response = await eventService.getEventos({
        ...state.filters,
        page: page || state.pagination.page,
        limit: state.pagination.limit,
      });

      if (response.success && response.data) {
        dispatch({
          type: 'SET_EVENTOS',
          payload: {
            eventos: response.data,
            pagination: response.pagination || state.pagination,
          },
        });
      }
    } catch (error) {
      dispatch({
        type: 'SET_ERROR',
        payload: error instanceof Error ? error.message : 'Error al cargar eventos',
      });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [state.filters, state.pagination.page, state.pagination.limit]);

  const fetchEvento = useCallback(async (id: number) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const response = await eventService.getEvento(id);
      if (response.success && response.data) {
        dispatch({ type: 'SET_CURRENT_EVENT', payload: response.data });
      }
    } catch (error) {
      dispatch({
        type: 'SET_ERROR',
        payload: error instanceof Error ? error.message : 'Error al cargar evento',
      });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  const createEvento = useCallback(async (eventoData: EventoForm): Promise<Evento> => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const response = await eventService.createEvento(eventoData);
      if (response.success && response.data) {
        dispatch({ type: 'ADD_EVENTO', payload: response.data });
        return response.data;
      }
      throw new Error(response.error || 'Error al crear evento');
    } catch (error) {
      dispatch({
        type: 'SET_ERROR',
        payload: error instanceof Error ? error.message : 'Error al crear evento',
      });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  const updateEvento = useCallback(
    async (id: number, eventoData: Partial<EventoForm>): Promise<Evento> => {
      dispatch({ type: 'SET_LOADING', payload: true });
      try {
        const response = await eventService.updateEvento(id, eventoData);
        if (response.success && response.data) {
          dispatch({ type: 'UPDATE_EVENTO', payload: response.data });
          return response.data;
        }
        throw new Error(response.error || 'Error al actualizar evento');
      } catch (error) {
        dispatch({
          type: 'SET_ERROR',
          payload: error instanceof Error ? error.message : 'Error al actualizar evento',
        });
        throw error;
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    },
    []
  );

  const deleteEvento = useCallback(async (id: number) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const response = await eventService.deleteEvento(id);
      if (response.success) {
        dispatch({ type: 'DELETE_EVENTO', payload: id });
      }
    } catch (error) {
      dispatch({
        type: 'SET_ERROR',
        payload: error instanceof Error ? error.message : 'Error al eliminar evento',
      });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  const inscribirseEvento = useCallback(async (eventId: number) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const response = await eventService.inscribirseEvento(eventId);
      if (response.success && response.data) {
        dispatch({ type: 'ADD_INSCRIPCION', payload: response.data });
      }
    } catch (error) {
      dispatch({
        type: 'SET_ERROR',
        payload: error instanceof Error ? error.message : 'Error al inscribirse',
      });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  const cancelarInscripcion = useCallback(async (inscriptionId: number) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const response = await eventService.cancelarInscripcion(inscriptionId);
      if (response.success) {
        dispatch({ type: 'REMOVE_INSCRIPCION', payload: inscriptionId });
      }
    } catch (error) {
      dispatch({
        type: 'SET_ERROR',
        payload: error instanceof Error ? error.message : 'Error al cancelar inscripción',
      });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  const fetchMyInscripciones = useCallback(async () => {
    if (!user) return;
    
    try {
      const response = await eventService.getMyInscripciones();
      if (response.success && response.data) {
        dispatch({ type: 'SET_MY_INSCRIPCIONES', payload: response.data });
      }
    } catch (error) {
      // No seteamos error global para inscripciones, solo log para debug
      console.error('Error loading user inscriptions:', error);
    }
  }, [user]);

  const setFilters = useCallback((filters: Partial<EventState['filters']>) => {
    dispatch({ type: 'SET_FILTERS', payload: filters });
  }, []);

  const clearError = useCallback(() => {
    dispatch({ type: 'SET_ERROR', payload: null });
  }, []);

  const isUserInscribed = useCallback(
    (eventId: number): boolean => {
      return state.myInscripciones.some(
        (inscripcion) => inscripcion.eventId === eventId && inscripcion.status !== 'cancelled'
      );
    },
    [state.myInscripciones]
  );

  const canUserEditEvent = useCallback(
    (evento: Evento): boolean => {
      return user?.id === evento.organizerId || user?.membershipType === 'vip';
    },
    [user]
  );

  const contextValue: EventContextType = {
    ...state,
    fetchEventos,
    fetchEvento,
    createEvento,
    updateEvento,
    deleteEvento,
    inscribirseEvento,
    cancelarInscripcion,
    fetchMyInscripciones,
    setFilters,
    clearError,
    isUserInscribed,
    canUserEditEvent,
  };

  return (
    <EventContext.Provider value={contextValue}>
      {children}
    </EventContext.Provider>
  );
};