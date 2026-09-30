# QC Posting Lab — qcsoja

Isolated test application, version 0.2.0. No production app credentials, database writes, emails, automatic publication or Inngest connection.

The test copies the saved main app posting sections, position columns, service rows and member counts into a sanitized template. Sunday has six sections, 44 member entries and 48 service duties. Managers and timers cover paired services with the same member; both duties count toward load limits. Thursday preserves its six saved sections with zero current member entries. Staffing is editable per position and supports multiple members. The board mirrors the main app's service accordions and section/position member cards. Draft exports include the main app's postings/rows/assignments structure.

Leadership must provide explicit eligibility. It enforces unavailable members, no simultaneous assignments and maximum service load. It prefers lower current draft load, then matching report history. It is a heuristic baseline, not a trained ML model, performance score or attendance prediction. Greedy assignment can leave gaps even where rearrangement would find a solution; leadership review is required.

Use browser JSON import with `members`, `posts` and `observers` arrays. `members` require canonical `name`, `email`, `eligibleAreas`. Report fields match the QC schema: `report_date`, `service`, `area`, `reporter_name`, `reporter_email`, `submitted_by_email`; observers use `observer_name`. Future records, proxy submissions, explicit corrections, unknown identities and duplicate person/location/service/day evidence are excluded. Reports do not prove attendance, role qualification or performance.

The sample contains 28 fictional names and example.invalid emails, including four members eligible for Service Manager duties. Imported records stay in browser memory and are never uploaded or persisted. Closing the tab clears them. Exported drafts include member identities, so keep exported files private. Only section labels and counts were read from the main app; no member identities were copied into this test template.

Next stage: obtain a verified read-only dataset with confirmed Team Data identities and role eligibility, audit coverage and proxy/correction attribution, preserve dated approved assignment snapshots, add staffing requirements, then evaluate a trained recommender on later services against this baseline. Availability must remain an explicit constraint. Keep serving and any Inngest test events in separate test environments.

Verification: `npm test` or `node --test posting.test.mjs`. Deployment must be linked only to `qc-posting-lab-qcsoja`.
