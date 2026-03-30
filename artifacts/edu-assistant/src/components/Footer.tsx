import { Link } from "wouter";
import { GraduationCap, ArrowRight, Github } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-card border-t border-border pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          <div className="col-span-1 lg:col-span-2">
            <div className="flex items-center gap-2.5 mb-6">
              <div className="bg-primary p-2 rounded-xl">
                <GraduationCap className="w-6 h-6 text-primary-foreground" />
              </div>
              <span className="font-display font-bold text-2xl text-foreground">
                Edu<span className="text-primary">Assistant</span>
              </span>
            </div>
            <p className="text-muted-foreground max-w-sm mb-6 leading-relaxed">
              Empowering the learning journey with an AI-driven chatbot that understands context, retrieves precise knowledge, and delivers answers instantly.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="p-2.5 rounded-full bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-colors">
                <Github className="w-5 h-5" />
              </a>
            </div>
          </div>
          
          <div>
            <h3 className="font-bold text-lg mb-6 text-foreground">Quick Links</h3>
            <ul className="space-y-4">
              <li><a href="#about" className="text-muted-foreground hover:text-primary transition-colors">About Project</a></li>
              <li><a href="#features" className="text-muted-foreground hover:text-primary transition-colors">Features</a></li>
              <li><a href="#how-it-works" className="text-muted-foreground hover:text-primary transition-colors">How It Works</a></li>
              <li><Link href="/chat" className="text-muted-foreground hover:text-primary transition-colors">Try Chatbot</Link></li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-bold text-lg mb-6 text-foreground">Ready to start?</h3>
            <p className="text-muted-foreground mb-6">Jump into the chat interface and start asking questions about the curriculum.</p>
            <Link
              href="/chat"
              className="inline-flex items-center justify-center w-full px-6 py-3.5 rounded-xl font-semibold bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground transition-all duration-300 group"
            >
              Launch Interface
              <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
        
        <div className="pt-8 border-t border-border/50 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} AI Education Assistant. Open Source Project.
          </p>
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            Built with <span className="text-primary font-medium">Replit</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
