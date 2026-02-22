import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import heroImage from "@/assets/hero-iftar.jpg";

const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <motion.img
          src={heroImage}
          alt="Premium Iftar Spread"
          className="w-full h-full object-cover"
          initial={{ scale: 1.2 }}
          animate={{ scale: 1 }}
          transition={{ duration: 2, ease: "easeOut" }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-background/30" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/80 via-transparent to-background/40" />
      </div>

      {/* Floating glow */}
      <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-float pointer-events-none" />
      <div className="absolute bottom-1/3 left-1/4 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-float pointer-events-none" style={{ animationDelay: "3s" }} />

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.5 }}
        >
          <motion.p
            className="text-accent font-medium tracking-[0.3em] uppercase text-sm mb-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            Ramadan Special Collection
          </motion.p>
          <h1 className="font-display text-5xl md:text-7xl lg:text-8xl font-bold mb-6 text-shadow-lg leading-tight">
            Premium Iftar
            <br />
            <span className="gold-text">Delivered Fresh</span>
          </h1>
          <p className="text-foreground/70 text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
            Curated boxes of the finest dates, dry fruits &amp; nuts — handpicked for your blessed evenings.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/products">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.98 }}
                className="px-10 py-4 bg-accent text-accent-foreground font-semibold rounded-full text-lg animate-glow-pulse hover:shadow-[0_0_40px_hsl(43_85%_55%/0.5)] transition-shadow"
              >
                Order Now
              </motion.button>
            </Link>
            <Link to="/products">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.98 }}
                className="px-10 py-4 border border-foreground/20 text-foreground font-semibold rounded-full text-lg hover:border-accent/50 hover:text-accent transition-all"
              >
                View Products
              </motion.button>
            </Link>
          </div>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-10 left-1/2 -translate-x-1/2"
        animate={{ y: [0, 10, 0] }}
        transition={{ repeat: Infinity, duration: 2 }}
      >
        <div className="w-6 h-10 rounded-full border-2 border-foreground/30 flex items-start justify-center p-1">
          <div className="w-1.5 h-3 rounded-full bg-accent" />
        </div>
      </motion.div>
    </section>
  );
};

export default Hero;
