import { Server } from "socket.io";
import http from "http";
import express from "express";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.NODE_ENV === "development"
      ? "http://localhost:5173"  
      : process.env.FRONTEND_URL, 
    credentials: true,
  },
});
const selectedSeats = {}; 

const activeUsers = {}; 
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

  socket.on("joinEvent", (eventId) => {
    socket.join(`event:${eventId}`);
    console.log(`User joined event room: ${eventId}`);
    
    if (selectedSeats[eventId]) {
      socket.emit("currentlySelectedSeats", selectedSeats[eventId]);
    }
  });

  socket.on("selectSeat", ({ eventId, seatId, userId }) => {
    console.log(`User ${userId} selecting seat ${seatId} for event ${eventId}`);
    
    if (!selectedSeats[eventId]) {
      selectedSeats[eventId] = {};
    }
    
    if (selectedSeats[eventId][seatId] && selectedSeats[eventId][seatId] !== userId) {
      socket.emit("seatSelectionError", {
        seatId,
        message: "This seat was just selected by someone else"
      });
      return;
    }
    
    selectedSeats[eventId][seatId] = userId;
    
    io.to(`event:${eventId}`).emit("seatSelected", {
      seatId,
      userId
    });
    setTimeout(() => {
      if (selectedSeats[eventId] && 
          selectedSeats[eventId][seatId] === userId) {
        delete selectedSeats[eventId][seatId];
        
        io.to(`event:${eventId}`).emit("seatReleased", { seatId });
      }
    }, 10 * 60 * 1000); 
  });

  socket.on("deselectSeat", ({ eventId, seatId, userId }) => {
    console.log(`User ${userId} deselecting seat ${seatId} for event ${eventId}`);
    
    if (selectedSeats[eventId] && 
        selectedSeats[eventId][seatId] === userId) {
      delete selectedSeats[eventId][seatId];
      
      io.to(`event:${eventId}`).emit("seatReleased", { seatId });
    }
  });
  socket.on("bookingConfirmed", ({ eventId, seats }) => {
    console.log(`Booking confirmed for event ${eventId}, seats: ${seats.join(', ')}`);
    
    if (selectedSeats[eventId]) {
      seats.forEach(seatId => {
        delete selectedSeats[eventId][seatId];
      });
      
      io.to(`event:${eventId}`).emit("seatsBooked", { seats });
    }
  });

  socket.on("leaveEvent", (eventId) => {
    socket.leave(`event:${eventId}`);
    console.log(`User left event room: ${eventId}`);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
    
    if (userId) {
      delete activeUsers[userId];
      io.emit("activeUsers", Object.keys(activeUsers));
      
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
