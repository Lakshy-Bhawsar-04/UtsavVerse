# UtsavVerse — Full-Stack Event Booking Platform (MERN Stack)

**Developer Credit:** Lakshy Bhawsar

UtsavVerse is organized into **two completely separate applications**:
- **`frontend/`** — React.js (`.jsx` only), HTML5, CSS3, Bootstrap 5, React Bootstrap, React Icons, React Router DOM, Axios, Context API, and `jsPDF`.
- **`backend/`** — Node.js, Express.js, MongoDB Atlas, Mongoose, JWT authentication, `bcryptjs`, `dotenv`, `multer`, and Razorpay Test Mode verification.

---

## 1. Folder Structure

```text
UtsavVerse/
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── assets/images/       # High-resolution Indian event photographs
│   │   ├── components/          # Navbar.jsx, Footer.jsx, HeroSection.jsx, EventCard.jsx, CategoryCard.jsx, ProtectedRoute.jsx
│   │   ├── context/             # AuthContext.jsx, EventContext.jsx
│   │   ├── data/eventsData.js   # Editable cities, categories, copy & INR formatters
│   │   ├── pages/               # Home, Events, EventDetails, Booking, Login, Register, UserDashboard, OrganizerDashboard, AdminDashboard, About, Contact
│   │   ├── services/            # api.js (Axios + JWT), pdfTicket.js (jsPDF ticket download)
│   │   ├── styles/              # theme.css (CSS variables), components.css
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── .env.example
│   ├── index.html
│   ├── package.json
│   └── vite.config.js           # Proxies /api & /uploads to backend (Port 5000)
│
├── backend/
│   ├── config/
│   │   └── db.js                # MongoDB Atlas connection via process.env.MONGO_URI
│   ├── controllers/             # MVC business logic (auth, user, organizer, admin, event, booking, payment, review, public)
│   ├── middleware/              # JWT protect, RBAC roles, Multer upload, validation, error handler
│   ├── models/                  # Mongoose models: users, events, bookings, payments, categories, cities, reviews, notifications
│   ├── routes/                  # Modular Express routers for every controller
│   ├── uploads/                 # Multer uploaded event images
│   ├── utils/                   # JWT token helper, unified dataStore, Indian events seed data
│   ├── app.js                   # Express app factory
│   ├── server.js                # Standalone backend server (Port 5000)
│   ├── .env.example
│   └── package.json
│
└── server.js                    # Unified preview runner (mounts backend + Vite on Port 3000)
```

---

## 2. Running Frontend and Backend Separately in VS Code

### Terminal 1 — Start the Backend (`backend/`)
```bash
cd backend
cp .env.example .env
# Add your MONGO_URI, JWT_SECRET, and optional Razorpay Test keys in backend/.env
npm install
npm run seed   # Seeds 10 categories & sample Indian events into MongoDB Atlas
npm run dev    # Starts Express API at http://localhost:5000
```

### Terminal 2 — Start the Frontend (`frontend/`)
```bash
cd frontend
cp .env.example .env
npm install
npm run dev    # Starts Vite React JSX app at http://localhost:3000
```

> `frontend/vite.config.js` automatically proxies `/api` and `/uploads` requests to `http://localhost:5000` during local development, or you can point `VITE_API_URL` in `frontend/.env` to any hosted backend URL.

---

## 3. MongoDB Atlas & MongoDB Compass Setup

1. Create a free M0 cluster in [MongoDB Atlas](https://www.mongodb.com/atlas).
2. Add a database user and whitelist your IP address under **Network Access**.
3. Copy your driver connection string:
   ```text
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/UtsavVerse?retryWrites=true&w=majority
   ```
4. Paste it into `backend/.env` as `MONGO_URI`.
5. Open **MongoDB Compass**, paste the **exact same `MONGO_URI`**, and connect to inspect collections (`users`, `events`, `bookings`, `payments`, `categories`, `cities`, `reviews`, `notifications`).

---

## 4. Customizing in VS Code

- **Colors & Typography:** Edit CSS custom properties (`--ev-primary`, `--ev-secondary`, `--ev-bg-light`) in `frontend/src/styles/theme.css`.
- **Event Photos:** Drop `.jpg` / `.png` files into `frontend/src/assets/images/` and update paths in `frontend/src/data/eventsData.js` and `backend/utils/seedData.js`.
- **Pages & Components:** Open any `.jsx` file in `frontend/src/components/` or `frontend/src/pages/` directly.

---

## 5. API Endpoints Reference

| Module | Method & Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| **Auth** | `POST /api/auth/register` | Public | Register User, Organizer, or Initial Admin |
| | `POST /api/auth/login` | Public | Login and receive JWT token |
| | `GET /api/auth/me` | Protected | Get authenticated user profile |
| | `POST /api/auth/forgot-password` | Public | Generate 6-digit password reset code |
| | `POST /api/auth/reset-password` | Public | Reset password with verification code |
| | `PUT /api/auth/change-password` | Protected | Update password while signed in |
| **Events** | `GET /api/events` | Public | Search, filter (category/city/date/INR price), sort, paginate |
| | `GET /api/events/featured` | Public | Fetch featured events |
| | `GET /api/events/upcoming` | Public | Fetch upcoming events |
| | `GET /api/events/categories` | Public | List active categories with event counts |
| | `GET /api/events/cities` | Public | List active cities with event counts |
| | `GET /api/events/:id` | Public | Event details, approved reviews & related events |
| | `POST /api/events` | Approved Organizer / Admin | Create event with ticket tiers |
| | `PUT /api/events/:id` | Owner / Admin | Update event details or ticket inventory |
| | `DELETE /api/events/:id` | Owner / Admin | Delete event |
| | `POST /api/events/upload` | Organizer / Admin | Upload event banner via Multer |
| **Bookings** | `POST /api/bookings` | Protected | Atomically reserve seats & create booking |
| | `GET /api/bookings/my-bookings` | Protected | Attendee booking history |
| | `GET /api/bookings/:id` | Owner / Organizer / Admin | Fetch booking receipt |
| | `PUT /api/bookings/:id/cancel` | Owner / Admin | Cancel booking (>=24h policy) & restore seats |
| **Payments** | `POST /api/payments/create-order` | Protected | Create Razorpay Test Mode order |
| | `POST /api/payments/verify` | Protected | Verify HMAC-SHA256 signature on backend & confirm booking |
| | `POST /api/payments/failure` | Protected | Release reserved seats on payment failure |
| **Reviews** | `GET /api/reviews/event/:eventId` | Public | List reviews for an event |
| | `POST /api/reviews` | Protected | Submit review (1 per confirmed booking) |
| **Organizer** | `GET /api/organizer/dashboard` | Organizer | Revenue stats & event performance |
| | `GET /api/organizer/events` | Organizer | Organizer's created events |
| | `GET /api/organizer/bookings` | Organizer | Bookings for organizer's events |
| | `GET /api/organizer/attendees` | Organizer | Attendee list |
| **Admin** | `GET /api/admin/dashboard` | Admin | Platform KPIs & category revenue report |
| | `GET /api/admin/organizers` | Admin | List organizers |
| | `PUT /api/admin/organizers/:id/approval` | Admin | Approve or reject organizer |
| | `PUT /api/admin/events/:id/approval` | Admin | Approve, reject, or feature event |
| | `GET/POST/PUT/DELETE /api/admin/categories` | Admin | Manage event categories |
| | `GET/POST/PUT/DELETE /api/admin/cities` | Admin | Manage event cities |
| | `GET /api/admin/users` & `PUT /api/admin/users/:id/toggle` | Admin | Manage & toggle user status |
| | `GET /api/admin/bookings`, `/payments`, `/reviews` | Admin | Platform ledger & review moderation |
