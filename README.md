# DealDost

Free tools for Indian creators: find a fair price for brand deals, and check if a brand offer is real.

## Run locally
```bash
nvm use            # Node 22
npm install
npm run dev
```
Open http://localhost:3000. Works without any cloud setup (brand check uses rules only).

To use Firestore and Claude on Vertex AI, follow **Setup and deploy** in [PROJECT.md](PROJECT.md).

## Scripts
- `npm test`: unit tests
- `npm run typecheck`: TypeScript check
- `npm run lint`: ESLint

See [PROJECT.md](PROJECT.md) for the goal, architecture and progress.
