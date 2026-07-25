# LeadDesk Mini

A production-ready **Lead Management System** built with the MERN stack. Capture leads on a public landing page, manage them from a secure admin dashboard.

🌐 **Live Demo**: [Frontend on Vercel](#) · [Backend on Render](#)

---

## ✨ Features

- 📋 **Public Lead Form** — Name, Email, Budget Range, Message with client + server validation  
- 🔐 **JWT Authentication** — Secure admin login with bcrypt-hashed passwords  
- 📊 **Admin Dashboard** — Search, filter, paginate, update status, delete leads  
- 🚦 **Lead Statuses** — New → Contacted → Closed pipeline  
- 🌍 **Production Deployed** — Vercel (frontend) + Render (backend) + MongoDB Atlas

---

## 🗂 Project Structure

```
Lead Management System/
├── client/                     # React + Vite + Tailwind CSS
│   ├── src/
│   │   ├── context/AuthContext.jsx   # JWT state management
│   │   ├── lib/api.js                # Axios instance + interceptors
│   │   ├── pages/
│   │   │   ├── LandingPage.jsx       # Public lead form
│   │   │   ├── AdminLogin.jsx        # Admin login
│   │   │   └── Dashboard.jsx         # Protected admin dashboard
│   │   └── components/
│   │       └── ProtectedRoute.jsx    # JWT route guard
│   └── .env.local                    # VITE_API_URL
│
└── server/                     # Node.js + Express
    ├── controllers/
    │   ├── authController.js         # register, login, me
    │   └── leadsController.js        # CRUD + search + stats
    ├── middleware/
    │   └── auth.js                   # JWT verification
    ├── models/
    │   ├── Admin.js                  # bcrypt schema
    │   └── Lead.js                   # Lead schema
    ├── routes/
    │   ├── auth.js                   # /api/auth/*
    │   └── leads.js                  # /api/leads/*
    ├── scripts/
    │   └── seedAdmin.js              # One-time admin seed
    └── .env                          # MONGO_URI, JWT_SECRET, etc.
```

---

## 🗄 Database Schema

### Admin Collection
```js
{
  name:         String,   // required
  email:        String,   // required, unique, lowercase
  passwordHash: String,   // bcrypt 12 rounds, never returned in API
  createdAt:    Date,
  updatedAt:    Date
}
```

### Lead Collection
```js
{
  name:        String,   // 2–100 chars, required
  email:       String,   // valid email, required
  budgetRange: String,   // enum: 5 options, required
  message:     String,   // 10–2000 chars, required
  status:      String,   // enum: New | Contacted | Closed, default: New
  createdAt:   Date,
  updatedAt:   Date
}
```
**Indexes**: `{ name, email, message }` text index for search · `{ status }` · `{ createdAt: -1 }`

---

## 🔐 Authentication Approach

| Step | Detail |
|------|--------|
| **Registration** | `POST /api/auth/register` — only works when zero admins exist |
| **Password Storage** | bcrypt with 12 salt rounds, never stored in plain text |
| **Token** | JWT signed with `JWT_SECRET`, valid for 7 days |
| **Protected Routes** | `Authorization: Bearer <token>` header verified by middleware |
| **Frontend** | Token in `localStorage`, injected via Axios interceptor |
| **Expiry Handling** | 401 responses auto-logout + redirect to `/admin/login` |

---

## 🛠 Local Setup

### Prerequisites
- Node.js 18+
- MongoDB Atlas account (or local MongoDB)

### 1. Clone & Install

```bash
git clone https://github.com/your-username/leaddesk-mini.git
cd leaddesk-mini

# Install server dependencies
cd server && npm install

# Install client dependencies
cd ../client && npm install
```

### 2. Configure Server Environment

```bash
# server/.env
MONGO_URI=mongodb+srv://<user>:<pass>@cluster0.xxxxx.mongodb.net/leaddesk
JWT_SECRET=your_64_char_random_secret
JWT_EXPIRES_IN=7d
PORT=5000
CLIENT_URL=http://localhost:5173
ADMIN_NAME=Admin
ADMIN_EMAIL=admin@leaddesk.com
ADMIN_PASSWORD=YourStrongPassword123!
```

### 3. Seed Admin Account

```bash
cd server
npm run seed
# ✅ Admin created: admin@leaddesk.com
```

### 4. Start Development Servers

```bash
# Terminal 1 — Backend
cd server && npm run dev

# Terminal 2 — Frontend
cd client && npm run dev
```

- Public site: http://localhost:5173  
- Admin login: http://localhost:5173/admin/login  
- API: http://localhost:5000/api

---

## 🚀 Deployment

### MongoDB Atlas

1. Create free M0 cluster at [cloud.mongodb.com](https://cloud.mongodb.com)
2. **Database Access** → Add user with password
3. **Network Access** → Add `0.0.0.0/0` (allow all IPs for Render)
4. Copy the connection string for `MONGO_URI`

---

### Backend → Render

1. Push code to GitHub
2. Go to [render.com](https://render.com) → **New Web Service**
3. Connect your GitHub repo, set **Root Directory** to `server`
4. Set build command: `npm install`
5. Set start command: `npm start`
6. Add environment variables:

| Key | Value |
|-----|-------|
| `MONGO_URI` | Your Atlas connection string |
| `JWT_SECRET` | 64-char random secret |
| `JWT_EXPIRES_IN` | `7d` |
| `CLIENT_URL` | Your Vercel URL (e.g. `https://leaddesk.vercel.app`) |
| `NODE_ENV` | `production` |

7. Deploy → copy the Render URL (e.g. `https://leaddesk-server.onrender.com`)
8. **After first deploy**: run the seed via Render Shell tab:
   ```bash
   ADMIN_EMAIL=you@email.com ADMIN_PASSWORD=YourPass npm run seed
   ```

---

### Frontend → Vercel

1. Go to [vercel.com](https://vercel.com) → **New Project**
2. Import your GitHub repo, set **Root Directory** to `client`
3. Add environment variable:

| Key | Value |
|-----|-------|
| `VITE_API_URL` | `https://leaddesk-server.onrender.com/api` |

4. Deploy → your public URL is live!

---

## 📡 API Reference

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/auth/register` | None | Create first admin |
| `POST` | `/api/auth/login` | None | Returns JWT token |
| `GET`  | `/api/auth/me` | JWT | Current admin info |
| `POST` | `/api/leads` | None | Submit lead form |
| `GET`  | `/api/leads/admin` | JWT | List leads (search, filter, paginate) |
| `PATCH`| `/api/leads/admin/:id/status` | JWT | Update lead status |
| `DELETE`| `/api/leads/admin/:id` | JWT | Delete a lead |

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite + Tailwind CSS v3 |
| Backend | Node.js + Express |
| Database | MongoDB Atlas + Mongoose |
| Auth | JWT (`jsonwebtoken`) + bcrypt (`bcryptjs`) |
| Validation | express-validator (server) + custom hooks (client) |
| HTTP Client | Axios |
| Routing | React Router DOM v6 |
| Notifications | react-hot-toast |
| Deployment | Vercel (frontend) + Render (backend) |
