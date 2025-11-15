# API Endpoint Implementation Plan: POST /api/notes

## 1. Przegląd punktu końcowego

Ten punkt końcowy umożliwia uwierzytelnionym użytkownikom tworzenie nowych notatek. Użytkownik musi podać tytuł, a opcjonalnie może dodać treść oraz powiązać notatkę z istniejącymi bytami (entities) poprzez przekazanie ich identyfikatorów. Po pomyślnym utworzeniu, API zwraca pełny obiekt nowej notatki wraz z danymi powiązanych bytów.

## 2. Szczegóły żądania

- **Metoda HTTP**: `POST`
- **Struktura URL**: `/api/notes`
- **Request Body**:
  ```json
  {
    "title": "string",
    "content": "string",
    "entities": [
      {
        "entity_id": "uuid",
        "relationship_type": "relationship_type enum"
      }
    ]
  }
  ```
- **Parametry**:
  - **Wymagane**:
    - `title`: `string` - Tytuł notatki (maksymalnie 255 znaków).
  - **Opcjonalne**:
    - `content`: `string` - Treść notatki (maksymalnie 10 000 znaków).
    - `entities`: `array` - Tablica obiektów z `entity_id` (UUID) i opcjonalnym `relationship_type` (domyślnie 'is_related_to').

**Uwaga**: Dla wstecznej kompatybilności `entity_ids` (tablica UUID) jest nadal wspierana, ale przestarzała. Wszystkie relacje będą domyślnie ustawione na 'is_related_to'.

## 3. Wykorzystywane typy

- **Command Model (Request)**: `CreateNoteCommand` z `src/types.ts`
- **DTO (Response)**: `NoteDTO` z `src/types.ts`

## 4. Szczegóły odpowiedzi

- **Odpowiedź sukcesu (201 Created)**: Zwraca obiekt `NoteDTO` reprezentujący nowo utworzoną notatkę.
  ```json
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
  ```
- **Odpowiedzi błędów**:
  - `400 Bad Request`: Błąd walidacji danych wejściowych.
  - `401 Unauthorized`: Użytkownik nie jest uwierzytelniony.
  - `409 Conflict`: Notatka o podanym tytule już istnieje.
  - `500 Internal Server Error`: Wewnętrzny błąd serwera.

## 5. Przepływ danych

1.  Żądanie `POST` trafia do `src/pages/api/notes/index.ts`.
2.  Middleware Astro weryfikuje, czy użytkownik jest uwierzytelniony i udostępnia jego ID w `context.locals.user.id`.
3.  Handler `POST` w pliku `index.ts` odczytuje ciało żądania.
4.  Ciało żądania jest walidowane przy użyciu schemy Zod zdefiniowanej w `src/lib/validation.ts`. Jeśli walidacja się nie powiedzie, zwracany jest błąd `400`.
5.  Po pomyślnej walidacji, handler wywołuje funkcję `createNote` z serwisu `notes.service.ts`, przekazując ID użytkownika i zwalidowane dane.
6.  Funkcja `createNote` w serwisie wykonuje następujące operacje:
    a. Sprawdza, czy notatka o podanym tytule już istnieje dla tego użytkownika. Jeśli tak, zwraca błąd.
    b. Jeśli `entities` (lub `entity_ids`) zostały dostarczone, weryfikuje, czy wszystkie byty o podanych ID istnieją i należą do uwierzytelnionego użytkownika. Jeśli nie, zwraca błąd.
    c. Waliduje typy relacji `relationship_type` (jeśli podane).
    d. Tworzy nowy wpis w tabeli `notes` z `title`, `content` i `user_id`.
    e. Jeśli `entities` (lub `entity_ids`) zostały dostarczone, tworzy odpowiednie wpisy w tabeli łączącej `note_entities` z odpowiednimi typami relacji (domyślnie 'is_related_to').
    f. Pobiera z bazy danych nowo utworzoną notatkę wraz z pełnymi danymi powiązanych bytów i ich typami relacji (join z `entities` i `note_entities`).
    g. Zwraca obiekt `NoteDTO` do handlera API.
7.  Handler API otrzymuje `NoteDTO`, ustawia status odpowiedzi na `201 Created` i zwraca obiekt w ciele odpowiedzi.

## 6. Względy bezpieczeństwa

- **Uwierzytelnianie**: Dostęp do punktu końcowego jest chroniony przez middleware Astro, który weryfikuje sesję użytkownika. Każde żądanie bez ważnej sesji zostanie odrzucone.
- **Autoryzacja**: Wszystkie operacje na bazie danych są wykonywane w kontekście `user_id` pozyskanego z sesji. Gwarantuje to, że użytkownicy mogą tworzyć notatki tylko na własnym koncie. Polityki Row-Level Security (RLS) w Supabase zapewniają dodatkową warstwę ochrony na poziomie bazy danych.
- **Walidacja danych wejściowych**: Stosowanie Zod do walidacji schematu `CreateNoteCommand` na brzegu systemu (w handlerze API) chroni przed typowymi atakami, takimi jak XSS czy SQL Injection. Walidacja obejmuje również typy relacji `relationship_type`.
- **Weryfikacja własności zasobów**: Serwis `notes.service.ts` musi zweryfikować, czy `entity_id` z tablicy `entities` (lub `entity_ids`) przekazane w żądaniu należą do tego samego użytkownika, który tworzy notatkę. Zapobiega to nieautoryzowanemu powiązaniu danych między kontami.

## 7. Rozważania dotyczące wydajności

- Operacje tworzenia notatki i jej powiązań są operacjami zapisu, które powinny być szybkie.
- Walidacja istnienia i własności bytów (`entity_ids`) wymaga dodatkowego zapytania do bazy danych przed utworzeniem notatki. Aby zoptymalizować ten proces, można go połączyć w jedną transakcję bazodanową, aby zapewnić atomowość operacji.
- Należy upewnić się, że kolumny `user_id` w tabelach `notes` i `entities` są odpowiednio zindeksowane, co jest już przewidziane w planie bazy danych.

## 8. Etapy wdrożenia

1.  **Walidacja**: W pliku `src/lib/validation.ts` utwórz nową schemę Zod o nazwie `createNoteSchema` do walidacji ciała żądania `POST /api/notes`, zgodnie ze specyfikacją. Schema powinna obsługiwać zarówno nowy format `entities` (z `entity_id` i opcjonalnym `relationship_type`), jak i przestarzały format `entity_ids` dla wstecznej kompatybilności.
2.  **Logika serwisowa**: W pliku `src/lib/services/notes.service.ts` zaimplementuj nową asynchroniczną funkcję `createNote(supabase: SupabaseClient, userId: string, command: CreateNoteCommand): Promise<NoteDTO>`. Funkcja ta powinna realizować logikę opisaną w sekcji "Przepływ danych", uwzględniając typy relacji.
3.  **Implementacja handlera API**: W pliku `src/pages/api/notes/index.ts` dodaj lub zmodyfikuj handler `POST`. Powinien on:
    a. Pobierać ID użytkownika z `context.locals`.
    b. Walidować ciało żądania za pomocą `createNoteSchema`.
    c. Wywoływać serwis `notesService.createNote`.
    d. Obsługiwać odpowiedzi sukcesu (zwracając `NoteDTO` i status `201`) oraz błędy (zwracając odpowiednie kody statusu i komunikaty).
4.  **Testowanie**: Dodaj nowy wpis w pliku `endpoints.http` do testowania nowo utworzonego punktu końcowego, uwzględniając przypadki sukcesu (z różnymi typami relacji) oraz przypadki błędów (np. brak tytułu, nieistniejące `entity_id`, nieprawidłowy `relationship_type`).
