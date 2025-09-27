import express from "express";
import { 
  createBooking,
  confirmBooking,
  getUserBookings,
  getBooking,
  cancelBooking,
  verifyTicket,
  getOrganizerBookings,
  manualConfirmBooking,
  // Add these new imports
  getAllBookings,
  getBookingAnalytics,
  bulkBookingAction
} from "../controllers/booking.controller.js";
import { protect, authorize } from "../middleware/auth.middleware.js";

const router = express.Router();

router.use(protect);

// User routes
router.post("/", createBooking);
router.get("/", getUserBookings);

// Organizer routes
router.get("/organizer", authorize("organizer", "admin"), getOrganizerBookings);
router.put("/verify-ticket", authorize("organizer", "admin"), verifyTicket);

// Admin-only routes
router.get("/admin/all", authorize("admin"), getAllBookings);
router.get("/admin/analytics", authorize("admin"), getBookingAnalytics);
router.put("/admin/bulk-action", authorize("admin"), bulkBookingAction);

// Individual booking routes
router.get("/:id", getBooking);
router.put("/:id/confirm", confirmBooking);
router.put("/:id/cancel", cancelBooking);
router.put("/:id/manual-confirm", authorize("admin"), manualConfirmBooking);

export default router;
