import { Outlet } from "react-router";
import Nav from "../components/Nav.jsx";
import Footer from "../components/Footer.jsx";

export default function SiteLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-[#050a0f]">
      <Nav />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
