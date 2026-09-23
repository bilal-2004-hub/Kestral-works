import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Hero from '../../components/public/Hero.jsx';
import Services from '../../components/public/Services.jsx';
import VideoSection from '../../components/public/VideoSection.jsx';
import Portfolio from '../../components/public/Portfolio.jsx';
import Process from '../../components/public/Process.jsx';
import About from '../../components/public/About.jsx';
import Testimonials from '../../components/public/Testimonials.jsx';
import FAQ from '../../components/public/FAQ.jsx';
import ContactForm from '../../components/public/ContactForm.jsx';

export default function Home() {
  const { hash } = useLocation();

  // Anchor links arriving from another route need a smooth scroll
  useEffect(() => {
    if (!hash) return;
    const timer = setTimeout(() => {
      const el = document.querySelector(hash);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }, 100);
    return () => clearTimeout(timer);
  }, [hash]);

  return (
    <>
      <Hero />
      <Services />
      <VideoSection />
      <Portfolio />
      <Process />
      <About />
      <Testimonials />
      <FAQ />
      <ContactForm />
    </>
  );
}
