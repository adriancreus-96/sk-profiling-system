import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  ArrowLeft, Calendar, Clock, MapPin, Users, Award, 
  Image as ImageIcon, Tag, FileText, Save, Eye 
} from 'lucide-react';
import axios from 'axios';

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

const PostEvent = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const editEvent = location.state?.editEvent;
  const isEditMode = !!editEvent;
  
  const [formData, setFormData] = useState<EventFormData>({
    title: '',
    description: '',
    eventDate: '',
    startTime: '',
    endTime: '',
    location: '',
    venue: '',
    category: 'Sports',
    posterImage: null,
    pointsReward: 10,
    maxParticipants: '',
    status: 'Draft'
  });

  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Pre-populate form if editing
  useEffect(() => {
    if (editEvent) {
      const eventDate = new Date(editEvent.eventDate).toISOString().split('T')[0];
      
      setFormData({
        title: editEvent.title || '',
        description: editEvent.description || '',
        eventDate,
        startTime: editEvent.startTime || '',
        endTime: editEvent.endTime || '',
        location: editEvent.location || '',
        venue: editEvent.venue || '',
        category: editEvent.category || 'Sports',
        posterImage: null,
        pointsReward: editEvent.pointsReward || 10,
        maxParticipants: editEvent.maxCapacity?.toString() || '',
        status: editEvent.status || 'Draft'
      });

      // Set image preview if exists
      // Cloudinary URLs are full https:// URLs, no prefix needed
      if (editEvent.posterImage) {
        setImagePreview(editEvent.posterImage);
      }
    }
  }, [editEvent]);

  const categories = [
    'Sports', 'Educational', 'Cultural',
    'Health', 'Environmental', 'Social', 'Others'
  ];

  const today = new Date().toISOString().split('T')[0];

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setErrors(prev => ({ ...prev, posterImage: 'Image must be less than 5MB' }));
        return;
      }

      if (!file.type.startsWith('image/')) {
        setErrors(prev => ({ ...prev, posterImage: 'File must be an image' }));
        return;
      }

      setFormData(prev => ({ ...prev, posterImage: file }));
      
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);

      if (errors.posterImage) {
        setErrors(prev => ({ ...prev, posterImage: '' }));
      }
    }
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

    if (formData.startTime && formData.endTime) {
      if (formData.startTime >= formData.endTime) {
        newErrors.endTime = 'End time must be after start time';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (status: 'Draft' | 'Published') => {
    if (!validateForm()) {
      alert('Please fill in all required fields correctly');
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('adminToken');
      if (!token) {
        alert('Not authenticated');
        navigate('/admin/login');
        return;
      }

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
      
      if (formData.maxParticipants) {
        submitData.append('maxCapacity', formData.maxParticipants);
      }

      // Only append image if a new file was selected
      if (formData.posterImage) {
        submitData.append('posterImage', formData.posterImage);
      }

      if (isEditMode) {
        await axios.put(
          `http://localhost:5000/api/events/admin/${editEvent._id}`,
          submitData,
          { headers: { 'Authorization': `Bearer ${token}` } }
          // Note: Do NOT set Content-Type manually — axios sets it with boundary
        );
        alert('Event updated successfully!');
      } else {
        const response = await axios.post(
          'http://localhost:5000/api/events',
          submitData,
          { headers: { 'Authorization': `Bearer ${token}` } }
        );
        alert(
          status === 'Published'
            ? `Event published! Event ID: ${response.data.eventId}`
            : 'Event saved as draft!'
        );
      }
      
      navigate('/admin/events');
    } catch (error: any) {
      console.error('Error saving event:', error);
      if (error.response?.status === 401) {
        localStorage.removeItem('adminToken');
        navigate('/admin/login');
        return;
      }
      alert(`Failed to save event: ${error.response?.data?.message || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mb-6">
        <button
          onClick={() => navigate('/admin')}
          className="flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </button>
      </div>

      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-extrabold text-black mb-2 text-center">
          {isEditMode ? 'Edit Event' : 'Create New Event'}
        </h1>
        <p className="text-gray-600 text-center mb-8">
          {isEditMode ? 'Update event details below' : 'Fill in the event details to post to youth members'}
        </p>

        <div className="bg-white rounded-xl shadow-lg p-8">
          <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
            
            {/* Event Poster */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <ImageIcon className="w-4 h-4" />
                Event Poster
              </label>
              <div className="mt-2">
                {imagePreview ? (
                  <div className="relative">
                    <img
                      src={imagePreview}
                      alt="Event poster preview"
                      className="w-full h-64 object-cover rounded-lg"
                      onError={(e) => {
                        e.currentTarget.src = '';
                        setImagePreview(null);
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setImagePreview(null);
                        setFormData(prev => ({ ...prev, posterImage: null }));
                      }}
                      className="absolute top-2 right-2 bg-red-500 text-white px-3 py-1 rounded-lg text-sm hover:bg-red-600"
                    >
                      Remove
                    </button>
                    {/* Allow replacing the image */}
                    <label className="absolute bottom-2 right-2 bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-lg text-sm cursor-pointer">
                      Change Image
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={handleImageChange}
                      />
                    </label>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <ImageIcon className="w-12 h-12 text-gray-400 mb-3" />
                      <p className="mb-2 text-sm text-gray-500">
                        <span className="font-semibold">Click to upload</span> or drag and drop
                      </p>
                      <p className="text-xs text-gray-500">PNG, JPG, GIF, WEBP up to 5MB</p>
                    </div>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handleImageChange}
                    />
                  </label>
                )}
                {errors.posterImage && (
                  <p className="text-red-600 text-sm mt-1">{errors.posterImage}</p>
                )}
              </div>
            </div>

            {/* Event Title */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Event Title *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                  errors.title ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="e.g., Youth Sports Festival 2026"
              />
              {errors.title && <p className="text-red-600 text-sm mt-1">{errors.title}</p>}
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Description *
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={5}
                className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                  errors.description ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Provide detailed information about the event..."
              />
              {errors.description && <p className="text-red-600 text-sm mt-1">{errors.description}</p>}
            </div>

            {/* Date and Time Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Event Date *
                </label>
                <input
                  type="date"
                  name="eventDate"
                  value={formData.eventDate}
                  onChange={handleInputChange}
                  min={today}
                  className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                    errors.eventDate ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.eventDate && <p className="text-red-600 text-sm mt-1">{errors.eventDate}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Start Time *
                </label>
                <input
                  type="time"
                  name="startTime"
                  value={formData.startTime}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                    errors.startTime ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.startTime && <p className="text-red-600 text-sm mt-1">{errors.startTime}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  End Time *
                </label>
                <input
                  type="time"
                  name="endTime"
                  value={formData.endTime}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                    errors.endTime ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.endTime && <p className="text-red-600 text-sm mt-1">{errors.endTime}</p>}
              </div>
            </div>

            {/* Location Details Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Location *
                </label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                    errors.location ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="e.g., Barangay Hall"
                />
                {errors.location && <p className="text-red-600 text-sm mt-1">{errors.location}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Venue Details *
                </label>
                <input
                  type="text"
                  name="venue"
                  value={formData.venue}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                    errors.venue ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="e.g., Main Auditorium"
                />
                {errors.venue && <p className="text-red-600 text-sm mt-1">{errors.venue}</p>}
              </div>
            </div>

            {/* Category, Points, and Capacity Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <Tag className="w-4 h-4" />
                  Category *
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <Award className="w-4 h-4" />
                  Points Reward *
                </label>
                <input
                  type="number"
                  name="pointsReward"
                  value={formData.pointsReward}
                  onChange={handleInputChange}
                  min="0"
                  className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                    errors.pointsReward ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.pointsReward && <p className="text-red-600 text-sm mt-1">{errors.pointsReward}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Max Participants
                </label>
                <input
                  type="number"
                  name="maxParticipants"
                  value={formData.maxParticipants}
                  onChange={handleInputChange}
                  min="1"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Optional"
                />
                <p className="text-xs text-gray-500 mt-1">Leave empty for unlimited</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => navigate(isEditMode ? '/admin/events' : '/admin')}
                className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
                disabled={loading}
              >
                Cancel
              </button>
              
              {!isEditMode && (
                <button
                  type="button"
                  onClick={() => handleSubmit('Draft')}
                  className="flex-1 px-6 py-3 bg-gray-600 text-white rounded-lg font-semibold hover:bg-gray-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                  disabled={loading}
                >
                  <Save className="w-5 h-5" />
                  Save as Draft
                </button>
              )}
              
              <button
                type="button"
                onClick={() => handleSubmit(isEditMode ? formData.status as any : 'Published')}
                className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                disabled={loading}
              >
                <Eye className="w-5 h-5" />
                {loading
                  ? (isEditMode ? 'Updating...' : 'Publishing...')
                  : (isEditMode ? 'Update Event' : 'Publish Event')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PostEvent;