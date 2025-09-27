import React from "react";
import {
  CalendarDaysIcon,
  UsersIcon,
  BuildingOffice2Icon,
  TrophyIcon,
} from "@heroicons/react/24/outline";

const About = () => {
  return (
    <div className="bg-white">
      <div className="bg-gradient-to-r from-primary-600 to-primary-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <div className="text-center">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
              About EventHub 
            </h1>
            <p className="text-lg md:text-xl max-w-2xl mx-auto text-primary-100">
              Bringing Indians together with unforgettable experiences since
              2020 🇮🇳
            </p>
          </div>
        </div>
      </div>
      <section className="py-12 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="md:flex md:items-center md:gap-12">
            <div className="md:w-1/2 mb-8 md:mb-0">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
                Our Story
              </h2>
              <p className="text-gray-600 mb-4">
                EventHub  was founded in 2020 to simplify event discovery
                and bookings for people across the nation. What began as a local
                community platform in Mumbai has grown into a pan-India
                solution.
              </p>
              <p className="text-gray-600 mb-4">
                From concerts in Bengaluru to cricket matches in Delhi, theatre
                in Kolkata and conferences in Hyderabad — we make attending
                events seamless and fun.
              </p>
              <p className="text-gray-600">
                Today, thousands of Indian event organizers and millions of
                attendees use EventHub to connect, celebrate, and create
                lifelong memories. 🎉
              </p>
            </div>
            <div className="md:w-1/2">
              <div className="rounded-lg overflow-hidden shadow-lg">
                <img
                  src="https://images.unsplash.com/photo-1594122230689-45899d9e6f69?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80"
                  alt="Indian audience at event"
                  className="w-full h-auto object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-gray-50 py-12 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
              Our Values
            </h2>
            <p className="text-gray-600 max-w-3xl mx-auto">
              The guiding principles of EventHub 
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-sm text-center">
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <UsersIcon className="h-6 w-6 text-primary-600" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Community First</h3>
              <p className="text-gray-600 text-sm">
                We bring people together — from Mumbai to Chennai, Delhi to
                Kochi.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm text-center">
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <TrophyIcon className="h-6 w-6 text-primary-600" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Excellence</h3>
              <p className="text-gray-600 text-sm">
                We ensure world-class experiences for Indian audiences.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm text-center">
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <BuildingOffice2Icon className="h-6 w-6 text-primary-600" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Innovation</h3>
              <p className="text-gray-600 text-sm">
                Constantly adapting to India's diverse and growing event
                industry.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm text-center">
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <CalendarDaysIcon className="h-6 w-6 text-primary-600" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Accessibility</h3>
              <p className="text-gray-600 text-sm">
                Making events affordable and accessible across Bharat 🇮🇳.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-12 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
              Meet Our Indian Team
            </h2>
            <p className="text-gray-600 max-w-3xl mx-auto">
              The driving force behind EventHub 
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                name: "Rajesh Kumar",
                role: "CEO & Co-Founder",
                image: "https://randomuser.me/api/portraits/men/31.jpg",
              },
              {
                name: "Priya Sharma",
                role: "CTO & Co-Founder",
                image: "https://randomuser.me/api/portraits/women/45.jpg",
              },
              {
                name: "Amit Verma",
                role: "Head of Product",
                image: "https://randomuser.me/api/portraits/men/67.jpg",
              },
              {
                name: "Neha Singh",
                role: "Marketing Director",
                image: "https://randomuser.me/api/portraits/women/24.jpg",
              },
              {
                name: "Arjun Mehta",
                role: "Customer Success Manager",
                image: "https://randomuser.me/api/portraits/men/55.jpg",
              },
              {
                name: "Riya Patel",
                role: "Lead Designer",
                image: "https://randomuser.me/api/portraits/women/68.jpg",
              },
            ].map((member, index) => (
              <div key={index} className="text-center">
                <div className="w-32 h-32 rounded-full mx-auto mb-4 overflow-hidden">
                  <img
                    src={member.image}
                    alt={member.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <h3 className="font-semibold text-lg">{member.name}</h3>
                <p className="text-gray-600 text-sm">{member.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;
