import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';

export default function QuickBookCard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="mx-6 mb-8"
    >
      <Link
        to="/booking"
        className="group relative block overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-primary/90 to-primary/70 p-6 shadow-sm hover:shadow-xl transition-all duration-500"
      >
        <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-secondary/30 blur-2xl" />
        <div className="absolute -right-4 -bottom-8 w-28 h-28 rounded-full bg-white/10 blur-xl" />

        <div className="relative">
          <p className="text-xs uppercase tracking-[0.25em] text-primary-foreground/80">
            Welcome to M.M. Café 
          </p>
          <h3 className="font-display text-2xl text-primary-foreground mt-2 leading-snug">
            Reserve A Table Here!
          </h3>

          <div className="mt-6 flex items-center gap-2 text-primary-foreground">
            <span className="text-sm font-medium">Begin </span>
            <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
          </div>
        </div>
      </Link>
    </motion.div>
  );
}