import { useEffect, useRef, useState } from 'react';
import * as faceapi from 'face-api.js';
import { Camera, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface FaceCaptureProps {
  onCapture: (descriptor: string) => void;
  label?: string;
}

export default function FaceCapture({ onCapture, label = "Face ID" }: FaceCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [captured, setCaptured] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadModels = async () => {
      console.log('FACE-API: Starting model load from /models (OPTIMIZED)');
      setError(null);
      try {
        const MODEL_URL = '/models';
        
        console.log('FACE-API: Loading tinyFaceDetector...');
        await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
        console.log('FACE-API: tinyFaceDetector loaded');
        
        console.log('FACE-API: Loading faceLandmark68Net...');
        await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
        console.log('FACE-API: faceLandmark68Net loaded');
        
        console.log('FACE-API: Loading faceRecognitionNet...');
        await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);
        console.log('FACE-API: faceRecognitionNet loaded');
        
        setModelsLoaded(true);
        console.log('FACE-API: ALL MODELS LOADED SUCCESSFULLY');
      } catch (err) {
        console.error('FACE-API: CRITICAL ERROR LOADING MODELS:', err);
        setError(`Loading failed: ${err instanceof Error ? err.message : 'Check console'}`);
      }
    };
    loadModels();
  }, []);

  const startVideo = async () => {
    setError(null);
    setIsCapturing(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: {} });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error('Error accessing webcam:', err);
      setError('Camera access denied or not found.');
      setIsCapturing(false);
    }
  };

  const captureFace = async () => {
    if (!videoRef.current || !modelsLoaded) return;

    try {
      const detection = await faceapi
        .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (detection) {
        const descriptorStr = JSON.stringify(Array.from(detection.descriptor));
        onCapture(descriptorStr);
        setCaptured(true);
        setIsCapturing(false);
        
        // Stop the video stream
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
        
        toast.success('Face captured successfully!');
      } else {
        toast.error('No face detected. Please try again.');
      }
    } catch (err) {
      console.error('Error during face detection:', err);
      toast.error('Recognition error. Please try again.');
    }
  };

  if (!modelsLoaded) {
    return (
      <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-border rounded-xl bg-muted/30">
        <RefreshCw className="animate-spin text-primary mb-2" size={24} />
        <p className="text-sm text-muted-foreground">Loading Face ID models...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative aspect-video rounded-xl bg-black overflow-hidden border-2 border-border shadow-inner">
        {isCapturing ? (
          <video
            ref={videoRef}
            autoPlay
            muted
            onPlay={() => console.log('Video playing')}
            className="w-full h-full object-cover"
          />
        ) : captured ? (
          <div className="w-full h-full flex flex-col items-center justify-center bg-success/10">
            <CheckCircle2 size={48} className="text-success mb-2" />
            <p className="font-semibold text-success">Face ID Ready</p>
          </div>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-muted/20">
            {error ? (
              <>
                <AlertCircle size={40} className="text-destructive mb-2" />
                <p className="text-sm text-destructive">{error}</p>
              </>
            ) : (
              <>
                <Camera size={40} className="text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground text-center px-4">
                  Position your face clearly in the camera view
                </p>
              </>
            )}
          </div>
        )}
      </div>

      {!captured && (
        <button
          type="button"
          onClick={isCapturing ? captureFace : startVideo}
          className={`w-full py-2.5 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all shadow-glow ${
            isCapturing 
              ? 'gradient-accent text-accent-foreground' 
              : 'gradient-primary text-primary-foreground'
          }`}
        >
          {isCapturing ? (
            <><RefreshCw className="animate-pulse" size={18} /> Analyze Face</>
          ) : (
            <><Camera size={18} /> {error ? 'Retry Camera' : `Setup ${label}`}</>
          )}
        </button>
      )}

      {captured && (
        <button
          type="button"
          onClick={() => { setCaptured(false); startVideo(); }}
          className="w-full py-2 text-xs text-muted-foreground hover:text-primary transition-colors flex items-center justify-center gap-1"
        >
          <RefreshCw size={12} /> Retake Photo
        </button>
      )}
    </div>
  );
}
