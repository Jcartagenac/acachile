import React from 'react';
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
  ExternalLink
} from 'lucide-react';

interface LinkItem {
  title: string;
  url: string;
  icon: React.ReactNode;
  description?: string;
}

const SociosAcaLinks: React.FC = () => {
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
            <div className="rounded-full bg-white/20 p-6 backdrop-blur-sm">
              <div className="text-6xl">🔥</div>
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
    </div>
  );
};

export default SociosAcaLinks;
