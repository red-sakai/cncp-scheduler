import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

interface BookingEmailData {
  name: string;
  email: string;
  department: string;
  date: string;
  time: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: BookingEmailData = await request.json();
    const { name, email, department, date, time } = body;

    if (!name || !email || !department || !date || !time) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json(
        { error: "RESEND_API_KEY is not set" },
        { status: 500 }
      );
    }

    const origin = request.nextUrl.origin;
    const res = await fetch(`${origin}/cisco_new_template.html`);
    if (!res.ok) {
      throw new Error(`Failed to load email template: ${res.status}`);
    }
    let html = await res.text();

    html = html.replace(/\{\{\s*name\s*\}\}/g, name);
    html = html.replace(/\{\{\s*department\s*\}\}/g, department);
    html = html.replace(/\{\{\s*date\s*\}\}/g, date);
    html = html.replace(/\{\{\s*time\s*\}\}/g, time);

    await resend.emails.send({
      from: process.env.RESEND_FROM ?? "CNCP Scheduler <onboarding@resend.dev>",
      to: email,
      subject: `Interview Confirmed - ${department} | Cisco NetConnect PUP`,
      html,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Email send error:", err);
    return NextResponse.json(
      { error: "Failed to send email", details: String(err) },
      { status: 500 }
    );
  }
}
