export enum QuestionType {
  FORMULA_TO_NAME = 'FORMULA_TO_NAME',
  NAME_TO_FORMULA = 'NAME_TO_FORMULA'
}

export enum NotationType {
  SISTEMATICA = 'Sistemática',
  TRADICIONAL = 'Tradicional',
  STOCK = 'Stock',
  FORMULA = 'Fórmula',
  NONE = 'Ninguna',
  ANY = 'Cualquiera'
}

export type Difficulty = 'easy' | 'medium' | 'hard' | 'mixed';

export interface Question {
  id: number;
  type: QuestionType;
  prompt: string;
  targetNotation: NotationType;
  correctAnswer: string;
  acceptedAnswers: string[];
  explanation?: string;
}

export interface StudyFeedback {
  isCorrect: boolean;
  accentError: boolean;
  lauraMessage: string;
  loading: boolean;
}

export interface ExamState {
  mode: 'exam' | 'study';
  status: 'idle' | 'generating' | 'active' | 'review' | 'error';
  questions: Question[];
  userAnswers: Record<number, string>;
  score: number;
  error?: string;
  studyFeedback?: StudyFeedback;
  studyDifficulty?: Difficulty;
}

// Interface for the custom hook return value
export interface ExamSystemLogic {
  state: ExamState;
  setQuestionCount: (n: number) => void;
  questionCount: number;
  loadingText: string;
  startNewExam: (difficulty: Difficulty) => Promise<void>;
  startStudyMode: (difficulty: Difficulty) => Promise<void>;
  handleAnswerChange: (questionId: number, value: string) => void;
  handleStudySubmit: () => Promise<void>;
  handleNextStudyQuestion: () => void;
  submitExam: () => void;
  resetToHome: () => void;
  clearMemory: () => void;
}
