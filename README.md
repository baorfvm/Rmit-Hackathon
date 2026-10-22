# CivicShield

> Municipal CCTV access without a master key. CivicShield encrypts every feed at the camera and allows a temporary view only when identity, purpose, scope, and independent approval align.

## Project overview

### 1. Vision & originality
CivicShield is a privacy-preserving municipal CCTV vault. Instead of trusting a “god-mode” account, it lets authority emerge for one justified request, one camera, one device, and one short time window.

### 2. Trust constraint insight
Cities need footage for public safety, but conventional systems give administrators or cloud services enough power to expose everyone. Removing unilateral control makes useful surveillance possible without requiring citizens to blindly trust a privileged operator.

### 3. Value & impact
Security teams can investigate incidents while residents, regulators, and municipalities gain a verifiable guarantee against casual browsing and mass extraction. For example, a traffic officer may view Market Square for 15 minutes under ticket INC-2026-001, but cannot open the restricted command zone.

### 4. Why TideCloak matters
TideCloak supplies OIDC identity, scoped E2EE, DPoP-bound sessions, and Quorum-Enforced Authorization. The application server stores ciphertext but has no reusable key. Sensitive access needs independent threshold approval, so compromising one administrator is insufficient.

### 5. Prototype & storytelling
The prototype demonstrates three flows: policy-approved Zone A access, automatic Zone B denial, and a force-unlock attempt blocked until two of three independent keyholders approve. Each outcome appears in a tamper-evident event chain.

## Run locally

```bash
npm install
npm run dev
```

Open the URL printed by Vite. The default `.env.example` documents demo and live-realm configuration.

## TideCloak integration

The app imports the official `@tidecloak/js` SDK in [src/main.js](src/main.js). Demo mode is intentionally self-contained for judging. To connect a live realm:

1. Run TideCloak and create a public OIDC client with this app's origin and redirect URIs.
2. Copy `.env.example` to `.env`.
3. Set `VITE_DEMO_MODE=false` and fill the realm URL, realm, and client ID.
4. Restart `npm run dev` and use **Connect TideCloak**.

The on-screen 2-of-3 quorum interaction is a transparent prototype simulation. In production, governed writes and approvals must use TideCloak QEA change requests and distinct enrolled approvers; cryptographic enforcement must never be implemented only in UI code.

## Architecture

- Camera edge: fragments are tagged and encrypted before upload.
- Blind vault: cloud infrastructure stores ciphertext only.
- Tide authority: distributed validation checks identity, scope, policy, and quorum.
- Bound device: a short-lived key is released to the DPoP-bound operator device.
- Audit chain: every request, denial, signature, and grant produces a sealed event.

## Submission

- Prototype source: this repository
- Demo guide: [DEMO_SCRIPT.md](DEMO_SCRIPT.md)
- Architecture notes: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
- Demo video target: `demo.mp4` (under GitHub's 100 MB file limit)

To run the automated two-minute walkthrough used for the submission video, open `/?tour=1` while the development server is running.

## Build and verify

```bash
npm run check
npm run build
```

## Data and safety

All names, tickets, feeds, and audit events in the prototype are synthetic. No real CCTV source is connected.

## License

MIT — see [LICENSE](LICENSE).
