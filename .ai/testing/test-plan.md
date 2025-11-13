# Plan Testów dla Aplikacji "ClassicInsights"

## 1. Wprowadzenie i Cele Testowania

### 1.1. Wprowadzenie
Niniejszy dokument określa strategię, zakres, podejście i zasoby przeznaczone do testowania aplikacji "ClassicInsights". Aplikacja jest systemem do zarządzania wiedzą, opartym o notatki, byty (encje) i graficzne wizualizacje powiązań między nimi, z wykorzystaniem sugestii AI. Projekt bazuje na nowoczesnym stosie technologicznym (Astro, React, Supabase, OpenRouter), co wymaga specyficznego podejścia do zapewnienia jakości. Stworzenie planu testów jest kluczowe dla uporządkowania procesu weryfikacji oprogramowania i uniknięcia problemów na późniejszych etapach.

### 1.2. Cele Testowania
Głównym celem procesu testowania jest zapewnienie wysokiej jakości, niezawodności, bezpieczeństwa i wydajności aplikacji "ClassicInsights". Szczegółowe cele obejmują:
*   **Weryfikację funkcjonalną:** Upewnienie się, że wszystkie funkcje aplikacji działają zgodnie z założeniami.
*   **Zapewnienie integralności danych:** Sprawdzenie, czy relacje między notatkami, bytami i użytkownikami są spójne i poprawne.
*   **Ocena użyteczności i UX:** Weryfikacja, czy interfejs użytkownika jest intuicyjny i responsywny.
*   **Testowanie bezpieczeństwa:** Potwierdzenie, że dane użytkowników są odizolowane i chronione przed nieautoryzowanym dostępem.
*   **Ocena wydajności:** Identyfikacja i eliminacja potencjalnych "wąskich gardeł" wydajnościowych, zwłaszcza w module grafu.
*   **Weryfikacja integracji:** Zapewnienie poprawnej komunikacji z usługami zewnętrznymi (Supabase, OpenRouter.ai).

## 2. Zakres Testów

### 2.1. Funkcjonalności objęte testami (In-Scope)
W tej sekcji należy szczegółowo określić, które moduły i funkcjonalności będą podlegały testom.
*   **Moduł uwierzytelniania:** Rejestracja, logowanie, wylogowywanie, resetowanie hasła, ochrona ścieżek.
*   **Zarządzanie Notatkami (CRUD):** Tworzenie, odczyt, aktualizacja i usuwanie notatek, w tym obsługa treści w formacie Markdown.
*   **Zarządzanie Bytami (CRUD):** Tworzenie, odczyt, aktualizacja i usuwanie bytów.
*   **Powiązania Notatka-Byt:** Dodawanie i usuwanie bytów z notatek, definiowanie typów relacji.
*   **Główny Dashboard:** Filtrowanie i wyszukiwanie notatek, paginacja.
*   **Wizualizacja Grafu:**
    *   Renderowanie grafu na podstawie danych.
    *   Interakcje z grafem (centrowanie na węźle, podgląd informacji).
    *   Tworzenie, edycja i usuwanie relacji między bytami bezpośrednio z poziomu grafu.
*   **Sugestie AI:**
    *   Inicjowanie analizy notatki.
    *   Wyświetlanie sugestii.
    *   Akceptacja i odrzucanie sugestii oraz weryfikacja ich wpływu na dane (np. automatyczne dodanie bytu).
*   **API Endpoints:** Walidacja zapytań i odpowiedzi dla wszystkich punktów końcowych w `src/pages/api/`.

### 2.2. Funkcjonalności wyłączone z testów (Out-of-Scope)
Ważne jest, aby jasno zdefiniować, co nie będzie testowane, aby uniknąć nieporozumień.
*   Bezpośrednie testowanie infrastruktury Supabase i OpenRouter.ai (zakładamy, że działają poprawnie; testujemy jedynie integrację z nimi).
*   Testy użyteczności na szerokiej grupie użytkowników (fokus na testach technicznych i funkcjonalnych).
*   Kompleksowe testy kompatybilności na wszystkich istniejących przeglądarkach i systemach operacyjnych (testy ograniczone do najnowszych wersji Chrome, Firefox i Safari).

## 3. Typy Testów do Przeprowadzenia

### 3.1. Testy Jednostkowe (Unit Tests)
*   **Cel:** Weryfikacja małych, izolowanych fragmentów kodu (funkcje, hooki, komponenty).
*   **Zakres:**
    *   Funkcje pomocnicze i walidacyjne (`src/lib/validation`, `src/lib/utils.ts`).
    *   Logika biznesowa w warstwie usług (`src/lib/services/*.ts`) z zamockowanym klientem Supabase.
    *   Niestandardowe hooki React (`useDashboard.ts`, `useNoteEditor.ts`, `useEntitiesView.ts`) w celu przetestowania logiki zarządzania stanem.
    *   Proste komponenty UI (np. `Button.tsx`, `NoteItem.tsx`) pod kątem renderowania i podstawowych interakcji.
*   **Narzędzia:** Vitest, React Testing Library.

### 3.2. Testy Integracyjne (Integration Tests)
*   **Cel:** Weryfikacja współpracy między kilkoma modułami.
*   **Zakres:**
    *   **Integracja komponentów:** Testowanie, jak komponenty-kontenery (np. `DashboardPage.tsx`) integrują i zarządzają swoimi komponentami-dziećmi.
    *   **Integracja Frontend-Backend (API):** Testowanie pełnego przepływu danych od interakcji użytkownika w komponencie React, przez wywołanie API (`fetch`), aż po mockowaną odpowiedź z serwera. Sprawdzenie, czy komponent poprawnie obsługuje stany ładowania, błędu i sukcesu.
    *   **Integracja warstwy usługowej:** Testowanie `*.service.ts` w połączeniu z *testową bazą danych Supabase* w celu weryfikacji poprawności zapytań SQL i logiki biznesowej.
*   **Narzędzia:** Vitest, React Testing Library, Mock Service Worker (MSW) do mockowania API.

### 3.3. Testy End-to-End (E2E Tests)
*   **Cel:** Symulacja rzeczywistych scenariuszy użytkownika w działającej aplikacji w przeglądarce.
*   **Zakres:**
    *   Pełne scenariusze, np. "Użytkownik rejestruje się, loguje, tworzy nową notatkę, dodaje do niej byty, widzi je na grafie, a następnie się wylogowuje".
    *   Testowanie krytycznych ścieżek (happy paths) oraz obsługi błędów (np. próba zapisu formularza z niepoprawnymi danymi).
    *   Weryfikacja poprawności renderowania stron Astro i hydratacji komponentów React.
*   **Narzędzia:** Playwright lub Cypress.

### 3.4. Testy API
*   **Cel:** Bezpośrednie testowanie endpointów API w izolacji od interfejsu użytkownika.
*   **Zakres:**
    *   Weryfikacja kontraktu API: poprawność kodów statusu HTTP, formatu odpowiedzi (JSON), nagłówków.
    *   Testowanie walidacji danych wejściowych (np. wysłanie niepoprawnego UUID).
    *   Testowanie logiki autoryzacji (próba dostępu do danych innego użytkownika).
*   **Narzędzia:** Postman, lub testy integracyjne z użyciem `fetch` w środowisku Node.js (np. Vitest).

### 3.5. Testy Wydajnościowe
*   **Cel:** Ocena, jak aplikacja zachowuje się pod obciążeniem.
*   **Zakres:**
    *   Czas ładowania strony głównej (Dashboard) z dużą liczbą notatek.
    *   Wydajność renderowania i interakcji z grafem zawierającym >500 węzłów i krawędzi.
    *   Czas odpowiedzi API pod obciążeniem.
*   **Narzędzia:** Lighthouse, Playwright (do pomiaru metryk).
*   **Uwagi:** Testy obciążeniowe API z wykorzystaniem k6 są rozważane jako rozszerzenie na przyszłość.

## 4. Scenariusze Testowe dla Kluczowych Funkcjonalności

| Funkcjonalność | Scenariusz Testowy (wysokopoziomowy) | Typ Testu | Priorytet |
| :--- | :--- | :--- | :--- |
| **Rejestracja i Logowanie** | Użytkownik może założyć konto, otrzymać email weryfikacyjny (jeśli skonfigurowano), zalogować się i zostać przekierowany na stronę główną. Próba dostępu do strony głównej bez logowania przekierowuje na stronę logowania. | E2E, API | Krytyczny |
| **Zarządzanie Notatkami** | Użytkownik tworzy notatkę, dodaje treść i tytuł. Edytuje notatkę, zmieniając jej zawartość. Na koniec usuwa notatkę, co jest potwierdzane w UI. | E2E, Integracyjny | Krytyczny |
| **Zarządzanie Bytami** | Użytkownik otwiera stronę bytów, tworzy nowy byt przez modal. Edytuje nazwę bytu. Usuwa byt, co powoduje jego zniknięcie z listy. | E2E, Integracyjny | Krytyczny |
| **Powiązania i Graf** | Użytkownik w edytorze notatki dodaje kilka istniejących bytów. Po zapisaniu, przechodzi na Dashboard i widzi notatkę oraz powiązane byty jako węzły na grafie, połączone krawędziami. | E2E | Wysoki |
| **Tworzenie Relacji na Grafie** | Użytkownik na Dashboardzie wchodzi w "tryb łączenia", klika na dwa węzły bytów, wybiera typ relacji w modalu i tworzy nową krawędź na grafie. | E2E | Wysoki |
| **Sugestie AI** | Użytkownik z notatką zawierającą wystarczającą ilość tekstu klika "Analizuj". Po chwili pojawiają się sugestie. Użytkownik akceptuje sugestię "dodaj nowy byt", co skutkuje dodaniem bytu do notatki i zniknięciem sugestii. | E2E, Integracyjny | Wysoki |
| **Filtrowanie i Wyszukiwanie**| Użytkownik na Dashboardzie wpisuje frazę w pole wyszukiwania, a lista notatek jest poprawnie filtrowana. Dodatkowo filtruje po bycie, co zawęża wyniki. | E2E | Średni |
| **Ochrona Danych** | Test automatyczny (API) próbuje pobrać notatki/byty użytkownika B, będąc zalogowanym jako użytkownik A. Test powinien zakończyć się błędem autoryzacji (403/404) lub pustą listą wyników. | API, Integracyjny | Krytyczny |

## 5. Środowisko Testowe
W tej części należy określić, jaki sprzęt i oprogramowanie będą potrzebne do przeprowadzenia testów.
*   **Lokalne (Development):** Uruchamiane na maszynach deweloperów. Wykorzystuje lokalny serwer deweloperski Astro i może łączyć się z lokalną instancją Supabase (Docker) lub dedykowanym projektem deweloperskim w chmurze Supabase.
*   **CI (Ciągła Integracja):** Środowisko uruchamiane w ramach GitHub Actions. Testy jednostkowe i integracyjne działają w kontenerze. Testy E2E mogą być uruchamiane przeciwko efemerycznemu środowisku zbudowanemu na potrzeby testu.
*   **Staging:** Kopia środowiska produkcyjnego. Używa dedykowanego projektu Supabase "Staging". Na tym środowisku przeprowadzane są pełne testy E2E i testy akceptacyjne przed wdrożeniem na produkcję.
*   **Produkcja:** Środowisko produkcyjne. Testowanie ograniczone do podstawowych testów "smoke tests" po każdym wdrożeniu, w celu weryfikacji, czy aplikacja działa.

## 6. Narzędzia do Testowania

*   **Framework do testów jednostkowych/integracyjnych:** **Vitest** (kompatybilny z Vite, na którym bazuje Astro).
*   **Biblioteka do testowania komponentów:** **React Testing Library**.
*   **Framework do testów E2E:** **Playwright** (ze względu na szybkość i zaawansowane możliwości, takie jak nagrywanie testów, testowanie API i pomiary wydajności).
*   **Mockowanie API:** **Mock Service Worker (MSW)** do testów integracyjnych frontend-backend.
*   **Zarządzanie testami i raportowanie błędów:** **GitHub Issues** / **Jira**.

## 7. Harmonogram Testów
Należy precyzyjnie określić harmonogram testów, dzieląc go na fazy i typy wraz z ramami czasowymi.
Testowanie nie jest oddzielną fazą, lecz integralną częścią cyklu rozwoju (CI/CD).
*   **Przy każdym `push` do gałęzi deweloperskiej:** Automatyczne uruchomienie testów jednostkowych i kluczowych testów integracyjnych.
*   **Przy każdym Pull Request do `main`:** Uruchomienie pełnego zestawu testów jednostkowych, integracyjnych oraz kluczowych scenariuszy E2E.
*   **Po wdrożeniu na Staging:** Uruchomienie pełnego regresyjnego zestawu testów E2E oraz testy eksploracyjne.
*   **Przed wdrożeniem na Produkcję:** Testy akceptacyjne na środowisku Staging.
*   **Po wdrożeniu na Produkcję:** Uruchomienie "smoke tests".

## 8. Kryteria Akceptacji Testów

### 8.1. Kryteria Wejścia (rozpoczęcia testów)
*   Kod został pomyślnie zbudowany i wdrożony na odpowiednim środowisku testowym.
*   Wszystkie testy jednostkowe dodane przez deweloperów przechodzą pomyślnie.

### 8.2. Kryteria Wyjścia (zakończenia testów)
*   Pokrycie kodu testami jednostkowymi wynosi co najmniej 80% dla nowej/zmienionej logiki biznesowej.
*   Co najmniej 95% wszystkich scenariuszy testowych (integracyjnych i E2E) kończy się sukcesem.
*   Brak otwartych błędów o priorytecie krytycznym lub wysokim.
*   Wszystkie zidentyfikowane problemy z wydajnością i bezpieczeństwem zostały rozwiązane.

## 9. Role i Odpowiedzialności

*   **Deweloperzy:**
    *   Pisanie testów jednostkowych i integracyjnych dla tworzonych przez siebie funkcjonalności.
    *   Naprawa błędów zgłoszonych przez zespół QA.
    *   Utrzymanie i konfiguracja środowiska testowego w CI.
*   **Inżynier QA (Tester):**
    *   Projektowanie, tworzenie i utrzymanie scenariuszy testowych E2E.
    *   Wykonywanie testów manualnych i eksploracyjnych.
    *   Analiza wyników testów automatycznych, raportowanie błędów.
    *   Przeprowadzanie testów wydajnościowych i bezpieczeństwa.
    *   Zarządzanie procesem zgłaszania błędów.
*   **Product Owner / Manager:**
    *   Dostarczanie kryteriów akceptacyjnych dla nowych funkcjonalności.
    *   Priorytetyzacja naprawy błędów.
    *   Finalna akceptacja funkcjonalności na środowisku Staging.

## 10. Procedury Raportowania Błędów

1.  **Identyfikacja Błędu:** Błąd może zostać zidentyfikowany przez test automatyczny lub manualny.
2.  **Rejestracja Błędu:** Każdy zidentyfikowany błąd musi zostać zgłoszony w systemie do śledzenia (np. GitHub Issues). Zgłoszenie powinno zawierać:
    *   **Tytuł:** Krótki, zwięzły opis problemu.
    *   **Opis:** Szczegółowe kroki do reprodukcji błędu.
    *   **Wynik oczekiwany vs. Wynik rzeczywisty.**
    *   **Środowisko:** (np. Lokalnie, Staging, Produkcja; przeglądarka, system operacyjny).
    *   **Dowody:** Zrzuty ekranu, nagrania wideo, logi z konsoli.
    *   **Priorytet/Waga:** (np. Krytyczny, Wysoki, Średni, Niski).
3.  **Triage Błędu:** Product Owner i zespół deweloperski regularnie przeglądają nowe błędy, weryfikują je i przypisują do odpowiednich osób i sprintów.
4.  **Naprawa i Weryfikacja:** Deweloper naprawia błąd i wdraża poprawkę na środowisko Staging. Inżynier QA weryfikuje, czy błąd został poprawnie rozwiązany i zamyka zgłoszenie.