# NestedCommentCraft

A full-stack, production-ready web application for threaded (nested) comments, built with **React**, **Express**, **TypeScript**, and **PostgreSQL**. Features include authentication, real-time notifications, and a modern, responsive UI.

![Preview](preview_1.png)

---

## Features

- **Threaded Comments:** Supports infinite nesting (with a UI limit for readability).
- **Authentication:** Register, login, and JWT-based session management.
- **Comment Editing/Deleting:** Users can edit or delete their comments within 15 minutes of posting.
- **Comment Restoration:** Recently deleted comments can be restored within a grace period.
- **Notifications:** Get notified when someone replies to your comment or mentions you.
- **Responsive UI:** Built with React, Tailwind CSS, and shadcn/ui components.
- **API-first:** RESTful API with JWT authentication.
- **Production Ready:** Dockerized, scalable, and easy to deploy.

---

## Tech Stack

- **Frontend:** React, TypeScript, Tailwind CSS, shadcn/ui, TanStack Query
- **Backend:** Express, TypeScript, Drizzle ORM, PostgreSQL, JWT
- **Database:** PostgreSQL (schema managed with Drizzle ORM)
- **Other:** Docker, Vite, esbuild

---

## Getting Started

### Prerequisites

- Node.js (v20+ recommended)
- PostgreSQL database
- Docker (optional, for containerized deployment)

### 1. Clone the repository

```bash
git clone https://github.com/yourusername/NestedCommentCraft.git
cd NestedCommentCraft
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env` file in the root with the following:

```env
DATABASE_URL=postgres://user:password@localhost:5432/yourdb
JWT_SECRET=your-secret-key
```

### 4. Run database migrations

```bash
npm run db:push
```

### 5. Start the development server

```bash
npm run dev
```

- The app will be available at [http://localhost:5000](http://localhost:5000)
- Both the API and frontend are served from the same port.

---

## Scripts

- `npm run dev` — Start the app in development mode
- `npm run build` — Build frontend and backend for production
- `npm start` — Start the production server
- `npm run db:push` — Apply database migrations

---

## Docker

To build and run the app with Docker:

```bash
docker build -t nested-comment-craft .
docker run -p 3000:3000 --env-file .env nested-comment-craft
```

---

## Project Structure

```
NestedCommentCraft/
  client/         # React frontend
  server/         # Express backend
  shared/         # Shared types and schema (Drizzle ORM)
  Dockerfile
  package.json
  ...
```

---

## API Overview

- `POST /api/auth/register` — Register a new user
- `POST /api/auth/login` — Login and receive JWT
- `GET /api/auth/me` — Get current user info
- `GET /api/comments` — List all comments (threaded)
- `POST /api/comments` — Post a new comment or reply
- `PUT /api/comments/:id` — Edit a comment (within 15 min)
- `DELETE /api/comments/:id` — Delete a comment (within 15 min)
- `POST /api/comments/:id/restore` — Restore a recently deleted comment
- `GET /api/notifications` — List notifications
- `PUT /api/notifications/:id/read` — Mark notification as read
- `PUT /api/notifications/mark-all-read` — Mark all as read

---

## Data Model

- **User:** `id`, `username`, `email`, `password`, `createdAt`
- **Comment:** `id`, `content`, `authorId`, `parentId`, `isDeleted`, `createdAt`, `updatedAt`
- **Notification:** `id`, `userId`, `fromUserId`, `commentId`, `type`, `isRead`, `createdAt`

---

## Customization

- UI components are built with [shadcn/ui](https://ui.shadcn.com/) and Tailwind CSS.
- Easily extend the schema in `shared/schema.ts` for more features.

---

## License

MIT

---

## Credits

- [shadcn/ui](https://ui.shadcn.com/)
- [TanStack Query](https://tanstack.com/query/latest)
- [Drizzle ORM](https://orm.drizzle.team/)
- [Vite](https://vitejs.dev/)

---

## Contributing

Pull requests are welcome! For major changes, please open an issue first to discuss what you would like to change. 