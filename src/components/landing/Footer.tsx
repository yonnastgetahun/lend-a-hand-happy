import { Heart } from "lucide-react";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="py-12 bg-cream-dark border-t border-border">
      <div className="container px-6">
        <div className="max-w-4xl mx-auto">
          {/* Main footer content */}
          <div className="flex flex-col md:flex-row justify-between items-center gap-8 mb-8">
            {/* Brand */}
            <div className="text-center md:text-left">
              <h3 className="font-serif text-2xl text-foreground mb-2">Lendlee</h3>
              <p className="text-sm text-muted-foreground max-w-xs">
                Gentle lending. Joyful returns. Community kept whole.
              </p>
            </div>

            {/* Links */}
            <div className="flex flex-wrap justify-center gap-6 text-sm">
              <Link
                to="/privacy"
                className="text-earth-light hover:text-primary transition-colors"
              >
                Privacy
              </Link>
              <Link
                to="/terms"
                className="text-earth-light hover:text-primary transition-colors"
              >
                Terms
              </Link>
              <a
                href="mailto:hello@lendlee.app"
                className="text-earth-light hover:text-primary transition-colors"
              >
                Contact
              </a>
            </div>

          </div>

          {/* Divider */}
          <div className="border-t border-border pt-8">
            {/* Values statement */}
            <p className="text-center text-sm text-muted-foreground mb-4">
              Built with care for communities who share freely.
            </p>

            {/* Copyright */}
            <p className="text-center text-xs text-muted-foreground flex items-center justify-center gap-1">
              Made with <Heart className="w-3 h-3 text-accent fill-accent" /> for neighbors everywhere · © {new Date().getFullYear()} Lendlee
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
