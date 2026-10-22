# CivicShield architecture

## Trust boundary

The prototype treats application and storage infrastructure as potentially compromised. Neither receives durable plaintext video keys. Authority is contextual and temporary.

## Request lifecycle

1. A camera fragments and encrypts video under a camera/zone tag.
2. The vault stores only ciphertext and integrity metadata.
3. An authenticated operator submits operator ID, incident ticket, time window, camera ID, and DPoP proof.
4. Policy validates the operator role, resource ACL, purpose, and requested duration.
5. Sensitive scopes additionally require quorum signatures from distinct enrolled approvers on separate TideCloak sessions. The requesting administrator is excluded from approving their own override request.
6. Tide releases ephemeral decryption authority bound to the requesting device.
7. The client decrypts locally until expiry.
8. Every transition is appended to a tamper-evident audit chain.

## TideCloak mapping

- IAM / OIDC: operator and approver identity.
- ACLs: isolated camera scopes and municipal roles.
- Hermetic E2EE: browser-side, tag-based encrypt/decrypt flows.
- DPoP: binds access tokens to a device-held key.
- QEA: governs sensitive role, scope, and policy changes through threshold approval.
- IAAA: identification, authentication, authorization, and accountability across the complete request.

## Production controls omitted from the prototype

The UI simulates camera footage, ciphertext, signatures, and audit hashes for a safe two-minute demonstration. A production system must use a provisioned TideCloak realm, server-verified tokens, real QEA change requests, protected audit storage, camera hardware roots of trust, key rotation, retention policies, and jurisdiction-specific privacy controls.
