import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Calendar,
  ShieldAlert,
  UserCircle,
  Home,
  Cake,
  Fingerprint
} from 'lucide-react';

interface PublicSocioResponse {
  success: boolean;
  data?: PublicSocio;
  error?: string;
}

interface PrivacyFlags {
  showEmail: boolean;
  showPhone: boolean;
  showRut: boolean;
  showAddress: boolean;
  showBirthdate: boolean;
  showPublicProfile: boolean;
}

interface ContactInfo {
  email: string | null;
  phone: string | null;
}

interface LocationInfo {
  city: string | null;
  region: string | null;
  address: string | null;
}

interface PublicSocio {
  id: number;
  fullName: string;
  firstName: string | null;
  lastName: string | null;
  avatar: string | null;
  role: string | null;
  status: string | null;
  joinedAt: string | null;
  yearsActive: number | null;
  contact: ContactInfo;
  location: LocationInfo;
  rut: string | null;
  birthdate: string | null;
  privacy: PrivacyFlags;
}

const formatDate = (iso: string | null) => {
  if (!iso) return null;
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toLocaleDateString('es-CL', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

const computeYearsActive = (joinedAt: string | null) => {
  if (!joinedAt) return null;
  const joined = new Date(joinedAt);
  if (Number.isNaN(joined.getTime())) return null;

  const now = new Date();
  let years = now.getFullYear() - joined.getFullYear();
  const monthDiff = now.getMonth() - joined.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < joined.getDate())) {
    years -= 1;
  }
  return years >= 0 ? years : 0;
};

// Local Error Boundary to catch render errors and show a friendly message
class LocalErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean; error?: any }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, info: any) {
    console.error('[LocalErrorBoundary] Error caught:', error, info);
  }

  render() {
    if ((this.state as any).hasError) {
      return (
        <div className="min-h-[60vh] bg-soft-gradient-light flex items-center justify-center px-4">
          <div className="max-w-lg bg-white rounded-2xl shadow-lg p-8 text-center">
            <ShieldAlert className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-semibold text-gray-900 mb-2">Ocurrió un error</h1>
            <p className="text-gray-600 mb-6">Estamos trabajando para resolverlo. Intenta recargar la página.</p>
            <Link to="/buscar" className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver a la búsqueda
            </Link>
          </div>
        </div>
      );
    }
    return this.props.children as any;
  }
}

const PublicSocioPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [socio, setSocio] = useState<PublicSocio | null>(null);

  useEffect(() => {
    const fetchSocio = async () => {
      if (!id) {
        setError('Identificador de socio no válido.');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/socios/${id}`);
        if (!response.ok) {
          const fallbackMessage = response.status === 404 ? 'No encontramos a este socio.' : 'Tuvimos un problema al cargar la información.';
          setError(fallbackMessage);
          setLoading(false);
          return;
        }

        const payload: PublicSocioResponse = await response.json();
        if (!payload.success || !payload.data) {
          setError(payload.error || 'No pudimos obtener la información del socio.');
          setLoading(false);
          return;
        }

        setSocio(payload.data);
      } catch (err) {
        console.error('[PublicSocioPage] Error loading socio:', err);
        setError('No pudimos conectar con el servidor en este momento.');
      } finally {
        setLoading(false);
      }
    };

    fetchSocio();
  }, [id]);

  const displayYearsActive = useMemo(() => {
    if (!socio) return null;
    if (typeof socio.yearsActive === 'number') return socio.yearsActive;
    return computeYearsActive(socio.joinedAt);
  }, [socio]);

  if (loading) {
    return (
      <div className="min-h-[60vh] bg-soft-gradient-light flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-lg px-8 py-6 text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-red-600 border-t-transparent"></div>
          <p className="text-gray-600">Cargando perfil público…</p>
        </div>
      </div>
    );
  }

  if (error || !socio) {
    return (
      <div className="min-h-[60vh] bg-soft-gradient-light flex items-center justify-center px-4">
        <div className="max-w-lg bg-white rounded-2xl shadow-lg p-8 text-center">
          <ShieldAlert className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">Perfil no disponible</h1>
          <p className="text-gray-600 mb-6">{error || 'No pudimos mostrar la información solicitada.'}</p>
          <Link to="/buscar" className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a la búsqueda
          </Link>
        </div>
      </div>
    );
  }

  const contactVisible = Boolean(socio?.contact?.email || socio?.contact?.phone);
  const locationVisible = Boolean(socio?.location?.city || socio?.location?.region || socio?.location?.address);
  const formattedJoinDate = formatDate(socio?.joinedAt ?? null);
  const formattedBirthdate = formatDate(socio?.birthdate ?? null);

  const initials = useMemo(() => {
    if (!socio?.fullName) return 'A';
    const parts = socio.fullName.split(' ').filter(Boolean);
    if (parts.length === 0) return 'A';
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(0)}`.toUpperCase();
  }, [socio?.fullName]);

  return (
    <LocalErrorBoundary>
      <div className="bg-soft-gradient-light min-h-[60vh] py-10 px-4">
        <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Link to="/buscar" className="inline-flex items-center text-sm text-red-600 hover:text-red-700 font-medium">
            <ArrowLeft className="h-4 w-4 mr-2" /> Volver a resultados
          </Link>
        </div>

        <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
          <div className="relative h-32 bg-gradient-to-r from-red-600/80 via-orange-500/80 to-amber-400/80">
            <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 transform">
              {socio.avatar ? (
                <img
                  src={socio.avatar}
                  alt={socio.fullName}
                  className="h-24 w-24 rounded-full border-4 border-white object-cover shadow-lg"
                />
              ) : (
                <div className="h-24 w-24 rounded-full border-4 border-white bg-red-100 text-red-600 flex items-center justify-center text-3xl font-semibold shadow-lg">
                  {initials}
                </div>
              )}
            </div>
          </div>

          <div className="pt-16 pb-10 px-6 sm:px-10 space-y-8">
            <header className="text-center space-y-3">
              <div className="inline-flex items-center gap-2 text-xs uppercase tracking-wide text-red-600 bg-red-50 rounded-full px-3 py-1">
                <UserCircle className="h-4 w-4" />
                Perfil público de socio
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">{socio?.fullName}</h1>

              <div className="flex flex-wrap justify-center gap-3 text-sm text-gray-600">
                {socio?.status && (
                  <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-700 px-3 py-1 rounded-full">
                    Estado: <span className="font-semibold capitalize">{socio.status}</span>
                  </span>
                )}
                {formattedJoinDate && (
                  <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-700 px-3 py-1 rounded-full">
                    <Calendar className="h-4 w-4" /> Socio desde {formattedJoinDate}
                  </span>
                )}
                {typeof displayYearsActive === 'number' && displayYearsActive >= 0 && (
                  <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-700 px-3 py-1 rounded-full">
                    {displayYearsActive === 0 ? 'Menos de 1 año en ACA' : `${displayYearsActive} año${displayYearsActive !== 1 ? 's' : ''} en ACA`}
                  </span>
                )}
              </div>
            </header>

            <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4 p-5 rounded-2xl border border-gray-100 bg-gray-50/60">
                <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Contacto</h2>
                {contactVisible ? (
                  <ul className="space-y-3 text-sm text-gray-700">
                      {socio?.contact?.email && (
                      <li className="flex items-center gap-3">
                        <Mail className="h-4 w-4 text-red-500" />
                        <a href={`mailto:${socio.contact.email}`} className="hover:text-red-600 transition-colors">
                            {socio.contact.email}
                        </a>
                      </li>
                    )}
                      {socio?.contact?.phone && (
                      <li className="flex items-center gap-3">
                        <Phone className="h-4 w-4 text-red-500" />
                        <a href={`tel:${socio.contact.phone}`} className="hover:text-red-600 transition-colors">
                            {socio.contact.phone}
                        </a>
                      </li>
                    )}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-600">
                    Este socio decidió reservar su información de contacto.
                  </p>
                )}
              </div>

              <div className="space-y-4 p-5 rounded-2xl border border-gray-100 bg-gray-50/60">
                <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Ubicación y detalles</h2>
                {locationVisible ? (
                  <ul className="space-y-3 text-sm text-gray-700">
                    {(socio?.location?.city || socio?.location?.region) && (
                      <li className="flex items-center gap-3">
                        <MapPin className="h-4 w-4 text-red-500" />
                        <span>
                          {[socio?.location?.city, socio?.location?.region].filter(Boolean).join(', ')}
                        </span>
                      </li>
                    )}
                    {socio?.location?.address && (
                      <li className="flex items-center gap-3">
                        <Home className="h-4 w-4 text-red-500" />
                        <span>{socio.location.address}</span>
                      </li>
                    )}
                    {socio?.birthdate && (
                      <li className="flex items-center gap-3">
                        <Cake className="h-4 w-4 text-red-500" />
                        <span>{formattedBirthdate}</span>
                      </li>
                    )}
                    {socio?.rut && (
                      <li className="flex items-center gap-3">
                        <Fingerprint className="h-4 w-4 text-red-500" />
                        <span>{socio.rut}</span>
                      </li>
                    )}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-600">
                    Este socio mantiene en privado su ubicación y datos personales.
                  </p>
                )}
              </div>
            </section>

            <footer className="pt-4 border-t border-gray-100 text-center text-sm text-gray-500">
              {socio?.privacy && (socio.privacy.showEmail || socio.privacy.showPhone || socio.privacy.showAddress || socio.privacy.showRut || socio.privacy.showBirthdate) ? (
                <p>
                  Los datos mostrados respetan la configuración de privacidad establecida por el socio en su perfil.
                </p>
              ) : (
                <p>
                  Este perfil público muestra información limitada. Para contactar a este socio, utiliza los canales oficiales de ACA Chile.
                </p>
              )}
            </footer>
          </div>
        </div>
      </div>
    </LocalErrorBoundary>
  );
};

export default PublicSocioPage;
