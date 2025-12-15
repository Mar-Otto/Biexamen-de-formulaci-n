import React, { useState } from 'react';
import { useExamSystem } from './hooks/useExamSystem';
import { DesktopView } from './components/DesktopView';
import { BasicOSView } from './components/BasicOSView';

const App: React.FC = () => {
  // Global View Mode State
  const [viewMode, setViewMode] = useState<'desktop' | 'basic'>('desktop');
  
  // Shared Exam Logic Hook
  const logic = useExamSystem();

  return (
    <>
      {viewMode === 'desktop' ? (
        <DesktopView logic={logic} onSwitchMode={() => setViewMode('basic')} />
      ) : (
        <BasicOSView logic={logic} onSwitchMode={() => setViewMode('desktop')} />
      )}
    </>
  );
};

export default App;
