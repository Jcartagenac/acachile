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
  NotFoundPage,
  AdminPanelPage,
  NewsPage,
  NewsDetailPage,
  SearchResultsPage,
  AdminDashboard
} from './pages';
import AdminLayout from './components/layout/AdminLayout';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/quienes-somos" element={<AboutPage />} />
          <Route path="/unete" element={<JoinPage />} />
          
          {/* Eventos */}
          <Route path="/eventos" element={<EventsPage />} />
          <Route path="/eventos/crear" element={<CreateEventPage />} />
          <Route path="/eventos/mis-eventos" element={<MyEventsPage />} />
          <Route path="/eventos/:id" element={<EventDetailPage />} />
          
          {/* Autenticación */}
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          
          {/* Noticias y Blog */}
          <Route path="/blog" element={<BlogPage />} />
          <Route path="/blog/:slug" element={<PostDetailPage />} />
          <Route path="/noticias" element={<NewsPage />} />
          <Route path="/noticias/:slug" element={<NewsDetailPage />} />
          
          {/* Búsqueda */}
          <Route path="/buscar" element={<SearchResultsPage />} />
          
          {/* Administración */}
          <Route path="/admin" element={<AdminLayout><AdminPanelPage /></AdminLayout>} />
          <Route path="/admin/dashboard" element={<AdminLayout><AdminDashboard /></AdminLayout>} />
          
          {/* Páginas generales */}
          <Route path="/contacto" element={<ContactPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App
