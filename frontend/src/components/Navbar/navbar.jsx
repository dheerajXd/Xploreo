import { useState } from "react";
import { Link, NavLink, useNavigate, useLocation, useInRouterContext } from "react-router-dom";
import logo from "../../assets/logo.png";
import { useAuth } from "../../context/AuthContext.jsx";
import "./navbar.css";

const publicLinks = [
  ["Home", "/"],
  ["Partners", "/Home/partners"],
  ["Tours", "/Home/tours"],
  ["Support", "/Home/support"],
];

const portalLabels = {
  superadmin: "SuperAdmin Dashboard",
  nontechadmin: "Regional Dashboard",
  techadmin: "TechAdmin Dashboard",
  guide: "Guide Portal",
  hotel: "Hotel Portal",
  experience: "Experience Portal",
  traveller: "My Trips",
};

const portalDestinations = {
  superadmin: "/superadmin/dashboard",
  nontechadmin: "/nta/dashboard",
  techadmin: "/tech-admin/dashboard",
  guide: "/guide/dashboard",
  hotel: "/hotel/dashboard",
  experience: "/experience/home",
  traveller: "/Traveller/dashboard",
};

export default function Navbar({ user: propUser, isPublic = false } = {}) {
  const auth = useAuth();
  const navigate = useNavigate();
  const inRouter = useInRouterContext();
  const location = inRouter ? useLocation() : null;
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const user = propUser || auth?.user || { role: "default" };
  const role = (user?.role || "default").toLowerCase();

  const pathname = location?.pathname || "";
  const isPublicRoute =
    isPublic ||
    pathname === "/" ||
    pathname === "/Home/landing" ||
    pathname.startsWith("/Home/") ||
    pathname.startsWith("/Auth/");

  const signedIn = !isPublicRoute && role && role !== "default";

  const displayName = user?.name ? user.name.split(" ")[0] : (user?.username || "Traveller");
  const initial = (user?.name || user?.username || "T").charAt(0).toUpperCase();

  const handleLogout = () => {
    if (typeof localStorage !== "undefined") {
      localStorage.removeItem("xploreoUser");
      localStorage.removeItem("currentUser");
    }
    auth?.logout();
    setDropdownOpen(false);
    navigate("/Auth/login");
  };

  if (!isPublicRoute && role === "traveller") {
    return (
      <header className="site-header traveller-header">
        <nav className="navbar navbar-traveler" aria-label="Traveller navigation">
          <Link to="/" className="navbar-logo" aria-label="Xploreo home">
            <img src={logo} alt="Logo" />
            <div className="navbar-title navbar-title-pacifico">Xploreo</div>
          </Link>
          <div className="navbar-links">
            <NavLink to="/Traveller/dashboard" className="navbar-link">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
              Dashboard
            </NavLink>
            <NavLink to="/Traveller/bookings" className="navbar-link">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>
              Bookings
            </NavLink>
            <NavLink to="/Traveller/trips" className="navbar-link">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
              Trips
            </NavLink>
          </div>
          <div className="navbar-user-section">
            <span className="navbar-user-greeting">Hello, {displayName} 👋</span>
            <button
              type="button"
              className="navbar-avatar-btn"
              onClick={() => setDropdownOpen(!dropdownOpen)}
              aria-label="User profile menu"
            >
              <span className="navbar-avatar-initial">{initial}</span>
            </button>
            {dropdownOpen && (
              <div className="navbar-profile-dropdown">
                <div className="dropdown-header">
                  <p className="dropdown-name">{user?.name || user?.username}</p>
                  <p className="dropdown-email">{user?.email || user?.userId || 'Traveller'}</p>
                </div>
                <hr className="dropdown-divider" />
                <Link to="/Traveller/tickets" className="dropdown-item" onClick={() => setDropdownOpen(false)}>
                  Support Tickets
                </Link>
                <Link to="/Traveller/reviews" className="dropdown-item" onClick={() => setDropdownOpen(false)}>
                  My Reviews
                </Link>
                <hr className="dropdown-divider" />
                <button type="button" className="dropdown-item dropdown-logout" onClick={handleLogout}>
                  Log Out
                </button>
              </div>
            )}
          </div>
        </nav>
      </header>
    );
  }

  const portalPath = portalDestinations[role] || "/";
  const portalLabel = portalLabels[role] || "Dashboard";

  return (
    <header className="site-header">
      <nav className="navbar" aria-label="Main navigation">
        <Link to="/" className="navbar-logo" aria-label="Xploreo home">
          <img src={logo} alt="" />
          <span className="navbar-title">Xploreo</span>
        </Link>
        <div className="navbar-links">
          {publicLinks.map(([label, to]) => (
            <NavLink key={to} to={to} end={to === "/"} className="navbar-link">
              {label}
            </NavLink>
          ))}
          {signedIn && (
            <NavLink to={portalPath} className="navbar-link" style={{ color: "#0f766e", fontWeight: 700 }}>
              {portalLabel}
            </NavLink>
          )}
        </div>
        {!signedIn ? (
          <div className="navbar-right">
            <Link to="/Auth/login" className="navbar-login">Log in</Link>
            <Link to="/Auth/register" className="navbar-btn">Get started</Link>
          </div>
        ) : (
          <div className="navbar-right" style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "12px" }}>
            <span className="navbar-user" style={{ margin: 0 }}>
              {user?.name || user?.username || "Account"}
            </span>
            <button
              type="button"
              onClick={handleLogout}
              className="navbar-logout-btn"
              style={{
                background: "transparent",
                border: "1px solid rgba(15,76,76,0.2)",
                borderRadius: "8px",
                padding: "6px 12px",
                fontSize: "0.82rem",
                fontWeight: 600,
                color: "#547074",
                cursor: "pointer",
              }}
            >
              Log out
            </button>
          </div>
        )}
      </nav>
    </header>
  );
}
