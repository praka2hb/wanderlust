import { useScroll, motion, useTransform } from "framer-motion";
import { useRef } from "react";
import { Link } from "react-router-dom";
import { NavBar } from "../components/NavBar2";
import { FeatureSection } from "../components/FeatureSection";
import { DestinationGallery } from "../components/DestinationGallery";
import { Footer } from "../components/Footer";

export const Home = () => {
  const isAuthenticated = !!localStorage.getItem('token');
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["0 1", "1 1"]
  });
  const scrollProgress = useTransform(scrollYProgress, [0, 1], [0.86, 1]);
  const opacityProgress = useTransform(scrollYProgress, [0, 1], [0.9, 1]);

  return (
    <div className="relative">
      <NavBar />
      <div className="relative">
        <div>
          <motion.div 
            ref={ref} 
            style={{ scale: scrollProgress, opacity: opacityProgress }} 
            initial={{opacity: 0}} 
            animate={{opacity:1}} 
            exit={{opacity:0}} 
            className="flex justify-center h-screen bg-lime-50"
          >
            <div className="h-screen bg-lime-50 overflow-hidden relative flex w-full">
              <div className="container mx-auto flex justify-center px-20">
                <div className="w-3/4 h-[90vh] flex items-end bg-home-bg bg-cover rounded-lg scroll-p-10 z-10 mt-10">
                  <div>
                    <h4 className="text-4xl font-bold text-white pl-2">
                      <span className="inline bg-zinc-500 bg-opacity-20 w-full">
                        Never Stop Exploring!
                      </span>
                    </h4>
                    <p className="text-lime-300 pl-2 font-serif mt-3 text-lg pb-2">
                      <span className="inline text-xl bg-zinc-600 bg-opacity-70">
                        The World is Your Canvas, Paint It With Experiences.
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-lime-50 h-screen w-full">
              <div className="flex justify-center flex-col items-center h-full">
                <div className="text-3xl font-bold flex bg-gradient-to-b bg-clip-text text-transparent from-lime-500 to-lime-800">
                  Welcome to WanderLust
                </div>
                <p className="mt-4 text-lg italic text-lime-700 text-center max-w-xl">
                  "Travel is more than the seeing of sights; it is a change that goes on, deep and permanent, in the ideas of living." <br />
                  <span className="text-base text-slate-500">— Miriam Beard</span>
                </p>
                <Link to={isAuthenticated ? "/dashboard":"/login"} className="text-white mt-6 text-base bg-lime-500 shadow-lg w-[18vh] shadow-lime-200/50 p-[10px] text-center rounded my-1 hover:bg-lime-400 transition-all duration-300">
                  Get Started 
                </Link>
              </div>
            </div>
          </motion.div>
          <div>
            <motion.div   
              ref={ref} 
              style={{ scale: scrollProgress, opacity: opacityProgress }} 
              className="flex justify-center h-screen p-10 bg-lime-50"
            >
              <div className="bg-lime-50 h-screen w-full">
                <div className="text-xl font-bold text-slate-600 flex justify-center items-center h-full">
                  WanderLust, where every adventure transforms into a captivating story! Whether you're exploring hidden gems, chasing sunsets, or savoring local flavors, WanderLust is your ultimate travel companion. Share your journeys, relive unforgettable moments, and inspire others to embark on their own adventures. Start writing your story, one destination at a time, and let WanderLust bring your travels to life!
                </div>
              </div>
              <div className="h-screen bg-lime-50 overflow-hidden relative flex w-full">
                <div className="container mx-auto flex justify-center px-20">
                  <div className="w-3/4 h-[87vh] flex items-end bg-home-bg-2 bg-cover rounded-lg scroll-p-10 z-10 mt-16">
                    <div>
                      <h4 className="text-4xl font-bold text-white pl-2">
                        <span className="inline bg-zinc-500 bg-opacity-10 w-full">
                          Capture Your <br /> Journeys
                        </span>
                      </h4>
                      <p className="text-lime-300 pl-2 font-serif mt-3 text-lg pb-2">
                        <span className="inline text-xl bg-zinc-500 bg-opacity-40">
                          Record your thoughts and experiences as you Travel The World.
                        </span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
      
      <FeatureSection />
      <DestinationGallery />
      <Footer />
    </div>
  );
};