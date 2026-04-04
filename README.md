# EduAssistant — AI Education Assistant

> Your intelligent, multilingual AI-powered learning companion built by **Muzamil Arshid**

🌐 **Live Demo:** [muzamilai.replit.app](https://muzamilai.replit.app)

---

## What is EduAssistant?

EduAssistant is a full-stack AI education platform that lets anyone ask questions in any language and receive accurate, context-aware answers instantly. It combines two leading AI models with a curated knowledge base for reliable, educational responses.

---

## Features

- **Dual AI Models** — GPT + Gemini working together for smarter answers
- **TF-IDF Knowledge Base** — curated knowledge retrieval using cosine similarity
- **Streaming Responses** — answers appear word by word in real time
- **Voice Assistant** — speak your question, hear the answer (STT + TTS + hands-free Voice Mode)
- **Full Multilingual Support** — ask in any language, get answers in the same language
- **Multi-Session Chat History** — all your conversations saved with a sidebar for easy access
- **User Authentication** — secure sign up and sign in
- **Admin Panel** — manage users, knowledge base entries, and view chat sessions
- **PWA Installable** — install on any phone or desktop like a native app
- **Interactive Landing Page** — with animated modals explaining how the AI works

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React + Vite + TypeScript + Tailwind CSS |
| Backend | Node.js + Express + TypeScript |
| Database | PostgreSQL + Drizzle ORM |
| AI | OpenAI GPT + Google Gemini |
| Auth | JWT + bcrypt |
| Voice | Web Speech API (STT) + SpeechSynthesis (TTS) |
| PWA | Vite PWA Plugin + Workbox |
| Monorepo | pnpm workspaces |

---

## Getting Started

### Prerequisites
- Node.js 18+
- pnpm
- PostgreSQL database

### Environment Variables

Create the following secrets in your environment:

```
ADMIN_USERNAME=your_admin_username
ADMIN_PASSWORD=your_admin_password
SESSION_SECRET=your_session_secret
JWT_SECRET=your_jwt_secret
DATABASE_URL=your_postgresql_connection_string
OPENAI_API_KEY=your_openai_api_key
GEMINI_API_KEY=your_gemini_api_key
```

### Install & Run

```bash
# Install dependencies
pnpm install

# Run database migrations
pnpm --filter @workspace/db run migrate

# Start the API server
pnpm --filter @workspace/api-server run dev

# Start the frontend
pnpm --filter @workspace/edu-assistant run dev
```

---

## Admin Panel

Access the admin panel at `/admin` with your configured credentials.

- **Users tab** — view all registered users
- **Knowledge Base tab** — add, edit, and delete knowledge entries
- **Chat Sessions tab** — review all user conversations
- **Stats** — live counts of users, sessions, and messages

---

## Project Structure

```
├── artifacts/
│   ├── edu-assistant/     # React frontend
│   └── api-server/        # Express backend
├── lib/
│   ├── db/                # Database schema & migrations (Drizzle)
│   └── api-client-react/  # Shared API client hooks
```

---

## License

MIT License — free to use, modify, and distribute.

---

Built with by **Muzamil Arshid**
