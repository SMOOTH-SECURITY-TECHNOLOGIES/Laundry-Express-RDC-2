import React, { useState, useRef } from 'react';
import { Icon } from './Icon';
import { ServiceType } from '../types';

interface FabricResult {
  fabricType: string;
  confidence: number;
  treatment: string;
  washMethod: string;
  temperature: string;
  serviceSuggestion: ServiceType;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (suggestedService: ServiceType) => void;
}

type Status = 'idle' | 'streaming' | 'capturing' | 'analyzing' | 'results' | 'error';

const fabricIcons: Record<string, string> = {
  cotton: 'shirt', silk: 'sparkles', linen: 'shirt', polyester: 'shirt',
  wool: 'shirt', denim: 'shirt', 'synthetic blend': 'shirt', other: 'shirt',
};

export const FabricAnalysisModal: React.FC<Props> = ({ isOpen, onClose, onComplete }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState('');
  const [result, setResult] = useState<FabricResult | null>(null);

  if (!isOpen) return null;

  const startCamera = async () => {
    setStatus('idle');
    setError('');
    setResult(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setStatus('streaming');
      }
    } catch {
      setError('Camera not available');
      setStatus('error');
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
      videoRef.current.srcObject = null;
    }
  };

  const capture = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    setStatus('capturing');
    const canvas = canvasRef.current;
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    canvas.getContext('2d')?.drawImage(videoRef.current, 0, 0);
    const imageData = canvas.toDataURL('image/jpeg', 0.8).split(',')[1];
    stopCamera();
    setStatus('analyzing');
    try {
      const { apiAnalyzeFabric } = await import('../constants');
      const res = await apiAnalyzeFabric(imageData);
      setResult(res);
      setStatus('results');
    } catch {
      setError('Analysis failed');
      setStatus('error');
    }
  };

  const close = () => { stopCamera(); setStatus('idle'); setResult(null); onClose(); };

  const bg = status === 'streaming' ? 'bg-black' : 'bg-white dark:bg-slate-900';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4" onClick={close}>
      <div className={`relative w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden ${bg}`} onClick={(e) => e.stopPropagation()}>
        <button onClick={close} className="absolute right-3 top-3 z-10 rounded-full bg-black/40 p-2 text-white hover:bg-black/60">
          <Icon name="xmark" className="h-5 w-5" />
        </button>

        {status === 'idle' && (
          <div className="p-8 text-center space-y-4">
            <Icon name="sparkles" className="mx-auto h-12 w-12 text-[#005bd8]" />
            <h2 className="text-xl font-black">Fabric Intelligence</h2>
            <p className="text-sm text-content-muted">Detect fabric type and get treatment recommendations.</p>
            <button onClick={startCamera} className="rounded-2xl bg-[#005bd8] px-6 py-3 font-black text-white">Open Camera</button>
          </div>
        )}

        {status === 'streaming' && (
          <div className="relative">
            <video ref={videoRef} autoPlay playsInline className="w-full" />
            <button onClick={capture} className="absolute bottom-6 left-1/2 -translate-x-1/2 h-16 w-16 rounded-full border-4 border-white bg-[#005bd8] shadow-lg hover:bg-[#004bb5]">
              <Icon name="camera" className="mx-auto h-7 w-7 text-white" />
            </button>
          </div>
        )}

        {(status === 'capturing' || status === 'analyzing') && (
          <div className="p-8 text-center space-y-3">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-[#005bd8] border-t-transparent" />
            <p className="font-bold">{status === 'capturing' ? 'Capturing...' : 'Analyzing fabric...'}</p>
          </div>
        )}

        {status === 'error' && (
          <div className="p-8 text-center space-y-3">
            <Icon name="warning" className="mx-auto h-10 w-10 text-red-500" />
            <p className="font-bold text-red-500">{error}</p>
            <button onClick={startCamera} className="rounded-2xl bg-[#005bd8] px-6 py-3 font-black text-white">Retry</button>
          </div>
        )}

        {status === 'results' && result && (
          <div className="p-6 space-y-4">
            <div className="text-center">
              <Icon name={(fabricIcons[result.fabricType] || 'shirt') as any} className="mx-auto h-10 w-10 text-[#005bd8]" />
              <h3 className="mt-2 text-lg font-black">{result.fabricType}</h3>
              <p className="text-sm text-content-muted">{Math.round(result.confidence * 100)}% confidence</p>
            </div>
            <div className="space-y-2">
              {[
                ['Wash Method', result.washMethod],
                ['Temperature', result.temperature],
                ['Treatment', result.treatment],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between rounded-xl bg-surface-muted px-4 py-2.5 text-sm">
                  <span className="font-bold text-content-muted">{label}</span>
                  <span className="font-black">{value}</span>
                </div>
              ))}
            </div>
            <button onClick={() => { onComplete(result.serviceSuggestion); close(); }} className="w-full rounded-2xl bg-[#005bd8] py-3 font-black text-white">
              Use {result.serviceSuggestion} Service
            </button>
          </div>
        )}

        <canvas ref={canvasRef} className="hidden" />
      </div>
    </div>
  );
};
