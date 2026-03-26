import { Question } from './types';

export const QUESTIONS: Question[] = [
  {
    id: 'tipo_negocio',
    text: '¿Cuál es el tipo de tu negocio?',
    category: 'negocio',
    options: [
      { label: 'Marca Personal / Profesional Independiente', value: 'personal', scoreIA: 0, scoreOp: 0 },
      { label: 'Servicios B2B (Consultoría, Agencia, etc.)', value: 'b2b', scoreIA: 0, scoreOp: 0 },
      { label: 'Servicios B2C (Clínica, Educación, etc.)', value: 'b2c', scoreIA: 0, scoreOp: 0 },
      { label: 'E-commerce / Venta de Productos', value: 'ecommerce', scoreIA: 0, scoreOp: 0 },
      { label: 'Otro', value: 'otro', scoreIA: 0, scoreOp: 0 },
    ],
  },
  {
    id: 'tamano_negocio',
    text: '¿Cuál es el tamaño actual de tu equipo?',
    category: 'negocio',
    options: [
      { label: 'Solo yo (Solopreneur)', value: 'solo', scoreIA: 0, scoreOp: 1 },
      { label: 'Equipo pequeño (2-5 personas)', value: 'small', scoreIA: 0, scoreOp: 2 },
      { label: 'Equipo mediano (6-20 personas)', value: 'medium', scoreIA: 0, scoreOp: 3 },
      { label: 'Empresa consolidada (20+ personas)', value: 'large', scoreIA: 0, scoreOp: 4 },
    ],
  },
  {
    id: 'conseguir_clientes',
    text: '¿Cómo consigues clientes principalmente?',
    category: 'comercial',
    options: [
      { label: 'Referidos y boca a boca (Orgánico)', value: 'referidos', scoreIA: 1, scoreOp: 1 },
      { label: 'Redes sociales (Contenido)', value: 'social', scoreIA: 2, scoreOp: 2 },
      { label: 'Publicidad pagada (Ads)', value: 'ads', scoreIA: 3, scoreOp: 3 },
      { label: 'Prospección activa (Outbound)', value: 'outbound', scoreIA: 3, scoreOp: 3 },
    ],
  },
  {
    id: 'seguimiento',
    text: '¿Cómo haces el seguimiento de tus prospectos?',
    category: 'comercial',
    options: [
      { label: 'No tengo un proceso claro, lo hago cuando puedo', value: 'ninguno', scoreIA: 1, scoreOp: 1 },
      { label: 'Manual (WhatsApp, Excel, Notas)', value: 'manual', scoreIA: 2, scoreOp: 2 },
      { label: 'Semi-automatizado (Email marketing, recordatorios)', value: 'semi', scoreIA: 3, scoreOp: 3 },
      { label: 'CRM con automatizaciones de ventas', value: 'crm', scoreIA: 4, scoreOp: 5 },
    ],
  },
  {
    id: 'uso_crm',
    text: '¿Utilizas actualmente un CRM?',
    category: 'operativa',
    options: [
      { label: 'No, no sé qué es o no lo necesito aún', value: 'no', scoreIA: 1, scoreOp: 1 },
      { label: 'Lo tengo pero casi no lo uso', value: 'poco', scoreIA: 2, scoreOp: 2 },
      { label: 'Sí, es el corazón de mi proceso comercial', value: 'si', scoreIA: 4, scoreOp: 5 },
    ],
  },
  {
    id: 'herramientas_digitales',
    text: '¿Qué herramientas utilizas para comunicarte y automatizar?',
    description: 'Selecciona la que mejor describa tu nivel actual.',
    category: 'operativa',
    options: [
      { label: 'WhatsApp personal y Email básico', value: 'basico', scoreIA: 1, scoreOp: 1 },
      { label: 'WhatsApp Business, Email Marketing y Formularios', value: 'intermedio', scoreIA: 2, scoreOp: 3 },
      { label: 'Integraciones (Zapier/Make), Chatbots y CRM', value: 'avanzado', scoreIA: 4, scoreOp: 5 },
    ],
  },
  {
    id: 'uso_ia',
    text: '¿Cómo utilizas la Inteligencia Artificial hoy?',
    category: 'ia',
    options: [
      { label: 'No la uso / Solo he escuchado de ella', value: 'nada', scoreIA: 1, scoreOp: 1 },
      { label: 'Uso ChatGPT ocasionalmente para textos', value: 'basico', scoreIA: 2, scoreOp: 2 },
      { label: 'Uso IA para contenido, análisis y algunas tareas', value: 'intermedio', scoreIA: 3, scoreOp: 3 },
      { label: 'Tengo procesos e integraciones con IA en mi flujo diario', value: 'avanzado', scoreIA: 5, scoreOp: 4 },
    ],
  },
  {
    id: 'tareas_tiempo',
    text: '¿Qué tareas te consumen más tiempo actualmente?',
    category: 'operativa',
    options: [
      { label: 'Administración y facturación', value: 'admin', scoreIA: 0, scoreOp: 0 },
      { label: 'Seguimiento de clientes y ventas', value: 'ventas', scoreIA: 0, scoreOp: 0 },
      { label: 'Creación de contenido y marketing', value: 'marketing', scoreIA: 0, scoreOp: 0 },
      { label: 'Operación y entrega del servicio', value: 'operacion', scoreIA: 0, scoreOp: 0 },
    ],
  },
  {
    id: 'cuello_botella',
    text: '¿Cuál es tu mayor cuello de botella?',
    category: 'operativa',
    options: [
      { label: 'Falta de prospectos calificados', value: 'leads', scoreIA: 0, scoreOp: 0 },
      { label: 'Desorden en el seguimiento y cierre', value: 'cierre', scoreIA: 0, scoreOp: 0 },
      { label: 'Mucho trabajo manual y operativo', value: 'manual', scoreIA: 0, scoreOp: 0 },
      { label: 'Dificultad para escalar sin contratar más gente', value: 'escalar', scoreIA: 0, scoreOp: 0 },
    ],
  },
  {
    id: 'prioridad_mejora',
    text: '¿Qué te gustaría mejorar primero?',
    category: 'negocio',
    options: [
      { label: 'Ordenar mi proceso comercial', value: 'orden', scoreIA: 0, scoreOp: 0 },
      { label: 'Automatizar tareas repetitivas', value: 'auto', scoreIA: 0, scoreOp: 0 },
      { label: 'Implementar IA para ser más eficiente', value: 'ia', scoreIA: 0, scoreOp: 0 },
      { label: 'Escalar mis ventas', value: 'ventas', scoreIA: 0, scoreOp: 0 },
    ],
  },
];
