import { motion } from "framer-motion";
import { Link } from "wouter";
import { 
  ArrowRight, Sparkles, Brain, CheckCircle2, 
  Layers, Database, Code2, Zap, ShieldCheck, 
  Clock, Maximize, Smartphone, Settings, Mic, 
  Globe2, BarChart3, Network, Users
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useAuth } from "@/context/AuthContext";

// Stagger variants for animations
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
};

export default function Home() {
  const { user } = useAuth();
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* HERO SECTION */}
      <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden">
        {/* Background elements */}
        <div className="absolute inset-0 z-0">
          <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full bg-primary/20 blur-[120px]" />
          <div className="absolute bottom-[-10%] left-[-5%] w-[600px] h-[600px] rounded-full bg-accent/30 blur-[120px]" />
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div 
              initial="hidden" animate="visible" variants={containerVariants}
              className="max-w-2xl"
            >
              <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary font-medium text-sm mb-6 border border-primary/20">
                <Sparkles className="w-4 h-4" />
                <span>Next-Generation Learning</span>
              </motion.div>
              
              <motion.h1 variants={itemVariants} className="text-5xl sm:text-6xl md:text-7xl font-bold leading-tight mb-6">
                Your Intelligent <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-indigo-400">
                  Educational Assistant
                </span>
              </motion.h1>
              
              <motion.p variants={itemVariants} className="text-lg md:text-xl text-muted-foreground mb-10 leading-relaxed">
                Empower your learning journey with an AI-driven chatbot that understands context, retrieves precise knowledge, and delivers answers instantly.
              </motion.p>
              
              <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4">
                <Link
                  href={user ? "/chat" : "/signup"}
                  className="inline-flex items-center justify-center px-8 py-4 rounded-xl text-base font-bold bg-primary text-primary-foreground shadow-xl shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-1 transition-all duration-300"
                >
                  {user ? "Launch Chat" : "Get Started — It's Free"}
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Link>
                <a 
                  href="#about" 
                  className="inline-flex items-center justify-center px-8 py-4 rounded-xl text-base font-bold bg-secondary text-secondary-foreground hover:bg-secondary/80 hover:-translate-y-1 transition-all duration-300"
                >
                  Learn More
                </a>
              </motion.div>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative hidden lg:block"
            >
              <img 
                src={`${import.meta.env.BASE_URL}images/hero-abstract.png`} 
                alt="Abstract AI Visualization" 
                className="w-full h-auto object-cover rounded-3xl shadow-2xl shadow-primary/10"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* ABOUT SECTION */}
      <section id="about" className="py-24 bg-card relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">About The Project</h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              The AI-Powered Education Assistant is designed to bridge the gap between vast educational resources and student comprehension. By leveraging natural language processing techniques, we've created a system that doesn't just search—it understands.
            </p>
            <p className="text-lg text-muted-foreground leading-relaxed mt-4">
              Instead of relying on generic web searches, our chatbot interfaces with a highly curated, domain-specific dataset. It utilizes advanced text similarity algorithms (inspired by TF-IDF and Cosine Similarity) to match student queries with the most accurate, context-aware responses.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="glass-card p-8 rounded-2xl flex items-start gap-4">
              <div className="p-3 bg-primary/10 rounded-xl text-primary shrink-0">
                <Brain className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2">Smart Parsing</h3>
                <p className="text-muted-foreground">Understands the deep intent behind student questions rather than just matching keywords.</p>
              </div>
            </div>
            <div className="glass-card p-8 rounded-2xl flex items-start gap-4">
              <div className="p-3 bg-accent rounded-xl text-primary shrink-0">
                <Database className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2">Curated Data</h3>
                <p className="text-muted-foreground">Relies on a high-quality, factual knowledge base ensuring zero hallucinations.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* OBJECTIVES & SCOPE */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-16">
            <div>
              <h2 className="text-3xl font-bold mb-8 flex items-center gap-3">
                <CheckCircle2 className="w-8 h-8 text-primary" />
                Key Objectives
              </h2>
              <ul className="space-y-4">
                {[
                  "Provide instant, accurate answers to student queries.",
                  "Reduce instructor workload by automating repetitive questions.",
                  "Ensure high reliability by using a closed, trusted dataset.",
                  "Deliver an intuitive, chat-based interface familiar to modern users."
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3 p-4 rounded-xl hover:bg-secondary/50 transition-colors">
                    <div className="w-2 h-2 mt-2 rounded-full bg-primary shrink-0" />
                    <span className="text-lg text-muted-foreground">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h2 className="text-3xl font-bold mb-8 flex items-center gap-3">
                <Maximize className="w-8 h-8 text-primary" />
                System Scope
              </h2>
              <ul className="space-y-4">
                {[
                  "Focused purely on educational Q&A based on provided materials.",
                  "Web-based application accessible across desktop and mobile.",
                  "Maintains history of interactions for contextual awareness.",
                  "Does NOT execute arbitrary code or browse the live internet."
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3 p-4 rounded-xl hover:bg-secondary/50 transition-colors">
                    <div className="w-2 h-2 mt-2 rounded-full bg-accent-foreground shrink-0" />
                    <span className="text-lg text-muted-foreground">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ARCHITECTURE */}
      <section id="architecture" className="py-24 bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">System Architecture</h2>
            <p className="text-lg text-muted-foreground">A clean, scalable full-stack implementation using modern web technologies.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="glass-card p-8 rounded-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-full transition-transform group-hover:scale-110" />
              <Layers className="w-10 h-10 text-primary mb-6" />
              <h3 className="text-xl font-bold mb-2">Presentation Layer</h3>
              <p className="text-sm font-semibold text-primary mb-4">React + Tailwind</p>
              <p className="text-muted-foreground">Responsive, highly interactive UI providing a ChatGPT-like experience. Uses React Query for seamless API communication.</p>
            </div>
            
            <div className="glass-card p-8 rounded-2xl relative overflow-hidden group border-primary/20 shadow-primary/5">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-full transition-transform group-hover:scale-110" />
              <Code2 className="w-10 h-10 text-primary mb-6" />
              <h3 className="text-xl font-bold mb-2">Application Layer</h3>
              <p className="text-sm font-semibold text-primary mb-4">Node.js + Express</p>
              <p className="text-muted-foreground">Processes incoming queries, executes text-similarity algorithms against the knowledge base, and manages chat sessions.</p>
            </div>

            <div className="glass-card p-8 rounded-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-full transition-transform group-hover:scale-110" />
              <Database className="w-10 h-10 text-primary mb-6" />
              <h3 className="text-xl font-bold mb-2">Data Layer</h3>
              <p className="text-sm font-semibold text-primary mb-4">PostgreSQL + Drizzle</p>
              <p className="text-muted-foreground">Securely stores the structured Knowledge Base and user Chat Histories. Ensuring fast and reliable retrieval.</p>
            </div>
          </div>
        </div>
      </section>

      {/* KEY FEATURES */}
      <section id="features" className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Key Features</h2>
            <p className="text-lg text-muted-foreground">Everything you need to deploy an intelligent campus assistant.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Zap, title: "Instant Retrieval", desc: "Millisecond response times utilizing optimized backend similarity matching." },
              { icon: ShieldCheck, title: "Factual Accuracy", desc: "Zero hallucination guarantee. Answers are strictly bounded to the provided dataset." },
              { icon: Clock, title: "Contextual Memory", desc: "Maintains a history of interactions to provide a continuous learning conversation." },
              { icon: Brain, title: "Semantic Understanding", desc: "Matches intent, not just exact keywords. Variations of questions yield correct answers." },
              { icon: Smartphone, title: "Modern UI/UX", desc: "Beautiful, responsive interface designed to keep students engaged and focused." },
              { icon: Settings, title: "Extensible Base", desc: "Easily update the knowledge base with new curriculum materials via the database." }
            ].map((feat, i) => (
              <div key={i} className="p-6 rounded-2xl border border-border bg-card hover:border-primary/50 transition-colors">
                <feat.icon className="w-8 h-8 text-primary mb-4" />
                <h3 className="text-lg font-bold mb-2">{feat.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{feat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS / PIPELINE */}
      <section id="how-it-works" className="py-24 bg-primary text-primary-foreground overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">How It Works</h2>
            <p className="text-primary-foreground/80 text-lg">A sophisticated AI pipeline that matches student queries to curated knowledge.</p>
          </div>

          <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-2 lg:gap-4 overflow-x-auto pb-8">
            {[
              { step: "Question", desc: "Student asks" },
              { step: "Preprocessing", desc: "Text cleaning" },
              { step: "Vectorization", desc: "TF-IDF encode" },
              { step: "Matching", desc: "Cosine similarity" },
              { step: "Retrieval", desc: "Find answer" },
              { step: "Processing", desc: "Score confidence" },
              { step: "Response", desc: "AI replies" }
            ].map((stage, i, arr) => (
              <div key={i} className="flex flex-col md:flex-row items-center">
                <div className="bg-primary-foreground/10 border border-primary-foreground/20 backdrop-blur-sm p-4 rounded-xl w-40 text-center relative">
                  <div className="text-xs font-bold text-primary-foreground/60 uppercase tracking-wider mb-1">Step {i+1}</div>
                  <div className="font-bold mb-1">{stage.step}</div>
                  <div className="text-xs text-primary-foreground/80">{stage.desc}</div>
                </div>
                {i < arr.length - 1 && (
                  <ArrowRight className="w-6 h-6 my-4 md:my-0 md:mx-2 lg:mx-4 text-primary-foreground/50 rotate-90 md:rotate-0 shrink-0" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TECH STACK */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Technology Stack</h2>
            <p className="text-muted-foreground text-lg">Modern technologies powering the AI Education Assistant.</p>
          </div>
          
          <div className="flex flex-wrap justify-center gap-4 max-w-4xl mx-auto">
            {[
              "⚛️ React", "📘 TypeScript", "🟢 Node.js", "🚂 Express", 
              "🐘 PostgreSQL", "📊 TF-IDF", "📐 Cosine Similarity", 
              "🎨 Tailwind CSS", "⚡ React Query"
            ].map((tech, i) => (
              <div key={i} className="px-6 py-3 bg-secondary rounded-full font-semibold text-secondary-foreground border border-border/50 hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all duration-300 cursor-default">
                {tech}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* KNOWLEDGE BASE PREVIEW */}
      <section className="py-24 bg-card">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-end mb-8">
            <div>
              <h2 className="text-3xl font-bold mb-2">Knowledge Base Preview</h2>
              <p className="text-muted-foreground">Sample of curated academic questions and answers.</p>
            </div>
            <div className="mt-4 md:mt-0 inline-flex items-center px-4 py-2 bg-primary/10 text-primary rounded-lg font-medium text-sm">
              📚 Dataset Size: 50+ Questions
            </div>
          </div>
          
          <div className="overflow-x-auto rounded-xl border border-border bg-background shadow-sm">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-secondary/50 border-b border-border">
                  <th className="p-4 font-semibold text-foreground w-1/3">Question</th>
                  <th className="p-4 font-semibold text-foreground">Answer Preview</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {[
                  ["What is Artificial Intelligence?", "AI is the simulation of human intelligence in machines..."],
                  ["What is Machine Learning?", "Machine learning is a subset of AI that enables systems to learn from data..."],
                  ["What is Python?", "Python is a popular programming language used in web development..."],
                  ["Define compiler", "A compiler converts high-level code into machine code..."],
                  ["What is Natural Language Processing?", "NLP enables computers to understand human language..."]
                ].map(([q, a], i) => (
                  <tr key={i} className="hover:bg-secondary/20 transition-colors">
                    <td className="p-4 text-sm font-medium text-foreground">{q}</td>
                    <td className="p-4 text-sm text-muted-foreground truncate max-w-xs">{a}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* FUTURE ENHANCEMENTS */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Future Enhancements</h2>
            <p className="text-muted-foreground">Planned features to expand capabilities.</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[
              { icon: Mic, label: "Voice Interaction" },
              { icon: Globe2, label: "Multilingual Support" },
              { icon: BarChart3, label: "Analytics Dashboard" },
              { icon: Network, label: "Deep Learning Model" },
              { icon: Layers, label: "LMS Integration" },
              { icon: Users, label: "Collaborative Features" }
            ].map((item, i) => (
              <div key={i} className="p-6 text-center border border-border rounded-2xl hover:border-primary hover:shadow-md transition-all">
                <item.icon className="w-8 h-8 mx-auto text-primary mb-3" />
                <h4 className="font-semibold">{item.label}</h4>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ABOUT DEVELOPER */}
      <section className="py-24 bg-card border-t border-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="glass-panel p-8 md:p-12 rounded-3xl grid md:grid-cols-5 gap-12 items-center">
            <div className="md:col-span-2 flex justify-center">
              <div className="relative">
                <div className="absolute inset-0 rounded-full bg-primary blur-2xl opacity-20" />
                <img 
                  src={`${import.meta.env.BASE_URL}images/developer-avatar.png`} 
                  alt="Developer Avatar" 
                  className="w-48 h-48 rounded-full object-cover border-4 border-background shadow-xl relative z-10"
                />
              </div>
            </div>
            <div className="md:col-span-3">
              <h2 className="text-3xl font-bold mb-2">About the Developer</h2>
              <div className="text-primary font-medium mb-6">Developer: Muzamil Arshid</div>
              <p className="text-muted-foreground leading-relaxed mb-8">
                This project demonstrates the practical application of Natural Language Processing, Machine Learning, and Full-Stack Web Development. Built with modern technologies including React, Node.js, Express, PostgreSQL, and TF-IDF vectorization for intelligent academic assistance.
              </p>
              
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-foreground mb-1">10+</div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wider">Technologies</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-foreground mb-1">50+</div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wider">Knowledge Items</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-foreground mb-1">100%</div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wider">Open Source</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
