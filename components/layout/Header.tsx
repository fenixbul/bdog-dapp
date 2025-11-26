"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import {
  Button,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  Separator,
} from "@/components/ui";

interface HeaderProps {
  sticky?: boolean;
}

const Header = ({ sticky = false }: HeaderProps) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleCloseMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const navigationLinks = [
  ];

  return (
    <header
      className={`w-full bg-background text-foreground border-b border-border ${
        sticky ? "sticky top-0 z-50" : ""
      }`}
    >
      <div className="main-container">
        <nav className="flex items-center justify-between py-4 md:py-6">
          {/* Logo and Main Navigation */}
          <div className="flex items-center space-x-8">
            {/* Logo */}
            <Link href="/" className="flex-shrink-0">
              <img
                className="w-[180px] relative bottom-[4px]"
                src="/images/logo.webp"
                alt="BOBDOG"
              />
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-6">
              {navigationLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm text-foreground hover:text-cta transition-colors duration-200"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Desktop Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            {/* <Button variant="ghost" asChild>
              <a 
                href="" 
                target="_blank" 
                rel="noopener noreferrer"
                className="hover:text-cta"
              >
                Secondary link
              </a>
            </Button> */}
            <Button
              variant="primary"
              asChild
            >
              <Link
                href="https://t.me/+qG7fjAl4snQxNzU8"
                target="_blank"
                rel="noopener noreferrer"
              >
                Join Telegram
              </Link>
            </Button>
          </div>

          {/* Mobile Menu */}
          <div className="md:hidden">
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-foreground hover:bg-muted"
                >
                  <Menu className="h-6 w-6" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent
                side="right"
                className="bg-background border-border"
              >
                <SheetHeader>
                  <SheetTitle className="text-foreground">Navigation</SheetTitle>
                  <SheetDescription className="text-muted-foreground">
                    Access all platform features
                  </SheetDescription>
                </SheetHeader>
                <div className="mt-6 space-y-4">
                  {navigationLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="block text-sm text-foreground hover:text-cta transition-colors duration-200"
                      onClick={handleCloseMobileMenu}
                    >
                      {link.label}
                    </Link>
                  ))}
                  <Separator className="my-4 bg-border" />
                  <div className="space-y-4">
                    {/* <Button
                      variant="ghost"
                      asChild
                      className="w-full justify-start"
                    >
                      <a
                        href=""
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={handleCloseMobileMenu}
                        className="hover:text-cta"
                      >
                        Secondary link
                      </a>
                    </Button> */}
                    <Button
                      variant="primary"
                      className="w-full"
                      asChild
                    >
                      <Link href="https://t.me/+qG7fjAl4snQxNzU8" target="_blank" rel="noopener noreferrer" onClick={handleCloseMobileMenu}>
                        Join Telegram
                      </Link>
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </nav>
      </div>
    </header>
  );
};

export default Header;
