/**
 * Realistic Mock Fixtures for Travel Packages & Plans (M4 Phase 2)
 * Regional breakdown: Jaipur, Goa, Delhi, Mumbai, Kerala.
 * Focus: Partner Hotel Stays and Curated Daily Experiences.
 * Zero user-facing flight or transport data.
 */

export const MOCK_PLANS = [
  {
    id: 'plan-jaipur-heritage-01',
    title: 'Royal Jaipur Heritage & Palaces',
    description: 'Immerse yourself in Rajasthan royal history with guided tours through Amer Fort, City Palace, and traditional artisan workshops in the Pink City.',
    originCity: 'Delhi',
    destination: 'Jaipur',
    status: 'available',
    durationNights: 4,
    pricePerPerson: 24500,
    hotelStars: 4,
    includesFlight: false,
    image: 'https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=800&q=80',
    tags: ['Heritage', 'Culture', 'Architecture', 'Artisans'],
    itinerary: {
      day1: {
        flight: null,
        hotel: {
          id: 'hotel-jaipur-palace-01',
          hotelId: 'HP-JAI-001',
          name: 'The Heritage Haveli & Spa, Jaipur',
          checkInDate: '2026-11-01',
          checkOutDate: '2026-11-05',
          roomType: 'Heritage Deluxe Room',
          status: 'planned',
        },
      },
      days: [
        {
          dayNumber: 2,
          experiences: [
            {
              id: 'exp-jai-amer-01',
              experienceId: 'EXP-JAI-101',
              title: 'Amer Fort Sunrise Guided Walk',
              location: 'Amer, Jaipur',
              startsAt: '2026-11-02T07:00:00.000Z',
              endsAt: '2026-11-02T10:30:00.000Z',
              status: 'planned',
            },
            {
              id: 'exp-jai-bazaar-02',
              experienceId: 'EXP-JAI-102',
              title: 'Old Bazaar Spice & Textile Trail',
              location: 'Johari Bazaar, Jaipur',
              startsAt: '2026-11-02T16:00:00.000Z',
              endsAt: '2026-11-02T18:30:00.000Z',
              status: 'planned',
            },
          ],
        },
        {
          dayNumber: 3,
          experiences: [
            {
              id: 'exp-jai-citypalace-03',
              experienceId: 'EXP-JAI-103',
              title: 'City Palace & Jantar Mantar Observatory',
              location: 'City Palace Complex, Jaipur',
              startsAt: '2026-11-03T09:30:00.000Z',
              endsAt: '2026-11-03T13:00:00.000Z',
              status: 'planned',
            },
            {
              id: 'exp-jai-pottery-04',
              experienceId: 'EXP-JAI-104',
              title: 'Blue Pottery Artisan Workshop',
              location: 'Civil Lines, Jaipur',
              startsAt: '2026-11-03T15:30:00.000Z',
              endsAt: '2026-11-03T17:30:00.000Z',
              status: 'planned',
            },
          ],
        },
        {
          dayNumber: 4,
          experiences: [
            {
              id: 'exp-jai-nahargarh-05',
              experienceId: 'EXP-JAI-105',
              title: 'Nahargarh Fort Sunset & Panoramic Views',
              location: 'Nahargarh Hills, Jaipur',
              startsAt: '2026-11-04T16:30:00.000Z',
              endsAt: '2026-11-04T19:00:00.000Z',
              status: 'planned',
            },
          ],
        },
      ],
    },
  },
  {
    id: 'plan-goa-coastal-02',
    title: 'Goa Coastal Serenity & Spice Trails',
    description: 'Unwind along pristine southern beaches, tour historic colonial churches in Old Goa, and discover local organic spice plantations.',
    originCity: 'Mumbai',
    destination: 'Goa',
    status: 'available',
    durationNights: 5,
    pricePerPerson: 28000,
    hotelStars: 5,
    includesFlight: false,
    image: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=800&q=80',
    tags: ['Beach', 'Wellness', 'Colonial', 'Culinary'],
    itinerary: {
      day1: {
        flight: null,
        hotel: {
          id: 'hotel-goa-beach-02',
          hotelId: 'HP-GOA-002',
          name: 'Coconut Grove Luxury Beach Resort',
          checkInDate: '2026-11-10',
          checkOutDate: '2026-11-15',
          roomType: 'Ocean Breeze Villa',
          status: 'planned',
        },
      },
      days: [
        {
          dayNumber: 2,
          experiences: [
            {
              id: 'exp-goa-oldgoa-01',
              experienceId: 'EXP-GOA-201',
              title: 'Old Goa Latin Quarter Walking Tour',
              location: 'Fontainhas, Panaji',
              startsAt: '2026-11-11T09:00:00.000Z',
              endsAt: '2026-11-11T12:00:00.000Z',
              status: 'planned',
            },
          ],
        },
        {
          dayNumber: 3,
          experiences: [
            {
              id: 'exp-goa-spice-02',
              experienceId: 'EXP-GOA-202',
              title: 'Sahakari Spice Plantation Guided Walk & Lunch',
              location: 'Ponda, Goa',
              startsAt: '2026-11-12T10:00:00.000Z',
              endsAt: '2026-11-12T14:30:00.000Z',
              status: 'planned',
            },
          ],
        },
        {
          dayNumber: 4,
          experiences: [
            {
              id: 'exp-goa-kayak-03',
              experienceId: 'EXP-GOA-203',
              title: 'Sal Backwaters Mangrove Kayaking',
              location: 'Sal River, South Goa',
              startsAt: '2026-11-13T07:30:00.000Z',
              endsAt: '2026-11-13T10:30:00.000Z',
              status: 'planned',
            },
          ],
        },
      ],
    },
  },
  {
    id: 'plan-kerala-backwaters-03',
    title: 'Kerala Backwaters & Houseboat Retreat',
    description: 'Drift through serene palm-fringed lagoons in Alleppey and explore colonial tea estates in the tranquil hills of Munnar.',
    originCity: 'Bangalore',
    destination: 'Kerala',
    status: 'available',
    durationNights: 5,
    pricePerPerson: 32000,
    hotelStars: 4,
    includesFlight: false,
    image: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=800&q=80',
    tags: ['Backwaters', 'Nature', 'Houseboat', 'Relaxation'],
    itinerary: {
      day1: {
        flight: null,
        hotel: {
          id: 'hotel-kerala-resort-03',
          hotelId: 'HP-KER-003',
          name: 'Vembanad Lake Heritage Sanctuary',
          checkInDate: '2026-11-18',
          checkOutDate: '2026-11-23',
          roomType: 'Waterfront Cottage',
          status: 'planned',
        },
      },
      days: [
        {
          dayNumber: 2,
          experiences: [
            {
              id: 'exp-ker-houseboat-01',
              experienceId: 'EXP-KER-301',
              title: 'Alleppey Private Houseboat Cruise',
              location: 'Alleppey Jetty',
              startsAt: '2026-11-19T11:00:00.000Z',
              endsAt: '2026-11-19T17:00:00.000Z',
              status: 'planned',
            },
          ],
        },
        {
          dayNumber: 3,
          experiences: [
            {
              id: 'exp-ker-kathakali-02',
              experienceId: 'EXP-KER-302',
              title: 'Traditional Kathakali Theatre Evening',
              location: 'Kochi Cultural Centre',
              startsAt: '2026-11-20T18:00:00.000Z',
              endsAt: '2026-11-20T20:00:00.000Z',
              status: 'planned',
            },
          ],
        },
      ],
    },
  },
  {
    id: 'plan-delhi-monuments-04',
    title: 'Historic Delhi: Mughal Glory to Modern City',
    description: 'Explore the heart of India with curated walks through Old Delhi culinary streets, Humayun Tomb, and Lodhi Art District.',
    originCity: 'Jaipur',
    destination: 'Delhi',
    status: 'available',
    durationNights: 3,
    pricePerPerson: 18500,
    hotelStars: 4,
    includesFlight: false,
    image: 'https://images.unsplash.com/photo-1587474260584-136574528ed5?auto=format&fit=crop&w=800&q=80',
    tags: ['Monuments', 'Street Food', 'History', 'Mughal'],
    itinerary: {
      day1: {
        flight: null,
        hotel: {
          id: 'hotel-delhi-boutique-04',
          hotelId: 'HP-DEL-004',
          name: 'The Imperial Heritage Hotel, New Delhi',
          checkInDate: '2026-11-25',
          checkOutDate: '2026-11-28',
          roomType: 'Club Suite',
          status: 'planned',
        },
      },
      days: [
        {
          dayNumber: 2,
          experiences: [
            {
              id: 'exp-del-chandni-01',
              experienceId: 'EXP-DEL-401',
              title: 'Chandni Chowk Old Delhi Culinary Trail',
              location: 'Old Delhi',
              startsAt: '2026-11-26T10:00:00.000Z',
              endsAt: '2026-11-26T13:30:00.000Z',
              status: 'planned',
            },
            {
              id: 'exp-del-humayun-02',
              experienceId: 'EXP-DEL-402',
              title: 'Humayun Tomb Architecture Tour',
              location: 'Nizamuddin, New Delhi',
              startsAt: '2026-11-26T15:30:00.000Z',
              endsAt: '2026-11-26T18:00:00.000Z',
              status: 'planned',
            },
          ],
        },
        {
          dayNumber: 3,
          experiences: [
            {
              id: 'exp-del-qutub-03',
              experienceId: 'EXP-DEL-403',
              title: 'Qutub Minar Archaeological Park Walk',
              location: 'Mehrauli, New Delhi',
              startsAt: '2026-11-27T09:00:00.000Z',
              endsAt: '2026-11-27T12:00:00.000Z',
              status: 'planned',
            },
          ],
        },
      ],
    },
  },
  {
    id: 'plan-mumbai-harbour-05',
    title: 'Mumbai Coastal Lights & Art Deco Legacy',
    description: 'Experience South Mumbai iconic Gateway of India, heritage Victorian architecture, and sunset sailing around Mumbai Harbour.',
    originCity: 'Goa',
    destination: 'Mumbai',
    status: 'available',
    durationNights: 3,
    pricePerPerson: 26000,
    hotelStars: 5,
    includesFlight: false,
    image: 'https://images.unsplash.com/photo-1570168007204-dfb528c6958f?auto=format&fit=crop&w=800&q=80',
    tags: ['Coastal', 'Art Deco', 'Harbour', 'Culture'],
    itinerary: {
      day1: {
        flight: null,
        hotel: {
          id: 'hotel-mumbai-grand-05',
          hotelId: 'HP-MUM-005',
          name: 'The Colaba Waterfront Palace',
          checkInDate: '2026-12-01',
          checkOutDate: '2026-12-04',
          roomType: 'Seaview Executive Room',
          status: 'planned',
        },
      },
      days: [
        {
          dayNumber: 2,
          experiences: [
            {
              id: 'exp-mum-heritage-01',
              experienceId: 'EXP-MUM-501',
              title: 'South Mumbai Victorian Heritage Walk',
              location: 'Fort & Colaba, Mumbai',
              startsAt: '2026-12-02T09:00:00.000Z',
              endsAt: '2026-12-02T12:00:00.000Z',
              status: 'planned',
            },
            {
              id: 'exp-mum-sailing-02',
              experienceId: 'EXP-MUM-502',
              title: 'Mumbai Harbour Sunset Seabird Sailing',
              location: 'Gateway of India, Mumbai',
              startsAt: '2026-12-02T16:30:00.000Z',
              endsAt: '2026-12-02T18:30:00.000Z',
              status: 'planned',
            },
          ],
        },
      ],
    },
  },
  {
    id: 'plan-jaipur-crafts-06',
    title: 'Jaipur Block Printing & Fort Trails (Draft)',
    description: 'Specialty textile crafts package focusing on hand-block printing in Sanganer and lesser-known Aravalli fort trails.',
    originCity: 'Delhi',
    destination: 'Jaipur',
    status: 'unavailable',
    durationNights: 2,
    pricePerPerson: 14000,
    hotelStars: 3,
    includesFlight: false,
    image: 'https://images.unsplash.com/photo-1477587458883-47145ed94245?auto=format&fit=crop&w=800&q=80',
    tags: ['Textiles', 'Workshops', 'Offbeat'],
    itinerary: {
      day1: {
        flight: null,
        hotel: {
          id: 'hotel-jaipur-boutique-06',
          hotelId: 'HP-JAI-006',
          name: 'Sanganer Heritage Homestay',
          checkInDate: '2026-12-10',
          checkOutDate: '2026-12-12',
          roomType: 'Standard Courtyard Room',
          status: 'planned',
        },
      },
      days: [
        {
          dayNumber: 2,
          experiences: [
            {
              id: 'exp-jai-sanganer-01',
              experienceId: 'EXP-JAI-106',
              title: 'Sanganer Master Block Printing Masterclass',
              location: 'Sanganer, Jaipur',
              startsAt: '2026-12-11T10:00:00.000Z',
              endsAt: '2026-12-11T14:00:00.000Z',
              status: 'planned',
            },
          ],
        },
      ],
    },
  },
];
