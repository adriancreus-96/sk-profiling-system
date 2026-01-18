import React, { useState } from 'react';
import { User, MapPin, Briefcase, Lock, Flag } from 'lucide-react';

const RegistrationForm = () => {
  // Calculate min and max dates for 15-30 age range
  const today = new Date();
  const maxDate = new Date(today.getFullYear() - 15, today.getMonth(), today.getDate())
    .toISOString().split('T')[0]; // Must be at least 15 years old
  const minDate = new Date(today.getFullYear() - 31, today.getMonth(), today.getDate() + 1)
    .toISOString().split('T')[0]; // Must be at most 30 years old

  const [formData, setFormData] = useState({
    firstName: '', lastName: '', middleName: '', suffix: '',
    email: '', password: '', contactNumber: '',
    birthday: '', sex: 'Male', 
    
    // Address Details
    purok: 'Purok 1',
    block: '',
    lot: '',
    houseNumber: '',
    street: '',

    // Dropdowns
    civilStatus: 'Single',
    educationalBackground: 'Elementary Level',
    youthClassification: 'In School Youth',
    workStatus: 'Unemployed',
    
    // Flags
    registeredSkVoter: false,
    registeredNationalVoter: false,
    isPwd: false,
    isCicwl: false,
    isIndigenous: false
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const finalValue = type === 'checkbox' ? checked : value;
    setFormData({ ...formData, [name]: finalValue });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Additional validation for age
    const birthDate = new Date(formData.birthday);
    const age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    const dayDiff = today.getDate() - birthDate.getDate();
    const exactAge = monthDiff < 0 || (monthDiff === 0 && dayDiff < 0) ? age - 1 : age;

    if (exactAge < 15 || exactAge > 30) {
      alert('You must be between 15 and 30 years old to register.');
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      if (response.ok) {
        alert('Registration Successful! Please wait for Admin Approval.');
        window.location.href = '/login';
      } else {
        const data = await response.json();
        alert('Error: ' + (data.message || 'Something went wrong'));
      }
    } catch (error) {
      console.error(error);
      alert('Error: Something went wrong');
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto p-4">
      
      {/* --- SECTION 1: PERSONAL INFORMATION --- */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <User className="w-5 h-5 text-blue-500" /> Personal Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input 
            type="text" 
            name="firstName" 
            placeholder="First Name" 
            onChange={handleChange} 
            required 
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
          />
          <input 
            type="text" 
            name="lastName" 
            placeholder="Last Name" 
            onChange={handleChange} 
            required 
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
          />
          <input 
            type="text" 
            name="middleName" 
            placeholder="Middle Name (Optional)" 
            onChange={handleChange} 
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
          />
          <input 
            type="text" 
            name="suffix" 
            placeholder="Suffix (e.g. Jr.)" 
            onChange={handleChange} 
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
          />
          
          <div className="md:col-span-2">
             <label className="block text-sm text-gray-600 mb-1">Birthday (Age 15-30 only)</label>
             <input 
               type="date" 
               name="birthday" 
               onChange={handleChange} 
               required 
               min={minDate}
               max={maxDate}
               className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
             />
          </div>

          <select 
            name="sex" 
            onChange={handleChange} 
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="Male">Male</option>
            <option value="Female">Female</option>
          </select>

          <select 
            name="civilStatus" 
            onChange={handleChange} 
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="Single">Single</option>
            <option value="Married">Married</option>
            <option value="Widowed">Widowed</option>
            <option value="Separated">Separated</option>
            <option value="Live-in">Live-in</option>
            <option value="Annulled">Annulled</option>
            <option value="Others">Others</option>
          </select>
        </div>
      </div>

      {/* --- SECTION 2: ADDRESS --- */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <MapPin className="w-5 h-5 text-blue-500" /> Address & Education
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          <div className="md:col-span-2">
            <label className="block text-sm text-gray-600 mb-1">Purok</label>
            <select 
              name="purok" 
              onChange={handleChange} 
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="Purok 1">Purok 1</option>
              <option value="Purok 2">Purok 2</option>
              <option value="Purok 3">Purok 3</option>
              <option value="Purok 4">Purok 4</option>
              <option value="Purok 5">Purok 5</option>
              <option value="Purok 6">Purok 6</option>
              <option value="Purok 7">Purok 7</option>
            </select>
          </div>

          <input 
            type="text" 
            name="block" 
            placeholder="Block No." 
            onChange={handleChange} 
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
          />
          <input 
            type="text" 
            name="lot" 
            placeholder="Lot No." 
            onChange={handleChange} 
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
          />
          <input 
            type="text" 
            name="houseNumber" 
            placeholder="House No." 
            onChange={handleChange} 
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
          />
          <input 
            type="text" 
            name="street" 
            placeholder="Street Name" 
            onChange={handleChange} 
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
          />

          <div className="md:col-span-2 mt-4">
            <label className="block text-sm text-gray-600 mb-1">Educational Background</label>
            <select 
              name="educationalBackground" 
              onChange={handleChange} 
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="Elementary Level">Elementary Level</option>
              <option value="Elementary Grad">Elementary Grad</option>
              <option value="High School Level">High School Level</option>
              <option value="High School Grad">High School Grad</option>
              <option value="Vocational Grad">Vocational Grad</option>
              <option value="College Level">College Level</option>
              <option value="College Grad">College Grad</option>
              <option value="Masters Level">Masters Level</option>
              <option value="Masters Grad">Masters Grad</option>
              <option value="Doctorate Level">Doctorate Level</option>
              <option value="Doctorate Graduate">Doctorate Graduate</option>
            </select>
          </div>
        </div>
      </div>

      {/* --- SECTION 3: CLASSIFICATION --- */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Briefcase className="w-5 h-5 text-blue-500" /> Classification
        </h3>
        <div className="grid grid-cols-1 gap-4">
          <select 
            name="youthClassification" 
            onChange={handleChange} 
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="In School Youth">In School Youth</option>
            <option value="Out of School Youth">Out of School Youth</option>
            <option value="Working Youth">Working Youth</option>
            <option value="Youth with Specific Needs">Youth with Specific Needs</option>
          </select>

          <select 
            name="workStatus" 
            onChange={handleChange} 
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="Employed">Employed</option>
            <option value="Unemployed">Unemployed</option>
            <option value="Self-Employed">Self-Employed</option>
            <option value="Currently looking for a Job">Currently looking for a Job</option>
            <option value="Not Interested Looking for a Job">Not Interested Looking for a Job</option>
          </select>
        </div>
      </div>

      {/* --- SECTION 4: DEMOGRAPHICS --- */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Flag className="w-5 h-5 text-blue-500" /> Other Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
           {[
             { name: "registeredSkVoter", label: "Registered SK Voter?" },
             { name: "registeredNationalVoter", label: "Registered National Voter?" },
             { name: "isPwd", label: "Person with Disability (PWD)?" },
             { name: "isCicwl", label: "Child in Conflict with Law (CICWL)?" },
             { name: "isIndigenous", label: "Indigenous Person?" },
           ].map((item) => (
             <label 
               key={item.name} 
               className="flex items-center space-x-3 p-3 border rounded-md hover:bg-gray-50 cursor-pointer"
             >
               <input 
                 type="checkbox" 
                 name={item.name} 
                 onChange={handleChange} 
                 className="h-5 w-5 text-blue-600" 
               />
               <span className="text-gray-700 font-medium">{item.label}</span>
             </label>
           ))}
        </div>
      </div>

      {/* --- SECTION 5: ACCOUNT SECURITY --- */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Lock className="w-5 h-5 text-blue-500" /> Account Security
        </h3>
        <div className="grid grid-cols-1 gap-4">
          <input 
            type="tel" 
            name="contactNumber" 
            placeholder="Mobile Number" 
            onChange={handleChange} 
            required 
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
          />
          <input 
            type="email" 
            name="email" 
            placeholder="Email Address" 
            onChange={handleChange} 
            required 
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
          />
          <input 
            type="password" 
            name="password" 
            placeholder="Create Password" 
            onChange={handleChange} 
            required 
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
          />
        </div>
      </div>

      <button 
        onClick={handleSubmit}
        className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-md transition duration-200"
      >
        Register Account
      </button>
    </div>
  );
};

export default RegistrationForm;