import { Routes, Route } from "react-router";
import SiteLayout from "./layouts/SiteLayout.jsx";
import Home from "./pages/Home.jsx";
import Architecture from "./pages/Architecture.jsx";
import Simulation from "./pages/Simulation.jsx";
import Innovation from "./pages/Innovation.jsx";
import About from "./pages/About.jsx";
import Contact from "./pages/Contact.jsx";
import AdminLogin from "./pages/AdminLogin.jsx";
import AdminDashboard from "./pages/AdminDashboard.jsx";
import GitHub from "./pages/GitHub.jsx";
import LoadTester from "./pages/LoadTester.jsx";
import CarrierReadiness from "./pages/CarrierReadiness.jsx";
import MeshC2Dashboard from "./pages/MeshC2Dashboard.jsx";
import NotFound from "./pages/NotFound.jsx";

export default function App() {
  return (
    <Routes>
      <Route element={<SiteLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/architecture" element={<Architecture />} />
        <Route path="/simulation" element={<Simulation />} />
        <Route path="/innovation" element={<Innovation />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/github" element={<GitHub />} />
        <Route path="/loadtest" element={<LoadTester />} />
        <Route path="/carrier-readiness" element={<CarrierReadiness />} />
        <Route path="/mesh-c2" element={<MeshC2Dashboard />} />
      </Route>
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/admin" element={<AdminDashboard />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
