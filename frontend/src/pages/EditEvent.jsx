import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { eventService } from "../services/auth";
import { EVENT_CATEGORIES, EVENT_STATUS } from "../utils/constants";
import {
  ArrowLeftIcon,
  XMarkIcon,
  PhotoIcon,
  ExclamationCircleIcon,
  CheckCircleIcon,
  ChevronDownIcon,
  TicketIcon ,
  MapPinIcon
} from "@heroicons/react/24/outline";
import toast from "react-hot-toast";
import Loader from "../components/Loader";

const EditEvent = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [event, setEvent] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    startDate: "",
    startTime: "",
    endDate: "",
    endTime: "",
    location: {
      name: "",
      address: "",
      city: "",
      state: "",
      zipCode: "",
      country: "India",
    },
    imageBase64: "",
    galleryImagesBase64: [],
    tags: [],
  });

  const [tagInput, setTagInput] = useState("");

  const [mainImagePreview, setMainImagePreview] = useState("");
  const [galleryPreviews, setGalleryPreviews] = useState([]);

  useEffect(() => {
    fetchEvent();
  }, [id]);

  const fetchEvent = async () => {
    try {
      setLoading(true);
      const response = await eventService.getEvent(id);
      const eventData = response.data.data || response.data;
      setEvent(eventData);

      const startDate = new Date(eventData.startDate);
      const endDate = eventData.endDate
        ? new Date(eventData.endDate)
        : new Date(startDate);

      const formattedStartDate = startDate.toISOString().split("T")[0];
      const formattedStartTime = startDate.toTimeString().substring(0, 5);

      const formattedEndDate = endDate.toISOString().split("T")[0];
      const formattedEndTime = endDate.toTimeString().substring(0, 5);

      setFormData({
        title: eventData.title || "",
        description: eventData.description || "",
        category: eventData.category || "",
        startDate: formattedStartDate,
        startTime: formattedStartTime,
        endDate: formattedEndDate,
        endTime: formattedEndTime,
        location: {
          name: eventData.location?.name || "",
          address: eventData.location?.address || "",
          city: eventData.location?.city || "",
          state: eventData.location?.state || "",
          zipCode: eventData.location?.zipCode || "",
          country: eventData.location?.country || "India",
        },
        tags: eventData.tags || [],
      });

      if (eventData.imageUrl) {
        setMainImagePreview(eventData.imageUrl);
      }

      if (eventData.galleryImages && eventData.galleryImages.length > 0) {
        setGalleryPreviews(eventData.galleryImages);
      }
    } catch (error) {
      console.error("Error fetching event:", error);
      toast.error("Failed to load event details");
      navigate("/dashboard");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name.startsWith("location.")) {
      const locationField = name.split(".")[1];
      setFormData({
        ...formData,
        location: {
          ...formData.location,
          [locationField]: value,
        },
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData({
        ...formData,
        imageBase64: reader.result,
      });
      setMainImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleGalleryImagesChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    if (galleryPreviews.length + files.length > 10) {
      toast.error('You can upload a maximum of 10 gallery images');
      return;
    }

    const newPreviews = [...galleryPreviews];
    const newGalleryImages = [...(formData.galleryImagesBase64 || [])];

    files.forEach((file) => {
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
          galleryImagesBase64: newGalleryImages,
        });
      };
      reader.readAsDataURL(file);
    });
  };

  const removeGalleryImage = (index) => {
    const isNewUpload = galleryPreviews[index].startsWith("data:");

    const newPreviews = [...galleryPreviews];
    newPreviews.splice(index, 1);
    setGalleryPreviews(newPreviews);

    if (isNewUpload) {
      const newGalleryImages = [...formData.galleryImagesBase64];
      const indexInNewUploads = formData.galleryImagesBase64.findIndex(
        (img) => img === galleryPreviews[index]
      );

      if (indexInNewUploads !== -1) {
        newGalleryImages.splice(indexInNewUploads, 1);
        setFormData({
          ...formData,
          galleryImagesBase64: newGalleryImages,
        });
      }
    } else {
      toast.info("Image removed from display. Changes will be saved when you update the event.");
    }
  };

  const addTag = () => {
    if (!tagInput.trim()) return;

    if (formData.tags.includes(tagInput.trim())) {
      setTagInput("");
      return;
    }

    setFormData({
      ...formData,
      tags: [...formData.tags, tagInput.trim()],
    });
    setTagInput("");
  };

  const removeTag = (tag) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter((t) => t !== tag),
    });
  };

  const handleSubmit = async () => {
    if (
      !formData.title ||
      !formData.description ||
      !formData.category ||
      !formData.startDate ||
      !formData.startTime
    ) {
      toast.error("Please fill all required fields");
      return;
    }

    if (
      !formData.location.name ||
      !formData.location.address ||
      !formData.location.city ||
      !formData.location.state ||
      !formData.location.zipCode ||
      !formData.location.country
    ) {
      toast.error("Please fill all location fields");
      return;
    }

    if (!mainImagePreview) {
      toast.error("Please upload a main event image");
      return;
    }

    setSaving(true);

    try {
      const startDateTime = new Date(
        `${formData.startDate}T${formData.startTime}`
      );
      const endDateTime =
        formData.endDate && formData.endTime
          ? new Date(`${formData.endDate}T${formData.endTime}`)
          : new Date(startDateTime.getTime() + 2 * 60 * 60 * 1000); 

      const eventUpdateData = {
        ...formData,
        startDate: startDateTime.toISOString(),
        endDate: endDateTime.toISOString(),
      };

      if (!formData.imageBase64) {
        delete eventUpdateData.imageBase64;
      }

      if (
        !eventUpdateData.galleryImagesBase64 ||
        eventUpdateData.galleryImagesBase64.length === 0
      ) {
        delete eventUpdateData.galleryImagesBase64;
      }

      const response = await eventService.updateEvent(id, eventUpdateData);

      setEvent(response.data.data || response.data);
      toast.success("Event updated successfully!");

      navigate(`/events/${id}`);
    } catch (error) {
      console.error("Error updating event:", error);
      toast.error("Failed to update event");
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    if (event.status === EVENT_STATUS.PUBLISHED) {
      toast.info("Event is already published");
      return;
    }

    if (
      !window.confirm(
        "Are you sure you want to publish this event? It will be visible to all users."
      )
    ) {
      return;
    }

    setPublishing(true);

    try {
      await eventService.publishEvent(id);
      setEvent({
        ...event,
        status: EVENT_STATUS.PUBLISHED,
      });

      toast.success("Event published successfully!");
    } catch (error) {
      console.error("Error publishing event:", error);
      toast.error("Failed to publish event");
    } finally {
      setPublishing(false);
    }
  };

  if (loading) return <Loader text="Loading event details..." />;
  if (!event)
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
        <ExclamationCircleIcon className="h-16 w-16 text-red-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Event Not Found
        </h2>
        <p className="text-gray-600 mb-8">
          The event you're trying to edit doesn't exist or has been removed.
        </p>
        <button 
          onClick={() => navigate("/dashboard")} 
          className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
        >
          Return to Dashboard
        </button>
      </div>
    );

  const isPastEvent = new Date(event.startDate) < new Date();

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-2 sm:mb-0"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-1" />
            Back
          </button>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Edit Event
          </h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <span
            className={`px-3 py-1 text-sm font-medium rounded-full ${
              event.status === EVENT_STATUS.PUBLISHED
                ? "bg-green-100 text-green-800"
                : event.status === EVENT_STATUS.DRAFT
                ? "bg-yellow-100 text-yellow-800"
                : "bg-gray-100 text-gray-800"
            }`}
          >
            {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
          </span>

          {event.status === EVENT_STATUS.DRAFT && !isPastEvent && (
            <button
              onClick={handlePublish}
              disabled={publishing}
              className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded-md text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {publishing ? "Publishing..." : "Publish Event"}
            </button>
          )}
        </div>
      </div>

      {isPastEvent && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
          <div className="flex">
            <ExclamationCircleIcon className="h-5 w-5 text-yellow-400 flex-shrink-0" />
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                This event has already started or ended. Some changes may not
                affect attendees.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 mb-8">
        <div className="space-y-8">
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">Event Information</h2>

            <div>
              <label
                htmlFor="title"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
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
              />
            </div>

            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Description *
              </label>
              <textarea
                id="description"
                name="description"
                rows="5"
                value={formData.description}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                placeholder="Describe your event, what attendees can expect"
              />
            </div>

            <div>
              <label
                htmlFor="category"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Category *
              </label>
              <div className="relative">
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full appearance-none px-3 py-2 pl-9 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                >
                  <option value="">Select a category</option>
                  {EVENT_CATEGORIES.map((category) => (
                    <option key={category.value} value={category.value}>
                      {category.label}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                  <ChevronDownIcon className="h-4 w-4 text-gray-400" />
                </div>
                
                {formData.category && (
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-lg pointer-events-none">
                    {EVENT_CATEGORIES.find(c => c.value === formData.category)?.icon}
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              <div>
                <label
                  htmlFor="startDate"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Start Date *
                </label>
                <input
                  id="startDate"
                  name="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                  placeholder="SELECT DATE"
                />
              </div>

              <div>
                <label
                  htmlFor="startTime"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Start Time *
                </label>
                <input
                  id="startTime"
                  name="startTime"
                  type="time"
                  value={formData.startTime}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                  placeholder="SELECT TIME"
                />
              </div>

              <div>
                <label
                  htmlFor="endDate"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  End Date
                </label>
                <input
                  id="endDate"
                  name="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                  min={formData.startDate}
                  placeholder="SELECT DATE"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Optional for multi-day events
                </p>
              </div>

              <div>
                <label
                  htmlFor="endTime"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  End Time
                </label>
                <input
                  id="endTime"
                  name="endTime"
                  type="time"
                  value={formData.endTime}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                  placeholder="SELECT TIME"
                />
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
                    className="bg-gray-100 text-gray-800 text-xs px-3 py-1 rounded-full flex items-center"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="ml-1 text-gray-500 hover:text-gray-700"
                      aria-label={`Remove tag ${tag}`}
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
                  onKeyDown={(e) =>
                    e.key === "Enter" && (e.preventDefault(), addTag())
                  }
                  className="flex-grow px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                  placeholder="Add tags (e.g., music, outdoor, family-friendly)"
                />
                <button
                  type="button"
                  onClick={addTag}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                >
                  Add
                </button>
              </div>
              <p className="mt-1 text-xs text-gray-500">Press Enter or click Add. Maximum 10 tags.</p>
            </div>
          </div>

          <div className="border-t pt-8 space-y-6">
            <h2 className="text-xl font-semibold">Event Location</h2>

            <div>
              <label
                htmlFor="location.name"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
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
              <label
                htmlFor="location.address"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
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
                <label
                  htmlFor="location.city"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
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
                <label
                  htmlFor="location.state"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
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
                <label
                  htmlFor="location.zipCode"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  PIN Code *
                </label>
                <div className="relative">
                  <input
                    id="location.zipCode"
                    name="location.zipCode"
                    type="text"
                    value={formData.location.zipCode}
                    onChange={handleChange}
                    className="w-full px-3 py-2 pl-8 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                    placeholder="e.g., 110001"
                  />
                  <MapPinIcon className="h-4 w-4 text-gray-400 absolute left-2 top-1/2 transform -translate-y-1/2" />
                </div>
                <p className="text-xs text-gray-500 mt-1">Indian PIN Code</p>
              </div>

              <div>
                <label
                  htmlFor="location.country"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
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
          </div>

          <div className="border-t pt-8 space-y-6">
            <h2 className="text-xl font-semibold">Event Images</h2>

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
                          setMainImagePreview("");
                          setFormData({
                            ...formData,
                            imageBase64: "",
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
                    <p className="text-xs text-gray-500">
                      PNG, JPG, GIF up to 5MB
                    </p>
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
                  <p className="text-xs text-gray-500">
                    PNG, JPG, GIF up to 5MB each
                  </p>
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
                        aria-label="Remove image"
                      >
                        <XMarkIcon className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="border-t pt-8">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <TicketIcon  className="h-6 w-6 mr-2 text-primary-600" />
              Seating Configuration
            </h2>
            <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <CheckCircleIcon
                    className="h-5 w-5 text-blue-400"
                    aria-hidden="true"
                  />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-blue-700">
                    This event has {event.seats?.length || 0} seats configured.
                    To modify seating, please contact support.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <button
          type="button"
          onClick={() => navigate(`/events/${id}`)}
          className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
        >
          Cancel
        </button>

        <div className="flex flex-col sm:flex-row gap-4">
          {event.status === EVENT_STATUS.DRAFT && !isPastEvent && (
            <button
              type="button"
              onClick={handlePublish}
              disabled={publishing}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {publishing ? "Publishing..." : "Publish Event"}
            </button>
          )}

          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving}
            className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditEvent;
