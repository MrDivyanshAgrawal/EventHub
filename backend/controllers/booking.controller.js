import Booking from "../models/booking.models.js";
import Event from "../models/event.models.js";
import Stripe from "stripe";
import cloudinary from "../utils/cloudinary.utils.js";
import { io } from "../utils/socket.utils.js";
import QRCode from "qrcode";

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Generate unique ticket code
const generateTicketCode = () => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return code;
};

// Generate QR code for a ticket
const generateQRCode = async (ticketCode) => {
  try {
    const qrDataURL = await QRCode.toDataURL(ticketCode);
    const uploadResult = await cloudinary.uploader.upload(qrDataURL, {
      folder: "event_booking/tickets"
    });
    return uploadResult.secure_url;
  } catch (error) {
    console.error("Error generating QR code:", error);
    return null;
  }
};

// @desc    Create booking (initiate payment)
// @route   POST /api/bookings
export const createBooking = async (req, res) => {
  try {
    const { eventId, selectedSeats, paymentId } = req.body; // Now accepting paymentId
    
    // Validate request
    if (!eventId || !selectedSeats || selectedSeats.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Event ID and at least one seat are required"
      });
    }
    
    // Find event
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found"
      });
    }
    
    // Check if event is published
    if (event.status !== "published") {
      return res.status(400).json({
        success: false,
        message: "Cannot book tickets for an unpublished event"
      });
    }
    
    // Validate and collect seat information
    let totalAmount = 0;
    const bookingSeats = [];
    
    for (const seatId of selectedSeats) {
      const seat = event.seats.id(seatId);
      
      if (!seat) {
        return res.status(404).json({
          success: false,
          message: `Seat with ID ${seatId} not found`
        });
      }
      
      if (!seat.isAvailable) {
        return res.status(400).json({
          success: false,
          message: `Seat ${seat.number} in row ${seat.row} is not available`
        });
      }
      
      totalAmount += seat.price;
      bookingSeats.push({
        seatId: seat._id,
        number: seat.number,
        row: seat.row,
        section: seat.section,
        price: seat.price,
        type: seat.type
      });
    }
    
    // If paymentId is provided, use it. Otherwise create a new payment intent
    let paymentIntentId = paymentId;
    
    if (!paymentIntentId) {
      // Create payment intent with Stripe
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(totalAmount * 100), // Convert to cents and round
        currency: "inr",
        metadata: {
          eventId,
          userId: req.user._id.toString(),
          seats: JSON.stringify(selectedSeats)
        }
      });
      paymentIntentId = paymentIntent.id;
    }
    
    // Create booking record (status: pending)
    const booking = await Booking.create({
      user: req.user._id,
      event: eventId,
      seats: bookingSeats,
      totalAmount,
      paymentId: paymentIntentId,
      paymentStatus: "pending",
      status: "pending"
    });
    
    // Return the booking response
    res.status(201).json({
      success: true,
      bookingId: booking._id,
      totalAmount
    });
  } catch (error) {
    console.error("Error in createBooking controller:", error.message);
    res.status(500).json({ 
      success: false,
      message: "Server error", 
      error: error.message 
    });
  }
};

// @desc    Confirm booking after payment
// @route   PUT /api/bookings/:id/confirm
export const confirmBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const { paymentIntentId } = req.body;
    
    // Find the booking
    const booking = await Booking.findById(id);
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found"
      });
    }
    
    // Verify that the user owns this booking
    if (booking.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to confirm this booking"
      });
    }
    
    // Verify payment with Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(
      paymentIntentId || booking.paymentId
    );
    
    if (paymentIntent.status !== "succeeded") {
      return res.status(400).json({
        success: false,
        message: "Payment not successful"
      });
    }
    
    // Generate ticket code
    const ticketCode = generateTicketCode();
    
    // Generate QR code
    const qrCode = await generateQRCode(ticketCode);
    
    // Update booking status
    booking.paymentStatus = "completed";
    booking.status = "confirmed";
    booking.ticketCode = ticketCode;
    booking.qrCode = qrCode;
    
    await booking.save();
    
    // Update event's seat availability
    const event = await Event.findById(booking.event);
    
    if (event) {
      // Track successfully booked seats for notification
      const bookedSeatIds = [];
      
      // Update seats availability
      for (const bookedSeat of booking.seats) {
        const seat = event.seats.id(bookedSeat.seatId);
        if (seat) {
          // Only update if the seat is not already marked as unavailable
          if (seat.isAvailable) {
            seat.isAvailable = false;
            bookedSeatIds.push(bookedSeat.seatId.toString());
          }
        }
      }
      
      // Only update available seats count if we actually changed any seats
      if (bookedSeatIds.length > 0) {
        // Ensure we don't go below 0 available seats
        event.availableSeats = Math.max(0, event.availableSeats - bookedSeatIds.length);
        await event.save();
        
        // Notify all clients in event room about booked seats
        io.to(`event:${booking.event}`).emit("seatsBooked", { 
          seats: bookedSeatIds
        });
      }
    }
    
    // Return the confirmed booking with ticket details
    res.status(200).json({
      success: true,
      message: "Booking confirmed successfully",
      data: {
        bookingId: booking._id,
        eventId: booking.event,
        ticketCode,
        qrCode,
        seats: booking.seats,
        totalAmount: booking.totalAmount
      }
    });
  } catch (error) {
    console.error("Error in confirmBooking controller:", error.message);
    res.status(500).json({ 
      success: false,
      message: "Server error", 
      error: error.message 
    });
  }
};

// @desc    Get all bookings for the current user
// @route   GET /api/bookings
export const getUserBookings = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    
    // Build query
    const query = { user: req.user._id };
    
    if (status) {
      query.status = status;
    }
    
    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Execute query
    const bookings = await Booking.find(query)
      .populate({
        path: "event",
        select: "title startDate location imageUrl status"
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    // Get total count
    const total = await Booking.countDocuments(query);
    
    res.status(200).json({
      success: true,
      count: bookings.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      data: bookings
    });
  } catch (error) {
    console.error("Error in getUserBookings controller:", error.message);
    res.status(500).json({ 
      success: false,
      message: "Server error", 
      error: error.message 
    });
  }
};

// @desc    Get single booking details
// @route   GET /api/bookings/:id
export const getBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate({
        path: "event",
        select: "title startDate endDate location imageUrl organizer status",
        populate: { path: "organizer", select: "name" }
      })
      .populate({
        path: "user",
        select: "name email"
      });
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found"
      });
    }
    
    // Check authorization - user can only see their own bookings
    // Organizers can see bookings for their events
    // Admins can see all bookings
    const isOwner = booking.user._id.toString() === req.user._id.toString();
    const isOrganizer = booking.event.organizer._id.toString() === req.user._id.toString();
    const isAdmin = req.user.role === "admin";
    
    if (!isOwner && !isOrganizer && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to view this booking"
      });
    }
    
    res.status(200).json({
      success: true,
      data: booking
    });
  } catch (error) {
    console.error("Error in getBooking controller:", error.message);
    res.status(500).json({ 
      success: false,
      message: "Server error", 
      error: error.message 
    });
  }
};

// @desc    Cancel a booking
// @route   PUT /api/bookings/:id/cancel
export const cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found"
      });
    }
    
    // Only the booking owner or an admin can cancel
    if (booking.user.toString() !== req.user._id.toString() && 
        req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Not authorized to cancel this booking"
      });
    }
    
    // Can't cancel if already cancelled
    if (booking.status === "cancelled") {
      return res.status(400).json({
        success: false,
        message: "This booking is already cancelled"
      });
    }
    
    // Handle payment refund if needed
    if (booking.paymentStatus === "completed") {
      try {
        // Create a refund with Stripe
        await stripe.refunds.create({
          payment_intent: booking.paymentId,
          reason: "requested_by_customer"
        });
        
        booking.paymentStatus = "refunded";
      } catch (error) {
        console.error("Error processing refund:", error);
        
        // Handle already refunded charges
        if (error.code === 'charge_already_refunded') {
          console.log("Charge was already refunded, proceeding with cancellation");
          booking.paymentStatus = "refunded";
        } else {
          return res.status(500).json({
            success: false,
            message: "Error processing refund",
            error: error.message
          });
        }
      }
    }
    
    // Update booking status
    booking.status = "cancelled";
    await booking.save();
    
    // Release seats back to available
    const event = await Event.findById(booking.event);
    
    if (event) {
      // Track successfully released seats for notification
      const releasedSeatIds = [];
      
      // Check each seat to see if it needs to be released
      for (const bookedSeat of booking.seats) {
        const seat = event.seats.id(bookedSeat.seatId);
        
        if (seat) {
          // Only mark as available if it's not already available
          if (!seat.isAvailable) {
            seat.isAvailable = true;
            releasedSeatIds.push(bookedSeat.seatId.toString());
          }
        }
      }
      
      // Only update available seats count if we actually made changes
      if (releasedSeatIds.length > 0) {
        // Use Math.min to ensure we don't go over the total seats
        event.availableSeats = Math.min(
          event.totalSeats,
          event.availableSeats + releasedSeatIds.length
        );
        await event.save();
        
        // Notify all clients in event room about released seats
        io.to(`event:${booking.event}`).emit("seatsReleased", {
          seats: releasedSeatIds
        });
      }
    }
    
    res.status(200).json({
      success: true,
      message: "Booking cancelled successfully"
    });
  } catch (error) {
    console.error("Error in cancelBooking controller:", error.message);
    res.status(500).json({ 
      success: false,
      message: "Server error", 
      error: error.message 
    });
  }
};

// @desc    Verify ticket (for event check-in)
// @route   PUT /api/bookings/verify-ticket
export const verifyTicket = async (req, res) => {
  try {
    const { ticketCode } = req.body;
    
    if (!ticketCode) {
      return res.status(400).json({
        success: false,
        message: "Ticket code is required"
      });
    }
    
    const booking = await Booking.findOne({ ticketCode })
      .populate({
        path: "event",
        select: "title startDate endDate location organizer status",
        populate: { path: "organizer", select: "name _id" }
      })
      .populate({
        path: "user",
        select: "name email"
      });
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Invalid ticket code"
      });
    }
    
    // Check if the user is the organizer or an admin
    if (booking.event.organizer._id.toString() !== req.user._id.toString() && 
        req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Not authorized to verify tickets for this event"
      });
    }
    
    // Check if ticket is for a confirmed booking
    if (booking.status !== "confirmed") {
      return res.status(400).json({
        success: false,
        message: "This booking is not confirmed"
      });
    }
    
    // Check if already checked in
    if (booking.checkedIn) {
      return res.status(400).json({
        success: false,
        message: "This ticket has already been used for check-in",
        checkedInAt: booking.checkedInAt
      });
    }
    
    // Mark as checked in
    booking.checkedIn = true;
    booking.checkedInAt = new Date();
    await booking.save();
    
    res.status(200).json({
      success: true,
      message: "Ticket verified successfully",
      data: {
        bookingId: booking._id,
        event: {
          id: booking.event._id,
          title: booking.event.title
        },
        user: {
          name: booking.user.name,
          email: booking.user.email
        },
        seats: booking.seats,
        checkedInAt: booking.checkedInAt
      }
    });
  } catch (error) {
    console.error("Error in verifyTicket controller:", error.message);
    res.status(500).json({ 
      success: false,
      message: "Server error", 
      error: error.message 
    });
  }
};

// @desc    Get bookings for an organizer's events
// @route   GET /api/bookings/organizer
export const getOrganizerBookings = async (req, res) => {
  try {
    const { eventId, status, page = 1, limit = 10 } = req.query;
    
    // Find events organized by the user
    let eventIds = [];
    
    if (eventId) {
      // Check if the user is the organizer of this event
      const event = await Event.findById(eventId);
      if (!event) {
        return res.status(404).json({
          success: false,
          message: "Event not found"
        });
      }
      
      if (event.organizer.toString() !== req.user._id.toString() && 
          req.user.role !== "admin") {
        return res.status(403).json({
          success: false,
          message: "Not authorized to view bookings for this event"
        });
      }
      
      eventIds.push(eventId);
    } else {
      // Get all events organized by the user
      const events = await Event.find({ organizer: req.user._id }).select("_id");
      eventIds = events.map(event => event._id);
    }
    
    if (eventIds.length === 0) {
      return res.status(200).json({
        success: true,
        count: 0,
        total: 0,
        page: parseInt(page),
        pages: 0,
        data: []
      });
    }
    
    // Build query
    const query = { event: { $in: eventIds } };
    
    if (status) {
      query.status = status;
    }
    
    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Execute query
    const bookings = await Booking.find(query)
      .populate({
        path: "event",
        select: "title startDate location"
      })
      .populate({
        path: "user",
        select: "name email"
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    // Get total count
    const total = await Booking.countDocuments(query);
    
    res.status(200).json({
      success: true,
      count: bookings.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      data: bookings
    });
  } catch (error) {
    console.error("Error in getOrganizerBookings controller:", error.message);
    res.status(500).json({ 
      success: false,
      message: "Server error", 
      error: error.message 
    });
  }
};

// Manual confirm booking function (for admins or testing)
export const manualConfirmBooking = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check admin permissions
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Not authorized to manually confirm bookings"
      });
    }
    
    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found"
      });
    }
    
    // Generate ticket code and QR code
    const ticketCode = generateTicketCode();
    const qrCode = await generateQRCode(ticketCode);
    
    // Update booking
    booking.status = "confirmed";
    booking.paymentStatus = "completed";
    booking.ticketCode = ticketCode;
    booking.qrCode = qrCode;
    
    await booking.save();
    
    // Update event seats (with the same safeguards as normal confirmation)
    const event = await Event.findById(booking.event);
    if (event) {
      const updatedSeats = [];
      
      for (const bookedSeat of booking.seats) {
        const seat = event.seats.id(bookedSeat.seatId);
        if (seat && seat.isAvailable) {
          seat.isAvailable = false;
          updatedSeats.push(bookedSeat.seatId.toString());
        }
      }
      
      if (updatedSeats.length > 0) {
        event.availableSeats = Math.max(0, event.availableSeats - updatedSeats.length);
        await event.save();
        
        io.to(`event:${booking.event}`).emit("seatsBooked", { 
          seats: updatedSeats 
        });
      }
    }
    
    res.status(200).json({
      success: true,
      message: "Booking manually confirmed",
      data: {
        bookingId: booking._id,
        status: booking.status,
        ticketCode
      }
    });
    
  } catch (error) {
    console.error("Error in manualConfirmBooking:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};
