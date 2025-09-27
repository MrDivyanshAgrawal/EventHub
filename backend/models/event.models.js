import mongoose from "mongoose";

const seatSchema = new mongoose.Schema({
  number: {
    type: String,
    required: [true, "Seat number is required"],
    trim: true
  },
  row: {
    type: String,
    required: [true, "Row is required"],
    trim: true
  },
  price: {
    type: Number,
    required: [true, "Price is required"],
    min: [0, "Price cannot be negative"]
  },
  type: {
    type: String,
    enum: ["standard", "premium", "vip"],
    default: "standard"
  },
  isAvailable: {
    type: Boolean,
    default: true
  },
  section: {
    type: String,
    required: [true, "Section is required"],
    trim: true
  }
});

const eventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, "Title is required"],
    trim: true
  },
  description: {
    type: String,
    required: [true, "Description is required"]
  },
  imageUrl: {
    type: String,
    required: [true, "Image URL is required"]
  },
  galleryImages: [String],
  startDate: {
    type: Date,
    required: [true, "Start date is required"]
  },
  endDate: {
    type: Date,
    required: [true, "End date is required"]
  },
  location: {
    name: {
      type: String,
      required: [true, "Venue name is required"],
      trim: true
    },
    address: {
      type: String,
      required: [true, "Address is required"],
      trim: true
    },
    city: {
      type: String,
      required: [true, "City is required"],
      trim: true
    },
    state: {
      type: String,
      required: [true, "State is required"],
      trim: true
    },
    zipCode: {
      type: String,
      required: [true, "Zip code is required"],
      trim: true
    },
    country: {
      type: String,
      required: [true, "Country is required"],
      trim: true
    }
  },
  category: {
    type: String,
    required: [true, "Category is required"],
    enum: ["concert", "sports", "theater", "conference", "exhibition", "workshop", "other"]
  },
  organizer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: [true, "Organizer is required"]
  },
  seats: [seatSchema],
  totalSeats: {
    type: Number,
    required: [true, "Total seats is required"],
    min: [1, "Total seats must be at least 1"]
  },
  availableSeats: {
    type: Number,
    required: [true, "Available seats is required"],
    min: [0, "Available seats cannot be negative"]
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ["draft", "published", "cancelled", "completed"],
    default: "draft"
  },
  tags: [String]
}, {
  timestamps: true
});

eventSchema.index({ startDate: 1 });
eventSchema.index({ "location.city": 1 });
eventSchema.index({ category: 1 });
eventSchema.index({ status: 1 });

const Event = mongoose.model("Event", eventSchema);

export default Event;
