import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheckIcon } from '@heroicons/react/24/outline';

const Terms = () => {
  return (
    <div className="bg-white">
      <div className="bg-gradient-to-r from-primary-600 to-primary-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 md:py-20">
          <div className="text-center">
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-2 sm:mb-4">Terms & Conditions</h1>
            <p className="text-base sm:text-lg max-w-2xl mx-auto text-primary-100">
              Last updated: June 1, 2024
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="prose prose-sm sm:prose lg:prose-lg prose-primary max-w-none">
          <div className="flex items-center mb-6 sm:mb-8">
            <ShieldCheckIcon className="h-6 w-6 sm:h-8 sm:w-8 text-primary-600 mr-2 sm:mr-3 flex-shrink-0" />
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 m-0">
              Please read these terms carefully
            </h2>
          </div>
          
          <p>
            Welcome to EventHub India. These Terms & Conditions govern your use of our website, mobile application, and services. 
            By accessing or using EventHub India, you agree to be bound by these Terms.
          </p>

          <h3>1. Acceptance of Terms</h3>
          <p>
            By creating an account, purchasing tickets, or using any part of the EventHub India platform, you acknowledge that you have read, 
            understood, and agree to be bound by these Terms & Conditions, as well as our Privacy Policy. If you do not agree with any part 
            of these terms, you must not use our services.
          </p>

          <h3>2. User Accounts</h3>
          <p>
            2.1. <strong>Account Creation:</strong> To use certain features of our platform, you may need to create an account. You agree to provide accurate, current, and complete information during the registration process.
          </p>
          <p>
            2.2. <strong>Account Security:</strong> You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You agree to notify us immediately of any unauthorized use of your account.
          </p>
          <p>
            2.3. <strong>Account Types:</strong> EventHub India offers different account types, including regular user accounts and event organizer accounts. Different terms may apply depending on the account type.
          </p>

          <h3>3. Booking and Ticketing</h3>
          <p>
            3.1. <strong>Ticket Purchases:</strong> When you purchase tickets through EventHub India, you are entering into a transaction with the event organizer, not EventHub India. We act as a platform facilitating the transaction.
          </p>
          <p>
            3.2. <strong>Ticket Validity:</strong> Tickets purchased through EventHub India are valid only for the specified event, date, time, and venue. Tickets cannot be exchanged or refunded unless stated otherwise in the specific event's terms.
          </p>
          <p>
            3.3. <strong>Cancellations and Refunds:</strong> Refund policies are determined by each event organizer. In case of event cancellation, the organizer's refund policy will apply.
          </p>

          <h3>4. Event Organizers</h3>
          <p>
            4.1. <strong>Creating Events:</strong> Event organizers are responsible for providing accurate and complete information about their events, including descriptions, dates, times, venues, and ticket prices.
          </p>
          <p>
            4.2. <strong>Compliance:</strong> Event organizers must comply with all applicable Indian laws and regulations related to hosting events, including obtaining necessary permits and licenses.
          </p>

          <h3>5. Prohibited Activities</h3>
          <p>
            Users and event organizers must not engage in any of the following activities:
          </p>
          <ul>
            <li>Creating fake events or misrepresenting event details</li>
            <li>Reselling tickets at prices higher than their face value</li>
            <li>Using the platform to promote illegal activities</li>
            <li>Attempting to gain unauthorized access to other user accounts or system data</li>
            <li>Engaging in any activity that disrupts the functioning of EventHub India</li>
          </ul>

          <h3>6. Fees and Payments</h3>
          <p>
            6.1. <strong>Platform Fees:</strong> EventHub India charges service fees for ticket purchases. These fees are clearly displayed during the checkout process.
          </p>
          <p>
            6.2. <strong>Payment Processing:</strong> Payments are processed securely through our payment partners. We support multiple payment methods including UPI, net banking, credit/debit cards, and popular digital wallets. By making a purchase, you agree to the terms of our payment processors.
          </p>

          <h3>7. Limitation of Liability</h3>
          <p>
            EventHub India is not responsible for the conduct of event organizers or event attendees. We do not guarantee the quality, safety, or legality of events listed on our platform. Your participation in events is at your own risk.
          </p>

          <h3>8. Intellectual Property</h3>
          <p>
            All content and materials available on EventHub India, including but not limited to logos, trademarks, software, text, and graphics, are the property of EventHub India or our licensors and are protected by intellectual property laws.
          </p>

          <h3>9. Termination</h3>
          <p>
            We reserve the right to terminate or suspend your account and access to EventHub India at our sole discretion, without notice, for conduct that we believe violates these Terms & Conditions or is harmful to other users, us, or third parties.
          </p>

          <h3>10. Changes to Terms</h3>
          <p>
            We may update these Terms & Conditions from time to time. If we make significant changes, we will notify you by email or through our platform. Your continued use of EventHub India after such changes constitutes acceptance of the updated terms.
          </p>

          <h3>11. Contact Information</h3>
          <p>
            If you have any questions about these Terms & Conditions, please contact us at:
          </p>
          <p>
            Email: <a href="mailto:legal@eventhubindia.com">legal@eventhubindia.com</a><br />
            Address: 123 Tech Park, 5th Floor, Outer Ring Road, Bengaluru, Karnataka 560103, India
          </p>
          
          <div className="mt-8 sm:mt-12 p-4 sm:p-6 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-center text-xs sm:text-sm text-gray-600 mb-4">
              By using EventHub India, you acknowledge that you have read, understood, and agree to these Terms & Conditions.
            </p>
            <div className="flex justify-center">
              <Link to="/" className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors text-sm sm:text-base">
                Return to Homepage
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Terms;
