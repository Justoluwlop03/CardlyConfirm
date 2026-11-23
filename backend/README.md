# CardlyConfirm backend

JSON API for the CardlyConfirm frontend. The service returns simulated outcomes and stores submission metadata in MongoDB.

## Run locally

Requires Node.js 20 or newer.

```powershell
cd backend
npm install
Copy-Item .env.example .env
# Set a private ADMIN_API_KEY in .env before starting the server.
npm run dev
```

The API listens on port `4000` by default and binds to all network interfaces so it can receive traffic when deployed. Configure `.env` with `PORT`, `MONGODB_URI`, and a private `ADMIN_API_KEY`; `.env` is git-ignored. The default MongoDB URI is `mongodb://127.0.0.1:27017/cardlyconfirm`. Ensure MongoDB is running before starting the API. For MongoDB Atlas, replace `MONGODB_URI` with your Atlas connection string. The server does not enable cross-origin requests.

## Routes

| Method | Route | Purpose |
| --- | --- | --- |
| `GET` | `/api/health` | Liveness check |
| `GET` | `/api/cards` | Supported card IDs and names |
| `POST` | `/api/check` | Validate fixed sample input and return a simulated result |
| `POST` | `/api/admin/session` | Exchange the admin key for an eight-hour HttpOnly session |
| `GET` | `/api/admin/session` | Check the current admin session |
| `DELETE` | `/api/admin/session` | End the current admin session |
| `GET` | `/api/admin/submissions` | Read recent metadata; requires an admin session |
| `DELETE` | `/api/admin/submissions` | Clear stored metadata; requires an admin session |

The frontend sign-in accepts `ADMIN_API_KEY` from the backend `.env`, then receives a random eight-hour HttpOnly, SameSite=Strict session cookie. In production the cookie is marked Secure. Server restarts invalidate sessions. API clients may also use `Authorization: Bearer <ADMIN_API_KEY>` or `X-Admin-API-Key: <ADMIN_API_KEY>` directly.

## Sample check request

Gift card request:

```json
{
  "brandId": "apple",
  "code": "123456789012"
}
```

Visa, Vanilla, and HOKD synthetic sample request:
Any 6-30 digit number, month 01-12, two-digit year, and exactly 3-digit code are accepted.

```json
{
  "brandId": "visa",
  "sampleReference": "123456789012",
  "periodMonth": "12",
  "periodYear": "30",
  "sampleToken": "123"
}
```

Other card request:

```json
{
  "brandId": "other",
  "brandName": "Bookshop",
  "code": "123456789012"
}
```

## Data and security boundaries

- Request bodies are validated against fixed synthetic values; unexpected fields are rejected.
- Real card numbers, expiration dates, and security codes must never be submitted.
- The admin route displays only synthetic submission details and never live issuer data.
- Submission metadata is stored in MongoDB. Each check request value is discarded after validation and never persisted.
- Admin access uses one shared server-side key and in-memory sessions. This is suitable for a small private deployment, not multi-user identity management; use HTTPS and a strong random `ADMIN_API_KEY`.
- This API does not contact issuers or verify card balances.
