# QR-MavenJobs

Landing flow for QR visitors:

- Step 1: `SELECT YOUR ROLE`
- Candidate flow: full registration form (resume optional, all other fields mandatory)
- Submit target: existing Candidate API registration endpoint so data enters CRM-linked candidate records
- Success step: Thank-you message with app download CTA

## Environment

Create `.env` with any of:

```bash
VITE_API_BASE_URL=http://localhost:3000/api/v1
VITE_CANDIDATE_API_URL=http://localhost:3000/api/v1/candidate
VITE_CANDIDATE_APP_URL=https://your-candidate-app-url
```

`VITE_API_BASE_URL` is preferred. `VITE_CANDIDATE_API_URL` is used as fallback.

## Scripts

```bash
npm install
npm run dev
npm run build
```
