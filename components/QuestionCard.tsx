import React from 'react';
import { Question, NotationType } from '../types';

interface QuestionCardProps {
  question: Question;
  value: string;
  onChange: (val: string) => void;
  index: number;
}

export const FormulaRenderer: React.FC<{ text: string; className?: string }> = ({ text, className = "" }) => {
  const parts = text.split(/(\d+)/g);
  return (
    <span className={`font-mono ${className}`}>
      {parts.map((part, i) => {
        if (/^\d+$/.test(part)) {
          return <sub key={i} className="text-xs align-baseline relative top-[0.3em]">{part}</sub>;
        }
        return <span key={i}>{part}</span>;
      })}
    </span>
  );
};

export const QuestionCard: React.FC<QuestionCardProps> = ({ question, value, onChange, index }) => {
  const isTargetFormula = question.targetNotation === NotationType.FORMULA;

  return (
    <div className="question-card mb-6 break-inside-avoid">
      <fieldset className="bg-transparent">
        <legend className="text-sm font-bold font-sans">Pregunta #{index + 1}</legend>
        
        <div className="mb-4 px-2">
          <div className="flex items-baseline gap-2 mb-2">
             <span className="text-sm font-bold uppercase text-[#444]">
                {question.type === 'FORMULA_TO_NAME' ? 'NOMBRAR:' : 'FORMULAR:'}
             </span>
             <h3 className="text-xl font-bold font-serif text-[#003099]">
               {question.type === 'FORMULA_TO_NAME' ? (
                 <FormulaRenderer text={question.prompt} />
               ) : (
                 question.prompt
               )}
             </h3>
          </div>
          
          {question.type === 'FORMULA_TO_NAME' && (
            <div className="text-xs font-sans text-gray-500 mb-2 italic">
              (Sistemática, Stock o Tradicional)
            </div>
          )}
        </div>

        <div className="relative input-wrapper px-2 mb-2">
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="win-input w-full text-lg p-2 rounded-sm"
            autoComplete="off"
          />
          {isTargetFormula && (
             <div className="no-print text-right mt-1 text-xs text-gray-500 font-sans">
                * Usa números normales
             </div>
          )}
        </div>
      </fieldset>
    </div>
  );
};