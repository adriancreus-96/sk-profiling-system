import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, QrCode, CheckCircle, AlertCircle, Camera } from 'lucide-react';
import jsQR from 'jsqr';

const API_URL = import.meta.env.VITE_API_URL

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

const QRScannerModal: React.FC<QRScannerModalProps> = ({
  event,
  isOpen,
  onClose,
  onAttendanceMarked
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [scanning, setScanning] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [lastScanResult, setLastScanResult] = useState<ScanResult | null>(null);
  const [processing, setProcessing] = useState(false);
  const scanIntervalRef = useRef<number | null>(null);
  
  // Duplicate scan prevention
  const lastScannedCodeRef = useRef<string | null>(null);
  const lastScanTimeRef = useRef<number>(0);

  useEffect(() => {
    if (isOpen) {
      startCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen]);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' } // Use back camera on mobile
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play();
      }
      
      setStream(mediaStream);
      setScanning(true);
      startScanning();
    } catch (error) {
      console.error('Error accessing camera:', error);
      alert('Unable to access camera. Please grant camera permissions.');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    setScanning(false);
    
    // Clear cooldown when closing scanner
    lastScannedCodeRef.current = null;
    lastScanTimeRef.current = 0;
  };

  const startScanning = () => {
    scanIntervalRef.current = window.setInterval(() => {
      scanQRCode();
    }, 300); // Scan every 300ms
  };

  const scanQRCode = () => {
    if (!videoRef.current || !canvasRef.current || processing) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context || video.readyState !== video.HAVE_ENOUGH_DATA) return;

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Get image data
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);

    // Scan for QR code
    const code = jsQR(imageData.data, imageData.width, imageData.height);

    if (code && code.data) {
      handleQRCodeDetected(code.data);
    }
  };

  const handleQRCodeDetected = async (qrData: string) => {
    if (processing) return;

    // Prevent duplicate scans within 5 seconds
    const now = Date.now();
    const COOLDOWN_MS = 5000; // 5 seconds
    
    if (
      lastScannedCodeRef.current === qrData && 
      now - lastScanTimeRef.current < COOLDOWN_MS
    ) {
      console.log('Duplicate scan detected, ignoring...');
      return;
    }

    // Update last scanned code and time
    lastScannedCodeRef.current = qrData;
    lastScanTimeRef.current = now;

    setProcessing(true);
    setScanning(false);

    try {
      // Parse QR code data - expecting SK ID number
      let skIdNumber: string;
      
      try {
        const parsed = JSON.parse(qrData);
        skIdNumber = parsed.skIdNumber || parsed.skId || parsed.id;
      } catch {
        // If not JSON, assume it's a plain SK ID
        skIdNumber = qrData;
      }

      if (!skIdNumber) {
        setLastScanResult({
          success: false,
          message: 'Invalid QR code format'
        });
        setTimeout(() => {
          setProcessing(false);
          setScanning(true);
        }, 2000);
        return;
      }

      // Call backend to mark attendance
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_URL}/api/events/attendance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          eventId: event.eventId,
          skIdNumber: skIdNumber
        })
      });

      const data = await response.json();

      if (response.ok) {
        // Check if user was a walk-in (not pre-registered)
        const isWalkIn = data.wasPreRegistered === false;
        
        setLastScanResult({
          success: true,
          message: isWalkIn 
            ? 'Walk-in attendance marked! (Half points awarded)' 
            : 'Attendance marked successfully!',
          userName: data.user?.name,
          skIdNumber: data.user?.skIdNumber,
          pointsAwarded: data.pointsAwarded
        });
        
        // Trigger refresh of attendance list
        onAttendanceMarked();

        // Resume scanning after 3 seconds
        setTimeout(() => {
          setLastScanResult(null);
          setProcessing(false);
          setScanning(true);
        }, 3000);
      } else {
        setLastScanResult({
          success: false,
          message: data.message || 'Failed to mark attendance'
        });

        // Clear the cooldown on error so user can retry immediately
        lastScannedCodeRef.current = null;
        lastScanTimeRef.current = 0;

        setTimeout(() => {
          setLastScanResult(null);
          setProcessing(false);
          setScanning(true);
        }, 2000);
      }
    } catch (error) {
      console.error('Error marking attendance:', error);
      setLastScanResult({
        success: false,
        message: 'Network error. Please try again.'
      });

      // Clear the cooldown on error
      lastScannedCodeRef.current = null;
      lastScanTimeRef.current = 0;

      setTimeout(() => {
        setLastScanResult(null);
        setProcessing(false);
        setScanning(true);
      }, 2000);
    }
  };

  const handleClose = () => {
    stopCamera();
    onClose();
  };

  if (!isOpen) return null;

  const modalContent = (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/80">
      <div className="relative bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-green-700 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <QrCode className="w-6 h-6 text-white" />
            <div>
              <h2 className="text-xl font-bold text-white">Scan QR Code</h2>
              <p className="text-sm text-green-100">{event.title}</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-white/80 hover:text-white hover:bg-white/20 p-2 rounded-full transition-all"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Camera View */}
        <div className="relative bg-black">
          <video
            ref={videoRef}
            className="w-full h-96 object-cover"
            playsInline
            muted
          />
          <canvas ref={canvasRef} className="hidden" />

          {/* Scanning Overlay */}
          {scanning && !lastScanResult && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="relative w-64 h-64">
                {/* Corner Brackets */}
                <div className="absolute top-0 left-0 w-12 h-12 border-t-4 border-l-4 border-green-400 rounded-tl-lg"></div>
                <div className="absolute top-0 right-0 w-12 h-12 border-t-4 border-r-4 border-green-400 rounded-tr-lg"></div>
                <div className="absolute bottom-0 left-0 w-12 h-12 border-b-4 border-l-4 border-green-400 rounded-bl-lg"></div>
                <div className="absolute bottom-0 right-0 w-12 h-12 border-b-4 border-r-4 border-green-400 rounded-br-lg"></div>
                
                {/* Scanning Line */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-full h-0.5 bg-green-400 animate-pulse"></div>
                </div>
              </div>
            </div>
          )}

          {/* Status Text */}
          <div className="absolute bottom-4 left-0 right-0 flex justify-center">
            <div className="bg-black/60 backdrop-blur-sm px-4 py-2 rounded-full">
              <div className="flex items-center gap-2 text-white text-sm">
                <Camera className="w-4 h-4" />
                <span>{scanning ? 'Position QR code in frame' : 'Processing...'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Scan Result */}
        {lastScanResult && (
          <div className={`p-6 border-t-4 ${lastScanResult.success ? 'bg-green-50 border-green-500' : 'bg-red-50 border-red-500'}`}>
            <div className="flex items-start gap-4">
              {lastScanResult.success ? (
                <CheckCircle className="w-8 h-8 text-green-600 shrink-0" />
              ) : (
                <AlertCircle className="w-8 h-8 text-red-600 shrink-0" />
              )}
              <div className="flex-1">
                <h3 className={`text-lg font-bold mb-1 ${lastScanResult.success ? 'text-green-800' : 'text-red-800'}`}>
                  {lastScanResult.success ? 'Success!' : 'Error'}
                </h3>
                <p className={`text-sm mb-2 ${lastScanResult.success ? 'text-green-700' : 'text-red-700'}`}>
                  {lastScanResult.message}
                </p>
                {lastScanResult.success && (
                  <div className="space-y-1 text-sm text-green-700">
                    {lastScanResult.userName && (
                      <p className="font-semibold">👤 {lastScanResult.userName}</p>
                    )}
                    {lastScanResult.skIdNumber && (
                      <p className="font-mono text-xs">ID: {lastScanResult.skIdNumber}</p>
                    )}
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

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              <span>Camera Active</span>
            </div>
            <div className="text-right">
              <p className="font-semibold text-gray-800">📅 {new Date(event.eventDate).toLocaleDateString()}</p>
              <p className="text-xs">📍 {event.location}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default QRScannerModal;