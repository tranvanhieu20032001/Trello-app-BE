# Trello Clone – Backend (NestJS)

This is the backend API for the Trello Clone project, built with NestJS and PostgreSQL. It supports RESTful APIs, authentication, real-time WebSocket collaboration, Google OAuth, email service, and file uploads.

## Tech Stack

- NestJS (TypeScript)
- PostgreSQL (Supabase hosting)
- Prisma ORM
- WebSockets (real-time)
- JWT authentication with HTTP-only cookies
- Google OAuth 2.0
- Nodemailer for sending emails
- Support for Google Drive file attachments

## Project Setup

1. Clone the repository:

git clone https://github.com/tranvanhieu20032001/Trello-app-BE
cd trello-backend

2. Install dependencies:

npm install

3. Create a `.env` file in the root directory and configure the following environment variables:

PORT=3002  
FE_URL=http://localhost:5173

DATABASE_URL=""
DIRECT_URL=""

EMAIL_APP=""
EMAIL_PASSWORD=""

JWT_SECRET="" 
JWT_REFRESH_SECRET=""

GOOGLE_CLIENT_ID=""
GOOGLE_SECRET=""
GOOGLE_CALLBACK_URL=http://localhost:3002/api/v1/auth/google/redirect

## Run the Project

Development mode:

npm run start

Watch mode with auto-reload:

npm run start:dev

Production mode:

npm run start:prod

