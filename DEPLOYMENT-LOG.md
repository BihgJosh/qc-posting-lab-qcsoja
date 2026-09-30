# QC Posting Lab deployment log

## 2026-09-30 — Main app posting format, v0.2.0

- Deployment: `dpl_8KwmKDc4TDdA7x2o26w8nFM4NAMu`; Ready confirmed with alias https://qc-posting-lab-qcsoja.vercel.app.
- Read the current saved main app posting structure using read-only access; copied section names, service rows, position columns and staffing counts without member identities.
- Sunday template: six sections, 44 member entries covering 48 service duties; manager and timer assignments span paired services. Thursday preserves the six current sections and their empty staffing counts.
- Added editable required members per position, section totals, service totals, gap indicators and main-format draft exports. All 28 sample members and 15 sample reports are fictional.
- Five meaningful tests passed. Live browser verified the default 44/44 entries and zero gaps; increasing the first Children entrance to two members produced 45/45 entries and the correct 3/3 Children total. Restored default counts afterward.
- Browser preview saved to ../qc-posting-lab-preview.png. Main product deployment unchanged. Recommendations remain a rules baseline, not a trained ML model.

## 2026-09-30 — Fictional test names

- Replaced numbered Demo Member labels with 12 explicit fictional sample names; report identities updated consistently. Emails remain under example.invalid.
- Deployment: `dpl_56226BgDiAXeCiV7WWch9595jVh3`; Ready with alias https://qc-posting-lab-qcsoja.vercel.app.
- Scheduler tests: 4 passed. No live member data used.

Times are Africa/Lagos (WAT, UTC+01:00).

## 2026-09-30 — Initial isolated baseline test

- App version: 0.1.0; local source only, no main QC repository commit.
- Separate Vercel project: `qc-posting-lab-qcsoja`, `prj_UL97jXYAZFvO2wHkSMQKvjNGsaBv`.
- Deployment: `dpl_VqMvmA7rdWRSfRzDF69zRxdtFwFA`.
- Created: 14:03:28 WAT; Ready confirmed and HTTP verification completed by 14:06 WAT.
- Test URL: https://qc-posting-lab-qcsoja.vercel.app
- Inspection: https://vercel.com/bigh-devs/qc-posting-lab-qcsoja/VqMvmA7rdWRSfRzDF69zRxdtFwFA
- Vercel target is production within the separate test project because this is its first deployment. Main `qcu` project and `qcsoja.com` were not deployed or relinked.
- Four meaningful scheduler tests passed. Hosted index, JavaScript and demonstration JSON returned HTTP 200. Environment-file route returned 404. Demonstration processing used 15 records, produced 20 positions, left no gaps, and respected the two-service cap.
- Visual/browser interaction QA remains unverified: CUA kernel failed to start with a Windows sandbox ACL error. Opening the test URL in Codex was queued.
- Data status: fictional sample records only; canonical JSON exports can be imported locally in the browser. No live database connection, trained model, attendance prediction, Inngest connection, posting publication or email delivery.
- Next required stage: verified read-only report dataset and explicit eligibility/availability, dated approved posting history, staffing configuration and temporal evaluation against the baseline before model-backed recommendations.
