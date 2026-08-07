# Cachet - Backend

The REST API for **Cachet**, a secure digital document vault. Built with Node.js and Express, this handles authentication, document storage, sharing, and activity tracking.

Frontend repository: [cachet-frontend](https://github.com/zahrabatoolmns-skech/cachet-frontend)

## Features

-  JWT-based authentication (email/password + Google Sign-In)
-  Document CRUD with Cloudinary file storage
-  Search, filter, and sort documents
-  Automated expiry reminder checks (via `node-cron`)
-  Time-limited, password-protectable share links
-  Storage usage tracking per user
-  Activity logging (uploads, views, shares, deletions)
-  Bulk document import via ZIP upload
-  Security hardening - Helmet, rate limiting, MongoDB injection sanitization

## Tech Stack

- **Runtime**: Node.js + Express
- **Database**: MongoDB + Mongoose
- **Auth**: JWT + bcrypt, Google OAuth token verification
- **File storage**: Cloudinary (via Multer)
- **Email**: Nodemailer
- **Scheduled jobs**: node-cron
- **Security**: Helmet, express-rate-limit

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB instance (local or [MongoDB Atlas](https://www.mongodb.com/atlas))
- [Cloudinary](https://cloudinary.com) account
- Google OAuth Client ID ([Google Cloud Console](https://console.cloud.google.com))

### Installation

```bash
git clone https://github.com/zahrabatoolmns-sketch/cachet-backend.git
cd cachet-backend
npm install
```
```

### Run locally

```bash
npm run dev
```

Server runs on `http://localhost:5000`.

## API Overview

| Route | Description |
|---|---|
| `POST /api/auth/signup` | Create account |
| `POST /api/auth/login` | Email/password login |
| `POST /api/auth/google-token` | Google Sign-In |
| `POST /api/auth/forgot-password` | Request password reset |
| `POST /api/auth/reset-password/:token` | Reset password |
| `GET /api/documents` | List documents (search/filter/sort) |
| `POST /api/documents/upload` | Upload a document |
| `POST /api/documents/upload-zip` | Bulk import via ZIP |
| `PUT /api/documents/:id` | Update document (rename, category, tags) |
| `DELETE /api/documents/:id` | Delete document |
| `POST /api/share/create/:documentId` | Create a share link |
| `POST /api/share/access/:token` | Access a shared document (public) |
| `GET /api/users/profile` *(via PUT)* | Update profile / avatar |
| `PUT /api/users/password` | Change password |
