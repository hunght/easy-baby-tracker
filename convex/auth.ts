import { convexAuth } from '@convex-dev/auth/server';
import { Password } from '@convex-dev/auth/providers/Password';
import { Email } from '@convex-dev/auth/providers/Email';
import Apple from '@auth/core/providers/apple';
import Google from '@auth/core/providers/google';
import { Resend } from 'resend';

// Email sender - verified domain in Resend
const EMAIL_FROM = process.env.EMAIL_FROM ?? 'Baby Easy Tracker <support@easybabytracker.com>';

// Generate 6-digit OTP code
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Create Resend email provider for OTP
const ResendEmailProvider = Email({
  id: 'resend-otp',
  maxAge: 60 * 60, // 1 hour
  generateVerificationToken: generateOTP,
  sendVerificationRequest: async ({ identifier: email, token }) => {
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: EMAIL_FROM,
      to: email,
      subject: 'Your Baby Easy Tracker verification code',
      html: `
        <h2>Your Verification Code</h2>
        <p>Enter this code to verify your email:</p>
        <h1 style="font-size: 32px; letter-spacing: 8px; color: #7C3AED;">${token}</h1>
        <p>This code expires in 1 hour.</p>
      `,
    });
  },
});

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [
    // Password with email verification and reset
    Password({
      verify: ResendEmailProvider,
      reset: ResendEmailProvider,
    }),
    Apple({
      clientId: process.env.AUTH_APPLE_ID,
      clientSecret: process.env.AUTH_APPLE_SECRET!,
    }),
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
    }),
  ],
});
