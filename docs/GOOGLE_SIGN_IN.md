# Google Sign-In

The app signs in with Google on the device, then exchanges the Google ID token
for a Supabase session with `supabase.auth.signInWithIdToken`. The web client ID
is read from `GOOGLE_WEB_CLIENT_ID` and passed to `GoogleSignin.configure`.

## What you need

- Android package name: `com.dietplanner`
- Debug SHA-1 fingerprint (and release SHA-1 when shipping)
- Google OAuth **Web application** client ID and secret
- Google OAuth **Android** client for the package and SHA-1

## 1. Get the SHA-1

Debug keystore on Windows:

```powershell
keytool -list -v `
  -alias androiddebugkey `
  -keystore "android\app\debug.keystore" `
  -storepass android -keypass android
```

The debug build's actual fingerprint is:

```
SHA1: 5E:8F:16:06:2E:A3:CD:2C:4A:0D:54:78:76:BA:A6:F3:8C:AB:F6:25
```

Do not use the default `~/.android/debug.keystore` fingerprint
(`B0:93:1F:74:04:C7:77:D4:6B:5E:7F:4E:62:68:0F:3E:3F:84:08:AB`); that keystore
is not used by this build and registering it causes `DEVELOPER_ERROR`.

Use the release keystore fingerprint for production builds as well, otherwise
release builds fail with `DEVELOPER_ERROR`.

## 2. Configure Google Cloud

1. Create or select a project in the Google Cloud console.
2. Configure the OAuth consent screen (external, add test users while in testing).
3. Create an OAuth client of type **Web application**. This is the value for
   `GOOGLE_WEB_CLIENT_ID` and for Supabase.
4. Create an OAuth client of type **Android**:
   - Package name: `com.dietplanner`
   - SHA-1: `5E:8F:16:06:2E:A3:CD:2C:4A:0D:54:78:76:BA:A6:F3:8C:AB:F6:25`
     (debug build; add the release keystore SHA-1 separately for release builds)
5. Copy the web client ID and secret into Supabase Auth -> Providers -> Google.
   Enable the provider.

The Android client does not have a secret. Only the web client has one.

## 3. Client environment

Add the web client ID to `.env`:

```dotenv
GOOGLE_WEB_CLIENT_ID=1234567890-abc.apps.googleusercontent.com
```

Rebuild the native app after editing `.env`:

```powershell
npm run android
```

`isGoogleConfigured` only returns true when the value ends with
`.apps.googleusercontent.com`. If it is missing, the Google button reports
`auth.unavailable`; email/password and demo mode still work.

## 4. Optional google-services.json

The Gradle build applies the Google Services plugin only when
`android/app/google-services.json` exists, so the project builds without it. If
your Google configuration is managed through Firebase, download
`google-services.json` for `com.dietplanner` and place it in `android/app/`.
Include an OAuth client entry whose package name matches. Never commit this file;
it is ignored by `.gitignore`.

## 5. Supabase settings

- Redirect URL: `nutrifit://auth-callback` if deep links are added later.
- Site URL: `http://localhost:3000` for local development.
- Keep "Skip nonce check" off unless you have a specific reason; the library
  returns a standard ID token.

## 6. Test

1. Install the app on a device or emulator with Google Play services.
2. Tap "Continue with Google".
3. Accept the account chooser.
4. Confirm a row appears in `auth.users` and the app leaves the auth stack.

## Common errors

| Symptom | Cause |
| --- | --- |
| `DEVELOPER_ERROR` | SHA-1, package name or client type mismatch |
| `auth.googleTokenMissing` | No ID token returned; check `webClientId` |
| `auth.playServices` | Device/emulator lacks Google Play services |
| `auth.cancelled` | User dismissed the account chooser |
| Supabase `Invalid id token` | Supabase Google provider uses a different web client ID |
| Google button hidden/disabled | `GOOGLE_WEB_CLIENT_ID` missing or malformed |

## Security notes

- The web client secret belongs only in Supabase, never in `.env`.
- Restrict the Android OAuth client to the correct package and signing SHA-1.
- Rotate any credential that was shared in plain text before going live.
