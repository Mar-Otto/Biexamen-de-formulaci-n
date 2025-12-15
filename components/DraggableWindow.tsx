import React, { useState, useRef, useEffect } from 'react';

interface DraggableWindowProps {
  title: string;
  children: React.ReactNode;
  onClose?: () => void;
  width?: string;
  className?: string;
  maxHeight?: string;
}

export const DraggableWindow: React.FC<DraggableWindowProps> = ({ 
  title, 
  children, 
  onClose, 
  width = "max-w-3xl", 
  className = "", 
  maxHeight 
}) => {
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [init, setInit] = useState(false);
  const winRef = useRef<HTMLDivElement>(null);
  const drag = useRef({ active: false, x: 0, y: 0, ix: 0, iy: 0 });

  useEffect(() => {
    if (winRef.current && !init) {
      const rect = winRef.current.getBoundingClientRect();
      setPos({ x: (window.innerWidth - rect.width) / 2, y: Math.max(20, (window.innerHeight - rect.height) / 2 - 50) });
      setInit(true);
    }
  }, [init]);

  const down = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).tagName === 'BUTTON') return;
    drag.current = { active: true, x: e.clientX, y: e.clientY, ix: pos.x, iy: pos.y };
    document.addEventListener('mousemove', move);
    document.addEventListener('mouseup', up);
  };

  const move = (e: MouseEvent) => {
    if (!drag.current.active) return;
    setPos({ x: drag.current.ix + (e.clientX - drag.current.x), y: drag.current.iy + (e.clientY - drag.current.y) });
  };

  const up = () => {
    drag.current.active = false;
    document.removeEventListener('mousemove', move);
    document.removeEventListener('mouseup', up);
  };

  return (
    <div 
      ref={winRef} 
      style={{ left: init ? pos.x : '50%', top: init ? pos.y : '50%', transform: init ? 'none' : 'translate(-50%, -50%)', position: 'absolute', zIndex: 100, maxHeight: maxHeight || '90vh' }} 
      className={`win-box ${width} shadow-2xl ${className}`}
    >
      <div className="win-title-bar cursor-move select-none shrink-0" onMouseDown={down}>
        <div className="flex items-center gap-2">
          <img src="https://winaero.com/blog/wp-content/uploads/2018/09/cmd-icon-256.png" className="w-4 h-4" alt="icon" />
          <span>{title}</span>
        </div>
        {onClose && <button onClick={onClose}>X</button>}
      </div>
      <div className="overflow-y-auto win-content-scroll flex-1">{children}</div>
    </div>
  );
};
