# EventHub - Book Your Next Experience 🎟️

A modern, full-stack event booking and ticketing platform built with the MERN stack. EventHub provides real-time seat selection, secure payment processing, and digital ticket generation with QR codes.

## 🌐 Live Demo

**🚀 [EventHub Live Application](https://eventhub-t9i2.onrender.com)**

*Experience the full booking flow with test payments using Stripe's test card: `4242 4242 4242 4242`*

## ✨ Core Features

- 🎫 **Real-time Seat Selection** - Live seat availability with WebSocket integration
- 💳 **Secure Payment Processing** - Stripe integration with webhook handling
- 📱 **Digital QR Tickets** - PDF download with unique QR codes
- 🔐 **JWT Authentication** - Secure user sessions with access/refresh tokens
- 📱 **Mobile Responsive** - Optimized for all devices
- ⚡ **Real-time Updates** - Live booking status across multiple users
- 🎨 **Modern UI/UX** - Clean interface with Tailwind CSS

## 🛠️ Tech Stack

### Frontend
- ![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB) **React 18** - Modern React with Hooks
- ![Vite](https://img.shields.io/badge/Vite-B73BFE?style=for-the-badge&logo=vite&logoColor=FFD62E) **Vite** - Fast build tool
- ![React Router](https://img.shields.io/badge/React_Router-CA4245?style=for-the-badge&logo=react-router&logoColor=white) **React Router DOM** - Client-side routing
- ![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white) **Tailwind CSS** - Utility-first CSS framework
- ![Socket.io](https://img.shields.io/badge/Socket.io-black?style=for-the-badge&logo=socket.io&badgeColor=010101) **Socket.io Client** - Real-time communication
- ![Stripe](https://img.shields.io/badge/Stripe-626CD9?style=for-the-badge&logo=Stripe&logoColor=white) **Stripe React** - Secure payment forms
- 📄 **QRCode.js & jsPDF** - Ticket generation
- ![Axios](https://img.shields.io/badge/Axios-5A29E4?style=for-the-badge&logo=axios&logoColor=white) **Axios** - HTTP client

### Backend
- ![NodeJS](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white) ![Express.js](https://img.shields.io/badge/Express.js-404D59?style=for-the-badge) **Node.js & Express.js** - Server framework
- ![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white) **MongoDB & Mongoose** - Database and ODM
- ![Socket.io](https://img.shields.io/badge/Socket.io-black?style=for-the-badge&logo=socket.io&badgeColor=010101) **Socket.io** - Real-time WebSocket server
- ![Stripe](https://img.shields.io/badge/Stripe-626CD9?style=for-the-badge&logo=Stripe&logoColor=white) **Stripe** - Payment processing
- ![JWT](https://img.shields.io/badge/JSON%20Web%20Tokens-323330?style=for-the-badge&logo=json-web-tokens&logoColor=pink) **JWT** - Token-based authentication
- 🔐 **Bcryptjs** - Password security
- ![Cloudinary](https://img.shields.io/badge/Cloudinary-3448C5?style=for-the-badge&logo=Cloudinary&logoColor=white) **Cloudinary** - Image management

### Deployment
- ![Render](https://img.shields.io/badge/Render-46E3B7?style=for-the-badge&logo=render&logoColor=white) **Render** - Cloud hosting
- ![MongoDB](https://img.shields.io/badge/MongoDB%20Atlas-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white) **MongoDB Atlas** - Database hosting

### Development Tools
- ![Git](https://img.shields.io/badge/Git-F05032?style=for-the-badge&logo=git&logoColor=white) **Git** - Version control
- ![GitHub](https://img.shields.io/badge/GitHub-100000?style=for-the-badge&logo=github&logoColor=white) **GitHub** - Code repository
- ![VS Code](https://img.shields.io/badge/VS_Code-0078D4?style=for-the-badge&logo=visual%20studio%20code&logoColor=white) **VS Code** - Code editor
- ![Postman](https://img.shields.io/badge/Postman-FF6C37?style=for-the-badge&logo=postman&logoColor=white) **Postman** - API testing

## 📁 Project Structure

```
EventHub/
├── 📂 backend/
│   ├── 📂 controllers/          # Business logic
│   │   ├── auth.controllers.js
│   │   ├── booking.controllers.js
│   │   ├── event.controllers.js
│   │   └── payment.controllers.js
│   ├── 📂 db/
│   │   └── index.db.js          # Database connection
│   ├── 📂 middleware/
│   │   └── auth.middleware.js   # JWT authentication
│   ├── 📂 models/               # Database schemas
│   │   ├── booking.models.js
│   │   ├── event.models.js
│   │   └── user.models.js
│   ├── 📂 routes/               # API endpoints
│   │   ├── auth.routes.js
│   │   ├── booking.routes.js
│   │   ├── event.routes.js
│   │   └── payment.routes.js
│   ├── 📂 utils/
│   │   ├── redis.utils.js
│   │   ├── cloudinary.utils.js
│   │   └── socket.utils.js
│   ├── constants.js             # DB name file
│   └── server.js                # Main server file
├── 📂 frontend/
│   ├── 📂 src/
│   │   ├── 📂 components/       # Reusable components
│   │   ├── 📂 pages/           # Page components
│   │   ├── 📂 services/        # API services
│   │   ├── 📂 utils/           # Utilities
│   │   ├── 📂 context/         # React context
│   │   ├── 📂 hooks/           # Maunal Hook
│   │   └── App.jsx
│   └── vite.config.js
├──  package.json
├──  LICENSE
└── README.md

```

## 🔧 Installation & Setup

### Prerequisites
- Node.js (v16+)
- MongoDB Atlas account
- Stripe account
- Cloudinary account

### 1. Clone Repository
```bash
git clone https://github.com/MrDivyanshAgrawal/EventHub.git
cd EventHub
```

### 2. Backend Setup
```bash
cd backend
npm install
```

Create `.env` file:
```env
# Server Configuration
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/eventhub

# JWT Configuration
JWT_SECRET=your_jwt_secret_key_here
ACCESS_TOKEN_SECRET=your_access_token_secret_here
REFRESH_TOKEN_SECRET=your_refresh_token_secret_here

# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### 3. Frontend Setup
```bash
cd ../frontend
npm install
```

Create `.env` file:
```env
# API Configuration
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000

# Stripe Configuration
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
```

### 4. Start Development Servers
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

## 🌐 Production Environment Variables

### Backend (.env)
```env
PORT=5000
NODE_ENV=production
FRONTEND_URL=https://eventhub-t9i2.onrender.com
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/eventhub
JWT_SECRET=your_production_jwt_secret
ACCESS_TOKEN_SECRET=your_production_access_token_secret
REFRESH_TOKEN_SECRET=your_production_refresh_token_secret
STRIPE_SECRET_KEY=sk_live_your_live_stripe_key
STRIPE_WEBHOOK_SECRET=whsec_your_production_webhook_secret
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### Frontend (.env)
```env
VITE_API_URL=https://eventhub-t9i2.onrender.com/api
VITE_SOCKET_URL=https://eventhub-t9i2.onrender.com
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_your_live_publishable_key
```

## 🎯 Key API Endpoints

```markdown
### Authentication
POST   /api/auth/signup          # User registration
POST   /api/auth/login           # User login
GET    /api/auth/logout          # User logout
POST   /api/auth/refresh-token   # Refresh access token
GET    /api/auth/profile         # Get user profile

### Events
GET    /api/events               # Get all events
GET    /api/events/:id           # Get specific event
POST   /api/events/:id/select-seat    # Select seat
POST   /api/events/:id/release-seat   # Release seat

### Bookings
GET    /api/bookings             # Get user bookings
POST   /api/bookings             # Create booking
PUT    /api/bookings/:id/cancel  # Cancel booking

### Payments
POST   /api/payments/create-intent    # Create payment intent
POST   /api/payments/webhook          # Stripe webhook
```

## 🧪 Testing

### Payment Testing
Use Stripe test cards:
- **Success**: `4242 4242 4242 4242`
- **Decline**: `4000 0000 0000 0002`
- **Insufficient Funds**: `4000 0000 0000 9995`

### API Testing
```bash
# Test server
curl http://localhost:5000/api/events

# Test authentication
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'
```

## 📦 Build & Deploy

### Build Commands
```bash
# Frontend build
npm run build

# Production start
npm run start
```

### Deployment Scripts
```json
{
  "scripts": {
    "build": "npm install --prefix backend && npm install --prefix frontend && npm run build --prefix frontend",
    "start": "npm run start --prefix backend",
    "dev": "npm run dev --prefix backend"
  }
}
```

## 🔒 Security Features

- **JWT Authentication** with access/refresh token rotation
- **Password Hashing** using bcrypt
- **CORS Protection** for cross-origin requests
- **Stripe Webhook Verification** for payment security
- **Input Validation** and sanitization
- **Environment Variable Protection**

## 📊 Project Metrics

- **20+ API Endpoints**
- **25+ React Components**
- **3 Database Models**
- **10+ Real-time Socket Events**
- **15,000+ Lines of Code**

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/new-feature`)
3. Commit changes (`git commit -m 'Add new feature'`)
4. Push to branch (`git push origin feature/new-feature`)
5. Open Pull Request

## 👨‍💻 Developer

**Divyansh Agrawal**
- GitHub: [@MrDivyanshAgrawal](https://github.com/MrDivyanshAgrawal)
- LinkedIn: [Divyansh Agrawal](https://www.linkedin.com/in/divyansh-agrawal-673420257)

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

---

**⭐ Star this repository if you found it helpful!**

**🚀 [Live Demo](https://eventhub-t9i2.onrender.com) | 📚 [Documentation](#) | 🐛 [Report Bug](https://github.com/MrDivyanshAgrawal/EventHub/issues)**

*Built with ❤️ using the MERN Stack*
