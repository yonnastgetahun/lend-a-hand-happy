import { motion } from "framer-motion";
import { Download } from "lucide-react";

const EarlyAccess = () => {
  return (
    <section id="download" className="py-24 md:py-32 gradient-sage">
      <div className="container px-6">
        <div className="max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            {/* Icon */}
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-8">
              <Download className="w-8 h-8 text-primary" />
            </div>

            {/* Content */}
            <h2 className="text-3xl md:text-4xl font-serif text-foreground mb-4">
              Get Lendlee
            </h2>
            <p className="text-lg text-earth-light mb-10 max-w-lg mx-auto">
              Start lending freely and keeping relationships whole. Available on iOS and Android.
            </p>

            {/* Store Badges */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            >
              {/* Apple App Store Badge */}
              <a href="#" aria-label="Download on the App Store" className="transition-transform hover:scale-105">
                <svg width="160" height="54" viewBox="0 0 160 54" xmlns="http://www.w3.org/2000/svg">
                  <rect width="160" height="54" rx="8" fill="#000" />
                  <text x="80" y="18" textAnchor="middle" fill="#fff" fontSize="9" fontFamily="system-ui, sans-serif">Download on the</text>
                  <text x="80" y="36" textAnchor="middle" fill="#fff" fontSize="16" fontWeight="600" fontFamily="system-ui, sans-serif">App Store</text>
                  <g transform="translate(22, 14)" fill="#fff">
                    <path d="M14.5 24.5c-.8 1.7-1.2 2.5-2.3 4-.1.2-.3.4-.5.6-.7.8-1.7 1.8-2.9 1.8-1.1 0-1.4-.7-2.9-.7s-1.8.7-3 .7c-1.2 0-2.1-.9-2.8-1.7C-2.3 26.5-.5 21.2 1.7 18.6c1-1.2 2.2-2 3.4-2 1.2 0 2 .8 3 .8s1.7-.8 3.1-.8c1.1 0 2.1.6 3 1.5-2.6 1.4-2.2 5.1.3 6.4zM11 14.5c.8-1 1.3-2.4 1.2-3.8-1.2.1-2.6.8-3.4 1.8-.7.9-1.4 2.3-1.1 3.7 1.3 0 2.5-.7 3.3-1.7z" transform="scale(0.55)" />
                  </g>
                </svg>
              </a>

              {/* Google Play Store Badge */}
              <a href="#" aria-label="Get it on Google Play" className="transition-transform hover:scale-105">
                <svg width="160" height="54" viewBox="0 0 160 54" xmlns="http://www.w3.org/2000/svg">
                  <rect width="160" height="54" rx="8" fill="#000" />
                  <text x="85" y="18" textAnchor="middle" fill="#fff" fontSize="9" fontFamily="system-ui, sans-serif">GET IT ON</text>
                  <text x="85" y="36" textAnchor="middle" fill="#fff" fontSize="16" fontWeight="600" fontFamily="system-ui, sans-serif">Google Play</text>
                  <g transform="translate(18, 14)">
                    <polygon points="0,0 14,8 14,18 0,26" fill="#4285F4" />
                    <polygon points="0,0 14,8 7,13" fill="#34A853" />
                    <polygon points="14,18 14,8 7,13" fill="#FBBC05" />
                    <polygon points="0,26 14,18 7,13" fill="#EA4335" />
                  </g>
                </svg>
              </a>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default EarlyAccess;
