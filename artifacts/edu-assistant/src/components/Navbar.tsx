import { Link, useLocation } from "wouter";
import { GraduationCap, MessageSquare, Menu, X } from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

export function Navbar() {
  const [location] = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const isHome = location === "/";
  const isChat = location === "/chat";

  return (
    <nav
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b border-transparent",
        isScrolled || isChat ? "glass-panel" : "bg-transparent"
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <div className="flex-shrink-0">
            <Link 
              href="/" 
              className="flex items-center gap-2.5 text-primary group hover:opacity-80 transition-opacity"
            >
              <div className="bg-primary/10 p-2.5 rounded-xl group-hover:bg-primary/20 transition-colors">
                <GraduationCap className="w-6 h-6 text-primary" />
              </div>
              <span className="font-display font-bold text-xl text-foreground">
                Edu<span className="text-primary">Assistant</span>
              </span>
            </Link>
          </div>
          
          {/* Desktop Nav */}
          <div className="hidden md:flex items-center space-x-8">
            {isHome ? (
              <>
                <a href="#about" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">About</a>
                <a href="#architecture" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Architecture</a>
                <a href="#features" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Features</a>
              </>
            ) : null}
            
            {isChat ? (
              <Link 
                href="/" 
                className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
              >
                Back to Home
              </Link>
            ) : null}

            <Link
              href="/chat"
              className="inline-flex items-center justify-center px-6 py-2.5 rounded-full text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/20 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              Launch Chat
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-muted-foreground hover:bg-secondary/50 focus:outline-none"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Nav */}
      {mobileMenuOpen && (
        <div className="md:hidden glass-panel border-t">
          <div className="px-4 pt-2 pb-6 space-y-2">
            {isHome && (
              <>
                <a href="#about" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-3 rounded-md text-base font-medium text-foreground hover:bg-secondary/50">About</a>
                <a href="#architecture" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-3 rounded-md text-base font-medium text-foreground hover:bg-secondary/50">Architecture</a>
                <a href="#features" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-3 rounded-md text-base font-medium text-foreground hover:bg-secondary/50">Features</a>
              </>
            )}
            {isChat && (
              <Link href="/" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-3 rounded-md text-base font-medium text-foreground hover:bg-secondary/50">
                Back to Home
              </Link>
            )}
            <div className="pt-4">
              <Link 
                href="/chat" 
                onClick={() => setMobileMenuOpen(false)}
                className="w-full flex items-center justify-center px-6 py-3 rounded-xl text-base font-semibold bg-primary text-primary-foreground"
              >
                <MessageSquare className="w-5 h-5 mr-2" />
                Launch Chat
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
