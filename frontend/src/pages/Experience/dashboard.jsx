import Navbar from "../../components/Navbar/navbar"
import Statcard from "../../components/StatCards/statcard"

import "./Experience.css"

export default function ExperienceDashboard(user) {
    return (
        <div className = "page-container">
            <Navbar user={user} />
            <div className="dashboard-header">
                <p class="experience-eyebrow">Experience Dashboard</p>
                <h1 class="page-title">Home</h1>
                <p class="page-subtitle">Overview of your sessions, occupancy, and booking momentum.</p>
            </div>
            <div className = "stat-cards-container">
                <Statcard title="Total Bookings" value="100" subtitle="Bookings made by customers" icon={<i className="fa-solid fa-book"></i>} color="#4f5f94" />
                <Statcard title="Upcoming Sessions" value="25" subtitle="Sessions scheduled for the next 7 days" icon={<i className="fa-solid fa-calendar-days"></i>} color="#4f5f94" />
                <Statcard title="Total Bookings" value="100" subtitle="Bookings made by customers" icon={<i className="fa-solid fa-book"></i>} color="#4f5f94" />
                <Statcard title="Average Rating" value="4.5" subtitle="Average rating from customers" icon={<i className="fa-solid fa-star"></i>} color="#4f5f94" />
            </div>
        </div>
        )
}