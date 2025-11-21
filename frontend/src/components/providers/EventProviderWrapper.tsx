import React from 'react';
import { EventProvider } from '../../contexts/EventContext';

interface EventProviderWrapperProps {
  children: React.ReactNode;
}

/**
 * Wrapper para EventProvider que solo se usa en rutas que necesitan eventos
 * Evita re-renders innecesarios en toda la aplicación
 */
export const EventProviderWrapper: React.FC<EventProviderWrapperProps> = ({ children }) => {
  return <EventProvider>{children}</EventProvider>;
};
