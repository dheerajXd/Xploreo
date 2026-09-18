import { Link } from "react-router-dom";
import logo from "../../assets/logo.png";
import "./navbar.css";

export default function Navbar() {

    const user = {
        username : "Default User",
        role : "default"
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
            </div>
           
        </nav>
    )
}