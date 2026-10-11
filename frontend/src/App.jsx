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
import Login from "./pages/Auth/login";

function App() {

  const user = {
    userid : "EXP001",
    username : "EXP001",
    role: "default"
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing user = {user}/> } />
        <Route path="/Home/partners" element={<Patners user = {user}/> } />
        <Route path="/Home/tours" element={<Tours user = {user}/> } />
        <Route path="/Home/support" element={<Support user = {user}/> } />

        <Route path="/Auth/login" element={<Login user = {user}/>}/>

        <Route element={<ProtectedRoute allowedRoles={["guide"]} user={user} />}>

          <Route path="/Guide/dashboard" element={<guideDashboard user = {user} />} />

        </Route>
        
        <Route element={<ProtectedRoute allowedRoles={["hotel"]} user={user}/>}>

          <Route path="/Hotel/bookings" element={<Bookings user={user}/>}/>

        </Route>

        <Route element={<ProtectedRoute allowedRoles={["experience"]} user={user} />}>

          <Route path="/Experience/dashboard" element={<ExperienceDashboard user={user} />} />

        </Route>

        

      </Routes>
    </BrowserRouter>
  );
}

export default App;