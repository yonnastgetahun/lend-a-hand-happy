import React, { useEffect } from 'react';
import { motion, useAnimation } from 'framer-motion';
import { ArrowRight, Star, Heart, Shield, Layers } from 'lucide-react';

const colors = {
  olive: '#8B9D77',
  terracotta: '#C17C5F',
  earth: '#5C4B3A',
  cream: '#FAF8F5',
};

// Helper for randomizing floating animations
const createFloatAnimation = (yRange: number, xRange: number, duration: number, delay: number = 0) => ({
  animate: {
    y: [0, -yRange, 0],
    x: [0, xRange, 0],
  },
  transition: {
    duration,
    repeat: Infinity,
    ease: "easeInOut" as const,
    delay,
  }
});

const createPulseAnimation = (opacityRange: number[], duration: number, delay: number = 0) => ({
  animate: { opacity: opacityRange },
  transition: {
    duration,
    repeat: Infinity,
    ease: "easeInOut" as const,
    delay,
  }
});

function AnimatedLogoGraphics() {
  const groupControls = useAnimation();
  const leftControls = useAnimation();
  const rightControls = useAnimation();
  const centerControls = useAnimation();

  useEffect(() => {
    let isMounted = true;
    const runSequence = async () => {
      if (!isMounted) return;

      // 1. Initial Reset State
      groupControls.set(() => ({ rotate: -720 }));
      leftControls.set(i => ({ cx: -20, opacity: 0, r: 20 * (1 - i * 0.15) }));
      rightControls.set(i => ({ cx: 340, opacity: 0, r: 20 * (1 - i * 0.15) }));
      centerControls.set({ rx: 0, ry: 0, opacity: 0 });

      // Wait a brief moment before starting
      await new Promise(r => setTimeout(r, 400));
      if (!isMounted) return;

      // 2. The Celestial Spiral In with Trails
      groupControls.start(i => ({ rotate: 0, transition: { duration: 4.5, ease: "easeOut", delay: i * 0.12 } }));
      leftControls.start(i => ({
        cx: 148,
        opacity: i === 0 ? 0.9 : 0.4 - i * 0.08,
        transition: { duration: 4.5, ease: "easeOut", delay: i * 0.12 }
      }));
      rightControls.start(i => ({
        cx: 172,
        opacity: i === 0 ? 0.9 : 0.4 - i * 0.08,
        transition: { duration: 4.5, ease: "easeOut", delay: i * 0.12 }
      }));

      await new Promise(r => setTimeout(r, 4500));
      if (!isMounted) return;

      // 3. The Impact & Stick
      leftControls.start(i => {
        if (i === 0) return { cx: [148, 150, 148], r: [20, 18, 20], transition: { duration: 0.8, ease: "easeOut" } };
        return { opacity: 0, transition: { duration: 0.4, ease: "easeOut" } };
      });
      rightControls.start(i => {
        if (i === 0) return { cx: [172, 170, 172], r: [20, 18, 20], transition: { duration: 0.8, ease: "easeOut" } };
        return { opacity: 0, transition: { duration: 0.4, ease: "easeOut" } };
      });

      // Ellipse blooms as they collide
      centerControls.start({
        rx: [0, 10, 7.5],
        ry: [0, 14, 10.5],
        opacity: [0, 0.9, 0.9],
        transition: { duration: 0.8, ease: "easeOut" }
      });

      await new Promise(r => setTimeout(r, 800));
      if (!isMounted) return;

      // 4. Infinite Gentle Breathing Connection
      leftControls.start(i => {
        if (i === 0) return { cx: [148, 147, 148], r: [20, 20.5, 20], transition: { duration: 6, repeat: Infinity, ease: "easeInOut" } };
        return {};
      });
      rightControls.start(i => {
        if (i === 0) return { cx: [172, 173, 172], r: [20, 20.5, 20], transition: { duration: 6, repeat: Infinity, ease: "easeInOut" } };
        return {};
      });
      centerControls.start({
        rx: [7.5, 8.5, 7.5],
        ry: [10.5, 12, 10.5],
        transition: { duration: 6, repeat: Infinity, ease: "easeInOut" }
      });
    };

    runSequence();

    return () => {
      isMounted = false;
    };
  }, [groupControls, leftControls, rightControls, centerControls]);

  return (
    <div className="absolute inset-0 w-full h-full">
      <motion.svg
        viewBox="0 0 320 160"
        preserveAspectRatio="xMidYMid slice"
        className="w-full h-full"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, ease: "easeOut" }}
      >
        {/* Distant Layer (Tiny, very low opacity, slow float) */}
        <motion.g {...createFloatAnimation(2, 2, 8, 0)}>
          <motion.circle cx="30" cy="40" r="0.8" fill={colors.terracotta} opacity="0.3" {...createPulseAnimation([0.1, 0.4, 0.1], 4)} />
          <motion.circle cx="120" cy="20" r="0.8" fill={colors.olive} opacity="0.2" />
          <motion.circle cx="250" cy="30" r="1.2" fill={colors.earth} opacity="0.3" {...createPulseAnimation([0.2, 0.6, 0.2], 5, 1)} />
          <motion.circle cx="290" cy="110" r="0.8" fill={colors.terracotta} opacity="0.2" />
          <motion.circle cx="80" cy="130" r="0.8" fill={colors.olive} opacity="0.2" />
          <motion.circle cx="160" cy="150" r="1.0" fill={colors.earth} opacity="0.2" />
        </motion.g>

        {/* Mid Layer (Medium, normal opacity, medium float) */}
        <motion.g {...createFloatAnimation(4, -3, 6, 0.5)}>
          <motion.circle cx="60" cy="50" r="2" fill={colors.olive} opacity="0.5" />
          <motion.circle cx="200" cy="40" r="1.5" fill={colors.terracotta} opacity="0.6" {...createPulseAnimation([0.4, 0.8, 0.4], 4, 1.5)} />
          <motion.circle cx="280" cy="80" r="2" fill={colors.olive} opacity="0.4" />
          <motion.circle cx="100" cy="140" r="1.8" fill={colors.terracotta} opacity="0.6" />
          <motion.circle cx="220" cy="130" r="2.5" fill={colors.olive} opacity="0.5" {...createPulseAnimation([0.3, 0.7, 0.3], 5, 2.5)} />
          <motion.circle cx="40" cy="110" r="2.2" fill={colors.earth} opacity="0.5" />
        </motion.g>

        {/* ANIMATED LOGO FIGURES WITH TRAILS */}
        {[4, 3, 2, 1, 0].map((i) => (
          <motion.g
            key={`group-${i}`}
            custom={i}
            animate={groupControls}
            style={{ transformOrigin: "160px 80px" }}
          >
            {/* Left Circle - Olive */}
            <motion.circle
              custom={i}
              cy="80" fill={colors.olive}
              animate={leftControls}
            />

            {/* Right Circle - Terracotta */}
            <motion.circle
              custom={i}
              cy="80" fill={colors.terracotta}
              animate={rightControls}
            />
          </motion.g>
        ))}

        {/* Center Ellipse - Earth */}
        <motion.ellipse
          cx="160" cy="80" fill={colors.earth}
          animate={centerControls}
        />

        {/* Near Foreground Layer (Large dots, fast/wide float for parallax) */}
        <motion.g {...createFloatAnimation(8, 6, 12, 0)}>
          <motion.circle cx="40" cy="90" r="4.5" fill={colors.terracotta} opacity="0.4" />
          <motion.circle cx="260" cy="30" r="5" fill={colors.olive} opacity="0.3" {...createPulseAnimation([0.2, 0.5, 0.2], 6, 0.5)} />
          <motion.circle cx="180" cy="140" r="4" fill={colors.earth} opacity="0.4" />
          <motion.circle cx="300" cy="130" r="4.5" fill={colors.terracotta} opacity="0.3" />
          <motion.circle cx="90" cy="20" r="3.5" fill={colors.olive} opacity="0.4" />
        </motion.g>
      </motion.svg>
    </div>
  );
}

const Hero = () => {
  return (
    <section className="relative w-full min-h-[90vh] lg:min-h-[700px] flex items-center justify-center overflow-hidden bg-[#FFFDF8]">
      {/* Subtle Grid background */}
      <div className="absolute inset-0 opacity-[0.03] z-0" style={{ backgroundImage: 'radial-gradient(#5C4B3A 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>

      {/* Full-bleed Animated Background */}
      <div className="absolute inset-0 z-10 overflow-hidden pointer-events-none">
        <AnimatedLogoGraphics />
      </div>

      {/* Text Content Overlay */}
      <div className="relative z-20 flex flex-col items-center text-center max-w-4xl mx-auto px-6 py-20 pointer-events-none">

        {/* Glassmorphism Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 2.0, delay: 3.5 }}
          className="absolute inset-0 bg-[#FFFDF8]/40 backdrop-blur-md rounded-[120px] -z-10 blur-2xl transform scale-125"
        />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 4.2, ease: "easeOut" }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#E5ECE0]/90 backdrop-blur-sm text-[#4A5A3B] text-sm font-medium mb-8 shadow-sm border border-[#8B9D77]/20 pointer-events-auto"
        >
          <Star size={14} className="fill-current" />
          <span>Lend freely. Remember kindly.</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 4.4, ease: "easeOut" }}
          className="text-4xl sm:text-5xl lg:text-7xl font-bold tracking-tight text-[#2A2420] mb-8 leading-[1.1] drop-shadow-sm"
        >
          Lending makes the <br />
          <span className="text-[#C17C5F]">heart grow fonder.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 4.6, ease: "easeOut" }}
          className="text-lg sm:text-xl text-[#4A3C2F] font-medium opacity-90 mb-10 max-w-2xl mx-auto drop-shadow-sm"
        >
          Track books, tools, kitchen gear, and personal items you lend to friends and neighbors. Send friendly SMS reminders when it's time to return. Simple, private, and relationship-first.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 4.8, ease: "easeOut" }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto pointer-events-auto"
        >
          <a href="#download" className="w-full sm:w-auto px-8 py-4 bg-[#8B9D77] hover:bg-[#7A8A67] text-white rounded-xl font-semibold transition-all shadow-lg shadow-[#8B9D77]/30 flex items-center justify-center gap-2 hover:-translate-y-0.5">
            Download App
          </a>
          <a href="#how-it-works" className="w-full sm:w-auto px-8 py-4 bg-[#FFFDF8]/80 backdrop-blur-sm hover:bg-[#F0EBE1] text-[#5C4B3A] border border-[#E8E1D3] rounded-xl font-semibold transition-all flex items-center justify-center gap-2">
            See How It Works <ArrowRight size={18} />
          </a>
        </motion.div>

        {/* Trust indicators */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 5.2 }}
          className="mt-16 flex flex-wrap justify-center gap-8 text-[#4A3C2F]/70"
        >
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-[#8B9D77]" />
            <span className="text-sm">Books, Tools, Games & Gear</span>
          </div>
          <div className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-[#8B9D77]" />
            <span className="text-sm">Relationship-first</span>
          </div>
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-[#8B9D77]" />
            <span className="text-sm">Private by design</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Hero;
