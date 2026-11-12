# building-management

Monorepo (pnpm + Turborepo) z backendem NestJS i bazą PostgreSQL obsługiwaną przez Drizzle ORM.

## Stack

- **TypeScript** (ESM w całym repo)
- **Turborepo** – orkiestracja zadań w monorepo
- **NestJS 12** – backend (`apps/server`)
- **Drizzle ORM + drizzle-kit** – schemat, zapytania i migracje (`packages/db`)
- **PostgreSQL 18** – lokalnie przez Docker Compose
- **Varlock** – walidowane i typowane zmienne środowiskowe

## Struktura

```
building-management/
├── apps/
│   └── server/            # NestJS API (moduły: database, health, buildings)
├── packages/
│   ├── config/            # wspólny tsconfig
│   └── db/                # schemat Drizzle, createDb(), migracje, drizzle.config.ts
├── docker-compose.yml     # Postgres
└── .env.schema            # wspólne zmienne (DATABASE_URL)
```

`apps/server` łączy się z bazą przez `@nestjs/drizzle` — instancję tworzy `createDb()` z `@building-management/db`, a w serwisach wstrzykuje się ją dekoratorem `@InjectDrizzle()` (typ `Database`).

## Start

```bash
pnpm install        # instaluje zależności i generuje apps/server/src/env.ts
pnpm db:start       # uruchamia Postgresa w Dockerze
pnpm db:migrate     # wykonuje migracje
pnpm dev            # buduje packages/db i odpala API w trybie watch na :3000
```

Sprawdzenie: `curl localhost:3000/health`.

## Baza danych

Schemat tabel jest w `packages/db/src/schema/`. Po zmianie schematu:

```bash
pnpm db:generate    # generuje migrację SQL do packages/db/migrations
pnpm db:migrate     # wykonuje ją na bazie
```

Inne: `pnpm db:push` (synchronizacja schematu bez migracji, do szybkich prototypów), `pnpm db:studio` (Drizzle Studio), `pnpm db:stop`.

## Zmienne środowiskowe

Schematy zmiennych są w plikach `.env.schema` (commitowane). Główny `.env.schema` definiuje konfigurację Postgresa (`COMPOSE_PROJECT_NAME`, `POSTGRES_PORT`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`, ...) i składa z niej `DATABASE_URL`; importują go `apps/server` i `packages/db`. Lokalne nadpisania wpisuj do `.env` lub `.env.local` w roocie (oba ignorowane przez git). `pnpm db:start`/`db:stop` uruchamiają docker compose przez `varlock run`, więc kontener i aplikacja zawsze widzą te same wartości.

### Kilka instancji bazy

Żeby postawić kolejną, niezależną bazę (np. w drugiej kopii repo / worktree), ustaw w jej `.env` inną nazwę projektu i port:

```env
COMPOSE_PROJECT_NAME=building-management-2
POSTGRES_PORT=5433
```

Każdy projekt dostaje własny kontener i wolumen, a `DATABASE_URL` sam wskaże na nowy port.

Varlock generuje `apps/server/src/env.ts` przy instalacji; po zmianie schematu uruchom `pnpm env:generate`. W kodzie używaj `ENV` z `./env.js` zamiast `process.env`.

## Skrypty

- `pnpm dev` – tryb developerski wszystkich aplikacji
- `pnpm build` – build wszystkiego
- `pnpm check-types` – sprawdzenie typów
- `pnpm lint` – oxlint
- `pnpm test` – testy jednostkowe (Vitest)
- `pnpm --filter server test:e2e` – testy e2e API (wymagają działającej bazy)
- `pnpm db:*` – patrz sekcja „Baza danych”
