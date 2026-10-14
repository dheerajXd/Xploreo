import { useState, useMemo, useEffect, useCallback } from 'react';
import {
  BROWSE_CATEGORIES,
  SORT_OPTIONS,
  validateSearchInput,
  filterHotels,
  filterExperiences,
  filterPlans,
  filterGuides,
  DEFAULT_HOTEL_FIXTURES,
  DEFAULT_EXPERIENCE_FIXTURES,
  DEFAULT_PLAN_FIXTURES,
  DEFAULT_GUIDE_FIXTURES,
  mapBackendHotel,
  mapBackendExperience,
  mapBackendPlan,
  mapBackendGuide,
} from '../../utils/browseUtils.js';
import { apiRequest } from '../../services/api.js';
import { useNavigate, useInRouterContext, useLocation } from 'react-router-dom';
import Navbar from '../../components/Navbar/navbar.jsx';
import BrowseHotelCard from './BrowseHotelCard.jsx';
import BrowseExperienceCard from './BrowseExperienceCard.jsx';
import BrowsePlanCard from './BrowsePlanCard.jsx';
import BrowseGuideCard from './BrowseGuideCard.jsx';
import BrowseItemDetailModal from './BrowseItemDetailModal.jsx';
import './travellerBrowse.css';

/**
 * TravellerBrowsePage
 * Complete, accessible browse & search hub for travellers.
 * Fully integrated with live backend APIs (/hotels, /experiences, /plans, /guide).
 * Follows the approved Xploreo Traveller Dashboard visual design:
 * - White/slate backgrounds, teal-to-blue gradients
 * - Desktop-first layout optimized for 1440 × 900 screens (290px sticky sidebar + cards grid)
 * - Flights are explicitly excluded per project requirements.
 */
export default function TravellerBrowsePage({
  user,
  showNavbar = true,
  initialCategory = BROWSE_CATEGORIES.HOTELS,
  hotels: propHotels,
  experiences: propExperiences,
  plans: propPlans,
  guides: propGuides,
  isLoading: propIsLoading,
  error: propError,
  onRetry: propOnRetry,
  onSelectItem,
  onBookItem,
  useFixtures = false,
}) {
  const inRouter = useInRouterContext();
  const navigate = inRouter ? useNavigate() : null;
  const location = inRouter ? useLocation() : null;

  const effectiveUser = user || {
    name: 'Anjali Sharma',
    username: 'Anjali Sharma',
    role: 'traveller',
    userId: 'T001',
  };
  const [activeCategory, setActiveCategory] = useState(initialCategory);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchQueryError, setSearchQueryError] = useState('');
  const [locationQuery, setLocationQuery] = useState('');
  const [checkInDate, setCheckInDate] = useState('');
  const [checkOutDate, setCheckOutDate] = useState('');
  const [guestCount, setGuestCount] = useState('2');
  const [roomCount, setRoomCount] = useState('1');

  useEffect(() => {
    if (!location?.search) return;
    const params = new URLSearchParams(location.search);
    const cat = params.get('category');
    if (cat) {
      const lower = cat.toLowerCase();
      if (lower === 'packages' || lower === 'plans') {
        setActiveCategory(BROWSE_CATEGORIES.PLANS);
      } else if (lower === 'hotels') {
        setActiveCategory(BROWSE_CATEGORIES.HOTELS);
      } else if (lower === 'experiences') {
        setActiveCategory(BROWSE_CATEGORIES.EXPERIENCES);
      } else if (lower === 'guides') {
        setActiveCategory(BROWSE_CATEGORIES.GUIDES);
      }
    }
    const search = params.get('search') || params.get('destination');
    if (search != null) {
      setSearchQuery(search);
      setLocationQuery(search);
    }
    const loc = params.get('location') || params.get('from');
    if (loc != null) {
      setLocationQuery(loc);
      if (!search) setSearchQuery(loc);
    }
    const checkIn = params.get('checkIn') || params.get('departure') || params.get('date');
    if (checkIn != null) setCheckInDate(checkIn);
    const checkOut = params.get('checkOut');
    if (checkOut != null) setCheckOutDate(checkOut);
    const guests = params.get('guests');
    if (guests != null) setGuestCount(guests);
    const rooms = params.get('rooms');
    if (rooms != null) setRoomCount(rooms);
  }, [location?.search]);

  // Filter states
  const [minStars, setMinStars] = useState(0);
  const [expCategory, setExpCategory] = useState('all');
  const [guideLanguage, setGuideLanguage] = useState('all');
  const [maxPrice, setMaxPrice] = useState('');
  const [selectedAmenities, setSelectedAmenities] = useState([]);

  // Sorting and View mode
  const [sortBy, setSortBy] = useState(SORT_OPTIONS.DEFAULT);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
  const [selectedDetailItem, setSelectedDetailItem] = useState(null);

  // Live state per resource category
  const [resourceData, setResourceData] = useState({
    [BROWSE_CATEGORIES.HOTELS]: propHotels ?? [],
    [BROWSE_CATEGORIES.EXPERIENCES]: propExperiences ?? [],
    [BROWSE_CATEGORIES.PLANS]: propPlans ?? [],
    [BROWSE_CATEGORIES.GUIDES]: propGuides ?? [],
  });
  const [resourceLoading, setResourceLoading] = useState({
    [BROWSE_CATEGORIES.HOTELS]: false,
    [BROWSE_CATEGORIES.EXPERIENCES]: false,
    [BROWSE_CATEGORIES.PLANS]: false,
    [BROWSE_CATEGORIES.GUIDES]: false,
  });
  const [resourceErrors, setResourceErrors] = useState({
    [BROWSE_CATEGORIES.HOTELS]: null,
    [BROWSE_CATEGORIES.EXPERIENCES]: null,
    [BROWSE_CATEGORIES.PLANS]: null,
    [BROWSE_CATEGORIES.GUIDES]: null,
  });

  const fetchCategory = useCallback(async (category) => {
    setResourceLoading((prev) => ({ ...prev, [category]: true }));
    setResourceErrors((prev) => ({ ...prev, [category]: null }));

    try {
      let mapped = [];
      if (category === BROWSE_CATEGORIES.HOTELS) {
        const raw = await apiRequest('/hotels');
        mapped = Array.isArray(raw) ? raw.map(mapBackendHotel).filter(Boolean) : [];
      } else if (category === BROWSE_CATEGORIES.EXPERIENCES) {
        const raw = await apiRequest('/experiences');
        mapped = Array.isArray(raw) ? raw.map(mapBackendExperience).filter(Boolean) : [];
      } else if (category === BROWSE_CATEGORIES.PLANS) {
        const res = await apiRequest('/plans');
        const items = Array.isArray(res) ? res : (Array.isArray(res?.data) ? res.data : []);
        mapped = items.map(mapBackendPlan).filter(Boolean);
      } else if (category === BROWSE_CATEGORIES.GUIDES) {
        // Backend guide controller is mapped at singular /guide
        const raw = await apiRequest('/guide');
        mapped = Array.isArray(raw) ? raw.map(mapBackendGuide).filter(Boolean) : [];
      }

      setResourceData((prev) => ({ ...prev, [category]: mapped }));
      setResourceErrors((prev) => ({ ...prev, [category]: null }));
    } catch (err) {
      setResourceErrors((prev) => ({
        ...prev,
        [category]: err.message || `Failed to load ${category}. Please try again.`,
      }));
      // Strict requirement: Never silently present fixture data after an API failure
      setResourceData((prev) => ({ ...prev, [category]: [] }));
    } finally {
      setResourceLoading((prev) => ({ ...prev, [category]: false }));
    }
  }, []);

  useEffect(() => {
    if (useFixtures) return;

    if (propHotels === undefined) fetchCategory(BROWSE_CATEGORIES.HOTELS);
    if (propExperiences === undefined) fetchCategory(BROWSE_CATEGORIES.EXPERIENCES);
    if (propPlans === undefined) fetchCategory(BROWSE_CATEGORIES.PLANS);
    if (propGuides === undefined) fetchCategory(BROWSE_CATEGORIES.GUIDES);
  }, [useFixtures, propHotels, propExperiences, propPlans, propGuides, fetchCategory]);

  const hotels = useFixtures
    ? (propHotels ?? DEFAULT_HOTEL_FIXTURES)
    : (propHotels ?? resourceData[BROWSE_CATEGORIES.HOTELS]);

  const experiences = useFixtures
    ? (propExperiences ?? DEFAULT_EXPERIENCE_FIXTURES)
    : (propExperiences ?? resourceData[BROWSE_CATEGORIES.EXPERIENCES]);

  const plans = useFixtures
    ? (propPlans ?? DEFAULT_PLAN_FIXTURES)
    : (propPlans ?? resourceData[BROWSE_CATEGORIES.PLANS]);

  const guides = useFixtures
    ? (propGuides ?? DEFAULT_GUIDE_FIXTURES)
    : (propGuides ?? resourceData[BROWSE_CATEGORIES.GUIDES]);

  const activeLoading = propIsLoading !== undefined
    ? propIsLoading
    : (useFixtures ? false : Boolean(resourceLoading[activeCategory]));

  const activeError = propError !== undefined
    ? propError
    : (useFixtures ? null : resourceErrors[activeCategory]);

  const handleRetryActive = () => {
    if (typeof propOnRetry === 'function') {
      propOnRetry(activeCategory);
    } else if (!useFixtures) {
      fetchCategory(activeCategory);
    }
  };

  // Validate search input query on change
  const handleQueryChange = (e) => {
    const val = e.target.value;
    setSearchQuery(val);
    const validation = validateSearchInput(val);
    if (!validation.isValid) {
      setSearchQueryError(validation.error || 'Invalid search query');
    } else {
      setSearchQueryError('');
    }
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setSearchQueryError('');
    setLocationQuery('');
    setCheckInDate('');
    setCheckOutDate('');
    setMinStars(0);
    setExpCategory('all');
    setGuideLanguage('all');
    setMaxPrice('');
    setSelectedAmenities([]);
    setSortBy(SORT_OPTIONS.DEFAULT);
  };

  const handleToggleAmenity = (amenity) => {
    setSelectedAmenities((prev) =>
      prev.includes(amenity)
        ? prev.filter((a) => a !== amenity)
        : [...prev, amenity]
    );
  };

  // Filter and sort items based on active category
  const filteredHotels = useMemo(() => {
    let result = filterHotels(hotels, {
      query: searchQuery,
      location: locationQuery,
      minStars: Number(minStars || 0),
      maxPrice: maxPrice ? Number(maxPrice) : Infinity,
      sortBy,
    });

    if (selectedAmenities.length > 0) {
      result = result.filter((h) => {
        const hotelAmenities = Array.isArray(h.amenities)
          ? h.amenities.map((a) => a.toLowerCase())
          : [];
        return selectedAmenities.every((sa) =>
          hotelAmenities.some((ha) => ha.includes(sa.toLowerCase()))
        );
      });
    }

    return result;
  }, [hotels, searchQuery, locationQuery, minStars, maxPrice, selectedAmenities, sortBy]);

  const filteredExperiences = useMemo(() => {
    return filterExperiences(experiences, {
      query: searchQuery,
      destination: locationQuery,
      category: expCategory,
      maxPrice: maxPrice ? Number(maxPrice) : Infinity,
      sortBy,
    });
  }, [experiences, searchQuery, locationQuery, expCategory, maxPrice, sortBy]);

  const filteredPlans = useMemo(() => {
    return filterPlans(plans, {
      query: searchQuery,
      destination: locationQuery,
      maxPrice: maxPrice ? Number(maxPrice) : Infinity,
      sortBy,
    });
  }, [plans, searchQuery, locationQuery, maxPrice, sortBy]);

  const filteredGuides = useMemo(() => {
    return filterGuides(guides, {
      query: searchQuery,
      location: locationQuery,
      language: guideLanguage,
      sortBy,
    });
  }, [guides, searchQuery, locationQuery, guideLanguage, sortBy]);

  const currentCount = useMemo(() => {
    switch (activeCategory) {
      case BROWSE_CATEGORIES.HOTELS:
        return filteredHotels.length;
      case BROWSE_CATEGORIES.EXPERIENCES:
        return filteredExperiences.length;
      case BROWSE_CATEGORIES.PLANS:
        return filteredPlans.length;
      case BROWSE_CATEGORIES.GUIDES:
        return filteredGuides.length;
      default:
        return 0;
    }
  }, [activeCategory, filteredHotels, filteredExperiences, filteredPlans, filteredGuides]);

  // Active filter count for sidebar header badge
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (searchQuery) count++;
    if (locationQuery) count++;
    if (minStars > 0) count++;
    if (expCategory !== 'all') count++;
    if (guideLanguage !== 'all') count++;
    if (maxPrice) count++;
    if (selectedAmenities.length > 0) count += selectedAmenities.length;
    return count;
  }, [searchQuery, locationQuery, minStars, expCategory, guideLanguage, maxPrice, selectedAmenities]);

  const handleCardSelect = (item) => {
    setSelectedDetailItem(item);
    if (onSelectItem) {
      onSelectItem(item, activeCategory);
    }
  };

  const handleCardBook = (item) => {
    if (onBookItem) {
      onBookItem(item, activeCategory);
    } else if (navigate) {
      const checkIn = checkInDate || item.date || item.checkIn || '2026-11-10';
      const checkOut = checkOutDate || item.checkOut || '2026-11-14';
      const guests = Number(guestCount) || 2;
      const basePrice = item.pricePerNight ?? item.price ?? item.pricePerPerson ?? 5000;
      const taxesAndFees = item.taxesAndFees ?? 1200;
      const total = item.total || (basePrice * guests + taxesAndFees);

      const checkoutItem = {
        id: item.id || `item-${Date.now()}`,
        title: item.name || item.title || 'Selected Reservation',
        type: activeCategory === BROWSE_CATEGORIES.HOTELS ? 'hotel' : activeCategory === BROWSE_CATEGORIES.EXPERIENCES ? 'experience' : 'plan',
        location: item.location || item.city || item.destination || 'India',
        date: checkIn,
        checkIn: checkIn,
        checkOut: checkOut,
        guestCount: guests,
        basePrice: basePrice,
        taxesAndFees: taxesAndFees,
        total: total,
        imageUrl: item.image || item.imageUrl || null,
      };

      navigate('/Traveller/checkout', { state: { item: checkoutItem } });
    }
  };

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  return (
    <div className="trav-browse-page-wrapper">
      {showNavbar && inRouter && (
        <Navbar user={effectiveUser} />
      )}
      <div className="trav-browse-page" data-testid="traveller-browse-page">
      {/* ── 1. Page Header Banner ── */}
      <header className="trav-browse-header">
        <div className="trav-browse-title-group">
          <div className="trav-browse-header-icon" aria-hidden="true">
            🧭
          </div>
          <div>
            <h1 className="trav-browse-title">Explore Your Next Adventure</h1>
            <p className="trav-browse-subtitle">
              Discover handpicked luxury stays, authentic local experiences, and curated holiday packages across India.
            </p>
          </div>
        </div>

        <div className="trav-browse-user-chip">
          <div className="trav-browse-user-avatar">T1</div>
          <span>Anjali Sharma</span>
          <span className="trav-browse-user-role-badge">Traveller</span>
        </div>
      </header>

      {/* ── 2. Primary Category Navigation Tabs ── */}
      <nav className="trav-browse-nav" aria-label="Browse Categories">
        <div className="trav-browse-tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={activeCategory === BROWSE_CATEGORIES.HOTELS}
            className={`trav-browse-tab ${activeCategory === BROWSE_CATEGORIES.HOTELS ? 'active' : ''}`}
            onClick={() => setActiveCategory(BROWSE_CATEGORIES.HOTELS)}
          >
            🏨 Hotels ({hotels.length})
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeCategory === BROWSE_CATEGORIES.EXPERIENCES}
            className={`trav-browse-tab ${activeCategory === BROWSE_CATEGORIES.EXPERIENCES ? 'active' : ''}`}
            onClick={() => setActiveCategory(BROWSE_CATEGORIES.EXPERIENCES)}
          >
            🧭 Experiences ({experiences.length})
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeCategory === BROWSE_CATEGORIES.PLANS}
            className={`trav-browse-tab ${activeCategory === BROWSE_CATEGORIES.PLANS ? 'active' : ''}`}
            onClick={() => setActiveCategory(BROWSE_CATEGORIES.PLANS)}
          >
            🗺 Tour Packages ({plans.length})
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeCategory === BROWSE_CATEGORIES.GUIDES}
            className={`trav-browse-tab ${activeCategory === BROWSE_CATEGORIES.GUIDES ? 'active' : ''}`}
            onClick={() => setActiveCategory(BROWSE_CATEGORIES.GUIDES)}
          >
            🧑‍🌾 Local Guides ({guides.length})
          </button>
        </div>
      </nav>

      {/* ── 3. Unified 5-Column Search Toolbar ── */}
      <section className="trav-browse-toolbar" aria-label="Search and Filter Controls">
        <div className="trav-browse-search-row">
          {/* Query Field */}
          <div className="trav-browse-field">
            <label htmlFor="browse-search-input" className="trav-browse-field-label">
              SEARCH {activeCategory.toUpperCase()}
            </label>
            <div className="trav-browse-input-wrap">
              <span className="trav-browse-input-icon" aria-hidden="true">🔍</span>
              <input
                id="browse-search-input"
                type="text"
                className={`trav-browse-input ${searchQueryError ? 'input-error' : ''}`}
                placeholder="Search by name, keywords, or features..."
                value={searchQuery}
                onChange={handleQueryChange}
                aria-label="Search items"
              />
            </div>
          </div>

          {/* Location Field */}
          <div className="trav-browse-field">
            <label htmlFor="browse-location-input" className="trav-browse-field-label">
              DESTINATION / REGION
            </label>
            <div className="trav-browse-input-wrap">
              <span className="trav-browse-input-icon" aria-hidden="true">📍</span>
              <input
                id="browse-location-input"
                type="text"
                className="trav-browse-input"
                placeholder="City, region or destination..."
                value={locationQuery}
                onChange={(e) => setLocationQuery(e.target.value)}
                aria-label="Filter by location or destination"
              />
            </div>
          </div>

          {/* Date Picker */}
          <div className="trav-browse-field">
            <label htmlFor="browse-date-input" className="trav-browse-field-label">
              {activeCategory === BROWSE_CATEGORIES.HOTELS ? 'CHECK-IN' : 'DATE'}
            </label>
            <div className="trav-browse-input-wrap">
              <span className="trav-browse-input-icon" aria-hidden="true">📅</span>
              <input
                id="browse-date-input"
                type="date"
                className="trav-browse-input"
                min={todayStr}
                value={checkInDate}
                onChange={(e) => setCheckInDate(e.target.value)}
              />
            </div>
          </div>

          {/* Guests & Rooms */}
          <div className="trav-browse-field">
            <label htmlFor="browse-guests-select" className="trav-browse-field-label">
              GUESTS & ROOMS
            </label>
            <div className="trav-browse-input-wrap">
              <span className="trav-browse-input-icon" aria-hidden="true">👥</span>
              <select
                id="browse-guests-select"
                className="trav-browse-select"
                value={`${guestCount}-${roomCount}`}
                onChange={(e) => {
                  const [g, r] = e.target.value.split('-');
                  setGuestCount(g);
                  setRoomCount(r);
                }}
              >
                <option value="1-1">1 Guest, 1 Room</option>
                <option value="2-1">2 Guests, 1 Room</option>
                <option value="3-1">3 Guests, 1 Room</option>
                <option value="4-2">4 Guests, 2 Rooms</option>
                <option value="5-2">5+ Guests, 2+ Rooms</option>
              </select>
            </div>
          </div>

          {/* Primary Search CTA Button */}
          <button
            type="button"
            className="trav-browse-search-btn"
            id="browse-search-submit-btn"
          >
            <span aria-hidden="true">🔍</span>
            <span>
              {activeCategory === BROWSE_CATEGORIES.HOTELS
                ? 'Search Stays'
                : activeCategory === BROWSE_CATEGORIES.EXPERIENCES
                ? 'Search Experiences'
                : activeCategory === BROWSE_CATEGORIES.PLANS
                ? 'Search Packages'
                : 'Search Guides'}
            </span>
          </button>
        </div>

        {searchQueryError && (
          <div className="trav-browse-query-error" role="alert">
            {searchQueryError}
          </div>
        )}
      </section>

      {/* ── 4. Main 2-Column Desktop Layout ── */}
      <div className="trav-browse-main-layout">
        {/* Left Fixed Filter Sidebar (290px) */}
        <aside className="trav-browse-sidebar" aria-label="Desktop Filters">
          <div className="trav-browse-filter-header">
            <h3 className="trav-browse-filter-title">
              <span>Filters</span>
              {activeFiltersCount > 0 && (
                <span className="trav-browse-tab-count" style={{ background: '#0d9488', color: '#ffffff' }}>
                  {activeFiltersCount}
                </span>
              )}
            </h3>
            {activeFiltersCount > 0 && (
              <button
                type="button"
                className="trav-browse-reset-btn"
                onClick={handleResetFilters}
              >
                Reset Filters
              </button>
            )}
          </div>

          {/* Budget Range Section */}
          <div className="trav-browse-filter-section">
            <h4 className="trav-browse-filter-heading">
              <span>Budget Range</span>
              <span className="trav-browse-filter-val">
                {maxPrice ? `Up to ₹${Number(maxPrice).toLocaleString()}` : 'Any Price'}
              </span>
            </h4>
            <input
              type="range"
              className="trav-browse-range-slider"
              min="1000"
              max="50000"
              step="1000"
              value={maxPrice || 50000}
              onChange={(e) => setMaxPrice(e.target.value === '50000' ? '' : e.target.value)}
              aria-label="Max budget range slider"
            />
            <div className="trav-browse-range-limits">
              <span>₹1,000</span>
              <span>₹50,000+</span>
            </div>
            <div className="trav-browse-input-wrap" style={{ height: '2.5rem', marginTop: '0.25rem' }}>
              <span style={{ fontSize: '0.85rem', color: '#64748b', marginRight: '0.4rem' }}>₹</span>
              <input
                id="browse-max-price"
                type="number"
                className="trav-browse-input"
                placeholder="Custom max price"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                min="0"
                style={{ fontSize: '0.85rem' }}
              />
            </div>
          </div>

          {/* Category-Specific Filter: Hotels */}
          {activeCategory === BROWSE_CATEGORIES.HOTELS && (
            <>
              <div className="trav-browse-filter-section" aria-label="Hotel star filter">
                <h4 className="trav-browse-filter-heading">Hotel Class</h4>
                <div className="trav-browse-chips-row">
                  {[0, 3, 4, 5].map((stars) => (
                    <button
                      key={stars}
                      type="button"
                      className={`trav-browse-filter-chip ${minStars === stars ? 'active' : ''}`}
                      onClick={() => setMinStars(stars)}
                    >
                      {stars === 0 ? 'All Stays' : `${stars}★ & above`}
                    </button>
                  ))}
                </div>
              </div>

              <div className="trav-browse-filter-section">
                <h4 className="trav-browse-filter-heading">Popular Amenities</h4>
                <div className="trav-browse-checkbox-list">
                  {['Swimming Pool', 'Spa & Wellness', 'Private Beach', 'Free Wi-Fi', 'Free Breakfast', 'Fine Dining'].map((amenity) => (
                    <label key={amenity} className="trav-browse-checkbox-label">
                      <input
                        type="checkbox"
                        className="trav-browse-checkbox"
                        checked={selectedAmenities.includes(amenity)}
                        onChange={() => handleToggleAmenity(amenity)}
                      />
                      <span>{amenity}</span>
                    </label>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Category-Specific Filter: Experiences */}
          {activeCategory === BROWSE_CATEGORIES.EXPERIENCES && (
            <div className="trav-browse-filter-section" aria-label="Experience category filter">
              <h4 className="trav-browse-filter-heading">Activity Theme</h4>
              <div className="trav-browse-chips-row">
                {['all', 'adventure', 'culture', 'culinary', 'wellness', 'wildlife'].map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    className={`trav-browse-filter-chip ${expCategory === cat ? 'active' : ''}`}
                    onClick={() => setExpCategory(cat)}
                  >
                    {cat === 'all' ? 'All Activities' : cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Category-Specific Filter: Guides */}
          {activeCategory === BROWSE_CATEGORIES.GUIDES && (
            <div className="trav-browse-filter-section" aria-label="Guide language filter">
              <h4 className="trav-browse-filter-heading">Languages Spoken</h4>
              <div className="trav-browse-chips-row">
                {['all', 'english', 'hindi', 'marathi', 'malayalam'].map((lang) => (
                  <button
                    key={lang}
                    type="button"
                    className={`trav-browse-filter-chip ${guideLanguage === lang ? 'active' : ''}`}
                    onClick={() => setGuideLanguage(lang)}
                  >
                    {lang === 'all' ? 'All Languages' : lang.charAt(0).toUpperCase() + lang.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Category-Specific Filter: Plans */}
          {activeCategory === BROWSE_CATEGORIES.PLANS && (
            <div className="trav-browse-filter-section">
              <h4 className="trav-browse-filter-heading">Package Features</h4>
              <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0, lineHeight: 1.4 }}>
                All packages include vetted accommodation, guided transfers, and verified itineraries.
              </p>
            </div>
          )}
        </aside>

        {/* Right Results Area */}
        <main className="trav-browse-results-area">
          {/* Results Top Controls Bar */}
          <div className="trav-browse-results-bar">
            <span className="trav-browse-results-count">
              Showing <strong>{currentCount}</strong> verified {activeCategory}
              {locationQuery ? ` in "${locationQuery}"` : ''}
              {searchQuery ? ` matching "${searchQuery}"` : ''}
            </span>

            <div className="trav-browse-results-actions">
              <div className="trav-browse-sort-wrap">
                <label htmlFor="browse-sort-select" className="trav-browse-sort-label">Sort by:</label>
                <select
                  id="browse-sort-select"
                  className="trav-browse-sort-select"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value={SORT_OPTIONS.DEFAULT}>Recommended</option>
                  <option value={SORT_OPTIONS.PRICE_LOW}>Price: Low to High</option>
                  <option value={SORT_OPTIONS.PRICE_HIGH}>Price: High to Low</option>
                  <option value={SORT_OPTIONS.RATING}>Highest Rated</option>
                  <option value={SORT_OPTIONS.NAME}>Alphabetical (A-Z)</option>
                </select>
              </div>

              <div className="trav-browse-view-toggle">
                <button
                  type="button"
                  className={`trav-browse-view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                  onClick={() => setViewMode('grid')}
                  title="Grid view"
                  aria-label="Grid view"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="7" height="7" rx="1" />
                    <rect x="14" y="3" width="7" height="7" rx="1" />
                    <rect x="14" y="14" width="7" height="7" rx="1" />
                    <rect x="3" y="14" width="7" height="7" rx="1" />
                  </svg>
                </button>
                <button
                  type="button"
                  className={`trav-browse-view-btn ${viewMode === 'list' ? 'active' : ''}`}
                  onClick={() => setViewMode('list')}
                  title="List view"
                  aria-label="List view"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="8" y1="6" x2="21" y2="6" />
                    <line x1="8" y1="12" x2="21" y2="12" />
                    <line x1="8" y1="18" x2="21" y2="18" />
                    <line x1="3" y1="6" x2="3.01" y2="6" />
                    <line x1="3" y1="12" x2="3.01" y2="12" />
                    <line x1="3" y1="18" x2="3.01" y2="18" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Active Filter Pills Bar */}
          {activeFiltersCount > 0 && (
            <div className="trav-browse-active-pills">
              {searchQuery && (
                <span className="trav-browse-pill">
                  "{searchQuery}"
                  <button
                    type="button"
                    className="trav-browse-pill-remove"
                    onClick={() => {
                      setSearchQuery('');
                      setSearchQueryError('');
                    }}
                    aria-label="Remove search filter"
                  >
                    ✕
                  </button>
                </span>
              )}
              {locationQuery && (
                <span className="trav-browse-pill">
                  📍 {locationQuery}
                  <button
                    type="button"
                    className="trav-browse-pill-remove"
                    onClick={() => setLocationQuery('')}
                    aria-label="Remove location filter"
                  >
                    ✕
                  </button>
                </span>
              )}
              {minStars > 0 && (
                <span className="trav-browse-pill">
                  ★ {minStars}+ Stars
                  <button
                    type="button"
                    className="trav-browse-pill-remove"
                    onClick={() => setMinStars(0)}
                    aria-label="Remove star filter"
                  >
                    ✕
                  </button>
                </span>
              )}
              {expCategory !== 'all' && (
                <span className="trav-browse-pill">
                  Activity: {expCategory}
                  <button
                    type="button"
                    className="trav-browse-pill-remove"
                    onClick={() => setExpCategory('all')}
                    aria-label="Remove activity category filter"
                  >
                    ✕
                  </button>
                </span>
              )}
              {guideLanguage !== 'all' && (
                <span className="trav-browse-pill">
                  Language: {guideLanguage}
                  <button
                    type="button"
                    className="trav-browse-pill-remove"
                    onClick={() => setGuideLanguage('all')}
                    aria-label="Remove language filter"
                  >
                    ✕
                  </button>
                </span>
              )}
              {maxPrice && (
                <span className="trav-browse-pill">
                  ≤ ₹{Number(maxPrice).toLocaleString()}
                  <button
                    type="button"
                    className="trav-browse-pill-remove"
                    onClick={() => setMaxPrice('')}
                    aria-label="Remove price filter"
                  >
                    ✕
                  </button>
                </span>
              )}
              {selectedAmenities.map((amenity) => (
                <span key={amenity} className="trav-browse-pill">
                  {amenity}
                  <button
                    type="button"
                    className="trav-browse-pill-remove"
                    onClick={() => handleToggleAmenity(amenity)}
                    aria-label={`Remove amenity filter ${amenity}`}
                  >
                    ✕
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* ── Content States ── */}

          {/* 1. Loading Skeleton */}
          {activeLoading && (
            <div className="trav-browse-skeleton-grid" aria-busy="true" aria-label="Loading catalog results">
              {[1, 2, 3, 4].map((n) => (
                <div key={n} className="trav-browse-skeleton-card">
                  <div className="trav-browse-skeleton-media" />
                  <div className="trav-browse-skeleton-text-lg" />
                  <div className="trav-browse-skeleton-text-sm" />
                  <div className="trav-browse-skeleton-footer" />
                </div>
              ))}
            </div>
          )}

          {/* 2. Error Alert State */}
          {!activeLoading && activeError && (
            <div className="trav-browse-error-state" role="alert">
              <span className="trav-browse-error-icon" aria-hidden="true">⚠️</span>
              <h3>Unable to load {activeCategory}</h3>
              <p>{activeError}</p>
              <button
                type="button"
                className="trav-browse-btn trav-browse-btn-primary"
                onClick={handleRetryActive}
              >
                Try Again
              </button>
            </div>
          )}

          {/* 3. Empty Results State */}
          {!activeLoading && !activeError && currentCount === 0 && (
            <div className="trav-browse-empty-state" data-testid="browse-empty-state">
              <span className="trav-browse-empty-icon" aria-hidden="true">🔍</span>
              <h3>No matching {activeCategory} found</h3>
              <p>
                We couldn't find any results matching your search criteria. Try adjusting your filters, location, or search terms.
              </p>
              <button
                type="button"
                className="trav-browse-btn trav-browse-btn-primary"
                onClick={handleResetFilters}
              >
                Clear All Filters
              </button>
            </div>
          )}

          {/* 4. Populated Results Cards */}
          {!activeLoading && !activeError && currentCount > 0 && (
            <div
              className={viewMode === 'grid' ? 'trav-browse-grid' : 'trav-browse-list'}
              data-testid="browse-grid"
            >
              {activeCategory === BROWSE_CATEGORIES.HOTELS &&
                filteredHotels.map((hotel) => (
                  <BrowseHotelCard
                    key={hotel.id}
                    hotel={hotel}
                    onSelect={handleCardSelect}
                    onBook={handleCardBook}
                  />
                ))}

              {activeCategory === BROWSE_CATEGORIES.EXPERIENCES &&
                filteredExperiences.map((exp) => (
                  <BrowseExperienceCard
                    key={exp.id}
                    experience={exp}
                    onSelect={handleCardSelect}
                    onBook={handleCardBook}
                  />
                ))}

              {activeCategory === BROWSE_CATEGORIES.PLANS &&
                filteredPlans.map((plan) => (
                  <BrowsePlanCard
                    key={plan.id}
                    plan={plan}
                    onSelect={handleCardSelect}
                    onBook={handleCardBook}
                  />
                ))}

              {activeCategory === BROWSE_CATEGORIES.GUIDES &&
                filteredGuides.map((guide) => (
                  <BrowseGuideCard
                    key={guide.userId}
                    guide={guide}
                    onSelect={handleCardSelect}
                    onRequest={handleCardBook}
                  />
                ))}
            </div>
          )}
        </main>
      </div>

      {/* ── 5. Detail Drill-down Modal ── */}
      {selectedDetailItem && (
        <BrowseItemDetailModal
          item={selectedDetailItem}
          category={activeCategory}
          onClose={() => setSelectedDetailItem(null)}
          onBook={handleCardBook}
        />
      )}
      </div>
    </div>
  );
}
