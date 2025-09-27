import express from "express";
import { getStripeConfig, createPaymentIntent, handleWebhook, testWebhook } from "../controllers/payment.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

// Public routes
router.get("/config", getStripeConfig);
router.get("/webhook-test", testWebhook); // Add this line

// Public webhook route - needs raw body
router.post("/webhook", express.raw({ type: "application/json" }), handleWebhook);

// Protected routes
router.use(protect);
router.post("/create-intent", createPaymentIntent);

export default router;
