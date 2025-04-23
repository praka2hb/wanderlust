import { useScroll, motion, useTransform } from "framer-motion";
import { useRef } from "react";
import { Link } from "react-router-dom";
import { NavBar } from "../components/NavBar2";
import { FeatureSection } from "../components/FeatureSection";
import { DestinationGallery } from "../components/DestinationGallery";
import { Footer } from "../components/Footer";

// Import images to ensure they're bundled by Vite
import homeBg from "../assets/757572.jpg";
import homeBg2 from "../assets/page2.jpg";

export const Home = () => {
  const isAuthenticated = !!localStorage.getItem("token");
  const heroRef = useRef<HTMLDivElement>(null);
  const aboutRef = useRef<HTMLDivElement>(null);

  // Animation for hero section
  const { scrollYProgress: heroY } = useScroll({
    target: heroRef,
    offset: ["0 1", "1 1"],
  });
  const heroScale = useTransform(heroY, [0, 1], [0.94, 1]);
  const heroOpacity = useTransform(heroY, [0, 1], [0.7, 1]);

  // Animation for about section
  const { scrollYProgress: aboutY } = useScroll({
    target: aboutRef,
    offset: ["0 1", "1 1"],
  });
  const aboutScale = useTransform(aboutY, [0, 1], [0.94, 1]);
  const aboutOpacity = useTransform(aboutY, [0, 1], [0.7, 1]);

  return (
    <div className="relative">
      <NavBar />

      {/* Hero Section - Image on LEFT, text on RIGHT */}
      <motion.div
        ref={heroRef}
        style={{ scale: heroScale, opacity: heroOpacity }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="flex flex-col md:flex-row min-h-screen bg-gradient-to-b from-lime-50 to-lime-100"
      >
        {/* Hero Image - Full width on mobile, half on desktop */}
        <div className="h-[55vh] md:h-screen md:w-1/2 relative p-4 md:p-8 flex items-center justify-center">
          <div
            className="w-full h-full rounded-xl overflow-hidden shadow-2xl relative"
            style={{ maxHeight: "85vh" }}
          >
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: `url(${homeBg})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end">
              <div className="p-4 md:p-6 w-full">
                <h4 className="text-2xl md:text-4xl lg:text-5xl font-bold text-white">
                  Never Stop Exploring!
                </h4>
                <p className="text-lime-300 font-serif mt-2 md:mt-3 text-base md:text-xl">
                  The World is Your Canvas, Paint It With Experiences.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Welcome Text - Full width on mobile, half on desktop */}
        <div className="h-[45vh] md:h-screen md:w-1/2 flex items-center justify-center">
          <div className="flex flex-col items-center justify-center p-6 md:p-10 max-w-md">
            <div className="text-2xl md:text-3xl lg:text-4xl font-bold bg-gradient-to-br bg-clip-text text-transparent from-lime-600 to-lime-900 whitespace-nowrap">
              Welcome to WanderLust
            </div>
            <p className="mt-4 md:mt-6 text-sm md:text-lg italic text-lime-700 text-center">
              "Travel is more than the seeing of sights; it is a change that goes
              on, deep and permanent, in the ideas of living."
              <br />
              <span className="text-xs md:text-base text-slate-600 block mt-2">— Miriam Beard</span>
            </p>
            <Link
              to={isAuthenticated ? "/dashboard" : "/login"}
              className="mt-6 md:mt-8 bg-gradient-to-r from-lime-500 to-lime-600 text-white font-medium py-2.5 px-6 rounded-lg shadow-lg hover:from-lime-600 hover:to-lime-700 transition-all duration-300 text-sm md:text-base"
            >
              Get Started
            </Link>
          </div>
        </div>
      </motion.div>

      {/* About Section - Text on LEFT, image on RIGHT (opposite of first section) */}
      <motion.div
        ref={aboutRef}
        style={{ scale: aboutScale, opacity: aboutOpacity }}
        className="flex flex-col md:flex-row min-h-screen bg-gradient-to-b from-lime-100 to-lime-50"
      >
        {/* About Text - Full width on mobile, half on desktop */}
        <div className="h-[45vh] md:h-screen md:w-1/2 flex items-center justify-center">
          <div className="p-6 md:p-12 text-center max-w-md">
            <h3 className="text-xl md:text-2xl lg:text-3xl font-bold text-lime-800 mb-4 md:mb-6">
              Your Journey, Your Story
            </h3>
            <p className="text-base md:text-lg text-slate-700">
              WanderLust, where every adventure transforms into a captivating
              story! Whether you're exploring hidden gems, chasing sunsets, or
              savoring local flavors, WanderLust is your ultimate travel
              companion. Share your journeys, relive unforgettable moments, and
              inspire others to embark on their own adventures.
            </p>
          </div>
        </div>

        {/* Second Image - Full width on mobile, half on desktop */}
        <div className="h-[55vh] md:h-screen md:w-1/2 relative p-4 md:p-8 flex items-center justify-center">
          <div
            className="w-full h-full rounded-xl overflow-hidden shadow-2xl relative"
            style={{ maxHeight: "85vh" }}
          >
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: `url(${homeBg2})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end">
              <div className="p-4 md:p-6 w-full">
                <h4 className="text-2xl md:text-4xl lg:text-5xl font-bold text-white">
                  Capture Your <br className="hidden md:block" /> Journeys
                </h4>
                <p className="text-lime-300 font-serif mt-2 md:mt-3 text-base md:text-xl">
                  Record your thoughts and experiences as you Travel The World.
                </p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      <FeatureSection />
      <DestinationGallery />
      <Footer />
    </div>
  );
};