import Event from "../models/event.models.js";
import cloudinary from "../utils/cloudinary.utils.js";
import { io } from "../utils/socket.utils.js";

// @desc    Get all events
// @route   GET /api/events
export const getEvents = async (req, res) => {
  try {
    const { 
      category, 
      city, 
      date, 
      search,
      featured,
      status = "published", 
      limit = 10,
      page = 1
    } = req.query;
    
    // Build query
    let query = {};
    
    // Only show published events to public
    if (!req.user || req.user.role === "user") {
      query.status = "published";
    } else if (status) {
      query.status = status;
    }
    
    // Apply filters
    if (category) {
      query.category = category;
    }
    
    if (city) {
      query["location.city"] = { $regex: new RegExp(city, "i") };
    }
    
    if (date) {
      const searchDate = new Date(date);
      query.startDate = { $gte: searchDate };
    }
    
    if (featured === "true") {
      query.isFeatured = true;
    }
    
    if (search) {
      query.$or = [
        { title: { $regex: new RegExp(search, "i") } },
        { description: { $regex: new RegExp(search, "i") } },
        { "location.name": { $regex: new RegExp(search, "i") } }
      ];
    }
    
    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Execute query
    const events = await Event.find(query)
      .populate("organizer", "name")
      .sort({ startDate: 1 })
      .skip(skip)
      .limit(parseInt(limit))
      .select("-seats"); // Don't return all seat data for list view
    
    // Get total count
    const total = await Event.countDocuments(query);
    
    res.status(200).json({
      success: true,
      count: events.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      data: events
    });
  } catch (error) {
    console.error("Error in getEvents controller:", error.message);
    res.status(500).json({ 
      success: false,
      message: "Server error", 
      error: error.message 
    });
  }
};

// @desc    Get single event
// @route   GET /api/events/:id
export const getEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate("organizer", "name email");
    
    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found"
      });
    }
    
    // If event is not published, only organizer and admin can view it
    if (event.status !== "published") {
      if (!req.user || 
          (req.user.role !== "admin" && 
           event.organizer._id.toString() !== req.user._id.toString())) {
        return res.status(403).json({
          success: false,
          message: "This event is not available for viewing"
        });
      }
    }
    
    res.status(200).json({
      success: true,
      data: event
    });
  } catch (error) {
    console.error("Error in getEvent controller:", error.message);
    res.status(500).json({ 
      success: false,
      message: "Server error", 
      error: error.message 
    });
  }
};

// @desc    Create new event
// @route   POST /api/events
export const createEvent = async (req, res) => {
  try {
    const {
      title,
      description,
      imageBase64,
      galleryImagesBase64,
      startDate,
      endDate,
      location,
      category,
      seats,
      totalSeats,
      availableSeats,
      tags
    } = req.body;
    
    // Upload main image to cloudinary
    let imageUrl = "";
    if (imageBase64) {
      const uploadResponse = await cloudinary.uploader.upload(imageBase64, {
        folder: "event_booking/events"
      });
      imageUrl = uploadResponse.secure_url;
    }
    
    // Upload gallery images if provided
    let galleryImages = [];
    if (galleryImagesBase64 && galleryImagesBase64.length > 0) {
      for (const image of galleryImagesBase64) {
        const uploadResponse = await cloudinary.uploader.upload(image, {
          folder: "event_booking/events/gallery"
        });
        galleryImages.push(uploadResponse.secure_url);
      }
    }
    
    // Create event
    const event = await Event.create({
      title,
      description,
      imageUrl,
      galleryImages,
      startDate,
      endDate,
      location,
      category,
      organizer: req.user._id,
      seats: seats || [],
      totalSeats: totalSeats || (seats ? seats.length : 0),
      availableSeats: availableSeats || (seats ? seats.filter(seat => seat.isAvailable).length : 0),
      isFeatured: req.user.role === "admin" ? (req.body.isFeatured || false) : false,
      status: "draft",
      tags: tags || []
    });
    
    res.status(201).json({
      success: true,
      data: event
    });
  } catch (error) {
    console.error("Error in createEvent controller:", error.message);
    res.status(500).json({ 
      success: false,
      message: "Server error", 
      error: error.message 
    });
  }
};

// @desc    Update event
// @route   PUT /api/events/:id
export const updateEvent = async (req, res) => {
  try {
    let event = await Event.findById(req.params.id);
    
    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found"
      });
    }
    
    // Check ownership or admin status
    if (event.organizer.toString() !== req.user._id.toString() && 
        req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this event"
      });
    }
    
    // Handle image upload if provided
    if (req.body.imageBase64) {
      const uploadResponse = await cloudinary.uploader.upload(req.body.imageBase64, {
        folder: "event_booking/events"
      });
      req.body.imageUrl = uploadResponse.secure_url;
      delete req.body.imageBase64;
    }
    
    // Handle gallery images upload if provided
    if (req.body.galleryImagesBase64 && req.body.galleryImagesBase64.length > 0) {
      const galleryImages = [];
      
      for (const image of req.body.galleryImagesBase64) {
        const uploadResponse = await cloudinary.uploader.upload(image, {
          folder: "event_booking/events/gallery"
        });
        galleryImages.push(uploadResponse.secure_url);
      }
      
      req.body.galleryImages = galleryImages;
      delete req.body.galleryImagesBase64;
    }
    
    // Only admin can set featured status
    if (req.user.role !== "admin") {
      delete req.body.isFeatured;
    }
    
    // Update event
    event = await Event.findByIdAndUpdate(
      req.params.id, 
      req.body, 
      { new: true, runValidators: true }
    );
    
    res.status(200).json({
      success: true,
      data: event
    });
  } catch (error) {
    console.error("Error in updateEvent controller:", error.message);
    res.status(500).json({ 
      success: false,
      message: "Server error", 
      error: error.message 
    });
  }
};

// @desc    Delete event
// @route   DELETE /api/events/:id
export const deleteEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    
    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found"
      });
    }
    
    // Check ownership or admin status
    if (event.organizer.toString() !== req.user._id.toString() && 
        req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this event"
      });
    }
    
    await event.deleteOne();
    
    res.status(200).json({
      success: true,
      message: "Event deleted successfully"
    });
  } catch (error) {
    console.error("Error in deleteEvent controller:", error.message);
    res.status(500).json({ 
      success: false,
      message: "Server error", 
      error: error.message 
    });
  }
};

// @desc    Get organizer events
// @route   GET /api/events/organizer
export const getOrganizerEvents = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    
    let query = { organizer: req.user._id };
    
    if (status) {
      query.status = status;
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const events = await Event.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .select("-seats"); // Don't need seat details for list view
    
    const total = await Event.countDocuments(query);
    
    res.status(200).json({
      success: true,
      count: events.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      data: events
    });
  } catch (error) {
    console.error("Error in getOrganizerEvents controller:", error.message);
    res.status(500).json({ 
      success: false,
      message: "Server error", 
      error: error.message 
    });
  }
};

// @desc    Update event seats
// @route   PUT /api/events/:id/seats
export const updateEventSeats = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    
    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found"
      });
    }
    
    // Check ownership or admin status
    if (event.organizer.toString() !== req.user._id.toString() && 
        req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this event's seats"
      });
    }
    
    // Only allow seat updates for draft events
    if (event.status !== "draft") {
      return res.status(400).json({
        success: false,
        message: "Can only update seats for draft events"
      });
    }
    
    // Update seats
    event.seats = req.body.seats;
    event.totalSeats = req.body.seats.length;
    event.availableSeats = req.body.seats.filter(seat => seat.isAvailable).length;
    
    await event.save();
    
    res.status(200).json({
      success: true,
      message: "Event seats updated successfully",
      data: event
    });
  } catch (error) {
    console.error("Error in updateEventSeats controller:", error.message);
    res.status(500).json({ 
      success: false,
      message: "Server error", 
      error: error.message 
    });
  }
};

// @desc    Select a seat for an event
// @route   POST /api/events/:id/select-seat
export const selectSeat = async (req, res) => {
  try {
    const { id } = req.params;
    const { seatId } = req.body;
    
    const event = await Event.findById(id);
    
    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found"
      });
    }
    
    // Find the seat
    const seat = event.seats.id(seatId);
    
    if (!seat) {
      return res.status(404).json({
        success: false,
        message: "Seat not found"
      });
    }
    
    if (!seat.isAvailable) {
      return res.status(400).json({
        success: false,
        message: "Seat is not available"
      });
    }
    
    // Temporarily mark seat as unavailable
    seat.isAvailable = false;
    await event.save();
    
    // Notify all clients in the event room about the seat selection
    io.to(`event:${id}`).emit("seatSelected", { 
      seatId, 
      userId: req.user._id.toString() 
    });
    
    // Set timeout to release seat if booking not completed (10 minutes)
    setTimeout(async () => {
      try {
        const updatedEvent = await Event.findById(id);
        if (updatedEvent) {
          const updatedSeat = updatedEvent.seats.id(seatId);
          if (updatedSeat && !updatedSeat.isAvailable) {
            // Check if this seat is part of a confirmed booking
            const isBooked = false; // In a real app, you'd check against bookings
            
            if (!isBooked) {
              // Release the seat
              updatedSeat.isAvailable = true;
              await updatedEvent.save();
              
              // Notify clients
              io.to(`event:${id}`).emit("seatReleased", { seatId });
            }
          }
        }
      } catch (error) {
        console.error("Error in seat release timeout:", error);
      }
    }, 10 * 60 * 1000); // 10 minutes
    
    res.status(200).json({
      success: true,
      message: "Seat selected successfully",
      data: {
        seatId: seat._id,
        number: seat.number,
        row: seat.row,
        price: seat.price,
        section: seat.section,
        type: seat.type
      }
    });
  } catch (error) {
    console.error("Error in selectSeat controller:", error.message);
    res.status(500).json({ 
      success: false,
      message: "Server error", 
      error: error.message 
    });
  }
};

// @desc    Release a selected seat
// @route   POST /api/events/:id/release-seat
export const releaseSeat = async (req, res) => {
  try {
    const { id } = req.params;
    const { seatId } = req.body;
    
    const event = await Event.findById(id);
    
    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found"
      });
    }
    
    // Find the seat
    const seat = event.seats.id(seatId);
    
    if (!seat) {
      return res.status(404).json({
        success: false,
        message: "Seat not found"
      });
    }
    
    // Check if this seat is part of a confirmed booking
    const isBooked = false; // In a real app, you'd check against bookings
    
    if (isBooked) {
      return res.status(400).json({
        success: false,
        message: "Cannot release a seat that has been booked"
      });
    }
    
    // Mark seat as available again
    seat.isAvailable = true;
    await event.save();
    
    // Notify all clients in the event room about the seat release
    io.to(`event:${id}`).emit("seatReleased", { seatId });
    
    res.status(200).json({
      success: true,
      message: "Seat released successfully"
    });
  } catch (error) {
    console.error("Error in releaseSeat controller:", error.message);
    res.status(500).json({ 
      success: false,
      message: "Server error", 
      error: error.message 
    });
  }
};

// @desc    Publish an event
// @route   PUT /api/events/:id/publish
export const publishEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    
    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found"
      });
    }
    
    // Check ownership or admin status
    if (event.organizer.toString() !== req.user._id.toString() && 
        req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Not authorized to publish this event"
      });
    }
    
    // Check if event has seats
    if (!event.seats || event.seats.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Cannot publish an event without seats"
      });
    }
    
    // Update event status to published
    event.status = "published";
    await event.save();
    
    res.status(200).json({
      success: true,
      message: "Event published successfully",
      data: event
    });
  } catch (error) {
    console.error("Error in publishEvent controller:", error.message);
    res.status(500).json({ 
      success: false,
      message: "Server error", 
      error: error.message 
    });
  }
};
