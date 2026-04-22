import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, QrCode, CheckCircle, AlertCircle, Camera } from 'lucide-react';
import jsQR from 'jsqr';

const API_URL = import.meta.env.VITE_API_URL || "localhost:5173"

interface Event {
  _id: string;
  eventId: string;
  title: string;
  eventDate: string;
  location: string;
  pointsReward: number;
}

interface QRScannerModalProps {
  event: Event;
  isOpen: boolean;
  onClose: () => void;
  onAttendanceMarked: () => void;
}

interface ScanResult {
  success: boolean;
  message: string;
  userName?: string;
  skIdNumber?: string;
  pointsAwarded?: number;
}

const QRScannerModal: React.FC<QRScannerModalProps> = ({ event, isOpen, onClose, onAttendanceMarked }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [scanning, setScanning] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [lastScanResult, setLastScanResult] = useState<ScanResult | null>(null);
  const [processing, setProcessing] = useState(false);
  const scanIntervalRef = useRef<number | null>(null);
  const lastScannedCodeRef = useRef<string | null>(null);
  const lastScanTimeRef = useRef<number>(0);

  useEffect(() => {
    if (isOpen) startCamera();
    return () => stopCamera();
  }, [isOpen]);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) { videoRef.current.srcObject = mediaStream; videoRef.current.play(); }
      setStream(mediaStream);
      setScanning(true);
      scanIntervalRef.current = window.setInterval(scanQRCode, 300);
    } catch {
      alert('Unable to access camera. Please grant camera permissions.');
    }
  };

  const stopCamera = () => {
    stream?.getTracks().forEach(t => t.stop());
    setStream(null);
    if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);
    scanIntervalRef.current = null;
    setScanning(false);
    lastScannedCodeRef.current = null;
    lastScanTimeRef.current = 0;
  };

  const scanQRCode = () => {
    if (!videoRef.current || !canvasRef.current || processing) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx || video.readyState !== video.HAVE_ENOUGH_DATA) return;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(imageData.data, imageData.width, imageData.height);
    if (code?.data) handleQRCodeDetected(code.data);
  };

  const handleQRCodeDetected = async (qrData: string) => {
    if (processing) return;
    const now = Date.now();
    if (lastScannedCodeRef.current === qrData && now - lastScanTimeRef.current < 5000) return;
    lastScannedCodeRef.current = qrData;
    lastScanTimeRef.current = now;
    setProcessing(true);
    setScanning(false);

    try {
      let skIdNumber: string;
      try { const p = JSON.parse(qrData); skIdNumber = p.skIdNumber || p.skId || p.id; }
      catch { skIdNumber = qrData; }

      if (!skIdNumber) {
        setLastScanResult({ success: false, message: 'Invalid QR code format' });
        setTimeout(() => { setProcessing(false); setScanning(true); }, 2000);
        return;
      }

      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_URL}/api/events/attendance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ eventId: event.eventId, skIdNumber })
      });
      const data = await response.json();

      if (response.ok) {
        setLastScanResult({
          success: true,
          message: data.wasPreRegistered === false ? 'Walk-in attendance marked! (Half points awarded)' : 'Attendance marked successfully!',
          userName: data.user?.name,
          skIdNumber: data.user?.skIdNumber,
          pointsAwarded: data.pointsAwarded
        });
        onAttendanceMarked();
        setTimeout(() => { setLastScanResult(null); setProcessing(false); setScanning(true); }, 3000);
      } else {
        setLastScanResult({ success: false, message: data.message || 'Failed to mark attendance' });
        lastScannedCodeRef.current = null;
        lastScanTimeRef.current = 0;
        setTimeout(() => { setLastScanResult(null); setProcessing(false); setScanning(true); }, 2000);
      }
    } catch {
      setLastScanResult({ success: false, message: 'Network error. Please try again.' });
      lastScannedCodeRef.current = null;
      lastScanTimeRef.current = 0;
      setTimeout(() => { setLastScanResult(null); setProcessing(false); setScanning(true); }, 2000);
    }
  };

  if (!isOpen) return null;

  const modalContent = (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/80">
      <div className="relative bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden">

        {/* HEADER */}
        <div className="flex items-center justify-between px-6 py-5 bg-gradient-to-r from-[#007EA7] to-[#003459] border-b border-[#005f80]">
          <div className="flex items-center gap-3">
            <QrCode className="w-6 h-6 text-white" />
            <div>
              <h2 className="text-xl font-bold text-white font-fugaz tracking-wide">Scan QR Code</h2>
              <p className="text-sm text-white/70 font-work">{event.title}</p>
            </div>
          </div>
          <button onClick={() => { stopCamera(); onClose(); }}
            className="text-white/80 hover:text-white hover:bg-white/20 p-2 rounded-full transition-all">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Camera View */}
        <div className="relative bg-black">
          <video ref={videoRef} className="w-full h-96 object-cover" playsInline muted />
          <canvas ref={canvasRef} className="hidden" />

          {scanning && !lastScanResult && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="relative w-64 h-64">
                <div className="absolute top-0 left-0 w-12 h-12 border-t-4 border-l-4 border-[#5CB0B3] rounded-tl-lg" />
                <div className="absolute top-0 right-0 w-12 h-12 border-t-4 border-r-4 border-[#5CB0B3] rounded-tr-lg" />
                <div className="absolute bottom-0 left-0 w-12 h-12 border-b-4 border-l-4 border-[#5CB0B3] rounded-bl-lg" />
                <div className="absolute bottom-0 right-0 w-12 h-12 border-b-4 border-r-4 border-[#5CB0B3] rounded-br-lg" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-full h-0.5 bg-[#5CB0B3] animate-pulse" />
                </div>
              </div>
            </div>
          )}

          <div className="absolute bottom-4 left-0 right-0 flex justify-center">
            <div className="bg-black/60 backdrop-blur-sm px-4 py-2 rounded-full flex items-center gap-2 text-white text-sm font-work">
              <Camera className="w-4 h-4" />
              <span>{scanning ? 'Position QR code in frame' : 'Processing...'}</span>
            </div>
          </div>
        </div>

        {/* Scan Result */}
        {lastScanResult && (
          <div className={`p-6 border-t-4 ${lastScanResult.success ? 'bg-green-50 border-green-500' : 'bg-red-50 border-red-500'}`}>
            <div className="flex items-start gap-4">
              {lastScanResult.success
                ? <CheckCircle className="w-8 h-8 text-green-600 shrink-0" />
                : <AlertCircle className="w-8 h-8 text-red-600 shrink-0" />}
              <div className="flex-1">
                <h3 className={`text-lg font-bold mb-1 font-fugaz ${lastScanResult.success ? 'text-green-800' : 'text-red-800'}`}>
                  {lastScanResult.success ? 'Success!' : 'Error'}
                </h3>
                <p className={`text-sm mb-2 font-work ${lastScanResult.success ? 'text-green-700' : 'text-red-700'}`}>
                  {lastScanResult.message}
                </p>
                {lastScanResult.success && (
                  <div className="space-y-1 text-sm text-green-700 font-work">
                    {lastScanResult.userName && <p className="font-semibold">👤 {lastScanResult.userName}</p>}
                    {lastScanResult.skIdNumber && <p className="font-mono text-xs">ID: {lastScanResult.skIdNumber}</p>}
                    {lastScanResult.pointsAwarded !== undefined && (
                      <p className="flex items-center gap-1">
                        <span className="text-yellow-600">⭐</span>
                        <span className="font-semibold">+{lastScanResult.pointsAwarded} points awarded</span>
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* FOOTER */}
        <div className="bg-[#EAF4F7] px-6 py-4 border-t border-[#B3D9E5]">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-[#003459] font-work">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span>Camera Active</span>
            </div>
            <div className="text-right font-work">
              <p className="font-semibold text-[#00171F]">📅 {new Date(event.eventDate).toLocaleDateString()}</p>
              <p className="text-xs text-[#007EA7]">📍 {event.location}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default QRScannerModal;