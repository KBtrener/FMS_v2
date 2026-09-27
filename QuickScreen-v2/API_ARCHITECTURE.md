# QuickScreen V2 REST API

QuickScreen V2 uses the existing Supabase project and a separate PostgreSQL schema named `quickscreen_v2`. The frontend communicates through one Edge Function; other applications can use the same versioned HTTP contract. Supabase Edge Functions run in Deno/TypeScript, while an application written in FastAPI can consume this API over HTTP.

## Base URL and authorization

`https://<project-ref>.supabase.co/functions/v1/quickscreen-api/v1`

Send the Supabase publishable key in `apikey` and the signed-in user's access token as `Authorization: Bearer <access_token>`. The function validates the token and uses it for database requests, so row-level security remains active. Every route requires an authenticated session.

## Routes

| Method | Route | Purpose |
|---|---|---|
| `GET` | `/me` | Signed-in profile |
| `GET` | `/scenarios` | Active scenarios |
| `GET` | `/scenarios/{id}/definition?locale=pl` | Ordered tests, fields, choices, criteria and version |
| `GET` | `/clients?q=...` | Search accessible clients |
| `POST` | `/clients/resolve` | Resolve or create a client |
| `GET` | `/clients/{id}` | Read a client profile |
| `GET` | `/dashboard` | Recent completed assessments |
| `POST` | `/assessments` | Start a draft |
| `GET` | `/assessments/{id}` | Read an assessment |
| `PATCH` | `/assessments/{id}` | Atomically replace its current answers and notes |
| `POST` | `/assessments/{id}/complete` | Validate answers, apply rules, calculate and finalize |
| `GET` | `/assessments/latest` | Latest completed assessment ID |
| `GET` | `/assessments/{id}/results` | Results for the existing results view |

Request and response property names are camelCase. Database IDs and stable field codes identify domain records; translated labels are presentation values. The default locale is Polish. English names and labels are stored alongside Polish ones.

## Data and access

Migrations in this module create V2 tables and policies only in `quickscreen_v2`. The data-copy migration reads the existing `public` schema and inserts matching columns into the isolated V2 tables; it does not update or delete V1 rows. Profiles retain their Supabase Auth UUID. Assessment drafts, answers, completion checks and scoring run under the authenticated user's RLS context.

Before deployment, add `quickscreen_v2` to the Supabase project's exposed Data API schemas. Never expose a service-role key in the browser. Existing Storage objects need a separate transfer because SQL cannot copy their binary contents.
