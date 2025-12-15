import { GoogleGenAI, Type, Schema } from "@google/genai";
import { Question, QuestionType, NotationType, Difficulty } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Optimized schema
const RESPONSE_SCHEMA: Schema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      id: { type: Type.INTEGER },
      type: { type: Type.STRING, enum: ['FORMULA_TO_NAME', 'NAME_TO_FORMULA'] },
      prompt: { type: Type.STRING },
      targetNotation: { type: Type.STRING, enum: ['Sistemática', 'Tradicional', 'Stock', 'Fórmula', 'Ninguna', 'Cualquiera'] },
      correctAnswer: { type: Type.STRING },
      acceptedAnswers: { 
        type: Type.ARRAY, 
        items: { type: Type.STRING },
        description: "Valid IUPAC names"
      }
    },
    required: ['id', 'type', 'prompt', 'targetNotation', 'correctAnswer', 'acceptedAnswers']
  }
};

const getDifficultyRules = (difficulty: Difficulty): string => {
  // Las reglas específicas de cada nivel
  switch (difficulty) {
    case 'easy':
      return `NIVEL: BINARIOS (Alta Variedad).
      - TIPOS: Óxidos, Hidruros, Sales Binarias.
      - PROMPTS: Mezcla Sistemática, Stock y Tradicional.`;
    case 'medium':
      return `NIVEL: TERNARIOS.
      - TIPOS: Hidróxidos, Oxoácidos (Simples/Polihidratados), Oxisales Neutras.`;
    case 'hard':
      return `NIVEL: AVANZADO.
      - TIPOS: Sales Ácidas, Sales Dobles, Iones.`;
    case 'mixed':
    default:
      return `NIVEL: MIXTO GLOBAL.
      - DISTRIBUCIÓN: 30% Binarios, 40% Ternarios, 30% Iones/Sales Ácidas.`;
  }
};

export const generateExam = async (
  difficulty: Difficulty, 
  count: number = 30, 
  avoidPrompts: string[] = [], 
  mistakeFocus: string = ""
): Promise<Question[]> => {
  const model = "gemini-2.5-flash"; 
  
  // Limitar la lista de 'avoid' enviada a la AI para no saturar el contexto
  const recentAvoid = avoidPrompts.slice(-50).join(', ');

  const instructions = `
    Genera ${count} preguntas de química inorgánica en JSON.
    ${getDifficultyRules(difficulty)}

    REGLAS DE RESPUESTA (IMPORTANTE):
    1. Si la pregunta es FORMULA_TO_NAME (Dada la fórmula, pedir nombre):
       - 'acceptedAnswers' DEBE incluir TODAS las nomenclaturas válidas (Stock, Sistemática, Tradicional).
       - NO restringir la respuesta a una sola nomenclatura.
       - 'targetNotation' puede ser 'Cualquiera'.
    2. Si la pregunta es NAME_TO_FORMULA (Dado nombre, pedir fórmula):
       - La respuesta es la fórmula correcta.

    CONTEXTO:
    ${recentAvoid ? `EVITAR ESTRICTAMENTE generar estos compuestos: ${recentAvoid}.` : ''}
    ${mistakeFocus ? `FOCO: Incluir 3 similares a: ${mistakeFocus}.` : ''}

    REGLAS GENERALES:
    1. LANTÁNIDOS/ACTÍNIDOS PROHIBIDOS.
    2. VARIAR elementos.
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: "Generar JSON.",
      config: {
        systemInstruction: instructions,
        responseMimeType: "application/json",
        responseSchema: RESPONSE_SCHEMA,
        temperature: 0.8,
        topK: 40,
      }
    });

    if (!response.text) throw new Error("Empty response");
    
    const rawQuestions = JSON.parse(response.text);
    
    return rawQuestions.map((q: any) => ({
      ...q,
      id: Date.now() + Math.floor(Math.random() * 10000), 
      type: q.type as QuestionType,
      targetNotation: q.targetNotation as NotationType,
      explanation: undefined 
    }));

  } catch (error) {
    console.error("Exam Gen Error:", error);
    throw error;
  }
};

export const getStudyAdvice = async (mistakes: Question[]): Promise<string> => {
  if (mistakes.length === 0) return "¡Sigue así!";

  const examples = mistakes.slice(0, 5).map(m => m.prompt).join(', ');

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `El alumno falló en: ${examples}. Dame un consejo de estudio breve (máx 15 palabras).`,
      config: { temperature: 0.7 }
    });
    return response.text || "Repasa las valencias y formulación.";
  } catch (e) {
    return "Revisa las reglas de nomenclatura.";
  }
};

export const getLauraFeedback = async (question: Question, userAnswer: string, isCorrect: boolean): Promise<string> => {
  if (isCorrect) return "¡Correcto! Muy bien.";

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Pregunta: ${question.prompt}. Correcto: ${question.correctAnswer}. Usuario: "${userAnswer}". Explica el error en 1 frase muy breve.`,
      config: { temperature: 0.5 }
    });
    return response.text || `Lo siento, era ${question.correctAnswer}.`;
  } catch (e) {
    return `La solución es ${question.correctAnswer}.`;
  }
};
