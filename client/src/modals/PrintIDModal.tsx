import React, { useRef, useState } from 'react';
import { useReactToPrint } from 'react-to-print';
import { QRCodeSVG } from 'qrcode.react';
import { type UserData } from './UserViewModal';

interface PrintIDModuleProps {
  user: UserData;
  onClose: () => void;
  onPrintComplete?: (userId: string) => Promise<void>;
}

const PrintIDModule: React.FC<PrintIDModuleProps> = ({ user, onClose, onPrintComplete }) => {
  const componentRef = useRef<HTMLDivElement>(null);
  const [isPrinting, setIsPrinting] = useState(false);

  const handlePrint = useReactToPrint({
    content: () => componentRef.current,
    documentTitle: `SK-ID-${user.skIdNumber || user.lastName}`,
    onAfterPrint: async () => {
      console.log('Print completed');
      setIsPrinting(true);
      
      // Mark as printed in the backend
      if (onPrintComplete) {
        try {
          await onPrintComplete(user._id);
          alert('ID card printed successfully! This user cannot print again.');
          onClose();
        } catch (error) {
          console.error('Error marking ID as printed:', error);
          alert('ID printed, but failed to update print status. Please contact administrator.');
        }
      }
      
      setIsPrinting(false);
    }
  });

  // Format address for ID card
  const formatAddress = () => {
    const parts = [];
    if (user.block) parts.push(`BLK ${user.block}`);
    if (user.lot) parts.push(`LOT ${user.lot}`);
    if (user.houseNumber) parts.push(`${user.houseNumber}`);
    if (user.purok) parts.push(user.purok.toUpperCase());
    return parts.join(' ') || 'N/A';
  };

  // Format birth date
  const formatBirthDate = () => {
    const date = new Date(user.birthday);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const year = date.getFullYear();
    return `${month}/${day}/${year}`;
  };

  // Format issuance date (approval date or today)
  const formatIssuanceDate = () => {
    const date = user.dateApproved ? new Date(user.dateApproved) : new Date();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const year = date.getFullYear();
    return `${month}/${day}/${year}`;
  };

  // Get profile picture URL
  const getProfilePicture = () => {
    if (user.profilePicture) {
      return user.profilePicture.startsWith('http') 
        ? user.profilePicture 
        : `http://localhost:5000${user.profilePicture}`;
    }
    return `https://ui-avatars.com/api/?name=${user.firstName}+${user.lastName}&size=400&background=1e40af&color=fff`;
  };

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl p-6 max-w-2xl w-full">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Print SK ID Card</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
          >
            ×
          </button>
        </div>

        {/* Preview */}
        <div className="mb-6 bg-gray-100 p-4 rounded-lg">
          <p className="text-sm text-gray-600 mb-4 text-center">Preview (Actual size: 85.6mm × 53.98mm)</p>
          
          <div className="max-w-md mx-auto space-y-4">
            {/* Front Preview */}
            <div className="transform scale-90 origin-top">
              <div className="w-[340px] h-[215px] bg-white rounded-lg shadow-md overflow-hidden border-2 border-gray-300">
                <div className="h-full flex" style={{ fontFamily: 'Arial, sans-serif' }}>
                  {/* Left side - Photo */}
                  <div className="w-[140px] bg-white p-3 flex flex-col justify-between">
                    <div className="bg-gray-200 h-[180px] overflow-hidden flex items-center justify-center">
                      <img 
                        src={getProfilePicture()}
                        alt="Profile"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = `https://ui-avatars.com/api/?name=${user.firstName}+${user.lastName}&size=400&background=1e40af&color=fff`;
                        }}
                      />
                    </div>
                    <div className="text-center mt-1">
                      <p className="text-[10px] font-bold">{user.skIdNumber || '2025-XXXX'}</p>
                    </div>
                  </div>

                  {/* Right side - Info */}
                  <div className="flex-1 flex flex-col">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-blue-700 to-blue-800 text-white px-3 py-2">
                      <h3 className="text-[11px] font-bold leading-tight">SANGGUNIANG KABATAAN</h3>
                      <p className="text-[7px] opacity-90">Official Identification Card</p>
                    </div>

                    {/* Details */}
                    <div className="flex-1 px-3 py-2 bg-amber-50 space-y-1">
                      <div>
                        <p className="text-[7px] text-gray-600 uppercase font-semibold">Surname</p>
                        <p className="text-[10px] font-bold text-gray-900 leading-tight">{user.lastName.toUpperCase()}</p>
                      </div>
                      <div>
                        <p className="text-[7px] text-gray-600 uppercase font-semibold">Given Name</p>
                        <p className="text-[10px] font-bold text-gray-900 leading-tight">
                          {user.firstName.toUpperCase()}
                        </p>
                      </div>
                      <div>
                        <p className="text-[7px] text-gray-600 uppercase font-semibold">Middle Name</p>
                        <p className="text-[10px] font-bold text-gray-900 leading-tight">
                          {user.middleName?.toUpperCase() || 'N/A'}
                        </p>
                      </div>
                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <div>
                          <p className="text-[7px] text-gray-600 uppercase font-semibold">Birth Date</p>
                          <p className="text-[9px] font-bold text-gray-900">{formatBirthDate()}</p>
                        </div>
                        <div>
                          <p className="text-[7px] text-gray-600 uppercase font-semibold">Issuance Date</p>
                          <p className="text-[9px] font-bold text-gray-900">{formatIssuanceDate()}</p>
                        </div>
                      </div>
                      <div>
                        <p className="text-[7px] text-gray-600 uppercase font-semibold">Address</p>
                        <p className="text-[9px] font-bold text-gray-900 leading-tight">{formatAddress()}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Back Preview */}
            <div className="transform scale-90">
              <div className="w-[340px] h-[215px] bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg shadow-md overflow-hidden border-2 border-gray-300 flex items-center justify-center">
                <div className="text-center">
                  <div className="bg-white p-3 rounded-lg inline-block shadow-md">
                    <QRCodeSVG 
                      value={user.qrCode || user.skIdNumber || user._id}
                      size={140}
                      level="H"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            disabled={isPrinting}
            className="px-6 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={handlePrint}
            disabled={isPrinting}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isPrinting ? (
              <>
                <span className="animate-spin">⏳</span>
                Processing...
              </>
            ) : (
              'Print ID Card'
            )}
          </button>
        </div>

        {/* Hidden Printable Component */}
        <div style={{ display: 'none' }}>
          <div ref={componentRef}>
            <PrintableIDCard user={user} />
          </div>
        </div>
      </div>
    </div>
  );
};

// Printable Component
interface PrintableIDCardProps {
  user: UserData;
}

const PrintableIDCard: React.FC<PrintableIDCardProps> = ({ user }) => {
  const formatAddress = () => {
    const parts = [];
    if (user.block) parts.push(`BLK ${user.block}`);
    if (user.lot) parts.push(`LOT ${user.lot}`);
    if (user.houseNumber) parts.push(`${user.houseNumber}`);
    if (user.purok) parts.push(user.purok.toUpperCase());
    return parts.join(' ') || 'N/A';
  };

  const formatBirthDate = () => {
    const date = new Date(user.birthday);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const year = date.getFullYear();
    return `${month}/${day}/${year}`;
  };

  const formatIssuanceDate = () => {
    const date = user.dateApproved ? new Date(user.dateApproved) : new Date();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const year = date.getFullYear();
    return `${month}/${day}/${year}`;
  };

  const getProfilePicture = () => {
    if (user.profilePicture) {
      return user.profilePicture.startsWith('http') 
        ? user.profilePicture 
        : `http://localhost:5000${user.profilePicture}`;
    }
    return `https://ui-avatars.com/api/?name=${user.firstName}+${user.lastName}&size=400&background=1e40af&color=fff`;
  };

  return (
    <div style={{ 
      padding: '20mm',
      fontFamily: 'Arial, sans-serif'
    }}>
      {/* Front Card */}
      <div style={{
        width: '85.6mm',
        height: '53.98mm',
        backgroundColor: 'white',
        borderRadius: '8px',
        overflow: 'hidden',
        border: '1px solid #ccc',
        marginBottom: '10mm',
        display: 'flex',
        pageBreakAfter: 'avoid'
      }}>
        {/* Left side - Photo */}
        <div style={{
          width: '35mm',
          backgroundColor: 'white',
          padding: '3mm',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          <div style={{
            backgroundColor: '#e5e7eb',
            height: '45mm',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <img 
              src={getProfilePicture()}
              alt="Profile"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover'
              }}
            />
          </div>
          <div style={{ textAlign: 'center', marginTop: '1mm' }}>
            <p style={{ fontSize: '8pt', fontWeight: 'bold', margin: 0 }}>
              {user.skIdNumber || '2025-XXXX'}
            </p>
          </div>
        </div>

        {/* Right side - Info */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {/* Header */}
          <div style={{
            background: 'linear-gradient(to right, #1d4ed8, #1e40af)',
            color: 'white',
            padding: '2mm 3mm'
          }}>
            <h3 style={{ 
              fontSize: '9pt', 
              fontWeight: 'bold', 
              margin: 0,
              lineHeight: 1.2
            }}>
              SANGGUNIANG KABATAAN
            </h3>
            <p style={{ 
              fontSize: '6pt', 
              margin: 0,
              opacity: 0.9
            }}>
              Official Identification Card
            </p>
          </div>

          {/* Details */}
          <div style={{
            flex: 1,
            padding: '3mm',
            backgroundColor: '#fffbeb'
          }}>
            <div style={{ marginBottom: '1.5mm' }}>
              <p style={{ fontSize: '6pt', color: '#4b5563', margin: 0, fontWeight: 600 }}>
                SURNAME
              </p>
              <p style={{ fontSize: '8pt', fontWeight: 'bold', color: '#111827', margin: 0, lineHeight: 1.2 }}>
                {user.lastName.toUpperCase()}
              </p>
            </div>
            
            <div style={{ marginBottom: '1.5mm' }}>
              <p style={{ fontSize: '6pt', color: '#4b5563', margin: 0, fontWeight: 600 }}>
                GIVEN NAME
              </p>
              <p style={{ fontSize: '8pt', fontWeight: 'bold', color: '#111827', margin: 0, lineHeight: 1.2 }}>
                {user.firstName.toUpperCase()}
              </p>
            </div>
            
            <div style={{ marginBottom: '1.5mm' }}>
              <p style={{ fontSize: '6pt', color: '#4b5563', margin: 0, fontWeight: 600 }}>
                MIDDLE NAME
              </p>
              <p style={{ fontSize: '8pt', fontWeight: 'bold', color: '#111827', margin: 0, lineHeight: 1.2 }}>
                {user.middleName?.toUpperCase() || 'N/A'}
              </p>
            </div>
            
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: '1fr 1fr', 
              gap: '2mm',
              marginBottom: '1.5mm'
            }}>
              <div>
                <p style={{ fontSize: '6pt', color: '#4b5563', margin: 0, fontWeight: 600 }}>
                  BIRTH DATE
                </p>
                <p style={{ fontSize: '7pt', fontWeight: 'bold', color: '#111827', margin: 0 }}>
                  {formatBirthDate()}
                </p>
              </div>
              <div>
                <p style={{ fontSize: '6pt', color: '#4b5563', margin: 0, fontWeight: 600 }}>
                  ISSUANCE DATE
                </p>
                <p style={{ fontSize: '7pt', fontWeight: 'bold', color: '#111827', margin: 0 }}>
                  {formatIssuanceDate()}
                </p>
              </div>
            </div>
            
            <div>
              <p style={{ fontSize: '6pt', color: '#4b5563', margin: 0, fontWeight: 600 }}>
                ADDRESS
              </p>
              <p style={{ fontSize: '7pt', fontWeight: 'bold', color: '#111827', margin: 0, lineHeight: 1.2 }}>
                {formatAddress()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Back Card */}
      <div style={{
        width: '85.6mm',
        height: '53.98mm',
        background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
        borderRadius: '8px',
        overflow: 'hidden',
        border: '1px solid #ccc',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        pageBreakBefore: 'avoid'
      }}>
        <div style={{
          backgroundColor: 'white',
          padding: '6mm',
          borderRadius: '6px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
        }}>
          <QRCodeSVG 
            value={user.qrCode || user.skIdNumber || user._id}
            size={120}
            level="H"
          />
        </div>
      </div>
    </div>
  );
};

export default PrintIDModule;