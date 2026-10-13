import { Link, NavLink } from "react-router-dom";
import logo from "../../assets/logo.png";
import "./navbar.css";

const publicLinks = [["Home", "/"], ["Partners", "/Home/partners"], ["Tours", "/Home/tours"], ["Support", "/Home/support"]];
export default function Navbar({ user = { role: "default" } }) {
  const signedIn = user?.role && user.role !== "default";
  return <header className="site-header"><nav className="navbar" aria-label="Main navigation">
    <Link to="/" className="navbar-logo" aria-label="Xploreo home"><img src={logo} alt="" /><span className="navbar-title">Xploreo</span></Link>
    <div className="navbar-links">{publicLinks.map(([label, to]) => <NavLink key={to} to={to} end={to === "/"} className="navbar-link">{label}</NavLink>)}</div>
    {!signedIn ? <div className="navbar-right"><Link to="/Auth/login" className="navbar-login">Log in</Link><Link to="/Auth/register" className="navbar-btn">Get started</Link></div> : <div className="navbar-user">{user?.name || user?.username || "Account"}</div>}
  </nav></header>;
}
