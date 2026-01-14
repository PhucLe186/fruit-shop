import { Outlet } from "react-router-dom";
import Loader from "../components/Loader";
import Header from "../components/Header";
import MobileFixMenuStart from "../components/MobileFixMenuStart";
import Footer from "../components/Footer";

export default function UserLayout({ children }) {
  return (
    <div>
      <Loader />
      <Header />
      <MobileFixMenuStart />
      <Outlet />
      <Footer />
    </div>
  );
}
