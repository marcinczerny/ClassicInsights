# API Endpoint Implementation Plan: Profile Management

## 1. Przegląd punktu końcowego

Profile Management API składa się z trzech endpointów umożliwiających użytkownikom:
- Pobranie informacji o swoim profilu
- Aktualizację zgody na przetwarzanie danych przez AI
- Usunięcie konta wraz z wszystkimi powiązanymi danymi (notatki, byty, relacje)

Wszystkie endpointy wymagają uwierzytelnienia i działają wyłącznie na profilu zalogowanego użytkownika. Bezpieczeństwo zapewniane jest przez Row-Level Security (RLS) w Supabase oraz middleware uwierzytelniające w Astro.

## 2. Szczegóły żądania

### GET /api/profile
- **Metoda HTTP**: GET
- **Struktura URL**: `/api/profile`
- **Parametry**:
  - Wymagane: brak
  - Opcjonalne: brak
- **Request Body**: brak
- **Uwierzytelnienie**: Wymagane (sprawdzane przez middleware)

### PATCH /api/profile
- **Metoda HTTP**: PATCH
- **Struktura URL**: `/api/profile`
- **Parametry**:
  - Wymagane: brak (ale przynajmniej jedno pole musi być w body)
  - Opcjonalne: brak
- **Request Body**:
  ```json
  {
    "has_agreed_to_ai_data_processing": boolean  // opcjonalne
  }
  ```
- **Uwierzytelnienie**: Wymagane (sprawdzane przez middleware)

### DELETE /api/profile
- **Metoda HTTP**: DELETE
- **Struktura URL**: `/api/profile`
- **Parametry**:
  - Wymagane: brak
  - Opcjonalne: brak
- **Request Body**: brak
- **Uwierzytelnienie**: Wymagane (sprawdzane przez middleware)

## 3. Wykorzystywane typy

Wszystkie typy są już zdefiniowane w `src/types.ts`:

### ProfileDTO
```typescript
export type ProfileDTO = Tables<"profiles">;
```
Mapuje bezpośrednio do tabeli `profiles` i zawiera:
- `id`: UUID (klucz główny)
- `user_id`: UUID (referencja do auth.users)
- `has_agreed_to_ai_data_processing`: boolean
- `created_at`: timestamp
- `updated_at`: timestamp

### UpdateProfileCommand
```typescript
export type UpdateProfileCommand = {
  has_agreed_to_ai_data_processing?: boolean;
};
```
Używany do walidacji żądania PATCH.

### ErrorDTO
```typescript
export type ErrorDTO = {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
};
```
Standardowy format odpowiedzi błędu.

## 4. Szczegóły odpowiedzi

### GET /api/profile

**Success (200 OK)**:
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "has_agreed_to_ai_data_processing": boolean,
  "created_at": "ISO 8601 timestamp",
  "updated_at": "ISO 8601 timestamp"
}
```

**Errors**:
- `401 Unauthorized`: Użytkownik nie jest uwierzytelniony
- `404 Not Found`: Profil nie istnieje (nie powinno się zdarzyć w normalnych warunkach)
- `500 Internal Server Error`: Błąd bazy danych

### PATCH /api/profile

**Success (200 OK)**:
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "has_agreed_to_ai_data_processing": boolean,
  "created_at": "ISO 8601 timestamp",
  "updated_at": "ISO 8601 timestamp"
}
```

**Errors**:
- `400 Bad Request`: Nieprawidłowe dane wejściowe (walidacja Zod nie powiodła się)
- `401 Unauthorized`: Użytkownik nie jest uwierzytelniony
- `404 Not Found`: Profil nie istnieje
- `500 Internal Server Error`: Błąd bazy danych

### DELETE /api/profile

**Success (204 No Content)**: Brak treści odpowiedzi

**Errors**:
- `401 Unauthorized`: Użytkownik nie jest uwierzytelniony
- `500 Internal Server Error`: Błąd podczas usuwania konta

## 5. Przepływ danych

### GET /api/profile
1. Middleware sprawdza uwierzytelnienie i dodaje `supabase` do `context.locals`
2. Endpoint pobiera `user_id` z sesji użytkownika
3. Service wywołuje Supabase: `SELECT * FROM profiles WHERE user_id = ?`
4. RLS w Supabase weryfikuje, że `auth.uid() = user_id`
5. Zwrócenie profilu lub błędu 404 jeśli nie istnieje

### PATCH /api/profile
1. Middleware sprawdza uwierzytelnienie
2. Endpoint waliduje body za pomocą Zod schema
3. Jeśli walidacja się nie powiodła → 400 Bad Request
4. Service wywołuje Supabase: `UPDATE profiles SET ... WHERE user_id = ? RETURNING *`
5. RLS weryfikuje uprawnienia
6. Zwrócenie zaktualizowanego profilu

### DELETE /api/profile
1. Middleware sprawdza uwierzytelnienie
2. Service wywołuje Supabase Auth: `supabase.auth.admin.deleteUser(userId)`
3. CASCADE w bazie danych automatycznie usuwa:
   - Rekord z `profiles`
   - Wszystkie `notes`
   - Wszystkie `entities`
   - Wszystkie `relationships`
   - Wszystkie `note_entities`
   - Dane w `ai_suggestions` i `ai_error_logs` są anonimizowane (ON DELETE SET NULL)
4. Zwrócenie 204 No Content

## 6. Względy bezpieczeństwa

### Uwierzytelnienie
- Wszystkie endpointy wymagają uwierzytelnienia przez Supabase
- Middleware Astro weryfikuje sesję użytkownika przed dostępem do endpointów
- `context.locals.supabase` zawiera klienta Supabase z kontekstem użytkownika

### Autoryzacja
- Row-Level Security (RLS) w Supabase zapewnia, że:
  ```sql
  CREATE POLICY "Users can view and manage their own profile"
  ON profiles FOR ALL
  USING (auth.uid() = user_id);
  ```
- Użytkownik może operować tylko na swoim profilu
- Nie ma ryzyka dostępu do danych innych użytkowników

### Walidacja danych
- Zod schema dla PATCH weryfikuje:
  - `has_agreed_to_ai_data_processing` jest boolean (jeśli podane)
  - Przynajmniej jedno pole jest wysłane w request body
- Walidacja typu na poziomie TypeScript i runtime (Zod)

### Usuwanie konta
- DELETE /api/profile jest operacją nieodwracalną
- Supabase Auth API zarządza usuwaniem użytkownika
- CASCADE w bazie danych gwarantuje spójność danych
- Anonimizacja danych AI (SET NULL) zgodna z GDPR

## 7. Obsługa błędów

### Scenariusze błędów i kody statusu

| Kod | Scenariusz | Endpoint | Akcja |
|-----|-----------|----------|-------|
| 400 | Nieprawidłowe dane wejściowe (Zod validation) | PATCH | Zwróć szczegóły błędu walidacji |
| 400 | Brak pól w request body | PATCH | "At least one field must be provided" |
| 401 | Brak sesji użytkownika | ALL | "Unauthorized" |
| 404 | Profil nie istnieje | GET, PATCH | "Profile not found" |
| 500 | Błąd bazy danych | ALL | Log błąd, zwróć ogólny komunikat |
| 500 | Błąd usuwania konta | DELETE | Log błąd, zwróć "Failed to delete account" |

### Format odpowiedzi błędu
```typescript
{
  error: {
    code: "VALIDATION_ERROR" | "NOT_FOUND" | "UNAUTHORIZED" | "INTERNAL_ERROR",
    message: "Human-readable error message",
    details?: zodError.errors // tylko dla błędów walidacji
  }
}
```

### Kody błędów
- `VALIDATION_ERROR` - błąd walidacji Zod (400)
- `NOT_FOUND` - profil nie istnieje (404)
- `UNAUTHORIZED` - brak uwierzytelnienia (401)
- `INTERNAL_ERROR` - błąd serwera (500)

## 8. Rozważania dotyczące wydajności

### Optymalizacje
- **Indeksy**: Tabela `profiles` ma już indeks na `user_id` (zgodnie z db-plan.md)
- **RLS**: Polityki RLS są proste (sprawdzenie `auth.uid() = user_id`) - minimalny overhead
- **Pojedyncze zapytania**: Każdy endpoint wykonuje tylko jedno zapytanie do bazy
- **Brak N+1**: Nie ma powiązanych tabel do pobrania (profile jest płaską strukturą)

### Potencjalne wąskie gardła
- **DELETE**: Usuwanie konta może być wolne jeśli użytkownik ma dużo danych (CASCADE):
  - Rozwiązanie: Operacja jest rzadka, można dodać timeout
  - Alternatywa: Background job dla dużych kont (future enhancement)

### Caching
- Profile nie wymaga agresywnego cachingu (rzadko czytane)
- Można dodać cache w przyszłości jeśli będzie używany często w UI

## 9. Etapy wdrożenia

### Krok 1: Utworzenie schematu walidacji Zod
**Plik**: `src/lib/validation/profile.schemas.ts`
```typescript
import { z } from "zod";

export const updateProfileSchema = z
  .object({
    has_agreed_to_ai_data_processing: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  });
```

### Krok 2: Utworzenie service layer
**Plik**: `src/lib/services/profile.service.ts`

Funkcje do zaimplementowania:
- `getProfile(supabase: SupabaseClient, userId: string): Promise<ProfileDTO | null>`
  - Query: `from('profiles').select('*').eq('user_id', userId).single()`
  - Zwraca profil lub null

- `updateProfile(supabase: SupabaseClient, userId: string, data: UpdateProfileCommand): Promise<ProfileDTO>`
  - Query: `from('profiles').update(data).eq('user_id', userId).select().single()`
  - Rzuca błąd jeśli profil nie istnieje

- `deleteAccount(supabase: SupabaseClient, userId: string): Promise<void>`
  - Używa `supabase.auth.admin.deleteUser(userId)` (wymaga admin klienta)
  - Alternatywnie: wywołanie RPC function w Supabase

**Uwaga**: DELETE może wymagać specjalnego admin klienta Supabase lub funkcji RPC po stronie bazy.

### Krok 3: Implementacja GET /api/profile
**Plik**: `src/pages/api/profile.ts`

```typescript
export const prerender = false;

export async function GET(context: APIContext) {
  const supabase = context.locals.supabase;
  const user = context.locals.user;

  if (!user) {
    return new Response(
      JSON.stringify({
        error: {
          code: "UNAUTHORIZED",
          message: "User not authenticated",
        },
      }),
      { status: 401, headers: { "Content-Type": "application/json" } }
    );
  }

  const profile = await getProfile(supabase, user.id);

  if (!profile) {
    return new Response(
      JSON.stringify({
        error: {
          code: "NOT_FOUND",
          message: "Profile not found",
        },
      }),
      { status: 404, headers: { "Content-Type": "application/json" } }
    );
  }

  return new Response(JSON.stringify(profile), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
```

### Krok 4: Implementacja PATCH /api/profile
W tym samym pliku `src/pages/api/profile.ts`:

```typescript
export async function PATCH(context: APIContext) {
  const supabase = context.locals.supabase;
  const user = context.locals.user;

  if (!user) {
    return new Response(
      JSON.stringify({
        error: {
          code: "UNAUTHORIZED",
          message: "User not authenticated",
        },
      }),
      { status: 401, headers: { "Content-Type": "application/json" } }
    );
  }

  const body = await context.request.json();
  const validation = updateProfileSchema.safeParse(body);

  if (!validation.success) {
    return new Response(
      JSON.stringify({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid request body",
          details: validation.error.errors,
        },
      }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    const updatedProfile = await updateProfile(supabase, user.id, validation.data);
    return new Response(JSON.stringify(updatedProfile), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Handle not found or internal errors
    // Implementation depends on error type from service
  }
}
```

### Krok 5: Implementacja DELETE /api/profile
W tym samym pliku `src/pages/api/profile.ts`:

```typescript
export async function DELETE(context: APIContext) {
  const supabase = context.locals.supabase;
  const user = context.locals.user;

  if (!user) {
    return new Response(
      JSON.stringify({
        error: {
          code: "UNAUTHORIZED",
          message: "User not authenticated",
        },
      }),
      { status: 401, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    await deleteAccount(supabase, user.id);
    return new Response(null, { status: 204 });
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to delete account",
        },
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
```

### Krok 6: Obsługa błędów w service layer
- Zdefiniować custom error classes (opcjonalnie):
  - `ProfileNotFoundError` dla 404
  - `ProfileUpdateError` dla błędów aktualizacji
- Obsłużyć błędy Supabase i zmapować na odpowiednie HTTP status codes
- Dodać logging błędów (console.error dla development)

### Krok 7: Aktualizacja pliku testowego endpoints.http
Dodać sekcję testowania Profile Management API z przykładami:
- GET /api/profile
- PATCH /api/profile (akceptacja zgody)
- PATCH /api/profile (odrzucenie zgody)
- DELETE /api/profile

### Krok 8: Testy manualne
1. Przetestować GET bez uwierzytelnienia → 401
2. Przetestować GET z uwierzytelnieniem → 200
3. Przetestować PATCH z pustym body → 400
4. Przetestować PATCH z nieprawidłowym typem → 400
5. Przetestować PATCH z prawidłowymi danymi → 200
6. Przetestować DELETE → 204 i weryfikacja usunięcia konta

### Krok 9: Dokumentacja
- Upewnić się, że API jest zgodne ze specyfikacją
- Dodać komentarze JSDoc do funkcji service
- Zaktualizować dokumentację API (jeśli istnieje)

## 10. Dodatkowe uwagi

### Bezpieczeństwo DELETE
DELETE /api/profile jest operacją krytyczną. Warto rozważyć:
- **Confirmation step**: Wymaganie potwierdzenia przez UI (np. wpisanie hasła)
- **Email notification**: Wysłanie emaila po usunięciu konta
- **Grace period**: Soft delete z możliwością odzyskania w ciągu X dni (future enhancement)

### Admin Client dla DELETE
Supabase Auth API `deleteUser()` wymaga admin klienta. Rozwiązania:
1. **Opcja A**: Utworzyć admin klienta z service role key (bezpieczne tylko server-side)
2. **Opcja B**: Utworzyć Supabase Edge Function/RPC function do usuwania użytkownika
3. **Opcja C**: Używać `supabase.rpc('delete_user_account')` jeśli funkcja istnieje w bazie

**Rekomendacja**: Opcja B/C jest bezpieczniejsza i zgodna z best practices.

### Profil podczas rejestracji
Według db-plan.md, profil jest tworzony automatycznie dla nowego użytkownika (trigger lub hook w Supabase). Należy upewnić się, że ten mechanizm działa poprawnie.

### GDPR Compliance
Implementacja DELETE spełnia wymagania GDPR:
- Usunięcie wszystkich danych osobowych (CASCADE)
- Anonimizacja danych analitycznych AI (SET NULL)
- Pełne usunięcie konta z auth.users
