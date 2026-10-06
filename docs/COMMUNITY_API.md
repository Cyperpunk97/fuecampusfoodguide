# Managed community API contract

This frontend can run completely device-only. If a university/community service is enabled, it must be an HTTPS API and should be configured at build time with `VITE_COMMUNITY_API_URL`, not pasted by each ordinary student.

## Required endpoints

The existing client uses these JSON endpoints:

- `GET /api/restaurants`
- `GET /api/reviews?restaurant_id=<id>&limit=<n>&offset=<n>`
- `POST /api/reviews`
- `GET /api/memories`
- `POST /api/memories`
- `POST /api/memories/:id/cheer`
- `GET /api/leaderboard`
- `GET /api/attributes`
- `POST /api/attributes`
- `POST /api/talabat/extract` (restricted administrative/source-resolution work)

## Production safeguards

A deployed service should provide all of the following before accepting campus-wide posts:

1. **Student identity and consent** — use an FUE-appropriate sign-in, do not treat a browser-local token as authentication, and publish a clear privacy notice.
2. **Rate limiting and abuse controls** — scope limits by account, IP, and action; keep replay protection server-side.
3. **Moderation** — review queues for submitted reviews/memories/menu corrections, report and takedown flows, audit logs, and a named moderator role.
4. **Validation** — enforce field lengths, score/date ranges, known venue IDs, safe URLs, and HTML-free text on the server even though the client validates inputs.
5. **Menu freshness** — retain `sourceUrl`, `checkedAt`, venue/branch scope, editor, and approval state. Do not promote a scraper result directly to “verified”.
6. **Retention and deletion** — provide a way for a student to edit/delete their posts and state a retention period.
7. **CORS and secrets** — only allow known app origins; never expose a service-role/database key to the browser.

The frontend renders remote text as text and validates the configured endpoint URL, but the API remains the security boundary.
