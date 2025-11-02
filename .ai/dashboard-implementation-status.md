# Status implementacji widoku Dashboard (Pulpit Nawigacyjny)

## Zrealizowane kroki

### ✅ Krok 1: Struktura plików
- Utworzono strukturę katalogów:
  - `src/components/dashboard/` - główny folder
  - `src/components/dashboard/hooks/` - custom hooks
  - `src/components/dashboard/notes/` - komponenty panelu notatek
  - `src/components/dashboard/graph/` - komponenty panelu grafu
  - `src/components/dashboard/types.ts` - typy ViewModel

### ✅ Krok 2: Hook useDashboard
Lokalizacja: `src/components/dashboard/hooks/useDashboard.ts`
- Zarządzanie stanem `DashboardState`
- `fetchNotes()` - pobieranie notatek z paginacją
- `fetchGraph()` - pobieranie danych grafu (wymaga centrum)
- `handleSearchChange()` - wyszukiwanie z debouncingiem (300ms)
- `handlePageChange()` - zmiana strony paginacji
- `handleNoteSelect()` - wybór notatki jako centrum grafu
- `handleNodeSelect()` - wybór węzła w grafie jako nowe centrum
- `handleCreateRelationship()` - tworzenie relacji między bytami
- `setGraphPanelState()` - zarządzanie widocznością panelu grafu
- Automatyczne ładowanie grafu dla pierwszej notatki z listy
- Brak requestu do API gdy nie ma notatek

### ✅ Krok 3: Layout DashboardPage
Lokalizacja: `src/components/dashboard/DashboardPage.tsx`
- Główny kontener z layoutem CSS Flexbox (`h-screen`)
- Panel notatek po lewej (stała szerokość 384px)
- Panel grafu po prawej (elastyczna szerokość `flex-1`)
- Integracja z hookiem `useDashboard`
- Przekazywanie stanu i handlerów do komponentów podrzędnych

### ✅ Krok 4: Implementacja NotesPanel
Zainstalowane komponenty shadcn/ui: Input, Card, Skeleton, Popover

#### NotesPanel (`src/components/dashboard/notes/NotesPanel.tsx`)
- Header z tytułem
- SearchBar z autouzupełnianiem
- Przycisk "Nowa notatka"
- Lista notatek z paginacją
- Obsługa błędów z przyciskiem "Spróbuj ponownie"

#### SearchBar (`src/components/dashboard/notes/SearchBar.tsx`) - ✅ PRZEPISANY
- **Pole wyszukiwania po tytule**: Input z debouncingiem (300ms)
- **Multi-select encji (tagów)**:
  - Popover z listą wszystkich encji użytkownika
  - Wyszukiwanie wewnątrz popovera
  - Badge'y z wybranymi encjami (z przyciskiem X do usunięcia)
- Przycisk "Wyczyść wszystkie filtry"
- Oba filtry działają jednocześnie (AND) - tytuł + wybrane tagi

#### NoteItem (`src/components/dashboard/notes/NoteItem.tsx`)
- Klikalny przycisk (zamiast linku)
- Wyświetla tytuł i datę aktualizacji
- Pokazuje do 3 tagów (bytów) + licznik pozostałych
- Wizualne oznaczenie wybranej notatki (border-primary)
- Wybór notatki centruje graf na niej

#### NotesList (`src/components/dashboard/notes/NotesList.tsx`)
- Lista notatek z skeleton loaderem
- Stan pusty z CTA "Utwórz notatkę"
- Paginacja (gdy więcej niż 1 strona)

#### PaginationControls (`src/components/dashboard/notes/PaginationControls.tsx`)
- Przyciski "Poprzednia" / "Następna"
- Wyłączanie przycisków na pierwszej/ostatniej stronie
- Informacja o aktualnej stronie

### ✅ Krok 5: Implementacja GraphPanel - wizualizacja
Zainstalowane: `@xyflow/react`, Dialog, Select

#### GraphPanel (`src/components/dashboard/graph/GraphPanel.tsx`)
- Stany widoczności: collapsed / open / fullscreen
- Header z kontrolkami widoczności
- GraphToolbar z trybem łączenia
- GraphView z wizualizacją
- Obsługa błędów z przyciskiem "Spróbuj ponownie"
- RelationshipModal do tworzenia relacji
- EditRelationshipModal do edycji relacji

#### GraphView (`src/components/dashboard/graph/GraphView.tsx`)
- Integracja z @xyflow/react
- Background, Controls, MiniMap
- Obsługa kliknięć węzłów
- Obsługa kliknięć krawędzi (edycja relacji)
- fitView z padding 0.2
- Pusty stan gdy brak notatek: "Dodaj pierwszą notatkę"
- Pusty stan gdy są notatki: "Wybierz notatkę z listy"
- Synchronizacja nodes/edges przy zmianie graphData (useEffect)

#### CustomNodes (`src/components/dashboard/graph/CustomNodes.tsx`)
- EntityNode - kolorowe węzły dla bytów (osoba, miejsce, pojęcie, etc.)
- NoteNode - żółte węzły dla notatek
- Handles (Target/Source) dla połączeń
- Wyświetlanie typu, nazwy i opisu

#### graphHelpers (`src/components/dashboard/graph/graphHelpers.ts`)
- `transformGraphData()` - konwersja GraphDTO → format @xyflow/react
- `calculatePosition()` - rozmieszczenie węzłów w okręgu
- `formatRelationshipType()` - polskie nazwy typów relacji
- Wizualne oznaczenie wybranego węzła źródłowego (`ring-4 ring-primary`)

#### GraphToolbar (`src/components/dashboard/graph/GraphToolbar.tsx`)
- Przycisk "Tryb łączenia" / "Anuluj łączenie"
- Instrukcja dla użytkownika

### ✅ Krok 6: Implementacja interaktywności grafu

#### Tryb łączenia węzłów
- Aktywacja przycisku "Tryb łączenia"
- Pierwszy klik: wybór węzła źródłowego (wizualne podświetlenie)
- Drugi klik: otwarcie modala wyboru typu relacji
- Walidacja połączeń:
  - ✅ **entity → entity** (tworzy relationship)
  - ✅ **note → entity** (tworzy note-entity association)
  - ❌ note → note (blokowane)
  - ❌ entity → note (blokowane z komunikatem)
- Kliknięcie tego samego węzła: odznaczenie
- Po utworzeniu połączenia: automatyczny refresh grafu

#### RelationshipModal (`src/components/dashboard/graph/RelationshipModal.tsx`)
- Wybór typu relacji z dropdown (6 typów)
- Wyświetlanie nazw połączonych węzłów
- Przyciski: Anuluj / Utwórz relację
- Integracja z API: `POST /api/relationships` lub `POST /api/notes/:id/entities`

#### Edycja relacji entity-entity
- Kliknięcie krawędzi entity-entity otwiera EditRelationshipModal
- Możliwość zmiany typu: `PATCH /api/relationships/:id`
- Możliwość usunięcia: `DELETE /api/relationships/:id` (z potwierdzeniem)
- Automatyczny refresh grafu po zmianach

#### Edycja połączeń note-entity (nowa funkcjonalność)
- Kliknięcie krawędzi note-entity otwiera EditNoteEntityModal
- Modal pokazuje nazwę notatki, encji i aktualny typ relacji
- Możliwość zmiany typu: `DELETE` + `POST /api/notes/:id/entities`
- Możliwość usunięcia: `DELETE /api/notes/:id/entities/:entityId` (z potwierdzeniem)
- Automatyczny refresh grafu po zmianach

#### Kliknięcie węzła w grafie
- Poza trybem łączenia: zmiana centrum grafu (`onNodeSelect`)
- W trybie łączenia: wybór węzła do połączenia (note lub entity)

### ✅ Krok 7: Dopracowanie UX
- ✅ Skeleton loaders dla notatek
- ✅ Obsługa błędów z przyciskiem "Spróbuj ponownie"
- ✅ Logika zwijania/rozwijania GraphPanel
- ✅ Ostylowanie komponentów (Tailwind + shadcn/ui)
- ✅ Stany puste z odpowiednimi komunikatami
- ✅ Wizualne oznaczenie wybranej notatki
- ✅ Wizualne oznaczenie wybranego węzła w trybie łączenia
- ✅ Kierunki krawędzi (strzałki) - wskazują zawsze na target
- ✅ Graf nie resetuje się przy wyszukiwaniu/filtrowaniu
- ❌ Brak toast notifications dla błędów (TODO komentarze w kodzie)

### 🔧 Naprawione problemy
1. **Graf nie renderował się** - dodano `h-full` do GraphPanel kontenera
2. **Request bez centrum** - fetchGraph nie wysyła requestu gdy brak centrum
3. **Pierwsza notatka jako centrum** - automatyczny wybór przy ładowaniu
4. **Kliknięcie notatki** - zmieniono z nawigacji na wybór centrum grafu
5. **Tryb łączenia** - kliknięcie węzłów tworzy relacje zamiast zmieniać centrum
6. **Nodes/edges nie aktualizowały się** - dodano useEffect synchronizujący stan
7. **Kliknięcie węzła nie działało** - naprawiono GraphView.tsx:63-65, używając `node.id` i `node.type` zamiast `node.data.id` i `node.data.type` (wartości są na głównym poziomiu obiektu w @xyflow/react, nie w data)
8. **Błąd 400 przy edycji krawędzi note-entity** - dodano walidację w GraphPanel.tsx:159-163, która zapobiega otwieraniu modala edycji dla asocjacji note-entity (można edytować tylko relacje entity-entity)
9. **Graf resetował się przy wyszukiwaniu** - useDashboard.ts:29,222-226 używa `useRef` do śledzenia początkowego ładowania grafu, graf ładuje się tylko raz i nie resetuje się przy zmianie filtrów
10. **Krawędzie note-entity nie były edytowalne** - dodano EditNoteEntityModal dla edycji i usuwania połączeń note-entity

## Integracja API

### Wykorzystywane endpointy
- ✅ `GET /api/notes` - lista notatek z paginacją, wyszukiwaniem i filtrowaniem
- ✅ `GET /api/entities` - lista wszystkich encji użytkownika (limit: 100)
- ✅ `GET /api/graph` - dane grafu (wymaga center_id i center_type)
- ✅ `POST /api/relationships` - tworzenie relacji między bytami
- ✅ `PATCH /api/relationships/:id` - aktualizacja typu relacji
- ✅ `DELETE /api/relationships/:id` - usuwanie relacji
- ✅ `POST /api/notes/:id/entities` - dodawanie encji do notatki
- ✅ `DELETE /api/notes/:id/entities/:entityId` - usuwanie encji z notatki

### Parametry requestów
- Notes: `page`, `limit`, `search` (tytuł notatki), `entities` (CSV lista UUID)
- Entities: `limit` (dla pobrania wszystkich encji użytkownika)
- Graph: `center_id`, `center_type`, `levels` (domyślnie 2)
- Note entities: `entity_id`, `relationship_type` (opcjonalny)

## ✅ Krok 8: Ulepszenia po implementacji

### Zmiany w wyszukiwaniu i filtrowaniu
- ✅ **Backend**: `notes.service.ts:49-52` - wyszukiwanie tylko po tytule (`.ilike('title', ...)`)
- ✅ **Backend**: `notes.service.ts:54-68` - filtrowanie po encjach przez RPC `get_notes_with_all_entities`
- ✅ **API**: `useDashboard.ts:35-44` - parametry `search` i `entities` (CSV)
- ✅ **Frontend**: `SearchBar.tsx` - przepisany (235 linii):
  - Input dla wyszukiwania po tytule
  - Multi-select dla wyboru encji (tagów)
  - Badge'y z wybranymi tagami
  - Przycisk "Wyczyść wszystkie filtry"
- ✅ **State**: `DashboardState` - dodano `selectedEntityIds: string[]`
- ✅ **Hooks**: `useDashboard.ts` - `handleEntitySelectionChange()`, debounced effect dla obu filtrów
- ✅ **Dokumentacja**: Zaktualizowano `api-plan.md` i `notes-get-implementation-plan.md`

### Edycja połączeń note-entity
- ✅ **Modal**: `EditNoteEntityModal.tsx` (167 linii) - edycja i usuwanie note-entity
- ✅ **Logika**: `GraphPanel.tsx:169-203` - rozpoznawanie typu krawędzi (entity-entity vs note-entity)
- ✅ **Handlers**: `GraphPanel.tsx:269-343` - `handleNoteEntityUpdate()`, `handleNoteEntityDelete()`
- ✅ **API**: DELETE + POST dla zmiany typu relacji note-entity

### Graf - stabilność i kierunki
- ✅ **Kierunki**: `graphHelpers.ts:47-51` - dodano `markerEnd` z strzałkami
- ✅ **Stabilność**: `useDashboard.ts:29,222-226` - `useRef` zapobiega resetowaniu grafu
- ✅ **Tryb łączenia**: note → entity oraz entity → entity

## Kolejne kroki

### Testowanie (do wykonania ręcznie)
- [ ] Przetestować wyszukiwanie po tytule
- [ ] Przetestować filtrowanie po tagach (pojedynczy i wielokrotny wybór)
- [ ] Przetestować łączenie filtrów (tytuł + tagi)
- [ ] Przetestować tworzenie połączeń note → entity w trybie łączenia
- [ ] Przetestować edycję połączeń note-entity przez kliknięcie krawędzi
- [ ] Przetestować że graf nie resetuje się przy zmianie filtrów
- [ ] Przetestować paginację z aktywnymi filtrami

### Usprawnienia UX (opcjonalne)
- [ ] Implementacja toast notifications (biblioteka Sonner z shadcn/ui)
  - Lokalizacje TODO w kodzie:
    - `GraphPanel.tsx:97,103` - błędy walidacji w trybie łączenia
    - `GraphPanel.tsx:145` - błąd tworzenia połączenia
    - `GraphPanel.tsx:309` - błąd aktualizacji note-entity
    - `GraphPanel.tsx:334` - błąd usuwania note-entity
- [ ] Loading indicators podczas operacji API (tworzenie/usuwanie połączeń)
- [ ] Animacje przejść między stanami
- [ ] Improved error messages (bardziej szczegółowe)
- [ ] Sortowanie encji w multi-select (alfabetycznie lub po częstości użycia)

### Dodatkowe funkcjonalności (poza planem)
- [ ] Eksport grafu do obrazu (PNG/SVG)
- [ ] Różne algorytmy layoutu grafu (force-directed, hierarchical)
- [ ] Filtrowanie grafu po typie relacji
- [ ] Zoom do wybranego węzła
- [ ] Historia nawigacji po grafie (back/forward)
- [ ] Skróty klawiszowe (np. Escape anuluje tryb łączenia)

## Struktura plików

```
src/components/dashboard/
├── DashboardPage.tsx              # Główny kontener (73 linie)
├── types.ts                       # TypeScript types (DashboardState, ViewModels) (55 linii)
├── hooks/
│   └── useDashboard.ts           # Custom hook z logiką stanu (278 linii)
├── notes/
│   ├── NotesPanel.tsx            # Panel notatek (84 linie)
│   ├── SearchBar.tsx             # Wyszukiwanie po tytule + multi-select encji (235 linii)
│   ├── NotesList.tsx             # Lista notatek (97 linii)
│   ├── NoteItem.tsx              # Pojedyncza notatka (56 linii)
│   └── PaginationControls.tsx   # Kontrolki paginacji (43 linie)
└── graph/
    ├── GraphPanel.tsx            # Panel grafu z logiką (470 linii)
    ├── GraphView.tsx             # Wizualizacja @xyflow/react (143 linie)
    ├── GraphToolbar.tsx          # Toolbar z kontrolkami (26 linii)
    ├── CustomNodes.tsx           # Custom węzły (Entity/Note) (82 linie)
    ├── graphHelpers.ts           # Helper functions (90 linii)
    ├── RelationshipModal.tsx     # Modal tworzenia relacji (130 linii)
    ├── EditRelationshipModal.tsx # Modal edycji relacji entity-entity (133 linie)
    └── EditNoteEntityModal.tsx   # Modal edycji połączeń note-entity (167 linii)
```

## Metryki

- **Komponenty utworzone**: 16 (+1 EditNoteEntityModal)
- **Linie kodu**: ~1,750+ (+350)
- **Zainstalowane biblioteki**: @xyflow/react, shadcn/ui components (Input, Card, Skeleton, Popover, Dialog, Select, Button, Badge)
- **Endpointy API**: 8 (GET notes, GET entities, GET graph, POST/PATCH/DELETE relationships, POST/DELETE note_entities)
- **Czas implementacji**: 2 sesje
- **Status buildu**: ✅ Sukces (bez błędów/ostrzeżeń TypeScript)

## Uwagi techniczne

### Wydajność
- Debouncing wyszukiwania (300ms) redukuje liczbę requestów API
- Memoizacja transformacji danych grafu
- Skeleton loaders dla lepszego UX podczas ładowania
- fitView w React Flow automatycznie dopasowuje widok

### Bezpieczeństwo
- Walidacja typów węzłów przed tworzeniem relacji (tylko entity-entity)
- Potwierdzenie przed usunięciem relacji
- Obsługa błędów API z user-friendly komunikatami

### Dostępność
- Semantyczne elementy HTML
- ARIA labels gdzie potrzebne
- Keyboard navigation w modalach
- Focus management

### Responsywność
- Stała szerokość panelu notatek (384px)
- Elastyczna szerokość panelu grafu
- Fullscreen mode dla grafu
- Overflow handling
