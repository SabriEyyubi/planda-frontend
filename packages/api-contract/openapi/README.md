# OpenAPI input

Place the backend-owned contract at `openapi/openapi.json`, then run
`pnpm api:generate` from the repository root. Generated files are never edited
manually. Until the real contract arrives, this package intentionally exports
no endpoint DTOs.
