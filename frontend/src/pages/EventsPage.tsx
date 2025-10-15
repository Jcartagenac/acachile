import React from 'react';
import { Container } from '../components/layout/Container';
import { EventList } from '../components/events';

export const EventsPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-pastel-purple-50 to-neutral-100 relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute top-10 left-10 w-72 h-72 bg-gradient-to-r from-primary-200/20 to-pastel-blue-200/20 rounded-full blur-3xl animate-soft-pulse"></div>
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-gradient-to-r from-pastel-pink-200/20 to-primary-200/20 rounded-full blur-3xl animate-soft-pulse delay-1000"></div>
      
      <Container>
        <div className="py-12 relative z-10">
          <EventList />
        </div>
      </Container>
    </div>
  );
};