# Plan implementacji widoku nawigacji

## 1. Przegląd
Widok nawigacji to globalny, trwały komponent interfejsu użytkownika (`TopNavigationBar`), który jest obecny na wszystkich uwierzytelnionych stronach aplikacji. Jego głównym celem jest zapewnienie użytkownikom stałego i łatwego dostępu do kluczowych sekcji aplikacji, zarządzania kontem oraz globalnych ustawień interfejsu, takich jak motyw kolorystyczny.

## 2. Routing widoku
Komponent nawigacji nie będzie posiadał własnej, dedykowanej ścieżki (route). Zamiast tego, zostanie zintegrowany jako stały element w głównym layoucie aplikacji (`src/layouts/Layout.astro`), który owija wszystkie strony wymagające uwierzytelnienia. Dzięki temu będzie widoczny na każdej stronie bez potrzeby ponownego renderowania podczas nawigacji.

## 3. Struktura komponentów
Komponenty zostaną zaimplementowane w React i osadzone w layoucie Astro. Hierarchia będzie wyglądać następująco:

```
/src/layouts/Layout.astro
└── /src/components/layout/TopNavigationBar.tsx
    ├── Logo aplikacji (jako część JSX)
    ├── /src/components/layout/NavLinks.tsx
    ├── /src/components/layout/GraphControls.tsx
    ├── /src/components/layout/ThemeToggle.tsx
    └── /src/components/layout/UserProfileDropdown.tsx
        ├── <DropdownMenuTrigger> (z Shadcn/ui)
        └── <DropdownMenuContent> (z Shadcn/ui)
```

## 4. Szczegóły komponentów

### `TopNavigationBar.tsx`
- **Opis komponentu**: Główny kontener paska nawigacyjnego. Odpowiada za kompozycję i ułożenie wszystkich podkomponentów. Otrzymuje stan sesji użytkownika i na tej podstawie decyduje, które elementy wyświetlić.
- **Główne elementy**: `header`, `nav`, `div` do grupowania elementów (logo, linki, kontrolki, profil). Używa Flexbox do rozmieszczenia elementów.
- **Obsługiwane interakcje**: Brak bezpośrednich interakcji, deleguje je do komponentów dzieci.
- **Obsługiwana walidacja**: Sprawdza, czy użytkownik jest zalogowany na podstawie otrzymanych propsów, aby warunkowo renderować linki i profil użytkownika.
- **Typy**: `User` z `@supabase/supabase-js`.
- **Propsy**: `user: User | null`.

### `NavLinks.tsx`
- **Opis komponentu**: Wyświetla główne linki nawigacyjne do kluczowych sekcji aplikacji.
- **Główne elementy**: Element `div` lub `Fragment` zawierający listę linków (`<a>`), które wskazują na `/` (Notes) i `/entities` (Entities). Linki będą stylizowane zgodnie z systemem designu.
- **Obsługiwane interakcje**: Kliknięcie na link przenosi użytkownika do odpowiedniej strony.
- **Obsługiwana walidacja**: Brak.
- **Typy**: Brak.
- **Propsy**: Brak.

### `GraphControls.tsx`
- **Opis komponentu**: Przełącznik do zarządzania widocznością panelu bocznego z grafem myśli.
- **Główne elementy**: Komponent `Button` z ikoną (np. z `lucide-react`).
- **Obsługiwane interakcje**: Kliknięcie przycisku przełącza stan widoczności panelu grafu.
- **Obsługiwana walidacja**: Brak.
- **Typy**: Brak.
- **Propsy**: Brak.

### `ThemeToggle.tsx`
- **Opis komponentu**: Przełącznik do zmiany motywu aplikacji (jasny/ciemny).
- **Główne elementy**: Komponent `Switch` z biblioteki Shadcn/ui, z ikonami słońca i księżyca.
- **Obsługiwane interakcje**: Kliknięcie przełącznika zmienia globalny stan motywu i zapisuje wybór w `localStorage`.
- **Obsługiwana walidacja**: Brak.
- **Typy**: `Theme` (string: 'light' | 'dark' | 'system').
- **Propsy**: Brak.

### `UserProfileDropdown.tsx`
- **Opis komponentu**: Rozwijane menu z opcjami dotyczącymi konta użytkownika. Wyświetla awatar lub inicjały użytkownika.
- **Główne elementy**: Wykorzystuje komponenty `DropdownMenu`, `DropdownMenuTrigger`, `DropdownMenuContent`, `DropdownMenuItem`, `DropdownMenuSeparator` z Shadcn/ui.
- **Obsługiwane interakcje**:
    - Kliknięcie w awatar/przycisk rozwija menu.
    - Kliknięcie "Profil" przenosi do `/profile`.
    - Kliknięcie "Wyloguj się" uruchamia proces wylogowania.
- **Obsługiwana walidacja**: Brak.
- **Typy**: `User` z `@supabase/supabase-js`.
- **Propsy**: `user: User`.

## 5. Typy
Do implementacji tego widoku nie są wymagane nowe, złożone typy. Będziemy korzystać głównie z istniejącego typu `User` dostarczanego przez bibliotekę Supabase, który zawiera podstawowe informacje o zalogowanym użytkowniku.

-   **`User` (z `@supabase/supabase-js`)**: Obiekt reprezentujący zalogowanego użytkownika. Będziemy z niego korzystać, aby uzyskać dostęp do `email` lub `id` użytkownika w celu wyświetlenia inicjałów lub nazwy.
    ```typescript
    interface User {
      id: string;
      email?: string;
      // ...inne pola
    }
    ```

## 6. Zarządzanie stanem
Ze względu na globalny charakter paska nawigacji, konieczne jest zastosowanie globalnego zarządzania stanem, które będzie współdzielone między różnymi komponentami React (wyspami Astro).

-   **Stan sesji użytkownika (`user`)**: Przechowywany w globalnym stanie (np. w sklepie `Zustand` lub `Nano Stores`). Inicjalizowany po stronie serwera w `Layout.astro` i przekazywany do klienta w celu hydracji. Komponent `UserProfileDropdown` będzie subskrybował ten stan.
-   **Stan motywu (`theme`)**: Zarządzany przez dedykowany hook `useTheme` (lub bibliotekę `next-themes`), który będzie synchronizował stan z `localStorage` oraz atrybutem `class` na tagu `<html>`.
-   **Stan panelu grafu (`isGraphPanelVisible`)**: Zarządzany w tym samym globalnym sklepie co stan użytkownika. Komponent `GraphControls` będzie modyfikował ten stan.

**Proponowany custom hook/store:**
Utworzymy globalny sklep przy użyciu `Zustand` lub `Nano Stores` do zarządzania stanem, który musi być współdzielony.
```typescript
// src/stores/app-store.ts
import { atom } from 'nanostores';
import type { User } from '@supabase/supabase-js';

export const $user = atom<User | null>(null);
export const $isGraphPanelVisible = atom<boolean>(false);
```

## 7. Integracja API
Integracja z API będzie minimalna i dotyczyć będzie głównie autentykacji.

-   **Pobieranie sesji użytkownika**: W `Layout.astro`, po stronie serwera, zostanie wykonane zapytanie o aktualną sesję użytkownika za pomocą `locals.supabase.auth.getSession()`. Jeśli sesja istnieje, obiekt `user` zostanie przekazany do komponentu `TopNavigationBar`.
-   **Wylogowanie**: Akcja "Wyloguj się" w `UserProfileDropdown` nie będzie wywoływać dedykowanego endpointu API, lecz funkcję `supabase.auth.signOut()` z klienckiego SDK Supabase. Po pomyślnym wylogowaniu, aplikacja powinna przekierować użytkownika na stronę logowania (`/sign-in`).

## 8. Interakcje użytkownika
-   **Nawigacja**: Kliknięcie linków "Notes" i "Entities" powoduje natychmiastowe przejście do odpowiednich stron.
-   **Zmiana motywu**: Kliknięcie przełącznika motywu natychmiast zmienia wygląd całej aplikacji. Zmiana jest trwała (zapisana w `localStorage`).
-   **Zarządzanie panelem grafu**: Kliknięcie przycisku kontrolnego grafu przełącza stan widoczności panelu bocznego, co jest odzwierciedlane w globalnym stanie i wpływa na layout strony.
-   **Dostęp do profilu i wylogowanie**: Kliknięcie awatara otwiera menu. Wybranie opcji "Profil" przenosi na stronę `/profile`. Wybranie "Wyloguj się" kończy sesję i przekierowuje na stronę logowania.

## 9. Warunki i walidacja
-   **Stan uwierzytelnienia**: Najważniejszym warunkiem jest stan zalogowania użytkownika.
    -   **Jeśli użytkownik jest zalogowany**: `TopNavigationBar` renderuje wszystkie elementy: linki nawigacyjne, kontrolki grafu, przełącznik motywu oraz menu profilowe.
    -   **Jeśli użytkownik nie jest zalogowany**: `TopNavigationBar` powinien renderować uproszczoną wersję, zawierającą jedynie logo aplikacji i przełącznik motywu. Linki nawigacyjne oraz menu profilowe są ukryte. Ten warunek jest sprawdzany w `Layout.astro` i przekazywany jako prop do komponentu React.

## 10. Obsługa błędów
-   **Błąd wylogowania**: W przypadku, gdyby operacja `supabase.auth.signOut()` zakończyła się błędem (np. z powodu problemów z siecią), należy poinformować o tym użytkownika.
    -   **Rozwiązanie**: Należy użyć bloku `try...catch`. W bloku `catch` można wyświetlić powiadomienie typu "toast" (np. z biblioteki `sonner`) z komunikatem "Wylogowanie nie powiodło się. Spróbuj ponownie." Użytkownik nie powinien być przekierowywany.

## 11. Kroki implementacji
1.  **Utworzenie plików komponentów**: Stwórz pliki dla wszystkich wymienionych komponentów React w katalogu `src/components/layout/`.
2.  **Implementacja `ThemeToggle`**: Zaimplementuj logikę przełączania motywu, najlepiej przy użyciu gotowej biblioteki lub prostego skryptu modyfikującego `localStorage` i klasę na `<html>`.
3.  **Implementacja `UserProfileDropdown`**: Zbuduj komponent z użyciem `DropdownMenu` z Shadcn/ui. Dodaj logikę wyświetlania inicjałów z emaila użytkownika oraz obsługę akcji "Profil" i "Wyloguj się" (wywołanie `supabase.auth.signOut()`).
4.  **Implementacja `NavLinks` i `GraphControls`**: Stwórz statyczne komponenty renderujące odpowiednie linki i przyciski. Logika `GraphControls` będzie na razie zaślepiona do czasu implementacji globalnego stanu.
5.  **Skonfigurowanie globalnego stanu**: Skonfiguruj `Nano Stores` lub `Zustand` do zarządzania stanem `user` i `isGraphPanelVisible`.
6.  **Złożenie `TopNavigationBar`**: Połącz wszystkie mniejsze komponenty w `TopNavigationBar.tsx`. Dodaj logikę warunkowego renderowania w zależności od propsa `user`.
7.  **Integracja z `Layout.astro`**: W `src/layouts/Layout.astro`:
    -   Pobierz sesję użytkownika po stronie serwera.
    -   Dodaj komponent `<TopNavigationBar client:load />`, przekazując do niego dane użytkownika.
    -   Zainicjalizuj (zhydruj) globalny sklep po stronie klienta z danymi sesji.
8.  **Stylowanie**: Użyj Tailwind CSS do ostylowania wszystkich komponentów zgodnie z UI planem, zapewniając responsywność.
9.  **Testowanie**: Przetestuj wszystkie interakcje użytkownika, w tym nawigację, zmianę motywu, wylogowanie oraz warunkowe renderowanie dla zalogowanych i niezalogowanych użytkowników.
