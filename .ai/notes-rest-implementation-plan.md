# Plan Wdrożenia API: Zarządzanie Notatkami

Ten dokument opisuje szczegółowy plan implementacji punktów końcowych REST API do zarządzania pojedynczą notatką i jej powiązaniami z bytami.

---

## 1. Endpoint: `GET /api/notes/[id]`

### 1.1. Przegląd
Pobiera szczegóły pojedynczej notatki, włączając w to listę powiązanych z nią bytów.

### 1.2. Szczegóły żądania
- **Metoda HTTP**: `GET`
- **Struktura URL**: `/api/notes/[id]`
- **Parametry URL**:
    - Wymagane: `id` (UUID notatki)
- **Ciało żądania**: Brak

### 1.3. Wykorzystywane typy
- `NoteDTO`
- `EntityBasicDTO`
- `ErrorDTO`

### 1.4. Szczegóły odpowiedzi
- **200 OK**: Zwraca obiekt notatki w formacie `NoteDTO`.
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
        "description": "string"
      }
    ]
  }
  ```
- **401, 404, 500**: Zwraca obiekt błędu w formacie `ErrorDTO`.

### 1.5. Przepływ danych
1.  Klient wysyła żądanie `GET` na `/api/notes/[id]`.
2.  Astro wywołuje handler `GET` w pliku `src/pages/api/notes/[id].ts`.
3.  Handler sprawdza, czy użytkownik jest uwierzytelniony (`Astro.locals.user`).
4.  Waliduje parametr `id` przy użyciu `zod`.
5.  Wywołuje metodę `notesService.findNoteById(id, userId)`.
6.  Serwis wykonuje zapytanie do bazy Supabase, aby pobrać notatkę i powiązane byty. RLS zapewnia dostęp tylko do danych użytkownika.
7.  Handler zwraca dane w formacie `NoteDTO` z kodem 200 lub obiekt błędu.

### 1.6. Względy bezpieczeństwa
- Uwierzytelnianie jest obowiązkowe. Handler musi odrzucić żądanie, jeśli `Astro.locals.user` jest `undefined`.
- Autoryzacja jest realizowana przez polityki RLS w Supabase na podstawie `user_id`.

### 1.7. Obsługa błędów
| Kod | Opis |
| --- | --- |
| 400 | Parametr `id` ma nieprawidłowy format (nie jest UUID). |
| 401 | Użytkownik nie jest uwierzytelniony. |
| 404 | Notatka o podanym `id` nie istnieje lub nie należy do użytkownika. |
| 500 | Wewnętrzny błąd serwera. |

### 1.8. Etapy wdrożenia
1.  **Serwis**: Dodać metodę `findNoteById(noteId: string, userId: string): Promise<NoteDTO | null>` do `notes.service.ts`.
2.  **Walidacja**: Stworzyć schemat `zod` do walidacji parametru `id` jako UUID.
3.  **API Route**: Utworzyć plik `src/pages/api/notes/[id].ts`.
4.  **Handler**: Zaimplementować handler `GET`, który realizuje opisany przepływ danych.

---

## 2. Endpoint: `PATCH /api/notes/[id]`

### 2.1. Przegląd
Aktualizuje dane istniejącej notatki. Umożliwia zmianę tytułu, treści oraz kompletną wymianę powiązanych bytów.

### 2.2. Szczegóły żądania
- **Metoda HTTP**: `PATCH`
- **Struktura URL**: `/api/notes/[id]`
- **Parametry URL**:
    - Wymagane: `id` (UUID notatki)
- **Ciało żądania**:
    - Opcjonalne: `title` (string, max 255), `content` (string, max 10000), `entity_ids` (array of UUIDs).
  ```json
  {
    "title": "Nowy tytuł notatki",
    "entity_ids": ["uuid-bytu-1", "uuid-bytu-2"]
  }
  ```

### 2.3. Wykorzystywane typy
- `UpdateNoteCommand`
- `NoteDTO`
- `ErrorDTO`

### 2.4. Szczegóły odpowiedzi
- **200 OK**: Zwraca zaktualizowany obiekt notatki w formacie `NoteDTO`.
- **400, 401, 404, 500**: Zwraca obiekt błędu w formacie `ErrorDTO`.

### 2.5. Przepływ danych
1.  Klient wysyła żądanie `PATCH`.
2.  Handler `PATCH` w `src/pages/api/notes/[id].ts` jest wywoływany.
3.  Uwierzytelnianie i walidacja parametru `id` jak w `GET`.
4.  Walidacja ciała żądania przy użyciu `zod` (zgodnie z typem `UpdateNoteCommand`).
5.  Wywołanie metody `notesService.updateNote(id, data, userId)`.
6.  Serwis w ramach transakcji:
    a. Sprawdza, czy wszystkie `entity_ids` (jeśli podano) istnieją i należą do użytkownika.
    b. Aktualizuje pola `title` i `content` w tabeli `notes`.
    c. Jeśli podano `entity_ids`, usuwa wszystkie istniejące powiązania w `note_entities` dla danej notatki i wstawia nowe.
    d. Pobiera zaktualizowaną notatkę z nowymi powiązaniami.
7.  Handler zwraca zaktualizowaną notatkę z kodem 200.

### 2.6. Względy bezpieczeństwa
- Jak w `GET`. Dodatkowo serwis musi zweryfikować, czy wszystkie byty podane w `entity_ids` należą do zalogowanego użytkownika.

### 2.7. Obsługa błędów
| Kod | Opis |
| --- | --- |
| 400 | Nieprawidłowe ciało żądania (błąd walidacji `zod`) lub któryś z bytów w `entity_ids` nie istnieje. |
| 401 | Użytkownik nie jest uwierzytelniony. |
| 403 | Użytkownik próbuje przypisać byt, który do niego nie należy. |
| 404 | Notatka o podanym `id` nie istnieje lub nie należy do użytkownika. |
| 500 | Wewnętrzny błąd serwera. |

### 2.8. Rozważania dotyczące wydajności
- Operacja na `note_entities` (DELETE + INSERT) powinna być wykonana w ramach jednej transakcji bazy danych, aby zapewnić spójność danych.

### 2.9. Etapy wdrożenia
1.  **Serwis**: Dodać metodę `updateNote(noteId: string, data: UpdateNoteCommand, userId: string): Promise<NoteDTO>` do `notes.service.ts`.
2.  **Walidacja**: Stworzyć schemat `zod` dla `UpdateNoteCommand`.
3.  **Handler**: Zaimplementować handler `PATCH` w `src/pages/api/notes/[id].ts`.

---

## 3. Endpoint: `DELETE /api/notes/[id]`

### 3.1. Przegląd
Trwale usuwa notatkę.

### 3.2. Szczegóły żądania
- **Metoda HTTP**: `DELETE`
- **Struktura URL**: `/api/notes/[id]`
- **Parametry URL**:
    - Wymagane: `id` (UUID notatki)
- **Ciało żądania**: Brak

### 3.3. Szczegóły odpowiedzi
- **204 No Content**: Pomyślnie usunięto notatkę. Brak ciała odpowiedzi.
- **401, 404, 500**: Zwraca obiekt błędu `ErrorDTO`.

### 3.4. Przepływ danych
1.  Klient wysyła żądanie `DELETE`.
2.  Handler `DELETE` w `src/pages/api/notes/[id].ts` jest wywoływany.
3.  Uwierzytelnianie i walidacja parametru `id`.
4.  Wywołanie metody `notesService.deleteNote(id, userId)`.
5.  Serwis wykonuje `DELETE` na tabeli `notes`. Powiązane `note_entities` zostaną usunięte kaskadowo.
6.  Handler zwraca odpowiedź z kodem 204.

### 3.5. Etapy wdrożenia
1.  **Serwis**: Dodać metodę `deleteNote(noteId: string, userId: string): Promise<void>` do `notes.service.ts`.
2.  **Handler**: Zaimplementować handler `DELETE` w `src/pages/api/notes/[id].ts`.

---

## 4. Endpoint: `POST /api/notes/[id]/entities`

### 4.1. Przegląd
Dodaje pojedyncze powiązanie między notatką a bytem.

### 4.2. Szczegóły żądania
- **Metoda HTTP**: `POST`
- **Struktura URL**: `/api/notes/[id]/entities`
- **Parametry URL**:
    - Wymagane: `id` (UUID notatki)
- **Ciało żądania**:
    - Wymagane: `entity_id` (UUID bytu)
  ```json
  {
    "entity_id": "uuid-bytu-do-dodania"
  }
  ```

### 4.3. Wykorzystywane typy
- `AddEntityToNoteCommand`
- `NoteEntityAssociationDTO`
- `ErrorDTO`

### 4.4. Szczegóły odpowiedzi
- **201 Created**: Zwraca obiekt reprezentujący utworzone powiązanie.
  ```json
  {
    "note_id": "uuid",
    "entity_id": "uuid"
  }
  ```
- **400, 401, 404, 409, 500**: Zwraca obiekt błędu `ErrorDTO`.

### 4.5. Przepływ danych
1.  Klient wysyła żądanie `POST`.
2.  Astro wywołuje handler `POST` w `src/pages/api/notes/[id]/entities.ts`.
3.  Uwierzytelnianie, walidacja parametru `id` i ciała żądania (`AddEntityToNoteCommand`).
4.  Wywołanie `notesService.addEntityToNote(noteId, entityId, userId)`.
5.  Serwis sprawdza, czy notatka i byt istnieją i należą do użytkownika, a następnie wstawia nowy wiersz do tabeli `note_entities`.
6.  Handler zwraca dane powiązania z kodem 201.

### 4.6. Obsługa błędów
| Kod | Opis |
| --- | --- |
| 400 | Błąd walidacji `zod` dla `id` lub `entity_id`. |
| 401 | Użytkownik nie jest uwierzytelniony. |
| 403 | Notatka lub byt należy do innego użytkownika. |
| 404 | Notatka lub byt nie istnieje. |
| 409 | Powiązanie między tą notatką a bytem już istnieje. |
| 500 | Wewnętrzny błąd serwera. |

### 4.7. Etapy wdrożenia
1.  **Serwis**: Dodać metodę `addEntityToNote(noteId: string, entityId: string, userId: string): Promise<NoteEntityAssociationDTO>` do `notes.service.ts`.
2.  **Walidacja**: Stworzyć schemat `zod` dla `AddEntityToNoteCommand`.
3.  **API Route**: Utworzyć plik `src/pages/api/notes/[id]/entities.ts`.
4.  **Handler**: Zaimplementować handler `POST`.

---

## 5. Endpoint: `DELETE /api/notes/[id]/entities/[entityId]`

### 5.1. Przegląd
Usuwa pojedyncze powiązanie między notatką a bytem.

### 5.2. Szczegóły żądania
- **Metoda HTTP**: `DELETE`
- **Struktura URL**: `/api/notes/[id]/entities/[entityId]`
- **Parametry URL**:
    - Wymagane: `id` (UUID notatki), `entityId` (UUID bytu)
- **Ciało żądania**: Brak

### 5.3. Szczegóły odpowiedzi
- **204 No Content**: Pomyślnie usunięto powiązanie. Brak ciała odpowiedzi.
- **401, 404, 500**: Zwraca obiekt błędu `ErrorDTO`.

### 5.4. Przepływ danych
1.  Klient wysyła żądanie `DELETE`.
2.  Astro wywołuje handler `DELETE` w `src/pages/api/notes/[id]/entities/[entityId].ts`.
3.  Uwierzytelnianie i walidacja parametrów `id` i `entityId`.
4.  Wywołanie `notesService.removeEntityFromNote(noteId, entityId, userId)`.
5.  Serwis usuwa odpowiedni wiersz z tabeli `note_entities`.
6.  Handler zwraca odpowiedź z kodem 204.

### 5.5. Obsługa błędów
| Kod | Opis |
| --- | --- |
| 400 | Nieprawidłowy format `id` lub `entityId`. |
| 401 | Użytkownik nie jest uwierzytelniony. |
| 404 | Notatka, byt lub samo powiązanie nie istnieje, lub nie należy do użytkownika. |
| 500 | Wewnętrzny błąd serwera. |

### 5.6. Etapy wdrożenia
1.  **Serwis**: Dodać metodę `removeEntityFromNote(noteId: string, entityId: string, userId: string): Promise<void>` do `notes.service.ts`.
2.  **Walidacja**: Stworzyć schemat `zod` do walidacji obu parametrów URL.
3.  **API Route**: Utworzyć plik `src/pages/api/notes/[id]/entities/[entityId].ts`.
4.  **Handler**: Zaimplementować handler `DELETE`.
