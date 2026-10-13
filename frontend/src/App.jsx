import { BrowserRouter, Route, Routes } from "react-router-dom";
import "./App.css";
import { AuthProvider, useAuth } from "./context/AuthContext.jsx";
import ProtectedRoute from "./routes/ProtectedRoutes";
import Login from "./pages/Auth/login";
import Register from "./pages/Auth/register";
import Landing from "./pages/Home/landing";
import Partners from "./pages/Home/partners";
import Tours from "./pages/Home/tours";
import Support from "./pages/Home/support";
import { guidePortal } from "./routes/guide.routes.jsx";
import { experiencePortal } from "./routes/experience.routes.jsx";
import { hotelPortal } from "./routes/hotel.routes.jsx";
import { travellerDetailRoutes } from "./routes/travellerDetail.routes.jsx";

function AppRoutes() {
  const { user, authenticate } = useAuth();

  return (
    <Routes>
      <Route path="/" element={<Landing user={user} />} />
      <Route path="/Home/partners" element={<Partners user={user} />} />
      <Route path="/Home/tours" element={<Tours user={user} />} />
      <Route path="/Home/support" element={<Support user={user} />} />
      <Route path="/Auth/login" element={<Login user={user} onAuthenticated={authenticate} />} />
      <Route path="/Auth/register" element={<Register user={user} onAuthenticated={authenticate} />} />
      <Route element={<ProtectedRoute allowedRoles={["guide"]} user={user} />}>
        <Route path={guidePortal.basePath} element={<guidePortal.layout />}>
          {guidePortal.routes.map((route) => (
            <Route key={route.path ?? "index"} {...route} />
          ))}
        </Route>
      </Route>
      <Route element={<ProtectedRoute allowedRoles={["hotel"]} user={user} />}>
        <Route path={hotelPortal.basePath} element={<hotelPortal.layout />}>
          {hotelPortal.routes.map((route) => (
            <Route key={route.path ?? "index"} {...route} />
          ))}
        </Route>
      </Route>
      <Route element={<ProtectedRoute allowedRoles={["experience"]} user={user} />}>
        <Route path={experiencePortal.basePath} element={<experiencePortal.layout />}>
          {experiencePortal.routes.map((route) => (
            <Route key={route.path ?? "index"} {...route} />
          ))}
        </Route>
      </Route>
      {travellerDetailRoutes.map((route) => (
        <Route key={route.path} {...route} />
      ))}
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
