import { Link } from "react-router-dom";
import logo from "../../assets/logo.png";
import "./navbar.css";

export default function Navbar() {

    const user = {
        username : "Default User",
        role : "guide"
    }

    return (
        <nav className = "navbar" >
           <div className = "navbar-logo" >
            <img src = {logo} alt = "Logo" />
            <div className = "navbar-title" > Xploreo </div>
            </div>
            <div className = "navbar-links">
                    {user.role === "default" && (
                        <>
                            <Link to = "/" className = "navbar-link">Home</Link>
                            <Link to = "/Home/partners" className = "navbar-link">Partners</Link>
                            <Link to = "/Home/tours" className = "navbar-link">Tours</Link>
                            <Link to = "/Home/support" className = "navbar-link">Support</Link>
                        </>
                    )}
                    {user.role === "traveller" && (
                        <>
                            <Link to = "/Traveller/dashboard" className = "navbar-link">Dashboard</Link>
                            <Link to = "/Traveller/wishlist" className = "navbar-link">Wishlist</Link>
                            <Link to = "/Traveller/mytrips" className = "navbar-link">My Trips</Link>
                        </>)}
                    {user.role === "guide" && (
                        <>
                            <Link to = "Guide/dashboard" className = "navbar-link">Dashboard</Link>
                            <Link to = "Guide/trips" className = "navbar-link">Trips</Link>
                            <Link to = "Guide/schedule" className = "navbar-link">Schedule</Link>
                            <Link to = "Guide/earnings" className = "navbar-link">Earnings</Link>
                            <Link to = "Guide/reviews.jsx" className = "navbar-link">Reviews</Link>   
                        </>
                    )}
            </div>
           
        </nav>
    )
}