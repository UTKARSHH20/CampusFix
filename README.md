# CampusFix

Next.js App Router application for a campus complaint and grievance portal.

## Firebase authentication and rules

Google sign-in uses Firebase Authentication. User profiles are stored at `users/{Firebase Auth UID}` with a `role` field (`student` or `admin`). First-time login creates a student profile; it never creates or promotes an administrator. Admin roles must be granted by a trusted Firebase project administrator through the Firebase Console or a trusted server using the Admin SDK. The Firestore rules prevent users from changing their own role.

The Firebase rules are in `firestore.rules`. The current Next.js app stores complaints at `complaints/{autoId}` (`studentId` is the owner UID); students may create and read their own reports, while admins manage all reports. Notifications use `notifications/{autoId}` (`recipientUid` is the recipient UID), and activity history uses append-only `activityLogs/{autoId}`. Unknown collections are denied by default.

The Firebase Auth UID `FnVGalePiRhNiXv55CpFDT8MG6I3` is the initial administrator bootstrap identity. On its next Google sign-in, the app creates or promotes only that account's own profile to admin. Firestore rules compare the signed-in Firebase Auth UID, not a role supplied by the frontend. Change this allowlisted UID in both `firestore.rules` and `src/components/login-panel.tsx` before using a different bootstrap account.

### Publish Firestore rules with Firebase CLI

From this project folder, sign in to the Firebase CLI, then deploy only the Firestore rules to the configured Firebase project:

```powershell
npx firebase-tools login
npx firebase-tools deploy --only firestore:rules --project campus-complain-9967a
```

The project needs a Firestore database created first. Alternatively, open Firebase Console → Firestore Database → Rules, paste the contents of `firestore.rules`, and select **Publish**. Confirm the Console is showing project `campus-complain-9967a`; deploying rules to another project will not fix the login error.

## Run locally

```powershell
npm install
npm run dev
```

Open `http://localhost:3000`.

## Local configuration

Copy `.env.example` to `.env.local` and fill in the Firebase web app values from Firebase Console → Project settings → Your apps. Enable Google under Authentication → Sign-in method and authorize `localhost` under Authentication → Settings → Authorized domains.

Needed values: `apiKey`, `authDomain`, `projectId`, `storageBucket`, and `appId`. These are Firebase web app settings, not Google passwords or service-account credentials. Do not send passwords, a service-account JSON file, or a Gemini API key. The Gemini key will be added as a server-only environment variable in a later phase.

The application also needs Google enabled under Authentication → Sign-in method and `localhost` added under Authentication → Settings → Authorized domains. Do not enter a Google account password in CampusFix; Firebase's Google popup handles sign-in.

## Admin AI features

The admin dashboard includes Gemini complaint triage and a weekly pattern report. Gemini requests run on the server and verify the signed-in administrator against their Firestore profile before analyzing complaints. Only complaint text and operational fields are sent; student identifiers are excluded. Suggestions do not update or assign a complaint until an admin applies and saves them.

The app uses Gemma 4 26B A4B through the Gemini API by default. To enable it locally, create an API key in [Google AI Studio](https://aistudio.google.com/app/apikey), add `GEMINI_API_KEY=your-key` to `.env.local` (server-side only; never use a `NEXT_PUBLIC_` prefix), and restart the development server. Google currently lists Gemma 4 input and output as free of charge on its Free Tier, subject to project quotas and eligibility. Without the key, quick text-based triage is still shown, while Gemma actions explain that setup is needed.
