import React, { useState, useEffect } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { bookingService, paymentService, eventService } from "../services/auth";
import toast from "react-hot-toast";
import { ArrowLeftIcon, CurrencyRupeeIcon } from "@heroicons/react/24/outline";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

const CheckoutForm = ({ selectedSeats, event, eventId }) => {
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
  const [clientSecret, setClientSecret] = useState("");

  const totalAmount = selectedSeats.reduce((sum, seat) => sum + seat.price, 0);

  useEffect(() => {
    createPaymentIntent();

    return () => {
      if (!isProcessing && selectedSeats && selectedSeats.length > 0) {
        console.log("Cleanup: Releasing seats on unmount");
        selectedSeats.forEach((seat) => {
          eventService
            .releaseSeat(eventId, seat._id)
            .catch((err) =>
              console.error("Error releasing seat on unmount:", err)
            );
        });
      }
    };
  }, []);

  const createPaymentIntent = async () => {
    try {
      const response = await paymentService.createPaymentIntent({
        amount: totalAmount,
        eventId: eventId,
        seats: selectedSeats.map((seat) => seat._id),
      });
      setClientSecret(response.clientSecret);
    } catch (error) {
      console.error("Error creating payment intent:", error);
      toast.error("Failed to initialize payment");

      await releaseSeatsOnFailure();
    }
  };
  const releaseSeatsOnFailure = async () => {
    try {
      for (const seat of selectedSeats) {
        await eventService.releaseSeat(eventId, seat._id);
        console.log(`Released seat ${seat._id} due to payment failure`);
      }
    } catch (error) {
      console.error("Error releasing seats after payment failure:", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!stripe || !elements || !clientSecret) {
      return;
    }

    setIsProcessing(true);

    try {
      const { error, paymentIntent } = await stripe.confirmCardPayment(
        clientSecret,
        {
          payment_method: {
            card: elements.getElement(CardElement),
          },
        }
      );

      if (error) {
        console.log("Stripe error details:", error);
        toast.error(error.message);
        setIsProcessing(false);
        return;
      }

      if (paymentIntent.status === "succeeded") {
        const bookingData = {
          eventId: eventId,
          selectedSeats: selectedSeats.map((seat) => seat._id),
          paymentId: paymentIntent.id,
        };

        console.log("Sending booking data:", bookingData);
        const booking = await bookingService.createBooking(bookingData);
        toast.success("Payment successful! Your booking is confirmed.");
        navigate(`/my-bookings`, { replace: true });
      }
    } catch (error) {
      console.error("Detailed payment error:", error);
      if (error.response) {
        console.error("Response error data:", error.response.data);
      }
      toast.error("Payment failed. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const cardElementOptions = {
    style: {
      base: {
        fontSize: "16px",
        color: "#424770",
        "::placeholder": {
          color: "#aab7c4",
        },
        fontFamily: "Inter, system-ui, sans-serif",
      },
      invalid: {
        color: "#9e2146",
      },
    },
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-gray-50 p-6 rounded-lg">
        <h3 className="font-semibold mb-4">Order Summary</h3>
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Event</span>
            <span className="font-medium">{event.title}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Seats</span>
            <span className="font-medium">
              {selectedSeats
                .map((seat) => `${seat.row}${seat.number}`)
                .join(", ")}
            </span>
          </div>
          <div className="border-t pt-3 flex justify-between">
            <span className="font-semibold">Total Amount</span>
            <span className="font-semibold text-primary-600 flex items-center">
              <CurrencyRupeeIcon className="h-4 w-4 mr-1" />
              {totalAmount}
            </span>
          </div>
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Card Details
        </label>
        <div className="input-field py-3">
          <CardElement options={cardElementOptions} />
        </div>
      </div>
      <button
        type="submit"
        disabled={!stripe || isProcessing}
        className="w-full btn-primary py-3 text-lg flex items-center justify-center"
      >
        {isProcessing ? "Processing..." : (
          <>
            <span>Pay </span>
            <CurrencyRupeeIcon className="h-4 w-4 mx-1" />
            <span>{totalAmount}</span>
          </>
        )}
      </button>
      <p className="text-xs text-gray-500 text-center">
        Your payment information is secure and encrypted.
      </p>
    </form>
  );
};

const Checkout = () => {
  const { eventId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { selectedSeats, event } = location.state || {};

  useEffect(() => {
    if (!selectedSeats || !event) {
      navigate("/events");
    }
  }, [selectedSeats, event, navigate]);

  if (!selectedSeats || !event) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Back to event
        </button>

                <div className="bg-white rounded-lg shadow-sm p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-8">
            Complete Your Booking
          </h1>

          <Elements stripe={stripePromise}>
            <CheckoutForm
              selectedSeats={selectedSeats}
              event={event}
              eventId={eventId}
            />
          </Elements>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
