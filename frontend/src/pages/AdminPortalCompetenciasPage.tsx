import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { CompetenciasDashboardGrid } from '../components/portal/CompetenciasDashboardGrid';

export default function AdminPortalCompetenciasPage() {
  return (
    <div className="p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
          <Link to="/panel-admin/portal-del-socio" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
            <ArrowLeft className="h-4 w-4" /> Volver al Portal del Socio
          </Link>
          <h1 className="mt-4 text-3xl font-bold text-gray-900">Competencias</h1>
          <p className="mt-2 text-sm leading-7 text-gray-600">
            Estructura base del módulo de Competencias dentro del panel admin. Por ahora solo registra visualmente los accesos futuros del módulo.
          </p>
        </div>

        <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
          <CompetenciasDashboardGrid />
        </div>
      </div>
    </div>
  );
}
