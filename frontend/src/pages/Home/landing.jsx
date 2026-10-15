import { useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../../components/Navbar/navbar";
import "./home.css";
import beachVideo from "../../../../front_end/components/ui/landing/beach.mp4";
import travellerVideo from "../../../../front_end/components/ui/landing/traveller.mp4";
import guideVideo from "../../../../front_end/components/ui/landing/guide.mp4";
import serviceVideo from "../../../../front_end/components/ui/landing/service.mp4";
import tripIcon from "../../../../front_end/components/ui/landing/trip.png";
import serviceGuideIcon from "../../../../front_end/components/ui/landing/ServiceandGuide.png";
import journeyIcon from "../../../../front_end/components/ui/landing/journeytrack.png";
import bookingIcon from "../../../../front_end/components/ui/landing/bookingManagement.png";
import documentsIcon from "../../../../front_end/components/ui/landing/travelDocuments.png";
import reviewsIcon from "../../../../front_end/components/ui/landing/reviews.png";
import footerLogo from "../../../../front_end/components/ui/landing/footer-logo.png";
import facebookIcon from "../../../../front_end/components/ui/landing/facebook.png";
import twitterIcon from "../../../../front_end/components/ui/landing/twitter.png";
import instagramIcon from "../../../../front_end/components/ui/landing/instagram.png";
import linkedinIcon from "../../../../front_end/components/ui/landing/linkedin.png";

const features = [[tripIcon, "Trip Planning", "Create custom multi-day itineraries."], [serviceGuideIcon, "Services & Guides", "Choose local services and professionals."], [journeyIcon, "Journey Tracking", "Track your travel progress."], [bookingIcon, "Bookings Management", "Manage bookings and payments easily."], [documentsIcon, "Travel Documents", "Access tickets, invoices, and vouchers."], [reviewsIcon, "Reviews & Ratings", "Share feedback after completing a trip."]];

export default function Landing({ user }) {
  const [activeRole, setActiveRole] = useState("Traveler");
  const roleVideo = { Traveler: travellerVideo, Guide: guideVideo, "Service partner": serviceVideo }[activeRole];
  return <div className="home-page"><Navbar user={user} isPublic={true} /><section className="template-hero"><video className="template-media" autoPlay muted loop playsInline><source src={beachVideo} type="video/mp4" /></video><div className="template-hero-content"><h1>Plan, customize, and travel</h1><p>A platform to plan trips, connect with guides and travel services, and manage your entire travel experience.</p><label className="template-search" aria-label="Search"><span>⌕</span><input placeholder="Search destinations, services, or guides" /></label></div></section><section className="role-template"><video className="role-video-slot" autoPlay muted loop playsInline key={activeRole}><source src={roleVideo} type="video/mp4" /></video><div className="role-tabs">{["Traveler", "Guide", "Service partner"].map((role) => <button type="button" className={activeRole === role ? "active" : ""} onClick={() => setActiveRole(role)} key={role}>{role}</button>)}</div><h2>Discover destinations, connect with trusted<br />services, and travel with confidence.</h2><div className="template-actions"><Link className="template-primary" to="/Auth/login">Start Planning</Link><Link className="template-secondary" to="/Home/partners">Explore Services</Link></div></section><section className="journey-template"><p className="journey-label">● TAILORED EXPERIENCES</p><h2 className="journey-title">Built for every role in the travel journey.</h2><p className="journey-description">Our platform supports administrators, partners, guides, and travelers in one seamless system.</p><div className="stacked-cards"><article className="stack-card admin"><h3>Platform Administrators</h3><p>Control users, services, and bookings from one central dashboard.</p></article><article className="stack-card partner"><h3>Service Partners</h3><p>Manage services, bookings, and performance in one place.</p></article><article className="stack-card traveller"><h3>Travelers</h3><p>Discover destinations, book trusted services, and manage your trips with ease.</p></article><article className="stack-card guide"><h3>Guides</h3><p>Create tours, connect with travelers, and share your local expertise.</p></article></div></section><section className="features-template"><h2>Everything You Need to Travel Smart</h2><p>Powerful features designed to make every aspect of your journey effortless.</p><div className="template-feature-grid">{features.map(([icon, title, description]) => <article className="template-feature-card" key={title}><span><img src={icon} alt="" /></span><h4>{title}</h4><p>{description}</p></article>)}</div></section><TemplateFooter /></div>;
}

export function TemplateFooter() { return <footer className="template-footer"><div className="template-footer-grid"><div><div className="footer-brand-row"><img src={footerLogo} alt="" /><h3>Xploreo</h3></div><p>Your all-in-one travel planning platform connecting travelers, guides, and service partners.</p></div><div className="template-footer-links"><h4>Company</h4><a href="#">About</a><a href="#">Features</a><a href="#">Support</a></div><div className="template-footer-links"><h4>Legal</h4><a href="#">Privacy Policy</a><a href="#">Terms of Service</a></div><div><h4>Contact</h4><p>xploreo123@gmail.com</p><div className="footer-socials">{[[facebookIcon, "Facebook"], [twitterIcon, "Twitter"], [instagramIcon, "Instagram"], [linkedinIcon, "LinkedIn"]].map(([icon, label]) => <img src={icon} alt={label} key={label} />)}</div></div></div><div className="template-footer-bottom">© 2026 Xploreo. All rights reserved.</div></footer>; }
