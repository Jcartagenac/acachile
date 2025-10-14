import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout } from './components/layout';
import { 
  HomePage, 
  AboutPage, 
  JoinPage, 
  EventsPage, 
  EventDetailPage,
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
          <Route path="/eventos/:id" element={<EventDetailPage />} />
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
