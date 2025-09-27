import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheckIcon } from '@heroicons/react/24/outline';

const bullets = "•";

const BulletList = ({ children }) => (
  <ul className="mb-4 pl-5 space-y-1 list-none">
    {React.Children.map(children, (child, i) =>
      <li className="flex items-start gap-2 text-sm sm:text-base">
        <span className="block text-primary-600 pt-1">{bullets}</span>
        <span>{child}</span>
      </li>
    )}
  </ul>
);

const Privacy = () => {
  return (
    <div className="bg-white">
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
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="">
          <div className="flex items-center mb-8">
            <ShieldCheckIcon className="h-6 w-6 sm:h-8 sm:w-8 text-primary-600 mr-3 flex-shrink-0" />
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 m-0">
              Your privacy is important to us
            </h2>
          </div>

          <p className="mb-6 text-sm sm:text-base">
            EventHub ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our website and services.
          </p>

          <h3 className="text-lg sm:text-xl font-semibold text-primary-700">1. Information We Collect</h3>
          <h4 className="mt-2 text-base sm:text-lg font-medium text-gray-900">1.1 Personal Information</h4>
          <p className="text-sm sm:text-base mb-1">
            When you register on our site, book tickets, or create events, we may collect:
          </p>
          <BulletList>
            <>Name and contact information (email, phone number)</>
            <>Billing address and payment information</>
            <>Government-issued ID details (Aadhaar, PAN) when required</>
            <>Location data (city, state, PIN code)</>
            <>Profile information (preferences, interests)</>
          </BulletList>

          <h4 className="mt-2 text-base sm:text-lg font-medium text-gray-900">1.2 Usage Information</h4>
          <p className="text-sm sm:text-base mb-1">
            We automatically collect information about your interaction with our services:
          </p>
          <BulletList>
            <>Device information (IP address, browser type, operating system)</>
            <>Usage patterns (pages viewed, events searched, booking history)</>
            <>Cookies and similar tracking technologies</>
          </BulletList>

          <h3 className="text-lg sm:text-xl font-semibold text-primary-700 mt-6">2. How We Use Your Information</h3>
          <p className="text-sm sm:text-base mb-1">
            We use the collected information for:
          </p>
          <BulletList>
            <>Processing ticket bookings and payments</>
            <>Sending booking confirmations and event updates</>
            <>Personalizing your experience and recommendations</>
            <>Customer support and communication</>
            <>Fraud prevention and security</>
            <>Marketing communications (with your consent)</>
            <>Legal compliance and dispute resolution</>
          </BulletList>

          <h3 className="text-lg sm:text-xl font-semibold text-primary-700 mt-6">3. Information Sharing</h3>
          <p className="text-sm sm:text-base mb-1">We share your information only in the following circumstances:</p>
          <h4 className="mt-2 text-base sm:text-lg font-medium text-gray-900">3.1 With Event Organizers</h4>
          <p className="text-sm sm:text-base mb-1">
            When you book tickets, we share necessary information (name, email, phone) with event organizers for entry verification and communication.
          </p>
          <h4 className="mt-2 text-base sm:text-lg font-medium text-gray-900">3.2 With Service Providers</h4>
          <p className="text-sm sm:text-base mb-1">We work with trusted third parties for:</p>
          <BulletList>
            <>Payment processing (Razorpay, Stripe, UPI)</>
            <>Email and SMS services</>
            <>Analytics and performance monitoring</>
            <>Customer support tools</>
          </BulletList>
          <h4 className="mt-2 text-base sm:text-lg font-medium text-gray-900">3.3 Legal Requirements</h4>
          <p className="text-sm sm:text-base">
            We may disclose information when required by Indian law, court orders, or government regulations.
          </p>

          <h3 className="text-lg sm:text-xl font-semibold text-primary-700 mt-6">4. Data Security</h3>
          <p className="text-sm sm:text-base mb-1">
            We implement industry-standard security measures to protect your information:
          </p>
          <BulletList>
            <>SSL encryption for data transmission</>
            <>Secure servers with regular security audits</>
            <>Limited access to personal information</>
            <>Regular security training for employees</>
            <>PCI DSS compliance for payment processing</>
          </BulletList>

          <h3 className="text-lg sm:text-xl font-semibold text-primary-700 mt-6">5. Your Rights</h3>
          <p className="text-sm sm:text-base mb-1">
            Under applicable Indian laws, you have the right to:
          </p>
          <BulletList>
            <>Access your personal information</>
            <>Correct inaccurate data</>
            <>Delete your account and associated data</>
            <>Opt-out of marketing communications</>
            <>Download your data in a portable format</>
            <>Withdraw consent for data processing</>
          </BulletList>

          <h3 className="text-lg sm:text-xl font-semibold text-primary-700 mt-6">6. Cookies Policy</h3>
          <p className="text-sm sm:text-base mb-1">
            We use cookies and similar technologies to:
          </p>
          <BulletList>
            <>Remember your preferences and settings</>
            <>Analyze site traffic and usage patterns</>
            <>Personalize content and advertisements</>
            <>Enable social media features</>
          </BulletList>
          <p className="text-sm sm:text-base mb-4">
            You can control cookies through your browser settings, but disabling them may limit functionality.
          </p>

          <h3 className="text-lg sm:text-xl font-semibold text-primary-700 mt-6">7. Children's Privacy</h3>
          <p className="text-sm sm:text-base mb-4">
            Our services are not intended for children under 18. We do not knowingly collect information from minors without parental consent.
          </p>

          <h3 className="text-lg sm:text-xl font-semibold text-primary-700 mt-6">8. Data Retention</h3>
          <p className="text-sm sm:text-base mb-1">
            We retain your information for as long as necessary to provide services and comply with legal obligations. Typically:
          </p>
          <BulletList>
            <>Account information: Until account deletion</>
            <>Transaction records: 7 years (as per Indian regulations)</>
            <>Marketing data: Until opt-out or 3 years of inactivity</>
          </BulletList>

          <h3 className="text-lg sm:text-xl font-semibold text-primary-700 mt-6">9. International Data Transfers</h3>
          <p className="text-sm sm:text-base mb-4">
            Your data is primarily stored in servers located in India. If we transfer data internationally, we ensure appropriate safeguards are in place.
          </p>

          <h3 className="text-lg sm:text-xl font-semibold text-primary-700 mt-6">10. Updates to Privacy Policy</h3>
          <p className="text-sm sm:text-base mb-4">
            We may update this policy periodically. We will notify you of significant changes via email or website notifications.
          </p>

          <h3 className="text-lg sm:text-xl font-semibold text-primary-700 mt-6">11. Contact Information</h3>
          <p className="text-sm sm:text-base mb-2">
            For privacy-related queries or to exercise your rights, contact us at:
          </p>
          <div className="bg-gray-50 p-4 rounded-lg text-sm sm:text-base mb-4">
            <p><strong>Data Protection Officer</strong></p>
            <p>EventHub Private Limited</p>
            <p>Email: <a href="mailto:privacy@eventhub.in" className="text-primary-600">privacy@eventhub.in</a></p>
            <p>Phone: +91 1800-123-4567</p>
            <p>Address: 123 Tech Park, Sector 125, Noida, UP 201301</p>
          </div>

          <h3 className="text-lg sm:text-xl font-semibold text-primary-700 mt-6">12. Grievance Officer</h3>
          <p className="text-sm sm:text-base mb-2">
            In accordance with Information Technology Act 2000 and rules made thereunder, the Grievance Officer details are:
          </p>
          <div className="bg-gray-50 p-4 rounded-lg text-sm sm:text-base mb-4">
            <p><strong>Mr. Rajesh Kumar</strong></p>
            <p>Grievance Officer</p>
            <p>Email: <a href="mailto:grievance@eventhub.in" className="text-primary-600">grievance@eventhub.in</a></p>
            <p>Office Hours: Monday to Friday, 10 AM to 6 PM IST</p>
          </div>

          <div className="mt-12 p-4 sm:p-6 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-center text-xs sm:text-sm text-gray-600 mb-4">
              By using EventHub , you acknowledge that you have read and understood this Privacy Policy.
            </p>
            <div className="flex flex-col sm:flex-col justify-center gap-4">
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
