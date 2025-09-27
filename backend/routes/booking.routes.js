import express from "express";
import { 
  createBooking,
  confirmBooking,
  getUserBookings,
  getBooking,
  cancelBooking,
  verifyTicket,
  getOrganizerBookings
} from "../controllers/booking.controller.js";
import { protect, authorize } from "../middleware/auth.middleware.js";

const router = express.Router();

// All booking routes require authentication
router.use(protect);

// Routes for all authenticated users
router.post("/", createBooking);
router.get("/", getUserBookings);

// Routes for organizers and admins
router.get("/organizer", authorize("organizer", "admin"), getOrganizerBookings);
router.put("/verify-ticket", authorize("organizer", "admin"), verifyTicket);

router.get("/:id", getBooking);
router.put("/:id/confirm", confirmBooking);
router.put("/:id/cancel", cancelBooking);

export default router;
