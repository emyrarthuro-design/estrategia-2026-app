import { GoogleGenAI, Type } from "@google/genai";
import { DiagnosticResults, Question } from "../types";
import { QUESTIONS } from "../constants";
import { estrategia2026Context } from "../data/estrategia2026Context";
import { db, auth, OperationType, handleFirestoreError } from "../firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

const apiKey = process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({ apiKey });

export async function getGeminiDiagnostic(answers: Record<string, string>): Promise<DiagnosticResults> {
  // Format answers for the prompt
  const formattedAnswers = QUESTIONS.map(q => {
    const answerValue = answers[q.id];
    const option = q.options.find(o => o.value === answerValue);
    return `- ${q.text}: ${option?.label || 'No respondido'}`;
  }).join('\n');

  const systemInstruction = `
Eres un diagnosticador estratégico de negocios especializado en marketing, automatización, funnels, CRM e inteligencia artificial aplicada a procesos rentables para PYMEs y marcas personales.

Tu función es analizar respuestas de usuarios y devolver un diagnóstico claro, accionable y útil. No hablas como motivador vacío. Hablas como estratega.

Debes evaluar al usuario en dos ejes:
1. Madurez en uso de inteligencia artificial
2. Madurez operativa y comercial

Tu análisis debe tomar en cuenta:
- claridad del negocio
- captación de leads
- seguimiento comercial
- uso de CRM
- uso de WhatsApp, email, formularios y automatizaciones
- repetición de tareas
- cuellos de botella
- objetivos principales
- uso actual de IA

Debes clasificar a cada usuario del 1 al 5 en cada eje.

Además del diagnóstico general, debes evaluar la compatibilidad del usuario con EstrategIA 2026 como experiencia educativa.

Contexto de EstrategIA 2026:
${JSON.stringify(estrategia2026Context, null, 2)}

Debes devolver un JSON con:
- resumen_ejecutivo
- madurez_ia_nivel (1-5)
- madurez_ia_nombre
- madurez_operativa_nivel (1-5)
- madurez_operativa_nombre
- diagnostico_principal
- cuellos_de_botella (array de strings)
- oportunidades_prioritarias (array de strings)
- prioridad_recomendada
- preparacion_para_evento
- siguiente_paso_sugerido
- viabilidad_estrategia_2026_nivel: alta, media o baja
- viabilidad_estrategia_2026_explicacion: por qué el evento sí o no es recomendable para este usuario
- como_aprovechar_mejor_estrategia_2026: recomendación breve para llegar mejor preparado
- siguiente_paso_despues_del_evento: qué tipo de continuidad sería más lógica si asiste

Reglas de Viabilidad EstrategIA 2026 (Basadas en el contexto proporcionado):
- viabilidad_estrategia_2026_nivel: Evalúa si es "alta", "media" o "baja" cruzando las respuestas del usuario con las señales de viabilidad definidas en el contexto (altaViabilidad, viabilidadMedia, bajaViabilidad).
- viabilidad_estrategia_2026_explicacion: Justifica el nivel asignado basándote en los problemas que el evento ayuda a aclarar y el perfil del usuario. Sé honesto y directo.
- como_aprovechar_mejor_estrategia_2026: Sugiere una acción concreta basada en la sección "comoAprovecharlo" del contexto que sea relevante para la situación actual del usuario.
- siguiente_paso_despues_del_evento: Recomienda uno de los "siguientesPasosPosibles" del contexto que mejor encaje con la prioridad recomendada y el diagnóstico.

El lenguaje debe ser profesional, claro, concreto y orientado a negocio.
No uses jerga innecesaria.
No des consejos genéricos.
No recomiendes herramientas si antes no detectaste el problema.
Primero diagnostica, luego prioriza, luego recomienda.
  `;

  const prompt = `Analiza las siguientes respuestas del diagnóstico de negocio y genera el resultado estructurado:\n\n${formattedAnswers}`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            resumen_ejecutivo: { type: Type.STRING },
            madurez_ia_nivel: { type: Type.INTEGER },
            madurez_ia_nombre: { type: Type.STRING },
            madurez_operativa_nivel: { type: Type.INTEGER },
            madurez_operativa_nombre: { type: Type.STRING },
            diagnostico_principal: { type: Type.STRING },
            cuellos_de_botella: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            oportunidades_prioritarias: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            prioridad_recomendada: { type: Type.STRING },
            preparacion_para_evento: { type: Type.STRING },
            siguiente_paso_sugerido: { type: Type.STRING },
            viabilidad_estrategia_2026_nivel: { 
              type: Type.STRING,
              enum: ["alta", "media", "baja"]
            },
            viabilidad_estrategia_2026_explicacion: { type: Type.STRING },
            como_aprovechar_mejor_estrategia_2026: { type: Type.STRING },
            siguiente_paso_despues_del_evento: { type: Type.STRING }
          },
          required: [
            "resumen_ejecutivo",
            "madurez_ia_nivel",
            "madurez_ia_nombre",
            "madurez_operativa_nivel",
            "madurez_operativa_nombre",
            "diagnostico_principal",
            "cuellos_de_botella",
            "oportunidades_prioritarias",
            "prioridad_recomendada",
            "preparacion_para_evento",
            "siguiente_paso_sugerido",
            "viabilidad_estrategia_2026_nivel",
            "viabilidad_estrategia_2026_explicacion",
            "como_aprovechar_mejor_estrategia_2026",
            "siguiente_paso_despues_del_evento"
          ]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No se recibió respuesta de Gemini");
    
    const diagnosticResults = JSON.parse(text) as DiagnosticResults;

    // Persist to Firestore if user is authenticated
    if (auth.currentUser) {
      const path = 'diagnosticos_estrategia_2026';
      
      // Separate madurez levels from the rest of the results for the requested structure
      const { 
        madurez_ia_nivel, 
        madurez_ia_nombre, 
        madurez_operativa_nivel, 
        madurez_operativa_nombre, 
        ...restOfResults 
      } = diagnosticResults;

      const diagnosticData = {
        uid: auth.currentUser.uid,
        nombre: auth.currentUser.displayName || 'Usuario',
        email: auth.currentUser.email,
        timestamp: new Date().toISOString(),
        respuestas_del_formulario: answers,
        resultado_diagnostico: {
          ...restOfResults
        },
        // Keep current fields at top level for compatibility
        madurez_ia_nivel,
        madurez_ia_nombre,
        madurez_operativa_nivel,
        madurez_operativa_nombre,
        prioridad_recomendada: diagnosticResults.prioridad_recomendada,
        siguiente_paso_sugerido: diagnosticResults.siguiente_paso_sugerido,
        viabilidad_estrategia_2026_nivel: diagnosticResults.viabilidad_estrategia_2026_nivel,
        viabilidad_estrategia_2026_explicacion: diagnosticResults.viabilidad_estrategia_2026_explicacion,
        como_aprovechar_mejor_estrategia_2026: diagnosticResults.como_aprovechar_mejor_estrategia_2026,
        siguiente_paso_despues_del_evento: diagnosticResults.siguiente_paso_despues_del_evento
      };

      try {
        await addDoc(collection(db, path), {
          ...diagnosticData,
          timestamp: serverTimestamp() // Firestore native timestamp
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, path);
      }
    }
    
    return diagnosticResults;
  } catch (error) {
    console.error("Error calling Gemini or saving to Firestore:", error);
    throw error;
  }
}
