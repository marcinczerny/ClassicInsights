# Plan implementacji widoku Onboarding

## 1. Przegląd
Widok Onboarding ma na celu powitanie nowych użytkowników po ich pierwszym zalogowaniu do aplikacji. Jest to modal wyświetlany nad głównym pulpitem, który zawiera krótkie wprowadzenie do aplikacji i wyraźne wezwanie do działania (CTA), zachęcające do stworzenia pierwszej notatki. Celem jest płynne wprowadzenie użytkownika w podstawową funkcjonalność aplikacji i pokierowanie go do pierwszej kluczowej interakcji.

## 2. Routing widoku
Widok nie będzie posiadał dedykowanej ścieżki (route). Zostanie zaimplementowany jako komponent modalny (`<OnboardingModal />`), który będzie warunkowo renderowany na stronie głównego pulpitu, dostępnej pod ścieżką `/`.

## 3. Struktura komponentów
Hierarchia komponentów będzie prosta i skupi się na ponownym wykorzystaniu istniejących elementów UI.

```
/src/components/dashboard/DashboardPage.tsx
└── /src/components/onboarding/OnboardingModal.tsx (nowy)
    ├── /src/components/ui/dialog.tsx (z Shadcn/ui)
    │   ├── DialogContent
    │   │   ├── DialogHeader
    │   │   │   ├── DialogTitle
    │   │   │   └── DialogDescription
    │   │   └── DialogFooter
    │   │       └── /src/components/ui/button.tsx (z Shadcn/ui)
    └── (elementy `DialogOverlay`, `DialogClose` są obsługiwane przez Shadcn)
```

## 4. Szczegóły komponentów
### `DashboardPage.tsx` (modyfikacja)
- **Opis komponentu**: Główny komponent strony pulpitu, odpowiedzialny za pobieranie i wyświetlanie listy notatek użytkownika. Zostanie rozszerzony o logikę decydującą, czy pokazać modal onboardingowy.
- **Główne elementy**: Wykorzystuje istniejącą strukturę. Doda warunkowe renderowanie komponentu `<OnboardingModal />`.
- **Obsługiwane interakcje**:
  - Obsługa zdarzenia `onCtaClick` z modala w celu nawigacji do `/notes/new`.
  - Obsługa zdarzenia `onClose` z modala w celu zapisania stanu odrzucenia w `sessionStorage` i zamknięcia modala.
- **Obsługiwana walidacja**:
  - Sprawdza, czy całkowita liczba notatek użytkownika (`pagination.total`) wynosi `0`.
  - Sprawdza, czy użytkownik nie odrzucił już modala w bieżącej sesji (na podstawie flagi w `sessionStorage`).
- **Typy**: `DashboardState` (z `src/components/dashboard/types.ts`).
- **Propsy**: Brak (komponent routingu).

### `OnboardingModal.tsx` (nowy)
- **Opis komponentu**: Komponent modalny, który wyświetla powitanie i CTA. Jest to komponent "głupi" (dumb component), którego stanem (otwarty/zamknięty) zarządza rodzic (`DashboardPage`).
- **Główne elementy**:
  - `Dialog`, `DialogContent`, `DialogHeader`, `DialogTitle`, `DialogDescription`, `DialogFooter` z biblioteki Shadcn/ui (`@/components/ui/dialog`).
  - `Button` z Shadcn/ui (`@/components/ui/button`) jako przycisk CTA.
- **Obsługiwane interakcje**:
  - Kliknięcie przycisku CTA emituje zdarzenie `onCtaClick`.
  - Zamknięcie modala (przez przycisk 'X', kliknięcie tła lub klawisz Esc) emituje zdarzenie `onClose`.
- **Obsługiwana walidacja**: Brak.
- **Typy**: `OnboardingModalProps`.
- **Propsy**:
  ```typescript
  interface OnboardingModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCtaClick: () => void;
  }
  ```

## 5. Typy
Nie ma potrzeby tworzenia nowych, złożonych typów DTO ani ViewModel. Wykorzystane zostaną istniejące typy.

- **`PaginatedNotesResponseDTO`**: Typ odpowiedzi z endpointu `GET /api/notes`, zawierający `data: NoteDTO[]` i `pagination: PaginationDTO`.
- **`PaginationDTO`**: Obiekt zawierający metadane paginacji. Kluczowe będzie pole `total: number`.
- **`OnboardingModalProps`**: Interfejs propsów dla komponentu `OnboardingModal`, zdefiniowany w poprzedniej sekcji.

## 6. Zarządzanie stanem
Zarządzanie stanem będzie realizowane na poziomie komponentu `DashboardPage` przy użyciu hooków Reacta. Nie ma potrzeby tworzenia globalnego stanu w Zustand/Context dla tej funkcjonalności.

- **Stan widoczności modala**:
  - `const [isModalOpen, setIsModalOpen] = useState(false);`
  - Ten stan będzie kontrolował, czy komponent `<OnboardingModal />` jest aktualnie renderowany.

- **Stan odrzucenia w sesji**:
  - Do obsługi odrzucenia modala w ramach jednej sesji przeglądarki zostanie wykorzystany `sessionStorage`.
  - Można stworzyć prosty, reużywalny hook `useSessionStorage` dla czystości kodu:
    ```typescript
    // src/lib/hooks/useSessionStorage.ts
    import { useState, useEffect } from 'react';

    function useSessionStorage<T>(key: string, initialValue: T): [T, (value: T) => void] {
      const [storedValue, setStoredValue] = useState<T>(() => {
        if (typeof window === 'undefined') {
          return initialValue;
        }
        try {
          const item = window.sessionStorage.getItem(key);
          return item ? JSON.parse(item) : initialValue;
        } catch (error) {
          console.error(error);
          return initialValue;
        }
      });

      useEffect(() => {
        if (typeof window !== 'undefined') {
          window.sessionStorage.setItem(key, JSON.stringify(storedValue));
        }
      }, [key, storedValue]);

      return [storedValue, setStoredValue];
    }
    ```
  - W `DashboardPage`: `const [onboardingDismissed, setOnboardingDismissed] = useSessionStorage('onboardingDismissed', false);`

## 7. Integracja API
- **Endpoint**: `GET /api/notes`
- **Cel**: Sprawdzenie, czy użytkownik ma jakiekolwiek notatki.
- **Integracja**:
  1. W komponencie `DashboardPage`, istniejący hook do pobierania notatek (np. `useNotes`) zostanie wykorzystany do wykonania zapytania `GET /api/notes?limit=1`.
  2. Po pomyślnym otrzymaniu odpowiedzi (w `onSuccess` lub `useEffect` zależnym od danych), zostanie sprawdzona wartość `data.pagination.total`.
  3. Jeśli `data.pagination.total === 0` oraz flaga `onboardingDismissed` z `sessionStorage` ma wartość `false`, stan `isModalOpen` zostanie ustawiony na `true`.
- **Typy**:
  - **Żądanie**: Nie dotyczy (parametry w URL).
  - **Odpowiedź**: `PaginatedNotesResponseDTO`.

## 8. Interakcje użytkownika
- **Nowy użytkownik ląduje na pulpicie**:
  - Aplikacja wysyła zapytanie do `GET /api/notes`.
  - Odpowiedź wskazuje `total: 0`.
  - Modal `OnboardingModal` jest wyświetlany.
- **Użytkownik klika przycisk CTA "Stwórz pierwszą notatkę"**:
  - Wywoływana jest funkcja `onCtaClick`.
  - Aplikacja nawiguje użytkownika do ścieżki `/notes/new`.
  - Stan modala jest ustawiany na `false`.
- **Użytkownik zamyka modal (np. klawiszem Esc)**:
  - Wywoływana jest funkcja `onClose`.
  - Flaga `onboardingDismissed` jest ustawiana na `true` w `sessionStorage`.
  - Stan modala jest ustawiany na `false`.
  - Modal nie pojawi się ponownie podczas tej samej sesji, nawet po odświeżeniu strony.

## 9. Warunki i walidacja
- **Warunek 1**: Użytkownik nie ma żadnych notatek.
  - **Weryfikacja**: W `DashboardPage`, po pobraniu danych z `GET /api/notes`, sprawdzane jest pole `response.pagination.total === 0`.
  - **Wpływ na UI**: Jeśli `true`, kontynuowana jest weryfikacja warunku 2. Jeśli `false`, modal nie jest pokazywany.
- **Warunek 2**: Modal nie został odrzucony w bieżącej sesji.
  - **Weryfikacja**: W `DashboardPage`, sprawdzana jest wartość z `sessionStorage` (np. `sessionStorage.getItem('onboardingDismissed') !== 'true'`).
  - **Wpływ na UI**: Jeśli `true` (i warunek 1 jest spełniony), modal jest pokazywany. Jeśli `false`, modal pozostaje ukryty.

## 10. Obsługa błędów
- **Scenariusz**: Błąd podczas pobierania danych z `GET /api/notes` (np. błąd sieci, błąd serwera 5xx).
  - **Obsługa**: Logika biznesowa w `DashboardPage` nie powinna pokazywać modala onboardingowego. Komponent powinien obsłużyć błąd pobierania danych w standardowy sposób (np. wyświetlając komunikat o błędzie lub toast), a logika onboardingu nie zostanie aktywowana. Należy upewnić się, że sprawdzanie liczby notatek odbywa się tylko po pomyślnym załadowaniu danych.

## 11. Kroki implementacji
1.  **Stworzenie komponentu `OnboardingModal`**:
    -   Utwórz plik `/src/components/onboarding/OnboardingModal.tsx`.
    -   Zaimplementuj komponent używając `Dialog` z Shadcn/ui.
    -   Dodaj propsy `isOpen`, `onClose`, `onCtaClick`.
    -   Wypełnij `DialogTitle` i `DialogDescription` treścią powitalną.
    -   Dodaj `Button` w `DialogFooter` jako CTA, który wywołuje `onCtaClick`.
2.  **(Opcjonalnie) Stworzenie hooka `useSessionStorage`**:
    -   Utwórz plik `/src/lib/hooks/useSessionStorage.ts`.
    -   Zaimplementuj logikę hooka zgodnie z opisem w sekcji "Zarządzanie stanem".
3.  **Modyfikacja komponentu `DashboardPage`**:
    -   W pliku `/src/components/dashboard/DashboardPage.tsx`, dodaj stany `isModalOpen` i `onboardingDismissed`.
    -   W logice obsługi danych pobranych z `GET /api/notes`, dodaj warunki sprawdzające `data.pagination.total` i stan `onboardingDismissed`.
    -   Jeśli warunki są spełnione, ustaw `setIsModalOpen(true)`.
    -   Zaimplementuj funkcje `handleCtaClick` (nawigacja do `/notes/new`) i `handleModalClose` (ustawienie `onboardingDismissed` na `true`).
    -   Renderuj komponent `<OnboardingModal />` warunkowo, przekazując do niego odpowiednie propsy.
4.  **Testowanie**:
    -   Przetestuj scenariusz dla nowego użytkownika (0 notatek), aby upewnić się, że modal się pojawia.
    -   Sprawdź działanie przycisku CTA.
    -   Sprawdź, czy zamknięcie modala zapobiega jego ponownemu pojawieniu się w tej samej sesji.
    -   Sprawdź, czy po utworzeniu pierwszej notatki modal nie pojawia się w nowej sesji.
    -   Przetestuj scenariusz dla istniejącego użytkownika (>0 notatek), aby upewnić się, że modal się nie pojawia.
