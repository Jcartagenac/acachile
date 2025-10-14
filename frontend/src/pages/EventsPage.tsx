import React from 'react';
import { Container } from '../components/layout/Container';
import { EventList } from '../components/events';

export const EventsPage: React.FC = () => {
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#e8ecf4' }}>
      <Container>
        <div className="py-8">
          <EventList />
        </div>
      </Container>
    </div>
  );
};