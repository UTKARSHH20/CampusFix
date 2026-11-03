# CampusFix

CampusFix is organized as a frontend and backend workspace. The existing Next.js application is in `frontend/`. The `backend/` folder is ready for the backend service you plan to add.

## Run the frontend

```powershell
cd frontend
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Copy `frontend/.env.example` to `frontend/.env.local` and fill in the Firebase values. The Gemini API key belongs in `frontend/.env.local` as `GEMINI_API_KEY`; it stays server-side and must not use the `NEXT_PUBLIC_` prefix.

See [frontend/README.md](frontend/README.md) for Firebase and AI setup notes. Add your backend implementation inside `backend/` when ready.
