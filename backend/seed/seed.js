import { config } from "dotenv";
import connectDB from "../db/index.db.js";
import User from "../models/user.models.js";
import Event from "../models/event.models.js";

config();

// Sample event images (you can replace with actual event images)
const eventImages = {
  concert: [
    "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
    "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80"
  ],
  sports: [
    "https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
    "https://images.unsplash.com/photo-1579952363873-27d3bfad9c0d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80"
  ],
  theater: [
    "https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
    "https://images.unsplash.com/photo-1514306191717-452ec28c7814?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80"
  ],
  conference: [
    "https://images.unsplash.com/photo-1540575467063-178a50c2df87?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
    "https://images.unsplash.com/photo-1591115765373-5207764f72e7?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80"
  ],
  exhibition: [
    "https://images.unsplash.com/photo-1578662996442-48f60103fc96?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
    "https://images.unsplash.com/photo-1545558014-8692077e9b5c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80"
  ],
  workshop: [
    "https://images.unsplash.com/photo-1552664730-d307ca884978?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
    "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80"
  ],
  other: [
    "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
    "https://images.unsplash.com/photo-1505236858219-8359eb29e329?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80"
  ]
};

// Generate seat configuration
const generateSeats = (sections) => {
  const seats = [];
  const rowLabels = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

  sections.forEach(section => {
    for (let i = 0; i < section.rows; i++) {
      const rowLabel = rowLabels[i];
      for (let j = 1; j <= section.seatsPerRow; j++) {
        seats.push({
          row: rowLabel,
          number: j.toString().padStart(2, '0'),
          section: section.name,
          price: section.price,
          type: section.type,
          isAvailable: true
        });
      }
    }
  });

  return seats;
};

// Seed events for each category
const seedEvents = [
  // CONCERT EVENTS
  {
    title: "AR Rahman Live in Concert",
    description: "Experience the magic of Oscar-winning composer AR Rahman in a spectacular live concert featuring his greatest hits from Bollywood and international cinema. Join us for an unforgettable evening of music that has touched millions of hearts worldwide. The concert will feature a full orchestra, guest vocalists, and stunning visual effects that will transport you into the world of Rahman's mesmerizing compositions.",
    category: "concert",
    startDate: new Date('2024-12-15T19:00:00'),
    endDate: new Date('2024-12-15T22:00:00'),
    location: {
      name: "Jawaharlal Nehru Stadium",
      address: "Lodhi Road",
      city: "New Delhi",
      state: "Delhi",
      zipCode: "110003",
      country: "India"
    },
    imageUrl: eventImages.concert[0],
    galleryImages: [
      "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
    ],
    seats: generateSeats([
      { name: "Platinum", rows: 5, seatsPerRow: 20, price: 5000, type: "vip" },
      { name: "Gold", rows: 8, seatsPerRow: 25, price: 3500, type: "premium" },
      { name: "Silver", rows: 10, seatsPerRow: 30, price: 2000, type: "standard" }
    ]),
    tags: ["music", "ar-rahman", "bollywood", "live-concert", "orchestra"],
    isFeatured: true,
    status: "published"
  },
  {
    title: "Bollywood Nights - Arijit Singh Live",
    description: "Get ready for a mesmerizing evening with the voice of Bollywood, Arijit Singh. This exclusive concert will feature his most popular romantic ballads and chartbusters that have made him India's most beloved playback singer. Experience his soulful voice live with a complete band setup and special lighting effects.",
    category: "concert",
    startDate: new Date('2024-12-20T20:00:00'),
    endDate: new Date('2024-12-20T23:00:00'),
    location: {
      name: "NSCI Dome",
      address: "Worli Sports Club",
      city: "Mumbai",
      state: "Maharashtra",
      zipCode: "400018",
      country: "India"
    },
    imageUrl: eventImages.concert[1],
    galleryImages: [
      "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
    ],
    seats: generateSeats([
      { name: "VIP", rows: 4, seatsPerRow: 15, price: 7500, type: "vip" },
      { name: "Premium", rows: 6, seatsPerRow: 20, price: 4500, type: "premium" },
      { name: "General", rows: 12, seatsPerRow: 25, price: 2500, type: "standard" }
    ]),
    tags: ["arijit-singh", "bollywood", "romantic", "live-music", "mumbai"],
    isFeatured: false,
    status: "published"
  },

  // SPORTS EVENTS
  {
    title: "Mumbai Indians vs Chennai Super Kings - IPL 2024",
    description: "Witness the ultimate cricket rivalry as Mumbai Indians take on Chennai Super Kings at the iconic Wankhede Stadium. This high-octane IPL match promises thrilling cricket action with the biggest stars of the game. Experience the electric atmosphere with thousands of passionate fans cheering for their favorite teams. Don't miss this clash of titans in the world's most exciting T20 cricket league.",
    category: "sports",
    startDate: new Date('2024-12-25T19:30:00'),
    endDate: new Date('2024-12-25T23:00:00'),
    location: {
      name: "Wankhede Stadium",
      address: "Churchgate",
      city: "Mumbai",
      state: "Maharashtra",
      zipCode: "400020",
      country: "India"
    },
    imageUrl: eventImages.sports[0],
    galleryImages: [
      "https://images.unsplash.com/photo-1578662996442-48f60103fc96?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
    ],
    seats: generateSeats([
      { name: "Corporate Box", rows: 2, seatsPerRow: 10, price: 15000, type: "vip" },
      { name: "Premium Stand", rows: 8, seatsPerRow: 30, price: 8000, type: "premium" },
      { name: "Popular Stand", rows: 15, seatsPerRow: 40, price: 3000, type: "standard" }
    ]),
    tags: ["cricket", "ipl", "mumbai-indians", "chennai-super-kings", "wankhede"],
    isFeatured: true,
    status: "published"
  },
  {
    title: "Pro Kabaddi League - Bengaluru Bulls vs Tamil Thalaivas",
    description: "Experience the thrill of India's traditional sport in its modern avatar. Watch Bengaluru Bulls clash with Tamil Thalaivas in this high-energy Pro Kabaddi League match. Witness incredible athleticism, strategy, and the raw power of kabaddi players as they compete for victory. The stadium will be buzzing with excitement as two strong teams battle it out on the mat.",
    category: "sports",
    startDate: new Date('2025-01-05T20:00:00'),
    endDate: new Date('2025-01-05T22:00:00'),
    location: {
      name: "Sree Kanteerava Indoor Stadium",
      address: "Sampangi Rama Nagara",
      city: "Bengaluru",
      state: "Karnataka",
      zipCode: "560001",
      country: "India"
    },
    imageUrl: eventImages.sports[1],
    galleryImages: [
      "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1579952363873-27d3bfad9c0d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
    ],
    seats: generateSeats([
      { name: "VIP Gallery", rows: 3, seatsPerRow: 20, price: 2500, type: "vip" },
      { name: "Premium Seats", rows: 5, seatsPerRow: 25, price: 1500, type: "premium" },
      { name: "General Stands", rows: 10, seatsPerRow: 30, price: 800, type: "standard" }
    ]),
    tags: ["kabaddi", "pro-kabaddi-league", "bengaluru-bulls", "tamil-thalaivas", "indoor-stadium"],
    isFeatured: false,
    status: "published"
  },

  // THEATER EVENTS
  {
    title: "Mughal-E-Azam - The Musical",
    description: "Witness the grandeur of the timeless classic 'Mughal-E-Azam' brought to life on stage in this spectacular musical production. This Broadway-style musical features elaborate costumes, stunning sets, live orchestra, and powerful performances that recreate the magic of the legendary love story of Prince Salim and Anarkali. A visual and auditory feast that combines Indian classical arts with contemporary theater.",
    category: "theater",
    startDate: new Date('2024-12-18T19:30:00'),
    endDate: new Date('2024-12-18T22:30:00'),
    location: {
      name: "NCPA Theatre",
      address: "Nariman Point",
      city: "Mumbai",
      state: "Maharashtra",
      zipCode: "400021",
      country: "India"
    },
    imageUrl: eventImages.theater[0],
    galleryImages: [
      "https://images.unsplash.com/photo-1578662996442-48f60103fc96?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1485846234645-a62644f84728?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
    ],
    seats: generateSeats([
      { name: "Royal Box", rows: 2, seatsPerRow: 8, price: 5000, type: "vip" },
      { name: "Premium Circle", rows: 4, seatsPerRow: 15, price: 3000, type: "premium" },
      { name: "Dress Circle", rows: 6, seatsPerRow: 20, price: 2000, type: "standard" },
      { name: "Balcony", rows: 8, seatsPerRow: 25, price: 1500, type: "standard" }
    ]),
    tags: ["musical", "mughal-e-azam", "bollywood", "theater", "classical"],
    isFeatured: true,
    status: "published"
  },
  {
    title: "Shakespeare's Hamlet - Modern Adaptation",
    description: "Experience Shakespeare's greatest tragedy in a contemporary setting. This modern adaptation of Hamlet brings the classic tale of revenge, madness, and moral corruption to the Indian stage with a stellar cast and innovative direction. The production features modern staging techniques while preserving the poetic beauty of Shakespeare's original text.",
    category: "theater",
    startDate: new Date('2025-01-10T19:00:00'),
    endDate: new Date('2025-01-10T22:00:00'),
    location: {
      name: "Kamani Auditorium",
      address: "Copernicus Marg",
      city: "New Delhi",
      state: "Delhi",
      zipCode: "110001",
      country: "India"
    },
    imageUrl: eventImages.theater[1],
    galleryImages: [
      "https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1514306191717-452ec28c7814?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
    ],
    seats: generateSeats([
      { name: "Orchestra", rows: 8, seatsPerRow: 20, price: 2500, type: "premium" },
      { name: "Mezzanine", rows: 6, seatsPerRow: 18, price: 2000, type: "standard" },
      { name: "Balcony", rows: 10, seatsPerRow: 22, price: 1500, type: "standard" }
    ]),
    tags: ["shakespeare", "hamlet", "drama", "theater", "classical-literature"],
    isFeatured: false,
    status: "published"
  },

  // CONFERENCE EVENTS
  {
    title: "India Tech Summit 2024",
    description: "Join India's largest technology conference featuring industry leaders, innovators, and entrepreneurs. The summit will cover emerging technologies like AI, blockchain, IoT, and sustainable tech solutions. Network with tech professionals, attend workshops, and discover the latest trends shaping India's digital future. Features keynote speakers from major tech companies, startup showcases, and interactive panel discussions.",
    category: "conference",
    startDate: new Date('2024-12-28T09:00:00'),
    endDate: new Date('2024-12-28T18:00:00'),
    location: {
      name: "India Expo Mart",
      address: "Knowledge Park",
      city: "Greater Noida",
      state: "Uttar Pradesh",
      zipCode: "201308",
      country: "India"
    },
    imageUrl: eventImages.conference[0],
    galleryImages: [
      "https://images.unsplash.com/photo-1540575467063-178a50c2df87?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1591115765373-5207764f72e7?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
    ],
    seats: generateSeats([
      { name: "VIP Delegate", rows: 3, seatsPerRow: 15, price: 15000, type: "vip" },
      { name: "Premium Pass", rows: 5, seatsPerRow: 20, price: 8000, type: "premium" },
      { name: "Standard Pass", rows: 10, seatsPerRow: 30, price: 3500, type: "standard" }
    ]),
    tags: ["technology", "conference", "ai", "blockchain", "startup", "networking"],
    isFeatured: true,
    status: "published"
  },
  {
    title: "Healthcare Innovation Conference 2025",
    description: "A comprehensive conference focused on the future of healthcare in India. Featuring discussions on telemedicine, healthcare technology, medical innovations, and policy reforms. Connect with healthcare professionals, researchers, pharmaceutical companies, and health-tech startups. The conference includes case studies, research presentations, and networking sessions with industry experts.",
    category: "conference",
    startDate: new Date('2025-01-15T10:00:00'),
    endDate: new Date('2025-01-15T17:00:00'),
    location: {
      name: "Taj Palace Hotel",
      address: "Sardar Patel Marg",
      city: "New Delhi",
      state: "Delhi",
      zipCode: "110021",
      country: "India"
    },
    imageUrl: eventImages.conference[1],
    galleryImages: [
      "https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
    ],
    seats: generateSeats([
      { name: "Executive", rows: 2, seatsPerRow: 12, price: 12000, type: "vip" },
      { name: "Professional", rows: 4, seatsPerRow: 18, price: 6000, type: "premium" },
      { name: "Academic", rows: 6, seatsPerRow: 25, price: 3000, type: "standard" }
    ]),
    tags: ["healthcare", "medical-innovation", "telemedicine", "health-tech", "research"],
    isFeatured: false,
    status: "published"
  },

  // EXHIBITION EVENTS
  {
    title: "Contemporary Indian Art Exhibition",
    description: "Explore the vibrant world of contemporary Indian art featuring works by renowned and emerging artists from across the country. This exhibition showcases diverse art forms including paintings, sculptures, installations, and digital art that reflect modern India's cultural narrative. Meet the artists, attend guided tours, and experience the evolution of Indian contemporary art.",
    category: "exhibition",
    startDate: new Date('2025-01-20T11:00:00'),
    endDate: new Date('2025-01-27T19:00:00'),
    location: {
      name: "National Gallery of Modern Art",
      address: "Jaipur House",
      city: "New Delhi",
      state: "Delhi",
      zipCode: "110003",
      country: "India"
    },
    imageUrl: eventImages.exhibition[0],
    galleryImages: [
      "https://images.unsplash.com/photo-1578662996442-48f60103fc96?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1545558014-8692077e9b5c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
    ],
    seats: generateSeats([
      { name: "VIP Access", rows: 1, seatsPerRow: 50, price: 2000, type: "vip" },
      { name: "Premium Pass", rows: 2, seatsPerRow: 100, price: 1000, type: "premium" },
      { name: "General Entry", rows: 5, seatsPerRow: 150, price: 500, type: "standard" }
    ]),
    tags: ["art-exhibition", "contemporary-art", "indian-artists", "gallery", "cultural"],
    isFeatured: true,
    status: "published"
  },
  {
    title: "Auto Expo India 2025",
    description: "The biggest automotive exhibition in India showcasing the latest cars, bikes, electric vehicles, and automotive technology. Experience test drives, concept cars, and launch events from major automotive brands. The expo features interactive displays, virtual reality experiences, and expert talks on the future of mobility in India.",
    category: "exhibition",
    startDate: new Date('2025-02-01T10:00:00'),
    endDate: new Date('2025-02-05T18:00:00'),
    location: {
      name: "Pragati Maidan",
      address: "Mathura Road",
      city: "New Delhi",
      state: "Delhi",
      zipCode: "110001",
      country: "India"
    },
    imageUrl: eventImages.exhibition[1],
    galleryImages: [
      "https://images.unsplash.com/photo-1489824904134-891ab64532f1?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1563720223185-11003d516935?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
    ],
    seats: generateSeats([
      { name: "Trade Visitor", rows: 2, seatsPerRow: 200, price: 1500, type: "premium" },
      { name: "General Public", rows: 8, seatsPerRow: 300, price: 600, type: "standard" }
    ]),
    tags: ["auto-expo", "cars", "bikes", "electric-vehicles", "automotive-technology"],
    isFeatured: false,
    status: "published"
  },

  // WORKSHOP EVENTS
  {
    title: "Digital Photography Masterclass",
    description: "Master the art of digital photography in this comprehensive hands-on workshop. Learn professional techniques for portrait, landscape, and street photography. The workshop covers camera settings, composition rules, lighting techniques, and post-processing with industry-standard software. Includes practical shooting sessions and portfolio review by professional photographers.",
    category: "workshop",
    startDate: new Date('2025-01-12T10:00:00'),
    endDate: new Date('2025-01-12T17:00:00'),
    location: {
      name: "Creative Hub Mumbai",
      address: "Bandra Kurla Complex",
      city: "Mumbai",
      state: "Maharashtra",
      zipCode: "400051",
      country: "India"
    },
    imageUrl: eventImages.workshop[0],
    galleryImages: [
      "https://images.unsplash.com/photo-1552664730-d307ca884978?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
    ],
    seats: generateSeats([
      { name: "Premium Kit Included", rows: 2, seatsPerRow: 10, price: 8000, type: "premium" },
      { name: "Standard Seat", rows: 3, seatsPerRow: 15, price: 5000, type: "standard" }
    ]),
    tags: ["photography", "digital-photography", "workshop", "hands-on", "portfolio-building"],
    isFeatured: false,
    status: "published"
  },
  {
    title: "Startup Business Plan Workshop",
    description: "Learn to create a winning business plan for your startup from industry experts and successful entrepreneurs. This intensive workshop covers market research, financial planning, pitch deck creation, and investor presentation skills. Includes one-on-one mentoring sessions, business plan templates, and networking with fellow entrepreneurs and investors.",
    category: "workshop",
    startDate: new Date('2025-01-25T09:00:00'),
    endDate: new Date('2025-01-25T18:00:00'),
    location: {
      name: "T-Hub",
      address: "IIIT-H Campus, Gachibowli",
      city: "Hyderabad",
      state: "Telangana",
      zipCode: "500032",
      country: "India"
    },
    imageUrl: eventImages.workshop[1],
    galleryImages: [
      "https://images.unsplash.com/photo-1556761175-b413da4baf72?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1559136555-9303baea8ebd?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
    ],
    seats: generateSeats([
      { name: "Entrepreneur Package", rows: 2, seatsPerRow: 15, price: 12000, type: "premium" },
      { name: "Student Pass", rows: 3, seatsPerRow: 20, price: 6000, type: "standard" }
    ]),
    tags: ["startup", "business-plan", "entrepreneurship", "mentoring", "investor-pitch"],
    isFeatured: true,
    status: "published"
  },

  // OTHER EVENTS
  {
    title: "Diwali Food & Culture Festival",
    description: "Celebrate the festival of lights with a grand cultural and food festival featuring traditional Indian cuisine, cultural performances, and festive activities. Experience regional delicacies from across India, traditional dance and music performances, handicraft exhibitions, and family-friendly activities. Perfect for experiencing the rich cultural heritage of India during the most celebrated festival.",
    category: "other",
    startDate: new Date('2025-02-10T16:00:00'),
    endDate: new Date('2025-02-10T22:00:00'),
    location: {
      name: "Kingdom of Dreams",
      address: "Sector 29, Leisure City",
      city: "Gurgaon",
      state: "Haryana",
      zipCode: "122001",
      country: "India"
    },
    imageUrl: eventImages.other[0],
    galleryImages: [
      "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1505236858219-8359eb29e329?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
    ],
    seats: generateSeats([
      { name: "VIP Cultural Pass", rows: 3, seatsPerRow: 20, price: 2500, type: "vip" },
      { name: "Family Package", rows: 5, seatsPerRow: 30, price: 1500, type: "premium" },
      { name: "General Entry", rows: 10, seatsPerRow: 40, price: 800, type: "standard" }
    ]),
    tags: ["diwali", "cultural-festival", "food-festival", "traditional", "family-event"],
    isFeatured: true,
    status: "published"
  },
  {
    title: "Yoga and Wellness Retreat",
    description: "Join this transformative yoga and wellness retreat focused on mental and physical well-being. The retreat includes guided yoga sessions, meditation workshops, ayurvedic consultations, healthy cooking classes, and wellness talks by certified practitioners. Experience inner peace and rejuvenation in a serene environment with like-minded individuals seeking holistic wellness.",
    category: "other",
    startDate: new Date('2025-02-15T07:00:00'),
    endDate: new Date('2025-02-16T18:00:00'),
    location: {
      name: "Art of Living Ashram",
      address: "Udayapura",
      city: "Bengaluru",
      state: "Karnataka",
      zipCode: "560082",
      country: "India"
    },
    imageUrl: eventImages.other[1],
    galleryImages: [
      "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
    ],
    seats: generateSeats([
      { name: "Premium Retreat Package", rows: 2, seatsPerRow: 15, price: 8000, type: "premium" },
      { name: "Standard Retreat", rows: 4, seatsPerRow: 20, price: 5000, type: "standard" }
    ]),
    tags: ["yoga", "wellness", "meditation", "retreat", "ayurveda", "holistic-health"],
    isFeatured: false,
    status: "published"
  }
];

const seedDatabase = async () => {
  try {
    await connectDB();

    // Get all users to assign as organizers
    const users = await User.find();
    
    if (users.length === 0) {
      console.log("No users found. Please run user seeding first.");
      return;
    }

    // Clear existing events
    await Event.deleteMany({});
    console.log("Old events deleted");

    // Assign random organizers to events and calculate totals
    const eventsWithOrganizers = seedEvents.map((event) => {
      const randomUser = users[Math.floor(Math.random() * users.length)];
      const totalSeats = event.seats.length;
      
      return {
        ...event,
        organizer: randomUser._id,
        totalSeats,
        availableSeats: totalSeats,
        createdAt: new Date(),
        updatedAt: new Date()
      };
    });

    // Insert events
    await Event.insertMany(eventsWithOrganizers);
    
    console.log("Database seeded successfully with events:");
    console.log("- Concert events: 2");
    console.log("- Sports events: 2");  
    console.log("- Theater events: 2");
    console.log("- Conference events: 2");
    console.log("- Exhibition events: 2");
    console.log("- Workshop events: 2");
    console.log("- Other events: 2");
    console.log("Total events created: 14");
    
  } catch (error) {
    console.error("Error seeding database:", error);
  }
};

// Call the function
seedDatabase();
