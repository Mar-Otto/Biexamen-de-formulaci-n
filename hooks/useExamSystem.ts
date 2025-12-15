import { useState, useCallback, useEffect } from 'react';
import { questionManager } from '../services/questionManager';
import { getLauraFeedback } from '../services/gemini';
import { ExamState, Difficulty, ExamSystemLogic } from '../types';
import { playVictorySound, playDefeatSound, checkAnswer } from '../components/ResultsView';

export const useExamSystem = (): ExamSystemLogic => {
  const [questionCount, setQuestionCount] = useState<number>(30);
  const [loadingText, setLoadingText] = useState("Iniciando...");

  const [state, setState] = useState<ExamState>({
    mode: 'exam',
    status: 'idle',
    questions: [],
    userAnswers: {},
    score: 0,
  });

  // Cycle loading text
  useEffect(() => {
    if (state.status !== 'generating') return;
    const messages = [
      "LOAD \"ESTEQUIOMETRIA\"...",
      "RUN \"VALENCIAS.EXE\"...",
      "CALCULATING MOLES...",
      "SYNTAX CHECK: IUPAC...",
      "POKE 53280,0...",
      "PRESS PLAY ON TAPE...",
    ];
    let i = 0;
    setLoadingText(messages[Math.floor(Math.random() * messages.length)]);
    const interval = setInterval(() => {
      i = (i + 1) % messages.length;
      setLoadingText(messages[i]);
    }, 1200);
    return () => clearInterval(interval);
  }, [state.status]);

  const startNewExam = useCallback(async (difficulty: Difficulty) => {
    setState(prev => ({ ...prev, mode: 'exam', status: 'generating', error: undefined }));
    const startTime = Date.now();
    try {
      // Use QuestionManager to get buffered questions instantly if available
      const questions = await questionManager.getQuestions(difficulty, questionCount);
      
      // Ensure minimum 2s loading for UX
      const elapsed = Date.now() - startTime;
      if (elapsed < 2000) {
        await new Promise(resolve => setTimeout(resolve, 2000 - elapsed));
      }

      setState({ mode: 'exam', status: 'active', questions, userAnswers: {}, score: 0 });
    } catch (error) {
      console.error(error);
      setState(prev => ({ ...prev, status: 'error', error: "CONNECTION ERROR" }));
    }
  }, [questionCount]);

  const startStudyMode = useCallback(async (difficulty: Difficulty) => {
    setState(prev => ({ ...prev, mode: 'study', status: 'generating', error: undefined, userAnswers: {} }));
    const startTime = Date.now();
    try {
      // Use QuestionManager for single questions too
      const questions = await questionManager.getQuestions(difficulty, 1);
      
      // Ensure minimum 2s loading for UX
      const elapsed = Date.now() - startTime;
      if (elapsed < 2000) {
        await new Promise(resolve => setTimeout(resolve, 2000 - elapsed));
      }

      setState({
        mode: 'study', status: 'active', questions, userAnswers: {}, score: 0,
        studyFeedback: undefined, studyDifficulty: difficulty
      });
    } catch (error) {
      setState(prev => ({ ...prev, status: 'error', error: "AI NOT RESPONDING" }));
    }
  }, []);

  const handleStudySubmit = async () => {
    const question = state.questions[0];
    const answer = state.userAnswers[question.id] || '';
    const check = checkAnswer(answer, question.correctAnswer, question.acceptedAnswers);
    
    if (check.isCorrect) playVictorySound();
    else {
      playDefeatSound();
    }

    setState(prev => ({
      ...prev,
      studyFeedback: {
        isCorrect: check.isCorrect, accentError: check.accentError,
        lauraMessage: "PROCESSING...", loading: true
      }
    }));

    const lauraMsg = await getLauraFeedback(question, answer, check.isCorrect);

    setState(prev => ({
      ...prev,
      studyFeedback: { ...prev.studyFeedback!, lauraMessage: lauraMsg, loading: false }
    }));
  };

  const handleAnswerChange = (questionId: number, value: string) => {
    setState(prev => ({ ...prev, userAnswers: { ...prev.userAnswers, [questionId]: value } }));
  };

  const submitExam = () => setState(prev => ({ ...prev, status: 'review' }));
  
  const resetToHome = () => setState({ mode: 'exam', status: 'idle', questions: [], userAnswers: {}, score: 0 });

  const clearMemory = () => {
    if (confirm("CLEAR MEMORY & CACHE?")) {
      questionManager.clearMemory();
    }
  };

  return {
    state,
    setQuestionCount,
    questionCount,
    loadingText,
    startNewExam,
    startStudyMode,
    handleAnswerChange,
    handleStudySubmit,
    handleNextStudyQuestion: () => startStudyMode(state.studyDifficulty || 'mixed'),
    submitExam,
    resetToHome,
    clearMemory
  };
};
