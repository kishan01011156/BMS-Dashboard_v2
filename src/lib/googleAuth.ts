import 'server-only';
import { createRemoteJWKSet, jwtVerify } from 'jose';

const GOOGLE_JWKS_URL = 'https://www.googleapis.com/oauth2/v3/certs';
const GOOGLE_ISSUERS = ['https://accounts.google.com', 'accounts.google.com'];

const jwks = createRemoteJWKSet(new URL(GOOGLE_JWKS_URL));

export type GoogleIdTokenPayload = {
  sub: string;
  email: string;
  email_verified: boolean;
  name: string;
  picture?: string;
};

/**
 * Verifies a Google Identity Services ID token (JWT) against Google's
 * public keys, checking signature, issuer, audience and expiry.
 */
export async function verifyGoogleIdToken(
  idToken: string
): Promise<GoogleIdTokenPayload> {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  if (!clientId) {
    throw new Error(
      'Missing environment variable: NEXT_PUBLIC_GOOGLE_CLIENT_ID'
    );
  }

  const { payload } = await jwtVerify(idToken, jwks, {
    issuer: GOOGLE_ISSUERS,
    audience: clientId,
  });

  if (!payload.email || !payload.email_verified) {
    throw new Error('Google account email is not verified');
  }

  return payload as unknown as GoogleIdTokenPayload;
}
