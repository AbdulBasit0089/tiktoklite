# TikTok‑lite (Azure Static Web Apps + Functions)

This starter is intentionally minimal so you can deploy fast for coursework.

## What it has
- Static frontend (`/app`) with upload (for Creators), list, search, playback, comments, ratings.
- Azure Functions API (`/api`) for SAS upload URLs, videos, comments, ratings.
- Cosmos DB (NoSQL) containers expected: `videos`, `comments`, `users`, `ratings`.
- Azure Blob Storage container expected: `videos` (public read).

## Environment variables (set in Azure Static Web App -> Configuration)
- COSMOS_ENDPOINT
- COSMOS_KEY
- COSMOS_DB_NAME = tiktoklite
- COSMOS_CONTAINER_VIDEOS = videos
- COSMOS_CONTAINER_COMMENTS = comments
- COSMOS_CONTAINER_USERS = users
- COSMOS_CONTAINER_RATINGS = ratings
- STORAGE_ACCOUNT_NAME
- STORAGE_ACCOUNT_KEY
- STORAGE_CONTAINER = videos

## First Creator
1) Deploy and sign in via the site (GitHub provider).
2) Call `/api/me` in the browser to get your `userId` OR open the Network tab while loading the page.
3) In Azure Portal -> Cosmos DB -> Data Explorer -> `users` container -> **New item**:
```json
{ "id": "<your userId>", "roles": ["Creator"] }
```
4) Refresh the site; the Upload section will appear.

## Local development (optional)
This repo is designed for Azure build. If you run locally, use `swa` CLI to emulate auth headers.
