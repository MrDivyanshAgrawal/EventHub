import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext.jsx';
import Layout from './components/Layout';
import PrivateRoute from './components/PrivateRoute';

// Pages
import Home from './pages/Home.jsx';
import Events from './pages/Events.jsx';
import EventDetails from './pages/EventDetails.jsx';
import Login from './pages/Login.jsx';
import Signup from './pages/Signup.jsx';
import MyBookings from './pages/MyBookings.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Checkout from './pages/Checkout.jsx';
import About from './pages/About.jsx';
import Contact from './pages/Contact.jsx';
import Terms from './pages/Terms.jsx';
import Profile from './pages/Profile.jsx';
import CreateEvent from './pages/CreateEvent.jsx';
import EditEvent from './pages/EditEvent.jsx';
import NotFound from './pages/NotFound.jsx';
import Privacy from './pages/Privacy.jsx';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
            success: {
              style: {
                background: '#10b981',
              },
            },
            error: {
              style: {
                background: '#ef4444',
              },
            },
          }}
        />
        <Layout>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/events" element={<Events />} />
            <Route path="/events/:id" element={<EventDetails />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/privacy" element={<Privacy />} />
            {/* Protected Routes */}
            <Route
              path="/profile"
              element={
                <PrivateRoute>
                  <Profile />
                </PrivateRoute>
              }
            />
            <Route
              path="/my-bookings"
              element={
                <PrivateRoute>
                  <MyBookings />
                </PrivateRoute>
              }
            />
            <Route
              path="/checkout/:eventId"
              element={
                <PrivateRoute>
                  <Checkout />
                </PrivateRoute>
              }
            />
            
            {/* Organizer/Admin Routes */}
            <Route
              path="/dashboard"
              element={
                <PrivateRoute roles={['organizer', 'admin']}>
                  <Dashboard />
                </PrivateRoute>
              }
            />
            <Route
              path="/create-event"
              element={
                <PrivateRoute roles={['organizer', 'admin']}>
                  <CreateEvent />
                </PrivateRoute>
              }
            />
            <Route
              path="/edit-event/:id"
              element={
                <PrivateRoute roles={['organizer', 'admin']}>
                  <EditEvent />
                </PrivateRoute>
              }
            />
            
            {/* 404 Not Found Route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Layout>
      </Router>
    </AuthProvider>
  );
}

export default App;
