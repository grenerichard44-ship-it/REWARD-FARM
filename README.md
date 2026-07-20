# Reward Farm — Product Source of Truth

This file is the binding product specification for human contributors and coding agents. Read it before changing the application. Preserve these rules unless the product owner explicitly changes them.

## Product boundaries

Reward Farm consists of two connected applications using one shared live backend:

- The member experience contains Farm World, Campaign City, Work, Farm Vault, notifications, profile settings, and contextual guidance.
- The administration experience controls every record and setting that can appear in the member experience.
- The current campaign-content focus is YouTube video marketing.
- Do not mention unapproved channels, future integrations, roadmap ideas, or internal product discussions in either application.

## Non-negotiable data rule

No client-managed or member-specific information may be hard-coded into application components, static arrays, page markup, stylesheets, or build scripts.

This includes:

- organizations and branding;
- administrators, roles, names, initials, emails, and avatars;
- members and invitations;
- campaigns;
- tasks;
- YouTube connections, channels, videos, thumbnails, and URLs;
- rewards and balances;
- submissions and completion states;
- payout requests;
- notifications;
- dashboard totals and activity;
- dates, schedules, limits, and platform settings;
- audit events.

Every client-managed record must come from the shared backend and support the appropriate create, view, edit, archive, restore, and delete operations. An empty backend must produce a useful empty state, never fictional data.

## Production-language firewall

Repository documentation, source comments, commit messages, pull requests, tests, and internal logs may use accurate technical language. Customer-facing and administrator-facing product surfaces must not expose internal development language.

The following must not appear in visible application copy, page titles, navigation, form help, empty states, notifications, tooltips, modals, emails, URLs chosen by the product, or generated production content:

- engineering instructions or implementation commentary;
- prompts or prompt-writing instructions;
- changelogs, developer notes, build notes, migration notes, or release commentary;
- mock, demo, prototype, placeholder, sample, seeded, hard-coded, local host, database connection, environment variable, API key, service role, schema, collection, query, webhook, SDK event, pixel, stack trace, debug, deployment, or similar implementation jargon;
- legal, compliance, policy, contractual, disclaimer, liability, or regulatory language unless the product owner supplies approved final copy for a specifically designated screen;
- proof, evidence, proof upload, evidence upload, proof gallery, evidence gallery, or similar terminology.

Do not explain unfinished engineering inside the UI. Disable unavailable actions only when necessary and give users a plain-language action they can take. Technical diagnostics belong in protected logs, not product copy.

## Product voice

Visible copy must be concise, calm, direct, and written for the person using the feature.

Prefer language such as:

- Connect YouTube
- Choose a channel
- Select videos
- Create campaign
- Add task
- Publish
- Pause
- Archive
- Delete
- No campaigns yet
- No tasks yet
- Try again
- Reconnect account

Do not expose internal architecture to explain a user action.

## Identity and branding

- Never use a developer, freelancer, contributor, or account-holder identity as client branding.
- Never derive application branding from a hosting username, email address, repository owner, Google account, or connected-tool profile.
- Organization name, app name, logos, colors, and support details must be configurable client-owned records.
- Generic signed-in identity is loaded from authentication and profile data, not source code.

## Authentication and authorization

- Any Google account may authenticate through the configured Google sign-in flow.
- No Google account, Gmail address, YouTube account, channel, or user is predefined in code.
- Authentication alone does not grant administrative access.
- Administrative access is controlled by live invitations, role records, and account status.
- Member access is invitation-only.
- Supported administrative roles are `super_admin` and `admin` unless the product owner changes them.
- Administrators can be invited, edited, disabled, restored, and removed according to role permissions.
- Private records are inaccessible by default.

## YouTube connection

- An authorized administrator can select **Connect YouTube** and authenticate with any eligible Google account.
- The connection flow must discover channels available to that account, including eligible Brand Account channels.
- The administrator chooses the channel; no channel is assumed.
- Channel and video information is retrieved from YouTube and stored as synchronized backend records.
- Administrators can refresh the video list, search it, select videos, deselect videos, disconnect an account, or replace a connection.
- OAuth secrets and refresh tokens remain server-side and must never be returned to browser code or stored in ordinary readable documents.
- Request only the minimum Google permissions required for the implemented actions.
- A revoked or expired connection presents a clear **Reconnect YouTube** action.
- Do not claim that YouTube confirms a genuine view, like, subscription, or watch duration unless the implemented Google API explicitly supplies that confirmation.

## Campaigns

- Campaigns are backend records, never site content.
- Administrators can create, view, edit, publish, pause, archive, restore, and delete campaigns.
- A campaign can reference selected YouTube videos.
- Only campaigns that are published and currently available may appear in Farm World or Campaign City.
- Paused, archived, expired, or deleted campaigns disappear from member discovery.
- Campaign totals and dashboard activity are calculated from live records.

## Tasks

- Tasks are backend records, never static cards or table rows.
- Every task belongs to a campaign.
- Administrators can create, view, edit, publish, pause, archive, restore, and delete tasks.
- A task may reference one selected YouTube video.
- Task configuration includes instructions, reward, availability, limits, repeat behavior, completion state, and the actual supported confirmation method.
- Only published tasks belonging to a published campaign may appear to members.
- Removing, pausing, archiving, or deleting a task removes it from member-facing availability.
- Do not display a completion method that is not implemented.

## Rewards and requests

- GEM is an internal activity tally.
- Store GEM as integer smallest units; never use floating-point arithmetic for ledger values.
- Members cannot award or modify their own GEM.
- Ledger writes are server-controlled, immutable, and idempotent.
- Payout requests are platform records and notifications. The application does not move funds or convert currencies.
- Administrative changes to rewards and requests are permission-controlled and audited.

## Administration requirements

Every visible administrator action must work. Decorative buttons are prohibited.

All management screens require:

- live records or a genuine empty state;
- working create and edit forms;
- validation;
- loading, success, and failure states;
- archive, restore, and delete controls where applicable;
- confirmation before destructive actions;
- functional search, filters, and pagination where record volume requires them;
- audit entries for sensitive changes.

Dashboard figures must be derived from live records. Never type representative totals directly into components.

## Member-experience requirements

- Farm World and Campaign City are alternate views of live campaigns, tasks, progress, and balances.
- Structured Work view and visual Farm view must stay consistent.
- Removed or unavailable records must not survive in cards, counts, recommendations, notifications, or detail routes.
- Detail routes must show a useful unavailable state when a record is no longer accessible.
- Guidance may read authorized live state but must not perform member actions or administrative mutations.

## Responsive interface

- Support desktop, tablet, and mobile layouts.
- Navigation, account controls, and content must never overlap.
- Fixed sidebars and footers must not cover navigation items.
- Tables must remain usable on narrow screens through responsive layouts or deliberate horizontal scrolling.
- Forms, dialogs, buttons, and touch targets must remain accessible at common viewport sizes.
- A successful build is not sufficient; verify the deployed interface at desktop and mobile sizes.

## Security baseline

- Deny backend access by default.
- Members read only their authorized private records and published member content.
- Members cannot write campaigns, tasks, roles, ledger entries, administrative records, or another member's data.
- Sensitive YouTube token handling and reward operations run only in trusted server code.
- Validate privileged writes server-side and enforce corresponding backend rules.
- Store secrets only in the approved secret manager or protected runtime configuration.
- Administrative create, update, status, role, reward, request, and delete actions are audited.

## Agent anti-drift protocol

Before changing code, every agent must:

1. Read this README.
2. Inspect the existing data flow before adding UI.
3. Reuse the shared backend rather than creating a competing local store.
4. Preserve the current approved product boundaries.
5. Search visible copy for forbidden production language.
6. Search source code for fictional records and hard-coded client data.
7. Confirm that every new control has a real handler and persistent result.
8. Verify that administrator changes propagate to the member experience.
9. Test empty, loading, success, failure, archived, deleted, unauthorized, desktop, and mobile states.
10. Report remaining limitations accurately outside the product UI.

Agents must not:

- invent product strategy, integrations, business rules, identities, campaigns, tasks, metrics, or dates;
- convert internal discussion into product copy;
- add a feature merely because a navigation label or button exists;
- preserve fictional data to make a screen look populated;
- substitute browser-only storage for the shared backend;
- expose secrets or personal account information;
- declare a feature complete when its controls do not persist real changes;
- publish a build that contains overlapping navigation or unusable responsive states;
- place engineering status messages in customer-facing screens.

## Completion gate

A feature is complete only when:

- its data is live and persistent;
- authorized users can perform the intended operations;
- unauthorized users are blocked;
- the member and administration experiences remain synchronized;
- empty and failure states work;
- responsive behavior is verified;
- visible copy passes the production-language firewall;
- no personal developer identity or fictional client data appears;
- the deployed version has been tested through its real URL.

Do not weaken these requirements to make an incomplete screen appear finished.
