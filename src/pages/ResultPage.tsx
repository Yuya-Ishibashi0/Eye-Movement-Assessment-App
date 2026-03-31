import React, { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, PlayCircle, RefreshCw } from 'lucide-react';
import { useEvaluationStore } from '../store/evaluationStore';

interface RecordedVideoProps {
  blob: Blob;
}

const RecordedVideo: React.FC<RecordedVideoProps> = ({ blob }) => {
  const videoUrl = useMemo(() => URL.createObjectURL(blob), [blob]);

  useEffect(() => {
    return () => {
      URL.revokeObjectURL(videoUrl);
    };
  }, [videoUrl]);

  return <video src={videoUrl} controls className="h-full w-full object-cover" />;
};

const ResultPage: React.FC = () => {
  const navigate = useNavigate();
  const { subjectInfo, records, resetSession } = useEvaluationStore();

  const recordKeys = Object.keys(records);

  const handleDownloadVideo = (taskName: string, blob: Blob | null) => {
    if (!blob) {
      return;
    }

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${subjectInfo.id}_${taskName}_${new Date().getTime()}.webm`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownloadAll = () => {
    let csvContent = 'data:text/csv;charset=utf-8,TaskName,Event,Timestamp\n';

    recordKeys.forEach((key) => {
      const record = records[key];
      record.logs.forEach((log) => {
        csvContent += `${record.taskName},${log.event},${log.time}\n`;
      });
      handleDownloadVideo(record.taskName, record.videoBlob);
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.href = encodedUri;
    link.download = `${subjectInfo.id}_logs.csv`;
    link.click();
  };

  const handleRestart = () => {
    if (window.confirm('現在のデータは消去されます。よろしいですか？')) {
      resetSession();
      navigate('/');
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center bg-gray-50 px-4 py-10">
      <div className="w-full max-w-4xl rounded-xl bg-white p-8 shadow-lg">
        <h1 className="mb-8 border-b pb-4 text-3xl font-bold text-gray-800">検査結果サマリー</h1>

        <div className="mb-8 grid grid-cols-2 gap-4 rounded-lg bg-blue-50 p-4 md:grid-cols-4">
          <div>
            <span className="block text-xs text-gray-500">被験者ID</span>
            <span className="font-semibold text-gray-800">{subjectInfo.id || '未設定'}</span>
          </div>
          <div>
            <span className="block text-xs text-gray-500">年齢</span>
            <span className="font-semibold text-gray-800">{subjectInfo.age || '-'}</span>
          </div>
          <div>
            <span className="block text-xs text-gray-500">検査日</span>
            <span className="font-semibold text-gray-800">{subjectInfo.date}</span>
          </div>
          <div>
            <span className="block text-xs text-gray-500">検査者</span>
            <span className="font-semibold text-gray-800">{subjectInfo.examiner || '-'}</span>
          </div>
        </div>

        {recordKeys.length === 0 ? (
          <div className="py-12 text-center text-gray-500">
            <p>保存された記録がありません。途中で中断されたか、課題が実行されていません。</p>
          </div>
        ) : (
          <div className="space-y-6">
            <h2 className="mb-4 text-xl font-bold text-gray-700">録画データ</h2>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {recordKeys.map((key) => {
                const record = records[key];
                const hasVideo = !!record.videoBlob && record.videoBlob.size > 0;

                return (
                  <div key={key} className="flex flex-col rounded-xl border bg-gray-50 p-4 shadow-sm">
                    <h3 className="mb-2 text-lg font-bold text-gray-800">{record.taskName}</h3>
                    <div className="mb-4 flex aspect-video items-center justify-center overflow-hidden rounded-lg bg-black">
                      {hasVideo ? (
                        <RecordedVideo blob={record.videoBlob!} />
                      ) : (
                        <div className="flex flex-col items-center text-gray-500">
                          <PlayCircle className="mb-2 h-8 w-8 opacity-50" />
                          <span className="text-sm">録画データなし</span>
                        </div>
                      )}
                    </div>
                    {hasVideo && (
                      <button
                        onClick={() => handleDownloadVideo(record.taskName, record.videoBlob)}
                        className="mt-auto flex w-full items-center justify-center rounded bg-gray-200 py-2 font-semibold text-gray-800 transition hover:bg-gray-300"
                      >
                        <Download className="mr-2 h-4 w-4" />
                        動画を保存
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t pt-6 sm:flex-row">
              <button
                onClick={handleRestart}
                className="flex items-center font-medium text-gray-600 hover:text-gray-900"
              >
                <RefreshCw className="mr-2 h-5 w-5" />
                新しい検査を始める
              </button>

              <button
                onClick={handleDownloadAll}
                className="flex items-center rounded-lg bg-blue-600 px-6 py-3 font-bold text-white shadow-md transition hover:bg-blue-700"
              >
                <Download className="mr-2 h-5 w-5" />
                すべてのデータ（動画＋CSVログ）をダウンロード
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResultPage;
