import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/context/AuthContext";
import { motion } from "framer-motion";
import {
  User, Mail, Calendar, MessageSquare, BookOpen, LogOut,
  ArrowLeft, Lock, Trash2, Shield, Sparkles, BarChart3,
} from "lucide-react";

const API_BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

interface ProfileStats {
  totalSessions: number;
  totalMessages: number;
  joinedAt: string;
  email: string;
  username: string;
}

export default function ProfilePage() {
  const { user, token, logout } = useAuth();
  const [, navigate] = useLocation();
  const [stats, setStats] = useState<ProfileStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !token) { navigate("/login"); return; }
    fetch(`${API_BASE}/api/auth/profile`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(data => { setStats(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [user, token, navigate]);

  if (!user) return null;

  const joinDate = stats ? new Date(stats.joinedAt).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" }) : "—";

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/chat" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm font-medium">
            <ArrowLeft className="w-4 h-4" /> Back to Chat
          </Link>
          <span className="font-bold text-foreground">My Profile</span>
          <button onClick={() => { logout(); navigate("/"); }}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-destructive transition-colors">
            <LogOut className="w-4 h-4" /> Sign out
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-10 space-y-6">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-sm">
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 rounded-2xl bg-primary/15 flex items-center justify-center shrink-0">
              <span className="text-4xl font-extrabold text-primary">{user.username[0].toUpperCase()}</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">{user.username}</h1>
              <p className="text-muted-foreground text-sm mt-0.5 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5" /> {user.email}
              </p>
              <div className="flex items-center gap-1.5 mt-2">
                <Shield className="w-3.5 h-3.5 text-green-500" />
                <span className="text-xs text-green-600 dark:text-green-400 font-medium">Verified account</span>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { icon: MessageSquare, label: "Total Chats", value: loading ? "…" : String(stats?.totalSessions ?? 0), color: "text-blue-500", bg: "bg-blue-500/10" },
            { icon: BookOpen, label: "Messages Sent", value: loading ? "…" : String(stats?.totalMessages ?? 0), color: "text-violet-500", bg: "bg-violet-500/10" },
            { icon: Calendar, label: "Member Since", value: loading ? "…" : joinDate, color: "text-emerald-500", bg: "bg-emerald-500/10" },
          ].map((stat, i) => (
            <div key={i} className="bg-card border border-border rounded-2xl p-5 shadow-sm">
              <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center mb-3`}>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1">{stat.label}</p>
              <p className="text-xl font-bold text-foreground">{stat.value}</p>
            </div>
          ))}
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="bg-card border border-border rounded-2xl p-6 shadow-sm">
          <h2 className="font-bold text-foreground mb-4 flex items-center gap-2">
            <User className="w-4 h-4 text-primary" /> Account Details
          </h2>
          <div className="space-y-3">
            {[
              { label: "Username", value: user.username },
              { label: "Email", value: user.email },
              { label: "Joined", value: joinDate },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between py-2.5 border-b border-border last:border-0">
                <span className="text-sm text-muted-foreground">{item.label}</span>
                <span className="text-sm font-medium text-foreground">{loading && item.label === "Joined" ? "…" : item.value}</span>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          {!loading && stats && (
            <div className="bg-primary/5 border border-primary/15 rounded-2xl p-5 flex items-start gap-3">
              <BarChart3 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-foreground mb-1">Your activity summary</p>
                <p className="text-sm text-muted-foreground">
                  You've had <span className="font-semibold text-foreground">{stats.totalSessions}</span> conversations
                  with a total of <span className="font-semibold text-foreground">{stats.totalMessages}</span> messages exchanged.
                  {stats.totalSessions > 10 ? " You're a power learner! 🚀" : stats.totalSessions > 3 ? " Keep up the great work! 🌟" : " Welcome aboard! Start exploring. ✨"}
                </p>
              </div>
            </div>
          )}
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="bg-card border border-border rounded-2xl p-6 shadow-sm">
          <h2 className="font-bold text-foreground mb-4 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" /> Account Actions
          </h2>
          <div className="space-y-3">
            <Link href="/chat"
              className="flex items-center justify-between w-full px-4 py-3 rounded-xl bg-primary/5 border border-primary/20 hover:bg-primary/10 transition-colors group">
              <span className="text-sm font-medium text-foreground">Continue chatting</span>
              <MessageSquare className="w-4 h-4 text-primary group-hover:scale-110 transition-transform" />
            </Link>
            <button
              onClick={() => navigate("/chat")}
              className="flex items-center justify-between w-full px-4 py-3 rounded-xl border border-border hover:bg-secondary/60 transition-colors group text-left"
            >
              <span className="text-sm font-medium text-foreground">Change password</span>
              <Lock className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
            </button>
            <button
              onClick={() => { logout(); navigate("/"); }}
              className="flex items-center justify-between w-full px-4 py-3 rounded-xl border border-border hover:bg-secondary/60 transition-colors group text-left"
            >
              <span className="text-sm font-medium text-muted-foreground">Sign out</span>
              <LogOut className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
            </button>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
