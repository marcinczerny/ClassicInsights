# Plan implementacji widoku pulpitu nawigacyjnego (Dashboard)

## 1. Przegląd
Widok pulpitu nawigacyjnego jest głównym interfejsem użytkownika po zalogowaniu. Służy jako centrum do zarządzania notatkami i eksploracji wiedzy. Składa się z dwóch głównych, zintegrowanych części: panelu z listą notatek oraz interaktywnego panelu z grafem myśli. Użytkownik może przeglądać, wyszukiwać swoje notatki oraz wizualizować i zarządzać powiązaniami między notatkami a bytami (tagami) w grafie.

## 2. Routing widoku
Widok będzie dostępny pod główną ścieżką aplikacji po zalogowaniu:
- **Ścieżka**: `/`

## 3. Struktura komponentów
Komponenty zostaną zaimplementowane w React i ostylowane przy użyciu Tailwind CSS, z wykorzystaniem gotowych komponentów z biblioteki `shadcn/ui`.

```
/src/pages/index.astro
└── <DashboardPage client:load>
    ├── <NotesPanel>
    │   ├── <SearchBar />
    │   ├── <Button> (Nowa notatka) </Button>
    │   └── <NotesList>
    │       ├── <NoteItem />
    │       ├── ...
    │       └── <PaginationControls />
    └── <GraphPanel>
        ├── <GraphToolbar />
        └── <GraphView />
```

## 4. Szczegóły komponentów

### `DashboardPage`
- **Opis komponentu**: Główny komponent kontenera dla widoku pulpitu. Zarządza ogólnym stanem, układem i komunikacją między `NotesPanel` a `GraphPanel`.
- **Główne elementy**: `div` (kontener CSS Grid lub Flexbox), `NotesPanel`, `GraphPanel`.
- **Obsługiwane interakcje**: Brak bezpośrednich interakcji. Deleguje obsługę zdarzeń do komponentów podrzędnych.
- **Obsługiwana walidacja**: Brak.
- **Typy**: `DashboardState`, `NoteDTO`, `GraphDTO`.
- **Propsy**: Brak.

### `NotesPanel`
- **Opis komponentu**: Panel boczny zawierający wszystkie elementy związane z listą notatek.
- **Główne elementy**: `SearchBar`, `Button` (`shadcn/ui`) do tworzenia nowej notatki, `NotesList`.
- **Obsługiwane interakcje**: Przekazuje zdarzenia z `SearchBar` i `NotesList` do `DashboardPage`.
- **Obsługiwana walidacja**: Brak.
- **Typy**: `NoteDTO[]`, `PaginationDTO`.
- **Propsy**: `notes`, `pagination`, `isLoading`, `error`, `onSearchChange`, `onPageChange`.

### `SearchBar`
- **Opis komponentu**: Pole do wyszukiwania notatek na podstawie przypisanych bytów (tagów). Wykorzystuje debouncing do optymalizacji zapytań API podczas wpisywania tekstu i oferuje autouzupełnianie na podstawie istniejących bytów.
- **Główne elementy**: `Input` (`shadcn/ui`), `Dropdown` (`shadcn/ui`) na sugestie.
- **Obsługiwane interakcje**: Wpisywanie tekstu, wybór sugestii, zatwierdzenie wyszukiwania.
- **Obsługiwana walidacja**: Brak.
- **Typy**: `EntityBasicDTO[]` (dla sugestii).
- **Propsy**: `searchTerm`, `onSearchChange`.

### `NotesList`
- **Opis komponentu**: Wyświetla listę notatek lub stan pusty, jeśli użytkownik nie ma notatek lub wyniki wyszukiwania są puste. Zawiera również kontrolki paginacji.
- **Główne elementy**: Lista `<ul>` lub `<div>` z komponentami `NoteItem`, `PaginationControls`, komunikat o stanie pustym.
- **Obsługiwane interakcje**: Kliknięcie notatki (nawigacja), zmiana strony.
- **Obsługiwana walidacja**: Brak.
- **Typy**: `NoteDTO[]`, `PaginationDTO`.
- **Propsy**: `notes`, `pagination`, `onPageChange`.

### `NoteItem`
- **Opis komponentu**: Pojedynczy element na liście notatek. Wyświetla tytuł, datę modyfikacji i jest klikalny, aby przejść do widoku szczegółowego.
- **Główne elementy**: `Card` (`shadcn/ui`), `<a>` lub `Link` (z `astro:jsx`), `h3` (tytuł), `p` (data).
- **Obsługiwane interakcje**: `onClick`.
- **Obsługiwana walidacja**: Brak.
- **Typy**: `NoteDTO`.
- **Propsy**: `note: NoteDTO`.

### `GraphPanel`
- **Opis komponentu**: Kontener dla wizualizacji grafu myśli. Zarządza stanem widoczności (zwinięty, otwarty, pełny ekran) i zawiera narzędzia do interakcji z grafem.
- **Główne elementy**: `div` (kontener), `GraphToolbar`, `GraphView`.
- **Obsługiwane interakcje**: Zwijanie/rozwijanie panelu, przełączanie na tryb pełnoekranowy.
- **Obsługiwana walidacja**: Brak.
- **Typy**: `GraphDTO`.
- **Propsy**: `graphData`, `isLoading`, `error`, `onNodeSelect`, `onCreateRelationship`.

### `GraphView`
- **Opis komponentu**: Interaktywny komponent renderujący graf (węzły i krawędzie) przy użyciu biblioteki (np. `react-flow`). Obsługuje przesuwanie, powiększanie, zaznaczanie węzłów i tworzenie połączeń.
- **Główne elementy**: Komponent z biblioteki `react-flow` lub podobnej.
- **Obsługiwane interakcje**: Kliknięcie węzła, przeciąganie widoku, zoom, tworzenie połączenia między węzłami.
- **Obsługiwana walidacja**: Sprawdzenie, czy połączenie nie jest tworzone do tego samego węzła.
- **Typy**: `GraphNodeViewModel[]`, `GraphEdgeViewModel[]`.
- **Propsy**: `nodes`, `edges`, `onNodeClick`, `onConnect`.

## 5. Typy
Do implementacji widoku wykorzystane zostaną istniejące typy DTO z `src/types.ts`. Dodatkowo, zdefiniujemy nowe typy ViewModel po stronie frontendu, aby zarządzać stanem UI.

```typescript
// src/components/dashboard/types.ts

import type { 
  NoteDTO, 
  PaginationDTO, 
  GraphDTO, 
  GraphNodeDTO, 
  GraphEdgeDTO 
} from "@/types";

// Główny typ stanu dla całego widoku pulpitu
export interface DashboardState {
  notes: NoteDTO[];
  pagination: PaginationDTO | null;
  isLoadingNotes: boolean;
  notesError: Error | null;

  graphData: GraphDTO | null;
  isLoadingGraph: boolean;
  graphError: Error | null;
  
  // Węzeł, na którym aktualnie wyśrodkowany jest graf
  graphCenterNode: { id: string; type: 'note' | 'entity' } | null;
  
  // Aktualnie wyszukiwana fraza
  searchTerm: string;
  
  // Stan widoczności panelu grafu
  graphPanelState: 'collapsed' | 'open' | 'fullscreen';
}

// Typy ViewModel dla biblioteki grafów, rozszerzające DTO o stan UI
export interface GraphNodeViewModel extends GraphNodeDTO {
  isSelected?: boolean;
  position?: { x: number; y: number }; // Wymagane przez niektóre biblioteki
}

export interface GraphEdgeViewModel extends GraphEdgeDTO {
  isSelected?: boolean;
}
```

## 6. Zarządzanie stanem
Logika zarządzania stanem, pobierania danych i obsługi efektów ubocznych zostanie zamknięta w customowym hooku `useDashboard`. Takie podejście zapewni czystość komponentu `DashboardPage` i reużywalność logiki.

**`useDashboard` hook:**
- **Cel**: Zarządzanie złożonym stanem `DashboardState` i interakcjami.
- **Zarządzany stan**: `notes`, `pagination`, `graphData`, `searchTerm`, `graphCenterNode`, `isLoadingNotes`, `isLoadingGraph`, stany błędów.
- **Udostępniane funkcje**:
  - `fetchNotes(page, search)`: Pobiera notatki.
  - `fetchGraph(centerNode)`: Pobiera dane grafu.
  - `handleSearchChange(term)`: Aktualizuje stan wyszukiwania.
  - `handlePageChange(page)`: Aktualizuje stronę.
  - `handleNodeSelect(node)`: Zmienia centrum grafu.
  - `handleCreateRelationship(command)`: Tworzy nową relację.
  - `setGraphPanelState(state)`: Zarządza układem panelu grafu.

## 7. Integracja API
Komponenty będą komunikować się z czterema głównymi endpointami API:

1.  **`GET /api/notes`**
    - **Cel**: Pobieranie listy notatek.
    - **Parametry**: `page` (numer strony), `limit` (liczba wyników), `search` (opcjonalny, do filtrowania po bytach).
    - **Typ odpowiedzi**: `NotesListResponseDTO`.

2.  **`GET /api/graph`**
    - **Cel**: Pobieranie danych do wizualizacji grafu.
    - **Parametry**: `center_id` (ID węzła centralnego), `center_type` ('note' lub 'entity'), `levels` (głębokość, domyślnie 2).
    - **Typ odpowiedzi**: `GraphDTO`.

3.  **`GET /api/entities`**
    - **Cel**: Pobieranie sugestii bytów dla `SearchBar`.
    - **Parametry**: `search` (fragment nazwy bytu).
    - **Typ odpowiedzi**: `EntitiesListResponseDTO`.

4.  **`POST /api/relationships`**
    - **Cel**: Tworzenie nowej relacji między dwoma bytami.
    - **Typ żądania**: `CreateRelationshipCommand`.
    - **Typ odpowiedzi**: `RelationshipDTO`.

## 8. Interakcje użytkownika
- **Wyszukiwanie notatek**: Użytkownik wpisuje frazę w `SearchBar`. Po krótkiej chwili (debouncing) wyświetlane są sugestie. Zatwierdzenie wyszukiwania filtruje listę notatek.
- **Nawigacja po notatkach**: Kliknięcie `NoteItem` przenosi do widoku `/notes/:id`. Kliknięcie przycisku "Nowa notatka" przenosi do `/notes/new`.
- **Paginacja**: Kliknięcie przycisku paginacji ładuje kolejną stronę notatek.
- **Eksploracja grafu**: Kliknięcie węzła w `GraphView` powoduje przeładowanie grafu z wybranym węzłem jako centrum.
- **Zmiana układu**: Użytkownik może zwinąć, rozwinąć lub otworzyć `GraphPanel` w trybie pełnoekranowym.
- **Tworzenie relacji**: Użytkownik aktywuje "tryb łączenia", klika dwa węzły bytów, a następnie w modalu wybiera typ relacji i zatwierdza jej utworzenie.

## 9. Warunki i walidacja
- **`SearchBar`**: Wyszukiwanie jest aktywowane po wpisaniu co najmniej 2-3 znaków, aby uniknąć zbędnych zapytań.
- **`GraphView`**: Logika komponentu musi uniemożliwić utworzenie relacji z bytu do samego siebie. Należy również zapewnić, że oba wybrane do połączenia węzły są typu `entity`.
- **`PaginationControls`**: Przyciski "poprzednia/następna" są wyłączone, gdy użytkownik jest na pierwszej/ostatniej stronie.

## 10. Obsługa błędów
- **Błąd ładowania notatek**: Jeśli `GET /api/notes` zwróci błąd, w miejscu `NotesList` zostanie wyświetlony komunikat o błędzie z przyciskiem "Spróbuj ponownie".
- **Błąd ładowania grafu**: Podobnie, `GraphPanel` wyświetli komunikat błędu, jeśli `GET /api/graph` się nie powiedzie.
- **Błąd tworzenia relacji**: Po nieudanej próbie utworzenia relacji (`POST /api/relationships`) zostanie wyświetlone powiadomienie typu "toast" z komunikatem błędu zwróconym przez API. Modal do tworzenia relacji pozostanie otwarty.
- **Stan pusty**: Jeśli API zwróci pustą listę notatek (dla nowego użytkownika lub po wyszukiwaniu bez wyników), `NotesList` wyświetli odpowiedni komunikat informacyjny.

## 11. Kroki implementacji
1.  **Struktura plików**: Utworzenie struktury folderów i plików dla komponentów pulpitu (np. `src/components/dashboard/`).
2.  **Hook `useDashboard`**: Implementacja hooka z podstawową logiką stanu (bez pobierania danych).
3.  **Layout `DashboardPage`**: Stworzenie głównego komponentu i statycznego układu dla `NotesPanel` i `GraphPanel` przy użyciu CSS Grid/Flexbox.
4.  **Implementacja `NotesPanel`**:
    - Stworzenie komponentów `SearchBar`, `NotesList`, `NoteItem` i `PaginationControls`.
    - Integracja `useDashboard` w `DashboardPage` w celu pobrania i wyświetlenia notatek z `GET /api/notes`.
    - Zaimplementowanie logiki wyszukiwania (z debouncingiem) i paginacji.
5.  **Implementacja `GraphPanel`**:
    - Wybór i instalacja biblioteki do wizualizacji grafów (rekomendacja: `react-flow`).
    - Stworzenie komponentu `GraphView` i integracja biblioteki.
    - Pobranie danych grafu z `GET /api/graph` (początkowo wyśrodkowanego na ostatniej notatce) i wyrenderowanie węzłów/krawędzi.
6.  **Implementacja interaktywności grafu**:
    - Dodanie obsługi kliknięcia węzła w celu przeładowania grafu.
    - Zaimplementowanie logiki "trybu łączenia" do tworzenia relacji, włączając w to modal do wyboru typu relacji i wywołanie `POST /api/relationships`.
7.  **Dopracowanie UX**:
    - Implementacja stanów ładowania (np. skeleton loaders) i obsługi błędów dla obu paneli.
    - Implementacja logiki zwijania/rozwijania `GraphPanel`.
    - Ostylowanie wszystkich komponentów zgodnie z systemem projektowym (Tailwind, `shadcn/ui`).
8.  **Testowanie i refaktoryzacja**: Przetestowanie wszystkich interakcji użytkownika i scenariuszy błędów. Refaktoryzacja hooka `useDashboard` i komponentów w razie potrzeby.

