import { Outlet } from 'react-router-dom';
import Navbar from '../components/public/Navbar.jsx';
import Footer from '../components/public/Footer.jsx';
import LenisProvider from '../components/public/LenisProvider.jsx';
import BackToTop from '../components/ui/BackToTop.jsx';

export default function PublicLayout() {
  return (
    <LenisProvider>
      <div className="flex min-h-screen flex-col">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-white focus:px-4 focus:py-2"
        >
          Skip to content
        </a>
        <Navbar />
        <main id="main" className="flex-1">
          <Outlet />
        </main>
        <Footer />
        <BackToTop />
      </div>
    </LenisProvider>
  );
}
