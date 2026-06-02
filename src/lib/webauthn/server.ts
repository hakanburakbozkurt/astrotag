import "server-only";

import {
  generateAuthenticationOptions,
  generateRegistrationOptions,
  verifyAuthenticationResponse,
  verifyRegistrationResponse,
} from "@simplewebauthn/server";
import type {
  AuthenticationResponseJSON,
  AuthenticatorTransportFuture,
  PublicKeyCredentialCreationOptionsJSON,
  PublicKeyCredentialRequestOptionsJSON,
  RegistrationResponseJSON,
} from "@simplewebauthn/server";
import {
  getWebAuthnOrigin,
  getWebAuthnRpId,
  getWebAuthnRpName,
} from "@/lib/webauthn/config";
import {
  consumeWebAuthnChallengeCookie,
  setWebAuthnChallengeCookie,
} from "@/lib/nfc/device-cookies.server";

export type StoredPasskey = {
  credentialId: string;
  publicKey: string;
  counter: number;
  transports?: AuthenticatorTransportFuture[];
};

export async function createPasskeyRegistrationOptions(params: {
  userId: string;
  email: string;
  existingCredentials?: StoredPasskey[];
}): Promise<PublicKeyCredentialCreationOptionsJSON> {
  const options = await generateRegistrationOptions({
    rpName: getWebAuthnRpName(),
    rpID: getWebAuthnRpId(),
    userName: params.email,
    userID: Buffer.from(params.userId),
    userDisplayName: params.email,
    attestationType: "none",
    authenticatorSelection: {
      authenticatorAttachment: "platform",
      residentKey: "preferred",
      requireResidentKey: false,
      userVerification: "required",
    },
    excludeCredentials: (params.existingCredentials ?? []).map((cred) => ({
      id: cred.credentialId,
      transports: cred.transports,
    })),
  });

  await setWebAuthnChallengeCookie(options.challenge);

  return options;
}

export async function verifyPasskeyRegistration(params: {
  response: RegistrationResponseJSON;
  expectedOrigin?: string;
}): Promise<{
  verified: boolean;
  credential?: StoredPasskey;
}> {
  const expectedChallenge = await consumeWebAuthnChallengeCookie();

  if (!expectedChallenge) {
    return { verified: false };
  }

  const verification = await verifyRegistrationResponse({
    response: params.response,
    expectedChallenge,
    expectedOrigin: params.expectedOrigin ?? getWebAuthnOrigin(),
    expectedRPID: getWebAuthnRpId(),
    requireUserVerification: true,
  });

  if (!verification.verified || !verification.registrationInfo) {
    return { verified: false };
  }

  const { credential } = verification.registrationInfo;

  return {
    verified: true,
    credential: {
      credentialId: credential.id,
      publicKey: Buffer.from(credential.publicKey).toString("base64url"),
      counter: credential.counter,
      transports: credential.transports,
    },
  };
}

export async function createPasskeyAuthenticationOptions(params: {
  credentialId: string;
  transports?: AuthenticatorTransportFuture[];
}): Promise<PublicKeyCredentialRequestOptionsJSON> {
  const options = await generateAuthenticationOptions({
    rpID: getWebAuthnRpId(),
    allowCredentials: [
      {
        id: params.credentialId,
        transports: params.transports,
      },
    ],
    userVerification: "required",
  });

  await setWebAuthnChallengeCookie(options.challenge);

  return options;
}

export async function verifyPasskeyAuthentication(params: {
  response: AuthenticationResponseJSON;
  stored: StoredPasskey;
  expectedOrigin?: string;
}): Promise<{ verified: boolean; newCounter: number }> {
  const expectedChallenge = await consumeWebAuthnChallengeCookie();

  if (!expectedChallenge) {
    return { verified: false, newCounter: params.stored.counter };
  }

  const verification = await verifyAuthenticationResponse({
    response: params.response,
    expectedChallenge,
    expectedOrigin: params.expectedOrigin ?? getWebAuthnOrigin(),
    expectedRPID: getWebAuthnRpId(),
    credential: {
      id: params.stored.credentialId,
      publicKey: Buffer.from(params.stored.publicKey, "base64url"),
      counter: params.stored.counter,
      transports: params.stored.transports,
    },
    requireUserVerification: true,
  });

  return {
    verified: verification.verified,
    newCounter: verification.authenticationInfo?.newCounter ?? params.stored.counter,
  };
}
