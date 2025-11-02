# API Endpoint Implementation Plan: GET /api/notes

## 1. Przegląd punktu końcowego
Ten punkt końcowy jest odpowiedzialny za pobieranie listy notatek należących do uwierzytelnionego użytkownika. Obsługuje paginację, sortowanie oraz filtrowanie na podstawie powiązanych bytów i frazy wyszukiwania. Zapewnia podstawową funkcjonalność do przeglądania i wyszukiwania notatek w aplikacji.

## 2. Szczegóły żądania
- **Metoda HTTP**: `GET`
- **Struktura URL**: `/api/notes`
- **Parametry zapytania (Query Parameters)**:
  - **Opcjonalne**:
    - `page` (integer): Numer strony do pobrania. Domyślnie `1`.
    - `limit` (integer): Liczba notatek na stronę. Domyślnie `20`, maksymalnie `100`.
    - `sort` (string): Pole do sortowania. Dozwolone wartości: `"created_at"`, `"updated_at"`, `"title"`. Domyślnie `"created_at"`.
    - `order` (string): Kierunek sortowania. Dozwolone wartości: `"asc"`, `"desc"`. Domyślnie `"desc"`.
    - `search` (string): Fraza do wyszukania **tylko w tytule notatki** (wyszukiwanie case-insensitive, częściowe dopasowanie).
    - `entities` (string): Rozdzielona przecinkami lista identyfikatorów UUID bytów. Zwraca notatki powiązane ze **wszystkimi** podanymi bytami. Można łączyć z parametrem `search` dla bardziej precyzyjnego filtrowania.
- **Request Body**: Brak.

## 3. Wykorzystywane typy
- **`NotesListResponseDTO`**: Główny typ odpowiedzi.
- **`NoteDTO`**: Reprezentacja pojedynczej notatki w odpowiedzi.
- **`PaginationDTO`**: Struktura metadanych paginacji.
- **`EntityBasicDTO`**: Uproszczona reprezentacja bytu zagnieżdżonego w `NoteDTO` (z polem `relationship_type`).

## 4. Szczegóły odpowiedzi
- **Odpowiedź sukcesu (200 OK)**:
  ```json
  {
    "data": [
      {
        "id": "uuid",
        "user_id": "uuid",
        "title": "string",
        "content": "string",
        "created_at": "ISO 8601 timestamp",
        "updated_at": "ISO 8601 timestamp",
        "entities": [
          {
            "id": "uuid",
            "name": "string",
            "type": "entity_type enum",
            "description": "string",
            "relationship_type": "relationship_type enum"
          }
        ]
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100,
      "total_pages": 5
    }
  }
  ```
- **Odpowiedzi błędów**: Zobacz sekcję "Obsługa błędów".

## 5. Przepływ danych
1.  Żądanie `GET` trafia do punktu końcowego Astro `src/pages/api/notes/index.ts`.
2.  Middleware Astro weryfikuje sesję użytkownika za pomocą `context.locals.supabase`. Jeśli sesja jest nieprawidłowa, przepływ jest przerywany (zwracany jest status 401).
3.  Handler `GET` w pliku `index.ts` pobiera parametry zapytania z `Astro.url.searchParams`.
4.  Parametry są walidowane i parsowane przy użyciu dedykowanego schematu Zod z `src/lib/validation.ts`. W przypadku błędu zwracany jest status 400.
5.  Wywoływana jest funkcja z serwisu, np. `NotesService.getNotes(userId, validatedParams)`, zlokalizowana w `src/lib/services/notes.service.ts`.
6.  `NotesService` konstruuje zapytanie do Supabase:
    a. Rozpoczyna od `from('notes').select('*, note_entities(type, entities(*))')` aby pobrać byty wraz z typami relacji z tabeli `note_entities`.
    b. Dodaje filtrowanie `search` przy użyciu `.ilike('title', '%term%')` - wyszukiwanie **tylko po tytule**.
    c. Jeśli podano `entities`, dodaje warunek filtrujący, który zapewnia, że notatka jest powiązana ze wszystkimi podanymi bytami. Może to wymagać użycia funkcji RPC w PostgreSQL lub bardziej złożonego filtrowania.
    d. Parametry `search` i `entities` mogą być używane jednocześnie - wtedy filtrowanie jest addytywne (AND).
    e. Stosuje sortowanie (`.order()`) i paginację (`.range()`).
7.  `NotesService` wykonuje osobne zapytanie, aby uzyskać całkowitą liczbę pasujących rekordów (`count`), niezbędną do metadanych paginacji.
8.  Serwis formatuje dane do struktury `NotesListResponseDTO` i zwraca je do handlera API.
9.  Handler API serializuje DTO do formatu JSON i wysyła odpowiedź z kodem statusu `200 OK`.

## 6. Względy bezpieczeństwa
- **Autoryzacja**: Wszystkie zapytania do bazy danych będą wykonywane za pośrednictwem instancji `context.locals.supabase`, co gwarantuje, że polityki RLS (Row-Level Security) w PostgreSQL będą egzekwowane. Uniemożliwi to użytkownikom dostęp do notatek, które nie są ich własnością.
- **Walidacja wejścia**: Wszystkie parametry zapytania będą rygorystycznie walidowane za pomocą Zod, aby zapobiec nieoczekiwanym błędom i potencjalnym atakom.
- **Ograniczenie dostępu**: Maksymalna wartość parametru `limit` zostanie ustalona na `100`, aby zapobiec nadmiernemu obciążeniu bazy danych.

## 7. Obsługa błędów
| Warunek błędu | Kod statusu HTTP | Ciało odpowiedzi (ErrorDTO) |
|---|---|---|
| Użytkownik nie jest uwierzytelniony | `401 Unauthorized` | `{ "error": { "code": "UNAUTHORIZED", "message": "User is not authenticated." } }` |
| Błąd walidacji parametrów zapytania (np. nieprawidłowy `sort`) | `400 Bad Request` | `{ "error": { "code": "VALIDATION_ERROR", "message": "Invalid query parameters.", "details": [...] } }` |
| Wewnętrzny błąd serwera (np. błąd zapytania do bazy danych) | `500 Internal Server Error` | `{ "error": { "code": "INTERNAL_ERROR", "message": "An unexpected error occurred." } }` |

## 8. Rozważania dotyczące wydajności
- **Indeksowanie**: Należy upewnić się, że kolumny `user_id`, `created_at`, `updated_at` i `title` w tabeli `notes` są zindeksowane, aby przyspieszyć operacje filtrowania i sortowania.
- **Złożone filtrowanie**: Filtrowanie po wielu `entities` może być kosztowne. Należy zoptymalizować to zapytanie, potencjalnie tworząc dedykowaną funkcję PostgreSQL (RPC), aby zminimalizować liczbę złączeń po stronie klienta.
- **Paginacja**: Paginacja jest kluczowa dla wydajności i musi być stosowana domyślnie, aby unikać pobierania dużych zbiorów danych.
- **Zapytanie o `count`**: Zapytanie o całkowitą liczbę rekordów powinno być wykonane z tymi samymi filtrami co główne zapytanie, ale bez sortowania i limitowania, aby zapewnić spójność.

## 9. Etapy wdrożenia
1.  **Walidacja**: W pliku `src/lib/validation.ts` (utwórz, jeśli nie istnieje) zdefiniuj schemat Zod do walidacji parametrów zapytania `GET /api/notes`.
2.  **Serwis**: Utwórz plik `src/lib/services/notes.service.ts` (utwórz katalog, jeśli nie istnieje).
3.  **Implementacja `getNotes`**: W `notes.service.ts` zaimplementuj funkcję `async function getNotes(supabase: SupabaseClient, userId: string, params: ValidatedParams)`.
4.  **Konstrukcja zapytania**: Wewnątrz `getNotes` zbuduj dynamiczne zapytanie Supabase, które obsługuje `search`, `sort`, `order` i `pagination`.
5.  **Filtrowanie po bytach**: Zaimplementuj logikę filtrowania `entities`. Rozważ użycie funkcji `.rpc()` Supabase, jeśli proste filtry okażą się niewystarczające.
6.  **Pobranie `count`**: Zaimplementuj osobne zapytanie, aby uzyskać całkowitą liczbę pasujących notatek do celów paginacji.
7.  **Struktura odpowiedzi**: Sformatuj wyniki zapytania i `count` do obiektu `NotesListResponseDTO`.
8.  **Plik API Route**: Utwórz plik `src/pages/api/notes/index.ts`.
9.  **Handler `GET`**: W `index.ts` zaimplementuj handler `GET`, który:
    a. Pobiera sesję użytkownika z `context.locals.supabase`. Zwraca `401`, jeśli brak użytkownika.
    b. Waliduje parametry zapytania przy użyciu schematu Zod. Zwraca `400` w przypadku błędu.
    c. Wywołuje `NotesService.getNotes` z odpowiednimi argumentami.
    d. Obsługuje błędy z serwisu, zwracając `500`.
    e. Zwraca pomyślną odpowiedź `200 OK` z danymi z serwisu.
10. **Testowanie**: Przygotuj testy jednostkowe dla logiki serwisu i testy integracyjne dla całego punktu końcowego.
