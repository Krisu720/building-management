# Building Management  

# Opis projektu  

Aplikacja webowa wspomagająca zgłaszanie usterek oraz zarządzanie przeglądami technicznymi mieszkań i budynków mieszkalnych. Ułatwia komunikację między mieszkańcami, administracją i pracownikami technicznymi, umożliwiając obsługę zgłoszeń, śledzenie ich statusów, planowanie przeglądów. 
 
Projekt realizowany w ramach przedmiotu **Projekt Systemu Aplikacji Multimedialnej 2026/2027**. 

# Aktualne funkcjonalności aplikacji
- Rejestracja, logowanie i zmiana hasła.
- Widoki panelu dostosowane do ról administratora, mieszkańca i technika.
- Zgłaszanie usterek w mieszkaniach i częściach wspólnych budynków.
- Przeglądanie zgłoszeń i śledzenie ich statusów.
- Przeglądanie i dodawanie budynków wraz z mieszkaniami.
- Przeglądanie listy mieszkańców i przypisywanie im mieszkań.
- Planowanie przeglądów technicznych i przypisywanie techników.
- Wyświetlanie przeglądów dotyczących mieszkańca oraz przeglądów przypisanych technikowi.

# Technologie 

Formularze: React Hook Form, Zod v4. 

API: TanStack Query, Orval.

Backend: NestJS, Better Auth, Swagger/OpenAPI.  

Baza danych: PostgreSQL, Drizzle ORM.  

Narzędzia: pnpm, Turborepo, Docker Compose, Varlock.

Testy: Playwright.

# Wymagania 

Git. 

Node.js 22.23.3. 

pnpm 12.18.0.  

Docker z Docker Compose.  

# Instalacja 
```
git clone https://github.com/Krisu720/building-management.git 
```
```
cd building-management 
```
```
pnpm install  
```

Konfigurację opisują pliki .env.schema. Lokalne wartości można nadpisać w plikach .env lub .env.local.

## Konfiguracja środowiska

Zmienne środowiskowe są opisane w plikach `.env.schema` i walidowane przez Varlock. Własne wartości można ustawić w plikach `.env` lub `.env.local`, które nie są dodawane do repozytorium.

Najważniejsze zmienne:

- `DATABASE_URL` — adres połączenia z bazą PostgreSQL.
- `PORT` — port backendu, domyślnie `3000`.
- `BETTER_AUTH_URL` — adres backendu, domyślnie `http://localhost:3000`.
- `BETTER_AUTH_SECRET` — sekret używany do uwierzytelniania.
- `WEB_URL` — adres frontendu, domyślnie `http://localhost:3001`.
- `API_URL` — adres backendu używany przez frontend, domyślnie `http://localhost:3000`.

Konfiguracja bazy znajduje się w głównym `.env.schema`, a konfiguracja backendu w `apps/server/.env.schema`. Po zmianie schematów odśwież typy zmiennych:

```bash
pnpm env:generate
```

# Uruchomienie  

Uruchom Docker, a następnie wykonaj:  
```
pnpm db:start 
```
```
pnpm db:migrate
```
```
pnpm dev  
```
Aplikacja: http://localhost:3001  

Dokumentacja API: http://localhost:3000/api/docs  

Do wysłania zgłoszenia potrzebny jest budynek zapisany w bazie oraz, w przypadku usterki w mieszkaniu, przypisany do niego lokal. 

# Autorzy  

Oskar Brandt (awakexq) 

Krzysztof Wilk (Krisu720) 

Mateusz Szewczyk (UnluckyShadow) 

Jakub Ścigaj (scigusk0x) 

Grupa PAW 1 
