import React, { useState, useEffect } from 'react';
import { checkAnswer } from './ResultsView';
import { LAURA_HEADER_ASCII, LauraTerminal } from './LauraTerminal';
import { ExamSystemLogic } from '../types';

interface BasicOSViewProps {
  logic: ExamSystemLogic;
  onSwitchMode: () => void;
}

export const BasicOSView: React.FC<BasicOSViewProps> = ({ logic, onSwitchMode }) => {
  const { state, loadingText, startNewExam, startStudyMode, handleAnswerChange, submitExam, resetToHome, handleStudySubmit, handleNextStudyQuestion, setQuestionCount, questionCount } = logic;
  const answeredCount = Object.keys(state.userAnswers).filter(k => state.userAnswers[parseInt(k)]?.trim()).length;
  
  // Local state for basic menu navigation
  const [menuState, setMenuState] = useState<'main' | 'exam_qty' | 'exam_diff' | 'study_diff'>('main');

  // Reset menu on idle
  useEffect(() => {
    if (state.status === 'idle') setMenuState('main');
  }, [state.status]);

  // Calculate results for review mode
  const correctCount = state.questions.reduce((acc, q) => {
      const check = checkAnswer(state.userAnswers[q.id], q.correctAnswer, q.acceptedAnswers);
      return acc + (check.isCorrect ? 1 : 0);
  }, 0);
  const score = state.questions.length > 0 ? Math.round((correctCount / state.questions.length) * 100) : 0;
  const passed = score >= 50;
  const lauraApproved = correctCount >= Math.ceil(state.questions.length * 0.9);

  return (
    <div className="basic-mode">
      <div className="crt-overlay"></div>
      
      <div className="basic-container">
        {/* HEADER */}
        {state.mode === 'study' && state.status === 'active' && state.studyFeedback ? (
           <div className="mb-8 text-center">
             <pre className="font-mono text-[#4af626] font-bold leading-none whitespace-pre inline-block text-left">
                {LAURA_HEADER_ASCII}
             </pre>
           </div>
        ) : (
           <div className="basic-header">
             *** BIEXAMEN BASIC V6.7 ***<br/>
             {state.status === 'review' ? "AI NEURAL NET LOADED. MEMORY ALLOCATION: 100%" : "64K RAM SYSTEM 38911 BASIC BYTES FREE"}<br/>
             {state.status !== 'review' && "READY."}
           </div>
        )}

        {/* --- MENU SYSTEM --- */}
        {state.status === 'idle' && (
          <div className="space-y-2">
            {menuState === 'main' && (
              <>
                <button onClick={() => setMenuState('exam_qty')} className="basic-btn">10 LOAD "EXAMEN",8,1</button>
                <button onClick={() => setMenuState('study_diff')} className="basic-btn">20 LOAD "PRACTICAR",8,1</button>
                <button onClick={onSwitchMode} className="basic-btn">30 SYS 64738 (DESKTOP)</button>
                <div className="mt-4 animate-pulse">READY.<span className="cursor-blink">_</span></div>
              </>
            )}

            {menuState === 'exam_qty' && (
              <>
                <div className="mb-4 text-[#4af626] opacity-80">LOAD "EXAMEN",8,1<br/>SEARCHING FOR EXAMEN...<br/>LOADING...<br/>READY.<br/>RUN</div>
                <div className="mb-2">SELECT QUANTITY (N):</div>
                <button onClick={() => { setQuestionCount(10); setMenuState('exam_diff'); }} className="basic-btn">10 N = 10</button>
                <button onClick={() => { setQuestionCount(20); setMenuState('exam_diff'); }} className="basic-btn">20 N = 20</button>
                <button onClick={() => { setQuestionCount(30); setMenuState('exam_diff'); }} className="basic-btn">30 N = 30</button>
                <button onClick={() => setMenuState('main')} className="basic-btn mt-4">40 GOTO 10 (BACK)</button>
                <div className="mt-2 animate-pulse">?<span className="cursor-blink">_</span></div>
              </>
            )}

            {menuState === 'exam_diff' && (
              <>
                <div className="mb-2">N = {questionCount}<br/>SELECT DIFFICULTY LEVEL:</div>
                <button onClick={() => startNewExam('easy')} className="basic-btn">10 EASY (BINARIOS)</button>
                <button onClick={() => startNewExam('medium')} className="basic-btn">20 MEDIUM (TERNARIOS)</button>
                <button onClick={() => startNewExam('hard')} className="basic-btn">30 HARD (AVANZADO)</button>
                <button onClick={() => startNewExam('mixed')} className="basic-btn">40 MIXED (ALEATORIO)</button>
                <button onClick={() => setMenuState('exam_qty')} className="basic-btn mt-4">50 GOTO 10 (BACK)</button>
                <div className="mt-2 animate-pulse">?<span className="cursor-blink">_</span></div>
              </>
            )}

            {menuState === 'study_diff' && (
              <>
                <div className="mb-4 text-[#4af626] opacity-80">LOAD "PRACTICAR",8,1<br/>SEARCHING FOR PRACTICAR...<br/>LOADING...<br/>READY.<br/>RUN</div>
                <div className="mb-2">SELECT STUDY LEVEL:</div>
                <button onClick={() => startStudyMode('easy')} className="basic-btn">10 EASY</button>
                <button onClick={() => startStudyMode('medium')} className="basic-btn">20 MEDIUM</button>
                <button onClick={() => startStudyMode('hard')} className="basic-btn">30 HARD</button>
                <button onClick={() => startStudyMode('mixed')} className="basic-btn">40 MIXED</button>
                <button onClick={() => setMenuState('main')} className="basic-btn mt-4">50 GOTO 10 (BACK)</button>
                <div className="mt-2 animate-pulse">?<span className="cursor-blink">_</span></div>
              </>
            )}
          </div>
        )}

        {/* --- LOADING --- */}
        {state.status === 'generating' && (
          <div className="mt-4">
             SEARCHING FOR DATA...<br/>
             LOADING...<br/>
             {loadingText}<br/>
             <br/>
             READY.<br/>
             RUNNING...<span className="cursor-blink">_</span>
          </div>
        )}

        {/* --- ERROR --- */}
        {state.status === 'error' && (
           <div className="mt-4 text-red-500">
             ?SYNTAX ERROR IN LINE 10<br/>
             {state.error}<br/>
             <button onClick={resetToHome} className="basic-btn text-white mt-4">RETRY</button>
           </div>
        )}

        {/* --- STUDY MODE --- */}
        {state.mode === 'study' && state.status === 'active' && state.questions[0] && (
           <div className="mt-4">
              <div className="mb-2">
                 PREGUNTA #1<br/>
                 TIPO: {state.questions[0].type === 'FORMULA_TO_NAME' ? 'NOMBRAR' : 'FORMULAR'}
              </div>
              <div className="text-4xl mb-6">
                 {state.questions[0].prompt}
              </div>

              {!state.studyFeedback ? (
                 <div className="flex items-center gap-2">
                    ? <input 
                       className="basic-input" 
                       autoFocus 
                       autoComplete="off"
                       value={state.userAnswers[state.questions[0].id] || ''}
                       onChange={(e) => handleAnswerChange(state.questions[0].id, e.target.value)}
                       onKeyDown={(e) => {
                          if (e.key === 'Enter' && state.userAnswers[state.questions[0].id]) handleStudySubmit();
                       }}
                    />
                 </div>
              ) : (
                 <div className="pb-10">
                    <div className="mb-6 font-mono text-lg">
                         <span className="opacity-70">SYSTEM_OUTPUT&gt;</span><br/>
                         <span className="animate-pulse">
                            {state.studyFeedback.isCorrect ? "RESULT: POSITIVE. SYNTAX VALID." : "RESULT: NEGATIVE. DATA MISMATCH."}
                         </span>
                    </div>

                    {!state.studyFeedback.isCorrect && (
                       <div className="mb-6">
                           <div className="opacity-80 mb-1">ERR_ADDR_01: {state.questions[0].prompt}</div>
                           <div className="flex flex-col pl-4 border-l-2 border-[#4af626] ml-2 mt-1 gap-1">
                               <span className="opacity-70 text-sm">RECV : "{state.userAnswers[state.questions[0].id] || 'NULL'}"</span>
                               <span className="font-bold">XPCT : "{state.questions[0].correctAnswer}"</span>
                           </div>
                       </div>
                    )}
                    
                    <div className="mb-6 font-mono">
                        <span className="opacity-70">LAURA_MSG&gt;</span>
                        <span className="ml-2">
                           {state.studyFeedback.loading ? "CALCULATING..." : state.studyFeedback.lauraMessage}
                        </span>
                    </div>

                    <div className="mt-8 border-t border-[#4af626] border-dashed pt-4">
                       <button onClick={handleNextStudyQuestion} className="basic-btn">10 NEXT (CONTINUE)</button>
                       <button onClick={resetToHome} className="basic-btn">20 EXIT (MENU)</button>
                    </div>
                 </div>
              )}
           </div>
        )}

        {/* --- EXAM MODE --- */}
        {state.mode === 'exam' && state.status === 'active' && (
           <div>
              <div className="flex justify-between border-b border-[#4af626] mb-4">
                 <span>EXAM RUNNING</span>
                 <span>PROG: {answeredCount}/{state.questions.length}</span>
              </div>
              
              {state.questions.map((q, i) => (
                 <div key={q.id} className="mb-6">
                    <div className="opacity-70">{i * 10 + 10} PRINT "{i+1}. {q.type === 'FORMULA_TO_NAME' ? 'NOMBRAR' : 'FORMULAR'} {q.prompt}"</div>
                    <div className="flex items-center gap-2">
                       {i * 10 + 15} INPUT A$ : ? 
                       <input 
                          className="basic-input text-lg" 
                          style={{ width: '60%' }}
                          value={state.userAnswers[q.id] || ''}
                          onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                       />
                    </div>
                 </div>
              ))}

              <button onClick={submitExam} className="basic-btn text-center border border-[#4af626] py-2 mt-8 hover:bg-[#4af626] hover:text-black">
                 END SUB / SUBMIT
              </button>
           </div>
        )}

        {/* --- RESULTS (LAURA.EXE MODE) --- */}
        {state.status === 'review' && (
           <div className="pb-10">
              <div className="mb-4">READY.<br/>RUN</div>
              
              {/* --- NEW LAURA TEXT HEADER --- */}
              <pre className="font-mono text-[#4af626] font-bold leading-none mb-8 whitespace-pre overflow-x-auto">
                {LAURA_HEADER_ASCII}
              </pre>

              {/* --- SYSTEM DIALOGUE (No Boxed Terminal) --- */}
              <div className="mb-6 font-mono text-lg">
                 <span className="opacity-70">SYSTEM_OUTPUT&gt;</span><br/>
                 <span className="animate-pulse">
                   {lauraApproved ? `ANALYSIS COMPLETE. SCORE: ${score}%. STATUS: EXCELLENT. SYSTEM INTEGRITY VERIFIED.` : 
                    passed ? `ANALYSIS COMPLETE. SCORE: ${score}%. STATUS: ACCEPTABLE. MINOR ANOMALIES DETECTED.` : 
                    `ANALYSIS COMPLETE. SCORE: ${score}%. STATUS: CRITICAL FAILURE. SYSTEM COMPROMISED.`}
                 </span>
              </div>

              <div className="border-b border-[#4af626] mb-4 text-xl mt-8">ERROR_DUMP.LOG</div>
              
              <div className="space-y-6 font-mono">
                 {state.questions.map((q, i) => {
                    const check = checkAnswer(state.userAnswers[q.id], q.correctAnswer, q.acceptedAnswers);
                    if (!check.isCorrect) {
                        return (
                           <div key={q.id} className="mb-4">
                              <div className="opacity-80 mb-1">ERR_ADDR_{i+1}: {q.prompt}</div>
                              <div className="flex flex-col pl-4 border-l-2 border-[#4af626] ml-2 mt-1 gap-1">
                                 <span className="opacity-70 text-sm">RECV : "{state.userAnswers[q.id] || 'NULL'}"</span>
                                 <span className="font-bold">XPCT : "{q.correctAnswer}"</span>
                              </div>
                           </div>
                        );
                    }
                    return null;
                 })}
                 
                 {correctCount === state.questions.length && (
                     <div className="text-center py-4 animate-pulse">NO SEGMENTATION FAULTS FOUND. MEMORY CLEAN.</div>
                 )}
              </div>

              <div className="mt-8">
                 <button onClick={resetToHome} className="basic-btn">10 RUN (RETRY)</button>
                 <button onClick={resetToHome} className="basic-btn">20 GOTO 10 (MENU)</button>
                 <div className="mt-4 animate-pulse">READY.<span className="cursor-blink">_</span></div>
              </div>
           </div>
        )}

      </div>
    </div>
  );
};
