import { createHash } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { z } from "zod";

import { renderApplicantConfirmation } from "@/emails/applicant-confirmation";

export const runtime = "nodejs";

const MAX_REQUESTS_PER_WINDOW = 5;
const RATE_LIMIT_WINDOW_MS = 60_000;
const CONFIRMATION_DEDUPLICATION_WINDOW_MS = 15 * 60_000;
const PHONE_PATTERN = /^[0-9+().\-\s]{7,40}$/;

const contactSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(254),
  phone: z.string().trim().regex(PHONE_PATTERN).max(40),
  coverageInterest: z.enum([
    "Individual coverage",
    "Family coverage",
    "Self-employed coverage",
    "Not sure yet",
  ]),
  preferredContactMethod: z.enum(["Email", "Phone", "Text message"]),
  state: z.string().trim().min(2).max(60),
  bestTimeToContact: z.string().trim().max(100).optional(),
  message: z.string().trim().max(1000).optional(),
  consent: z.literal(true),
  // This hidden field should stay empty. Bots that fill it receive an innocuous response.
  website: z.string().max(0).optional(),
});

type RateLimitEntry = { count: number; resetAt: number };
const attempts = new Map<string, RateLimitEntry>();
const confirmationDeliveries = new Map<string, number>();

function clientIp(request: NextRequest) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}

/** Per-instance limiting; use platform/WAF limiting too when deployed across multiple instances. */
function isRateLimited(ip: string) {
  const now = Date.now();
  const entry = attempts.get(ip);

  if (!entry || entry.resetAt <= now) {
    attempts.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }

  entry.count += 1;
  return entry.count > MAX_REQUESTS_PER_WINDOW;
}

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      "'": "&#39;",
      '"': "&quot;",
    };
    return entities[character];
  });
}

function display(value?: string) {
  return value?.trim() ? value : "Not provided";
}

function firstName(fullName: string) {
  return fullName.trim().split(/\s+/)[0] || "there";
}

function senderUsesTestingDomain(from: string) {
  const address = from.match(/<([^>]+)>/)?.[1] ?? from;
  return address.trim().toLowerCase().endsWith("@resend.dev");
}

function confirmationKey(data: z.infer<typeof contactSchema>) {
  return createHash("sha256").update(JSON.stringify(data)).digest("hex");
}

function reserveConfirmation(key: string) {
  const now = Date.now();
  const expiresAt = confirmationDeliveries.get(key);
  if (expiresAt && expiresAt > now) return false;

  confirmationDeliveries.set(key, now + CONFIRMATION_DEDUPLICATION_WINDOW_MS);
  return true;
}

function releaseConfirmation(key: string) {
  confirmationDeliveries.delete(key);
}

function emailHtml(data: z.infer<typeof contactSchema>, submittedAt: Date) {
  const rows: Array<[string, string]> = [
    ["Full name", data.fullName],
    ["Email", data.email],
    ["Phone", data.phone],
    ["Coverage interest", data.coverageInterest],
    ["Preferred contact method", data.preferredContactMethod],
    ["State of residence", data.state],
    ["Best time to contact", display(data.bestTimeToContact)],
    ["Additional message", display(data.message)],
    ["Submitted", submittedAt.toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short", timeZone: "America/Chicago" }) + " CT"],
  ];

  return `<!doctype html>
<html><body style="margin:0;background:#fcf6e9;font-family:Arial,sans-serif;color:#052d20">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding:32px 16px"><tr><td align="center">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:620px;background:#ffffff;border-radius:16px;overflow:hidden">
      <tr><td style="background:#052d20;padding:28px 32px;color:#ffffff"><div style="font-size:14px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#d6b15a">TMF Insurance Group</div><h1 style="margin:8px 0 0;font-size:28px;line-height:1.2">New Coverage Inquiry</h1></td></tr>
      <tr><td style="padding:28px 32px"><p style="margin:0 0 20px;line-height:1.5">A visitor has submitted a general coverage inquiry.</p>
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0">${rows.map(([label, value]) => `<tr><td style="padding:10px 0;border-top:1px solid #e7edf4;width:42%;font-size:13px;font-weight:700;color:#475467;vertical-align:top">${escapeHtml(label)}</td><td style="padding:10px 0;border-top:1px solid #e7edf4;font-size:14px;line-height:1.5;white-space:pre-wrap">${escapeHtml(value)}</td></tr>`).join("")}</table>
      </td></tr>
    </table>
  </td></tr></table>
</body></html>`;
}

function emailText(data: z.infer<typeof contactSchema>, submittedAt: Date) {
  return [
    "New Coverage Inquiry | TMF Insurance Group",
    "",
    `Full name: ${data.fullName}`,
    `Email: ${data.email}`,
    `Phone: ${data.phone}`,
    `Coverage interest: ${data.coverageInterest}`,
    `Preferred contact method: ${data.preferredContactMethod}`,
    `State of residence: ${data.state}`,
    `Best time to contact: ${display(data.bestTimeToContact)}`,
    `Additional message: ${display(data.message)}`,
    `Submitted: ${submittedAt.toISOString()}`,
  ].join("\n");
}

function resendDiagnostic(error: unknown) {
  const details = error && typeof error === "object" ? error as Record<string, unknown> : {};
  const statusCode = details.statusCode ?? details.status;
  const message = typeof details.message === "string"
    ? details.message.replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[redacted-email]")
    : "No diagnostic message was provided.";

  return {
    name: typeof details.name === "string" ? details.name : "UnknownResendError",
    code: typeof details.code === "string"
      ? details.code
      : typeof details.name === "string"
        ? details.name
        : "unknown_error",
    message,
    ...(typeof statusCode === "number" ? { statusCode } : {}),
  };
}

function logConfirmationDiagnostic(event: string, details: Record<string, boolean | string | number> = {}) {
  if (process.env.NODE_ENV === "development") {
    console.info("Applicant confirmation diagnostic", { event, ...details });
  }
}

export async function POST(request: NextRequest) {
  const ip = clientIp(request);
  if (isRateLimited(ip)) {
    return NextResponse.json({ error: "Please wait a moment before trying again." }, { status: 429 });
  }

  const parsed = contactSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Please check the form and try again." }, { status: 400 });
  }
  if (parsed.data.website) return new NextResponse(null, { status: 204 });

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  const to = process.env.CONTACT_NOTIFICATION_EMAIL;
  const confirmationsEnabled = process.env.ENABLE_APPLICANT_CONFIRMATION === "true";
  // This mode is intentionally unavailable in production: it sends the branded
  // confirmation to the advisor's authorized testing inbox, never the applicant.
  const confirmationTestMode = process.env.NODE_ENV === "development"
    && process.env.APPLICANT_CONFIRMATION_TEST_MODE === "true";
  if (!apiKey || !from || !to) {
    return NextResponse.json({ error: "Contact service is temporarily unavailable." }, { status: 503 });
  }

  const submittedAt = new Date();
  const submissionKey = confirmationKey(parsed.data);
  const resend = new Resend(apiKey);
  try {
    const result = await resend.emails.send({
      from,
      to,
      replyTo: parsed.data.email,
      subject: "New Coverage Inquiry | TMF Insurance Group",
      html: emailHtml(parsed.data, submittedAt),
      text: emailText(parsed.data, submittedAt),
    }, { idempotencyKey: `contact-advisor-${submissionKey}` });

    if (result.error) {
      console.error("Resend email delivery returned an error", resendDiagnostic(result.error));
      return NextResponse.json({ error: "Unable to send your message at this time." }, { status: 502 });
    }
  } catch (error) {
    console.error("Resend email delivery threw an exception", resendDiagnostic(error));
    return NextResponse.json({ error: "Unable to send your message at this time." }, { status: 502 });
  }

  const testingSender = senderUsesTestingDomain(from);
  logConfirmationDiagnostic("configuration", {
    confirmationModeEnabled: confirmationsEnabled,
    testingModeActive: confirmationTestMode,
    testingSender,
  });

  if (!confirmationsEnabled && !confirmationTestMode) {
    logConfirmationDiagnostic("skipped", { reason: "confirmation_mode_disabled", attempted: false });
  } else if (testingSender && !confirmationTestMode) {
    logConfirmationDiagnostic("skipped", { reason: "testing_sender_requires_development_test_mode", attempted: false });
    console.error("Applicant confirmation skipped: a verified custom sender domain is required.");
  } else {
    const key = submissionKey;
    if (!reserveConfirmation(key)) {
      logConfirmationDiagnostic("skipped", { reason: "duplicate_submission", attempted: false });
    } else {
      logConfirmationDiagnostic("attempting_send", { attempted: true, testingModeActive: confirmationTestMode });
      try {
        const confirmationEmail = await renderApplicantConfirmation(firstName(parsed.data.fullName));
        const confirmation = await resend.emails.send({
          from,
          to: confirmationTestMode ? to : parsed.data.email,
          subject: "We've Received Your Coverage Inquiry | TMF Insurance Group",
          html: confirmationEmail.html,
          text: confirmationEmail.text,
        }, { idempotencyKey: `contact-confirmation-${key}` });

        if (confirmation.error) {
          releaseConfirmation(key);
          const diagnostic = resendDiagnostic(confirmation.error);
          console.error("Applicant confirmation returned an error", diagnostic);
          logConfirmationDiagnostic("rejected", { attempted: true, accepted: false, code: diagnostic.code, message: diagnostic.message });
        } else {
          logConfirmationDiagnostic("accepted", { attempted: true, accepted: true });
        }
      } catch (error) {
        releaseConfirmation(key);
        const diagnostic = resendDiagnostic(error);
        console.error("Applicant confirmation threw an exception", diagnostic);
        logConfirmationDiagnostic("rejected", { attempted: true, accepted: false, code: diagnostic.code, message: diagnostic.message });
      }
    }
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}
