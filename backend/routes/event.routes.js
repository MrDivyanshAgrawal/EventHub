import express from "express";
import { 
  getEvents, 
  getEvent, 
  createEvent, 
  updateEvent, 
  deleteEvent,
  getOrganizerEvents,
  updateEventSeats,
  selectSeat,
  releaseSeat,
  publishEvent
} from "../controllers/event.controller.js";
import { protect, authorize } from "../middleware/auth.middleware.js";

const router = express.Router();

// Public routes
router.get("/", getEvents);
router.get("/:id", getEvent);

// Protected routes - require authentication
router.use(protect);

// Routes for all authenticated users
router.post("/:id/select-seat", selectSeat);
router.post("/:id/release-seat", releaseSeat);

// Routes for organizers and admins
router.get("/organizer/events", authorize("organizer", "admin"), getOrganizerEvents);

router.post("/", authorize("organizer", "admin"), createEvent);

router.route("/:id")
  .put(authorize("organizer", "admin"), updateEvent)
  .delete(authorize("organizer", "admin"), deleteEvent);

router.put("/:id/seats", authorize("organizer", "admin"), updateEventSeats);
router.put("/:id/publish", authorize("organizer", "admin"), publishEvent);

export default router;
