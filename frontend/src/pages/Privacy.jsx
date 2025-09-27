import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheckIcon } from '@heroicons/react/24/outline';

const Privacy = () => {
  return (
    <div className="bg-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20">
          <div className="text-center">
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4">Privacy Policy</h1>
            <p className="text-base sm:text-lg max-w-2xl mx-auto text-primary-100">
              Last updated: January 15, 2024
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="prose prose-primary max-w-none">
          <div className="flex items-center mb-8">
            <ShieldCheckIcon className="h-6 w-6 sm:h-8 sm:w-8 text-primary-600 mr-3 flex-shrink-0" />
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 m-0">
              Your privacy is important to us
            </h2>
          </div>
          
          <p className="text-sm sm:text-base">
            EventHub India ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our website and services.
          </p>

          <h3 className="text-lg sm:text-xl">1. Information We Collect</h3>
          
          <h4 className="text-base sm:text-lg">1.1 Personal Information</h4>
          <p className="text-sm sm:text-base">
            When you register on our site, book tickets, or create events, we may collect:
          </p>
          <ul className="text-sm sm:text-base">
            <li>Name and contact information (email, phone number)</li>
            <li>Billing address and payment information</li>
            <li>Government-issued ID details (Aadhaar, PAN) when required</li>
            <li>Location data (city, state, PIN code)</li>
            <li>Profile information (preferences, interests)</li>
          </ul>

          <h4 className="text-base sm:text-lg">1.2 Usage Information</h4>
          <p className="text-sm sm:text-base">
            We automatically collect information about your interaction with our services:
          </p>
          <ul className="text-sm sm:text-base">
            <li>Device information (IP address, browser type, operating system)</li>
            <li>Usage patterns (pages viewed, events searched, booking history)</li>
            <li>Cookies and similar tracking technologies</li>
          </ul>

          <h3 className="text-lg sm:text-xl">2. How We Use Your Information</h3>
          <p className="text-sm sm:text-base">
            We use the collected information for:
          </p>
          <ul className="text-sm sm:text-base">
            <li>Processing ticket bookings and payments</li>
            <li>Sending booking confirmations and event updates</li>
            <li>Personalizing your experience and recommendations</li>
            <li>Customer support and communication</li>
            <li>Fraud prevention and security</li>
            <li>Marketing communications (with your consent)</li>
            <li>Legal compliance and dispute resolution</li>
          </ul>

          <h3 className="text-lg sm:text-xl">3. Information Sharing</h3>
          <p className="text-sm sm:text-base">
            We share your information only in the following circumstances:
          </p>
          
          <h4 className="text-base sm:text-lg">3.1 With Event Organizers</h4>
          <p className="text-sm sm:text-base">
            When you book tickets, we share necessary information (name, email, phone) with event organizers for entry verification and communication.
          </p>

          <h4 className="text-base sm:text-lg">3.2 With Service Providers</h4>
          <p className="text-sm sm:text-base">
            We work with trusted third parties for:
          </p>
          <ul className="text-sm sm:text-base">
            <li>Payment processing (Razorpay, Stripe, UPI)</li>
            <li>Email and SMS services</li>
            <li>Analytics and performance monitoring</li>
            <li>Customer support tools</li>
          </ul>

          <h4 className="text-base sm:text-lg">3.3 Legal Requirements</h4>
          <p className="text-sm sm:text-base">
            We may disclose information when required by Indian law, court orders, or government regulations.
          </p>

          <h3 className="text-lg sm:text-xl">4. Data Security</h3>
          <p className="text-sm sm:text-base">
            We implement industry-standard security measures to protect your information:
          </p>
          <ul className="text-sm sm:text-base">
            <li>SSL encryption for data transmission</li>
            <li>Secure servers with regular security audits</li>
            <li>Limited access to personal information</li>
            <li>Regular security training for employees</li>
            <li>PCI DSS compliance for payment processing</li>
          </ul>

          <h3 className="text-lg sm:text-xl">5. Your Rights</h3>
          <p className="text-sm sm:text-base">
            Under applicable Indian laws, you have the right to:
          </p>
          <ul className="text-sm sm:text-base">
            <li>Access your personal information</li>
            <li>Correct inaccurate data</li>
            <li>Delete your account and associated data</li>
            <li>Opt-out of marketing communications</li>
            <li>Download your data in a portable format</li>
            <li>Withdraw consent for data processing</li>
          </ul>

          <h3 className="text-lg sm:text-xl">6. Cookies Policy</h3>
          <p className="text-sm sm:text-base">
            We use cookies and similar technologies to:
          </p>
          <ul className="text-sm sm:text-base">
            <li>Remember your preferences and settings</li>
            <li>Analyze site traffic and usage patterns</li>
            <li>Personalize content and advertisements</li>
            <li>Enable social media features</li>
          </ul>
          <p className="text-sm sm:text-base">
            You can control cookies through your browser settings, but disabling them may limit functionality.
          </p>

          <h3 className="text-lg sm:text-xl">7. Children's Privacy</h3>
          <p className="text-sm sm:text-base">
            Our services are not intended for children under 18. We do not knowingly collect information from minors without parental consent.
          </p>

          <h3 className="text-lg sm:text-xl">8. Data Retention</h3>
          <p className="text-sm sm:text-base">
            We retain your information for as long as necessary to provide services and comply with legal obligations. Typically:
          </p>
          <ul className="text-sm sm:text-base">
            <li>Account information: Until account deletion</li>
            <li>Transaction records: 7 years (as per Indian regulations)</li>
            <li>Marketing data: Until opt-out or 3 years of inactivity</li>
          </ul>

          <h3 className="text-lg sm:text-xl">9. International Data Transfers</h3>
          <p className="text-sm sm:text-base">
            Your data is primarily stored in servers located in India. If we transfer data internationally, we ensure appropriate safeguards are in place.
          </p>

          <h3 className="text-lg sm:text-xl">10. Updates to Privacy Policy</h3>
          <p className="text-sm sm:text-base">
            We may update this policy periodically. We will notify you of significant changes via email or website notifications.
          </p>

          <h3 className="text-lg sm:text-xl">11. Contact Information</h3>
          <p className="text-sm sm:text-base">
            For privacy-related queries or to exercise your rights, contact us at:
          </p>
          <div className="bg-gray-50 p-4 rounded-lg text-sm sm:text-base">
            <p><strong>Data Protection Officer</strong></p>
            <p>EventHub India Private Limited</p>
            <p>Email: <a href="mailto:privacy@eventhub.in" className="text-primary-600">privacy@eventhub.in</a></p>
            <p>Phone: +91 1800-123-4567</p>
            <p>Address: 123 Tech Park, Sector 125, Noida, UP 201301</p>
          </div>

          <h3 className="text-lg sm:text-xl">12. Grievance Officer</h3>
          <p className="text-sm sm:text-base">
            In accordance with Information Technology Act 2000 and rules made thereunder, the Grievance Officer details are:
          </p>
          <div className="bg-gray-50 p-4 rounded-lg text-sm sm:text-base">
            <p><strong>Mr. Rajesh Kumar</strong></p>
            <p>Grievance Officer</p>
            <p>Email: <a href="mailto:grievance@eventhub.in" className="text-primary-600">grievance@eventhub.in</a></p>
            <p>Office Hours: Monday to Friday, 10 AM to 6 PM IST</p>
          </div>
          
          <div className="mt-12 p-4 sm:p-6 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-center text-xs sm:text-sm text-gray-600 mb-4">
              By using EventHub India, you acknowledge that you have read and understood this Privacy Policy.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-3">
              <Link to="/" className="btn-primary text-center">
                Return to Homepage
              </Link>
              <Link to="/terms" className="btn-secondary text-center">
                View Terms & Conditions
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Privacy;
