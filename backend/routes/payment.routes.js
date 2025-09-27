import express from "express";
import { getStripeConfig, createPaymentIntent, handleWebhook, testWebhook } from "../controllers/payment.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/config", getStripeConfig);
router.get("/webhook-test", testWebhook);

router.post("/webhook", express.raw({ type: "application/json" }), handleWebhook);

router.use(protect);
router.post("/create-intent", createPaymentIntent);

export default router;
