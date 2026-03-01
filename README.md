# 🏏 CricScore - Live Cricket Scoring & Tournament Management

A full-stack, real-time cricket scoring platform built with React, Node.js, MongoDB, and Socket.io.

## Features

- **Tournament Management**: Create tournaments, add teams, auto-calculated points table with NRR
- **Live Ball-by-Ball Scoring**: Dynamic scoring interface with runs, extras, wickets, auto-stats
- **Real-Time Updates**: Socket.io powered live score synchronization across all devices
- **Public Scoreboard**: Big-screen optimized live view (no admin controls)
- **Analytics Dashboard**: Charts for top scorers, wicket takers, player roles, match stats
- **Role-Based Auth**: Admin, Coordinator, Scorer, Viewer roles with JWT
- **Auto-Calculated Stats**: CRR, RRR, Strike Rate, Economy, NRR, Batting Average, Partnerships
- **Dark/Light Mode**: Toggle with system preference detection
- **Responsive Design**: Mobile, tablet, and desktop layouts
- **Lazy Loading**: Code-split pages for optimal performance

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite 7, Tailwind CSS v4, Zustand, React Router, Recharts |
| Backend | Node.js, Express 5, Mongoose, Socket.io, JWT |
| Database | MongoDB |
| Real-time | Socket.io |

## Quick Start

### Prerequisites
- Node.js 18+
- MongoDB running locally (or MongoDB Atlas URI)

### 1. Backend Setup
```bash
cd server
npm install
# Edit .env if needed (MongoDB URI, JWT secret)
npm run seed    # Seeds demo data (2 teams, 22 players, 1 tournament)
npm run dev     # Starts server on port 5000
```

### 2. Frontend Setup
```bash
cd client
npm install
npm run dev     # Starts on http://localhost:5173
```

### Demo Credentials
| Role | Email | Password |
|------|-------|----------|
| Admin | admin@cricket.com | password123 |
| Coordinator | coordinator@cricket.com | password123 |
| Scorer | scorer@cricket.com | password123 |
| Viewer | viewer@cricket.com | password123 |

## Project Structure

```
├── client/                    # React frontend
│   └── src/
│       ├── api/               # Axios service layer
│       ├── components/        # Reusable UI (Layout, Modal, Cards)
│       ├── pages/             # Route pages (10 pages)
│       ├── store/             # Zustand stores (auth, match, theme)
│       └── index.css          # Design system
├── server/                    # Express backend
│   ├── config/                # Database config
│   ├── controllers/           # 6 controllers
│   ├── middleware/             # JWT auth + role guard
│   ├── models/                # 5 Mongoose models
│   ├── routes/                # 6 route files
│   ├── services/              # Scoring engine
│   ├── socket/                # Socket.io handlers
│   └── utils/                 # Seed script
└── README.md
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/register | Register user |
| POST | /api/auth/login | Login |
| GET | /api/teams | List teams |
| POST | /api/teams | Create team |
| GET | /api/players | List/search players |
| POST | /api/players | Add player |
| GET | /api/tournaments | List tournaments |
| POST | /api/tournaments | Create tournament |
| GET | /api/matches | List matches |
| POST | /api/matches | Create match |
| POST | /api/matches/:id/toss | Set toss |
| POST | /api/matches/:id/start | Start match |
| POST | /api/scoring/:id/ball | Record delivery |
| POST | /api/scoring/:id/undo | Undo last ball |

## Scoring Engine

The scoring engine (`server/services/scoringEngine.js`) automatically handles:
- Ball-by-ball recording with full validation
- Extras calculation (Wide, No Ball, Bye, Leg Bye)
- Wicket processing with 8 dismissal types
- Strike rotation on odd runs and end of over
- Maiden over detection
- CRR and RRR calculation
- Partnership tracking
- Fall of wickets timeline
- Tournament NRR and points table updates
- Player career stats aggregation after match completion

## License

MIT
