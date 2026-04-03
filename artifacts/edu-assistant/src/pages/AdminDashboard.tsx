import { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import {
  GraduationCap, LogOut, BookOpen, MessageSquare, Plus,
  Pencil, Trash2, ChevronDown, ChevronUp, X, Check, AlertCircle,
  Search, Loader2, Users, BarChart3, Mail, CalendarDays
} from "lucide-react";

const API_BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

function getToken() {
  return localStorage.getItem("admin_token") ?? "";
}

function authHeaders() {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${getToken()}`,
  };
}

interface KnowledgeEntry {
  id: string;
  question: string;
  answer: string;
  category: string | null;
  createdAt: string;
}

interface ChatMessage {
  id: string;
  role: string;
  content: string;
  confidence: number | null;
  createdAt: string;
}

interface ChatSession {
  id: string;
  createdAt: string;
  messageCount: number;
  messages: ChatMessage[];
}

function KnowledgeModal({
  entry,
  onClose,
  onSaved,
}: {
  entry: KnowledgeEntry | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [question, setQuestion] = useState(entry?.question ?? "");
  const [answer, setAnswer] = useState(entry?.answer ?? "");
  const [category, setCategory] = useState(entry?.category ?? "");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!question.trim() || !answer.trim()) {
      setError("Question and answer are required.");
      return;
    }
    setError("");
    setSaving(true);
    try {
      const url = entry
        ? `${API_BASE}/api/admin/knowledge/${entry.id}`
        : `${API_BASE}/api/admin/knowledge`;
      const method = entry ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: authHeaders(),
        body: JSON.stringify({ question, answer, category: category || null }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setError(d.error || "Failed to save entry.");
        return;
      }
      onSaved();
      onClose();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-lg font-bold">{entry ? "Edit Entry" : "Add Entry"}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-secondary/60 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          {error && (
            <div className="flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              {error}
            </div>
          )}
          <div>
            <label htmlFor="modal-question" className="block text-sm font-medium mb-1.5">Question <span className="text-destructive">*</span></label>
            <textarea
              id="modal-question"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
            />
          </div>
          <div>
            <label htmlFor="modal-answer" className="block text-sm font-medium mb-1.5">Answer <span className="text-destructive">*</span></label>
            <textarea
              id="modal-answer"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
            />
          </div>
          <div>
            <label htmlFor="modal-category" className="block text-sm font-medium mb-1.5">Category <span className="text-muted-foreground">(optional)</span></label>
            <input
              id="modal-category"
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="e.g. Machine Learning"
              className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
            />
          </div>
        </div>
        <div className="flex gap-3 px-6 pb-6">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-border font-medium text-sm hover:bg-secondary/50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

function DeleteConfirmModal({
  entry,
  onClose,
  onDeleted,
}: {
  entry: KnowledgeEntry;
  onClose: () => void;
  onDeleted: () => void;
}) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  async function handleDelete() {
    setDeleting(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/api/admin/knowledge/${entry.id}`, {
        method: "DELETE",
        headers: authHeaders(),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setError(d.error || "Failed to delete.");
        return;
      }
      onDeleted();
      onClose();
    } catch {
      setError("Network error.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md">
        <div className="p-6">
          <h2 className="text-lg font-bold mb-2">Delete Entry</h2>
          <p className="text-muted-foreground text-sm mb-4">
            Are you sure you want to delete this knowledge base entry? This action cannot be undone.
          </p>
          <div className="bg-secondary/50 rounded-lg px-4 py-3 text-sm font-medium truncate mb-4">
            {entry.question}
          </div>
          {error && (
            <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm mb-4">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-border font-medium text-sm hover:bg-secondary/50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="flex-1 py-2.5 rounded-xl bg-destructive text-destructive-foreground font-medium text-sm hover:bg-destructive/90 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              {deleting ? "Deleting…" : "Delete"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function KnowledgeTab() {
  const [entries, setEntries] = useState<KnowledgeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [addModal, setAddModal] = useState(false);
  const [editEntry, setEditEntry] = useState<KnowledgeEntry | null>(null);
  const [deleteEntry, setDeleteEntry] = useState<KnowledgeEntry | null>(null);

  const fetchEntries = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/api/admin/knowledge`, {
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error("Failed to load knowledge base");
      const data = await res.json();
      setEntries(data);
    } catch {
      setError("Failed to load knowledge base entries.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  const filtered = entries.filter(
    (e) =>
      e.question.toLowerCase().includes(search.toLowerCase()) ||
      e.answer.toLowerCase().includes(search.toLowerCase()) ||
      (e.category ?? "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search entries…"
            className="w-full pl-9 pr-4 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
          />
        </div>
        <button
          onClick={() => setAddModal(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground font-medium text-sm rounded-xl hover:bg-primary/90 transition-colors shrink-0"
        >
          <Plus className="w-4 h-4" />
          Add Entry
        </button>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-16 text-muted-foreground">
          <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading…
        </div>
      )}

      {!loading && error && (
        <div className="flex items-center gap-2 p-4 bg-destructive/10 border border-destructive/20 rounded-xl text-destructive text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {!loading && !error && (
        <>
          <div className="text-sm text-muted-foreground mb-3">
            {filtered.length} {filtered.length === 1 ? "entry" : "entries"}{search ? ` matching "${search}"` : ""}
          </div>
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-secondary/50 border-b border-border">
                  <th className="px-4 py-3 text-sm font-semibold w-[30%]">Question</th>
                  <th className="px-4 py-3 text-sm font-semibold">Answer</th>
                  <th className="px-4 py-3 text-sm font-semibold w-32">Category</th>
                  <th className="px-4 py-3 text-sm font-semibold w-24 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-10 text-center text-muted-foreground text-sm">
                      No entries found.
                    </td>
                  </tr>
                )}
                {filtered.map((entry) => (
                  <tr key={entry.id} className="hover:bg-secondary/20 transition-colors">
                    <td className="px-4 py-3 text-sm font-medium align-top">{entry.question}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground align-top">
                      <span className="line-clamp-2">{entry.answer}</span>
                    </td>
                    <td className="px-4 py-3 text-sm align-top">
                      {entry.category ? (
                        <span className="inline-block px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
                          {entry.category}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center align-top">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => setEditEntry(entry)}
                          className="p-1.5 rounded-lg hover:bg-secondary/60 text-muted-foreground hover:text-foreground transition-colors"
                          title="Edit"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteEntry(entry)}
                          className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {addModal && (
        <KnowledgeModal entry={null} onClose={() => setAddModal(false)} onSaved={fetchEntries} />
      )}
      {editEntry && (
        <KnowledgeModal entry={editEntry} onClose={() => setEditEntry(null)} onSaved={fetchEntries} />
      )}
      {deleteEntry && (
        <DeleteConfirmModal entry={deleteEntry} onClose={() => setDeleteEntry(null)} onDeleted={fetchEntries} />
      )}
    </div>
  );
}

function SessionsTab() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(`${API_BASE}/api/admin/sessions`, {
          headers: authHeaders(),
        });
        if (!res.ok) throw new Error();
        const data = await res.json();
        setSessions(data);
      } catch {
        setError("Failed to load chat sessions.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  function toggleExpand(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground">
        <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading…
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 p-4 bg-destructive/10 border border-destructive/20 rounded-xl text-destructive text-sm">
        <AlertCircle className="w-4 h-4 shrink-0" />
        {error}
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        No chat sessions found.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="text-sm text-muted-foreground mb-3">
        {sessions.length} {sessions.length === 1 ? "session" : "sessions"} total
      </div>
      {sessions.map((session) => {
        const isExpanded = expanded.has(session.id);
        const date = new Date(session.createdAt).toLocaleString();
        return (
          <div key={session.id} className="border border-border rounded-xl overflow-hidden">
            <button
              onClick={() => toggleExpand(session.id)}
              className="w-full flex items-center justify-between px-5 py-4 hover:bg-secondary/30 transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <MessageSquare className="w-4 h-4 text-primary shrink-0" />
                <div>
                  <div className="text-sm font-medium font-mono text-muted-foreground">
                    {session.id.slice(0, 8)}…
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">{date}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs bg-secondary px-2.5 py-1 rounded-full font-medium">
                  {session.messageCount} {session.messageCount === 1 ? "message" : "messages"}
                </span>
                {isExpanded ? (
                  <ChevronUp className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                )}
              </div>
            </button>

            {isExpanded && (
              <div className="border-t border-border px-5 py-4 space-y-3 bg-background">
                {session.messages.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">No messages in this session.</p>
                )}
                {session.messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex gap-3 ${msg.role === "assistant" ? "flex-row-reverse" : ""}`}
                  >
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5
                        ${msg.role === "user" ? "bg-secondary text-secondary-foreground" : "bg-primary text-primary-foreground"}`}
                    >
                      {msg.role === "user" ? "U" : "AI"}
                    </div>
                    <div className={`max-w-[80%] ${msg.role === "assistant" ? "items-end" : "items-start"} flex flex-col gap-1`}>
                      <div
                        className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed
                          ${msg.role === "user"
                            ? "bg-secondary text-secondary-foreground rounded-tl-sm"
                            : "bg-primary/10 text-foreground rounded-tr-sm"}`}
                      >
                        {msg.content}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground px-1">
                        {new Date(msg.createdAt).toLocaleTimeString()}
                        {msg.confidence !== null && msg.role === "assistant" && (
                          <span className="text-primary/70">
                            · {Math.round(msg.confidence * 100)}% confidence
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

interface UserRecord {
  id: string;
  username: string;
  email: string;
  createdAt: string;
}

function UsersTab() {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/api/admin/users`, { headers: authHeaders() });
        if (!res.ok) throw new Error();
        setUsers(await res.json());
      } catch {
        setError("Failed to load users.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = users.filter(
    (u) =>
      u.username.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return (
    <div className="flex items-center justify-center py-16 text-muted-foreground">
      <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading users…
    </div>
  );
  if (error) return (
    <div className="flex items-center gap-2 p-4 bg-destructive/10 border border-destructive/20 rounded-xl text-destructive text-sm">
      <AlertCircle className="w-4 h-4 shrink-0" />{error}
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          <span className="font-bold text-foreground text-lg">{users.length}</span> registered {users.length === 1 ? "user" : "users"}
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search users…"
            className="pl-9 pr-4 py-2 text-sm bg-secondary/50 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 w-56"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          {search ? "No users match your search." : "No users registered yet."}
        </div>
      ) : (
        <div className="grid gap-3">
          {filtered.map((user, i) => (
            <div key={user.id} className="flex items-center gap-4 p-4 border border-border rounded-xl bg-card hover:bg-secondary/20 transition-colors">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                {user.username.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-foreground truncate">{user.username}</div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                  <Mail className="w-3 h-3 shrink-0" />
                  <span className="truncate">{user.email}</span>
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <CalendarDays className="w-3 h-3" />
                  {new Date(user.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                </div>
                <div className="text-xs text-muted-foreground/60 mt-0.5">#{i + 1}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

interface Stats { totalUsers: number; totalSessions: number; totalMessages: number; }

export default function AdminDashboard() {
  const [, navigate] = useLocation();
  const [tab, setTab] = useState<"users" | "knowledge" | "sessions">("users");
  const [authChecked, setAuthChecked] = useState(false);
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("admin_token");
    if (!token) { navigate("/admin"); return; }
    fetch(`${API_BASE}/api/admin/knowledge`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => {
        if (!r.ok) { localStorage.removeItem("admin_token"); navigate("/admin"); }
        else {
          setAuthChecked(true);
          fetch(`${API_BASE}/api/admin/stats`, { headers: { Authorization: `Bearer ${token}` } })
            .then((r) => r.json()).then(setStats).catch(() => {});
        }
      })
      .catch(() => { localStorage.removeItem("admin_token"); navigate("/admin"); });
  }, [navigate]);

  async function handleLogout() {
    const token = localStorage.getItem("admin_token");
    if (token) {
      await fetch(`${API_BASE}/api/admin/logout`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {});
    }
    localStorage.removeItem("admin_token");
    navigate("/admin");
  }

  if (!authChecked) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-card/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="bg-primary/10 p-2 rounded-xl">
              <GraduationCap className="w-5 h-5 text-primary" />
            </div>
            <span className="font-bold text-lg">
              Edu<span className="text-primary">Assistant</span>
              <span className="text-muted-foreground font-normal text-sm ml-2">Admin</span>
            </span>
          </div>
          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-border text-sm font-medium hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-1">Monitor users, manage the knowledge base, and review chat sessions.</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: "Total Users", value: stats?.totalUsers ?? "—", icon: Users, color: "text-blue-500", bg: "bg-blue-500/10" },
            { label: "Chat Sessions", value: stats?.totalSessions ?? "—", icon: MessageSquare, color: "text-violet-500", bg: "bg-violet-500/10" },
            { label: "Messages Sent", value: stats?.totalMessages ?? "—", icon: BarChart3, color: "text-green-500", bg: "bg-green-500/10" },
          ].map(({ label, value, icon: Icon, color, bg }) => (
            <div key={label} className="border border-border rounded-2xl p-5 bg-card flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl ${bg} flex items-center justify-center shrink-0`}>
                <Icon className={`w-6 h-6 ${color}`} />
              </div>
              <div>
                <div className="text-2xl font-bold">{value}</div>
                <div className="text-sm text-muted-foreground">{label}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-1 p-1 bg-secondary/50 rounded-xl mb-8 w-fit">
          <button
            onClick={() => setTab("users")}
            className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
              tab === "users" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Users className="w-4 h-4" />
            Users
          </button>
          <button
            onClick={() => setTab("knowledge")}
            className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
              tab === "knowledge" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <BookOpen className="w-4 h-4" />
            Knowledge Base
          </button>
          <button
            onClick={() => setTab("sessions")}
            className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
              tab === "sessions" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            Chat Sessions
          </button>
        </div>

        {tab === "users" && <UsersTab />}
        {tab === "knowledge" && <KnowledgeTab />}
        {tab === "sessions" && <SessionsTab />}
      </main>
    </div>
  );
}
