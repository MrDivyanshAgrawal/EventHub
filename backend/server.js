import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
import { app, server } from "./utils/socket.utils.js";
import connectDB from "./db/index.db.js";

import authRoutes from "./routes/auth.routes.js";
import eventRoutes from "./routes/event.routes.js";
import bookingRoutes from "./routes/booking.routes.js";
import paymentRoutes from "./routes/payment.routes.js";

import path from "path";

dotenv.config();

const PORT = process.env.PORT || 5000;
const __dirname = path.resolve();

// CORS middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'stripe-signature']
}));

// Cookie parser
app.use(cookieParser());

// Body parsing middleware with special handling for Stripe webhook
app.use((req, res, next) => {
  if (req.originalUrl === '/api/payments/webhook') {
    next();
  } else {
    express.json({ limit: '50mb' })(req, res, next);
  }
});

app.use((req, res, next) => {
  if (req.originalUrl === '/api/payments/webhook') {
    next();
  } else {
    express.urlencoded({ extended: true, limit: '50mb' })(req, res, next);
  }
});

// API Routes (must come BEFORE static file serving)
app.use("/api/auth", authRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/payments", paymentRoutes);

// Production setup
if (process.env.NODE_ENV === "production") {
  // Serve static files from frontend build
  app.use(express.static(path.join(__dirname, "./frontend/dist")));

  // Catch-all handler: send back frontend's index.html for any non-API routes
  app.get("/:path", (req, res) => {
    res.sendFile(path.join(__dirname, "./frontend/dist/index.html"));
  });
} else {
  // Development 404 handler for API routes only
  app.use("/api/*", (req, res) => {
    res.status(404).json({ message: "API route not found" });
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    message: "Something went wrong!",
    error: process.env.NODE_ENV === "development" ? err.message : undefined
  });
});

// Start server
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
  
  if (process.env.NODE_ENV === "production") {
    const staticPath = path.join(__dirname, "frontend/dist");
    console.log(`Serving static files from: ${staticPath}`);
  }
  
  connectDB();
});
