import React, { useState } from 'react';
import { EnvelopeIcon, PhoneIcon, MapPinIcon, PaperAirplaneIcon } from '@heroicons/react/24/outline';

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    
    // Simulate form submission
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
      setFormData({
        name: '',
        email: '',
        subject: '',
        message: ''
      });
    }, 1000);
  };

  return (
    <div className="bg-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <div className="text-center">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">Contact Us</h1>
            <p className="text-lg md:text-xl max-w-2xl mx-auto text-primary-100">
              We're here to help with any questions or feedback
            </p>
          </div>
        </div>
      </div>

      {/* Contact Information */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-6 md:gap-8">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 text-center">
              <div className="w-12 h-12 mx-auto bg-primary-100 rounded-full flex items-center justify-center mb-4">
                <EnvelopeIcon className="h-6 w-6 text-primary-600" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Email Us</h3>
              <p className="text-gray-600 mb-2">For general inquiries:</p>
              <a href="mailto:info@eventhubindia.com" className="text-primary-600 hover:text-primary-500">
                info@eventhubindia.com
              </a>
              <p className="text-gray-600 mt-2 mb-2">For customer support:</p>
              <a href="mailto:support@eventhubindia.com" className="text-primary-600 hover:text-primary-500">
                support@eventhubindia.com
              </a>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 text-center">
              <div className="w-12 h-12 mx-auto bg-primary-100 rounded-full flex items-center justify-center mb-4">
                <PhoneIcon className="h-6 w-6 text-primary-600" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Call Us</h3>
              <p className="text-gray-600 mb-2">Customer Service:</p>
              <a href="tel:+918003836368" className="text-primary-600 hover:text-primary-500">
                +91 80038-36368
              </a>
              <p className="text-gray-600 mt-4 text-sm">
                Available Monday - Saturday<br />
                10:00 AM - 7:00 PM IST
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 text-center">
              <div className="w-12 h-12 mx-auto bg-primary-100 rounded-full flex items-center justify-center mb-4">
                <MapPinIcon className="h-6 w-6 text-primary-600" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Our Office</h3>
              <p className="text-gray-600">
                123 Tech Park, 5th Floor<br />
                Outer Ring Road<br />
                Bengaluru, Karnataka 560103<br />
                India
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Form */}
      <section className="py-12 bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">Send Us a Message</h2>
            <p className="text-gray-600">
              Fill out the form below and we'll get back to you as soon as possible
            </p>
          </div>

          {submitted ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
              <div className="w-12 h-12 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-4">
                <PaperAirplaneIcon className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-lg font-medium text-green-800 mb-2">Message Sent!</h3>
              <p className="text-green-700">
                Thank you for contacting us. We'll respond to your message as soon as possible.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="bg-white p-6 md:p-8 rounded-lg shadow-sm">
              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    Your Name
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full input-field"
                    placeholder="Rahul Sharma"
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full input-field"
                    placeholder="rahul@example.com"
                  />
                </div>
              </div>
              <div className="mb-4">
                <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
                  Subject
                </label>
                <input
                  id="subject"
                  name="subject"
                  type="text"
                  required
                  value={formData.subject}
                  onChange={handleChange}
                  className="w-full input-field"
                  placeholder="How can we help you?"
                />
              </div>
              <div className="mb-6">
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                  Message
                </label>
                <textarea
                  id="message"
                  name="message"
                  rows={5}
                  required
                  value={formData.message}
                  onChange={handleChange}
                  className="w-full input-field"
                  placeholder="Please describe your inquiry..."
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full btn-primary flex justify-center items-center py-2 px-4"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Sending...
                  </>
                ) : 'Send Message'}
              </button>
            </form>
          )}
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">Frequently Asked Questions</h2>
            <p className="text-gray-600">
              Find quick answers to common questions
            </p>
          </div>

          <div className="space-y-6">
            {[
              {
                question: 'How do I get a refund for a cancelled event?',
                answer: 'If an event is cancelled by the organizer, you will automatically receive a refund to your original payment method within 5-7 business days. For UPI payments, refunds are typically processed within 3 business days.'
              },
              {
                question: 'Can I transfer my ticket to someone else?',
                answer: 'Yes, in most cases you can transfer your ticket to another person through your account dashboard. Some events may have restrictions on ticket transfers as per organizer policies.'
              },
              {
                question: 'How do I become an event organizer?',
                answer: 'You can sign up as an event organizer by creating an account and selecting the "Event Organizer" option during registration. Once approved, you\'ll be able to create and manage events across India.'
              },
              {
                question: 'What payment methods do you accept?',
                answer: 'We accept all major payment methods in India including credit/debit cards, UPI (PhonePe, Google Pay, Paytm), net banking, and popular wallets. International cards are also supported for NRI customers.'
              }
            ].map((faq, index) => (
              <div key={index} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h3 className="font-semibold text-lg text-gray-900 mb-2">{faq.question}</h3>
                <p className="text-gray-600">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Contact;
