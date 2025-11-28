import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

interface SEOHelmetProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
}

export function SEOHelmet({ title, description, image, url }: SEOHelmetProps) {
  const location = useLocation();
  
  const baseUrl = 'https://acachile.com';
  const defaultTitle = 'ACA Chile - Asociación Chilena de Asadores';
  const defaultDescription = 'Asociación Chilena de Asadores A.G. - Comunidad de asadores profesionales y aficionados en Chile. Eventos, campeonatos y más.';
  const defaultImage = 'https://pub-9edd01c5f73442228a840ca5c8fca38a.r2.dev/home/img-1762489301673-11k166.jpg';
  
  const finalTitle = title || defaultTitle;
  const finalUrl = url || `${baseUrl}${location.pathname}`;
  // Agregar URL al final de la descripción para WhatsApp móvil
  const baseDescription = description || defaultDescription;
  const finalDescription = `${baseDescription} 🔗 ${finalUrl}`;
  const finalImage = image || defaultImage;

  useEffect(() => {
    // Update document title
    document.title = finalTitle;

    // Update or create meta tags
    const updateMetaTag = (property: string, content: string, isName = false) => {
      const attribute = isName ? 'name' : 'property';
      let element = document.querySelector(`meta[${attribute}="${property}"]`);
      
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attribute, property);
        document.head.appendChild(element);
      }
      
      element.setAttribute('content', content);
    };

    // Primary Meta Tags
    updateMetaTag('title', finalTitle, true);
    updateMetaTag('description', finalDescription, true);

    // Open Graph / Facebook / WhatsApp
    updateMetaTag('og:type', 'website');
    updateMetaTag('og:url', finalUrl);
    updateMetaTag('og:title', finalTitle);
    updateMetaTag('og:description', finalDescription);
    updateMetaTag('og:image', finalImage);
    updateMetaTag('og:image:width', '1200');
    updateMetaTag('og:image:height', '630');
    updateMetaTag('og:image:alt', finalTitle);
    updateMetaTag('og:image:type', 'image/jpeg');
    updateMetaTag('og:site_name', 'ACA Chile');

    // Twitter
    updateMetaTag('twitter:card', 'summary_large_image');
    updateMetaTag('twitter:url', finalUrl);
    updateMetaTag('twitter:title', finalTitle);
    updateMetaTag('twitter:description', finalDescription);
    updateMetaTag('twitter:image', finalImage);

    // Canonical URL
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', finalUrl);
  }, [finalTitle, finalDescription, finalImage, finalUrl]);

  return null;
}
