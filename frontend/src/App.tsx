import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { Layout } from './components/layout';
import { DebugPanel } from './components/debug';
import { EventProviderWrapper } from './components/providers/EventProviderWrapper';

const HomePage = lazy(() => import('./pages/HomePage'));
const AboutPage = lazy(() => import('./pages/AboutPage'));
const JoinPage = lazy(() => import('./pages/JoinPage'));
const EventsPage = lazy(() => import('./pages/EventsPage'));
const EventDetailPage = lazy(() => import('./pages/EventDetailPage'));
const CreateEventPage = lazy(() => import('./pages/CreateEventPage'));
const EditEventPage = lazy(() => import('./pages/EditEventPage'));
const MyEventsPage = lazy(() => import('./pages/MyEventsPage'));
const AuthPage = lazy(() => import('./pages/AuthPage'));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage'));
const lazyWithNamedExport = <T extends Record<string, any>>(
  factory: () => Promise<T>,
  exportName: keyof T,
) =>
  lazy(() =>
    factory().then((module) => ({
      default: module[exportName] as T[keyof T],
    })),
  );

const BlogPage = lazyWithNamedExport(() => import('./pages/BlogPage'), 'BlogPage');
const PostDetailPage = lazyWithNamedExport(() => import('./pages/BlogPage'), 'PostDetailPage');
const ContactPage = lazy(() => import('./pages/ContactPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));
const NewsPage = lazy(() => import('./pages/NewsPage'));
const NewsDetailPage = lazy(() => import('./pages/NewsDetailPage'));
const SearchResultsPage = lazy(() => import('./pages/SearchResultsPage'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const PerfilSocio = lazy(() => import('./pages/PerfilSocio'));
const PublicSocioPage = lazy(() => import('./pages/PublicSocioPage'));
const PanelAdminDashboard = lazy(() => import('./pages/PanelAdminDashboard'));
const AdminContent = lazy(() => import('./pages/AdminContent'));
const AdminNews = lazy(() => import('./pages/AdminNews'));
const AdminPostulantes = lazy(() => import('./pages/AdminPostulantes'));
const AdminSocios = lazy(() => import('./pages/AdminSocios'));
const AdminCuotas = lazy(() => import('./pages/AdminCuotas'));
const AdminLayout = lazy(() => import('./components/layout/AdminLayout'));
const PanelAdminLayout = lazy(() => import('./components/layout/PanelAdminLayout'));
const AdminUsers = lazy(() => import('./pages/AdminUsers'));
const AdminSettings = lazy(() => import('./pages/AdminSettings'));
const AdminMonitoring = lazy(() => import('./pages/AdminMonitoring'));
const TestUser = lazy(() => import('./pages/TestUser'));
const SociosAcaLinks = lazy(() => import('./pages/SociosAcaLinks'));
const ParticipaPage = lazy(() => import('./pages/ParticipaPage'));
const CondicionesSorteoPage = lazy(() => import('./pages/CondicionesSorteoPage'));
const AdminParticipantes = lazy(() => import('./components/admin/AdminParticipantes'));
const AdminTrash = lazy(() => import('./components/admin/AdminTrash'));
const GuestbookPage = lazy(() => import('./pages/GuestbookPage'));
const AdminGuestbook = lazy(() => import('./components/admin/AdminGuestbook'));
const AdminGuestbookTrash = lazy(() => import('./components/admin/AdminGuestbookTrash'));
const ResultadosPage = lazy(() => import('./pages/ResultadosPage'));
const ShopPage = lazy(() => import('./pages/ShopPage'));
const ProductDetailPage = lazy(() => import('./pages/ProductDetailPage'));
const CartPage = lazy(() => import('./pages/CartPage'));
const PaymentPage = lazy(() => import('./pages/PaymentPage'));
const AdminEcommerce = lazy(() => import('./pages/AdminEcommerce'));

import { ProtectedRoute } from './components/auth';

const LoadingScreen = () => (
  <div className="min-h-[50vh] flex items-center justify-center">
    <div className="text-sm text-gray-500">Cargando contenido…</div>
  </div>
);

function App() {
  return (
    <Router>
      <Layout>
        <Suspense fallback={<LoadingScreen />}>
          <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/resultados" element={<ResultadosPage />} />
          <Route path="/quienes-somos" element={<AboutPage />} />
          <Route path="/unete" element={<JoinPage />} />
          
          {/* Tienda - Solo para usuarios autenticados */}
          <Route path="/shop" element={<ProtectedRoute><ShopPage /></ProtectedRoute>} />
          <Route path="/shop/:sku" element={<ProtectedRoute><ProductDetailPage /></ProtectedRoute>} />
          <Route path="/cart" element={<ProtectedRoute><CartPage /></ProtectedRoute>} />
          <Route path="/cart/payment/:orderNumber" element={<ProtectedRoute><PaymentPage /></ProtectedRoute>} />
          
          {/* Eventos */}
          <Route path="/eventos" element={<EventProviderWrapper><EventsPage /></EventProviderWrapper>} />
          <Route path="/eventos/crear" element={<EventProviderWrapper><CreateEventPage /></EventProviderWrapper>} />
          <Route path="/eventos/mis-eventos" element={<EventProviderWrapper><MyEventsPage /></EventProviderWrapper>} />
          <Route path="/eventos/:id" element={<EventProviderWrapper><EventDetailPage /></EventProviderWrapper>} />
          <Route path="/eventos/:id/editar" element={<EventProviderWrapper><EditEventPage /></EventProviderWrapper>} />
          
          {/* Autenticación */}
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          
          {/* Noticias y Blog */}
          <Route path="/blog" element={<BlogPage />} />
          <Route path="/blog/:slug" element={<PostDetailPage />} />
          <Route path="/noticias" element={<NewsPage />} />
          <Route path="/noticias/crear" element={<PanelAdminLayout><AdminNews /></PanelAdminLayout>} />
          <Route path="/noticias/editar/:slug" element={<PanelAdminLayout><AdminNews /></PanelAdminLayout>} />
          <Route path="/noticias/:slug" element={<NewsDetailPage />} />
          
          {/* Libro de Visitas */}
          <Route path="/visitas" element={<GuestbookPage />} />
          
          {/* Búsqueda */}
          <Route path="/buscar" element={<SearchResultsPage />} />
          <Route path="/socios/:id" element={<PublicSocioPage />} />

          {/* Administración Antigua (mantener por compatibilidad) */}
          <Route path="/admin" element={<AdminLayout><AdminDashboard /></AdminLayout>} />
          <Route path="/admin/dashboard" element={<AdminLayout><AdminDashboard /></AdminLayout>} />
          <Route path="/admin/users" element={<AdminLayout><AdminUsers /></AdminLayout>} />
          <Route path="/admin/eventos" element={<EventProviderWrapper><AdminLayout><AdminContent /></AdminLayout></EventProviderWrapper>} />
          <Route path="/admin/socios" element={<ProfilePage />} />
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
          <Route path="/panel-admin/content" element={<EventProviderWrapper><PanelAdminLayout><AdminContent /></PanelAdminLayout></EventProviderWrapper>} />
          <Route path="/panel-admin/news" element={<PanelAdminLayout><AdminNews /></PanelAdminLayout>} />
          <Route path="/panel-admin/papelera" element={<PanelAdminLayout><AdminTrash /></PanelAdminLayout>} />
          <Route path="/panel-admin/postulantes" element={<EventProviderWrapper><PanelAdminLayout><AdminPostulantes /></PanelAdminLayout></EventProviderWrapper>} />
          <Route path="/panel-admin/participantes" element={<PanelAdminLayout><AdminParticipantes /></PanelAdminLayout>} />
          <Route path="/panel-admin/guestbook" element={<PanelAdminLayout><AdminGuestbook /></PanelAdminLayout>} />
          <Route path="/panel-admin/guestbook/trash" element={<PanelAdminLayout><AdminGuestbookTrash /></PanelAdminLayout>} />
          <Route path="/panel-admin/ecommerce" element={<PanelAdminLayout><AdminEcommerce /></PanelAdminLayout>} />
          
          {/* Perfil de Usuario */}
          <Route path="/perfil" element={<ProfilePage />} />
          <Route path="/configuracion" element={<ProfilePage />} />
          <Route path="/mi-cuenta" element={<ProfilePage />} />
          
          {/* Páginas generales */}
          <Route path="/contacto" element={<ContactPage />} />

          {/* Enlaces para socios (acceso directo sin navegación) */}
          <Route path="/sociosaca" element={<SociosAcaLinks />} />

          {/* Página de participación sorteo (acceso directo, sin indexar) */}
          <Route path="/participa" element={<ParticipaPage />} />
          <Route path="/condicionessorteo" element={<CondicionesSorteoPage />} />

          {/* Test Page */}
          <Route path="/testuser" element={<TestUser />} />

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
        </Suspense>
        <DebugPanel />
      </Layout>
    </Router>
  );
}

export default App
