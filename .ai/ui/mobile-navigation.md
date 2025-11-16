# Specyfikacja Biznesowa: Responsywność Widoku Dashboard

**Projekt:** ClassicInsights
**Data:** 16 listopada 2025
**Cel:** Adaptacja głównego widoku aplikacji (`DashboardPage.tsx`) do poprawnego działania na urządzeniach mobilnych o małej szerokości ekranu.

---

### 1. Opis Problemu i Cel Zmian

**Problem:**
Obecny interfejs komponentu `DashboardPage.tsx` opiera się na stałym, dwukolumnowym układzie. Na urządzeniach mobilnych (`<768px`) panel notatek (`NotesPanel.tsx`) zajmuje większość ekranu, wypychając panel grafu (`GraphPanel.tsx`) poza widoczny obszar. Aplikacja w tym widoku jest nieużywalna na małych ekranach.

**Cel:**
Celem jest wdrożenie w pełni responsywnego interfejsu, który na małych ekranach przełączy się na nawigację opartą na zakładkach (Tabs). Zmiany mają zapewnić intuicyjną i płynną obsługę aplikacji na wszystkich urządzeniach, bez naruszania obecnego doświadczenia użytkownika na desktopie.

### 2. Kluczowe Komponenty

Zmiany obejmą następujące komponenty:
-   `src/components/dashboard/DashboardPage.tsx` (główny kontener)
-   `src/components/dashboard/notes/NotesPanel.tsx` (panel listy notatek)
-   `src/components/dashboard/graph/GraphPanel.tsx` (panel grafu myśli)
-   `src/components/layout/Footer.tsx` (komponent stopki aplikacji)*

*Uwaga: Komponent `Footer.tsx` nie został znaleziony w projekcie. Specyfikacja zakłada jego istnienie lub utworzenie w przyszłości.*

### 3. Wymagania Funkcjonalne

#### 3.1. Zachowanie na Ekranach Desktopowych (>=768px)

-   **BEZ ZMIAN.** Układ interfejsu musi pozostać identyczny z obecnym.
-   Dwukolumnowy widok, z `NotesPanel.tsx` po lewej i `GraphPanel.tsx` po prawej stronie, zostaje zachowany.

#### 3.2. Zachowanie na Ekranach Mobilnych (<768px)

-   **Interfejs zakładek:** Dwukolumnowy układ zostanie zastąpiony przez interfejs oparty na zakładkach. Należy wykorzystać do tego celu komponent `Tabs` z biblioteki `shadcn/ui`.
-   **Dostępne widoki:** Użytkownik będzie miał do dyspozycji dwie zakładki:
    1.  **"Notatki"**: Wyświetlająca zawartość komponentu `NotesPanel.tsx`.
    2.  **"Graf"**: Wyświetlająca zawartość komponentu `GraphPanel.tsx`.
-   **Widoczność paneli:** W danym momencie widoczny będzie tylko jeden panel, odpowiadający aktywnej zakładce.
-   **Nawigacja mobilna:** Klasyczna stopka aplikacji (`Footer.tsx`) zostanie ukryta. W jej miejsce pojawi się dedykowana nawigacja mobilna, zapewniająca dostęp do kluczowych funkcji na małych ekranach.

### 4. Wymagania Technologiczne

-   Implementacja musi być zgodna ze stosem technologicznym projektu zdefiniowanym w dokumencie `@tech-stack.md`.
-   Należy wykorzystać system responsywności (breakpointy) dostarczany przez **Tailwind 4**.
-   Komponenty interaktywne muszą być zaimplementowane w **React 19** i **TypeScript 5**.
-   Do budowy interfejsu należy użyć gotowych komponentów z biblioteki **Shadcn/ui**.
