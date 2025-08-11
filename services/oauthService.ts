import jwt, { JwtHeader, JwtPayload, SigningKeyCallback } from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';

const googleClient = jwksClient({
  jwksUri: 'https://www.googleapis.com/oauth2/v3/certs',
});

function getGoogleKey(header: JwtHeader, callback: SigningKeyCallback) {
  if (!header.kid) return callback(new Error('Missing kid in token header'));
  googleClient.getSigningKey(header.kid, (err, key) => {
    if (err) return callback(err);
    if (!key) return callback(new Error('Google signing key not found'));
    const signingKey = key.getPublicKey();
    callback(null, signingKey);
  });
}

export function verifyGoogleToken(token: string): Promise<JwtPayload> {
  return new Promise((resolve, reject) => {
    jwt.verify(
      token,
      getGoogleKey,
      {
        issuer: ['https://accounts.google.com', 'accounts.google.com'],
        algorithms: ['RS256'],
      },
      (err, decoded) => {
        if (err) reject(err);
        else resolve(decoded as JwtPayload);
      }
    );
  });
}