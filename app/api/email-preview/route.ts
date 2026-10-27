import { NextResponse } from "next/server";

import { renderApplicantConfirmation } from "@/emails/applicant-confirmation";

export const runtime = "nodejs";

export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return new NextResponse(null, { status: 404 });
  }

  const { html } = await renderApplicantConfirmation("Jordan");
  return new NextResponse(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
