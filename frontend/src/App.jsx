import { useState } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import "./App.css";
import ProtectedRoute from "./routes/ProtectedRoutes";
import Login from "./pages/Auth/login";
import Register from "./pages/Auth/register";
import Landing from "./pages/Home/landing";
import Partners from "./pages/Home/partners";
import Tours from "./pages/Home/tours";
import Support from "./pages/Home/support";
import Bookings from "./pages/Hotel/bookings";
import GuideDashboard from "./pages/Guide/dashboard";
import ExperienceDashboard from "./pages/Experience/dashboard";

const guest = { username: "Guest", role: "default" };

function savedUser() {
  try { return JSON.parse(localStorage.getItem("xploreoUser")) || guest; }
  catch { return guest; }
}

function App() {
  const [user, setUser] = useState(savedUser);
  const authenticate = (account) => setUser(account);

  return <BrowserRouter><Routes>
    <Route path="/" element={<Landing user={user} />} />
    <Route path="/Home/partners" element={<Partners user={user} />} />
    <Route path="/Home/tours" element={<Tours user={user} />} />
    <Route path="/Home/support" element={<Support user={user} />} />
    <Route path="/Auth/login" element={<Login user={user} onAuthenticated={authenticate} />} />
    <Route path="/Auth/register" element={<Register user={user} onAuthenticated={authenticate} />} />
    <Route element={<ProtectedRoute allowedRoles={["guide"]} user={user} />}><Route path="/Guide/dashboard" element={<GuideDashboard user={user} />} /></Route>
    <Route element={<ProtectedRoute allowedRoles={["hotel"]} user={user} />}><Route path="/Hotel/bookings" element={<Bookings user={user} />} /></Route>
    <Route element={<ProtectedRoute allowedRoles={["experience"]} user={user} />}><Route path="/Experience/dashboard" element={<ExperienceDashboard user={user} />} /></Route>
  </Routes></BrowserRouter>;
}

export default App;
