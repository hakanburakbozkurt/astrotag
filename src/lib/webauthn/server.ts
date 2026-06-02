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
import { logNfcErrorAndThrow, toError } from "@/lib/nfc/error-logger";
import {
  consumeWebAuthnChallengeCookie,
  setWebAuthnChallengeCookie,
} from "@/lib/nfc/device-cookies.server";
import {
  getWebAuthnOrigin,
  getWebAuthnRpId,
  getWebAuthnRpName,
} from "@/lib/webauthn/config";

const VERIFY_REG_CTX = {
  layer: "action" as const,
  handler: "verifyPasskeyRegistration",
};

const VERIFY_AUTH_CTX = {
  layer: "action" as const,
  handler: "verifyPasskeyAuthentication",
};

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
  verified: true;
  credential: StoredPasskey;
}> {
  const expectedOrigin = params.expectedOrigin ?? getWebAuthnOrigin();
  const expectedRPID = getWebAuthnRpId();

  const expectedChallenge = await consumeWebAuthnChallengeCookie();

  if (!expectedChallenge) {
    logNfcErrorAndThrow(
      VERIFY_REG_CTX,
      toError("WebAuthn challenge çerezi eksik veya süresi dolmuş"),
      { step: "consumeWebAuthnChallengeCookie" }
    );
  }

  let verification: Awaited<ReturnType<typeof verifyRegistrationResponse>>;

  try {
    verification = await verifyRegistrationResponse({
      response: params.response,
      expectedChallenge,
      expectedOrigin,
      expectedRPID,
      requireUserVerification: true,
    });
  } catch (error) {
    logNfcErrorAndThrow(VERIFY_REG_CTX, error, {
      step: "verifyRegistrationResponse",
      expectedOrigin,
      expectedRPID,
      responseId: params.response.id,
    });
  }

  if (!verification.verified || !verification.registrationInfo) {
    logNfcErrorAndThrow(
      VERIFY_REG_CTX,
      toError("verifyRegistrationResponse: verified=false veya registrationInfo yok"),
      {
        verified: verification.verified,
        hasRegistrationInfo: Boolean(verification.registrationInfo),
        expectedOrigin,
        expectedRPID,
      }
    );
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
}): Promise<{ verified: true; newCounter: number }> {
  const expectedOrigin = params.expectedOrigin ?? getWebAuthnOrigin();
  const expectedRPID = getWebAuthnRpId();

  const expectedChallenge = await consumeWebAuthnChallengeCookie();

  if (!expectedChallenge) {
    logNfcErrorAndThrow(
      VERIFY_AUTH_CTX,
      toError("WebAuthn challenge çerezi eksik veya süresi dolmuş"),
      { step: "consumeWebAuthnChallengeCookie", credentialId: params.stored.credentialId }
    );
  }

  let verification: Awaited<ReturnType<typeof verifyAuthenticationResponse>>;

  try {
    verification = await verifyAuthenticationResponse({
      response: params.response,
      expectedChallenge,
      expectedOrigin,
      expectedRPID,
      credential: {
        id: params.stored.credentialId,
        publicKey: Buffer.from(params.stored.publicKey, "base64url"),
        counter: params.stored.counter,
        transports: params.stored.transports,
      },
      requireUserVerification: true,
    });
  } catch (error) {
    logNfcErrorAndThrow(VERIFY_AUTH_CTX, error, {
      step: "verifyAuthenticationResponse",
      expectedOrigin,
      expectedRPID,
      credentialId: params.stored.credentialId,
      responseId: params.response.id,
    });
  }

  if (!verification.verified) {
    logNfcErrorAndThrow(
      VERIFY_AUTH_CTX,
      toError("verifyAuthenticationResponse: verified=false"),
      {
        expectedOrigin,
        expectedRPID,
        newCounter: verification.authenticationInfo?.newCounter,
      }
    );
  }

  return {
    verified: true,
    newCounter:
      verification.authenticationInfo?.newCounter ?? params.stored.counter,
  };
}
