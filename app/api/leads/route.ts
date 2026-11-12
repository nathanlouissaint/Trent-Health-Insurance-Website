import { createHash } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { z } from "zod";

import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const leadSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(254),
  phone: z.string().trim().min(7).max(40),
  coverageInterest: z.enum(["Individual coverage", "Family coverage", "Self-employed coverage", "Not sure yet"]),
  preferredContactMethod: z.enum(["Email", "Phone", "Text message"]),
  state: z.string().trim().max(60).optional(),
  bestTimeToContact: z.string().trim().max(100).optional(),
  message: z.string().trim().max(1000).optional(),
  consent: z.literal(true),
  website: z.string().max(0).optional(),
});

type RateLimitEntry = { count: number; resetAt: number };
const attempts = new Map<string, RateLimitEntry>();
const WINDOW_MS = 60_000;
const MAX_ATTEMPTS = 5;

function getClientIp(request: NextRequest) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}

function isRateLimited(ip: string) {
  const now = Date.now();
  const existing = attempts.get(ip);
  if (!existing || existing.resetAt <= now) {
    attempts.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }
  existing.count += 1;
  return existing.count > MAX_ATTEMPTS;
}

function getCampaignData(request: NextRequest) {
  const referer = request.headers.get("referer");
  if (!referer) return { source: undefined, utmSource: undefined, utmMedium: undefined, utmCampaign: undefined };
  try {
    const url = new URL(referer);
    return { source: url.origin, utmSource: url.searchParams.get("utm_source") ?? undefined, utmMedium: url.searchParams.get("utm_medium") ?? undefined, utmCampaign: url.searchParams.get("utm_campaign") ?? undefined };
  } catch {
    return { source: undefined, utmSource: undefined, utmMedium: undefined, utmCampaign: undefined };
  }
}

export async function POST(request: NextRequest) {
  if (!process.env.DATABASE_URL) return NextResponse.json({ error: "Lead capture is temporarily unavailable. Please contact TMF Insurance Group directly." }, { status: 503 });
  const ip = getClientIp(request);
  if (isRateLimited(ip)) return NextResponse.json({ error: "Please wait a moment before trying again." }, { status: 429 });
  const parsed = leadSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Please check the form and try again." }, { status: 400 });
  if (parsed.data.website) return new NextResponse(null, { status: 204 });

  const data = parsed.data;
  const consentText = "I agree that TMF Insurance Group may contact me by my selected method about my coverage inquiry.";
  try {
    const lead = await prisma.lead.create({ data: { fullName: data.fullName, email: data.email, phone: data.phone, coverageInterest: data.coverageInterest, preferredContactMethod: data.preferredContactMethod, state: data.state || null, bestTimeToContact: data.bestTimeToContact || null, message: data.message || null, consentStatus: true, consentText, consentedAt: new Date(), ...getCampaignData(request), userAgent: request.headers.get("user-agent") || null, ipHash: createHash("sha256").update(ip).digest("hex") } });
    if (process.env.RESEND_API_KEY && process.env.NOTIFICATION_EMAIL) {
      const resend = new Resend(process.env.RESEND_API_KEY);
      const delivery = await resend.emails.send({ from: process.env.EMAIL_FROM || "Leads <onboarding@resend.dev>", to: process.env.NOTIFICATION_EMAIL, subject: `New Coverage Inquiry | TMF Insurance Group — ${data.fullName}`, text: `TMF Insurance Group received a ${data.coverageInterest} inquiry from ${data.fullName}.\nEmail: ${data.email}\nPhone: ${data.phone}\nPreferred contact: ${data.preferredContactMethod}\nState: ${data.state || "Not provided"}\nMessage: ${data.message || "None"}` });
      if (delivery.error) {
        console.error("Lead saved but advisor notification failed", { leadId: lead.id, error: delivery.error });
        return NextResponse.json({ error: "Your request was saved, but we could not notify TMF Insurance Group. Please contact the team directly." }, { status: 502 });
      }
    }
    return NextResponse.json({ ok: true, leadId: lead.id }, { status: 201 });
  } catch (error) {
    console.error("Lead submission failed", error);
    return NextResponse.json({ error: "We could not save your request. Please contact TMF Insurance Group directly." }, { status: 500 });
  }
}
