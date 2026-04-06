import { Link } from "wouter";
import { motion } from "framer-motion";
import { GraduationCap, Home, MessageCircle, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 text-center">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full"
      >
        <div className="inline-flex items-center justify-center w-20 h-20 bg-primary/10 rounded-2xl mb-6">
          <GraduationCap className="w-10 h-10 text-primary" />
        </div>

        <div className="text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-primary to-indigo-400 mb-4 leading-none">
          404
        </div>

        <h1 className="text-2xl font-bold text-foreground mb-3">
          Page not found
        </h1>
        <p className="text-muted-foreground mb-8 leading-relaxed">
          The page you're looking for doesn't exist or may have been moved.
          Let's get you back on track.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold bg-primary text-primary-foreground hover:bg-primary/90 hover:-translate-y-0.5 transition-all duration-200 shadow-lg shadow-primary/20"
          >
            <Home className="w-4 h-4" />
            Go Home
          </Link>
          <Link
            href="/chat"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground hover:-translate-y-0.5 transition-all duration-200"
          >
            <MessageCircle className="w-4 h-4" />
            Open Chat
          </Link>
        </div>

        <div className="mt-10">
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Go back to previous page
          </button>
        </div>
      </motion.div>
    </div>
  );
}
