import { useCallback, useEffect, useRef, useState } from 'react';

type CameraStatus = 'idle' | 'starting' | 'ready' | 'error' | 'unsupported';

const CAMERA_CONSTRAINTS: MediaStreamConstraints[] = [
  {
    video: {
      facingMode: { ideal: 'user' },
      width: { ideal: 1280 },
      height: { ideal: 720 },
    },
    audio: false,
  },
  {
    video: true,
    audio: false,
  },
];

function getSupportedMimeType() {
  if (typeof MediaRecorder === 'undefined') {
    return undefined;
  }

  const mimeTypes = [
    'video/webm; codecs=vp9',
    'video/webm; codecs=vp8',
    'video/webm',
    'video/mp4; codecs=h264',
    'video/mp4',
  ];

  return mimeTypes.find((mimeType) => MediaRecorder.isTypeSupported(mimeType));
}

function getErrorName(error: unknown) {
  return typeof error === 'object' && error !== null && 'name' in error
    ? String(error.name)
    : '';
}

function getCameraErrorMessage(error: unknown) {
  const errorName = getErrorName(error);

  switch (errorName) {
    case 'NotAllowedError':
    case 'SecurityError':
      return 'カメラ権限が拒否されました。ブラウザ設定でこのサイトのカメラ利用を許可してください。';
    case 'NotFoundError':
      return '利用可能なカメラが見つかりません。';
    case 'NotReadableError':
      return 'カメラが他のアプリまたはタブで使用中の可能性があります。';
    case 'OverconstrainedError':
      return '現在の端末で利用できるカメラ設定が見つかりませんでした。';
    default:
      return 'カメラの起動に失敗しました。ページ再読み込み後も続く場合は、HTTPS 配信とブラウザ権限を確認してください。';
  }
}

export function useCamera() {
  const videoElementRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);

  const [isRecording, setIsRecording] = useState(false);
  const [cameraStatus, setCameraStatus] = useState<CameraStatus>('idle');
  const [cameraError, setCameraError] = useState<string | null>(null);

  const attachStream = useCallback(async (stream: MediaStream) => {
    const videoElement = videoElementRef.current;

    if (!videoElement) {
      return;
    }

    if (videoElement.srcObject !== stream) {
      videoElement.srcObject = stream;
    }

    try {
      await videoElement.play();
    } catch (error) {
      console.warn('Video playback could not be started automatically:', error);
    }
  }, []);

  const videoRef = useCallback(
    (node: HTMLVideoElement | null) => {
      videoElementRef.current = node;

      if (node && streamRef.current) {
        void attachStream(streamRef.current);
      }
    },
    [attachStream],
  );

  const stopCamera = useCallback(() => {
    mediaRecorderRef.current = null;
    chunksRef.current = [];
    setIsRecording(false);

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (videoElementRef.current) {
      videoElementRef.current.pause();
      videoElementRef.current.srcObject = null;
    }

    setCameraStatus('idle');
  }, []);

  const startCamera = useCallback(async () => {
    if (!window.isSecureContext) {
      setCameraError('カメラは HTTPS 配信または localhost でのみ利用できます。');
      setCameraStatus('error');
      return false;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError('このブラウザはカメラ API に対応していません。');
      setCameraStatus('unsupported');
      return false;
    }

    if (streamRef.current) {
      setCameraError(null);
      setCameraStatus('ready');
      await attachStream(streamRef.current);
      return true;
    }

    setCameraStatus('starting');
    setCameraError(null);

    let lastError: unknown = null;

    for (const constraints of CAMERA_CONSTRAINTS) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        streamRef.current = stream;
        await attachStream(stream);
        setCameraStatus('ready');
        return true;
      } catch (error) {
        lastError = error;

        if (getErrorName(error) !== 'OverconstrainedError') {
          break;
        }
      }
    }

    setCameraStatus('error');
    setCameraError(getCameraErrorMessage(lastError));
    return false;
  }, [attachStream]);

  const startRecording = useCallback(() => {
    if (typeof MediaRecorder === 'undefined') {
      throw new Error('このブラウザでは録画に対応していません。');
    }

    if (!streamRef.current) {
      throw new Error('カメラが起動していません。');
    }

    const mimeType = getSupportedMimeType();
    const recorder = mimeType
      ? new MediaRecorder(streamRef.current, { mimeType })
      : new MediaRecorder(streamRef.current);

    chunksRef.current = [];

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunksRef.current.push(event.data);
      }
    };

    recorder.start();
    mediaRecorderRef.current = recorder;
    setIsRecording(true);
  }, []);

  const stopRecording = useCallback((): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const recorder = mediaRecorderRef.current;

      if (!recorder || recorder.state === 'inactive') {
        reject(new Error('Recorder is not active'));
        return;
      }

      recorder.onerror = () => {
        reject(new Error('録画の停止に失敗しました。'));
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'video/webm' });
        chunksRef.current = [];
        mediaRecorderRef.current = null;
        setIsRecording(false);
        resolve(blob);
      };

      try {
        recorder.stop();
      } catch (error) {
        reject(error);
      }
    });
  }, []);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  return {
    videoRef,
    cameraActive: cameraStatus === 'ready',
    cameraError,
    cameraStatus,
    isRecording,
    startCamera,
    stopCamera,
    startRecording,
    stopRecording,
  };
}
