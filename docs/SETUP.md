# Setup Guide

## Prerequisites
- Node.js 20+
- npm 9+
- Docker & Docker Compose (optional)

---

## Quick Start (Development)

### 1. Clone the repository

```bash
git clone <repo-url>
cd Ipa-web-resign
```

### 2. Backend Setup

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your settings

# Initialize the database
npx prisma migrate dev --name init

# Start the development server
npm run dev
```

The backend runs on **http://localhost:3001**.

On first startup, a default admin user is created:
- **Email:** admin@example.com
- **Password:** admin123

### 3. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The frontend runs on **http://localhost:5173**.

---

## Production with Docker Compose

```bash
cp .env.example .env
# Edit .env with production secrets

docker-compose up -d
```

Frontend: http://localhost:80
Backend: http://localhost:3001

---

## Environment Variables

### Backend `.env`

| Variable | Default | Description |
|---|---|---|
| `PORT` | 3001 | Server port |
| `DATABASE_URL` | `file:./dev.db` | SQLite database path |
| `JWT_SECRET` | — | Secret key for JWT signing |
| `JWT_EXPIRES_IN` | `7d` | JWT expiry |
| `ENCRYPTION_KEY` | — | 32-char key for encrypting cert data |
| `UPLOAD_DIR` | `./uploads` | File upload directory |
| `MAX_FILE_SIZE` | 524288000 | Max upload size in bytes (500MB) |
| `CORS_ORIGIN` | `http://localhost:5173` | Allowed CORS origin |
| `LOG_LEVEL` | `info` | Logging level |

---

## Running Tests

```bash
cd backend
DATABASE_URL="file:./test.db" npx prisma migrate deploy
DATABASE_URL="file:./test.db" npm test
```

---

## Building for Production

### Backend
```bash
cd backend
npm run build
node dist/server.js
```

### Frontend
```bash
cd frontend
npm run build
# Serve dist/ with any static file server
```
