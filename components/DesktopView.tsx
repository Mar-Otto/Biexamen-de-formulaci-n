import React from 'react';
import { DraggableWindow } from './DraggableWindow';
import { QuestionCard, FormulaRenderer } from './QuestionCard';
import { ResultsView } from './ResultsView';
import { ExamSystemLogic } from '../types';

interface DesktopViewProps {
  logic: ExamSystemLogic;
  onSwitchMode: () => void;
}

export const DesktopView: React.FC<DesktopViewProps> = ({ logic, onSwitchMode }) => {
  const { state, loadingText, startNewExam, startStudyMode, handleAnswerChange, submitExam, resetToHome, handleStudySubmit, handleNextStudyQuestion, setQuestionCount, questionCount, clearMemory } = logic;
  const answeredCount = Object.keys(state.userAnswers).filter(k => state.userAnswers[parseInt(k)]?.trim()).length;

  return (
    <div className="xp-mode">
      <div className="print-only p-8 font-serif">
         <h1 className="text-2xl font-bold uppercase text-center border-b-2 border-black mb-6">Examen de Formulación</h1>
      </div>

      {state.status === 'idle' && (
        <DraggableWindow title="BIEXAMEN.EXE" onClose={() => { if(confirm('¿Apagar?')) window.close(); }}>
          <div className="p-6">
            <div className="bg-white border border-[#7F9DB9] p-4 mb-6 text-center">
              <h1 className="text-3xl font-bold font-sans text-[#0046D5] mb-2">El Biexamen</h1>
              <p className="font-mono text-sm text-gray-500">Versión 6.7 (XP Edition)</p>
            </div>
            <div className="grid md:grid-cols-2 gap-8">
              <fieldset>
                <legend>Configuración</legend>
                <div className="mb-4 flex gap-2">
                  {[10, 20, 30].map(n => (
                    <button key={n} onClick={() => setQuestionCount(n)} className={`win-btn flex-1 ${questionCount === n ? 'font-bold bg-white ring-2 ring-blue-300' : ''}`}>{n}</button>
                  ))}
                </div>
                <div className="space-y-2">
                  <button onClick={() => startNewExam('easy')} className="win-btn w-full justify-start">🌱 FÁCIL</button>
                  <button onClick={() => startNewExam('medium')} className="win-btn w-full justify-start">⚡ MEDIO</button>
                  <button onClick={() => startNewExam('hard')} className="win-btn w-full justify-start">🔥 DIFÍCIL</button>
                  <button onClick={() => startNewExam('mixed')} className="win-btn w-full justify-start">🎲 MIXTO</button>
                </div>
              </fieldset>
              <fieldset>
                <legend>Estudio</legend>
                <div className="grid grid-cols-2 gap-2 mb-4">
                  <button onClick={() => startStudyMode('easy')} className="win-btn">🌱 Fácil</button>
                  <button onClick={() => startStudyMode('medium')} className="win-btn">⚡ Medio</button>
                  <button onClick={() => startStudyMode('hard')} className="win-btn">🔥 Difícil</button>
                  <button onClick={() => startStudyMode('mixed')} className="win-btn font-bold">🎲 MIXTO</button>
                </div>
                <button onClick={clearMemory} className="win-btn w-full text-red-800">Borrar Memoria</button>
              </fieldset>
            </div>
          </div>
        </DraggableWindow>
      )}

      {state.status === 'generating' && (
        <DraggableWindow title="Procesando..." width="max-w-md">
           <div className="p-8 pb-10 text-center">
              <p className="font-sans mb-4 text-sm font-bold text-gray-700 min-h-[20px]">Procesando datos...</p>
              <div className="xp-progress-bar-container w-full"><div className="xp-indeterminate-slider"><div className="xp-block"/><div className="xp-block"/><div className="xp-block"/></div></div>
           </div>
        </DraggableWindow>
      )}

      {state.status === 'error' && (
        <DraggableWindow title="Error" width="max-w-md" onClose={resetToHome}>
           <div className="p-6 text-center"><p className="text-red-600 font-bold mb-4">{state.error}</p><button onClick={resetToHome} className="win-btn">Aceptar</button></div>
        </DraggableWindow>
      )}

      {state.mode === 'study' && state.status === 'active' && state.questions.length > 0 && (
        <DraggableWindow title="Modo Estudio" onClose={resetToHome} width="max-w-2xl">
            <div className="p-6">
                <QuestionCard index={0} question={state.questions[0]} value={state.userAnswers[state.questions[0].id] || ''} onChange={(val) => !state.studyFeedback && handleAnswerChange(state.questions[0].id, val)} />
                {!state.studyFeedback ? (
                    <button onClick={handleStudySubmit} disabled={!state.userAnswers[state.questions[0].id]} className="win-btn w-full py-2 font-bold mt-4">ENVIAR</button>
                ) : (
                    <div className="mt-4 border border-[#7F9DB9] p-4 bg-white rounded">
                        <h3 className={`text-xl font-bold ${state.studyFeedback.isCorrect ? 'text-green-700' : 'text-red-600'}`}>{state.studyFeedback.isCorrect ? 'Correcto' : 'Incorrecto'}</h3>
                        {!state.studyFeedback.isCorrect && <p>SOLUCIÓN: <FormulaRenderer text={state.questions[0].correctAnswer} /></p>}
                        <div className="bg-[#FFFFE1] border border-[#E6DB55] p-2 mt-2 text-sm">{state.studyFeedback.loading ? '...' : state.studyFeedback.lauraMessage}</div>
                        <div className="flex justify-between mt-4"><button onClick={resetToHome} className="win-btn">Menú</button><button onClick={handleNextStudyQuestion} className="win-btn font-bold">Siguiente</button></div>
                    </div>
                )}
            </div>
        </DraggableWindow>
      )}

      {((state.status === 'active' && state.mode === 'exam') || state.status === 'review') && (
        <DraggableWindow title={state.status === 'review' ? "Resultados" : "Examen en curso"} onClose={resetToHome} width="max-w-4xl" maxHeight="85vh">
          <div className="bg-[#ECE9D8] border-b border-[#D0D0BF] p-2 flex justify-between shrink-0 no-print">
              <button className="win-btn" onClick={resetToHome}>&lt; Menú</button>
              {state.status === 'active' && <div className="bg-[#2258D6] text-white px-2 rounded text-xs pt-1">PROGRESO: {answeredCount}/{state.questions.length}</div>}
          </div>
          <div className="p-4 md:p-8">
            {state.status === 'active' ? (
              <div>
                {state.questions.map((q, idx) => (
                  <QuestionCard key={q.id} index={idx} question={q} value={state.userAnswers[q.id] || ''} onChange={(val) => handleAnswerChange(q.id, val)} />
                ))}
                <div className="text-center mt-4"><button onClick={submitExam} className="win-btn text-xl px-12 py-4 font-bold">ENTREGAR</button></div>
              </div>
            ) : (
              <ResultsView questions={state.questions} userAnswers={state.userAnswers} onRetry={resetToHome} />
            )}
          </div>
        </DraggableWindow>
      )}

      <header className="no-print xp-taskbar shadow-md">
          <div onClick={resetToHome} className="h-full flex items-center px-4 cursor-pointer bg-green-600 text-white font-bold italic mr-4" style={{ borderRadius: '0 10px 10px 0' }}>Inicio</div>
          {/* Switcher Button */}
          <div onClick={onSwitchMode} className="ml-2 bg-[#3674E6] hover:bg-[#4684F6] border border-[#1842A2] px-2 h-[80%] flex items-center gap-2 cursor-pointer rounded-sm" title="Cambiar sistema">
            <span className="text-xl">📺</span> <span className="text-xs">Modo BASIC</span>
          </div>
          <div className="ml-auto bg-[#1291D9] h-full px-4 flex items-center text-xs">12:00 PM</div>
      </header>
    </div>
  );
};
