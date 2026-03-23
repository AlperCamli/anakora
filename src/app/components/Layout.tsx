import { Outlet } from "react-router";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { MobileStickyCTA } from "./MobileStickyCTA";
import { SiteDataProvider } from "../context/SiteDataContext";

export function Layout() {
  return (
    <SiteDataProvider>
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1">
          <Outlet />
        </main>
        <Footer />
        <MobileStickyCTA />
      </div>
    </SiteDataProvider>
  );
}
