import { Server } from "socket.io";
import http from "http";
import express from "express";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  },
});

// Track selected seats to prevent double bookings
const selectedSeats = {}; // { eventId: { seatId: userId } }

// Track user activity
const activeUsers = {}; // { userId: socketId }

// Get socket ID for a specific user
export function getUserSocketId(userId) {
  return activeUsers[userId];
}

io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  const userId = socket.handshake.query.userId;
  if (userId) {
    activeUsers[userId] = socket.id;
    io.emit("activeUsers", Object.keys(activeUsers));
  }

  // Join event room to see real-time seat updates
  socket.on("joinEvent", (eventId) => {
    socket.join(`event:${eventId}`);
    console.log(`User joined event room: ${eventId}`);
    
    // Send currently selected seats to the newly joined user
    if (selectedSeats[eventId]) {
      socket.emit("currentlySelectedSeats", selectedSeats[eventId]);
    }
  });

  // Handle seat selection
  socket.on("selectSeat", ({ eventId, seatId, userId }) => {
    console.log(`User ${userId} selecting seat ${seatId} for event ${eventId}`);
    
    // Initialize event's selected seats if not exist
    if (!selectedSeats[eventId]) {
      selectedSeats[eventId] = {};
    }
    
    // Check if seat is already selected
    if (selectedSeats[eventId][seatId] && selectedSeats[eventId][seatId] !== userId) {
      // Send error to the client trying to select an already selected seat
      socket.emit("seatSelectionError", {
        seatId,
        message: "This seat was just selected by someone else"
      });
      return;
    }
    
    // Mark seat as selected
    selectedSeats[eventId][seatId] = userId;
    
    // Broadcast to all users in the event room
    io.to(`event:${eventId}`).emit("seatSelected", {
      seatId,
      userId
    });
    
    // Set timeout to release seat if booking not completed (10 minutes)
    setTimeout(() => {
      if (selectedSeats[eventId] && 
          selectedSeats[eventId][seatId] === userId) {
        // Release the seat if still held by the same user
        delete selectedSeats[eventId][seatId];
        
        // Notify all clients that seat is available again
        io.to(`event:${eventId}`).emit("seatReleased", { seatId });
      }
    }, 10 * 60 * 1000); // 10 minutes
  });

  // Handle seat deselection (user cancels selection)
  socket.on("deselectSeat", ({ eventId, seatId, userId }) => {
    console.log(`User ${userId} deselecting seat ${seatId} for event ${eventId}`);
    
    if (selectedSeats[eventId] && 
        selectedSeats[eventId][seatId] === userId) {
      // Only allow the user who selected to deselect
      delete selectedSeats[eventId][seatId];
      
      // Notify all clients
      io.to(`event:${eventId}`).emit("seatReleased", { seatId });
    }
  });

  // Handle booking confirmed
  socket.on("bookingConfirmed", ({ eventId, seats }) => {
    console.log(`Booking confirmed for event ${eventId}, seats: ${seats.join(', ')}`);
    
    if (selectedSeats[eventId]) {
      // Remove seats from selected seats as they're now booked
      seats.forEach(seatId => {
        delete selectedSeats[eventId][seatId];
      });
      
      // Broadcast to all users in event room
      io.to(`event:${eventId}`).emit("seatsBooked", { seats });
    }
  });

  // Leave event room
  socket.on("leaveEvent", (eventId) => {
    socket.leave(`event:${eventId}`);
    console.log(`User left event room: ${eventId}`);
  });

  // Handle disconnection
  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
    
    // Remove user from active users
    if (userId) {
      delete activeUsers[userId];
      io.emit("activeUsers", Object.keys(activeUsers));
      
      // Release any seats this user had selected
      for (const eventId in selectedSeats) {
        for (const seatId in selectedSeats[eventId]) {
          if (selectedSeats[eventId][seatId] === userId) {
            delete selectedSeats[eventId][seatId];
            io.to(`event:${eventId}`).emit("seatReleased", { seatId });
          }
        }
      }
    }
  });
});

export { io, app, server };
