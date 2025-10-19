# Architektura Bazy Danych - ClassicInsight

Ten dokument przedstawia kompletną architekturę bazy danych PostgreSQL dla aplikacji ClassicInsight, zaprojektowaną do współpracy z Supabase.

## 1. Definicje Typów Niestandardowych (ENUM)

```sql
-- Typy bytów (tagów), które użytkownik może przypisać do notatek
CREATE TYPE entity_type AS ENUM (
  'person',       -- Osoba (np. filozof, pisarz)
  'work',         -- Dzieło (np. książka, traktat)
  'epoch',        -- Epoka (np. Oświecenie, Starożytność)
  'idea',         -- Idea (np. egzystencjalizm, stoicyzm)
  'school',       -- Szkoła/nurt (np. Szkoła Frankfurcka)
  'system',       -- System filozoficzny (np. Kantyzm)
  'other'         -- Inne
);

-- Typy relacji, które mogą łączyć dwa byty w grafie myśli
CREATE TYPE relationship_type AS ENUM (
  'criticizes',          -- Krytykuje
  'is_student_of',     -- Jest uczniem
  'expands_on',          -- Rozwija myśl
  'influenced_by',     -- Był pod wpływem
  'is_example_of',     -- Jest przykładem
  'is_related_to'      -- Jest powiązany z (domyślny)
);

-- Status sugestii wygenerowanej przez AI
CREATE TYPE suggestion_status AS ENUM (
  'pending',      -- Oczekująca na akcję użytkownika
  'accepted',     -- Zaakceptowana przez użytkownika
  'rejected'      -- Odrzucona przez użytkownika
);

-- Rodzaj sugestii wygenerowanej przez AI
CREATE TYPE suggestion_type AS ENUM (
  'quote',                  -- Sugerowany cytat
  'summary',                -- Sugerowane streszczenie
  'new_entity',             -- Sugestia stworzenia nowego bytu
  'existing_entity_link'    -- Sugestia połączenia z istniejącym bytem
);
```

## 2. Schemat Tabel

### Tabela: `profiles`
Rozszerza wbudowaną tabelę `auth.users` o dodatkowe informacje specyficzne dla aplikacji.

```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  has_agreed_to_ai_data_processing BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### Tabela: `notes`
Przechowuje notatki tworzone przez użytkowników.

```sql
CREATE TABLE notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  content TEXT CHECK (length(content) <= 10000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### Tabela: `entities`
Przechowuje byty (tagi), które są unikalne w obrębie konta danego użytkownika.

```sql
CREATE TABLE entities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description TEXT CHECK (length(description) <= 1000), -- Opcjonalny opis bytu
  type entity_type NOT NULL DEFAULT 'other',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, name)
);
```
```

### Tabela: `note_entities`
Tabela łącząca, realizująca relację wiele-do-wielu między notatkami (`notes`) a bytami (`entities`).

```sql
CREATE TABLE note_entities (
  note_id UUID NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
  entity_id UUID NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
  PRIMARY KEY (note_id, entity_id)
);
```

### Tabela: `relationships`
Przechowuje skierowane i typowane relacje między dwoma bytami.

```sql
CREATE TABLE relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source_entity_id UUID NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
  target_entity_id UUID NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
  type relationship_type NOT NULL DEFAULT 'is_related_to',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, source_entity_id, target_entity_id, type)
);
```

### Tabela: `ai_suggestions`
Przechowuje sugestie generowane przez AI dla poszczególnych notatek.

```sql
CREATE TABLE ai_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  note_id UUID REFERENCES notes(id) ON DELETE SET NULL,
  name VARCHAR(255),
  content TEXT CHECK (length(content) <= 1000),
  type suggestion_type NOT NULL,
  status suggestion_status NOT NULL DEFAULT 'pending',
  suggested_entity_id UUID REFERENCES entities(id) ON DELETE SET NULL,
  generation_duration_ms INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### Tabela: `ai_error_logs`
Loguje błędy, które wystąpiły podczas generowania sugestii przez AI.

```sql
CREATE TABLE ai_error_logs (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  model_name VARCHAR(100),
  source_text_hash VARCHAR(64),
  error_code VARCHAR(50),
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

## 3. Relacje Między Tabelami

-   **`auth.users` 1-do-1 `profiles`**: Każdy użytkownik ma jeden profil.
-   **`auth.users` 1-do-wielu `notes`**: Użytkownik może mieć wiele notatek.
-   **`auth.users` 1-do-wielu `entities`**: Użytkownik może zdefiniować wiele bytów.
-   **`auth.users` 1-do-wielu `relationships`**: Użytkownik może tworzyć wiele relacji.
-   **`notes` wiele-do-wielu `entities`**: Notatka może mieć wiele bytów (tagów), a byt może być przypisany do wielu notatek. Relacja realizowana przez tabelę `note_entities`.
-   **`entities` wiele-do-wielu `entities`**: Byt może mieć wiele relacji z innymi bytami. Relacja realizowana przez tabelę `relationships`, gdzie `source_entity_id` i `target_entity_id` wskazują na tabelę `entities`.
-   **`notes` 1-do-wielu `ai_suggestions`**: Do jednej notatki może być przypisanych wiele sugestii AI.
-   **`entities` 1-do-wielu `ai_suggestions`**: Sugestia AI może wskazywać na istniejący byt.

## 4. Indeksy

W celu optymalizacji wydajności zapytań, zostaną utworzone indeksy na wszystkich kolumnach będących kluczami obcymi.

```sql
-- Indeksy dla tabeli profiles
CREATE INDEX idx_profiles_user_id ON profiles(user_id);

-- Indeksy dla tabeli notes
CREATE INDEX idx_notes_user_id ON notes(user_id);

-- Indeksy dla tabeli entities
CREATE INDEX idx_entities_user_id ON entities(user_id);

-- Indeksy dla tabeli note_entities
CREATE INDEX idx_note_entities_note_id ON note_entities(note_id);
CREATE INDEX idx_note_entities_entity_id ON note_entities(entity_id);

-- Indeksy dla tabeli relationships
CREATE INDEX idx_relationships_user_id ON relationships(user_id);
CREATE INDEX idx_relationships_source_entity_id ON relationships(source_entity_id);
CREATE INDEX idx_relationships_target_entity_id ON relationships(target_entity_id);

-- Indeksy dla tabeli ai_suggestions
CREATE INDEX idx_ai_suggestions_user_id ON ai_suggestions(user_id);
CREATE INDEX idx_ai_suggestions_note_id ON ai_suggestions(note_id);
CREATE INDEX idx_ai_suggestions_suggested_entity_id ON ai_suggestions(suggested_entity_id);
CREATE INDEX idx_ai_suggestions_status ON ai_suggestions(status);

-- Indeksy dla tabeli ai_error_logs
CREATE INDEX idx_ai_error_logs_user_id ON ai_error_logs(user_id);
```

## 5. Polityki Bezpieczeństwa (Row-Level Security - RLS)

Wszystkie tabele zawierające dane użytkowników będą chronione przez RLS, aby zapewnić, że użytkownicy mają dostęp tylko do swoich własnych danych.

```sql
-- Włączenie RLS dla tabel
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE note_entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_suggestions ENABLE ROW LEVEL SECURITY;

-- Polityka dla tabeli profiles
CREATE POLICY "Users can view and manage their own profile"
ON profiles FOR ALL
USING (auth.uid() = user_id);

-- Polityka dla tabeli notes
CREATE POLICY "Users can view and manage their own notes"
ON notes FOR ALL
USING (auth.uid() = user_id);

-- Polityka dla tabeli entities
CREATE POLICY "Users can view and manage their own entities"
ON entities FOR ALL
USING (auth.uid() = user_id);

-- Polityka dla tabeli note_entities
CREATE POLICY "Users can view and manage their own note-entity links"
ON note_entities FOR ALL
USING (
  (SELECT user_id FROM notes WHERE id = note_id) = auth.uid()
);

-- Polityka dla tabeli relationships
CREATE POLICY "Users can view and manage their own relationships"
ON relationships FOR ALL
USING (auth.uid() = user_id);

-- Polityka dla tabeli ai_suggestions
CREATE POLICY "Users can view and manage their own AI suggestions"
ON ai_suggestions FOR ALL
USING (auth.uid() = user_id);
```

## 6. Dodatkowe Uwagi

-   **Automatyczne aktualizowanie `updated_at`**: Zaleca się utworzenie funkcji i triggera w PostgreSQL do automatycznej aktualizacji kolumny `updated_at` przy każdej zmianie rekordu. Supabase oferuje gotowe mechanizmy do tego celu.
-   **Anonimizacja danych AI**: Zgodnie z decyzjami projektowymi, usunięcie konta użytkownika (`auth.users`) lub notatki (`notes`) nie powoduje usunięcia powiązanych rekordów w tabelach `ai_suggestions` i `ai_error_logs`. Zamiast tego, klucze obce `user_id` i `note_id` są ustawiane na `NULL` (`ON DELETE SET NULL`). Pozwala to na zachowanie anonimowych danych do celów analitycznych i monitorowania wydajności modeli AI bez przechowywania danych osobowych.
-   **Klucze podstawowe**: Użycie `UUID` jako kluczy podstawowych jest zgodne z najlepszymi praktykami dla systemów rozproszonych i ułatwia integrację z Supabase.
-   **Ograniczenia unikalności**: Złożone klucze unikalne w tabelach `entities` i `relationships` zapobiegają tworzeniu duplikatów (np. dwóch bytów o tej samej nazwie przez tego samego użytkownika) na poziomie bazy danych, co zapewnia integralność danych.
