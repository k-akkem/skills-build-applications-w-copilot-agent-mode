# OctoFit Tracker architecture

OctoFit Tracker is a three-tier application for a school fitness program. The starter code includes API contracts and intentionally incomplete implementation points so you can use GitHub Copilot agent mode in a test-driven loop.

![Three-tier OctoFit architecture](../.github/images/octofit-architecture.svg)

## Tier boundaries

- **Presentation tier**: React 19, Vite, React Router, Bootstrap, and a shared API client in `octofit-tracker/frontend/src`.
- **Logic tier**: Express and TypeScript routes/services in `octofit-tracker/backend/src` expose `/api/*` behavior on port `8000`.
- **Data tier**: Mongoose models and seed data in `octofit-tracker/backend/src/models` and `src/scripts/seed.ts` persist to MongoDB on port `27017`.

## Ports and environment rules

- MongoDB: `27017`
- Express API: `8000`
- Vite frontend: `5173`
- The browser calls relative `/api` paths. Vite proxies them to `http://localhost:8000`, so the unauthenticated API port stays private in Codespaces. `VITE_API_BASE_URL` can override the base URL.

## API contract

| Capability | Method and path | Expected behavior |
| --- | --- | --- |
| Activity tracking | `GET /api/activities`, `POST /api/activities` | List and create valid activity records. POST accepts `userId`, `teamId`, `type`, and `minutes`; `userId` and `teamId` must be well-formed IDs for an existing user and team; otherwise respond with a deliberate 4xx (never a 500 from a cast error). A created activity stores the submitted `user`, `team`, `type`, and `minutes` plus computed `points` and `occurredAt`. |
| Teams | `GET /api/teams`, `POST /api/teams` | List and create teams with members. Created and listed teams keep the submitted `name` and `mascot`. Reject a team without a name with `400`. |
| Leaderboard | `GET /api/leaderboard` | Return teams ordered by the sum of their activity points, highest first. Each entry has `teamName`, `totalPoints`, and a 1-based `rank`. |
| Workout suggestions | `GET /api/workouts/suggestions/:userEmail` | Recommend workouts from recent activity patterns for the matching seeded user's email address. The first suggestion's `focus` matches that user's goal or recent activity, with a `reason` explaining why. An email with no matching user returns a deliberate 4xx (for example, `404`). |

## Implementation decisions

- Presentation tier decision: Keep the React UI focused on rendering, loading, empty, and error states, and route all API traffic through a shared client so the browser remains decoupled from the backend contract and can show accessible status/alert feedback.
- Logic tier decision: Implement the Express API as a thin service layer: validate request bodies and IDs before database writes, compute activity points and timestamps in the service layer, and return explicit 4xx responses for invalid references and missing users instead of leaking Mongo cast errors.
- Data tier decision: Use Mongoose schemas to enforce required fields, object references, default arrays, and initial seed fixtures that are idempotent and safe to re-run without duplicating or destroying sentinel data.
- Activity tracking approach: Store each activity with `user`, `team`, `type`, `minutes`, and computed `points` and `occurredAt`, and require valid references to existing users and teams with deliberate validation rather than uncontrolled failures.
- Team management approach: Require a `name` and `mascot` on team creation, default `members` to an empty array, and preserve member IDs as user references when teams are created or listed.
- Leaderboard approach: Aggregate points by team, sort descending by total points, and assign ranks starting at 1 so the leaderboard reflects current activity totals without manual ordering logic in the UI.
- Workout suggestions approach: Match workout recommendations to a user’s recent activity or fitness goal, favor recent patterns like endurance or strength, and include a brief reason so the first recommendation explains the connection to the user’s behavior.

## Test plan

- Data-tier command: `npm run test:data --prefix octofit-tracker/backend` — verifies Mongoose validation, seed idempotency, and preservation of sentinel records across repeated seed runs.
- API command: `npm run test:api --prefix octofit-tracker/backend` — verifies the `/api/*` contract for activities, teams, leaderboard, and workout suggestions, including 4xx handling for invalid input and unknown users.
- Frontend command: `npm test --prefix octofit-tracker/frontend` — verifies the UI loads data, exposes accessible loading/empty/error states, and calls the correct `/api` endpoints for each capability.
- Backend build command: `npm run build --prefix octofit-tracker/backend` — ensures the server code type-checks cleanly before relying on the API contract.
- Frontend build command: `npm run build --prefix octofit-tracker/frontend` — ensures the app compiles and the Vite React UI remains consistent with the shared API contract.
