import Stripe from "stripe";
import Booking from "../models/booking.models.js";
import Event from "../models/event.models.js";
import { io } from "../utils/socket.utils.js";
import QRCode from "qrcode";
import cloudinary from "../utils/cloudinary.utils.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const generateTicketCode = () => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return code;
};

/**
 * Generate QR code for ticket
 * @param {String} ticketCode 
 * @returns {Promise<String>} URL of uploaded QR code image
 */
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

/**
 * @desc    Get Stripe publishable key
 * @route   GET /api/payments/config
 * @access  Public
 */
export const getStripeConfig = (req, res) => {
  res.status(200).json({
    success: true,
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY
  });
};

/**
 * @desc    Create payment intent
 * @route   POST /api/payments/create-intent
 * @access  Private
 */
export const createPaymentIntent = async (req, res) => {
  try {
    const { amount, bookingId, eventId, seats } = req.body;
    
    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Valid amount is required"
      });
    }
    
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), 
      currency: "inr",
      metadata: {
        bookingId: bookingId || "",
        eventId: eventId || "",
        userId: req.user._id.toString(),
        seats: seats ? JSON.stringify(seats) : ""
      }
    });
    
    res.status(200).json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    });
  } catch (error) {
    console.error("Error in createPaymentIntent controller:", error.message);
    res.status(500).json({ 
      success: false,
      message: "Error creating payment intent", 
      error: error.message 
    });
  }
};

/**
 * @desc    Test webhook connectivity
 * @route   GET /api/payments/webhook-test
 * @access  Public
 */
export const testWebhook = async (req, res) => {
  res.status(200).json({
    success: true,
    message: "Webhook endpoint is accessible",
    headers: req.headers,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET ? "Configured" : "Not configured"
  });
};

/**
 * @desc    Webhook handler for Stripe events
 * @route   POST /api/payments/webhook
 * @access  Public
 */
export const handleWebhook = async (req, res) => {
  const signature = req.headers["stripe-signature"];
  
  console.log("Webhook received with signature:", signature ? "Present" : "Missing");
  console.log("Webhook secret configured:", process.env.STRIPE_WEBHOOK_SECRET ? "Yes" : "No");
  
  let event;
  
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
    
    console.log(`Webhook event verified: ${event.type}`);
  } catch (err) {
    console.error(`Webhook signature verification failed:`, err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
  
  try {
    switch (event.type) {
      case "payment_intent.succeeded":
        console.log("Processing payment_intent.succeeded");
        await handlePaymentSuccess(event.data.object);
        break;
        
      case "payment_intent.payment_failed":
        console.log("Processing payment_intent.payment_failed");
        await handlePaymentFailure(event.data.object);
        break;
        
      case "payment_intent.canceled":
        console.log("Processing payment_intent.canceled");
        await handlePaymentCancellation(event.data.object);
        break;
        
      case "charge.succeeded":
        console.log("Charge succeeded:", event.data.object.id);
        break;
        
      case "charge.failed":
        console.log("Charge failed:", event.data.object.id);
        break;
        
      case "charge.refunded":
        console.log("Processing charge.refunded");
        await handleRefund(event.data.object);
        break;
        
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
    
    res.status(200).json({ received: true });
  } catch (error) {
    console.error("Error processing webhook event:", error);
    res.status(500).json({ error: "Webhook processing failed" });
  }
};

/**
 * Helper function to handle successful payments
 * @param {Object} paymentIntent - Stripe payment intent object
 */
const handlePaymentSuccess = async (paymentIntent) => {
  try {
    console.log("Processing payment success for intent:", paymentIntent.id);
    
    let booking = await Booking.findOne({ paymentId: paymentIntent.id });
    
    if (!booking) {
      console.log("No booking found for payment intent:", paymentIntent.id);
      
      if (paymentIntent.metadata && paymentIntent.metadata.eventId && paymentIntent.metadata.userId) {
        console.log("Trying to find booking by metadata...");
        const recentBookings = await Booking.find({
          event: paymentIntent.metadata.eventId,
          user: paymentIntent.metadata.userId,
          status: "pending"
        }).sort({ createdAt: -1 }).limit(5);
        
        if (recentBookings.length > 0) {
          booking = recentBookings[0];
          console.log("Found booking by metadata:", booking._id);
          
          booking.paymentId = paymentIntent.id;
          await booking.save();
        }
      }
      
      if (!booking) {
        console.log("Still no booking found, skipping...");
        return;
      }
    }
    if (booking.status === "confirmed") {
      console.log("Booking already confirmed:", booking._id);
      return;
    }
    
    console.log(`Processing booking: ${booking._id}`);
    
    const ticketCode = generateTicketCode();
    const qrCode = await generateQRCode(ticketCode);
    
    booking.paymentStatus = "completed";
    booking.status = "confirmed";
    booking.ticketCode = ticketCode;
    booking.qrCode = qrCode;
    
    await booking.save();
    console.log(`Booking ${booking._id} confirmed with ticket code ${ticketCode}`);
    
    const event = await Event.findById(booking.event);
    if (event) {
      console.log(`Updating seats for event ${event._id}`);
      for (const seat of booking.seats) {
        const eventSeat = event.seats.id(seat.seatId);
        if (eventSeat) {
          eventSeat.isAvailable = false;
        }
      }
      
      event.availableSeats = Math.max(0, event.availableSeats - booking.seats.length);
      await event.save();
      console.log(`Updated seat availability for event ${event._id}`);
      
      io.to(`event:${booking.event}`).emit("seatsBooked", {
        seats: booking.seats.map(seat => seat.seatId.toString())
      });
    }
    
    console.log("Payment success handling completed successfully");
  } catch (error) {
    console.error("Error handling payment success:", error);
  }
};

/**
 * Helper function to handle failed payments
 * @param {Object} paymentIntent - Stripe payment intent object
 */
const handlePaymentFailure = async (paymentIntent) => {
  try {
    console.log("Processing payment failure for intent:", paymentIntent.id);
    
    const booking = await Booking.findOne({ paymentId: paymentIntent.id });
    
    if (!booking) {
      console.log("No booking found for failed payment intent:", paymentIntent.id);
      return;
    }
    
    console.log(`Marking booking ${booking._id} as failed`);
    
    booking.paymentStatus = "failed";
    booking.status = "cancelled";
    await booking.save();
    
    const event = await Event.findById(booking.event);
    
    if (event) {
      console.log(`Releasing seats for event ${event._id}`);
      for (const bookedSeat of booking.seats) {
        const seat = event.seats.id(bookedSeat.seatId);
        if (seat) {
          seat.isAvailable = true;
        }
      }
      
      event.availableSeats = event.availableSeats + booking.seats.length;
      await event.save();
      
      io.to(`event:${booking.event}`).emit("seatsReleased", {
        seats: booking.seats.map(seat => seat.seatId.toString())
      });
    }
    
    console.log("Payment failure handling completed successfully");
  } catch (error) {
    console.error("Error handling payment failure:", error);
  }
};

/**
 * Helper function to handle payment cancellations
 * @param {Object} paymentIntent - Stripe payment intent object
 */
const handlePaymentCancellation = async (paymentIntent) => {
  try {
    console.log("Processing payment cancellation for intent:", paymentIntent.id);
    await handlePaymentFailure(paymentIntent);
    console.log("Payment cancellation handling completed");
  } catch (error) {
    console.error("Error handling payment cancellation:", error);
  }
};

/**
 * Helper function to handle refunds
 * @param {Object} charge - Stripe charge object
 */
const handleRefund = async (charge) => {
  try {
    console.log("Processing refund for charge:", charge.id);
    
    const booking = await Booking.findOne({
      paymentId: charge.payment_intent
    });
    
    if (!booking) {
      console.log("No booking found for refunded charge:", charge.id);
      return;
    }
    
    console.log(`Processing refund for booking ${booking._id}`);
    
    booking.paymentStatus = "refunded";
    booking.status = "cancelled";
    await booking.save();
    
    const event = await Event.findById(booking.event);
    const now = new Date();
    
    if (event && new Date(event.startDate) > now) {
      console.log(`Releasing seats for refunded booking ${booking._id}`);
      for (const bookedSeat of booking.seats) {
        const seat = event.seats.id(bookedSeat.seatId);
        if (seat) {
          seat.isAvailable = true;
        }
      }
      
      event.availableSeats = event.availableSeats + booking.seats.length;
      await event.save();
      
      io.to(`event:${booking.event}`).emit("seatsReleased", {
        seats: booking.seats.map(seat => seat.seatId.toString())
      });
    }
    
    console.log("Refund handling completed successfully");
  } catch (error) {
    console.error("Error handling refund:", error);
  }
};
