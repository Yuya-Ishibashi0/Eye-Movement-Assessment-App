import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Stimulus from '../components/Execution/Stimulus';
import { TASKS, type TaskDefinition } from '../components/Execution/tasks';
import { useCamera } from '../hooks/useCamera';
import { useEvaluationStore } from '../store/evaluationStore';
import type { TaskLog } from '../types/evaluation';
import { createTaskLog } from '../utils/taskLogs';

const ExecutionPage: React.FC = () => {
  const navigate = useNavigate();
  const { pixelsPerMm, addRecord } = useEvaluationStore();
  const {
    videoRef,
    startCamera,
    stopCamera,
    startRecording,
    stopRecording,
    cameraActive,
    cameraError,
  } = useCamera();

  const [currentTaskIndex, setCurrentTaskIndex] = useState(-1);
  const [sessionActive, setSessionActive] = useState(false);
  const logsRef = useRef<TaskLog[]>([]);

  const currentTask: TaskDefinition | undefined = TASKS[currentTaskIndex];

  useEffect(() => {
    void startCamera();

    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().catch((error) => {
        console.warn(`Fullscreen request failed: ${error.message}`);
      });
    }

    return () => {
      stopCamera();
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
    };
  }, [startCamera, stopCamera]);

  useEffect(() => {
    if (!sessionActive || !currentTask) {
      return;
    }

    logsRef.current = [createTaskLog('TASK_START', currentTask.id)];

    if (currentTask.id !== 'REST') {
      try {
        startRecording();
      } catch (error) {
        console.error('Recording start error:', error);
      }
    }
  }, [currentTask, sessionActive, startRecording]);

  const handleNextTask = async () => {
    if (currentTask && currentTask.id !== 'REST') {
      try {
        const videoBlob = await stopRecording();
        addRecord(currentTask.id, videoBlob, [
          ...logsRef.current,
          createTaskLog('TASK_END', currentTask.id),
        ]);
      } catch (error) {
        console.error('Recording stop error:', error);
      }
    }

    if (currentTaskIndex + 1 < TASKS.length) {
      setCurrentTaskIndex((prev) => prev + 1);
      return;
    }

    handleSessionEnd();
  };

  const handleSessionEnd = () => {
    setSessionActive(false);
    logsRef.current = [];
    navigate('/result');
  };

  const handleStartSession = async () => {
    const ready = cameraActive || (await startCamera());

    if (!ready) {
      return;
    }

    setSessionActive(true);
    setCurrentTaskIndex(0);
  };

  const handleEmergencyStop = () => {
    if (currentTask?.id !== 'REST') {
      void stopRecording().catch(() => {});
    }
    navigate('/result');
  };

  return (
    <div className="relative h-screen w-screen cursor-none overflow-hidden bg-white">
      <video ref={videoRef} autoPlay playsInline muted className="hidden" />

      {!sessionActive && (
        <div className="absolute inset-0 z-50 flex cursor-auto flex-col items-center justify-center bg-gray-50">
          <h1 className="mb-8 text-4xl font-bold">準備をしてください</h1>
          <p className="mb-8 text-lg text-gray-600">お子様に画面の中心を見るように伝えてください。</p>
          {cameraError && (
            <p className="mb-6 max-w-xl rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
              {cameraError}
            </p>
          )}
          <button
            onClick={() => void handleStartSession()}
            className="rounded-xl bg-blue-600 px-8 py-4 text-2xl font-bold text-white hover:bg-blue-700"
          >
            {cameraActive ? 'スタート (Spaceキー)' : 'カメラを起動してスタート'}
          </button>
        </div>
      )}

      {sessionActive && currentTask && (
        <Stimulus task={currentTask} pixelsPerMm={pixelsPerMm} onComplete={handleNextTask} />
      )}

      <div className="absolute left-4 top-4 z-50 flex cursor-auto flex-col gap-1 rounded bg-white/80 p-2 text-xs text-gray-400 opacity-20 shadow-sm transition-opacity hover:opacity-100">
        <div>
          <strong>現在の課題:</strong> {currentTask?.name || '準備中'}
        </div>
        <div>
          <strong>次の課題:</strong> {TASKS[currentTaskIndex + 1]?.name || '終了'}
        </div>
        <button
          onClick={handleEmergencyStop}
          className="mt-2 text-red-600 underline hover:text-red-800"
        >
          中断して結果へ
        </button>
      </div>

      <div
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.code === 'Space' && !sessionActive) {
            void handleStartSession();
          }
        }}
        className="pointer-events-none fixed inset-0 outline-none"
        autoFocus
      />
    </div>
  );
};

export default ExecutionPage;
