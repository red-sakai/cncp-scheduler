import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import fs from "fs";
import path from "path";

function getTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

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

    const templatePath = path.join(
      process.cwd(),
      "public",
      "cisco_interview.html"
    );
    let html = fs.readFileSync(templatePath, "utf-8");

    html = html.replace(/\{\{\s*name\s*\}\}/g, name);
    html = html.replace(/\{\{\s*department\s*\}\}/g, department);
    html = html.replace(/\{\{\s*date\s*\}\}/g, date);
    html = html.replace(/\{\{\s*time\s*\}\}/g, time);

    const transporter = getTransporter();

    await transporter.sendMail({
      from: process.env.SMTP_FROM ?? `"Cisco NetConnect" <${process.env.SMTP_USER}>`,
      to: email,
      subject: `Interview Confirmed - ${department} | Cisco NetConnect PUP`,
      html,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to send email" },
      { status: 500 }
    );
  }
}
