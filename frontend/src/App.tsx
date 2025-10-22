import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout } from './components/layout';
import { DebugPanel } from './components/debug';
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
  NewsPage,
  NewsDetailPage,
  SearchResultsPage,
  AdminDashboard,
  ProfilePage,
  PerfilSocio,
  PublicSocioPage,
  PanelAdminDashboard,
  AdminContent,
  AdminNews,
  AdminPostulantes,
  AdminSocios,
  AdminCuotas
} from './pages';
import AdminLayout from './components/layout/AdminLayout';
import PanelAdminLayout from './components/layout/PanelAdminLayout';
import AdminUsers from './pages/AdminUsers';
import AdminSettings from './pages/AdminSettings';
import AdminMonitoring from './pages/AdminMonitoring';

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
          <Route path="/socios/:id" element={<PublicSocioPage />} />

          {/* Administración Antigua (mantener por compatibilidad) */}
          <Route path="/admin" element={<AdminLayout><AdminDashboard /></AdminLayout>} />
          <Route path="/admin/dashboard" element={<AdminLayout><AdminDashboard /></AdminLayout>} />
          <Route path="/admin/users" element={<AdminLayout><AdminUsers /></AdminLayout>} />
          <Route path="/admin/eventos" element={<AdminLayout><AdminContent /></AdminLayout>} />
          <Route path="/admin/socios" element={<ProfilePage defaultTab="admin" />} />
          <Route path="/admin/socios/:id" element={<PanelAdminLayout><PerfilSocio /></PanelAdminLayout>} />
          <Route path="/admin/cuotas" element={<AdminLayout><AdminCuotas /></AdminLayout>} />
          <Route path="/admin/settings" element={<AdminLayout><AdminSettings /></AdminLayout>} />
          <Route path="/admin/monitoring" element={<AdminLayout><AdminMonitoring /></AdminLayout>} />
          
          {/* Panel de Administración Nuevo */}
          <Route path="/panel-admin" element={<PanelAdminLayout><PanelAdminDashboard /></PanelAdminLayout>} />
          <Route path="/panel-admin/users" element={<PanelAdminLayout><AdminSocios /></PanelAdminLayout>} />
          <Route path="/panel-admin/users/createuser" element={<PanelAdminLayout><AdminSocios /></PanelAdminLayout>} />
          <Route path="/panel-admin/users/:socioId/edituser" element={<PanelAdminLayout><AdminSocios /></PanelAdminLayout>} />
          <Route path="/panel-admin/users/:id" element={<PanelAdminLayout><PerfilSocio /></PanelAdminLayout>} />
          <Route path="/panel-admin/payments" element={<PanelAdminLayout><AdminCuotas /></PanelAdminLayout>} />
          <Route path="/panel-admin/content" element={<PanelAdminLayout><AdminContent /></PanelAdminLayout>} />
          <Route path="/panel-admin/news" element={<PanelAdminLayout><AdminNews /></PanelAdminLayout>} />
          <Route path="/panel-admin/postulantes" element={<PanelAdminLayout><AdminPostulantes /></PanelAdminLayout>} />
          
          {/* Perfil de Usuario */}
          <Route path="/perfil" element={<ProfilePage />} />
          <Route path="/configuracion" element={<ProfilePage />} />
          <Route path="/mi-cuenta" element={<ProfilePage />} />
          
          {/* Páginas generales */}
          <Route path="/contacto" element={<ContactPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
        <DebugPanel />
      </Layout>
    </Router>
  );
}

export default App
