# API Endpoint Implementation Plan: Relationships Management

## 1. Przegląd punktu końcowego
Ten dokument opisuje plan wdrożenia punktów końcowych API REST do zarządzania relacjami między encjami (`/api/relationships`). Obejmuje on operacje tworzenia, odczytu, aktualizacji i usuwania (CRUD) relacji, które stanowią rdzeń grafu wiedzy w aplikacji. Wszystkie operacje wymagają uwierzytelnienia użytkownika i zapewniają, że użytkownicy mogą zarządzać wyłącznie własnymi danymi.

## 2. Struktura plików
- **Endpointy**:
  - `src/pages/api/relationships/index.ts` (dla `GET` i `POST`)
  - `src/pages/api/relationships/[id].ts` (dla `PATCH` i `DELETE`)
- **Logika biznesowa**:
  - `src/lib/services/relationships.service.ts` (nowy plik)
- **Walidacja**:
  - `src/lib/validation/relationships.validation.ts` (nowy plik)

## 3. Szczegóły implementacji

### `GET /api/relationships`

#### Szczegóły żądania
- **Metoda HTTP**: `GET`
- **Struktura URL**: `/api/relationships`
- **Parametry zapytania (Query Params)**:
  - `source_entity_id` (uuid, opcjonalny): Filtruj wg encji źródłowej.
  - `target_entity_id` (uuid, opcjonalny): Filtruj wg encji docelowej.
  - `type` (string, opcjonalny): Filtruj wg typu relacji (wartość z enuma `relationship_type`).
  - `limit` (integer, opcjonalny, domyślnie: 100, max: 500): Liczba wyników do zwrócenia.

#### Szczegóły odpowiedzi
- **200 OK**: Zwraca obiekt `RelationshipsListResponseDTO` zawierający listę relacji.
  ```json
  {
    "data": [
      {
        "id": "uuid",
        "user_id": "uuid",
        "source_entity_id": "uuid",
        "target_entity_id": "uuid",
        "type": "is_related_to",
        "created_at": "timestamp",
        "source_entity": { "id": "uuid", "name": "string", "type": "person", "description": "string" },
        "target_entity": { "id": "uuid", "name": "string", "type": "idea", "description": "string" }
      }
    ]
  }
  ```
- **400 Bad Request**: Nieprawidłowe parametry zapytania.
- **401 Unauthorized**: Użytkownik nie jest zalogowany.

#### Przepływ danych
1.  Endpoint w `index.ts` odbiera żądanie.
2.  Waliduje opcjonalne parametry zapytania przy użyciu schemy Zod.
3.  Wywołuje metodę `relationshipsService.getRelationships(userId, filters)`.
4.  Serwis konstruuje zapytanie do Supabase, pobierając relacje i łącząc je z tabelą `entities` dwukrotnie (dla `source_entity` i `target_entity`).
5.  Serwis mapuje wyniki do typu `RelationshipWithEntitiesDTO`.
6.  Endpoint zwraca dane w formacie `RelationshipsListResponseDTO`.

### `POST /api/relationships`

#### Szczegóły żądania
- **Metoda HTTP**: `POST`
- **Struktura URL**: `/api/relationships`
- **Ciało żądania (Request Body)**: Obiekt `CreateRelationshipCommand`.
  ```json
  {
    "source_entity_id": "uuid",
    "target_entity_id": "uuid",
    "type": "is_student_of"
  }
  ```

#### Szczegóły odpowiedzi
- **201 Created**: Zwraca nowo utworzony obiekt `RelationshipDTO`.
- **400 Bad Request**: Błędy walidacji, próba utworzenia relacji zwrotnej lub relacja już istnieje.
- **401 Unauthorized**: Użytkownik nie jest zalogowany.
- **404 Not Found**: Encja źródłowa lub docelowa nie istnieje lub nie należy do użytkownika.

#### Przepływ danych
1.  Endpoint w `index.ts` odbiera żądanie.
2.  Waliduje ciało żądania przy użyciu schemy Zod dla `CreateRelationshipCommand`.
3.  Wywołuje metodę `relationshipsService.createRelationship(userId, validatedData)`.
4.  Serwis wykonuje następujące kroki:
    a. Sprawdza, czy `source_entity_id` jest różne od `target_entity_id`.
    b. Weryfikuje, czy obie encje (źródłowa i docelowa) istnieją i należą do `userId` za pomocą jednego zapytania do bazy.
    c. Wstawia nowy rekord do tabeli `relationships`. Baza danych obsłuży błąd duplikatu dzięki unikalnemu indeksowi.
5.  Endpoint zwraca nowo utworzoną relację z kodem 201.

### `PATCH /api/relationships/:id`

#### Szczegóły żądania
- **Metoda HTTP**: `PATCH`
- **Struktura URL**: `/api/relationships/:id`
- **Parametry URL**:
  - `id` (uuid, wymagany): ID relacji do zaktualizowania.
- **Ciało żądania (Request Body)**: Obiekt `UpdateRelationshipCommand`.
  ```json
  {
    "type": "criticizes"
  }
  ```

#### Szczegóły odpowiedzi
- **200 OK**: Zwraca zaktualizowany obiekt `RelationshipDTO`.
- **400 Bad Request**: Nieprawidłowy `id` lub `type`.
- **401 Unauthorized**: Użytkownik nie jest zalogowany.
- **403 Forbidden**: Próba modyfikacji relacji nienależącej do użytkownika.
- **404 Not Found**: Relacja o podanym `id` nie istnieje.

#### Przepływ danych
1.  Endpoint w `[id].ts` odbiera żądanie.
2.  Waliduje `id` z URL oraz `type` z ciała żądania.
3.  Wywołuje metodę `relationshipsService.updateRelationship(userId, id, validatedData)`.
4.  Serwis aktualizuje rekord w tabeli `relationships`, używając `id` i `user_id` w klauzuli `WHERE` w celu zapewnienia autoryzacji.
5.  Endpoint zwraca zaktualizowaną relację.

### `DELETE /api/relationships/:id`

#### Szczegóły żądania
- **Metoda HTTP**: `DELETE`
- **Struktura URL**: `/api/relationships/:id`
- **Parametry URL**:
  - `id` (uuid, wymagany): ID relacji do usunięcia.

#### Szczegóły odpowiedzi
- **204 No Content**: Pusta odpowiedź w przypadku pomyślnego usunięcia.
- **401 Unauthorized**: Użytkownik nie jest zalogowany.
- **403 Forbidden**: Próba usunięcia relacji nienależącej do użytkownika.
- **404 Not Found**: Relacja o podanym `id` nie istnieje.

#### Przepływ danych
1.  Endpoint w `[id].ts` odbiera żądanie.
2.  Waliduje `id` z URL.
3.  Wywołuje metodę `relationshipsService.deleteRelationship(userId, id)`.
4.  Serwis usuwa rekord z tabeli `relationships`, używając `id` i `user_id` w klauzuli `WHERE`.
5.  Serwis sprawdza liczbę usuniętych wierszy. Jeśli 0, oznacza to, że zasób nie został znaleziony lub użytkownik nie ma do niego uprawnień (zwraca błąd 404/403).
6.  Endpoint zwraca status 204.

## 4. Względy bezpieczeństwa
- **Uwierzytelnianie**: Wszystkie endpointy muszą być chronione i dostępne tylko dla zalogowanych użytkowników.
- **Autoryzacja**: Logika serwisu musi rygorystycznie sprawdzać, czy zasoby (relacje, encje), którymi manipuluje użytkownik, należą do niego (`user_id` musi być częścią każdego zapytania `SELECT`, `UPDATE`, `DELETE`, `INSERT`).
- **Walidacja danych**: Każde wejście od użytkownika (ciało żądania, parametry URL, parametry zapytania) musi być walidowane za pomocą Zod, aby zapobiec błędom i atakom (np. SQL Injection, chociaż Supabase SDK minimalizuje to ryzyko).

## 5. Obsługa błędów
- Błędy będą przechwytywane w endpointach (bloki `try...catch`).
- Odpowiedzi błędów będą formatowane zgodnie z typem `ErrorDTO`.
- Błędy z Supabase (np. naruszenie klucza unikalnego) będą mapowane na odpowiednie błędy HTTP (np. `400 Bad Request`).

## 6. Rozważania dotyczące wydajności
- Zapytanie `GET` do pobierania relacji powinno być zoptymalizowane. Użycie `JOIN` z tabelą `entities` jest konieczne. Należy zadbać o odpowiednie indeksy na kluczach obcych (`source_entity_id`, `target_entity_id`, `user_id`), które są już zdefiniowane w planie bazy danych.
- Domyślny, rozsądny `limit` (np. 100) dla `GET` zapobiegnie zwracaniu zbyt dużych ilości danych na raz.

## 7. Etapy wdrożenia
1.  **Stworzenie plików**: Utwórz pliki `src/lib/services/relationships.service.ts`, `src/lib/validation/relationships.validation.ts`, `src/pages/api/relationships/index.ts` oraz `src/pages/api/relationships/[id].ts`.
2.  **Definicja schem walidacji**: W `relationships.validation.ts` zdefiniuj schemy Zod dla parametrów `GET` oraz ciał żądań `POST` i `PATCH`.
3.  **Implementacja serwisu**:
    -   Zaimplementuj szkielet `RelationshipsService` z wszystkimi czterema metodami (`getRelationships`, `createRelationship`, `updateRelationship`, `deleteRelationship`).
    -   Stopniowo implementuj logikę każdej metody, zaczynając od interakcji z Supabase.
4.  **Implementacja endpointu `POST`**:
    -   Dodaj obsługę `POST` w `index.ts`.
    -   Zintegruj walidację i wywołaj `relationshipsService.createRelationship`.
    -   Dodaj obsługę błędów i formatowanie odpowiedzi.
5.  **Implementacja endpointu `GET`**:
    -   Dodaj obsługę `GET` w `index.ts`.
    -   Zintegruj walidację i wywołaj `relationshipsService.getRelationships`.
6.  **Implementacja endpointów `PATCH` i `DELETE`**:
    -   W pliku `[id].ts` zaimplementuj obsługę metod `PATCH` i `DELETE`.
    -   Zintegruj walidację i wywołaj odpowiednie metody serwisu.
7.  **Testowanie**: Zaktualizuj plik `endpoints.http`, dodając wywołania dla wszystkich nowych endpointów, uwzględniając przypadki sukcesu i błędów (np. próba usunięcia cudzej relacji, tworzenie duplikatów).
