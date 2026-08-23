# Firebase Authentication Setup

FinSight uses email/password authentication only while `__DEV__` is true and native Google Sign-In only in release builds. Firebase Authentication persists its session through AsyncStorage and user profiles are stored at `/users/{uid}`.

## 1. Firebase project

1. Create or select a Firebase project.
2. In **Authentication → Sign-in method**, enable **Email/Password** and **Google**.
3. Create a Firestore database.
4. Deploy the checked-in UID-scoped rules:

```cmd
npx firebase-tools login
npx firebase-tools use YOUR_PROJECT_ID
npx firebase-tools deploy --only firestore:rules
```

The rules permit authenticated users to read and update only their own `/users/{uid}` document.

## 2. Public environment configuration

Copy the template and fill in values from **Firebase Console → Project settings → Your apps → Web app**:

```cmd
copy .env.example .env
```

Required values:

- `EXPO_PUBLIC_FIREBASE_API_KEY`
- `EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `EXPO_PUBLIC_FIREBASE_PROJECT_ID`
- `EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `EXPO_PUBLIC_FIREBASE_APP_ID`
- `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`

The Google value must be the OAuth client whose type is **Web application**. Firebase uses it as the audience for the native Google ID token. Do not substitute the Android OAuth client ID.

Firebase web configuration and OAuth client IDs are public identifiers, not secrets. Passwords, ID tokens, private keys, and service-account files must never be placed in Expo public variables.

## 3. Android registration

The configured Android package is `com.finsight.app`. If a different package is already registered for the product, update `app.json` before creating Firebase/OAuth registrations; package identifiers cannot be changed for an existing store application.

1. Register an Android app in Firebase with package `com.finsight.app`.
2. Download `google-services.json` to the project root as `finsight/google-services.json`.
3. Register SHA-1 and SHA-256 fingerprints for every signing certificate used by debug, EAS development, preview, and production builds.
4. Download `google-services.json` again after adding fingerprints.

For a locally generated Android project, inspect the debug certificate with:

```cmd
keytool -list -v -alias androiddebugkey -keystore %USERPROFILE%\.android\debug.keystore -storepass android -keypass android
```

For EAS-managed credentials, obtain the fingerprints from the credentials configured for each build profile. Google error code 10 usually means the package name, signing fingerprint, or OAuth registration does not match the installed binary.

## 4. iOS registration

The configured bundle identifier is `com.finsight.app`.

1. Register the iOS app in Firebase with that bundle identifier.
2. Download `GoogleService-Info.plist` to `finsight/GoogleService-Info.plist`.
3. Ensure the Google OAuth iOS client belongs to the same project and bundle identifier.
4. The Google Sign-In Expo config plugin reads the plist and adds the required URL scheme during prebuild.

Both platform service files are ignored by Git. Supply them through the team's secure CI/EAS file-secret workflow for remote builds.

## 5. Build the native client

Google Sign-In includes native code and does not work in Expo Go. After adding or changing native configuration, regenerate and rebuild the native app:

```cmd
npx expo prebuild --clean
npx expo run:android
```

For iOS, run the equivalent command on macOS:

```cmd
npx expo run:ios
```

A development build has `__DEV__ === true`, so FinSight intentionally displays email/password instead of Google. Verify the Google flow using a release/preview build where `__DEV__ === false`.

If using EAS, define development and production build profiles and run a release-like profile for Google verification. Rebuild whenever a config plugin, package identifier, service file, or signing certificate changes.

## 6. Firestore profile shape

Each successful permitted sign-in creates or merges:

```text
/users/{firebaseUid}
  uid
  email
  fullName
  authProvider  // EMAIL or GOOGLE
  createdAt     // set once by Firestore
  updatedAt     // refreshed by Firestore
```

No password, provider token, or Firebase ID token is written to Firestore or custom AsyncStorage.

## 7. Verification checklist

### Development email flow

- Start a native development build with a populated `.env`.
- Confirm only email/password fields and the Sign Up route are visible.
- Register a new account and verify Firebase Authentication contains the user.
- Verify `/users/{uid}` exists with `authProvider: EMAIL`.
- Restart the app and confirm it opens Main without showing Login.
- Log out from Profile and confirm protected routes are removed.

### Production Google flow

- Install a release/preview native build signed with a registered certificate.
- Confirm only **Continue with Google** is visible; no email, Apple, or Facebook controls are rendered.
- Complete Google Sign-In and verify the Firebase user and `/users/{uid}` profile with `authProvider: GOOGLE`.
- Restart the app and confirm the session is restored.
- Log out, confirm Login returns, and verify a subsequent sign-in can choose an account as expected.

### Failure checks

- Cancel Google Sign-In and confirm no error alert is shown.
- Disable connectivity and confirm a safe retry message appears.
- Attempt cross-user profile access with the Firebase emulator or rules playground and confirm it is denied.
- Confirm `.env`, `google-services.json`, and `GoogleService-Info.plist` do not appear in Git status.

## References

- [Expo Google authentication guide](https://docs.expo.dev/guides/google-authentication)
- [React Native Google Sign-In Expo setup](https://react-native-google-signin.github.io/docs/setting-up/expo)
- [Firebase Authentication API](https://firebase.google.com/docs/reference/js/auth)

External documentation has been summarized and rephrased.