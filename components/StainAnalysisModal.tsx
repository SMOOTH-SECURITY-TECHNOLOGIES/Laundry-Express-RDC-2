import React, { useState, useEffect, useRef } from 'react';
import { Icon } from './Icon';
import { ServiceType } from '../types';
import { useAppContext } from '../context/AppContext';

interface StainAnalysisResult {
  stainType: string;
  confidence: number;
  recommendation: string;
  serviceSuggestion: ServiceType;
}

interface StainAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (suggestedService: ServiceType) => void;
}

type Status = 'idle' | 'streaming' | 'capturing' | 'analyzing' | 'results' | 'error';

export const StainAnalysisModal: React.FC<StainAnalysisModalProps> = ({ isOpen, onClose, onComplete }) => {
  const { t, analyzeStainImage } = useAppContext();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState('');
  const [analysisResult, setAnalysisResult] = useState<StainAnalysisResult | null>(null);

  const startCamera = async () => {
    setStatus('idle');
    setError('');
    setAnalysisResult(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setStatus('streaming');
      }
    } catch (err) {
      console.error("Camera error:", err);
      setError(t('laundryScannerModal.noCamera'));
      setStatus('error');
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
  };

  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
      setStatus('idle');
      setError('');
    }
    return () => stopCamera();
  }, [isOpen]);
  
  const handleCaptureAndAnalyze = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    setStatus('capturing');

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext('2d');
    context?.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageData = canvas.toDataURL('image/jpeg', 0.8).split(',')[1];
    stopCamera();
    setStatus('analyzing');

    try {
        const result = await analyzeStainImage(imageData);
        setAnalysisResult(result);
        setStatus('results');
    } catch (err) {
        console.error("AI analysis error:", err);
        setError(t('laundryScannerModal.error'));
        setStatus('error');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl max-w-lg w-full relative animate-slide-up flex flex-col max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
        <div className="p-4 border-b dark:border-slate-800 flex justify-between items-center">
             <h2 className="text-xl font-bold text-brand-dark dark:text-slate-100">{t('stainAnalysisModal.title')}</h2>
             <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300">
                <Icon name="xmark" className="w-6 h-6"/>
            </button>
        </div>

        {status !== 'results' && (
            <div className="flex-grow flex items-center justify-center relative overflow-hidden rounded-b-2xl bg-black">
                <video ref={videoRef} autoPlay playsInline className={`w-full h-full object-cover ${status !== 'streaming' ? 'opacity-20' : ''}`}></video>
                <canvas ref={canvasRef} className="hidden"></canvas>
                
                {status === 'analyzing' && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-white bg-black/50 space-y-4">
                        <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-lg font-semibold">{t('stainAnalysisModal.analyzing')}</p>
                    </div>
                )}

                {status === 'error' && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-white bg-black/70 space-y-4 p-4 text-center">
                        <Icon name="exclamation-circle" className="w-12 h-12 text-red-400" />
                        <p className="text-lg font-semibold">{error}</p>
                        <button onClick={startCamera} className="px-4 py-2 bg-brand-blue rounded-lg font-semibold">{t('stainAnalysisModal.tryAgain')}</button>
                    </div>
                )}
            </div>
        )}

        {status === 'results' && analysisResult && (
            <div className="p-6 space-y-4 overflow-y-auto">
                <h3 className="text-lg font-bold text-center">{t('stainAnalysisModal.resultTitle')}</h3>
                <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg border dark:border-slate-700">
                    <p className="text-sm text-slate-500 dark:text-slate-400">{t('stainAnalysisModal.probableStain')}</p>
                    <p className="text-xl font-semibold text-brand-dark dark:text-slate-100">{analysisResult.stainType}</p>
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-300">({t('stainAnalysisModal.confidence')}: {Math.round(analysisResult.confidence * 100)}%)</p>
                </div>
                 <div className="p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg border border-blue-200 dark:border-blue-700">
                    <p className="text-sm text-blue-800 dark:text-blue-200 font-semibold">{t('stainAnalysisModal.recommendation')}:</p>
                    <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">{analysisResult.recommendation}</p>
                </div>
            </div>
        )}
        
        <div className="p-4 border-t dark:border-slate-800 flex items-center justify-center space-x-4">
            {status === 'streaming' && (
                 <button onClick={handleCaptureAndAnalyze} className="w-20 h-20 rounded-full bg-white flex items-center justify-center ring-4 ring-white/30" aria-label={t('laundryScannerModal.capture')}>
                    <div className="w-16 h-16 rounded-full bg-white border-4 border-slate-900"></div>
                </button>
            )}
            {status === 'results' && analysisResult && (
                <>
                    <button onClick={onClose} className="px-6 py-2 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-100 font-semibold rounded-lg">{t('stainAnalysisModal.close')}</button>
                    <button 
                        onClick={() => onComplete(analysisResult.serviceSuggestion)}
                        className="px-6 py-2 bg-brand-success text-white font-bold rounded-lg"
                    >
                         {analysisResult.serviceSuggestion === ServiceType.PRESSING ? t('stainAnalysisModal.addToDryCleaning') : t('stainAnalysisModal.addToLaundry')}
                    </button>
                </>
            )}
             {(status === 'error' || status === 'analyzing' || status === 'capturing') && (
                 <button onClick={onClose} className="text-slate-600 dark:text-slate-300 font-semibold bg-slate-100 dark:bg-slate-800 px-6 py-2 rounded-full">{t('stainAnalysisModal.cancel')}</button>
            )}
        </div>
      </div>
    </div>
  );
};