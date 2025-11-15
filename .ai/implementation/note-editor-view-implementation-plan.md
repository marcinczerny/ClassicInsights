# Plan implementacji widoku: Edytor Notatek

## 1. Przegląd

Widok Edytora Notatek to kluczowy interfejs w aplikacji ClassicInsight, umożliwiający użytkownikom tworzenie, przeglądanie, edytowanie i usuwanie notatek. Integruje on edytor tekstu w formacie Markdown z zaawansowanym systemem tagowania (bytów) oraz funkcjami wzbogacania treści przy użyciu AI. Celem widoku jest zapewnienie płynnego środowiska do pracy z wiedzą, od zapisania myśli po jej analizę i odkrywanie nowych powiązań.

## 2. Routing widoku

Widok będzie dostępny pod dynamiczną ścieżką, która obsługuje zarówno tworzenie nowej notatki, jak i edycję istniejącej:

- Tworzenie nowej notatki: `/notes/new`
- Edycja istniejącej notatki: `/notes/:id` (gdzie `:id` to unikalny identyfikator notatki w formacie UUID)

## 3. Struktura komponentów

Komponenty zostaną zaimplementowane w React z użyciem biblioteki Shadcn/ui, zgodnie ze stosem technologicznym projektu.

```
NotePage.astro
└── NoteEditorView (React Client Component)
    ├── NoteForm
    │   ├── Input (Shadcn, for Title)
    │   ├── Textarea (Shadcn, for Content - Markdown)
    │   └── EntityTagInput
    │       ├── Popover (Shadcn, for autocomplete)
    │       ├── Badge (Shadcn, for selected entities)
    │       ├── Select (Shadcn, for relationship type)
    │       └── Button (to trigger CreateEntityModal)
    ├── AISuggestionsPanel
    │   ├── Button (Shadcn, "Analizuj")
    │   └── AISuggestionCard[]
    │       ├── Card (Shadcn)
    │       └── Button (Shadcn, "Akceptuj"/"Odrzuć")
    ├── Button (Shadcn, "Zapisz")
    ├── Button (Shadcn, "Usuń")
    ├── ConfirmationModal (dla operacji usunięcia)
    │   └── Dialog (Shadcn)
    └── CreateEntityModal (dla tworzenia nowych bytów)
        └── Dialog (Shadcn)
```

## 4. Szczegóły komponentów

### `NoteEditorView` (Komponent kontenerowy)

- **Opis**: Główny komponent widoku, odpowiedzialny za zarządzanie stanem, pobieranie danych (notatki, sugestie) oraz koordynację akcji użytkownika. Renderuje formularz notatki, panel sugestii AI oraz przyciski akcji.
- **Główne elementy**: `NoteForm`, `AISuggestionsPanel`, `Button` ("Zapisz", "Usuń"), `ConfirmationModal`, `CreateEntityModal`.
- **Obsługiwane interakcje**: Zapis notatki, usunięcie notatki, uruchomienie analizy AI.
- **Typy**: `NoteViewModel`, `SuggestionViewModel[]`.
- **Propsy**: `noteId: string | 'new'`.

### `NoteForm`

- **Opis**: Formularz zawierający podstawowe pola do edycji notatki: tytuł i treść.
- **Główne elementy**: `Input` dla tytułu, `Textarea` dla treści, komponent `EntityTagInput`.
- **Obsługiwane interakcje**: Aktualizacja tytułu, treści i listy powiązanych bytów. Zmiany są propagowane do komponentu nadrzędnego.
- **Obsługiwana walidacja**:
  - Tytuł: Wymagany, maksymalnie 255 znaków.
  - Treść: Maksymalnie 10 000 znaków.
- **Typy**: `NoteViewModel`.
- **Propsy**: `note: NoteViewModel`, `onNoteChange: (field: keyof NoteViewModel, value: any) => void`.

### `EntityTagInput`

- **Opis**: Zaawansowany komponent do zarządzania bytami (tagami) powiązanymi z notatką. Wyświetla obecne byty jako tagi z możliwością usunięcia, posiada pole tekstowe z autouzupełnianiem do dodawania istniejących bytów oraz umożliwia zdefiniowanie typu relacji i utworzenie nowego bytu.
- **Główne elementy**: `Input` zintegrowany z `Popover` (dla autouzupełniania), `Badge` (dla wyświetlania bytów), `Select` (dla typu relacji), `Button` uruchamiający `CreateEntityModal`.
- **Obsługiwane interakcje**: Dodawanie bytu z listy, usuwanie bytu, zmiana typu relacji, inicjowanie tworzenia nowego bytu.
- **Typy**: `NoteEntityViewModel[]`.
- **Propsy**: `entities: NoteEntityViewModel[]`, `onEntitiesChange: (entities: NoteEntityViewModel[]) => void`.

### `CreateEntityModal`

- **Opis**: Modal pozwalający na utworzenie nowego bytu bez opuszczania widoku edytora.
- **Główne elementy**: `Dialog` (Shadcn), `Input` (nazwa), `Select` (typ), `Textarea` (opis), `Button` ("Zapisz").
- **Obsługiwane interakcje**: Zapis nowego bytu, anulowanie operacji.
- **Obsługiwana walidacja**:
  - Nazwa: Wymagana, maksymalnie 100 znaków.
  - Typ: Wymagany, wybrany z predefiniowanej listy.
  - Opis: Maksymalnie 1000 znaków.
- **Typy**: `CreateEntityCommand`.
- **Propsy**: `isOpen: boolean`, `onClose: () => void`, `onSave: (entity: CreateEntityCommand) => Promise<EntityDTO>`.

### `AISuggestionsPanel`

- **Opis**: Panel wyświetlający listę sugestii wygenerowanych przez AI dla bieżącej notatki. Zawiera przycisk do uruchomienia analizy oraz obsługuje stan ładowania.
- **Główne elementy**: `Button` ("Analizuj"), lista komponentów `AISuggestionCard`, wskaźnik ładowania.
- **Obsługiwane interakcje**: Uruchomienie analizy, akceptacja sugestii, odrzucenie sugestii.
- **Typy**: `SuggestionViewModel[]`.
- **Propsy**: `noteId: string`, `suggestions: SuggestionViewModel[]`, `isAnalyzing: boolean`, `onAnalyze: () => void`, `onAccept: (suggestionId: string) => void`, `onReject: (suggestionId: string) => void`.

### `AISuggestionCard`

- **Opis**: Karta prezentująca pojedynczą sugestię AI wraz z przyciskami akcji.
- **Główne elementy**: `Card` (Shadcn), `Button` ("Akceptuj"), `Button` ("Odrzuć").
- **Obsługiwane interakcje**: Akceptacja lub odrzucenie sugestii.
- **Typy**: `SuggestionViewModel`.
- **Propsy**: `suggestion: SuggestionViewModel`, `onAccept: (suggestionId: string) => void`, `onReject: (suggestionId: string) => void`.

## 5. Typy

Do implementacji widoku, oprócz istniejących DTO, potrzebne będą następujące typy ViewModel, które rozszerzą DTO o stan specyficzny dla UI.

```typescript
import type {
  NoteDTO,
  SuggestionDTO,
  EntityDTO,
  NoteEntityDTO,
  EntityType,
  RelationshipType,
} from "@/types";

/**
 * ViewModel dla notatki w edytorze. Przechowuje aktualny stan formularza.
 */
export interface NoteViewModel {
  id: string | "new"; // 'new' dla nowo tworzonej notatki
  title: string;
  content: string;
  entities: NoteEntityViewModel[];
}

/**
 * ViewModel dla bytu powiązanego z notatką.
 * Strukturalnie podobny do NoteEntityDTO, ale używany w stanie klienta.
 */
export interface NoteEntityViewModel {
  id: string; // ID bytu
  name: string;
  type: EntityType;
  relationship_type: RelationshipType;
}

/**
 * ViewModel dla sugestii AI. Rozszerza DTO o stan ładowania dla akcji.
 */
export interface SuggestionViewModel extends SuggestionDTO {
  isSubmitting: boolean; // Stan ładowania podczas akceptacji/odrzucania
}
```

## 6. Zarządzanie stanem

Cała logika i stan widoku zostaną zamknięte w niestandardowym hooku `useNoteEditor(noteId: string | 'new')`. Takie podejście scentralizuje logikę, ułatwi testowanie i utrzyma komponent `NoteEditorView` jako czysty komponent prezentacyjny.

**Hook `useNoteEditor` będzie zarządzał:**

- `note: NoteViewModel | null`: Aktualny stan edytowanej notatki.
- `suggestions: SuggestionViewModel[]`: Lista sugestii AI.
- `isLoadingNote: boolean`: Stan ładowania początkowych danych notatki.
- `isSaving: boolean`: Stan zapisu (tworzenia/aktualizacji) notatki.
- `isDeleting: boolean`: Stan usuwania notatki.
- `isAnalyzing: boolean`: Stan ładowania podczas analizy AI.
- `error: Error | null`: Globalny błąd widoku.
- `isDirty: boolean`: Flaga informująca, czy w notatce dokonano niezapisanych zmian.

**Hook `useNoteEditor` będzie eksponował funkcje:**

- `setNoteField(field, value)`: Do aktualizacji pól `title` i `content`.
- `setNoteEntities(entities)`: Do aktualizacji listy powiązanych bytów.
- `saveNote()`: Do obsługi zapisu notatki (POST/PATCH).
- `deleteNote()`: Do obsługi usunięcia notatki (DELETE).
- `runAnalysis()`: Do uruchomienia analizy AI.
- `acceptSuggestion(suggestionId)`: Do akceptacji sugestii.
- `rejectSuggestion(suggestionId)`: Do odrzucenia sugestii.

## 7. Integracja API

Komponenty będą komunikować się z API za pośrednictwem funkcji udostępnianych przez hook `useNoteEditor`.

- **Pobieranie danych notatki**: `GET /api/notes/:id`
  - Odpowiedź: `NoteDTO`
- **Pobieranie sugestii**: `GET /api/notes/:id/suggestions`
  - Odpowiedź: `{ data: SuggestionDTO[] }`
- **Tworzenie notatki**: `POST /api/notes`
  - Żądanie: `CreateNoteCommand` (`{ title, content, entities: [{ entity_id, relationship_type }] }`)
  - Odpowiedź: `NoteDTO`
- **Aktualizacja notatki**: `PATCH /api/notes/:id`
  - Żądanie: `UpdateNoteCommand` (te same pola co w `CreateNoteCommand`, wszystkie opcjonalne)
  - Odpowiedź: `NoteDTO`
- **Usuwanie notatki**: `DELETE /api/notes/:id`
  - Odpowiedź: `204 No Content`
- **Wyszukiwanie bytów (autocomplete)**: `GET /api/entities?search={term}`
  - Odpowiedź: `EntitiesListResponseDTO`
- **Tworzenie bytu**: `POST /api/entities`
  - Żądanie: `CreateEntityCommand` (`{ name, type, description }`)
  - Odpowiedź: `EntityDTO`
- **Analiza AI**: `POST /api/notes/:id/analyze`
  - Odpowiedź: `{ note_id, suggestions: SuggestionDTO[], ... }`
- **Aktualizacja sugestii**: `PATCH /api/suggestions/:id`
  - Żądanie: `{ status: 'accepted' | 'rejected' }`
  - Odpowiedź: `SuggestionDTO`

## 8. Interakcje użytkownika

- **Zmiana danych w formularzu**: Każda zmiana w polach `title`, `content` lub na liście bytów aktualizuje stan `note` w hooku i ustawia flagę `isDirty` na `true`.
- **Zapis notatki**: Kliknięcie przycisku "Zapisz" wywołuje funkcję `saveNote()`. Przycisk jest nieaktywny, jeśli `isDirty` jest `false` lub formularz jest niepoprawny. Po pomyślnym zapisie, `isDirty` jest ustawiane na `false`.
- **Dodawanie bytu**: Użytkownik wpisuje frazę w `EntityTagInput`, wybiera byt z listy autouzupełniania, wybiera typ relacji i zatwierdza. Byt jest dodawany do stanu `note.entities`.
- **Tworzenie nowego bytu**: Jeśli byt nie istnieje, użytkownik klika opcję "Utwórz nowy...". Otwiera się `CreateEntityModal`, gdzie po wypełnieniu i zapisaniu nowy byt jest tworzony przez API, a następnie dodawany do stanu `note.entities`.
- **Uruchomienie analizy AI**: Kliknięcie "Analizuj" wywołuje `runAnalysis()`. Przycisk jest blokowany, a panel sugestii pokazuje wskaźnik ładowania. Po zakończeniu, lista sugestii jest aktualizowana.
- **Akceptacja/odrzucenie sugestii**: Kliknięcie odpowiedniego przycisku na `AISuggestionCard` wywołuje funkcje `acceptSuggestion()` lub `rejectSuggestion()`. Karta pokazuje stan ładowania. Po pomyślnej operacji karta jest usuwana z listy. Jeśli zaakceptowana sugestia dodaje nowy byt do notatki, dane notatki są odświeżane.

## 9. Warunki i walidacja

- **Przycisk "Zapisz"**: Aktywny tylko wtedy, gdy `isDirty` jest `true` ORAZ `note.title` nie jest pusty.
- **Przycisk "Analizuj"**:
  - Nieaktywny, gdy notatka jest nowa i niezapisana (`note.id === 'new'`).
  - Nieaktywny, gdy treść notatki jest pusta lub zbyt krótka (np. < 10 znaków).
  - Nieaktywny, jeśli użytkownik nie wyraził zgody na przetwarzanie danych AI (wymaga pobrania stanu profilu użytkownika).
- **Formularz `NoteForm`**: Wyświetla komunikaty walidacyjne (np. "Tytuł jest wymagany") pod odpowiednimi polami, jeśli walidacja po stronie klienta zawiedzie.
- **Modal `CreateEntityModal`**: Przycisk "Zapisz" jest aktywny tylko wtedy, gdy pola `name` i `type` są poprawnie wypełnione.

## 10. Obsługa błędów

- **Błąd pobierania notatki (404 Not Found)**: Zamiast edytora, wyświetlany jest komunikat "Notatka nie została znaleziona" z linkiem powrotnym do listy notatek.
- **Błędy walidacji z API (400 Bad Request)**: Komunikaty o błędach są mapowane i wyświetlane pod odpowiednimi polami formularza.
- **Konflikt nazwy bytu (409 Conflict)**: W `CreateEntityModal` wyświetlany jest komunikat "Byt o tej nazwie już istnieje".
- **Brak zgody na AI (400 Bad Request przy analizie)**: Wyświetlany jest komunikat (toast) informujący o konieczności wyrażenia zgody w ustawieniach profilu.
- **Inne błędy serwera (5xx) lub błędy sieciowe**: Wyświetlany jest generyczny komunikat (toast), np. "Wystąpił nieoczekiwany błąd. Spróbuj ponownie później." Błąd jest logowany do konsoli deweloperskiej.

## 11. Kroki implementacji

1.  **Stworzenie pliku strony Astro**: Utworzenie `src/pages/notes/[id].astro`, który będzie renderował komponent React `NoteEditorView` w trybie `client:load`.
2.  **Implementacja hooka `useNoteEditor`**: Zdefiniowanie całej logiki stanu, funkcji obsługi i interakcji z API. Na początku można użyć mockowych danych do testowania.
3.  **Implementacja komponentów (od dołu do góry)**:
    - `AISuggestionCard`
    - `CreateEntityModal`
    - `EntityTagInput` (najbardziej złożony, wymaga najwięcej uwagi)
    - `AISuggestionsPanel`
    - `NoteForm`
4.  **Implementacja głównego komponentu `NoteEditorView`**: Zintegrowanie wszystkich mniejszych komponentów i połączenie ich z hookiem `useNoteEditor`.
5.  **Integracja z API**: Podłączenie rzeczywistych wywołań API wewnątrz hooka, zastępując mockowe dane.
6.  **Obsługa routingu i trybów**: Implementacja logiki rozróżniającej tryb `new` od trybu edycji, w tym przekierowanie po pomyślnym utworzeniu nowej notatki.
7.  **Styling i UX**: Dopracowanie stylów za pomocą Tailwind CSS, dodanie animacji, stanów ładowania i komunikatów zwrotnych (toasty) dla użytkownika.
8.  **Testowanie**: Manualne przetestowanie wszystkich historyjek użytkownika (US-005, US-007, US-008, US-009, US-010) i obsługa przypadków brzegowych.
