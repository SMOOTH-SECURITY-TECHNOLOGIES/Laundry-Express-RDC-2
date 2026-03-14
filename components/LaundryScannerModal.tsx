
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Icon } from './Icon.tsx';
import { useAppContext } from '../context/AppContext.tsx';
import { Article } from '../types.ts';

interface LaundryScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanComplete: (results: { [itemName: string]: number }) => void;
  availableArticles: Article[];
}

type ScannerStatus = 'idle' | 'streaming' | 'capturing' | 'analyzing' | 'error';

export const LaundryScannerModal: React.FC<LaundryScannerModalProps> = ({ isOpen, onClose, onScanComplete, availableArticles }) => {
  const { t, analyzeLaundryImage } = useAppContext();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [status, setStatus] = useState<ScannerStatus>('idle');
  const [error, setError] = useState('');

  const startCamera = useCallback(async () => {
    setStatus('idle');
    setError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setStatus('streaming');
      }
    } catch (err) {
      console.error("Camera access error:", err);
      setError(t('laundryScannerModal.cameraDenied'));
      setStatus('error');
    }
  }, [t]);

  const stopCamera = useCallback(() => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [isOpen, startCamera, stopCamera]);

  const handleCapture = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    setStatus('capturing');
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const context = canvas.getContext('2d');
    if (!context) return;
    
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageData = canvas.toDataURL('image/jpeg', 0.8).split(',')[1];
    
    stopCamera();
    setStatus('analyzing');

    try {
      const results = await analyzeLaundryImage(imageData, availableArticles);
      const quantityMap: { [key: string]: number } = {};
      results.forEach((item: { itemName: string, quantity: number }) => {
        quantityMap[item.itemName] = item.quantity;
      });
      onScanComplete(quantityMap);
    } catch (err) {
      console.error("AI analysis error:", err);
      setError(t('laundryScannerModal.error'));
      setStatus('error');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex flex-col p-4 animate-fade-in">
      <div className="flex justify-between items-center text-white mb-4">
        <h2 className="text-xl font-bold">{t('laundryScannerModal.title')}</h2>
        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full">
          <Icon name="xmark" className="w-6 h-6" />
        </button>
      </div>

      <div className="flex-grow relative rounded-2xl overflow-hidden bg-slate-900 flex items-center justify-center">
        <video 
          ref={videoRef} 
          autoPlay 
          playsInline 
          className={`w-full h-full object-cover ${status !== 'streaming' ? 'opacity-30' : ''}`}
        />
        <canvas ref={canvasRef} className="hidden" />

        {status === 'idle' && !error && (
          <div className="absolute inset-0 flex items-center justify-center">
             <div className="w-12 h-12 border-4 border-brand-blue border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}

        {status === 'streaming' && (
          <div className="absolute inset-0 border-2 border-white/30 pointer-events-none">
            <div className="absolute inset-0 flex items-center justify-center">
               <div className="w-64 h-64 border-2 border-brand-blue rounded-3xl opacity-50"></div>
            </div>
            <p className="absolute bottom-10 left-0 right-0 text-center text-white text-sm bg-black/40 py-2 backdrop-blur-sm">
              {t('laundryScannerModal.instructions')}
            </p>
          </div>
        )}

        {status === 'analyzing' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 text-white p-6 text-center space-y-4">
            <div className="w-16 h-16 border-4 border-brand-blue border-t-transparent rounded-full animate-spin"></div>
            <p className="text-lg font-bold">{t('laundryScannerModal.analyzing')}</p>
          </div>
        )}

        {status === 'error' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 text-white p-6 text-center space-y-6">
            <Icon name="exclamation-circle" className="w-16 h-16 text-red-500" />
            <p className="text-lg font-semibold">{error}</p>
            <button 
              onClick={startCamera}
              className="px-8 py-3 bg-brand-blue text-white font-bold rounded-xl shadow-lg"
            >
              {t('laundryScannerModal.tryAgain')}
            </button>
          </div>
        )}
      </div>

      <div className="h-32 flex items-center justify-center space-x-6">
        {status === 'streaming' && (
          <button 
            onClick={handleCapture}
            className="w-20 h-20 rounded-full bg-white border-[6px] border-slate-300 shadow-2xl flex items-center justify-center group active:scale-95 transition-all"
          >
            <div className="w-14 h-14 rounded-full bg-brand-blue group-hover:bg-brand-dark transition-colors"></div>
          </button>
        )}
      </div>
    </div>
  );
};
