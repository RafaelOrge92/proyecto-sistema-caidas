# Mapping

Strategy: B (native). The web app uses React Router and admin-only pages, while the backend already exposes JSON endpoints for devices and events. Native screens provide better performance, offline-friendly caching, and avoid WebView hosting.

## Web to RN

| Web route | Web page | RN screen | Notes |
| --- | --- | --- | --- |
| `/admin/devices` | DevicePage | `DevicesScreen` | List devices, quick status |
| `/admin/devices/:id` | Device details (implicit) | `DeviceDetailsScreen` | Uses `/api/devices/:id` |
| `/admin/events` | EventsPage | `EventsScreen` | List fall events |
| `/admin/events/:id` | Event details (implicit) | `EventDetailsScreen` | Uses `/api/events/:id` |
| N/A | Alerts (not separate in web) | `AlertsScreen` | Filtered events (OPEN, CONFIRMED_FALL) |
| N/A | Settings | `SettingsScreen` | Environment and app info |
| `/` landing | Landing | Not in mobile | Mobile skips landing |
| `/login` | LoginPage | `LoginScreen` | Email/password via `/api/auth/login` |

## Component mapping

| Web component | RN component | Notes |
| --- | --- | --- |
| `glass-panel` | `GlassCard` | Blur on iOS, translucent fallback on Android |
| `Card` | `GlassCard` | Apple radius + glow |
| `Badge` | `StatusPill` | Status colors by event state |
| `Navbar` | Bottom tabs | Devices, Events, Alerts, Settings |

## API endpoints

| Endpoint | Usage | Mobile function |
| --- | --- | --- |
| `POST /api/auth/login` | Email/password login | `login` |
| `POST /api/auth/google` | Google login | `loginWithGoogle` |
| `POST /api/auth/logout` | Logout | `logout` |
| `GET /api/devices` | List devices | `getDevices` |
| `GET /api/devices/:id` | Device detail | `getDevice` |
| `GET /api/events` | List events | `getEvents` |
| `GET /api/events/:id` | Event detail | `getEvent` |
| `GET /api/events/device/:deviceId` | Events by device | `getEventsByDevice` |
| `GET /api/health` | Health check | `getHealth` |

## Auth notes

JWT is returned from `/api/auth/login` and `/api/auth/google`. Use `Authorization: Bearer <token>` for authenticated calls. Current backend routes do not enforce auth on devices/events.

## Alerts note

There is no backend endpoint to ack or close alerts, so the mobile app treats alerts as read-only.
