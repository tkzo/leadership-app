import { Resend } from "resend";
import { RESEND_API_KEY, BASE_URL } from "$env/static/private";

const resend = new Resend(RESEND_API_KEY);

// Use Resend's test sender for development, or set your verified domain in production
const FROM_EMAIL = "Leadership App <onboarding@nigiri.digital>";

export async function sendVerificationEmail(email: string, token: string): Promise<void> {
  const verificationUrl = `${BASE_URL}/verify-email?token=${token}`;

  await resend.emails.send({
    from: FROM_EMAIL,
    to: email,
    subject: "Verify your email address",
    html: `
			<h1>Welcome to Leadership App</h1>
			<p>Please verify your email address by clicking the link below:</p>
			<p><a href="${verificationUrl}">Verify Email</a></p>
			<p>Or copy and paste this URL into your browser:</p>
			<p>${verificationUrl}</p>
			<p>This link will expire in 24 hours.</p>
		`,
  });
}

export async function sendPasswordResetEmail(email: string, token: string): Promise<void> {
  const resetUrl = `${BASE_URL}/reset-password?token=${token}`;

  await resend.emails.send({
    from: FROM_EMAIL,
    to: email,
    subject: "Reset your password",
    html: `
			<h1>Password Reset Request</h1>
			<p>You requested to reset your password. Click the link below to set a new password:</p>
			<p><a href="${resetUrl}">Reset Password</a></p>
			<p>Or copy and paste this URL into your browser:</p>
			<p>${resetUrl}</p>
			<p>This link will expire in 1 hour.</p>
			<p>If you did not request this, please ignore this email.</p>
		`,
  });
}
