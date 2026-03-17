# IPA Resign — Web-Based iOS App Signing Platform

A full-stack web application for resigning iOS IPA files, built with an Apple-inspired design.

## Features

- 🔏 **IPA Resigning** — Upload any IPA file and resign it with your certificate
- 📱 **Apple-inspired UI** — Clean, minimal design with dark/light mode
- 🔐 **Certificate Management** — Upload and manage P12 certificates and provisioning profiles
- 📦 **App Library** — Browse IPAs from online repositories
- 👥 **User Management** — Accounts, storage quotas, and admin controls
- 📊 **Admin Dashboard** — Statistics and charts with real-time data
- 🔄 **Real-time Progress** — Socket.IO powered live signing progress
- 📱 **Mobile-First** — Bottom tab bar on mobile, sidebar on desktop

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React, TypeScript, Tailwind CSS, Vite, Zustand, Recharts |
| Backend | Node.js, Express, TypeScript, Prisma ORM |
| Database | SQLite (dev) |
| Real-time | Socket.IO |
| Auth | JWT + bcryptjs |
| Testing | Jest + Supertest |

## Quick Start

```bash
# Backend
cd backend && npm install
cp .env.example .env
npx prisma migrate dev --name init
npm run dev

# Frontend (new terminal)
cd frontend && npm install
npm run dev
```

Visit http://localhost:5173 · Default admin: `admin@example.com` / `admin123`

## Documentation

- [API Reference](docs/API.md)
- [Setup Guide](docs/SETUP.md)
- [Architecture](docs/ARCHITECTURE.md)

## Docker

```bash
docker-compose up -d
```

Frontend: http://localhost:80 | Backend: http://localhost:3001