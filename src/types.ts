export interface Question {
  id: string;
  text: string;
  description?: string;
  options: Option[];
  category: 'negocio' | 'comercial' | 'operativa' | 'ia';
}

export interface Option {
  label: string;
  value: string;
  scoreIA: number;
  scoreOp: number;
}

export interface DiagnosticResults {
  resumen_ejecutivo: string;
  madurez_ia_nivel: number;
  madurez_ia_nombre: string;
  madurez_operativa_nivel: number;
  madurez_operativa_nombre: string;
  diagnostico_principal: string;
  cuellos_de_botella: string[];
  oportunidades_prioritarias: string[];
  prioridad_recomendada: string;
  preparacion_para_evento: string;
  siguiente_paso_sugerido: string;
  viabilidad_estrategia_2026_nivel: 'alta' | 'media' | 'baja';
  viabilidad_estrategia_2026_explicacion: string;
  como_aprovechar_mejor_estrategia_2026: string;
  siguiente_paso_despues_del_evento: string;
}
