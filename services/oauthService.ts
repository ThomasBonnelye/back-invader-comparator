import jwt, { JwtHeader, JwtPayload, SigningKeyCallback } from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';
import axios from 'axios';

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

const appleJwksUrl = 'https://appleid.apple.com/auth/keys';

let appleKeysCache: Array<any> = [];
let appleKeysCacheTime = 0;

async function getAppleKeys(): Promise<Array<any>> {
  if (appleKeysCache.length > 0 && Date.now() - appleKeysCacheTime < 60 * 60 * 1000) {
    return appleKeysCache;
  }
  const response = await axios.get(appleJwksUrl);
  if (!response.data.keys || !Array.isArray(response.data.keys)) {
    throw new Error('Invalid Apple JWKS keys');
  }
  appleKeysCache = response.data.keys;
  appleKeysCacheTime = Date.now();
  return appleKeysCache;
}

function convertCertToPEM(cert: string): string {
  // simple PEM formatting for Apple x5c cert
  const formatted = cert.match(/.{1,64}/g)?.join('\n') || cert;
  return `-----BEGIN CERTIFICATE-----\n${formatted}\n-----END CERTIFICATE-----\n`;
}

export async function verifyAppleToken(token: string): Promise<JwtPayload> {
  const decodedHeader = jwt.decode(token, { complete: true }) as { header: JwtHeader } | null;
  if (!decodedHeader || !decodedHeader.header.kid || !decodedHeader.header.alg) {
    throw new Error('Invalid Apple token header');
  }

  const keys = await getAppleKeys();

  const key = keys.find(
    (k) => k.kid === decodedHeader.header.kid && k.alg === decodedHeader.header.alg
  );

  if (!key) throw new Error('Apple public key not found');
  if (!key.x5c || !key.x5c[0]) throw new Error('Apple certificate missing');

  const pubKey = convertCertToPEM(key.x5c[0]);

  return new Promise((resolve, reject) => {
    jwt.verify(
      token,
      pubKey,
      {
        issuer: 'https://appleid.apple.com',
        algorithms: ['RS256'],
      },
      (err, decoded) => {
        if (err) reject(err);
        else resolve(decoded as JwtPayload);
      }
    );
  });
}
