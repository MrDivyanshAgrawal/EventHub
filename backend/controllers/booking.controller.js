import Booking from "../models/booking.models.js";
import Event from "../models/event.models.js";
import Stripe from "stripe";
import cloudinary from "../utils/cloudinary.utils.js";
import { io } from "../utils/socket.utils.js";
import QRCode from "qrcode";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const generateTicketCode = () => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return code;
};

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
    const { eventId, selectedSeats, paymentId } = req.body; 
    
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
    
    const booking = await Booking.findById(id);
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found"
      });
    }
    
    if (booking.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to confirm this booking"
      });
    }
    
    const paymentIntent = await stripe.paymentIntents.retrieve(
      paymentIntentId || booking.paymentId
    );
    
    if (paymentIntent.status !== "succeeded") {
      return res.status(400).json({
        success: false,
        message: "Payment not successful"
      });
    }
    
    const ticketCode = generateTicketCode();
    
    const qrCode = await generateQRCode(ticketCode);
    
    booking.paymentStatus = "completed";
    booking.status = "confirmed";
    booking.ticketCode = ticketCode;
    booking.qrCode = qrCode;
    
    await booking.save();
    
    const event = await Event.findById(booking.event);
    
    if (event) {
      const bookedSeatIds = [];
      
      for (const bookedSeat of booking.seats) {
        const seat = event.seats.id(bookedSeat.seatId);
        if (seat) {
          if (seat.isAvailable) {
            seat.isAvailable = false;
            bookedSeatIds.push(bookedSeat.seatId.toString());
          }
        }
      }
      
      if (bookedSeatIds.length > 0) {
        event.availableSeats = Math.max(0, event.availableSeats - bookedSeatIds.length);
        await event.save();
        
        io.to(`event:${booking.event}`).emit("seatsBooked", { 
          seats: bookedSeatIds
        });
      }
    }
    
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
    
    const query = { user: req.user._id };
    
    if (status) {
      query.status = status;
    }
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const bookings = await Booking.find(query)
      .populate({
        path: "event",
        select: "title startDate location imageUrl status"
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
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

export const cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found"
      });
    }
    
    if (booking.user.toString() !== req.user._id.toString() && 
        req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Not authorized to cancel this booking"
      });
    }
    
    if (booking.status === "cancelled") {
      return res.status(400).json({
        success: false,
        message: "This booking is already cancelled"
      });
    }
    
    if (booking.paymentStatus === "completed") {
      try {
        await stripe.refunds.create({
          payment_intent: booking.paymentId,
          reason: "requested_by_customer"
        });
        
        booking.paymentStatus = "refunded";
      } catch (error) {
        console.error("Error processing refund:", error);
        
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
    booking.status = "cancelled";
    await booking.save();
    
    const event = await Event.findById(booking.event);
    
    if (event) {
      const releasedSeatIds = [];
      
      for (const bookedSeat of booking.seats) {
        const seat = event.seats.id(bookedSeat.seatId);
        
        if (seat) {
          if (!seat.isAvailable) {
            seat.isAvailable = true;
            releasedSeatIds.push(bookedSeat.seatId.toString());
          }
        }
      }
      
      if (releasedSeatIds.length > 0) {
        event.availableSeats = Math.min(
          event.totalSeats,
          event.availableSeats + releasedSeatIds.length
        );
        await event.save();
        
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
    
    if (booking.event.organizer._id.toString() !== req.user._id.toString() && 
        req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Not authorized to verify tickets for this event"
      });
    }
    
    if (booking.status !== "confirmed") {
      return res.status(400).json({
        success: false,
        message: "This booking is not confirmed"
      });
    }
    
    if (booking.checkedIn) {
      return res.status(400).json({
        success: false,
        message: "This ticket has already been used for check-in",
        checkedInAt: booking.checkedInAt
      });
    }
    
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
    
    let eventIds = [];
    
    if (eventId) {
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
    
    const query = { event: { $in: eventIds } };
    
    if (status) {
      query.status = status;
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
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

export const manualConfirmBooking = async (req, res) => {
  try {
    const { id } = req.params;
    
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
    
    const ticketCode = generateTicketCode();
    const qrCode = await generateQRCode(ticketCode);
    
    booking.status = "confirmed";
    booking.paymentStatus = "completed";
    booking.ticketCode = ticketCode;
    booking.qrCode = qrCode;
    
    await booking.save();
    
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

// Add these new controllers to your existing booking.controller.js

// @desc    Get all bookings in the system (Admin only)
// @route   GET /api/bookings/admin/all
export const getAllBookings = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Admin access required"
      });
    }

    const { status, eventId, userId, page = 1, limit = 20 } = req.query;
    
    const query = {};
    if (status) query.status = status;
    if (eventId) query.event = eventId;
    if (userId) query.user = userId;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const bookings = await Booking.find(query)
      .populate({
        path: "event",
        select: "title startDate location organizer",
        populate: { path: "organizer", select: "name email" }
      })
      .populate({
        path: "user",
        select: "name email"
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await Booking.countDocuments(query);
    
    const stats = await Booking.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          totalRevenue: { 
            $sum: { 
              $cond: [
                { $eq: ["$status", "confirmed"] }, 
                "$totalAmount", 
                0
              ]
            }
          }
        }
      }
    ]);
    
    res.status(200).json({
      success: true,
      count: bookings.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      stats,
      data: bookings
    });
  } catch (error) {
    console.error("Error in getAllBookings controller:", error.message);
    res.status(500).json({ 
      success: false,
      message: "Server error", 
      error: error.message 
    });
  }
};

// @desc    Get booking analytics (Admin only)
// @route   GET /api/bookings/admin/analytics
export const getBookingAnalytics = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Admin access required"
      });
    }

    const { startDate, endDate } = req.query;
    
    // Date filter
    const dateFilter = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
      if (endDate) dateFilter.createdAt.$lte = new Date(endDate);
    }
    
    // Revenue by status
    const revenueStats = await Booking.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          totalRevenue: { $sum: "$totalAmount" }
        }
      }
    ]);
    
    // Daily booking trends
    const dailyTrends = await Booking.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }
          },
          bookings: { $sum: 1 },
          revenue: { $sum: "$totalAmount" }
        }
      },
      { $sort: { "_id.date": 1 } }
    ]);
    
    // Top events by bookings
    const topEvents = await Booking.aggregate([
      { $match: { status: "confirmed", ...dateFilter } },
      { $group: { _id: "$event", bookings: { $sum: 1 }, revenue: { $sum: "$totalAmount" } } },
      { $sort: { bookings: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: "events",
          localField: "_id",
          foreignField: "_id",
          as: "eventDetails"
        }
      }
    ]);
    
    res.status(200).json({
      success: true,
      data: {
        revenueStats,
        dailyTrends,
        topEvents
      }
    });
  } catch (error) {
    console.error("Error in getBookingAnalytics controller:", error.message);
    res.status(500).json({ 
      success: false,
      message: "Server error", 
      error: error.message 
    });
  }
};

// @desc    Bulk actions on bookings (Admin only)
// @route   PUT /api/bookings/admin/bulk-action
export const bulkBookingAction = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Admin access required"
      });
    }

    const { action, bookingIds } = req.body;
    
    if (!action || !bookingIds || !Array.isArray(bookingIds)) {
      return res.status(400).json({
        success: false,
        message: "Action and booking IDs array are required"
      });
    }

    let updateResult;
    
    switch (action) {
      case 'confirm':
        updateResult = await Booking.updateMany(
          { _id: { $in: bookingIds }, status: 'pending' },
          { status: 'confirmed', paymentStatus: 'completed' }
        );
        break;
        
      case 'cancel':
        updateResult = await Booking.updateMany(
          { _id: { $in: bookingIds }, status: { $ne: 'cancelled' } },
          { status: 'cancelled' }
        );
        break;
        
      default:
        return res.status(400).json({
          success: false,
          message: "Invalid action"
        });
    }
    
    res.status(200).json({
      success: true,
      message: `${action} applied to ${updateResult.modifiedCount} bookings`,
      modifiedCount: updateResult.modifiedCount
    });
  } catch (error) {
    console.error("Error in bulkBookingAction controller:", error.message);
    res.status(500).json({ 
      success: false,
      message: "Server error", 
      error: error.message 
    });
  }
};
