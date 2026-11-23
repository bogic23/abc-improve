# project-management

This template should help get you started developing with Vue 3 in Vite.

## Recommended IDE Setup

[VS Code](https://code.visualstudio.com/) + [Vue (Official)](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur).

## Recommended Browser Setup

- Chromium-based browsers (Chrome, Edge, Brave, etc.):
  - [Vue.js devtools](https://chromewebstore.google.com/detail/vuejs-devtools/nhdogjmejiglipccpnnnanhbledajbpd)
  - [Turn on Custom Object Formatter in Chrome DevTools](http://bit.ly/object-formatters)
- Firefox:
  - [Vue.js devtools](https://addons.mozilla.org/en-US/firefox/addon/vue-js-devtools/)
  - [Turn on Custom Object Formatter in Firefox DevTools](https://fxdx.dev/firefox-devtools-custom-object-formatters/)

## Customize configuration

See [Vite Configuration Reference](https://vite.dev/config/).

## Firebase Authentication setup

ABC Improve uses Firebase Auth for email/password and Google sign-in.

1. Create a project in the [Firebase Console](https://console.firebase.google.com).
2. In **Authentication → Sign-in method**, enable **Email/Password** and **Google**.
3. In **Project settings → General → Your apps**, add a **Web app** and copy its config.
4. Copy `.env.example` to `.env` and fill in the `VITE_FIREBASE_*` values.
5. Restart the dev server after changing `.env`.

Google sign-in also requires `localhost` (and your production domain) to be listed under
**Authentication → Settings → Authorized domains**.

## Firestore setup

All projects, tasks and user roles are stored in Cloud Firestore in realtime.

1. In the Firebase Console, open **Firestore Database** and create a database (Production mode).
2. Deploy the included security rules:

```sh
npm install -g firebase-tools
firebase login
firebase use --add        # select your project
firebase deploy --only firestore:rules
```

### Data model

| Path                                 | Purpose                                     |
| ------------------------------------ | ------------------------------------------- |
| `users/{uid}`                        | Profile + `role` (`admin` or `member`)      |
| `users/{uid}/projects/{projectId}`   | Projects, private to that user              |
| `users/{uid}/tasks/{taskId}`         | Tasks, private and linked to a project      |

### Creating the first admin

New accounts are always created as `member`. To bootstrap your first administrator:

1. Sign in to the app once so your `users/{uid}` document is created.
2. In **Firestore Database**, open `users` → your document and set `role` to `"admin"`.
3. Reload the app — the **Admin → User Management** area will appear.
4. From there you can promote or demote other users. You cannot change your own role.

### Security rules

`firestore.rules` enforces that:

- Only signed-in users can read/write, and each user can only access their own projects and tasks.
- Users can create only their own profile, always as `member`, and can never change their own role.
- Only admins can list all users or change another user's role (and never their own).
- Task writes must reference a project the user owns, and all document fields are validated.
- Tasks cannot leave `todo` without a valid `YYYY-MM-DD` due date.
- Task progress is enforced at the database level: `todo` = 0%, `in-progress` = 1–99%, `done` = 100%.
  A task reaching 100% must be `done`, which guarantees the automatic-move behaviour.

## Google Calendar setup

Tasks are created in **To Do** without a due date. Setting or editing the due date on a task card
creates/updates an all-day event in Google Calendar, and deleting a task removes its event.

1. In the [Google Cloud Console](https://console.cloud.google.com), create or select a project.
2. Enable the **Google Calendar API** for that project.
3. Under **APIs & Services → Credentials**, create an **OAuth client ID** of type **Web application**
   and add your app origins (for example `http://localhost:5173`) to **Authorized JavaScript origins**.
4. Create an **API key** and restrict it to the Google Calendar API. Restricting by HTTP referrer is
   recommended.
5. Add both credentials to `.env` (keep the non-`VITE_` names; `vite.config.js` exposes only these two
   settings to the browser) and restart the dev server:

```sh
GOOGLE_CALENDAR_API_KEY=...
GOOGLE_CALENDAR_CLIENT_ID=...
```

The Calendar page can also read a public calendar by ID without signing in, using the API key.

## Project Setup

```sh
npm install
```

### Compile and Hot-Reload for Development

```sh
npm run dev
```

### Compile and Minify for Production

```sh
npm run build
```

### Lint with [ESLint](https://eslint.org/)

```sh
npm run lint
```
