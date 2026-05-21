import React, { useRef, useState } from 'react';
import { useReactToPrint } from 'react-to-print';
import { QRCodeSVG } from 'qrcode.react';
import { X } from 'lucide-react';
import { type UserData } from './UserViewModal';


// Place the SVG templates in your /public folder (e.g. /public/id-front.svg, /public/id-back.svg)
import idFrontSvg from '../assets/3.png';
import idBackSvg from '../assets/4.png';

const API_URL = import.meta.env.VITE_API_URL || 'localhost:5173';

interface PrintIDModuleProps {
  user: UserData;
  onClose: () => void;
  onPrintComplete?: (userId: string) => Promise<void>;
}

// ---------- shared formatters ----------
const formatAddress = (user: UserData) => {
  const parts: string[] = [];
  if (user.block) parts.push(`BLK ${user.block}`);
  if (user.lot) parts.push(`LOT ${user.lot}`);
  if (user.houseNumber) parts.push(`${user.houseNumber}`);
  if (user.purok) parts.push(user.purok);
  return (parts.join(' ') || 'N/A').toUpperCase();
};

const formatMMDDYYYY = (d: Date | string) => {
  const dt = new Date(d);
  return `${String(dt.getMonth() + 1).padStart(2, '0')}/${String(
    dt.getDate(),
  ).padStart(2, '0')}/${dt.getFullYear()}`;
};

const formatIssuance = (user: UserData) =>
  formatMMDDYYYY(user.dateApproved ?? new Date());

// Expiration is fixed at 02/27 per spec
const EXPIRATION_DATE = '02/27';

const getProfilePicture = (user: UserData) => {
  if (user.profilePicture)
    return user.profilePicture.startsWith('http')
      ? user.profilePicture
      : `${API_URL}${user.profilePicture}`;
  return `https://ui-avatars.com/api/?name=${user.firstName}+${user.lastName}&size=400&background=007EA7&color=fff`;
};

// ---------- main modal ----------
const PrintIDModule: React.FC<PrintIDModuleProps> = ({
  user,
  onClose,
  onPrintComplete,
}) => {
  const [isPrinting, setIsPrinting] = useState(false);
  const [printMode, setPrintMode] = useState<'front' | 'back'>('front');

  const frontRef = useRef<HTMLDivElement>(null);
  const backRef = useRef<HTMLDivElement>(null);

  const handlePrintFront = useReactToPrint({
    contentRef: frontRef,
    documentTitle: `SK-ID-FRONT-${user.skIdNumber || user.lastName}`,
    onAfterPrint: async () => {
      setIsPrinting(true);
      if (onPrintComplete) {
        try {
          await onPrintComplete(user._id);
          alert('ID card printed successfully! This user cannot print again.');
          onClose();
        } catch {
          alert(
            'ID printed, but failed to update print status. Please contact administrator.',
          );
        }
      }
      setIsPrinting(false);
    },
  });

  const handlePrintBack = useReactToPrint({
    contentRef: backRef,
    documentTitle: `SK-ID-BACK-${user.skIdNumber || user.lastName}`,
    onAfterPrint: async () => {
      setIsPrinting(false);
    },
  });

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl px-7 py-8 max-w-2xl w-full lg:px-10 lg:py-10 max-h-[95vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-[#00171F] font-fugaz [filter:drop-shadow(0px_2px_50px_#000000)]">
            Print SK ID Card
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Preview */}
        <div className="mb-6 bg-[#EAF4F7] border border-[#B3D9E5] rounded-xl p-4">
          <div className="max-w-md mx-auto space-y-4">
            <IDCardFront user={user} scale={0.40} />
            <IDCardBack user={user} scale={0.40} />
          </div>
        </div>

        {/* Buttons — Print Front | Print Back | Cancel (left to right) */}
        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            disabled={isPrinting}
            className="px-6 py-2.5 text-sm font-semibold text-gray-700 bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 font-work"
          >
            Cancel
          </button>

          <button
            onClick={() => {
              setPrintMode('front');
              setTimeout(handlePrintFront, 0);
            }}
            disabled={isPrinting}
            className="px-6 py-2.5 text-sm font-semibold text-white rounded-lg transition duration-200 shadow-md font-fugaz tracking-[0.05em] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            style={{ background: '#003459' }}
            onMouseOver={(e) => {
              if (!isPrinting)
                (e.currentTarget as HTMLButtonElement).style.background = '#00171F';
            }}
            onMouseOut={(e) => {
              if (!isPrinting)
                (e.currentTarget as HTMLButtonElement).style.background = '#003459';
            }}
          >
            {isPrinting && printMode === 'front' ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                Processing...
              </>
            ) : (
              'Print Front'
            )}
          </button>

          <button
            onClick={() => {
              setPrintMode('back');
              setTimeout(handlePrintBack, 0);
            }}
            disabled={isPrinting}
            className="px-6 py-2.5 text-sm font-semibold text-white rounded-lg transition duration-200 shadow-md font-fugaz tracking-[0.05em] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            style={{ background: '#007EA7' }}
            onMouseOver={(e) => {
              if (!isPrinting)
                (e.currentTarget as HTMLButtonElement).style.background = '#005f7f';
            }}
            onMouseOut={(e) => {
              if (!isPrinting)
                (e.currentTarget as HTMLButtonElement).style.background = '#007EA7';
            }}
          >
            {isPrinting && printMode === 'back' ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                Processing...
              </>
            ) : (
              'Print Back'
            )}
          </button>
        </div>

        {/* Hidden printables — one ref per side, each a single page */}
        <div style={{ display: 'none' }}>
          <div ref={frontRef}>
            <PrintableSingleCard user={user} side="front" />
          </div>
          <div ref={backRef}>
            <PrintableSingleCard user={user} side="back" />
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================
// CARD RENDERER — single source of truth for the layout.
// Base card is 1011 × 638 px (matches your SVG aspect ratio).
// We scale uniformly via a wrapper transform so it works in
// both the on-screen preview and the printed page.
// ============================================================

const CARD_W = 1011;
const CARD_H = 638;

interface IDCardProps {
  user: UserData;
  scale?: number;
}

const IDCardFront: React.FC<IDCardProps> = ({ user, scale = 1 }) => {
  return (
    <div
      style={{
        width: CARD_W * scale,
        height: CARD_H * scale,
        position: 'relative',
        overflow: 'hidden',
        borderRadius: 12 * scale,
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      }}
    >
      <div
        style={{
          width: CARD_W,
          height: CARD_H,
          position: 'absolute',
          top: 0,
          left: 0,
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
          fontFamily: "'Albert Sans', 'Arial Black', sans-serif",
        }}
      >
        {/* Background template */}
        <img
          src={idFrontSvg}
          alt=""
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />

        {/* Profile photo — overlays the white box on the SVG */}
        <div
          style={{
            position: 'absolute',
            left: 71,
            top: 127,
            width: 272,
            height: 363,
            overflow: 'hidden',
            background: '#fff',
          }}
        >
          <img
            src={getProfilePicture(user)}
            alt="Profile"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src =
                `https://ui-avatars.com/api/?name=${user.firstName}+${user.lastName}&size=400&background=007EA7&color=fff`;
            }}
          />
        </div>

        {/* SURNAME value */}
        <div
          style={{
            position: 'absolute',
            left: 373,
            top: 170,
            fontSize: 27,
            fontWeight: 700,
            color: '#FFFFF0',
            letterSpacing: '0.02em',
            lineHeight: 1.1,
            maxWidth: 626 - 373 - 16,
            whiteSpace: 'nowrap',
            textShadow: '0px 1px 0px rgba(0,0,0,0.8), 0px 2px 8px rgba(0,0,0,0.9)',
          }}
        >
          {user.lastName.toUpperCase()}
        </div>

        {/* FIRST NAME value */}
        <div
          style={{
            position: 'absolute',
            left: 628,
            top: 170,
            fontSize: 26,
            fontWeight: 700,
            color: '#FFFFF0',
            letterSpacing: '0.02em',
            lineHeight: 1.1,
            maxWidth: 888 - 626 - 16,
            textShadow: '0px 1px 0px rgba(0,0,0,0.8), 0px 2px 8px rgba(0,0,0,0.9)',
          }}
        >
          {user.firstName.toUpperCase()}
        </div>

        {/* M.I. value */}
        <div
          style={{
            position: 'absolute',
            left: 886,
            top: 165,
            fontSize: 26,
            fontWeight: 700,
            color: '#FFFFF0',
            letterSpacing: '0.02em',
            textShadow: '0px 1px 0px rgba(0,0,0,0.8), 0px 2px 8px rgba(0,0,0,0.9)',
          }}
        >
          {(user.middleName?.charAt(0) || '').toUpperCase()}
          {user.middleName ? '.' : ''}
        </div>

        {/* BIRTH DATE value */}
        <div
          style={{
            position: 'absolute',
            left: 373,
            top: 257,
            fontSize: 26,
            fontWeight: 700,
            color: '#FFFFF0',
            letterSpacing: '0.02em',
            textShadow: '0px 1px 0px rgba(0,0,0,0.8), 0px 2px 8px rgba(0,0,0,0.9)',
          }}
        >
          {formatMMDDYYYY(user.birthday)}
        </div>

        {/* SEX value */}
        <div
          style={{
            position: 'absolute',
            left: 742,
            top: 257,
            fontSize: 26,
            fontWeight: 700,
            color: '#FFFFF0',
            letterSpacing: '0.02em',
            maxWidth: 220,
            textShadow: '0px 1px 0px rgba(0,0,0,0.8), 0px 2px 8px rgba(0,0,0,0.9)',
          }}
        >
          {user.sex.toUpperCase()}
        </div>

        {/* SUFFIX value */}
        <div
          style={{
            position: 'absolute',
            left: 888,
            top: 257,
            fontSize: 26,
            fontWeight: 700,
            color: '#FFFFF0',
            letterSpacing: '0.02em',
            maxWidth: 110,
            textShadow: '0px 1px 0px rgba(0,0,0,0.8), 0px 2px 8px rgba(0,0,0,0.9)',
          }}
        >
          {(user.suffix && user.suffix.trim()) ? user.suffix.toUpperCase() : '-'}
        </div>

        {/* ADDRESS value */}
        <div
          style={{
            position: 'absolute',
            left: 373,
            top: 347,
            fontSize: 26,
            fontWeight: 700,
            color: '#fffff0',
            letterSpacing: '0.02em',
            maxWidth: 580,
            whiteSpace: 'nowrap',
            textShadow: '0px 1px 0px rgba(0,0,0,0.8), 0px 2px 8px rgba(0,0,0,0.9)',
          }}
        >
          {formatAddress(user)}
        </div>

        {/* ISSUANCE DATE value */}
        <div
          style={{
            position: 'absolute',
            left: 373,
            top: 435,
            fontSize: 26,
            fontWeight: 700,
            color: '#FFFFF0',
            letterSpacing: '0.02em',
            textShadow: '0px 1px 0px rgba(0,0,0,0.8), 0px 2px 8px rgba(0,0,0,0.9)',
          }}
        >
          {formatIssuance(user)}
        </div>

        {/* EXPIRATION DATE value */}
        <div
          style={{
            position: 'absolute',
            left: 626,
            top: 435,
            fontSize: 26,
            fontWeight: 700,
            color: '#FFFFF0',
            letterSpacing: '0.02em',
            textShadow: '0px 1px 0px rgba(0,0,0,0.8), 0px 2px 8px rgba(0,0,0,0.9)',
          }}
        >
          {EXPIRATION_DATE}
        </div>

        {/* SK ID value */}
        <div
          style={{
            position: 'absolute',
            left: 55,
            top: 543,
            fontSize: 30,
            fontWeight: 700,
            color: '#FFFFF0',
            letterSpacing: '0.02em',
            textShadow: '0px 1px 0px rgba(0,0,0,0.8), 0px 2px 8px rgba(0,0,0,0.9)',
          }}
        >
          {(user.skIdNumber || '2025-XXXX').toUpperCase()}
        </div>
      </div>
    </div>
  );
};

const IDCardBack: React.FC<IDCardProps> = ({ user, scale = 1 }) => {
  const QR_BOX_LEFT = 327;
  const QR_BOX_TOP = 136;
  const QR_BOX_W = 360;
  const QR_BOX_H = 405;

  const QR_SIZE = 360;
  const QR_LEFT = QR_BOX_LEFT + (QR_BOX_W - QR_SIZE) / 2;
  const QR_TOP = QR_BOX_TOP + (QR_BOX_H - QR_SIZE) / 2;

  return (
    <div
      style={{
        width: CARD_W * scale,
        height: CARD_H * scale,
        position: 'relative',
        overflow: 'hidden',
        borderRadius: 12 * scale,
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      }}
    >
      <div
        style={{
          width: CARD_W,
          height: CARD_H,
          position: 'absolute',
          top: 0,
          left: 0,
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
        }}
      >
        <img
          src={idBackSvg}
          alt=""
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />

        {/* QR code fitted into the square slot */}
        <div
          style={{
            position: 'absolute',
            left: QR_LEFT,
            top: QR_TOP,
            width: QR_SIZE,
            height: QR_SIZE,
            padding: 8,
            boxSizing: 'border-box',
            borderRadius: 16,
            overflow: 'hidden',
          }}
        >
          <QRCodeSVG
            value={user.qrCode || user.skIdNumber || user._id}
            size={QR_SIZE - 16}
            level="H"
            fgColor="#02171f"
            bgColor="transparent"
            style={{
              borderRadius: 16,
              clipPath: 'inset(0 round 16px)',
            }}
          />
        </div>
      </div>
    </div>
  );
};

// ============================================================
// PRINTABLE SINGLE CARD — one page, centered, front OR back.
// ============================================================

const PrintableSingleCard: React.FC<{ user: UserData; side: 'front' | 'back' }> = ({
  user,
  side,
}) => {
  const CARD_MM_W = 85.6;
  const PRINT_SCALE = (CARD_MM_W * 3.7795275591) / CARD_W;

  const pageStyle: React.CSSProperties = {
    width: '210mm',
    height: '297mm',
    margin: 0,
    padding: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxSizing: 'border-box',
  };

  return (
    <div style={pageStyle}>
      {side === 'front' ? (
        <IDCardFront user={user} scale={PRINT_SCALE} />
      ) : (
        <IDCardBack user={user} scale={PRINT_SCALE} />
      )}
    </div>
  );
};

// ============================================================
// PRINTABLE (both pages) — kept for reference, unused now.
// ============================================================

/*
const PrintableIDCard: React.FC<{ user: UserData }> = ({ user }) => {
  const CARD_MM_W = 85.6;
  const CARD_MM_H = 53.98;

  const pageStyle: React.CSSProperties = {
    width: '210mm',
    height: '297mm',
    margin: 0,
    padding: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxSizing: 'border-box',
  };

  const cardWrapper = (_child: React.ReactNode): React.CSSProperties => ({
    width: `${CARD_MM_W}mm`,
    height: `${CARD_MM_H}mm`,
    position: 'relative',
    overflow: 'hidden',
  });

  const PRINT_SCALE = (CARD_MM_W * 3.7795275591) / CARD_W;

  return (
    <>
      <div style={{ ...pageStyle, pageBreakAfter: 'always' }}>
        <div style={cardWrapper(null)}>
          <IDCardFront user={user} scale={PRINT_SCALE} />
        </div>
      </div>

      <div style={pageStyle}>
        <div style={cardWrapper(null)}>
          <IDCardBack user={user} scale={PRINT_SCALE} />
        </div>
      </div>
    </>
  );
};
*/

export default PrintIDModule;