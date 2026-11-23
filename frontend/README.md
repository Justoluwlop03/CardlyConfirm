# CardlyConfirm

A responsive React + Vite frontend for previewing gift and prepaid card-check forms. It uses an orange and white visual system and connects sample submissions to the CardlyConfirm API.

## Run locally

Start MongoDB-configured backend in one terminal:

```bash
cd backend
npm install
npm run dev
```

Then start the frontend in another terminal:

```bash
cd frontend
npm install
npm run dev
```

Vite proxies `/api` requests to `http://127.0.0.1:4000`. Set `MONGODB_URI` and `ADMIN_API_KEY` in `backend/.env` before starting the backend.

Vite prints the local URL after startup. To create a production build, run `npm run build`.

## What is included

- Searchable selection grid for Apple, Visa Prepaid, Vanilla Gift, Steam, Sephora, Nike, Xbox, Razer Gold, HOKD, and other cards.
- Responsive landing page, how-it-works section, FAQ, and footer.
- Card-specific forms, validation, reset and card-switch actions, loading animation, and toast notifications.
- Visa Prepaid, Vanilla Gift, and HOKD show a card-reference, expiration, and security-token sample form. Other gift cards use a sample-code form.
- Submissions accept only the documented synthetic `SAMPLE-...` values and send them to `POST /api/check` for validation. The backend stores only the brand and submission timestamp, then returns an explicitly labelled simulated result.
- `/admin/sign-in` verifies the server-side `ADMIN_API_KEY` and creates an eight-hour HttpOnly session; `/admin` reads and clears submission history through protected backend routes.

## Privacy and scope

The backend stores submission metadata (brand and timestamp) in MongoDB. It never stores submitted form values. Admin sessions are held in server memory and expire after eight hours or when the backend restarts. Use HTTPS in production; the session cookie is marked Secure when `NODE_ENV=production`.

Do not enter real card numbers, expiration details, CVVs, PINs, gift card codes, or passwords. The card forms accept only fixed synthetic sample values, which are sent to the CardlyConfirm backend for validation. No issuer is contacted and no balance is verified.

For an actual balance, use the verified official service or phone number printed on your card or packaging.
