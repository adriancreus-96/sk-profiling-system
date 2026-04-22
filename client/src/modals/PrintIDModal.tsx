import React, { useRef, useState } from 'react';
import { useReactToPrint } from 'react-to-print';
import { QRCodeSVG } from 'qrcode.react';
import { X } from 'lucide-react';
import { type UserData } from './UserViewModal';

const API_URL = import.meta.env.VITE_API_URL || "localhost:5173"

interface PrintIDModuleProps {
  user: UserData;
  onClose: () => void;
  onPrintComplete?: (userId: string) => Promise<void>;
}

const PrintIDModule: React.FC<PrintIDModuleProps> = ({ user, onClose, onPrintComplete }) => {
  const componentRef = useRef<HTMLDivElement>(null);
  const [isPrinting, setIsPrinting] = useState(false);

  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: `SK-ID-${user.skIdNumber || user.lastName}`,
    onAfterPrint: async () => {
      setIsPrinting(true);
      if (onPrintComplete) {
        try {
          await onPrintComplete(user._id);
          alert('ID card printed successfully! This user cannot print again.');
          onClose();
        } catch {
          alert('ID printed, but failed to update print status. Please contact administrator.');
        }
      }
      setIsPrinting(false);
    }
  });

  const formatAddress = () => {
    const parts = [];
    if (user.block) parts.push(`BLK ${user.block}`);
    if (user.lot) parts.push(`LOT ${user.lot}`);
    if (user.houseNumber) parts.push(`${user.houseNumber}`);
    if (user.purok) parts.push(user.purok.toUpperCase());
    return parts.join(' ') || 'N/A';
  };

  const formatBirthDate = () => {
    const d = new Date(user.birthday);
    return `${String(d.getMonth()+1).padStart(2,'0')}/${String(d.getDate()).padStart(2,'0')}/${d.getFullYear()}`;
  };

  const formatIssuanceDate = () => {
    const d = user.dateApproved ? new Date(user.dateApproved) : new Date();
    return `${String(d.getMonth()+1).padStart(2,'0')}/${String(d.getDate()).padStart(2,'0')}/${d.getFullYear()}`;
  };

  const getProfilePicture = () => {
    if (user.profilePicture)
      return user.profilePicture.startsWith('http') ? user.profilePicture : `${API_URL}${user.profilePicture}`;
    return `https://ui-avatars.com/api/?name=${user.firstName}+${user.lastName}&size=400&background=007EA7&color=fff`;
  };

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl px-7 py-8 max-w-2xl w-full lg:px-10 lg:py-10">

        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-[#00171F] font-fugaz [filter:drop-shadow(0px_2px_50px_#000000)]">
            Print SK ID Card
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Preview */}
        <div className="mb-6 bg-[#EAF4F7] border border-[#B3D9E5] rounded-xl p-4">

          <div className="max-w-md mx-auto space-y-4 mt-4">
            {/* Front Preview */}
            <div className="transform scale-90 origin-top">
              <div className="w-[340px] h-[215px] bg-white rounded-lg shadow-md overflow-hidden border-2 border-gray-300">
                <div className="h-full flex" style={{ fontFamily: 'Arial, sans-serif' }}>
                  <div className="w-[140px] bg-white p-3 flex flex-col justify-between">
                    <div className="bg-gray-200 h-[180px] overflow-hidden flex items-center justify-center">
                      <img src={getProfilePicture()} alt="Profile" className="w-full h-full object-cover"
                        onError={e => { e.currentTarget.src = `https://ui-avatars.com/api/?name=${user.firstName}+${user.lastName}&size=400&background=007EA7&color=fff`; }} />
                    </div>
                    <div className="text-center mt-1">
                      <p className="text-[10px] font-bold">{user.skIdNumber || '2025-XXXX'}</p>
                    </div>
                  </div>
                  <div className="flex-1 flex flex-col">
                    <div className="bg-gradient-to-r from-[#007EA7] to-[#003459] text-white px-3 py-2">
                      <h3 className="text-[11px] font-bold leading-tight">SANGGUNIANG KABATAAN</h3>
                      <p className="text-[7px] opacity-90">Official Identification Card</p>
                    </div>
                    <div className="flex-1 px-3 py-2 bg-amber-50 space-y-1">
                      <div><p className="text-[7px] text-gray-600 uppercase font-semibold">Surname</p><p className="text-[10px] font-bold text-gray-900 leading-tight">{user.lastName.toUpperCase()}</p></div>
                      <div><p className="text-[7px] text-gray-600 uppercase font-semibold">Given Name</p><p className="text-[10px] font-bold text-gray-900 leading-tight">{user.firstName.toUpperCase()}</p></div>
                      <div><p className="text-[7px] text-gray-600 uppercase font-semibold">Middle Name</p><p className="text-[10px] font-bold text-gray-900 leading-tight">{user.middleName?.toUpperCase() || 'N/A'}</p></div>
                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <div><p className="text-[7px] text-gray-600 uppercase font-semibold">Birth Date</p><p className="text-[9px] font-bold text-gray-900">{formatBirthDate()}</p></div>
                        <div><p className="text-[7px] text-gray-600 uppercase font-semibold">Issuance Date</p><p className="text-[9px] font-bold text-gray-900">{formatIssuanceDate()}</p></div>
                      </div>
                      <div><p className="text-[7px] text-gray-600 uppercase font-semibold">Address</p><p className="text-[9px] font-bold text-gray-900 leading-tight">{formatAddress()}</p></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {/* Back Preview */}
            <div className="transform scale-90">
              <div className="w-[340px] h-[215px] bg-gradient-to-br from-[#EAF4F7] to-[#B3D9E5] rounded-lg shadow-md overflow-hidden border-2 border-gray-300 flex items-center justify-center">
                <div className="bg-white p-3 rounded-lg inline-block shadow-md">
                  <QRCodeSVG value={user.qrCode || user.skIdNumber || user._id} size={140} level="H" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-3 justify-end">
          <button onClick={onClose} disabled={isPrinting}
            className="px-6 py-2.5 text-sm font-semibold text-gray-700 bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 font-work">
            Cancel
          </button>
          <button onClick={handlePrint} disabled={isPrinting}
            className="px-6 py-2.5 text-sm font-semibold text-white rounded-lg transition duration-200 shadow-md font-fugaz tracking-[0.05em] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            style={{ background: '#003459' }}
            onMouseOver={e => { if (!isPrinting) (e.currentTarget as HTMLButtonElement).style.background = '#00171F'; }}
            onMouseOut={e => { if (!isPrinting) (e.currentTarget as HTMLButtonElement).style.background = '#003459'; }}>
            {isPrinting ? (
              <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />Processing...</>
            ) : 'Print ID Card'}
          </button>
        </div>

        {/* Hidden printable */}
        <div style={{ display: 'none' }}>
          <div ref={componentRef}><PrintableIDCard user={user} /></div>
        </div>
      </div>
    </div>
  );
};

interface PrintableIDCardProps { user: UserData; }

const PrintableIDCard: React.FC<PrintableIDCardProps> = ({ user }) => {
  const formatAddress = () => {
    const parts = [];
    if (user.block) parts.push(`BLK ${user.block}`);
    if (user.lot) parts.push(`LOT ${user.lot}`);
    if (user.houseNumber) parts.push(`${user.houseNumber}`);
    if (user.purok) parts.push(user.purok.toUpperCase());
    return parts.join(' ') || 'N/A';
  };
  const fmt = (d: Date) => { const dt = new Date(d); return `${String(dt.getMonth()+1).padStart(2,'0')}/${String(dt.getDate()).padStart(2,'0')}/${dt.getFullYear()}`; };
  const getProfilePicture = () => {
    if (user.profilePicture) return user.profilePicture.startsWith('http') ? user.profilePicture : `http://localhost:5000${user.profilePicture}`;
    return `https://ui-avatars.com/api/?name=${user.firstName}+${user.lastName}&size=400&background=007EA7&color=fff`;
  };

  const pageStyle: React.CSSProperties = { width:'210mm', height:'297mm', padding:0, margin:0, fontFamily:'Arial, sans-serif', display:'flex', alignItems:'center', justifyContent:'center', boxSizing:'border-box' };
  const cardStyle: React.CSSProperties = { width:'85.6mm', height:'53.98mm', backgroundColor:'white', borderRadius:'8px', overflow:'hidden', border:'1px solid #ccc', display:'flex' };

  return (
    <>
      {/* PAGE 1: FRONT */}
      <div style={{ ...pageStyle, pageBreakAfter: 'always' }}>
        <div style={cardStyle}>
          <div style={{ width:'35mm', backgroundColor:'white', padding:'3mm', display:'flex', flexDirection:'column', justifyContent:'space-between' }}>
            <div style={{ backgroundColor:'#e5e7eb', height:'45mm', overflow:'hidden', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <img src={getProfilePicture()} alt="Profile" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
            </div>
            <div style={{ textAlign:'center', marginTop:'1mm' }}>
              <p style={{ fontSize:'8pt', fontWeight:'bold', margin:0 }}>{user.skIdNumber || '2025-XXXX'}</p>
            </div>
          </div>
          <div style={{ flex:1, display:'flex', flexDirection:'column' }}>
            <div style={{ background:'linear-gradient(to right, #007EA7, #003459)', color:'white', padding:'2mm 3mm' }}>
              <h3 style={{ fontSize:'9pt', fontWeight:'bold', margin:0, lineHeight:1.2 }}>SANGGUNIANG KABATAAN</h3>
              <p style={{ fontSize:'6pt', margin:0, opacity:0.9 }}>Official Identification Card</p>
            </div>
            <div style={{ flex:1, padding:'3mm', backgroundColor:'#fffbeb' }}>
              {[['SURNAME', user.lastName.toUpperCase()], ['GIVEN NAME', user.firstName.toUpperCase()], ['MIDDLE NAME', user.middleName?.toUpperCase() || 'N/A']].map(([label, val]) => (
                <div key={label} style={{ marginBottom:'1.5mm' }}>
                  <p style={{ fontSize:'6pt', color:'#4b5563', margin:0, fontWeight:600 }}>{label}</p>
                  <p style={{ fontSize:'8pt', fontWeight:'bold', color:'#111827', margin:0, lineHeight:1.2 }}>{val}</p>
                </div>
              ))}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'2mm', marginBottom:'1.5mm' }}>
                <div><p style={{ fontSize:'6pt', color:'#4b5563', margin:0, fontWeight:600 }}>BIRTH DATE</p><p style={{ fontSize:'7pt', fontWeight:'bold', color:'#111827', margin:0 }}>{fmt(user.birthday)}</p></div>
                <div><p style={{ fontSize:'6pt', color:'#4b5563', margin:0, fontWeight:600 }}>ISSUANCE DATE</p><p style={{ fontSize:'7pt', fontWeight:'bold', color:'#111827', margin:0 }}>{fmt(user.dateApproved ? new Date(user.dateApproved) : new Date())}</p></div>
              </div>
              <div><p style={{ fontSize:'6pt', color:'#4b5563', margin:0, fontWeight:600 }}>ADDRESS</p><p style={{ fontSize:'7pt', fontWeight:'bold', color:'#111827', margin:0, lineHeight:1.2 }}>{formatAddress()}</p></div>
            </div>
          </div>
        </div>
      </div>

      {/* PAGE 2: BACK */}
      <div style={pageStyle}>
        <div style={{ ...cardStyle, background:'linear-gradient(135deg, #EAF4F7 0%, #B3D9E5 100%)', alignItems:'center', justifyContent:'center', transform:'scaleX(-1)' }}>
          <div style={{ backgroundColor:'white', padding:'6mm', borderRadius:'6px', boxShadow:'0 4px 6px rgba(0,0,0,0.1)', transform:'scaleX(-1)' }}>
            <QRCodeSVG value={user.qrCode || user.skIdNumber || user._id} size={120} level="H" />
          </div>
        </div>
      </div>
    </>
  );
};

export default PrintIDModule;