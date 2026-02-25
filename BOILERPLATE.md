# ContextFlow AI - Boilerplate Template

A modern, AI-powered content creation platform built with Next.js. This boilerplate includes a rich dark-themed frontend with Framer Motion animations and a complete backend API structure with AWS and cloud service integrations.

## 🚀 Quick Start

```bash
# 1. Clone the repository
git clone https://github.com/TinaThakre/contextflow.git
cd contextflow

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env.local

# 4. Run development server
npm run dev
```

---

## 📁 Project Structure

```
contextflow-web/
├── .env.example                    # Environment variables template
├── package.json                    # Dependencies
├── src/
│   ├── middleware.ts              # Route protection & auth
│   ├── app/
│   │   ├── (auth)/               # Auth pages
│   │   │   ├── login/page.tsx
│   │   │   └── signup/page.tsx
│   │   ├── (dashboard)/           # Protected dashboard
│   │   │   ├── layout.tsx         # Dashboard sidebar
│   │   │   └── dashboard/page.tsx
│   │   ├── api/                   # API routes
│   │   │   ├── auth/
│   │   │   │   ├── login/route.ts
│   │   │   │   └── signup/route.ts
│   │   │   └── content/
│   │   │       └── generate/route.ts
│   │   ├── globals.css            # Rich dark theme
│   │   ├── layout.tsx
│   │   └── page.tsx               # Landing page
│   ├── components/ui/              # UI components
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Input.tsx
│   │   └── index.ts
│   └── lib/                       # Backend libraries
│       ├── config.ts              # Environment config
│       ├── supabase.ts           # Database client
│       ├── aws.ts                 # AWS S3
│       ├── utils.ts
│       └── index.ts
```

---

## 🎨 Theme Features

- **Rich Dark Background**: `#0a0a0f` base with layered tones
- **Vibrant Accents**: Purple (`#8b5cf6`), Cyan (`#06b6d4`), Pink (`#f472b6`)
- **Gradient Effects**: Hero, card, and glow gradients
- **Animations**: Framer Motion staggered animations
- **Responsive**: Mobile-first with collapsible sidebar

---

## 🔐 Environment Variables (.env.example)

Copy `.env.example` to `.env.local` and fill in your credentials:

### App Configuration
```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

### Database - Supabase
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### AWS Credentials
```env
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_REGION=us-east-1
AWS_S3_BUCKET_NAME=contextflow-images
```

### Google Cloud (Vertex AI)
```env
GOOGLE_CLOUD_PROJECT=your-gcp-project
GOOGLE_CLOUD_LOCATION=us-central1
```

### Pinecone (Vector Database)
```env
PINECONE_API_KEY=your-pinecone-key
PINECONE_ENVIRONMENT=us-east-1-aws
PINECONE_INDEX_NAME=contextflow-content
```

### Upstash (Redis + QStash)
```env
UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-token
QSTASH_URL=https://qstash.upstash.io
QSTASH_TOKEN=your-qstash-token
```

### Stripe (Payments)
```env
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxx
```

### Resend (Email)
```env
RESEND_API_KEY=re_xxx
EMAIL_FROM=noreply@contextflow.ai
```

### JWT & Encryption
```env
JWT_SECRET=your-32-character-secret
ENCRYPTION_KEY=your-32-character-key
```

---

## 📦 Dependencies

### Core
- `next` - React framework
- `react` / `react-dom` - UI library

### UI & Animations
- `framer-motion` - Animations
- `lucide-react` - Icons
- `tailwindcss` - Styling

### Backend
- `@supabase/supabase-js` - Database
- `@aws-sdk/client-s3` - AWS S3
- `@google/generativeai` - Vertex AI
- `@anthropic-ai/sdk` - Claude
- `@upstash/redis` - Caching
- `@upstash/qstash` - Job queue
- `stripe` - Payments

### Validation
- `zod` - Schema validation

---

## 🔌 API Routes

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/signup` | Register new user |
| POST | `/api/auth/login` | Sign in user |

### Content
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/content/generate` | Generate AI content |

---

## 🖥️ Pages

| Route | Description |
|-------|-------------|
| `/` | Landing page with hero, features, pricing |
| `/login with` | User login OAuth |
| `/signup` | User registration |
| `/dashboard` | Main dashboard with stats |
| `/dashboard/generate` | Content generation |
| `/dashboard/analytics` | Performance analytics |
| `/dashboard/voice-dna` | Voice DNA analysis |
| `/dashboard/calendar` | Content calendar |
| `/dashboard/settings` | User settings |

---

## 🛠️ Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

---

## 🎯 Design System

### Colors
```css
:root {
  --background: #0a0a0f;
  --primary: #8b5cf6;
  --secondary: #06b6d4;
  --accent: #f472b6;
  --success: #10b981;
  --warning: #f59e0b;
  --error: #ef4444;
}
```

### Components
- **Button**: Primary, secondary, outline, ghost, danger variants
- **Card**: Default, elevated, outline, glass variants
- **Input**: With icons, password visibility, validation

---

## 📱 Responsive Breakpoints

- Mobile: < 640px
- Tablet: 640px - 1024px
- Desktop: > 1024px

---

## 🔒 Security

- JWT-based authentication
- Route protection via middleware
- Server-side Supabase client for API routes
- Input validation with Zod

---

## 📄 License

MIT License - feel free to use this template for your projects.

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request
