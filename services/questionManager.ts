import { generateExam } from './gemini';
import { Question, Difficulty } from '../types';

/**
 * QuestionManager (Singleton)
 * Maneja la generación en segundo plano y el historial de preguntas.
 */
class QuestionManager {
  private static instance: QuestionManager;
  
  // Buffers para almacenar preguntas precargadas (Max ~40 por dificultad)
  private buffers: Record<'easy' | 'medium' | 'hard', Question[]> = {
    easy: [],
    medium: [],
    hard: []
  };

  // Historial de prompts para evitar repeticiones (Últimos 200)
  private history: string[] = [];
  private readonly MAX_HISTORY = 200;
  private readonly BUFFER_SIZE = 40; // Aumentado a 40 por dificultad

  private isRefilling: boolean = false;

  private constructor() {
    // Iniciar precarga al instanciar (cuando carga la app)
    this.refillBuffers();
  }

  public static getInstance(): QuestionManager {
    if (!QuestionManager.instance) {
      QuestionManager.instance = new QuestionManager();
    }
    return QuestionManager.instance;
  }

  /**
   * Obtiene preguntas del buffer. Si no hay suficientes, pide a la API.
   */
  public async getQuestions(difficulty: Difficulty, count: number): Promise<Question[]> {
    const result: Question[] = [];

    if (difficulty === 'mixed') {
      // Para mixto, sacamos proporcionalmente
      const subCount = Math.ceil(count / 3);
      const qEasy = await this.popFromBuffer('easy', subCount);
      const qMed = await this.popFromBuffer('medium', subCount);
      const qHard = await this.popFromBuffer('hard', count - qEasy.length - qMed.length);
      result.push(...qEasy, ...qMed, ...qHard);
    } else {
      const questions = await this.popFromBuffer(difficulty, count);
      result.push(...questions);
    }

    // Mezclar resultados para que no salgan en orden de dificultad estricto si es mixto
    const shuffled = result.sort(() => Math.random() - 0.5);

    // Disparar recarga en segundo plano
    this.refillBuffers();

    return shuffled;
  }

  /**
   * Extrae preguntas de un buffer específico. Si falta, llama a la API.
   */
  private async popFromBuffer(diff: 'easy' | 'medium' | 'hard', count: number): Promise<Question[]> {
    const extracted: Question[] = [];
    
    // 1. Intentar sacar del buffer
    while (extracted.length < count && this.buffers[diff].length > 0) {
      extracted.push(this.buffers[diff].shift()!);
    }

    // 2. Si faltan, generar bajo demanda (el usuario tendrá que esperar un poco)
    if (extracted.length < count) {
      const needed = count - extracted.length;
      try {
        console.log(`[Buffer] Buffer vacío para ${diff}, generando ${needed} en tiempo real...`);
        const freshQuestions = await generateExam(diff, needed, this.history);
        this.addToHistory(freshQuestions);
        extracted.push(...freshQuestions);
      } catch (e) {
        console.error("Error fetching emergency questions", e);
      }
    }

    return extracted;
  }

  /**
   * Rellena los buffers en segundo plano hasta llegar al límite.
   */
  private async refillBuffers() {
    if (this.isRefilling) return;
    this.isRefilling = true;

    try {
      const difficulties: ('easy' | 'medium' | 'hard')[] = ['easy', 'medium', 'hard'];

      for (const diff of difficulties) {
        if (this.buffers[diff].length < this.BUFFER_SIZE) {
          const needed = 5; // Pedimos lotes pequeños de 5 para no saturar
          // console.log(`[Background] Rellenando buffer ${diff}...`);
          
          // Generamos sin bloquear la UI
          generateExam(diff, needed, this.history).then(newQs => {
            this.addToHistory(newQs);
            this.buffers[diff].push(...newQs);
            // console.log(`[Background] ${diff} buffer ahora tiene ${this.buffers[diff].length}`);
          }).catch(e => console.warn(`[Background] Fallo rellenando ${diff}`, e));
          
          // Pequeña pausa para no bloquear el hilo principal si hay muchas promesas
          await new Promise(r => setTimeout(r, 100)); 
        }
      }
    } finally {
      this.isRefilling = false;
    }
  }

  private addToHistory(questions: Question[]) {
    questions.forEach(q => {
      this.history.push(q.prompt);
      // Mantener solo los últimos 200
      if (this.history.length > this.MAX_HISTORY) {
        this.history.shift();
      }
    });
  }

  public clearMemory() {
    this.history = [];
    this.buffers = { easy: [], medium: [], hard: [] };
    this.refillBuffers();
  }
}

export const questionManager = QuestionManager.getInstance();
