# Two-minute demo script

## 0:00–0:15 — The possibility

“CivicShield is a municipal CCTV vault with no master key. It gives investigators useful access without giving any administrator, cloud, or vendor unilateral power over the city’s video.”

Show the hero, then scroll to **Live prototype**.

## 0:15–0:38 — Authorized standard flow

Select **Standard access**. Point out the OIDC identity, incident ticket, Zone A ACL, and DPoP device proof. Click **Request scoped access**.

“The policy matches. Tide authority releases one device-bound ephemeral key for this camera and fifteen-minute window. The cloud never receives the key.”

## 0:38–0:58 — Out-of-scope denial

Select **Out-of-scope**, then **Test policy boundary**.

“The same verified operator asks for a restricted camera. Authentication is not enough: the camera scope fails, no key is issued, and the denial becomes evidence.”

## 0:58–1:32 — Blocked admin override

Select **Admin override**, then **Force unlock all cameras**.

“A system administrator tries the classic god-mode shortcut. CivicShield denies unilateral access: the requesting admin cannot approve their own request. A separate Security Director approves from their TideCloak session, but the request remains blocked. Only after Civil Oversight independently approves from another session does authority emerge.”

Use the demo controls to simulate two remote approvals arriving from the other administrators' separate devices, then issue the scoped key.

## 1:32–1:48 — Auditability

Scroll to **Every decision leaves a receipt**.

“Approvals, denials, and access windows form a tamper-evident chain. An override attempt cannot disappear into an admin console.”

## 1:48–2:00 — What changes

Scroll to the closing statement.

“With TideCloak, public safety no longer depends on a master password. The city can protect people—and protect the people in its footage.”
