# Firebase setup (FCM push notifications)

1. Create a project at https://console.firebase.google.com
2. Install FlutterFire CLI:
   ```bash
   dart pub global activate flutterfire_cli
   ```
3. From `mobile/` run:
   ```bash
   flutterfire configure
   ```
   This replaces `lib/firebase_options.dart` with real values.
4. Android: ensure `android/app/google-services.json` exists (CLI creates it).
5. iOS: add `GoogleService-Info.plist` to Runner.
6. Backend `.env`:
   ```
   FCM_PROJECT_ID=your-project-id
   FCM_SERVER_KEY=optional-legacy-server-key
   ```

Until configured, the app runs without push; in-app notifications still work.
