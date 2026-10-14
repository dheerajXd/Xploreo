/**
 * Mock Partner Hotel Catalog for Xploreo Packages (M4 Phase 2).
 * Realistic partner accommodation inventory for:
 * Jaipur, Goa, Delhi, Mumbai, Kerala.
 * Strictly ground accommodation only. Zero transport/flights.
 */

export const MOCK_HOTELS_CATALOG = [
  // --- JAIPUR HOTELS ---
  {
    id: 'hotel-jai-01',
    hotelId: 'HP-JAI-001',
    name: 'The Heritage Haveli & Spa, Jaipur',
    destination: 'Jaipur',
    stars: 4,
    pricePerNight: 4200,
    roomType: 'Heritage Deluxe Room',
    description: 'Restored royal haveli featuring traditional courtyards, marble arches, and rooftop views of the Pink City.',
    image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'hotel-jai-02',
    hotelId: 'HP-JAI-002',
    name: 'The Oberoi Rajvilas Palace',
    destination: 'Jaipur',
    stars: 5,
    pricePerNight: 8500,
    roomType: 'Premier Luxury Villa',
    description: 'Sprawling 32-acre landscaped gardens, private pools, and royal Rajasthani hospitality.',
    image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'hotel-jai-03',
    hotelId: 'HP-JAI-003',
    name: 'Jaipur Central Comfort Inn',
    destination: 'Jaipur',
    stars: 3,
    pricePerNight: 2400,
    roomType: 'Superior Room',
    description: 'Modern comfort conveniently located near MI Road and old city bazaars.',
    image: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=600&q=80',
  },

  // --- GOA HOTELS ---
  {
    id: 'hotel-goa-01',
    hotelId: 'HP-GOA-001',
    name: 'Coconut Grove Luxury Beach Resort',
    destination: 'Goa',
    stars: 5,
    pricePerNight: 5600,
    roomType: 'Ocean Breeze Villa',
    description: 'Secluded beachfront resort in South Goa surrounded by swaying coconut palms and private shore access.',
    image: 'https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'hotel-goa-02',
    hotelId: 'HP-GOA-002',
    name: 'Fontainhas Heritage Boutique Manor',
    destination: 'Goa',
    stars: 4,
    pricePerNight: 3800,
    roomType: 'Portuguese Balcony Suite',
    description: 'Charming Portuguese heritage villa nestled in Panaji colorful Latin Quarter.',
    image: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'hotel-goa-03',
    hotelId: 'HP-GOA-003',
    name: 'Calangute Palms Retreat',
    destination: 'Goa',
    stars: 3,
    pricePerNight: 2200,
    roomType: 'Standard Garden Room',
    description: 'Cozy boutique stay minutes away from bustling coastal markets and shacks.',
    image: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=600&q=80',
  },

  // --- DELHI HOTELS ---
  {
    id: 'hotel-del-01',
    hotelId: 'HP-DEL-001',
    name: 'The Imperial Heritage Hotel, New Delhi',
    destination: 'Delhi',
    stars: 5,
    pricePerNight: 7200,
    roomType: 'Heritage Colonial Suite',
    description: 'Legendary art deco hotel located on Janpath, combining Victorian elegance with modern luxury.',
    image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'hotel-del-02',
    hotelId: 'HP-DEL-002',
    name: 'Bloom Boutique Waterfront, Delhi',
    destination: 'Delhi',
    stars: 4,
    pricePerNight: 3600,
    roomType: 'Signature Queen Room',
    description: 'Contemporary minimalist boutique hotel close to India Gate and Connaught Place.',
    image: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'hotel-del-03',
    hotelId: 'HP-DEL-003',
    name: 'Old Delhi Heritage Inn',
    destination: 'Delhi',
    stars: 3,
    pricePerNight: 2100,
    roomType: 'Traditional Courtyard Room',
    description: 'Atmospheric stay in Chandni Chowk providing immediate access to historical monuments.',
    image: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=600&q=80',
  },

  // --- MUMBAI HOTELS ---
  {
    id: 'hotel-bom-01',
    hotelId: 'HP-BOM-001',
    name: 'The Gateway Palace & Marina, Mumbai',
    destination: 'Mumbai',
    stars: 5,
    pricePerNight: 8200,
    roomType: 'Harbour View Luxury Room',
    description: 'Historic landmark overlooking the Arabian Sea and Gateway of India in Colaba.',
    image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'hotel-bom-02',
    hotelId: 'HP-BOM-002',
    name: 'Bandra Art Deco Boutique House',
    destination: 'Mumbai',
    stars: 4,
    pricePerNight: 4500,
    roomType: 'Boutique King Studio',
    description: 'Stylish property in suburban Bandra surrounded by trendy cafes and seaside promenades.',
    image: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'hotel-bom-03',
    hotelId: 'HP-BOM-003',
    name: 'Marine Drive Cityview Hotel',
    destination: 'Mumbai',
    stars: 3,
    pricePerNight: 2900,
    roomType: 'Executive City Room',
    description: 'Classic seafront accommodation along Marine Drive Queens Necklace.',
    image: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=600&q=80',
  },

  // --- KERALA HOTELS ---
  {
    id: 'hotel-ker-01',
    hotelId: 'HP-KER-001',
    name: 'Kumarakom Backwater Palace Resort',
    destination: 'Kerala',
    stars: 5,
    pricePerNight: 6400,
    roomType: 'Lagoon Heritage Villa',
    description: 'Serene lakeside sanctuary with private canals, Ayurvedic wellness therapies, and Vembanad views.',
    image: 'https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'hotel-ker-02',
    hotelId: 'HP-KER-002',
    name: 'Fort Kochi Heritage Mansion',
    destination: 'Kerala',
    stars: 4,
    pricePerNight: 3900,
    roomType: 'Dutch Colonial Suite',
    description: 'Charming 300-year-old colonial manor in Fort Kochi near Chinese fishing nets.',
    image: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'hotel-ker-03',
    hotelId: 'HP-KER-003',
    name: 'Munnar Mist Valley Cottages',
    destination: 'Kerala',
    stars: 3,
    pricePerNight: 2500,
    roomType: 'Valley View Cottage',
    description: 'Rustic hillside retreat nestled amid tea plantations and aromatic spice hills.',
    image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=600&q=80',
  },
];

/**
 * Helper to fetch partner hotels filtered by destination.
 */
export function getHotelsByDestination(destination) {
  if (!destination) return [];
  const q = destination.toLowerCase().trim();
  return MOCK_HOTELS_CATALOG.filter((h) => h.destination.toLowerCase() === q);
}

/**
 * Helper to get a hotel by stable ID.
 */
export function getHotelById(id) {
  return MOCK_HOTELS_CATALOG.find((h) => h.id === id || h.hotelId === id);
}
