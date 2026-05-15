import { motion } from 'framer-motion';

export default function HeroHeader({ userName }) {
  const hour = new Date().getHours();

  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="px-6 pt-12 pb-6"
    >
      <div className="flex justify-center mb-3">
        <img
          src="https://media.base44.com/images/public/6a0486b2e760295217faf01f/3a73a939f_MMcafelogo1.png"
          alt="MM Café logo"
          className="w-full max-w-[400px] h-auto object-contain"
        />
      </div>
      <p className="text-sm text-muted-foreground mt-3 leading-relaxed">
        OPEN: Sun - Fri    9 am (Sat 10 am)
      </p>
      <p className="text-sm text-muted-foreground mt-3 leading-relaxed">
        CLOSE: Sun - Thur 10:30 pm (Fri､ Sat 11:30 pm) 
      </p>
      <p className="text-sm text-muted-foreground mt-3 leading-relaxed">
        TEL: 6232-2227 | ADDRESS: TBC
      </p>
    </motion.section>
  );
}