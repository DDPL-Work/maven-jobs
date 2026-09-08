# Lead Generator Panel

This folder is frontend-only (new panel like CRM/Admin/Candidate).

- Frontend root: `Lead-Generator/`
- Shared backend: `maven-qr/server`

## Frontend Setup

1. Install dependencies:
   `npm install`
2. Create `.env` from `.env.example` (optional if using default API URL)
3. Run:
   `npm run dev`

## Backend Route Used

The panel calls the shared server endpoint:

- Base: `/api/v1/lead-generator`
- Meta: `GET /meta`
- Dashboard: `GET /dashboard`
- Create lead: `POST /leads`

Note:

- This endpoint is protected in shared server (`protectCRM` + role checks).
- The panel automatically sends `sessionStorage.token` as Bearer token.

If your server is running on localhost:

- Frontend default API: `http://localhost:5000/api/v1/lead-generator`
