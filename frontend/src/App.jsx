import { BrowserRouter, Routes, Route } from "react-router-dom";

import "./App.css";

import ProtectedRoute from "./routes/ProtectedRoutes";

import Landing from "./pages/Home/landing";
import Patners from "./pages/Home/partners";
import Tours from "./pages/Home/tours";
import Support from "./pages/Home/support";
import Bookings from "./pages/Hotel/bookings";
import guideDashboard from "./pages/Guide/dashboard";
import ExperienceDashboard from "./pages/Experience/dashboard";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/Home/partners" element={<Patners />} />
        <Route path="/Home/tours" element={<Tours />} />
        <Route path="/Home/support" element={<Support />} />

        <Route path="/Guide/dashboard" element={<guideDashboard />} />

        <Route path="/Hotel/bookings" element={<Bookings />}/>

        <Route element={<ProtectedRoute allowedRoles={["experience"]} />}>

          <Route path="/Experience/dashboard" element={<ExperienceDashboard />} />


        </Route>

        

      </Routes>
    </BrowserRouter>
  );
}

export default App;