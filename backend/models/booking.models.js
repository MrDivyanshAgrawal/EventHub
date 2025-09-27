import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: [true, "User is required"]
  },
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Event",
    required: [true, "Event is required"]
  },
  seats: [{
    seatId: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, "Seat ID is required"]
    },
    number: {
      type: String,
      required: [true, "Seat number is required"]
    },
    row: {
      type: String,
      required: [true, "Row is required"]
    },
    section: {
      type: String,
      required: [true, "Section is required"]
    },
    price: {
      type: Number,
      required: [true, "Price is required"]
    },
    type: {
      type: String,
      enum: ["standard", "premium", "vip"],
      default: "standard"
    }
  }],
  totalAmount: {
    type: Number,
    required: [true, "Total amount is required"],
    min: [0, "Total amount cannot be negative"]
  },
  paymentId: {
    type: String
  },
  paymentStatus: {
    type: String,
    enum: ["pending", "completed", "failed", "refunded"],
    default: "pending"
  },
  ticketCode: {
    type: String,
    unique: true,
    sparse: true
  },
  qrCode: {
    type: String
  },
  status: {
    type: String,
    enum: ["pending", "confirmed", "cancelled"],
    default: "pending"
  },
  checkedIn: {
    type: Boolean,
    default: false
  },
  checkedInAt: {
    type: Date
  }
}, {
  timestamps: true
});

bookingSchema.index({ user: 1 });
bookingSchema.index({ event: 1 });
bookingSchema.index({ status: 1 });
bookingSchema.index({ paymentStatus: 1 });
bookingSchema.index({ paymentId: 1 }); 

const Booking = mongoose.model("Booking", bookingSchema);

export default Booking;
