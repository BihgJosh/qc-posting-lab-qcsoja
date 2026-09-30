# QC Posting Lab

This is an isolated test app. Use fictional names and example.invalid addresses. Keep the main QC app, databases and Vercel project qcu untouched.

Run `npm test` before handing off scheduler changes. Preview with `python3 -m http.server 8080`. No dependency installation or credentials are required.

Preserve posting-template.json section names, columns, service rows and paired manager/timer services. Required member counts must be editable and reflected in section totals and gap indicators. Prevent service conflicts and respect availability and load limits.

Current recommendations are a rules baseline, not trained ML. Report this accurately. Future ML work should first define data contracts and temporal evaluation using synthetic records. Do not connect live databases without user direction.

Keep explanations brief and precise. Include verification evidence and limitations.

Deployment project: qc-posting-lab-qcsoja under bigh-devs. URL: https://qc-posting-lab-qcsoja.vercel.app/. Never commit credentials or .vercel. Cloud tasks should return reviewable changes through a pull request.
