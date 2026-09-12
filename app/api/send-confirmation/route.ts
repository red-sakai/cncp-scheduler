import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

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

    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = process.env.SMTP_PORT;
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;

    if (!smtpHost || !smtpUser || !smtpPass) {
      return NextResponse.json(
        {
          error: "SMTP not configured",
          missing: {
            SMTP_HOST: !smtpHost,
            SMTP_PORT: !smtpPort,
            SMTP_USER: !smtpUser,
            SMTP_PASS: !smtpPass,
          },
        },
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

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: Number(smtpPort) || 587,
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });

    await transporter.verify();
    await transporter.sendMail({
      from: process.env.SMTP_FROM ?? `"Cisco NetConnect" <${smtpUser}>`,
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
