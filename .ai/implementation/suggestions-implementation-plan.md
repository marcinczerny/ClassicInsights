# API Endpoint Implementation Plan: AI Suggestions

Ten dokument zawiera szczegółowy plan implementacji dla punktów końcowych API związanych z sugestiami AI.

---

## Endpoint 1: POST /api/notes/:id/analyze

### 1. Przegląd punktu końcowego

Ten punkt końcowy inicjuje analizę treści notatki przez AI w celu wygenerowania sugestii, takich jak cytaty, podsumowania lub powiązania z encjami. W początkowej fazie, zamiast komunikacji z rzeczywistym modelem AI, zostanie wykorzystany serwis mockujący, który zwróci predefiniowane dane. Punkt końcowy weryfikuje zgodę użytkownika na przetwarzanie danych przez AI przed rozpoczęciem analizy.

### 2. Szczegóły żądania

- **Metoda HTTP**: `POST`
- **Struktura URL**: `/api/notes/:id/analyze`
- **Parametry URL**:
  - **Wymagane**: `id` (UUID notatki)
- **Request Body**: Brak

### 3. Wykorzystywane typy

- `AnalyzeNoteResponseDTO`
- `SuggestionPreviewDTO`
- `ErrorDTO`

### 4. Szczegóły odpowiedzi

- **Odpowiedź sukcesu (200 OK)**:
  ```json
  {
    "note_id": "uuid",
    "suggestions": [
      {
        "id": "uuid",
        "type": "suggestion_type enum",
        "status": "pending",
        "name": "string",
        "content": "string",
        "suggested_entity_id": "uuid",
        "created_at": "ISO 8601 timestamp"
      }
    ],
    "generation_duration_ms": 123
  }
  ```
- **Odpowiedzi błędów**: Zobacz sekcję "Obsługa błędów".

### 5. Przepływ danych

1.  **Router (Astro)**: `src/pages/api/notes/[id]/analyze.ts` odbiera żądanie.
2.  **Walidacja wejściowa**: Zod weryfikuje, czy parametr `id` jest poprawnym UUID.
3.  **Wywołanie serwisu**: Router wywołuje metodę `analyzeNote(noteId)` z nowego serwisu `suggestions.service.ts`.
4.  **Logika w serwisie (`suggestions.service.ts`)**:
    a. Pobiera `userId` z `context.locals.user`.
    b. Pobiera profil użytkownika, używając `profile.service.ts`, aby sprawdzić pole `has_agreed_to_ai_data_processing`. Jeśli jest `false`, zwraca błąd.
    c. Pobiera notatkę, używając `notes.service.ts`, aby zweryfikować jej istnienie i przynależność do użytkownika.
    d. Sprawdza, czy treść notatki nie jest pusta. Jeśli tak, zwraca błąd.
    e. **Wywołanie serwisu AI (Mock)**: Wywołuje mockowany serwis `ai.service.ts`, który zwraca predefiniowane sugestie lub symuluje błąd.
    f. **Logowanie błędów AI**: Jeśli serwis AI zwróci błąd, jest on logowany do tabeli `ai_error_logs`.
    g. **Zapis sugestii**: Jeśli analiza się powiedzie, nowe sugestie są zapisywane w tabeli `ai_suggestions` w bazie danych z statusem `pending`.
    h. **Zwrócenie odpowiedzi**: Serwis zwraca dane w formacie `AnalyzeNoteResponseDTO`.
5.  **Router (Astro)**: Serializuje odpowiedź z serwisu i wysyła ją do klienta z odpowiednim kodem statusu.

### 6. Względy bezpieczeństwa

- **Uwierzytelnianie**: Żądanie musi być uwierzytelnione. Middleware Astro weryfikuje sesję użytkownika.
- **Autoryzacja**: Serwis musi sprawdzić, czy `note.user_id` jest zgodne z ID uwierzytelnionego użytkownika.
- **Zgoda użytkownika**: Proces jest blokowany, jeśli użytkownik nie wyraził zgody na przetwarzanie danych przez AI (`has_agreed_to_ai_data_processing` = `false`).

### 7. Obsługa błędów

- **400 Bad Request**:
  - Użytkownik nie wyraził zgody na przetwarzanie danych AI.
  - Kod błędu: `AI_CONSENT_REQUIRED`
- **401 Unauthorized**:
  - Brak lub nieprawidłowa sesja użytkownika (obsługiwane przez middleware).
- **403 Forbidden**:
  - Notatka nie należy do uwierzytelnionego użytkownika.
  - Kod błędu: `FORBIDDEN_ACCESS`
- **404 Not Found**:
  - Notatka o podanym ID nie istnieje.
  - Kod błędu: `NOTE_NOT_FOUND`
- **422 Unprocessable Entity**:
  - Treść notatki jest pusta lub zbyt krótka do analizy.
  - Kod błędu: `NOTE_CONTENT_TOO_SHORT`
- **500 Internal Server Error**:
  - Błąd symulowany przez mock serwisu AI.
  - Błąd zapisu do bazy danych.
  - Kod błędu: `AI_SERVICE_ERROR` lub `INTERNAL_SERVER_ERROR`

### 8. Rozważania dotyczące wydajności

- Obecnie, z mockowanym serwisem, wydajność nie jest problemem.
- W przyszłości, wywołanie rzeczywistego modelu AI będzie operacją długotrwałą. Należy rozważyć implementację mechanizmu opartego na zadaniach w tle (np. Supabase Edge Functions) i WebSockets do powiadamiania klienta o zakończeniu analizy, aby uniknąć długich czasów oczekiwania na odpowiedź HTTP.

### 9. Etapy wdrożenia

1.  **Stworzenie plików**:
    - Utwórz plik `src/pages/api/notes/[id]/analyze.ts` dla nowego punktu końcowego.
    - Utwórz plik serwisu `src/lib/services/suggestions.service.ts`.
    - Utwórz plik mockującego serwisu AI `src/lib/services/ai.service.ts`.
2.  **Implementacja serwisu AI (Mock)**:
    - W `ai.service.ts`, stwórz funkcję `generateSuggestions(noteContent: string)`, która zwraca `Promise` z tablicą mockowych sugestii lub symuluje błąd.
3.  **Implementacja serwisu sugestii (`suggestions.service.ts`)**:
    - Stwórz metodę `analyzeNote(noteId: string, supabase: SupabaseClient, locals: App.Locals)`.
    - Zaimplementuj logikę opisaną w sekcji "Przepływ danych", włączając w to walidację, pobieranie danych, wywołanie mocka AI i zapis wyników.
    - Dodaj metodę do logowania błędów w tabeli `ai_error_logs`.
4.  **Implementacja punktu końcowego (Astro)**:
    - W `analyze.ts`, dodaj handler `POST`.
    - Zaimplementuj walidację parametru `id` za pomocą Zod.
    - Wywołaj serwis `suggestions.service.ts` i obsłuż jego odpowiedź (zarówno sukces, jak i błędy), zwracając odpowiednie kody statusu i dane JSON.
5.  **Aktualizacja typów**:
    - Upewnij się, że wszystkie potrzebne typy (`AnalyzeNoteResponseDTO`, etc.) są zdefiniowane w `src/types.ts`.
6.  **Testowanie**:
    - Dodaj nowe żądania do pliku `endpoints.http` w celu przetestowania scenariuszy sukcesu i błędów.

---

## Endpoint 2: GET /api/notes/:id/suggestions

### 1. Przegląd punktu końcowego

Ten punkt końcowy umożliwia pobranie listy wszystkich sugestii AI wygenerowanych dla konkretnej notatki. Opcjonalnie pozwala na filtrowanie wyników na podstawie statusu sugestii (`pending`, `accepted`, `rejected`).

### 2. Szczegóły żądania

- **Metoda HTTP**: `GET`
- **Struktura URL**: `/api/notes/:id/suggestions`
- **Parametry URL**:
  - **Wymagane**: `id` (UUID notatki)
- **Parametry Zapytania (Query)**:
  - **Opcjonalne**: `status` (string, jeden z: `pending`, `accepted`, `rejected`)
- **Request Body**: Brak

### 3. Wykorzystywane typy

- `SuggestionsListResponseDTO`
- `SuggestionDTO`
- `ErrorDTO`

### 4. Szczegóły odpowiedzi

- **Odpowiedź sukcesu (200 OK)**:
  ```json
  {
    "data": [
      {
        "id": "uuid",
        "note_id": "uuid",
        "user_id": "uuid",
        "type": "suggestion_type enum",
        "status": "suggestion_status enum",
        "name": "string",
        "content": "string",
        "suggested_entity_id": "uuid",
        "generation_duration_ms": 123,
        "created_at": "ISO 8601 timestamp",
        "updated_at": "ISO 8601 timestamp"
      }
    ]
  }
  ```
- **Odpowiedzi błędów**: Zobacz sekcję "Obsługa błędów".

### 5. Przepływ danych

1.  **Router (Astro)**: `src/pages/api/notes/[id]/suggestions.ts` odbiera żądanie.
2.  **Walidacja wejściowa**: Zod weryfikuje parametr URL `id` (UUID) oraz opcjonalny parametr zapytania `status` (enum).
3.  **Wywołanie serwisu**: Router wywołuje metodę `getSuggestionsForNote(noteId, filters)` z serwisu `suggestions.service.ts`.
4.  **Logika w serwisie (`suggestions.service.ts`)**:
    a. Weryfikuje, czy notatka o podanym `noteId` istnieje i należy do uwierzytelnionego użytkownika. Można to zrobić poprzez sprawdzenie `notes.service.ts` przed wykonaniem głównego zapytania.
    b. Wykonuje zapytanie do tabeli `ai_suggestions` w bazie Supabase, filtrując po `note_id`.
    c. Jeśli parametr `status` został podany, dodaje odpowiedni warunek `where` do zapytania.
    d. Zwraca listę znalezionych sugestii.
5.  **Router (Astro)**: Formatuje odpowiedź jako `SuggestionsListResponseDTO` i wysyła ją do klienta.

### 6. Względy bezpieczeństwa

- **Uwierzytelnianie**: Wymagane, obsługiwane przez middleware.
- **Autoryzacja**: Polityki RLS w Supabase na tabeli `ai_suggestions` zapewniają, że użytkownik może odpytywać tylko o swoje sugestie. Dodatkowo, serwis powinien jawnie sprawdzić, czy użytkownik jest właścicielem notatki, aby uniemożliwić próby odgadnięcia ID sugestii.

### 7. Obsługa błędów

- **400 Bad Request**:
  - Nieprawidłowa wartość parametru `status`.
  - Kod błędu: `INVALID_QUERY_PARAM`
- **401 Unauthorized**:
  - Brak lub nieprawidłowa sesja.
- **403 Forbidden**:
  - Notatka nie należy do użytkownika.
- **404 Not Found**:
  - Notatka o podanym ID nie istnieje.
  - Kod błędu: `NOTE_NOT_FOUND`
- **500 Internal Server Error**:
  - Błąd podczas komunikacji z bazą danych.

### 8. Rozważania dotyczące wydajności

- Zapytanie powinno być wydajne dzięki indeksom na kolumnach `note_id` i `status` w tabeli `ai_suggestions`.
- Paginacja nie jest wymagana w pierwszej wersji, ponieważ liczba sugestii dla pojedynczej notatki będzie stosunkowo niewielka.

### 9. Etapy wdrożenia

1.  **Stworzenie pliku**:
    - Utwórz plik `src/pages/api/notes/[id]/suggestions.ts`.
2.  **Implementacja serwisu (`suggestions.service.ts`)**:
    - Dodaj nową metodę `getSuggestionsForNote(noteId: string, filters: { status?: string }, supabase: SupabaseClient, locals: App.Locals)`.
    - Zaimplementuj logikę pobierania notatki w celu weryfikacji właściciela.
    - Zaimplementuj logikę zapytania do bazy danych z uwzględnieniem opcjonalnego filtrowania.
3.  **Implementacja punktu końcowego (Astro)**:
    - Dodaj handler `GET` w pliku `suggestions.ts`.
    - Zaimplementuj walidację Zod dla parametrów `id` i `status`.
    - Wywołaj metodę serwisową i zwróć odpowiedź lub błąd.
4.  **Testowanie**:
    - Zaktualizuj `endpoints.http`, dodając testy dla pobierania wszystkich sugestii oraz filtrowania po statusie.

---

## Endpoint 3: PATCH /api/suggestions/:id

### 1. Przegląd punktu końcowego

Ten punkt końcowy służy do aktualizacji statusu pojedynczej sugestii AI. Użytkownik może zaakceptować (`accepted`) lub odrzucić (`rejected`) sugestię. Akceptacja sugestii uruchamia dodatkową logikę biznesową, taką jak tworzenie nowych encji, łączenie istniejących encji z notatką, czy dodawanie treści do notatki.

### 2. Szczegóły żądania

- **Metoda HTTP**: `PATCH`
- **Struktura URL**: `/api/suggestions/:id`
- **Parametry URL**:
  - **Wymagane**: `id` (UUID sugestii)
- **Request Body**:
  ```json
  {
    "status": "string" // Wymagane, jeden z: "accepted", "rejected"
  }
  ```

### 3. Wykorzystywane typy

- `UpdateSuggestionCommand`
- `SuggestionDTO`
- `ErrorDTO`

### 4. Szczegóły odpowiedzi

- **Odpowiedź sukcesu (200 OK)**:
  - Zwraca pełny, zaktualizowany obiekt sugestii w formacie `SuggestionDTO`.
- **Odpowiedzi błędów**: Zobacz sekcję "Obsługa błędów".

### 5. Przepływ danych

1.  **Router (Astro)**: `src/pages/api/suggestions/[id].ts` odbiera żądanie.
2.  **Walidacja wejściowa**: Zod weryfikuje parametr `id` (UUID) oraz ciało żądania (`status` musi być `accepted` lub `rejected`).
3.  **Wywołanie serwisu**: Router wywołuje metodę `updateSuggestionStatus(suggestionId, status)` z `suggestions.service.ts`.
4.  **Logika w serwisie (`suggestions.service.ts`)**:
    a. Pobiera sugestię z bazy danych po `suggestionId`, aby zweryfikować jej istnienie, przynależność do użytkownika oraz czy jej obecny status to `pending`.
    b. Jeśli walidacja się nie powiedzie, zwraca odpowiedni błąd.
    c. Aktualizuje status sugestii w tabeli `ai_suggestions`.
    d. **Logika biznesowa po akceptacji**: Jeśli nowy status to `accepted`, uruchamia odpowiednie akcje w zależności od `suggestion.type`: - `new_entity`: Wywołuje `entities.service.ts`, aby stworzyć nową encję, a następnie `notes.service.ts`, aby połączyć ją z notatką. - `existing_entity_link`: Wywołuje `notes.service.ts`, aby połączyć istniejącą encję (`suggestion.suggested_entity_id`) z notatką. - `quote` / `summary`: Pobiera notatkę, dodaje treść sugestii (`suggestion.content`) na końcu jej treści w odpowiedniej sekcji markdown (np. `## Cytaty`), a następnie aktualizuje notatkę za pomocą `notes.service.ts`.
    e. Zwraca zaktualizowany obiekt sugestii.
5.  **Router (Astro)**: Zwraca odpowiedź z serwisu do klienta.

### 6. Względy bezpieczeństwa

- **Uwierzytelnianie**: Wymagane.
- **Autoryzacja**: Serwis musi bezwzględnie weryfikować, czy sugestia, którą próbuje zmodyfikować użytkownik, należy do niego. Jest to kluczowe, aby zapobiec modyfikacji danych innych użytkowników.
- **Walidacja stanu**: Zmiana statusu jest dozwolona tylko ze stanu `pending`. Próba modyfikacji już zaakceptowanej lub odrzuconej sugestii musi zostać zablokowana.

### 7. Obsługa błędów

- **400 Bad Request**:
  - Nieprawidłowa wartość w ciele żądania (np. `status` inny niż `accepted` lub `rejected`).
  - Próba zmiany statusu sugestii, która nie jest w stanie `pending`.
  - Kod błędu: `INVALID_PAYLOAD` lub `INVALID_STATE_TRANSITION`
- **401 Unauthorized**:
  - Brak sesji.
- **403 Forbidden**:
  - Sugestia nie należy do użytkownika.
- **404 Not Found**:
  - Sugestia o podanym ID nie istnieje.
  - Kod błędu: `SUGGESTION_NOT_FOUND`
- **500 Internal Server Error**:
  - Błąd podczas wykonywania logiki biznesowej (np. błąd przy tworzeniu encji).

### 8. Rozważania dotyczące wydajności

- Operacje są atomowe i dotyczą pojedynczych rekordów, więc nie przewiduje się problemów z wydajnością.
- Należy zadbać o transakcyjność operacji w logice biznesowej, aby w przypadku błędu na jednym z kroków (np. błąd przy łączeniu encji po jej utworzeniu) można było wycofać wszystkie zmiany. Supabase oferuje funkcje `rpc` do obsługi transakcji.

### 9. Etapy wdrożenia

1.  **Stworzenie pliku**:
    - Utwórz plik `src/pages/api/suggestions/[id].ts`.
2.  **Implementacja serwisu (`suggestions.service.ts`)**:
    - Dodaj nową metodę `updateSuggestionStatus(suggestionId: string, status: 'accepted' | 'rejected', supabase: SupabaseClient, locals: App.Locals)`.
    - Zaimplementuj logikę walidacji (istnienie, właściciel, status `pending`).
    - Zaimplementuj logikę aktualizacji statusu.
    - Zaimplementuj logikę biznesową dla każdego typu sugestii, wykorzystując istniejące serwisy `notes.service.ts` i `entities.service.ts`.
3.  **Implementacja punktu końcowego (Astro)**:
    - Dodaj handler `PATCH` w pliku `[id].ts`.
    - Zaimplementuj walidację Zod dla parametru `id` i ciała żądania.
    - Wywołaj metodę serwisową i obsłuż jej wyniki.
4.  **Testowanie**:
    - Dodaj do `endpoints.http` testy dla akceptowania i odrzucania każdego typu sugestii, a także testy dla przypadków błędów (np. próba zmiany statusu non-pending).
