# Mobile (Android)

Expo + TypeScript app that mirrors the web UI for devices and fall events.

## Run

1. Ensure the backend is running.
2. In `mobile`, copy `.env.example` to `.env` and set `API_BASE_URL`.
3. Install deps: `npm install`
4. Start Android: `npm run android`
5. Login with an existing backend user (email/password)

Notes

1. Android emulator uses `http://10.0.2.2:3000/api` to reach the host machine.
2. Physical devices must use your host LAN IP, for example `http://192.168.1.10:3000/api`.
3. iOS requires HTTPS in production. For local development, use Expo Go or provide a local HTTPS tunnel.
