import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  ArrowLeft, Calendar, Clock, MapPin, Users, Award,
  Image as ImageIcon, Tag, FileText, Save, Eye, ZoomIn
} from 'lucide-react';
import axios from 'axios';
import ImageLightbox from '../../components/ImageLightbox'; // adjust path as needed

const API_URL = import.meta.env.VITE_API_URL || "localhost:5173";

interface EventFormData {
  title: string;
  description: string;
  eventDate: string;
  startTime: string;
  endTime: string;
  location: string;
  venue: string;
  category: string;
  posterImage: File | null;
  pointsReward: number;
  maxParticipants: string;
  status: 'Draft' | 'Published';
}

const inp = 'block w-full rounded-lg border border-gray-300 px-4 py-3 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition bg-white';
const inpErr = 'block w-full rounded-lg border border-red-400 px-4 py-3 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent transition bg-red-50';

const PostEvent = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const editEvent = location.state?.editEvent;
  const isEditMode = !!editEvent;

  const [formData, setFormData] = useState<EventFormData>({
    title: '', description: '', eventDate: '', startTime: '', endTime: '',
    location: '', venue: '', category: 'Sports', posterImage: null,
    pointsReward: 10, maxParticipants: '', status: 'Draft'
  });
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [lightboxOpen, setLightboxOpen] = useState(false);

  useEffect(() => {
    if (editEvent) {
      const eventDate = new Date(editEvent.eventDate).toISOString().split('T')[0];
      setFormData({
        title: editEvent.title || '', description: editEvent.description || '',
        eventDate, startTime: editEvent.startTime || '', endTime: editEvent.endTime || '',
        location: editEvent.location || '', venue: editEvent.venue || '',
        category: editEvent.category || 'Sports', posterImage: null,
        pointsReward: editEvent.pointsReward || 10,
        maxParticipants: editEvent.maxCapacity?.toString() || '',
        status: editEvent.status || 'Draft'
      });
      if (editEvent.posterImage) setImagePreview(editEvent.posterImage);
    }
  }, [editEvent]);

  const categories = ['Sports', 'Educational', 'Cultural', 'Health', 'Environmental', 'Social', 'Others'];
  const today = new Date().toISOString().split('T')[0];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setErrors(prev => ({ ...prev, posterImage: 'Image must be less than 5MB' })); return; }
    if (!file.type.startsWith('image/')) { setErrors(prev => ({ ...prev, posterImage: 'File must be an image' })); return; }
    setFormData(prev => ({ ...prev, posterImage: file }));
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
    if (errors.posterImage) setErrors(prev => ({ ...prev, posterImage: '' }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.title.trim()) newErrors.title = 'Title is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    if (!formData.eventDate) newErrors.eventDate = 'Event date is required';
    if (!formData.startTime) newErrors.startTime = 'Start time is required';
    if (!formData.endTime) newErrors.endTime = 'End time is required';
    if (!formData.location.trim()) newErrors.location = 'Location is required';
    if (!formData.venue.trim()) newErrors.venue = 'Venue is required';
    if (formData.pointsReward < 0) newErrors.pointsReward = 'Points must be 0 or greater';
    if (formData.startTime && formData.endTime && formData.startTime >= formData.endTime) newErrors.endTime = 'End time must be after start time';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (status: 'Draft' | 'Published') => {
    if (!validateForm()) { alert('Please fill in all required fields correctly'); return; }
    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) { alert('Not authenticated'); navigate('/admin/login'); return; }
      const submitData = new FormData();
      submitData.append('title', formData.title);
      submitData.append('description', formData.description);
      submitData.append('eventDate', formData.eventDate);
      submitData.append('startTime', formData.startTime);
      submitData.append('endTime', formData.endTime);
      submitData.append('location', formData.location);
      submitData.append('venue', formData.venue);
      submitData.append('category', formData.category);
      submitData.append('pointsReward', formData.pointsReward.toString());
      submitData.append('status', status);
      if (formData.maxParticipants) submitData.append('maxCapacity', formData.maxParticipants);
      if (formData.posterImage) submitData.append('posterImage', formData.posterImage);

      if (isEditMode) {
        await axios.put(`${API_URL}/api/events/admin/${editEvent._id}`, submitData, { headers: { Authorization: `Bearer ${token}` } });
        alert('Event updated successfully!');
      } else {
        const response = await axios.post(`${API_URL}/api/events`, submitData, { headers: { Authorization: `Bearer ${token}` } });
        alert(status === 'Published' ? `Event published! Event ID: ${response.data.eventId}` : 'Event saved as draft!');
      }
      navigate('/admin/events');
    } catch (error: any) {
      if (error.response?.status === 401) { localStorage.removeItem('adminToken'); navigate('/admin/login'); return; }
      alert(`Failed to save event: ${error.response?.data?.message || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen"
      style={{ background: 'linear-gradient(160deg, #6EB8BB 0%, #5CB0B3 37%, #007EA7 100%)' }}
    >
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white/15 backdrop-blur-sm border-b border-white/20">
        <div className="max-w-4xl mx-auto px-6 py-3 flex items-center justify-between">
          <button
            onClick={() => navigate('/admin')}
            className="flex items-center gap-1.5 text-xs font-semibold text-white transition duration-200 font-fugaz tracking-[0.05em] px-3 py-2 rounded-lg"
            style={{ background: 'rgba(0,52,89,0.35)' }}
            onMouseOver={(e) => ((e.currentTarget as HTMLButtonElement).style.background = 'rgba(0,23,31,0.5)')}
            onMouseOut={(e) => ((e.currentTarget as HTMLButtonElement).style.background = 'rgba(0,52,89,0.35)')}
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Dashboard
          </button>
          <h1 className="text-lg font-bold text-white font-fugaz">
            {isEditMode ? 'Edit Event' : 'Create New Event'}
          </h1>
          <div className="w-24" />
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 lg:px-8 py-8">
        <div className="text-center mb-6">
          <p className="text-white/60 text-sm font-work">
            {isEditMode ? 'Update event details below' : 'Fill in the event details to post to youth members'}
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-7 lg:p-10">
          <form onSubmit={(e) => e.preventDefault()} className="space-y-6">

            {/* Event Poster */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-[#00171F] mb-2 font-work">
                <ImageIcon className="w-4 h-4" /> Event Poster
              </label>
              {imagePreview ? (
                <div className="relative">
                  {/* Clickable image — opens lightbox */}
                  <div
                    className="relative group cursor-zoom-in"
                    onClick={() => setLightboxOpen(true)}
                  >
                    <img
                      src={imagePreview}
                      alt="Event poster preview"
                      className="w-full h-64 object-cover rounded-xl transition"
                      onError={() => setImagePreview(null)}
                    />
                    {/* Hover overlay hint */}
                    <div className="absolute inset-0 rounded-xl bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center">
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2 bg-black/60 text-white text-xs font-semibold font-fugaz px-3 py-2 rounded-lg">
                        <ZoomIn className="w-4 h-4" /> View Full Image
                      </div>
                    </div>
                  </div>

                  {/* Remove button */}
                  <button
                    type="button"
                    onClick={() => { setImagePreview(null); setFormData(prev => ({ ...prev, posterImage: null })); }}
                    className="absolute top-3 right-3 px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition duration-200 font-fugaz"
                    style={{ background: '#dc2626' }}
                    onMouseOver={(e) => ((e.currentTarget as HTMLButtonElement).style.background = '#b91c1c')}
                    onMouseOut={(e) => ((e.currentTarget as HTMLButtonElement).style.background = '#dc2626')}
                  >
                    Remove
                  </button>
                  {/* Change image button */}
                  <label
                    className="absolute bottom-3 right-3 px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition duration-200 font-fugaz cursor-pointer"
                    style={{ background: '#003459' }}
                    onMouseOver={(e) => ((e.currentTarget as HTMLLabelElement).style.background = '#00171F')}
                    onMouseOut={(e) => ((e.currentTarget as HTMLLabelElement).style.background = '#003459')}
                  >
                    Change Image
                    <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                  </label>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-full h-56 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer bg-gray-50 hover:bg-gray-100 transition">
                  <ImageIcon className="w-10 h-10 text-gray-300 mb-3" />
                  <p className="text-sm text-gray-400 font-work"><span className="font-semibold text-gray-500">Click to upload</span> or drag and drop</p>
                  <p className="text-xs text-gray-400 mt-1 font-work">PNG, JPG, WEBP up to 5MB — recommended 1280×720 (16:9)</p>
                  <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                </label>
              )}
              {errors.posterImage && <p className="text-red-500 text-xs mt-1 font-work">{errors.posterImage}</p>}
            </div>

            {/* Title */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-[#00171F] mb-1 font-work">
                <FileText className="w-4 h-4" /> Event Title *
              </label>
              <input type="text" name="title" value={formData.title} onChange={handleInputChange}
                className={errors.title ? inpErr : inp} placeholder="e.g., Youth Sports Festival 2026" />
              {errors.title && <p className="text-red-500 text-xs mt-1 font-work">{errors.title}</p>}
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-[#00171F] mb-1 font-work">Description *</label>
              <textarea name="description" value={formData.description} onChange={handleInputChange} rows={5}
                className={`${errors.description ? inpErr : inp} resize-none`}
                placeholder="Provide detailed information about the event..." />
              {errors.description && <p className="text-red-500 text-xs mt-1 font-work">{errors.description}</p>}
            </div>

            {/* Date & Time */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-[#00171F] mb-1 font-work">
                  <Calendar className="w-4 h-4" /> Event Date *
                </label>
                <input type="date" name="eventDate" value={formData.eventDate} onChange={handleInputChange} min={today}
                  className={errors.eventDate ? inpErr : inp} />
                {errors.eventDate && <p className="text-red-500 text-xs mt-1 font-work">{errors.eventDate}</p>}
              </div>
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-[#00171F] mb-1 font-work">
                  <Clock className="w-4 h-4" /> Start Time *
                </label>
                <input type="time" name="startTime" value={formData.startTime} onChange={handleInputChange}
                  className={errors.startTime ? inpErr : inp} />
                {errors.startTime && <p className="text-red-500 text-xs mt-1 font-work">{errors.startTime}</p>}
              </div>
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-[#00171F] mb-1 font-work">
                  <Clock className="w-4 h-4" /> End Time *
                </label>
                <input type="time" name="endTime" value={formData.endTime} onChange={handleInputChange}
                  className={errors.endTime ? inpErr : inp} />
                {errors.endTime && <p className="text-red-500 text-xs mt-1 font-work">{errors.endTime}</p>}
              </div>
            </div>

            {/* Location */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-[#00171F] mb-1 font-work">
                  <MapPin className="w-4 h-4" /> Location *
                </label>
                <input type="text" name="location" value={formData.location} onChange={handleInputChange}
                  className={errors.location ? inpErr : inp} placeholder="e.g., Barangay Hall" />
                {errors.location && <p className="text-red-500 text-xs mt-1 font-work">{errors.location}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-[#00171F] mb-1 font-work">Venue Details *</label>
                <input type="text" name="venue" value={formData.venue} onChange={handleInputChange}
                  className={errors.venue ? inpErr : inp} placeholder="e.g., Main Auditorium" />
                {errors.venue && <p className="text-red-500 text-xs mt-1 font-work">{errors.venue}</p>}
              </div>
            </div>

            {/* Category, Points, Capacity */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-[#00171F] mb-1 font-work">
                  <Tag className="w-4 h-4" /> Category *
                </label>
                <select name="category" value={formData.category} onChange={handleInputChange} className={inp}>
                  {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-[#00171F] mb-1 font-work">
                  <Award className="w-4 h-4" /> Points Reward *
                </label>
                <input type="number" name="pointsReward" value={formData.pointsReward} onChange={handleInputChange} min="0"
                  className={errors.pointsReward ? inpErr : inp} />
                {errors.pointsReward && <p className="text-red-500 text-xs mt-1 font-work">{errors.pointsReward}</p>}
              </div>
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-[#00171F] mb-1 font-work">
                  <Users className="w-4 h-4" /> Max Participants
                </label>
                <input type="number" name="maxParticipants" value={formData.maxParticipants} onChange={handleInputChange} min="1"
                  className={inp} placeholder="Optional" />
                <p className="text-xs text-gray-400 mt-1 font-work">Leave empty for unlimited</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-6 border-t border-gray-100">
              <button
                type="button"
                onClick={() => navigate(isEditMode ? '/admin/events' : '/admin')}
                disabled={loading}
                className="flex-1 px-5 py-2.5 rounded-lg text-sm font-semibold text-gray-600 border border-gray-300 bg-white hover:bg-gray-50 transition font-work disabled:opacity-50"
              >
                Cancel
              </button>

              {!isEditMode && (
                <button
                  type="button"
                  onClick={() => handleSubmit('Draft')}
                  disabled={loading}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 px-5 rounded-lg text-sm font-semibold text-white transition duration-200 font-fugaz tracking-[0.05em] disabled:opacity-50"
                  style={{ background: '#003459' }}
                  onMouseOver={(e) => { const b = e.currentTarget as HTMLButtonElement; if (!b.disabled) b.style.background = '#00171F'; }}
                  onMouseOut={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#003459'; }}
                >
                  <Save className="w-4 h-4" /> Save as Draft
                </button>
              )}

              <button
                type="button"
                onClick={() => handleSubmit(isEditMode ? formData.status as any : 'Published')}
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 px-5 rounded-lg text-sm font-semibold text-white transition duration-200 font-fugaz tracking-[0.05em] disabled:opacity-50"
                style={{ background: '#003459' }}
                onMouseOver={(e) => { const b = e.currentTarget as HTMLButtonElement; if (!b.disabled) b.style.background = '#00171F'; }}
                onMouseOut={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#003459'; }}
              >
                <Eye className="w-4 h-4" />
                {loading
                  ? (isEditMode ? 'Updating...' : 'Publishing...')
                  : (isEditMode ? 'Update Event' : 'Publish Event')}
              </button>
            </div>
          </form>
        </div>
      </main>

      {/* Lightbox */}
      {lightboxOpen && imagePreview && (
        <ImageLightbox
          src={imagePreview}
          alt={formData.title || 'Event poster'}
          onClose={() => setLightboxOpen(false)}
        />
      )}
    </div>
  );
};

export default PostEvent;