import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, Info, Ruler, Users } from 'lucide-react';
import { useCamera } from '../hooks/useCamera';
import { useEvaluationStore } from '../store/evaluationStore';

const SetupPage: React.FC = () => {
  const navigate = useNavigate();
  const { subjectInfo, setSubjectInfo, pixelsPerMm, setCalibration } = useEvaluationStore();
  const { videoRef, startCamera, cameraActive, cameraError, cameraStatus } = useCamera();

  const CARD_WIDTH_MM = 85.6;
  const [cardUIWidthPx, setCardUIWidthPx] = useState(pixelsPerMm * CARD_WIDTH_MM);

  useEffect(() => {
    void startCamera();
  }, [startCamera]);

  const handleStart = async () => {
    if (!subjectInfo.id.trim()) {
      alert('被験者IDを入力してください。');
      return;
    }

    const ready = cameraActive || (await startCamera());

    if (!ready) {
      alert('カメラが有効になっていません。権限と HTTPS 配信を確認してください。');
      return;
    }

    navigate('/execute');
  };

  const handleCalibrationChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newWidthPx = Number.parseInt(event.target.value, 10);
    setCardUIWidthPx(newWidthPx);
    setCalibration(newWidthPx / CARD_WIDTH_MM);
  };

  return (
    <div className="flex min-h-screen flex-col items-center bg-gray-50 px-4 py-10">
      <div className="w-full max-w-3xl rounded-xl bg-white p-8 shadow-lg">
        <h1 className="mb-8 border-b pb-4 text-3xl font-bold text-gray-800">
          眼球運動評価 MVP - セットアップ
        </h1>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          <div className="space-y-6">
            <h2 className="flex items-center text-xl font-semibold text-gray-700">
              <Users className="mr-2 h-5 w-5" />
              被験者情報
            </h2>

            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">被験者ID (必須)</label>
                <input
                  type="text"
                  value={subjectInfo.id}
                  onChange={(event) => setSubjectInfo({ id: event.target.value })}
                  className="w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="例: SUBJ-001"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">年齢</label>
                  <input
                    type="number"
                    value={subjectInfo.age}
                    onChange={(event) => setSubjectInfo({ age: event.target.value })}
                    className="w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    placeholder="例: 7"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">検査日</label>
                  <input
                    type="date"
                    value={subjectInfo.date}
                    onChange={(event) => setSubjectInfo({ date: event.target.value })}
                    className="w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">検査者名</label>
                <input
                  type="text"
                  value={subjectInfo.examiner}
                  onChange={(event) => setSubjectInfo({ examiner: event.target.value })}
                  className="w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="例: 田中 太郎"
                />
              </div>
            </div>

            <hr />

            <h2 className="flex items-center text-xl font-semibold text-gray-700">
              <Ruler className="mr-2 h-5 w-5" />
              画面キャリブレーション
            </h2>
            <div className="space-y-4">
              <p className="mb-2 text-sm text-gray-600">
                画面にクレジットカードなどを当てて、下のバーの幅が実際のカードの横幅(85.6mm)と同じになるようにスライダーを調整してください。
              </p>

              <div
                className="flex h-12 items-center justify-center rounded-md bg-blue-600 text-xs font-medium text-white transition-all"
                style={{ width: `${cardUIWidthPx}px` }}
              >
                カード横幅 (85.6mm)
              </div>

              <input
                type="range"
                min="200"
                max="800"
                value={cardUIWidthPx}
                onChange={handleCalibrationChange}
                className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-gray-200"
              />
              <p className="text-right text-xs text-gray-500">
                現在の設定: {pixelsPerMm.toFixed(2)} px/mm
              </p>
            </div>
          </div>

          <div className="space-y-6">
            <h2 className="flex items-center text-xl font-semibold text-gray-700">
              <Camera className="mr-2 h-5 w-5" />
              カメラチェック
            </h2>

            <div className="relative flex aspect-video w-full items-center justify-center overflow-hidden rounded-xl border-2 border-gray-300 bg-gray-200">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`h-full w-full object-cover transform scale-x-[-1] ${
                  cameraActive ? 'opacity-100' : 'opacity-0'
                }`}
              />
              {!cameraActive && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-200 text-gray-400">
                  <Camera className="mb-2 h-10 w-10" />
                  <span>{cameraStatus === 'starting' ? 'カメラを起動中...' : 'カメラの起動待ちです'}</span>
                </div>
              )}

              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <div className="h-1/2 w-1/3 rounded-full border-2 border-dashed border-white/50" />
                <p className="mt-2 rounded bg-black/50 px-2 py-1 text-xs text-white">
                  顔を枠に合わせてください
                </p>
              </div>
            </div>

            {cameraError && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                <p>{cameraError}</p>
                <button
                  type="button"
                  onClick={() => void startCamera()}
                  className="mt-3 inline-flex rounded-md bg-red-600 px-3 py-2 text-white transition hover:bg-red-700"
                >
                  カメラを再試行
                </button>
              </div>
            )}

            <div className="flex items-start rounded-lg bg-blue-50 p-4">
              <Info className="mr-3 mt-0.5 h-5 w-5 flex-shrink-0 text-blue-500" />
              <div className="text-sm text-blue-800">
                <p className="mb-1 font-semibold">テストの準備</p>
                <ul className="list-disc space-y-1 pl-5">
                  <li>画面の中心が子どもの目の高さにくるように調整してください。</li>
                  <li>顔がカメラの中央に収まっていることを確認してください。</li>
                  <li>テスト中は極力顔を動かさず、目で追うようにお声がけしてください。</li>
                </ul>
              </div>
            </div>

            <button
              onClick={() => void handleStart()}
              className="flex w-full items-center justify-center rounded-xl bg-green-600 py-4 text-lg font-bold text-white shadow-md transition-colors hover:bg-green-700"
            >
              {cameraActive ? '検査を開始する' : 'カメラを起動して検査を開始する'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SetupPage;
