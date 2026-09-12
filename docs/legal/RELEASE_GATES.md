# Release gates

No item below is complete merely because code exists. The release owner must attach evidence and date every approval.

## Brand and legal

- [ ] Written Brazilian IP opinion covering the mechanics, generic creatures and legal-distance redesign.
- [ ] INPI search and counsel sign-off for the final product name.
- [ ] Domain, Apple App Store, Google Play and social-handle searches.
- [ ] Final name replaces the provisional “Mesa Oculta” label.
- [ ] Asset provenance audit complete; published packs have `publishable: true`.
- [ ] Privacy policy, terms, support address and incident procedure reviewed for Brazil and 13+ access.
- [ ] Age-assurance method reviewed; the current self-declaration must not be marketed as verified age without supporting controls.
- [ ] Production SMTP configured for Supabase Auth; the default provider is not a production mail service.

## PWA commerce

- [ ] Mercado Pago production credentials, webhook secret and refund test.
- [ ] Success, failure, duplicate, out-of-order, refund, revocation and account-switching tests.
- [ ] `COMMERCIAL_RELEASE_ENABLED=1` set only after all legal gates.
- [ ] External ads remain off until 1,000 monthly active adult hosts and privacy review.

## Native gate — trailing 30 days

- [ ] 2,000 active adult hosts.
- [ ] 5,000 completed matches.
- [ ] D30 host retention at least 15%.
- [ ] Purchaser conversion at least 3%.
- [ ] Match completion at least 75%.
- [ ] Media expense below 20% of net revenue.

Only then build the Capacitor clients with local UI, deep links, QR scanning, native sharing, haptics, push invitations, restoration and native permission controls. A thin remote webview is not an acceptable release candidate.
