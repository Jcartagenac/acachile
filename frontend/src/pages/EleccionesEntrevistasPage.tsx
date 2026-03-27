import React, { useEffect, useMemo, useRef, useState } from 'react';
import { SEOHelmet } from '../components/SEOHelmet';
import { Container } from '../components/layout/Container';
import { FileText, Heart, PlayCircle, ScrollText, Users } from 'lucide-react';

// Entrevistas originales
import danielInterview from '../content/elecciones/01-daniel-tolosa-limpio.txt?raw';
import danielSummary from '../content/elecciones/01-daniel-tolosa-resumen.txt?raw';
import jorgeInterview from '../content/elecciones/02-jorge-silva-limpio.txt?raw';
import jorgeSummary from '../content/elecciones/02-jorge-silva-resumen.txt?raw';
import karinaInterview from '../content/elecciones/03-karina-norero-limpio.txt?raw';
import karinaSummary from '../content/elecciones/03-karina-norero-resumen.txt?raw';
import bloqueEticaInterview from '../content/elecciones/04-bloque-etica-limpio.txt?raw';
import bloqueEticaSummary from '../content/elecciones/04-bloque-etica-resumen.txt?raw';
import barbaraInterview from '../content/elecciones/05-barbara-inostroza-limpio.txt?raw';
import barbaraSummary from '../content/elecciones/05-barbara-inostroza-resumen.txt?raw';
import pauliInterview from '../content/elecciones/06-paulina-sandoval-limpio.txt?raw';
import pauliSummary from '../content/elecciones/06-paulina-sandoval-resumen.txt?raw';
import eduardoInterview from '../content/elecciones/07-eduardo-elgueta-limpio.txt?raw';
import eduardoSummary from '../content/elecciones/07-eduardo-elgueta-resumen.txt?raw';
import oscarInterview from '../content/elecciones/08-oscar-cerda-limpio.txt?raw';
import oscarSummary from '../content/elecciones/08-oscar-cerda-resumen.txt?raw';

// Entrevistas segunda tanda
import fernandoSepulvedaInterview from '../content/elecciones/fernando-sepulveda-limpio.txt?raw';
import fernandoSepulvedaSummary from '../content/elecciones/fernando-sepulveda-resumen.txt?raw';
import juanPabloGaeteInterview from '../content/elecciones/juan-pablo-gaete-limpio.txt?raw';
import juanPabloGaeteSummary from '../content/elecciones/juan-pablo-gaete-resumen.txt?raw';
import pabloVerdugoInterview from '../content/elecciones/pablo-verdugo-limpio.txt?raw';
import pabloVerdugoSummary from '../content/elecciones/pablo-verdugo-resumen.txt?raw';
import antonioEscobarInterview from '../content/elecciones/antonio-escobar-limpio.txt?raw';
import antonioEscobarSummary from '../content/elecciones/antonio-escobar-resumen.txt?raw';
import javierBianchiInterview from '../content/elecciones/javier-bianchi-limpio.txt?raw';
import javierBianchiSummary from '../content/elecciones/javier-bianchi-resumen.txt?raw';
import pepeVivarInterview from '../content/elecciones/pepe-vivar-limpio.txt?raw';
import pepeVivarSummary from '../content/elecciones/pepe-vivar-resumen.txt?raw';

type ViewMode = 'entrevista' | 'video' | 'resumen';

type CandidateInterview = {
  id: string;
  name: string;
  role: string;
  interview: string;
  summary: string;
  videoUrl: string;
};

type ParsedLine =
  | { type: 'speaker'; speaker: string; timestamp?: string; text: string }
  | { type: 'paragraph'; text: string }
  | { type: 'heading'; text: string };

const VIDEO_BASE_URL = 'https://images.acachile.com/videos/elecciones';

const interviews: CandidateInterview[] = [
  {
    id: 'daniel-tolosa',
    name: 'Daniel Tolosa',
    role: 'Candidato a Director de Proyectos',
    interview: danielInterview,
    summary: danielSummary,
    videoUrl: `${VIDEO_BASE_URL}/01-daniel-tolosa.mp4`,
  },
  {
    id: 'jorge-silva',
    name: 'Jorge Silva',
    role: 'Postulante',
    interview: jorgeInterview,
    summary: jorgeSummary,
    videoUrl: `${VIDEO_BASE_URL}/02-jorge-silva.mp4`,
  },
  {
    id: 'karina-norero',
    name: 'Karina Norero',
    role: 'Postulante a directora de torneos',
    interview: karinaInterview,
    summary: karinaSummary,
    videoUrl: `${VIDEO_BASE_URL}/03-karina-norero.mp4`,
  },
  {
    id: 'barbara-inostroza',
    name: 'Bárbara Inostroza',
    role: 'Postulante a director de comunicaciones',
    interview: barbaraInterview,
    summary: barbaraSummary,
    videoUrl: `${VIDEO_BASE_URL}/05-barbara-inostroza.mp4`,
  },
  {
    id: 'pauli',
    name: 'Paulina Sandoval',
    role: 'Postulante a director de comunicaciones',
    interview: pauliInterview,
    summary: pauliSummary,
    videoUrl: `${VIDEO_BASE_URL}/06-paulina-sandoval.mp4`,
  },
  {
    id: 'eduardo-elgueta',
    name: 'Eduardo Elgueta',
    role: 'Postulante',
    interview: eduardoInterview,
    summary: eduardoSummary,
    videoUrl: `${VIDEO_BASE_URL}/07-eduardo-elgueta.mp4`,
  },
  {
    id: 'oscar-cerda',
    name: 'Oscar Cerda',
    role: 'Postulante',
    interview: oscarInterview,
    summary: oscarSummary,
    videoUrl: `${VIDEO_BASE_URL}/08-oscar-cerda.mp4`,
  },
  {
    id: 'bloque-etica',
    name: 'Bloque Ética',
    role: 'Postulantes al Comité de Ética',
    interview: bloqueEticaInterview,
    summary: bloqueEticaSummary,
    videoUrl: `${VIDEO_BASE_URL}/04-bloque-etica.mp4`,
  },
  {
    id: 'fernando-sepulveda',
    name: 'Fernando Sepúlveda',
    role: 'Candidato a Presidente',
    interview: fernandoSepulvedaInterview,
    summary: fernandoSepulvedaSummary,
    videoUrl: `${VIDEO_BASE_URL}/fernando-sepulveda.mp4`,
  },
  {
    id: 'juan-pablo-gaete',
    name: 'Juan Pablo Gaete',
    role: 'Candidato a Presidente',
    interview: juanPabloGaeteInterview,
    summary: juanPabloGaeteSummary,
    videoUrl: `${VIDEO_BASE_URL}/juan-pablo-gaete.mp4`,
  },
  {
    id: 'pablo-verdugo',
    name: 'Pablo Verdugo',
    role: 'Candidato a Director de Proyectos',
    interview: pabloVerdugoInterview,
    summary: pabloVerdugoSummary,
    videoUrl: `${VIDEO_BASE_URL}/pablo-verdugo.mp4`,
  },
  {
    id: 'antonio-escobar',
    name: 'Antonio Escobar',
    role: 'Candidato a Director de Proyectos',
    interview: antonioEscobarInterview,
    summary: antonioEscobarSummary,
    videoUrl: `${VIDEO_BASE_URL}/antonio-escobar.mp4`,
  },
  {
    id: 'javier-bianchi',
    name: 'Javier Bianchi',
    role: 'Candidato a Comité Revisor de Cuentas',
    interview: javierBianchiInterview,
    summary: javierBianchiSummary,
    videoUrl: `${VIDEO_BASE_URL}/javier-bianchi.mp4`,
  },
  {
    id: 'pepe-vivar',
    name: 'Pepe Vivar',
    role: 'Candidato a Comité Revisor de Cuentas',
    interview: pepeVivarInterview,
    summary: pepeVivarSummary,
    videoUrl: `${VIDEO_BASE_URL}/pepe-vivar.mp4`,
  },
];

const introText = 'Reunimos en un solo lugar las entrevistas y resúmenes de candidaturas de cara a la elección de directorio del día 28. La idea es facilitar una revisión directa, simple y comparable, respetando el contexto de cada conversación y manteniendo una lectura rápida para quienes quieran llegar informados a la votación.';

// ... (el resto del archivo es igual y no necesita cambios)
