import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { eventService } from '../services/auth';
import { EVENT_CATEGORIES, SEAT_TYPES } from '../utils/constants';
import { 
  ArrowLeftIcon, 
  PlusIcon,
  XMarkIcon,
  PhotoIcon,
  TrashIcon,
  CheckCircleIcon,
  ChevronDownIcon,
  InformationCircleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CurrencyRupeeIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const CreateEvent = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: Basic Info, 2: Location, 3: Seating, 4: Images
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    startDate: '',
    startTime: '',
    endDate: '',
    endTime: '',
    location: {
      name: '',
      address: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'India'
    },
    imageBase64: '',
    galleryImagesBase64: [],
    seats: [],
    tags: []
  });

  // For managing temporary input for tags
  const [tagInput, setTagInput] = useState('');
  
  // For managing image previews
  const [mainImagePreview, setMainImagePreview] = useState('');
  const [galleryPreviews, setGalleryPreviews] = useState([]);

  // For managing seat creation
  const [seatSection, setSeatSection] = useState('');
  const [seatRows, setSeatRows] = useState('');
  const [seatsPerRow, setSeatsPerRow] = useState('');
  const [seatType, setSeatType] = useState('standard');
  const [seatPrice, setSeatPrice] = useState('');
  const [sections, setSections] = useState([]);

  // Step details for progress tracking
  const steps = [
    { id: 1, name: 'Basic Info', icon: '📝' },
    { id: 2, name: 'Location', icon: '📍' },
    { id: 3, name: 'Seating', icon: '💺' },
    { id: 4, name: 'Images', icon: '🖼️' }
  ];

  // Handle basic form changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Handle nested location fields
    if (name.startsWith('location.')) {
      const locationField = name.split('.')[1];
      setFormData({
        ...formData,
        location: {
          ...formData.location,
          [locationField]: value
        }
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  // Handle image uploads
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Check file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData({
        ...formData,
        imageBase64: reader.result
      });
      setMainImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleGalleryImagesChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    // Limit to 10 gallery images
    if (galleryPreviews.length + files.length > 10) {
      toast.error('You can upload a maximum of 10 gallery images');
      return;
    }

    const newPreviews = [...galleryPreviews];
    const newGalleryImages = [...formData.galleryImagesBase64];

    files.forEach(file => {
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} is too large. Max size is 5MB`);
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        newPreviews.push(reader.result);
        newGalleryImages.push(reader.result);
        
        setGalleryPreviews(newPreviews);
        setFormData({
          ...formData,
          galleryImagesBase64: newGalleryImages
        });
      };
      reader.readAsDataURL(file);
    });
  };

  const removeGalleryImage = (index) => {
    const newGalleryImages = [...formData.galleryImagesBase64];
    const newPreviews = [...galleryPreviews];
    
    newGalleryImages.splice(index, 1);
    newPreviews.splice(index, 1);
    
    setFormData({
      ...formData,
      galleryImagesBase64: newGalleryImages
    });
    setGalleryPreviews(newPreviews);
  };

  // Handle tag management
  const addTag = () => {
    if (!tagInput.trim()) return;
    
    // Limit tags
    if (formData.tags.length >= 10) {
      toast.error('Maximum 10 tags allowed');
      return;
    }
    
    // Don't add duplicate tags
    if (formData.tags.includes(tagInput.trim())) {
      toast.error('Tag already exists');
      setTagInput('');
      return;
    }
    
    setFormData({
      ...formData,
      tags: [...formData.tags, tagInput.trim()]
    });
    setTagInput('');
  };

  const removeTag = (tag) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter(t => t !== tag)
    });
  };

  // Handle seat section creation
  const addSeatSection = () => {
    // Validation
    if (!seatSection || !seatRows || !seatsPerRow || !seatPrice) {
      toast.error('Please fill all seat section fields');
      return;
    }

    // Convert to numbers
    const numRows = parseInt(seatRows);
    const numSeatsPerRow = parseInt(seatsPerRow);
    const pricePerSeat = parseFloat(seatPrice);

    // Additional validation
    if (numRows <= 0 || numRows > 26) {
      toast.error('Number of rows must be between 1 and 26');
      return;
    }
    
    if (numSeatsPerRow <= 0 || numSeatsPerRow > 50) {
      toast.error('Seats per row must be between 1 and 50');
      return;
    }
    
    if (pricePerSeat <= 0) {
      toast.error('Price must be greater than 0');
      return;
    }

    // Check for duplicate section names
    if (sections.some(s => s.name.toLowerCase() === seatSection.toLowerCase())) {
      toast.error('A section with this name already exists');
      return;
    }

    // Generate seats for this section
    const newSeats = [];
    const rowLabels = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

    for (let i = 0; i < numRows; i++) {
      const rowLabel = rowLabels[i];
      
      for (let j = 1; j <= numSeatsPerRow; j++) {
        newSeats.push({
          row: rowLabel,
          number: j.toString().padStart(2, '0'),
          section: seatSection,
          price: pricePerSeat,
          type: seatType,
          isAvailable: true
        });
      }
    }

    // Add seats to form data
    setFormData({
      ...formData,
      seats: [...formData.seats, ...newSeats]
    });

    // Add section to list of sections for display
    setSections([
      ...sections,
      {
        name: seatSection,
        rows: numRows,
        seatsPerRow: numSeatsPerRow,
        totalSeats: numRows * numSeatsPerRow,
        price: pricePerSeat,
        type: seatType
      }
    ]);

    // Reset seat form
    setSeatSection('');
    setSeatRows('');
    setSeatsPerRow('');
    setSeatPrice('');
    setSeatType('standard');

    toast.success(`Added ${numRows * numSeatsPerRow} seats to ${seatSection}`);
  };

  const removeSeatSection = (sectionName) => {
    // Remove seats for this section
    setFormData({
      ...formData,
      seats: formData.seats.filter(seat => seat.section !== sectionName)
    });

    // Remove section from list
    setSections(sections.filter(section => section.name !== sectionName));

    toast.success(`Removed section ${sectionName}`);
  };

  // Navigate between steps
  const nextStep = () => {
    // Validate current step before proceeding
    if (step === 1) {
      if (!formData.title || !formData.description || !formData.category || !formData.startDate || !formData.startTime) {
        toast.error('Please fill all required fields');
        return;
      }
      
      // Validate dates
      const startDateTime = new Date(`${formData.startDate}T${formData.startTime}`);
      if (startDateTime < new Date()) {
        toast.error('Event start date must be in the future');
        return;
      }
      
      if (formData.endDate && formData.endTime) {
        const endDateTime = new Date(`${formData.endDate}T${formData.endTime}`);
        if (endDateTime <= startDateTime) {
          toast.error('End date must be after start date');
          return;
        }
      }
    } else if (step === 2) {
      if (!formData.location.name || !formData.location.address || !formData.location.city || 
          !formData.location.state || !formData.location.zipCode) {
        toast.error('Please fill all location fields');
        return;
      }
    } else if (step === 3) {
      if (formData.seats.length === 0) {
        toast.error('Please add at least one seat section');
        return;
      }
    }

    window.scrollTo(0, 0);
    setStep(step + 1);
  };

  const prevStep = () => {
    window.scrollTo(0, 0);
    setStep(step - 1);
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!formData.imageBase64) {
      toast.error('Please upload a main event image');
      return;
    }
    
    setLoading(true);

    try {
      // Prepare dates for submission - combine date and time
      const startDateTime = new Date(`${formData.startDate}T${formData.startTime}`);
      const endDateTime = formData.endDate && formData.endTime
        ? new Date(`${formData.endDate}T${formData.endTime}`)
        : new Date(startDateTime.getTime() + 2 * 60 * 60 * 1000); // Default to 2 hours after start

      const eventData = {
        ...formData,
        startDate: startDateTime.toISOString(),
        endDate: endDateTime.toISOString(),
        totalSeats: formData.seats.length,
        availableSeats: formData.seats.length
      };

      // Submit the event
      const response = await eventService.createEvent(eventData);
      
      toast.success('Event created successfully!');
      navigate(`/events/${response.data._id}`);
    } catch (error) {
      console.error('Error creating event:', error);
      toast.error(error.response?.data?.message || 'Failed to create event. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Progress bar component
  const ProgressBar = () => {
    return (
      <div className="mb-8">
        {/* Desktop Progress */}
        <div className="hidden sm:flex items-center justify-between">
          {steps.map((stepItem, index) => {
            const isActive = stepItem.id === step;
            const isCompleted = stepItem.id < step;
            
            return (
              <React.Fragment key={stepItem.id}>
                <div className="flex flex-col items-center">
                  <div 
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-medium transition-all ${
                      isActive 
                        ? 'bg-primary-600 text-white shadow-lg scale-110' 
                        : isCompleted 
                          ? 'bg-primary-100 text-primary-800'
                          : 'bg-gray-200 text-gray-500'
                    }`}
                  >
                    {isCompleted ? (
                      <CheckCircleIcon className="h-6 w-6" />
                    ) : (
                      <span className="text-lg">{stepItem.icon}</span>
                    )}
                  </div>
                  <span className={`text-xs mt-2 ${
                    isActive ? 'text-primary-600 font-medium' : 'text-gray-500'
                  }`}>
                    {stepItem.name}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div 
                    className={`flex-1 h-0.5 mx-2 transition-all ${
                      stepItem.id < step 
                        ? 'bg-primary-600' 
                        : 'bg-gray-200'
                    }`}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Mobile Progress */}
        <div className="sm:hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">
              Step {step} of {steps.length}
            </span>
            <span className="text-sm font-medium text-gray-900">
              {steps.find(s => s.id === step)?.name}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-primary-600 h-2 rounded-full transition-all"
              style={{ width: `${(step / steps.length) * 100}%` }}
            />
          </div>
        </div>
      </div>
    );
  };

  // Render different steps
  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-2 mb-6">
              <span className="w-1 h-8 bg-primary-600 rounded-full"></span>
              <h2 className="text-xl sm:text-2xl font-semibold">Basic Information</h2>
            </div>
            
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                Event Title *
              </label>
              <input
                id="title"
                name="title"
                type="text"
                value={formData.title}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                placeholder="Enter a descriptive title for your event"
                maxLength="100"
              />
              <p className="mt-1 text-xs text-gray-500">{formData.title.length}/100 characters</p>
            </div>
            
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Description *
              </label>
              <textarea
                id="description"
                name="description"
                rows="5"
                value={formData.description}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all resize-none"
                placeholder="Describe your event - what attendees can expect, what's included, special instructions..."
                maxLength="1000"
              />
              <p className="mt-1 text-xs text-gray-500">{formData.description.length}/1000 characters</p>
            </div>
            
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                Category *
              </label>
              <div className="relative">
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full appearance-none px-3 py-2 pl-9 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all cursor-pointer"
                >
                  <option value="">Select a category</option>
                  {EVENT_CATEGORIES.map(category => (
                    <option key={category.value} value={category.value}>
                      {category.label}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                  <ChevronDownIcon className="h-4 w-4 text-gray-400" />
                </div>
                
                {/* Category icon display when selected */}
                {formData.category && (
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-lg pointer-events-none">
                    {EVENT_CATEGORIES.find(c => c.value === formData.category)?.icon}
                  </span>
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              <div>
                <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date *
                </label>
                <input
                  id="startDate"
                  name="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={handleChange}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all cursor-pointer"
                  placeholder="SELECT DATE"
                />
              </div>
              
              <div>
                <label htmlFor="startTime" className="block text-sm font-medium text-gray-700 mb-1">
                  Start Time *
                </label>
                <input
                  id="startTime"
                  name="startTime"
                  type="time"
                  value={formData.startTime}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all cursor-pointer"
                  placeholder="SELECT TIME"
                />
              </div>
              
              <div>
                <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
                  End Date
                </label>
                <input
                  id="endDate"
                  name="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={handleChange}
                  min={formData.startDate || new Date().toISOString().split('T')[0]}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all cursor-pointer"
                  placeholder="SELECT DATE"
                />
                <p className="text-xs text-gray-500 mt-1">Leave empty for single-day events</p>
              </div>
              
              <div>
                <label htmlFor="endTime" className="block text-sm font-medium text-gray-700 mb-1">
                  End Time
                </label>
                <input
                  id="endTime"
                  name="endTime"
                  type="time"
                  value={formData.endTime}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all cursor-pointer"
                  placeholder="SELECT TIME"
                />
                <p className="text-xs text-gray-500 mt-1">Defaults to 2 hours after start</p>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tags
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {formData.tags.map((tag, index) => (
                  <span 
                    key={index} 
                    className="inline-flex items-center gap-1 bg-gray-100 text-gray-800 text-xs px-3 py-1 rounded-full"
                  >
                    {tag}
                    <button 
                      type="button" 
                      onClick={() => removeTag(tag)}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      <XMarkIcon className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  className="flex-grow px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                  placeholder="Add tags (e.g., music, outdoor, family-friendly)"
                />
                <button 
                  type="button" 
                  onClick={addTag}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                >
                  Add
                </button>
              </div>
              <p className="mt-1 text-xs text-gray-500">Press Enter or click Add. Maximum 10 tags.</p>
            </div>
          </div>
        );
        
      case 2:
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-2 mb-6">
              <span className="w-1 h-8 bg-primary-600 rounded-full"></span>
              <h2 className="text-xl sm:text-2xl font-semibold">Event Location</h2>
            </div>
            
            <div>
              <label htmlFor="location.name" className="block text-sm font-medium text-gray-700 mb-1">
                Venue Name *
              </label>
              <input
                id="location.name"
                name="location.name"
                type="text"
                value={formData.location.name}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                placeholder="e.g., Pragati Maidan"
              />
            </div>
            
            <div>
              <label htmlFor="location.address" className="block text-sm font-medium text-gray-700 mb-1">
                Street Address *
              </label>
              <input
                id="location.address"
                name="location.address"
                type="text"
                value={formData.location.address}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                placeholder="e.g., Mathura Road"
              />
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div>
                <label htmlFor="location.city" className="block text-sm font-medium text-gray-700 mb-1">
                  City *
                </label>
                <input
                  id="location.city"
                  name="location.city"
                  type="text"
                  value={formData.location.city}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                  placeholder="e.g., New Delhi"
                />
              </div>
              
              <div>
                <label htmlFor="location.state" className="block text-sm font-medium text-gray-700 mb-1">
                  State *
                </label>
                <input
                  id="location.state"
                  name="location.state"
                  type="text"
                  value={formData.location.state}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                  placeholder="e.g., Delhi"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div>
                <label htmlFor="location.zipCode" className="block text-sm font-medium text-gray-700 mb-1">
                  PIN Code *
                </label>
                <input
                  id="location.zipCode"
                  name="location.zipCode"
                  type="text"
                  value={formData.location.zipCode}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                  placeholder="e.g., 110001"
                />
              </div>
              
              <div>
                <label htmlFor="location.country" className="block text-sm font-medium text-gray-700 mb-1">
                  Country *
                </label>
                <input
                  id="location.country"
                  name="location.country"
                  type="text"
                  value={formData.location.country}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all bg-gray-50"
                  placeholder="India"
                  readOnly
                />
              </div>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex gap-2">
                <InformationCircleIcon className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium text-blue-900 text-sm">Pro Tip</h4>
                  <p className="text-sm text-blue-700 mt-1">
                    Make sure your venue address is accurate. This will help attendees find your event easily 
                    and enable features like map integration.
                  </p>
                </div>
              </div>
            </div>
          </div>
        );
        
      case 3:
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-2 mb-6">
              <span className="w-1 h-8 bg-primary-600 rounded-full"></span>
              <h2 className="text-xl sm:text-2xl font-semibold">Seating Configuration</h2>
            </div>
            
            <div className="bg-gray-50 p-4 sm:p-6 rounded-lg">
              <h3 className="font-medium mb-4 text-lg">Add Seat Section</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="seatSection" className="block text-sm font-medium text-gray-700 mb-1">
                    Section Name *
                  </label>
                  <input
                    id="seatSection"
                    type="text"
                    value={seatSection}
                    onChange={(e) => setSeatSection(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                    placeholder="e.g., Platinum, Gold"
                  />
                </div>
                
                <div>
                  <label htmlFor="seatRows" className="block text-sm font-medium text-gray-700 mb-1">
                    Number of Rows *
                  </label>
                  <input
                    id="seatRows"
                    type="number"
                    value={seatRows}
                    onChange={(e) => setSeatRows(e.target.value)}
                    min="1"
                    max="26"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                    placeholder="1-26"
                  />
                </div>
                
                <div>
                  <label htmlFor="seatsPerRow" className="block text-sm font-medium text-gray-700 mb-1">
                    Seats Per Row *
                  </label>
                  <input
                    id="seatsPerRow"
                    type="number"
                    value={seatsPerRow}
                    onChange={(e) => setSeatsPerRow(e.target.value)}
                    min="1"
                    max="50"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                    placeholder="1-50"
                  />
                </div>
                
                <div>
                  <label htmlFor="seatType" className="block text-sm font-medium text-gray-700 mb-1">
                    Seat Type *
                  </label>
                  <div className="relative">
                    <select
                      id="seatType"
                      value={seatType}
                      onChange={(e) => setSeatType(e.target.value)}
                      className="w-full appearance-none px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all cursor-pointer"
                    >
                      {SEAT_TYPES.map(type => (
                        <option key={type.value} value={type.value}>{type.label}</option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                      <ChevronDownIcon className="h-4 w-4 text-gray-400" />
                    </div>
                  </div>
                </div>
                
                <div>
                  <label htmlFor="seatPrice" className="block text-sm font-medium text-gray-700 mb-1">
                    Price Per Seat (₹) *
                  </label>
                  <div className="relative">
                    <input
                      id="seatPrice"
                      type="number"
                      value={seatPrice}
                      onChange={(e) => setSeatPrice(e.target.value)}
                      min="0"
                      step="1"
                      className="w-full px-3 py-2 pl-7 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                      placeholder="e.g., 499"
                    />
                    <CurrencyRupeeIcon className="h-4 w-4 text-gray-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  </div>
                </div>
                
                <div className="flex items-end">
                  <button 
                    type="button" 
                    onClick={addSeatSection}
                    className="w-full px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 active:bg-primary-800 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all flex items-center justify-center gap-1"
                  >
                    <PlusIcon className="h-5 w-5" />
                    Add Section
                  </button>
                </div>
              </div>
              
              {/* Preview calculation */}
              {seatSection && seatRows && seatsPerRow && seatPrice && (
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <p className="text-sm text-blue-800">
                    This will add <strong>{parseInt(seatRows) * parseInt(seatsPerRow) || 0}</strong> seats 
                    in section <strong>{seatSection}</strong> at <strong>₹{parseFloat(seatPrice).toFixed(2)}</strong> each
                    (Total: <strong>₹{(parseInt(seatRows) * parseInt(seatsPerRow) * parseFloat(seatPrice) || 0).toFixed(2)}</strong>)
                  </p>
                </div>
              )}
            </div>
            
            {/* Configured sections table */}
            {sections.length > 0 ? (
              <div className="mt-6">
                <h3 className="font-medium mb-4 text-lg">Configured Sections</h3>
                <div className="overflow-x-auto rounded-lg border border-gray-200">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Section
                        </th>
                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Type
                        </th>
                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                          Rows
                        </th>
                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Seats
                        </th>
                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Price
                        </th>
                        <th className="px-4 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {sections.map((section, index) => (
                        <tr key={index}>
                          <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                            <div className="font-medium text-gray-900">{section.name}</div>
                          </td>
                          <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 capitalize">
                              {section.type}
                            </span>
                          </td>
                          <td className="px-4 sm:px-6 py-4 whitespace-nowrap hidden sm:table-cell">
                            {section.rows}
                          </td>
                          <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                            {section.totalSeats}
                          </td>
                          <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                            ₹{section.price.toFixed(2)}
                          </td>
                          <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-right">
                            <button
                              onClick={() => removeSeatSection(section.name)}
                              className="text-red-600 hover:text-red-900"
                              aria-label="Remove section"
                            >
                                                            <TrashIcon className="h-5 w-5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="mt-4 text-sm text-gray-600">
                  <p><span className="font-medium">Total Seats:</span> {formData.seats.length}</p>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 sm:py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                <span className="text-5xl mb-4 block">💺</span>
                <p className="text-gray-500 mb-2">No seat sections added yet</p>
                <p className="text-sm text-gray-400">Create sections based on your venue layout</p>
              </div>
            )}
          </div>
        );
        
      case 4:
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-2 mb-6">
              <span className="w-1 h-8 bg-primary-600 rounded-full"></span>
              <h2 className="text-xl sm:text-2xl font-semibold">Event Images</h2>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Main Event Image * <span className="text-xs text-gray-500">(Max 5MB)</span>
              </label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-gray-400 transition-colors">
                {mainImagePreview ? (
                  <div className="w-full">
                    <div className="relative mx-auto max-w-lg">
                      <img 
                        src={mainImagePreview} 
                        alt="Event preview" 
                        className="w-full h-auto rounded-md"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setMainImagePreview('');
                          setFormData({
                            ...formData,
                            imageBase64: ''
                          });
                        }}
                        className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-1.5 hover:bg-red-700 transition-colors"
                      >
                        <XMarkIcon className="h-5 w-5" />
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 text-center mt-2">
                      Click the X to remove and upload a different image
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1 text-center">
                    <PhotoIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="flex flex-wrap justify-center gap-1 text-sm text-gray-600">
                      <label
                        htmlFor="main-image-upload"
                        className="relative cursor-pointer bg-white rounded-md font-medium text-primary-600 hover:text-primary-700 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary-500"
                      >
                        <span>Upload an image</span>
                        <input
                          id="main-image-upload"
                          name="main-image-upload"
                          type="file"
                          className="sr-only"
                          onChange={handleImageChange}
                          accept="image/*"
                        />
                      </label>
                      <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs text-gray-500">PNG, JPG, GIF up to 5MB</p>
                  </div>
                )}
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Gallery Images (Optional) <span className="text-xs text-gray-500">(Max 10 images, 5MB each)</span>
              </label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-gray-400 transition-colors">
                <div className="space-y-1 text-center">
                  <PhotoIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="flex flex-wrap justify-center gap-1 text-sm text-gray-600">
                    <label
                      htmlFor="gallery-images-upload"
                      className="relative cursor-pointer bg-white rounded-md font-medium text-primary-600 hover:text-primary-700 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary-500"
                    >
                      <span>Upload images</span>
                      <input
                        id="gallery-images-upload"
                        name="gallery-images-upload"
                        type="file"
                        className="sr-only"
                        onChange={handleGalleryImagesChange}
                        accept="image/*"
                        multiple
                      />
                    </label>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-xs text-gray-500">PNG, JPG, GIF up to 5MB each</p>
                </div>
              </div>
            </div>
            
            {galleryPreviews.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">
                  Gallery Preview ({galleryPreviews.length}/10)
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {galleryPreviews.map((preview, index) => (
                    <div key={index} className="relative group">
                      <img 
                        src={preview} 
                        alt={`Gallery ${index + 1}`} 
                        className="w-full h-32 object-cover rounded-md"
                      />
                      <button
                        type="button"
                        onClick={() => removeGalleryImage(index)}
                        className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <XMarkIcon className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-md">
              <div className="flex">
                <div className="flex-shrink-0">
                  <CheckCircleIcon className="h-5 w-5 text-yellow-400" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-yellow-700">
                    Your event will be created in <span className="font-medium">draft</span> mode. 
                    You can review it before publishing to make it visible to attendees.
                  </p>
                </div>
              </div>
            </div>

            {/* Summary Section */}
            <div className="bg-gray-50 rounded-lg p-4 sm:p-6">
              <h3 className="font-medium text-gray-900 mb-4">Event Summary</h3>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-gray-600">Title:</dt>
                  <dd className="font-medium text-gray-900">{formData.title || 'Not set'}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-600">Category:</dt>
                  <dd className="font-medium text-gray-900 capitalize">{formData.category || 'Not set'}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-600">Date:</dt>
                  <dd className="font-medium text-gray-900">
                    {formData.startDate ? new Date(formData.startDate).toLocaleDateString() : 'Not set'}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-600">Location:</dt>
                  <dd className="font-medium text-gray-900">
                    {formData.location.city ? `${formData.location.city}, ${formData.location.state}` : 'Not set'}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-600">Total Seats:</dt>
                  <dd className="font-medium text-gray-900">{formData.seats.length}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-600">Tags:</dt>
                  <dd className="font-medium text-gray-900">{formData.tags.length} tags</dd>
                </div>
              </dl>
            </div>
          </div>
        );
        
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-1" />
            Back
          </button>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Create New Event</h1>
          <p className="text-gray-600 mt-1">Fill in the details to create your event</p>
        </div>
        
        {/* Progress Bar */}
        <ProgressBar />
        
        {/* Form */}
        <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 md:p-8 mb-6 sm:mb-8">
          {renderStep()}
        </div>
        
        {/* Navigation buttons */}
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <button
            type="button"
            onClick={prevStep}
            className={`flex items-center justify-center gap-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all ${
              step === 1 ? 'invisible sm:visible' : ''
            }`}
            disabled={step === 1}
          >
            <ChevronLeftIcon className="h-4 w-4" />
            Previous
          </button>
          
          {/* Mobile: Show step indicator in center */}
          <div className="sm:hidden flex justify-center">
            <span className="text-sm text-gray-500">
              Step {step} of {steps.length}
            </span>
          </div>
          
          {step < 4 ? (
            <button
              type="button"
              onClick={nextStep}
              className="flex items-center justify-center gap-1 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 active:bg-primary-800 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
            >
              Next
              <ChevronRightIcon className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className={`flex items-center justify-center gap-1 px-6 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 active:bg-primary-800 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all ${
                loading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating...
                </>
              ) : (
                <>
                  <CheckCircleIcon className="h-5 w-5" />
                  Create Event
                </>
              )}
            </button>
          )}
        </div>

        {/* Help Text */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            Need help? <a href="/contact" className="text-primary-600 hover:text-primary-700 font-medium">Contact support</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default CreateEvent;
