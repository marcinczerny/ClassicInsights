# Plan implementacji widoku Resetowania Hasła

## 1. Przegląd
Celem tego widoku jest umożliwienie użytkownikom, którzy zapomnieli hasła, zainicjowanie procesu jego resetowania. Widok będzie zawierał prosty formularz, w którym użytkownik poda swój adres e-mail. Po pomyślnym przesłaniu formularza, na podany adres zostanie wysłana wiadomość z unikalnym linkiem do ustawienia nowego hasła.

## 2. Routing widoku
Widok będzie dostępny pod następującą ścieżką:
- **Ścieżka**: `/reset-password`
- **Plik**: `src/pages/reset-password.astro`

## 3. Struktura komponentów
Hierarchia komponentów dla tego widoku będzie prosta i skupiona na renderowaniu interaktywnego formularza wewnątrz statycznego layoutu strony.

```
- src/pages/reset-password.astro
  - src/layouts/Layout.astro
    - src/components/auth/ResetPasswordForm.tsx (client:visible)
      - Komponenty UI z biblioteki Shadcn (Form, Input, Button)
```

## 4. Szczegóły komponentów
### `ResetPasswordPage` (`src/pages/reset-password.astro`)
- **Opis komponentu**: Strona Astro odpowiedzialna za renderowanie ogólnego layoutu aplikacji oraz osadzenie w nim klienckiego komponentu React `ResetPasswordForm`. Strona ta nie będzie zawierać żadnej dynamicznej logiki.
- **Główne elementy**:
  - `Layout`: Główny layout aplikacji.
  - `ResetPasswordForm`: Interaktywny komponent formularza React.
- **Propsy**: Brak.

### `ResetPasswordForm` (`src/components/auth/ResetPasswordForm.tsx`)
- **Opis komponentu**: Komponent React, który zarządza stanem i logiką formularza resetowania hasła. Odpowiada za walidację danych wejściowych, komunikację z API oraz wyświetlanie informacji zwrotnej dla użytkownika (ładowanie, sukces, błąd).
- **Główne elementy**:
  - Komponenty UI z biblioteki Shadcn (`Card`, `Input`, `Button`).
  - Standardowy element `<form>` do obsługi wysyłania.
  - Elementy do wyświetlania komunikatów o sukcesie lub błędzie (np. przy użyciu istniejącego `ToastProvider`).
- **Obsługiwane interakcje**:
  - `onSubmit`: Uruchamia walidację i wysyła zapytanie do API.
- **Obsługiwana walidacja**:
  - `email`: Pole jest wymagane.
  - `email`: Musi być poprawnym formatem adresu e-mail (np. `user@example.com`).
- **Typy**: `ResetPasswordDTO`, `ResetPasswordViewModel`.
- **Propsy**: Brak.

## 5. Typy
Do implementacji widoku wymagane będą następujące typy.

### `ResetPasswordDTO`
Służy jako obiekt transferu danych dla formularza i ciała zapytania API.
```typescript
interface ResetPasswordDTO {
  email: string;
}
```

### `ResetPasswordViewModel`
Reprezentuje wewnętrzny stan komponentu `ResetPasswordForm`.
```typescript
interface ResetPasswordViewModel {
  isLoading: boolean;
  error: string | null;
  successMessage: string | null;
}
```

## 6. Zarządzanie stanem
Stan będzie zarządzany lokalnie w komponencie `ResetPasswordForm.tsx` przy użyciu hooka `useState`. Będzie on śledził wartości pól formularza, błędy walidacji oraz stan ładowania (`isLoading`), zapewniając spójność z innymi formularzami w aplikacji, takimi jak `LoginForm`.

## 7. Integracja API
Komponent będzie komunikował się z nowo utworzonym punktem końcowym API.

- **Endpoint**: `POST /api/auth/reset-password`
- **Plik**: `src/pages/api/auth/reset-password.ts`
- **Logika**: Endpoint wykorzysta metodę `supabase.auth.resetPasswordForEmail()` z Supabase SDK do wysłania e-maila resetującego hasło. Link w mailu będzie kierował na ścieżkę `/update-password`.
- **Typ żądania (Request Body)**: `ResetPasswordDTO`
  ```json
  {
    "email": "user@example.com"
  }
  ```
- **Typ odpowiedzi (Success Response)**: `200 OK` z komunikatem.
  ```json
  {
    "message": "If an account with this email exists, a password reset link has been sent."
  }
  ```
- **Typ odpowiedzi (Error Response)**: `400/500` z komunikatem błędu.
  ```json
  {
    "error": "An unexpected error occurred."
  }
  ```

## 8. Interakcje użytkownika
1.  Użytkownik przechodzi na stronę `/reset-password` (np. klikając link na stronie logowania).
2.  Wpisuje swój adres e-mail w polu formularza.
3.  Klika przycisk "Wyślij link".
4.  Przycisk zostaje zablokowany, a interfejs pokazuje stan ładowania.
5.  Po otrzymaniu odpowiedzi z API, użytkownik widzi powiadomienie (toast) z informacją o powodzeniu lub błędzie. W przypadku sukcesu formularz zostaje wyczyszczony.

## 9. Warunki i walidacja
- **Komponent**: `ResetPasswordForm.tsx`
- **Warunki**:
  - Adres e-mail nie może być pusty.
  - Adres e-mail musi być zgodny ze standardowym formatem.
- **Implementacja**: Walidacja będzie zaimplementowana po stronie klienta przy użyciu biblioteki `zod`. Schemat walidacji zostanie sprawdzony manualnie wewnątrz funkcji obsługującej `onSubmit`, a ewentualne błędy zostaną zapisane w stanie komponentu i wyświetlone użytkownikowi.
  ```typescript
  import { z } from "zod";

  const ResetPasswordSchema = z.object({
    email: z.string().email({ message: "Proszę podać prawidłowy adres e-mail." }),
  });
  ```
- **Wpływ na interfejs**: W przypadku błędu walidacji, pod polem input pojawi się komunikat o błędzie, a formularz nie zostanie wysłany.

## 10. Obsługa błędów
- **Błąd walidacji klienta**: Komunikat o błędzie jest wyświetlany bezpośrednio pod polem formularza.
- **Błąd sieci**: W przypadku problemów z połączeniem, `fetch` rzuci błąd, który zostanie przechwycony w bloku `catch`. Użytkownik zobaczy ogólny komunikat o błędzie sieci (np. "Błąd połączenia. Spróbuj ponownie.").
- **Błąd serwera (API)**: Jeśli API zwróci błąd (np. status 500), użytkownik zobaczy ogólny komunikat o błędzie (np. "Wystąpił nieoczekiwany błąd. Spróbuj ponownie później.").
- **Prewencja User Enumeration**: Aby zapobiec możliwości odgadnięcia, które adresy e-mail są zarejestrowane w systemie, API zawsze powinno zwracać odpowiedź `200 OK` z tym samym, ogólnym komunikatem, niezależnie od tego, czy konto istnieje.

## 11. Kroki implementacji
1.  **Stworzenie endpointu API**: Utwórz plik `src/pages/api/auth/reset-password.ts`. Zaimplementuj w nim logikę wywołującą `supabase.auth.resetPasswordForEmail()` z `redirectTo` ustawionym na `${Astro.url.origin}/update-password`.
2.  **Stworzenie strony widoku**: Utwórz plik `src/pages/reset-password.astro`, który będzie importował i renderował komponent `ResetPasswordForm`.
3.  **Stworzenie komponentu formularza**: Utwórz plik `src/components/auth/ResetPasswordForm.tsx`.
4.  **Budowa UI formularza**: Użyj komponentów z Shadcn/ui (`Card`, `Input`, `Button`), aby zbudować interfejs formularza, zachowując spójność z `LoginForm.tsx`.
5.  **Implementacja walidacji**: Zdefiniuj schemat walidacji `zod` i zaimplementuj ręczną obsługę walidacji w handlerze `onSubmit`.
6.  **Implementacja logiki `onSubmit`**: Napisz funkcję obsługującą wysyłkę formularza, która będzie wywoływać `fetch` do nowo utworzonego endpointu API.
7.  **Zarządzanie stanem UI**: Dodaj obsługę stanu ładowania oraz wyświetlanie powiadomień o sukcesie lub błędzie przy użyciu `useState` i `ToastProvider`.
8.  **Dodanie nawigacji**: W komponencie `LoginForm.tsx` (`src/components/auth/LoginForm.tsx`) dodaj link nawigacyjny do strony `/reset-password`.
