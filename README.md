# TMF Insurance Group Website

A Next.js 15 / TypeScript portfolio and lead-generation site for a health insurance advisor. This project deliberately uses placeholders where the client has not provided verified business information.

## Local setup

1. Copy `.env.example` to `.env.local` and populate the values you have.
2. Install packages: `npm install`.
3. If PostgreSQL is configured, generate the client and apply the initial schema:

```bash
npx prisma generate
npx prisma migrate dev --name init
```

4. Run `npm run dev`.

Use `npm run typecheck` and `npm run build` before release.

### Resend confirmation testing

To test the applicant confirmation while using Resend's `onboarding@resend.dev` sender, set these values in `.env.local` and run `npm run dev`:

```bash
RESEND_FROM_EMAIL="TMF Insurance Group <onboarding@resend.dev>"
CONTACT_NOTIFICATION_EMAIL="your-authorized-resend-account-email@example.com"
ENABLE_APPLICANT_CONFIRMATION="false"
APPLICANT_CONFIRMATION_TEST_MODE="true"
```

In this development-only mode, the advisor notification and the branded applicant confirmation are both sent to `CONTACT_NOTIFICATION_EMAIL`. The confirmation still uses the form submitter's first name, but never sends to the submitter's email address. `APPLICANT_CONFIRMATION_TEST_MODE` is ignored in production. Set it back to `false` before deploying; general applicant confirmations require a verified custom Resend sending domain and `ENABLE_APPLICANT_CONFIRMATION="true"`.

## Lead workflow

`POST /api/leads` validates the submitted data on the server, rejects the honeypot field, applies an in-memory IP rate limit, hashes the source IP, records consent, persists to Postgres when `DATABASE_URL` is set, and sends an advisor notification only when Resend credentials are provided.

The form intentionally does not request medical or other sensitive health information. The in-memory rate limiter is suitable only for a single Node instance; for Vercel/Render production use, replace it with a shared edge/KV rate limiter (for example Upstash) and add provider-native bot protection.

## Deployment

The app is Vercel and Render compatible.

- Configure `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, and `CONTACT_NOTIFICATION_EMAIL` in the host dashboard for the active contact and application funnel. Set `ENABLE_APPLICANT_CONFIRMATION=true` only after the sender domain is verified in Resend.
- Configure `NEXT_PUBLIC_SITE_URL` with the verified production domain. It supplies metadata, sitemap, and robots URLs; these URLs stay unset until it is provided.
- `DATABASE_URL`, `NOTIFICATION_EMAIL`, and `EMAIL_FROM` are only required if the separate legacy `/api/leads` endpoint is enabled. Do not run Prisma migrations for the `/apply` funnel.
- Verify the existing Calendly destination before launch. `NEXT_PUBLIC_CALENDLY_URL` is reserved for a future configurable booking link.
- Add a shared production rate limiter and bot-protection service before taking public submissions.

## Required pre-launch approvals

Do not launch until the advisor provides and approves:

- Name, professional photo, biography, contact details, business entity, state licenses, service areas, and required license numbers.
- Products offered, carrier appointments, and any claims about certifications or experience.
- Privacy/retention policy and state-specific consent/disclosure language.
- Approved testimonials, if any.
- Medicare-specific CMS and carrier compliance review if Medicare products are ever included.

The educational content is general information, sourced for review from [HealthCare.gov](https://www.healthcare.gov/choose-a-plan/your-total-costs/) and [CMS Marketplace agent guidance](https://www.cms.gov/marketplace/agents-brokers/general-resources). It is not personalized insurance advice.
