import React, { useEffect, useRef, useState } from 'react';
import type { TaskDefinition } from './tasks';

interface StimulusProps {
  task: TaskDefinition;
  pixelsPerMm: number;
  onComplete: () => void;
}

const Stimulus: React.FC<StimulusProps> = ({ task, pixelsPerMm, onComplete }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [showRedDot, setShowRedDot] = useState(false); // For Saccade only
  const [showBlueSquare, setShowBlueSquare] = useState(false); // For Saccade only
  
  const MM_5 = 5 * pixelsPerMm;
  const CM_9 = 90 * pixelsPerMm;
  const SPEED_PX_S = 56.52 * pixelsPerMm;

  useEffect(() => {
    let animationFrameId: number;
    let startTime: number | null = null;
    let isCancelled = false;
    let timeoutId: ReturnType<typeof setTimeout>;

    const animate = (timestamp: number) => {
      if (isCancelled) return;
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;

      if (elapsed >= task.durationMs) {
        onComplete();
        return;
      }

      // Logic based on task type
      if (task.id === 'FIXATION') {
        setPos({ x: 0, y: 0 });

      } else if (task.id === 'SACCADE_LR') {
        // Switch every 1000ms
        const isLeft = Math.floor(elapsed / 1000) % 2 === 0;
        setShowRedDot(isLeft);
        setShowBlueSquare(!isLeft);

      } else if (task.id === 'SACCADE_UD') {
        // Switch every 1000ms
        const isUp = Math.floor(elapsed / 1000) % 2 === 0;
        setShowRedDot(isUp);
        setShowBlueSquare(!isUp);

      } else if (task.id === 'PURSUIT_LR') {
        // Movement: Center -> Left -> Right -> Left -> Right -> Center
        // Wait, spec says: Left 9cm to Right 9cm, 2 round trips.
        // Let's do: Start at Left 9cm.
        // Move to right (18cm / 5.652cm/s = ~3.18s). Pause 1s.
        // Move to left (3.18s). Pause 1s.
        const oneWayMs = (180 / 56.52) * 1000; // ~3184.7ms
        const pauseMs = 1000;
        const cycleMs = oneWayMs * 2 + pauseMs * 2; // 1 full RT
        
        const cycleTime = elapsed % cycleMs;
        let x = 0;
        
        if (cycleTime < oneWayMs) {
          x = -CM_9 + (SPEED_PX_S * cycleTime) / 1000;
        } else if (cycleTime < oneWayMs + pauseMs) {
          x = CM_9;
        } else if (cycleTime < oneWayMs * 2 + pauseMs) {
          x = CM_9 - (SPEED_PX_S * (cycleTime - oneWayMs - pauseMs)) / 1000;
        } else {
          x = -CM_9;
        }
        setPos({ x, y: 0 });

      } else if (task.id === 'PURSUIT_UD') {
        const oneWayMs = (180 / 56.52) * 1000; 
        const pauseMs = 1000;
        const cycleMs = oneWayMs * 2 + pauseMs * 2;
        
        const cycleTime = elapsed % cycleMs;
        let y = 0;
        
        if (cycleTime < oneWayMs) {
          y = -CM_9 + (SPEED_PX_S * cycleTime) / 1000;
        } else if (cycleTime < oneWayMs + pauseMs) {
          y = CM_9;
        } else if (cycleTime < oneWayMs * 2 + pauseMs) {
          y = CM_9 - (SPEED_PX_S * (cycleTime - oneWayMs - pauseMs)) / 1000;
        } else {
          y = -CM_9;
        }
        setPos({ x: 0, y });

      } else if (task.id === 'PURSUIT_CIRCLE') {
        // 10s per lap.
        const lapMs = (Math.PI * 180 / 56.52) * 1000; // ~10004ms
        const lapCount = Math.floor(elapsed / lapMs);
        const lapTime = elapsed % lapMs;
        
        // 1st, 3rd = CW. 2nd, 4th = CCW.
        const isCW = lapCount % 2 === 0;
        const angleRaw = (lapTime / lapMs) * Math.PI * 2;
        // Start at top: -90 degrees (-PI/2)
        const angle = isCW ? (-Math.PI / 2 + angleRaw) : (-Math.PI / 2 - angleRaw);

        setPos({
          x: Math.cos(angle) * CM_9,
          y: Math.sin(angle) * CM_9,
        });
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    if (task.id !== 'REST') {
      // Start slightly delayed to let user focus?
      animationFrameId = requestAnimationFrame(animate);
    } else {
      // Rest task just waits
      timeoutId = setTimeout(() => {
        if (!isCancelled) onComplete();
      }, task.durationMs);
    }

    return () => {
      isCancelled = true;
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [task, onComplete, CM_9, SPEED_PX_S]);

  if (task.id === 'REST') {
    return (
      <div className="flex items-center justify-center h-full w-full bg-black text-white text-3xl">
        そのまま休んでください...
      </div>
    );
  }

  // Common black dot style
  const dotStyle = {
    width: `${MM_5}px`,
    height: `${MM_5}px`,
    borderRadius: '50%',
    backgroundColor: 'black',
    transform: `translate(${pos.x}px, ${pos.y}px)`,
    position: 'absolute' as const,
  };

  // Saccade L/R specifics
  if (task.id === 'SACCADE_LR') {
    return (
      <div className="relative flex items-center justify-center h-full w-full bg-gray-100">
        <div style={{ position: 'absolute' }}>
          {showRedDot && (
            <div style={{
              width: `${MM_5}px`, height: `${MM_5}px`, borderRadius: '50%', backgroundColor: 'red',
              transform: `translate(${-CM_9}px, 0)`
            }} />
          )}
          {showBlueSquare && (
            <div style={{
              width: `${MM_5}px`, height: `${MM_5}px`, backgroundColor: 'blue',
              transform: `translate(${CM_9}px, 0)`
            }} />
          )}
        </div>
      </div>
    );
  }

  // Saccade U/D specifics
  if (task.id === 'SACCADE_UD') {
    return (
      <div className="relative flex items-center justify-center h-full w-full bg-gray-100">
        <div style={{ position: 'absolute' }}>
          {showRedDot && (
            <div style={{
              width: `${MM_5}px`, height: `${MM_5}px`, borderRadius: '50%', backgroundColor: 'red',
              transform: `translate(0, ${-CM_9}px)`
            }} />
          )}
          {showBlueSquare && (
            <div style={{
              width: `${MM_5}px`, height: `${MM_5}px`, backgroundColor: 'blue',
              transform: `translate(0, ${CM_9}px)`
            }} />
          )}
        </div>
      </div>
    );
  }

  // Pursuit & Fixation
  return (
    <div ref={containerRef} className="relative flex items-center justify-center h-full w-full bg-gray-100 overflow-hidden">
      {/* Container for absolute centering */}
      <div style={{ position: 'relative', width: 0, height: 0 }} className="flex justify-center items-center">
        <div style={dotStyle} />
      </div>
    </div>
  );
};

export default Stimulus;
