import React, { useState } from 'react';
import { 
  FileText, 
  CreditCard, 
  Landmark, 
  FileSpreadsheet, 
  BookOpen, 
  Video, 
  Twitter, 
  Youtube, 
  Facebook, 
  Music,
  Globe,
  Instagram,
  ExternalLink,
  Users,
  X,
  Phone
} from 'lucide-react';
import logoFallback from '@/assets/aca-logo.svg';

const DEFAULT_HEADER_LOGO = 'https://pub-9edd01c5f73442228a840ca5c8fca38a.r2.dev/home/img-1762489301673-11k166.jpg';

interface LinkItem {
  title: string;
  url: string;
  icon: React.ReactNode;
  description?: string;
}

interface DirectorInfo {
  name: string;
  role: string;
  phone: string;
}

const SociosAcaLinks: React.FC = () => {
  const envLogoUrl = (import.meta.env.VITE_HEADER_LOGO_URL as string | undefined)?.trim();
  const [logoSrc, setLogoSrc] = useState<string>(envLogoUrl || DEFAULT_HEADER_LOGO);
  const [showDirectorio, setShowDirectorio] = useState(false);

  const directores: DirectorInfo[] = [
    { name: 'Vianca Galdames', role: 'Presidenta', phone: '+56934520459' },
    { name: 'Alejandro Bakit', role: 'Director Ejecutivo', phone: '+56964342200' },
    { name: 'Daniel Toloza', role: 'Tesorería', phone: '+56982278485' },
    { name: 'Carolina Carriel', role: 'Directora de Torneos y Competencias', phone: '+56955347961' },
    { name: 'María José Gallegos', role: 'Directora de Proyectos', phone: '+56954881808' },
    { name: 'Paulina Sandoval', role: 'Directora de Comunicaciones', phone: '+56950486915' }
  ];

  const links: LinkItem[] = [
    {
      title: 'Archivos Oficiales',
      url: 'https://drive.google.com/drive/folders/1ze6yNbu3PMrpzgPkpC5nWqXDeNzE7u6o?usp=sharing',
      icon: <FileText className="h-6 w-6" />,
      description: 'Documentos y archivos oficiales de ACA'
    },
    {
      title: 'Link de Pago Transbank - Webpay CL',
      url: 'https://www.webpay.cl/company/61599?utm_source=transbank&utm_medium=portal3.0&utm_campaign=link_portal',
      icon: <CreditCard className="h-6 w-6" />,
      description: 'Realiza pagos de membresía y cuotas'
    },
    {
      title: 'Datos Bancarios',
      url: 'https://drive.google.com/file/d/1TJy_NyMf49uWW8HoCkHYQzVH95zcWJ82/view?usp=sharing',
      icon: <Landmark className="h-6 w-6" />,
      description: 'Información bancaria para transferencias'
    },
    {
      title: 'Convenios 2025',
      url: 'https://docs.google.com/spreadsheets/d/1z3poXdUG6DuNb57kK9Qpcmm8jVtz8moY-HhRqL8NiQg/edit?gid=0#gid=0',
      icon: <FileSpreadsheet className="h-6 w-6" />,
      description: 'Descuentos y convenios disponibles para socios'
    },
    {
      title: 'Libros de Cocina',
      url: 'https://drive.google.com/drive/folders/16qUvneC58R57EKqvoqdLLUojJT0-0JCl?usp=sharing',
      icon: <BookOpen className="h-6 w-6" />,
      description: 'Biblioteca de recetas y técnicas'
    },
    {
      title: 'Salón Zoom ACA',
      url: 'https://zoom.us/j/5690446271',
      icon: <Video className="h-6 w-6" />,
      description: 'Reuniones virtuales y talleres online'
    },
    {
      title: 'Instagram ACA - Síguenos',
      url: 'https://www.instagram.com/aca.chile',
      icon: <Instagram className="h-6 w-6" />,
      description: '@aca.chile'
    },
    {
      title: 'Twitter - Síguenos',
      url: 'https://twitter.com/acachileoficial?t=_k93OlH3EF5wXnQyvzPiXQ&s=08',
      icon: <Twitter className="h-6 w-6" />,
      description: '@acachileoficial'
    },
    {
      title: 'ACA TV - Suscríbete',
      url: 'https://www.youtube.com/@acatvchile',
      icon: <Youtube className="h-6 w-6" />,
      description: 'Canal oficial en YouTube'
    },
    {
      title: 'Facebook - Únete',
      url: 'https://www.facebook.com/groups/136196551792156/',
      icon: <Facebook className="h-6 w-6" />,
      description: 'Grupo oficial en Facebook'
    },
    {
      title: 'TikTok - Síguenos',
      url: 'https://www.tiktok.com/@acachile.com',
      icon: (
        <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z"/>
        </svg>
      ),
      description: '@acachile.com'
    },
    {
      title: 'ACA en Spotify',
      url: 'https://open.spotify.com/playlist/6gLbtFTXSt0rGP248iUccW?si=3e3546aa43c94ee4',
      icon: <Music className="h-6 w-6" />,
      description: 'Playlist oficial de ACA'
    },
    {
      title: 'Nuestra Página',
      url: 'https://www.acachile.com/',
      icon: <Globe className="h-6 w-6" />,
      description: 'Sitio web oficial'
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-orange-50 to-primary-100">
      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-primary-600 via-primary-700 to-orange-600 py-12 shadow-xl">
        <div className="absolute inset-0 bg-[url('/fire-pattern.svg')] opacity-10"></div>
        <div className="relative mx-auto max-w-3xl px-4 text-center">
          <div className="mb-6 flex justify-center">
            <div className="rounded-3xl bg-white/95 backdrop-blur-sm p-6 shadow-2xl">
              <img
                src={logoSrc}
                alt="ACA Chile"
                className="w-20 h-20 sm:w-24 sm:h-24 object-contain"
                onError={() => setLogoSrc(logoFallback)}
              />
            </div>
          </div>
          <h1 className="mb-2 text-4xl font-bold text-white sm:text-5xl">
            @aca.chile
          </h1>
          <p className="text-lg text-white/90 font-medium">
            Links de Interés para Socios ACA
          </p>
        </div>
      </div>

      {/* Links Container */}
      <div className="mx-auto max-w-3xl px-4 py-12">
        <div className="space-y-4">
          {/* Botón Directorio */}
          <button
            onClick={() => setShowDirectorio(true)}
            className="group w-full block transform rounded-2xl border-2 border-primary-400 bg-gradient-to-br from-primary-500 to-orange-500 p-6 shadow-lg transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl"
          >
            <div className="flex items-center gap-4">
              {/* Icon */}
              <div className="flex-shrink-0 rounded-xl bg-white/20 backdrop-blur-sm p-3 text-white shadow-md transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6">
                <Users className="h-6 w-6" />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 text-left">
                <h3 className="text-lg font-bold text-white">
                  Directorio
                </h3>
                <p className="text-sm text-white/90 mt-1">
                  Información de contacto del directorio de ACA
                </p>
              </div>

              {/* Arrow */}
              <div className="flex-shrink-0 text-white/80">
                <Users className="h-5 w-5" />
              </div>
            </div>
          </button>

          {/* Enlaces normales */}
          {links.map((link, index) => (
            <a
              key={index}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group block transform rounded-2xl border-2 border-white bg-white/80 backdrop-blur-sm p-6 shadow-lg transition-all duration-300 hover:scale-[1.02] hover:border-primary-300 hover:shadow-2xl hover:bg-white"
            >
              <div className="flex items-center gap-4">
                {/* Icon */}
                <div className="flex-shrink-0 rounded-xl bg-gradient-to-br from-primary-500 to-orange-500 p-3 text-white shadow-md transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6">
                  {link.icon}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-bold text-neutral-900 group-hover:text-primary-600 transition-colors">
                    {link.title}
                  </h3>
                  {link.description && (
                    <p className="text-sm text-neutral-600 mt-1">
                      {link.description}
                    </p>
                  )}
                </div>

                {/* Arrow */}
                <div className="flex-shrink-0 text-neutral-400 transition-all duration-300 group-hover:text-primary-600 group-hover:translate-x-1">
                  <ExternalLink className="h-5 w-5" />
                </div>
              </div>
            </a>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-12 text-center">
          <p className="text-sm text-neutral-600">
            Enlaces exclusivos para socios de la Asociación Chilena del Asado
          </p>
          <div className="mt-6 flex justify-center gap-2">
            <div className="h-2 w-2 rounded-full bg-primary-400 animate-pulse"></div>
            <div className="h-2 w-2 rounded-full bg-orange-400 animate-pulse delay-75"></div>
            <div className="h-2 w-2 rounded-full bg-primary-400 animate-pulse delay-150"></div>
          </div>
        </div>
      </div>

      {/* Modal Directorio */}
      {showDirectorio && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={() => setShowDirectorio(false)}
        >
          <div 
            className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header del Modal */}
            <div className="sticky top-0 bg-gradient-to-r from-primary-600 to-orange-600 text-white p-6 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-white/20 backdrop-blur-sm p-2 rounded-lg">
                    <Users className="h-6 w-6" />
                  </div>
                  <h2 className="text-2xl font-bold">Directorio ACA</h2>
                </div>
                <button
                  onClick={() => setShowDirectorio(false)}
                  className="bg-white/20 hover:bg-white/30 rounded-lg p-2 transition-colors"
                  aria-label="Cerrar"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            {/* Contenido del Modal */}
            <div className="p-6">
              <p className="text-neutral-600 mb-6 text-center">
                Información de contacto del directorio de la Asociación Chilena del Asado
              </p>
              
              <div className="space-y-4">
                {directores.map((director, index) => (
                  <div
                    key={index}
                    className="border-2 border-neutral-200 rounded-xl p-4 hover:border-primary-300 hover:shadow-md transition-all"
                  >
                    <h3 className="font-bold text-lg text-neutral-900 mb-1">
                      {director.name}
                    </h3>
                    <p className="text-sm text-primary-600 font-medium mb-2">
                      {director.role}
                    </p>
                    <a
                      href={`tel:${director.phone}`}
                      className="flex items-center gap-2 text-neutral-700 hover:text-primary-600 transition-colors"
                    >
                      <Phone className="h-4 w-4" />
                      <span className="font-mono text-sm">{director.phone}</span>
                    </a>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer del Modal */}
            <div className="border-t border-neutral-200 p-4 rounded-b-2xl bg-neutral-50">
              <button
                onClick={() => setShowDirectorio(false)}
                className="w-full py-3 px-4 bg-gradient-to-r from-primary-600 to-orange-600 text-white font-medium rounded-xl hover:from-primary-700 hover:to-orange-700 transition-all"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SociosAcaLinks;
