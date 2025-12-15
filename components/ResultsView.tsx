import React, { useEffect, useRef, useState } from 'react';
import { Question } from '../types';
import { FormulaRenderer } from './QuestionCard';
import { getStudyAdvice } from '../services/gemini';

// --- SOUND UTILS ---
export const playDefeatSound = () => {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, t);
    osc.frequency.exponentialRampToValueAtTime(40, t + 0.25);
    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.3);
  } catch (e) {}
};

export const playVictorySound = () => {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const t = ctx.currentTime;
    const playTone = (freq: number, time: number, decay: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, time);
        gain.gain.setValueAtTime(0.15, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + decay);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(time);
        osc.stop(time + decay);
    };
    playTone(523.25, t, 0.3);        // C5
    playTone(783.99, t + 0.08, 0.4); // G5
    playTone(1567.98, t + 0.08, 0.3); // G6
  } catch (e) {}
};

export const playFanfareSound = () => {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const t = ctx.currentTime;
    const playNote = (freq: number, time: number, dur: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, time);
        gain.gain.setValueAtTime(0.15, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + dur);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(time);
        osc.stop(time + dur);
    };
    playNote(523.25, t, 0.15);       // C5
    playNote(523.25, t + 0.12, 0.15); // C5
    playNote(523.25, t + 0.24, 0.15); // C5
    playNote(783.99, t + 0.36, 0.8);  // G5
    playNote(1046.50, t + 0.36, 0.8); // C6
  } catch (e) {}
};

// --- LOGIC UTILS ---
const removeAccents = (str: string) => {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
};

const normalizeAnswer = (s: string) => {
  if (!s) return '';
  return s
    .trim()
    .toLowerCase()
    .replace(/^(ion|anion|anión|cation|catión)\s+/g, '')
    .replace(/(\^?\d*[+\-])/g, '') // Remove charges
    .replace(/\s+/g, '');
};

export const checkAnswer = (user: string, correct: string, accepted: string[]): { isCorrect: boolean; accentError: boolean } => {
  if (!user) return { isCorrect: false, accentError: false };
  
  const normUser = normalizeAnswer(user);
  const normCorrect = normalizeAnswer(correct);
  const normAccepted = accepted.map(normalizeAnswer);
  
  if (normUser === normCorrect) return { isCorrect: true, accentError: false };
  if (normAccepted.some(a => a === normUser)) return { isCorrect: true, accentError: false };
  
  const looseUser = removeAccents(normUser);
  const looseCorrect = removeAccents(normCorrect);
  const looseAccepted = normAccepted.map(removeAccents);
  
  if (looseUser === looseCorrect) return { isCorrect: true, accentError: true };
  if (looseAccepted.some(a => a === looseUser)) return { isCorrect: true, accentError: true };
  
  return { isCorrect: false, accentError: false };
};

// --- COMPONENT ---
interface ResultsViewProps {
  questions: Question[];
  userAnswers: Record<number, string>;
  onRetry: () => void;
}

export const ResultsView: React.FC<ResultsViewProps> = ({ questions, userAnswers, onRetry }) => {
  const [advice, setAdvice] = useState<string | null>(null);
  const [loadingAdvice, setLoadingAdvice] = useState(false);
  
  let correctCount = 0;
  const mistakes: Question[] = [];

  const results = questions.map(q => {
    const { isCorrect, accentError } = checkAnswer(userAnswers[q.id] || '', q.correctAnswer, q.acceptedAnswers);
    if (isCorrect) correctCount++;
    else mistakes.push(q);
    return { ...q, isCorrect, accentError };
  });

  const score = Math.round((correctCount / questions.length) * 100);
  const passed = score >= 50; 
  const threshold = Math.ceil(questions.length * 0.9);
  const lauraApproved = correctCount >= threshold;

  const soundPlayedRef = useRef(false);

  useEffect(() => {
    if (!soundPlayedRef.current) {
      soundPlayedRef.current = true;
      if (lauraApproved) {
        playFanfareSound();
      } else if (passed) {
        playVictorySound();
      } else {
        playDefeatSound();
      }
    }
  }, [passed, lauraApproved]);

  const handleGetAdvice = async () => {
    setLoadingAdvice(true);
    const tip = await getStudyAdvice(mistakes);
    setAdvice(tip);
    setLoadingAdvice(false);
  };

  return (
    <div className="max-w-4xl mx-auto pb-12">
      <div className="win-box mb-8 no-print">
        <div className="win-title-bar">
          <span>Resultados del Examen</span>
        </div>
        <div className="p-6 text-center">
           <h2 className="text-2xl font-bold font-sans mb-4 text-[#0046D5] underline">
             {passed ? "EXAMEN FINALIZADO" : "SUSPENSO"}
           </h2>
           
           <div className="bg-white border border-[#7F9DB9] p-4 inline-block mb-4 shadow-sm rounded">
              <span className={`text-4xl font-mono font-bold ${passed ? 'text-green-700' : 'text-red-700'}`}>
                 {score}/100
              </span>
           </div>
           
           <p className="font-sans mb-4 text-gray-700">
             Aciertos: {correctCount} / {questions.length}
           </p>

           {lauraApproved ? (
             <div className="bg-[#EFFFF0] border border-green-500 p-2 mb-4 font-bold text-sm text-green-800 rounded">
               *** CERTIFICADO: APROBADO POR LAURA ***
             </div>
           ) : (
             <div className="bg-[#FFEBEB] border border-red-400 p-2 mb-4 font-bold text-sm text-red-900 rounded">
               Estado: NO APROBADO POR LAURA (Req: {threshold}+)
             </div>
           )}

           <div className="flex justify-center gap-4 flex-wrap">
             <button onClick={onRetry} className="win-btn font-bold">
               REINICIAR
             </button>
             <button onClick={() => window.print()} className="win-btn">
               IMPRIMIR
             </button>
             {mistakes.length > 0 && !advice && (
                <button onClick={handleGetAdvice} disabled={loadingAdvice} className="win-btn">
                  {loadingAdvice ? "Consultando..." : "ANÁLISIS DE ERRORES (AI)"}
                </button>
             )}
           </div>

           {advice && (
             <div className="mt-4 text-left border border-[#E6DB55] bg-[#FFFFE1] p-3 font-sans text-sm rounded text-[#333]">
               <strong className="text-[#0046D5]">&gt; CONSEJO_SISTEMA:</strong><br/>
               {advice}
             </div>
           )}
        </div>
      </div>

      <div className="space-y-4">
        {results.map((q, idx) => (
          <div key={q.id} className="border-b border-[#D0D0BF] pb-4 question-card break-inside-avoid">
             <div className="flex gap-2">
               <span className="font-mono font-bold text-[#555]">{idx + 1}.</span>
               <div className="flex-1">
                 <div className="font-serif text-lg">
                    {q.type === 'FORMULA_TO_NAME' ? (
                      <>Nombrar: <FormulaRenderer text={q.prompt} className="font-bold text-[#003099]" /></>
                    ) : (
                      <>Formular: <span className="font-bold text-[#003099]">{q.prompt}</span></>
                    )}
                 </div>

                 <div className="mt-2 grid md:grid-cols-2 gap-4 text-sm font-sans">
                    <div className="p-2 border border-[#D0D0BF] bg-white rounded-sm">
                       <span className="block text-xs text-gray-500 uppercase">Tu Respuesta:</span>
                       <span className={q.isCorrect ? 'text-green-700 font-bold' : 'text-red-700 font-bold decoration-wavy line-through'}>
                          {userAnswers[q.id] || '---'}
                       </span>
                       {q.accentError && <span className="text-yellow-600 text-xs ml-2">[TILDES]</span>}
                    </div>
                    
                    {(!q.isCorrect || q.accentError) && (
                       <div className="p-2 border border-[#D0D0BF] bg-[#F5F5F5] rounded-sm">
                         <span className="block text-xs text-gray-500 uppercase">Correcto:</span>
                         <span className="font-bold text-[#333]">
                            <FormulaRenderer text={q.correctAnswer} />
                         </span>
                       </div>
                    )}
                 </div>
               </div>
             </div>
          </div>
        ))}
      </div>
    </div>
  );
};