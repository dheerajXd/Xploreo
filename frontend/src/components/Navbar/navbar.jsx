import { Link, NavLink, useNavigate } from "react-router-dom";
import logo from "../../assets/logo.png";
import { useAuth } from "../../context/AuthContext.jsx";
import "./navbar.css";

const publicLinks = [["Home", "/"], ["Partners", "/Home/partners"], ["Tours", "/Home/tours"], ["Support", "/Home/support"]];

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
  traveller: "/",
};

export default function Navbar({ user: propUser }) {
  const auth = useAuth();
  const navigate = useNavigate();
  const user = propUser || auth?.user || { role: "default" };
  const signedIn = user?.role && user.role !== "default";
  const portalPath = portalDestinations[user?.role] || "/";
  const portalLabel = portalLabels[user?.role] || "Dashboard";

  const handleLogout = () => {
    auth?.logout();
    navigate("/");
  };

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
          {signedIn && user.role !== "traveller" && (
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
