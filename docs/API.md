# API Documentation

Base URL: `http://localhost:3001/api`

Authentication: Bearer token in `Authorization` header.

---

## Authentication

### POST /auth/register
Register a new user.

**Body:**
```json
{ "email": "user@example.com", "password": "password123", "username": "johndoe" }
```

**Response 201:**
```json
{ "token": "<jwt>", "user": { "id": "...", "email": "...", "username": "...", "isAdmin": false } }
```

---

### POST /auth/login
Login with credentials.

**Body:**
```json
{ "email": "user@example.com", "password": "password123" }
```

**Response 200:**
```json
{ "token": "<jwt>", "user": { ... } }
```

---

### GET /auth/me
Get currently authenticated user.

**Headers:** `Authorization: Bearer <token>`

**Response 200:**
```json
{ "user": { "id": "...", "email": "...", "username": "...", "isAdmin": false, ... } }
```

---

### POST /auth/logout
Logout (client should discard the token).

**Response 200:**
```json
{ "message": "Logged out successfully" }
```

---

## Users

All user routes require authentication.

### GET /users/profile
Get current user's full profile.

### PATCH /users/profile
Update username or avatar.

**Body:**
```json
{ "username": "newname" }
```

### POST /users/change-password
Change password.

**Body:**
```json
{ "currentPassword": "old", "newPassword": "new" }
```

### GET /users/resign-history?page=1&limit=20
Get current user's resign job history.

---

## Certificates

All certificate routes require authentication.

### GET /certificates
List user's certificates.

### POST /certificates
Upload a certificate (multipart/form-data).

**Fields:**
- `p12` (file, required)
- `mobileprovision` (file, optional)
- `teamName`, `teamId`, `bundleId`, `isPublic`

### GET /certificates/:id
Get a single certificate.

### PATCH /certificates/:id
Update certificate metadata.

### DELETE /certificates/:id
Delete a certificate.

---

## Resign Jobs

All resign routes require authentication.

### POST /resign
Submit a new resign job (multipart/form-data).

**Fields:**
- `ipa` (file, required)
- `certificateId` (optional)

### GET /resign?page=1&limit=20
List user's resign jobs.

### GET /resign/:id
Get a specific resign job.

### GET /resign/download/:id
Download the resigned IPA.

---

## Repositories

Public read, authenticated write.

### GET /repositories
List all repositories.

### POST /repositories
Add a repository (requires auth).

**Body:**
```json
{ "url": "https://...", "name": "My Repo", "description": "..." }
```

### GET /repositories/:id/apps
Fetch apps from a repository's URL.

### DELETE /repositories/:id
Remove a repository (requires auth).

---

## Admin

All admin routes require admin role.

### GET /admin/stats
Dashboard statistics.

### GET /admin/users?page=1&limit=20&search=
List all users.

### PATCH /admin/users/:id
Update user (isAdmin, isBanned, storageQuota, password).

### DELETE /admin/users/:id
Delete a user.

### GET /admin/certificates?page=1&limit=20
List all certificates across users.

### GET /admin/logs?page=1&limit=20
Admin action logs.

---

## WebSocket Events

Connect to the Socket.IO server at `/socket.io`.

### `resign:progress:<jobId>`
Emitted during resigning.
```json
{ "progress": 50, "message": "Applying new signature..." }
```

### `resign:complete:<jobId>`
Emitted when job finishes.
```json
{ "job": { "id": "...", "status": "success", "downloadUrl": "..." } }
```
