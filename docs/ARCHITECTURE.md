# Architecture

## Overview

IPA Resign is a full-stack web application that provides a web-based interface for resigning iOS IPA files.

```
┌─────────────────────────────────────────────────────┐
│                      Browser                        │
│   React + TypeScript + TailwindCSS + Zustand        │
│                                                     │
│  ┌──────────┐  ┌──────────┐  ┌────────────────────┐│
│  │   Auth   │  │ Home/IPA │  │  Admin Dashboard   ││
│  │  Pages   │  │  Upload  │  │  (Charts/Tables)   ││
│  └──────────┘  └──────────┘  └────────────────────┘│
└───────────────────────┬─────────────────────────────┘
                        │ HTTP / WebSocket
                        ▼
┌─────────────────────────────────────────────────────┐
│                   Express Backend                    │
│              Node.js + TypeScript                   │
│                                                     │
│  ┌──────────┐  ┌──────────┐  ┌────────────────────┐│
│  │   Auth   │  │  Resign  │  │       Admin        ││
│  │ Routes   │  │ Service  │  │      Routes        ││
│  └──────────┘  └──────────┘  └────────────────────┘│
│                                                     │
│  ┌────────────────────┐  ┌─────────────────────────┐│
│  │   Socket.IO        │  │   In-Memory Job Queue   ││
│  │  (Real-time events)│  │   (Simple async queue)  ││
│  └────────────────────┘  └─────────────────────────┘│
└───────────────────────┬─────────────────────────────┘
                        │ Prisma ORM
                        ▼
                ┌───────────────┐
                │  SQLite (dev) │
                │  PostgreSQL   │
                │   (prod)      │
                └───────────────┘
```

## Directory Structure

```
Ipa-web-resign/
├── backend/
│   ├── prisma/
│   │   └── schema.prisma       # Database schema
│   ├── src/
│   │   ├── config/             # Database & JWT config
│   │   ├── controllers/        # Request handlers
│   │   ├── middleware/         # Auth, admin, upload middleware
│   │   ├── models/             # Prisma re-exports
│   │   ├── routes/             # Express route definitions
│   │   ├── services/           # Business logic
│   │   ├── utils/              # Crypto, logger utilities
│   │   ├── __tests__/          # Jest tests
│   │   ├── app.ts              # Express app
│   │   ├── server.ts           # Entry point
│   │   └── seed.ts             # Database seed
│   └── uploads/                # Uploaded & resigned files
│
├── frontend/
│   └── src/
│       ├── components/
│       │   ├── Common/         # Reusable UI components
│       │   └── Layout/         # Layout components
│       ├── hooks/              # React hooks
│       ├── pages/              # Page components
│       ├── services/           # API client
│       ├── store/              # Zustand state management
│       ├── types/              # TypeScript type definitions
│       ├── App.tsx             # Route definitions
│       └── main.tsx            # Entry point
│
├── docs/                       # Documentation
└── docker-compose.yml          # Production compose file
```

## Key Design Decisions

### Authentication
- JWT-based stateless authentication
- Tokens stored in Zustand store (persisted to localStorage)
- Auth middleware validates tokens on protected routes

### Certificate Storage
- P12 and mobileprovision data encrypted with AES-256-CBC
- Encrypted base64 stored in the database (no raw files on disk)
- Encryption key configurable via environment variable

### IPA Resigning
- Jobs queued in a simple in-memory async queue
- Simulated resigning (copies the file) since ldid2 is not in scope
- Real-time progress via Socket.IO events
- Polling fallback for environments where WebSockets are unavailable

### File Storage
- Uploaded IPA files stored on disk with UUID filenames
- Resigned IPAs stored in `uploads/resigned/` subdirectory
- Original files deleted after processing

### Admin
- First registered user automatically becomes admin
- Seeded admin: admin@example.com / admin123 (if no users exist)
- Admin actions logged to `AdminLog` table

## Data Flow: IPA Resign

1. User uploads IPA → `POST /api/resign` (multipart)
2. File saved to disk by Multer
3. `ResignJob` record created with `status: pending`
4. Job added to in-memory queue
5. Queue processes job:
   - Updates status to `processing`
   - Simulates signing steps (delays)
   - Emits `resign:progress:<id>` via Socket.IO at each step
   - Copies file to `uploads/resigned/`
   - Updates status to `success` with `downloadUrl`
6. Client receives completion via Socket.IO or polling
7. User downloads via `GET /api/resign/download/:id`
