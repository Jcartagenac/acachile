import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout } from './components/layout';
import { 
  HomePage, 
  AboutPage, 
  JoinPage, 
  EventsPage, 
  EventDetailPage,
  CreateEventPage,
  MyEventsPage,
  AuthPage,
  ForgotPasswordPage,
  ResetPasswordPage,
  BlogPage,
  PostDetailPage,
  ContactPage,
  NotFoundPage 
} from './pages';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/quienes-somos" element={<AboutPage />} />
          <Route path="/unete" element={<JoinPage />} />
          <Route path="/eventos" element={<EventsPage />} />
          <Route path="/eventos/crear" element={<CreateEventPage />} />
          <Route path="/eventos/mis-eventos" element={<MyEventsPage />} />
          <Route path="/eventos/:id" element={<EventDetailPage />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/noticias" element={<BlogPage />} />
          <Route path="/noticias/:slug" element={<PostDetailPage />} />
          <Route path="/contacto" element={<ContactPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App
