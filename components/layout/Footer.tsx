import Link from 'next/link';
import { Separator } from '@/components/ui';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  
  const footerSections = [];

  return (
    <footer className="bg-black text-white">
      <div className="container mx-auto px-3 md:px-6 py-8">
        {/* Bottom Footer */}
        <div className="flex justify-center items-center">
          {/* BOBPAD Logo */}
          <div className="flex items-center space-x-2">
            <img 
              src="/images/bob_logo.png" 
              alt="BOBPAD" 
              className="h-8 w-auto"
            />
            <span className="text-base text-gray-400">Launched on </span>
            <a 
              href="https://bobpad.fun" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-base text-gray-400 hover:text-white transition-colors underline"
            >
              bobpad.fun
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
