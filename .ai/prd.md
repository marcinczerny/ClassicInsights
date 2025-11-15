# Dokument wymagań produktu (PRD) - ClassicInsight

## 1. Przegląd produktu

ClassicInsight to aplikacja internetowa w wersji MVP (Minimum Viable Product) zaprojektowana dla pasjonatów literatury i filozofii. Jej głównym celem jest ułatwienie eksploracji, analizy i porównywania dzieł filozoficznych oraz klasyki literatury. Aplikacja umożliwia użytkownikom tworzenie i zarządzanie notatkami, które mogą być następnie wzbogacane przez sztuczną inteligencję o powiązane cytaty, streszczenia i kluczowe idee. Kluczowym elementem jest wizualizacja połączeń między notatkami i pojęciami w formie interaktywnego grafu myśli. Aplikacja oferuje prosty system kont użytkowników do zarządzania prywatną bazą wiedzy.

## 2. Problem użytkownika

Głównym problemem, na który odpowiada ClassicInsight, jest brak skutecznych narzędzi do głębokiej eksploracji i syntezy wiedzy z dziedziny literatury i filozofii. Czytelnicy często tworzą rozproszone notatki, które trudno jest ze sobą powiązać, aby zrozumieć szerszy kontekst, np. ducha danej epoki, ewolucję idei czy wpływy między myślicielami. Brakuje platformy, która agreguje i porządkuje te informacje, a jednocześnie proaktywnie sugeruje nowe, nieoczywiste połączenia, motywy i stanowiska filozoficzne, tworząc spójną i łatwą w nawigacji bazę wiedzy.

## 3. Wymagania funkcjonalne

### 3.1. Zarządzanie kontem użytkownika

- F-001: Użytkownicy mogą rejestrować się w systemie za pomocą adresu e-mail i hasła.
- F-002: Użytkownicy mogą logować się i wylogowywać ze swojego konta.
- F-003: Użytkownicy mają możliwość zresetowania zapomnianego hasła.
- F-004: Podczas rejestracji użytkownik musi wyrazić jednorazową zgodę na wykorzystanie anonimowych danych do ulepszania modeli AI.

### 3.2. Zarządzanie notatkami

- F-005: Użytkownicy mogą tworzyć, przeglądać, edytować i usuwać notatki tekstowe.
- F-006: Aplikacja zapewnia prosty edytor tekstu z obsługą markdown.
- F-007: Główny widok po zalogowaniu to lista notatek stworzonych przez użytkownika.

### 3.3. Zarządzanie bytami (tagami)

- F-008: Użytkownicy mogą dodawać do notatek byty (np. Autor, Dzieło, Idea, Epoka) w formie tagów.
- F-009: System sugeruje istniejące już byty podczas ich wprowadzania, aby promować ich ponowne użycie i unikać duplikacji w obrębie konta użytkownika.
- F-023: Użytkownik może zdefiniować typ relacji między notatką a przypisanym do niej bytem, wybierając z tej samej listy typów relacji co przy połączeniach między bytami (np. "krytykuje", "rozwija myśl", "jest przykładem").

### 3.4. Wzbogacanie notatek przez AI

- F-010: Użytkownik może manualnie uruchomić analizę AI dla wybranej notatki za pomocą dedykowanego przycisku.
- F-011: AI analizuje treść notatki i jej metadane, a następnie sugeruje powiązane cytaty, streszczenia oraz nowe byty (węzły) i połączenia (krawędzie) do dodania w grafie myśli.
- F-012: Użytkownik ma możliwość zaakceptowania lub odrzucenia każdej sugestii AI.
- F-013: Podczas przetwarzania przez AI wyświetlany jest wskaźnik ładowania.

### 3.5. Wizualizacja grafu myśli

- F-014: Aplikacja oferuje interaktywny widok grafu, który wizualizuje notatki, byty i relacje między nimi.
- F-016: Węzły w grafie są rozróżnione kolorami w zależności od typu bytu (osoba, dzieło, epoka, idea, inne).
- F-017: Użytkownik może zdefiniować typ relacji między dwoma węzłami, wybierając z predefiniowanej listy (np. "krytykuje", "jest uczniem", "rozwija myśl").
- F-018: Domyślnie widok grafu jest ograniczony do połączeń pierwszego i drugiego stopnia od wybranego (aktywnego) węzła, aby zachować czytelność.

### 3.6. Wyszukiwanie

- F-018: Użytkownicy mogą wyszukiwać notatki na podstawie przypisanych do nich metadanych (bytów/tagów).

### 3.7. Doświadczenie użytkownika (UX)

- F-019: Nowi użytkownicy po pierwszym zalogowaniu widzą komunikat powitalny z wezwaniem do działania (stworzenia pierwszej notatki).

### 3.8. Wymagania prawne i ograniczenia:

- F-020: Dane osobowe użytkowników i fiszek przechowywane zgodnie z RODO.
- F-021: Prawo do wglądu i usunięcia danych (konto wraz z fiszkami) na wniosek użytkownika.

### 3.9. Statystyki generowania notatek

- F-022: Zbieranie informacji o tym, ile podpowiedzi zostało wygenerowanych podczas analizy AI i ile z nich ostatecznie zaakceptowano.

## 4. Granice produktu

Następujące funkcjonalności nie wchodzą w zakres wersji MVP i mogą zostać rozważone w przyszłości:

- Funkcje społecznościowe, takie jak współdzielenie notatek czy grafów myśli między użytkownikami.
- Zaawansowana obsługa i analiza multimediów (np. obrazy, pliki audio, wideo).
- W pełni automatyczna synteza tekstów lub generowanie rozbudowanych esejów przez AI.
- Importowanie notatek z zewnętrznych źródeł (np. plików lub innych aplikacji).
- Rozbudowane narzędzia do współpracy w czasie rzeczywistym.
- Rozbudowany system powiadomień.
- Aplikacje mobilne (obecnie tylko wersja web).
- Publicznie dostępne API.

## 5. Historyjki użytkowników

### Zarządzanie Kontem

- ID: US-001
- Tytuł: Rejestracja nowego użytkownika
- Opis: Jako nowy użytkownik, chcę móc założyć konto w aplikacji przy użyciu mojego adresu e-mail i hasła, abym mógł zacząć tworzyć swoje notatki.
- Kryteria akceptacji:
  1. Formularz rejestracji zawiera pola na adres e-mail, hasło i potwierdzenie hasła.
  2. System waliduje poprawność formatu adresu e-mail.
  3. System sprawdza, czy hasła w obu polach są identyczne.
  4. Hasło musi spełniać minimalne wymagania bezpieczeństwa (np. 8 znaków).
  5. Użytkownik musi zaakceptować zgodę na przetwarzanie danych na potrzeby AI.
  6. Po pomyślnej rejestracji jestem automatycznie zalogowany i przekierowany do głównego panelu.

- ID: US-002
- Tytuł: Logowanie do aplikacji
- Opis: Jako zarejestrowany użytkownik, chcę móc zalogować się na moje konto, aby uzyskać dostęp do moich notatek i grafu myśli.
- Kryteria akceptacji:
  1. Formularz logowania zawiera pola na e-mail i hasło.
  2. Po poprawnym wprowadzeniu danych jestem zalogowany i przekierowany do listy moich notatek.
  3. W przypadku podania błędnych danych, wyświetlany jest stosowny komunikat o błędzie.

- ID: US-003
- Tytuł: Wylogowanie z aplikacji
- Opis: Jako zalogowany użytkownik, chcę mieć możliwość wylogowania się z aplikacji, aby zabezpieczyć swoje konto.
- Kryteria akceptacji:
  1. W interfejsie aplikacji znajduje się wyraźnie oznaczony przycisk "Wyloguj".
  2. Po kliknięciu przycisku moja sesja zostaje zakończona i jestem przekierowany na stronę logowania.

- ID: US-004
- Tytuł: Resetowanie hasła
- Opis: Jako zarejestrowany użytkownik, który zapomniał hasła, chcę mieć możliwość jego zresetowania, abym mógł odzyskać dostęp do konta.
- Kryteria akceptacji:
  1. Na stronie logowania znajduje się link "Zapomniałem hasła".
  2. Po kliknięciu i podaniu mojego adresu e-mail, otrzymuję wiadomość z linkiem do zresetowania hasła.
  3. Link jest unikalny i ma ograniczony czas ważności.
  4. Po przejściu pod link mogę ustawić nowe hasło dla mojego konta.

### Zarządzanie Notatkami

- ID: US-005
- Tytuł: Tworzenie nowej notatki
- Opis: Jako użytkownik, chcę móc stworzyć nową notatkę z tytułem i treścią oraz dodać do niej tagi (byty), aby zapisać swoje myśli na temat danego dzieła lub idei.
- Kryteria akceptacji:
  1. W aplikacji jest dostępny przycisk "Dodaj notatkę".
  2. Formularz dodawania notatki zawiera pole na tytuł, edytor tekstu z obsługą markdown dla treści oraz pole do dodawania tagów.
  3. Podczas wpisywania tagu system podpowiada istniejące już w mojej bazie byty.
  4. Dla każdego dodawanego bytu mogę opcjonalnie określić typ relacji z notatką (np. "krytykuje", "rozwija myśl").
  5. Po zapisaniu notatka pojawia się na mojej liście notatek.

- ID: US-006
- Tytuł: Przeglądanie listy notatek
- Opis: Jako użytkownik, chcę widzieć listę wszystkich moich notatek, abym mógł szybko znaleźć tę, która mnie interesuje.
- Kryteria akceptacji:
  1. Główny ekran po zalogowaniu wyświetla listę moich notatek.
  2. Każda pozycja na liście pokazuje co najmniej tytuł notatki i datę jej utworzenia/modyfikacji.
  3. Kliknięcie na notatkę z listy przenosi mnie do jej szczegółowego widoku.

- ID: US-007
- Tytuł: Edycja istniejącej notatki
- Opis: Jako użytkownik, chcę mieć możliwość edycji moich istniejących notatek, aby móc je aktualizować i uzupełniać.
- Kryteria akceptacji:
  1. W widoku szczegółowym notatki znajduje się przycisk "Edytuj".
  2. Po jego kliknięciu mogę zmienić tytuł, treść oraz tagi notatki.
  3. Po zapisaniu zmian, notatka jest zaktualizowana.

- ID: US-008
- Tytuł: Usuwanie notatki
- Opis: Jako użytkownik, chcę móc usunąć notatkę, której już nie potrzebuję, aby utrzymać porządek w mojej bazie wiedzy.
- Kryteria akceptacji:
  1. W widoku notatki lub na liście notatek znajduje się opcja "Usuń".
  2. Przed ostatecznym usunięciem system prosi o potwierdzenie operacji.
  3. Po potwierdzeniu notatka jest trwale usuwana z mojego konta.

### Interakcja z AI

- ID: US-009
- Tytuł: Uruchamianie analizy AI
- Opis: Jako użytkownik, chcę móc uruchomić analizę AI dla mojej notatki, aby otrzymać sugestie powiązanych treści i idei.
- Kryteria akceptacji:
  1. W widoku notatki znajduje się przycisk "Znajdź powiązania" (lub o podobnym znaczeniu).
  2. Po kliknięciu przycisku rozpoczyna się analiza, a w interfejsie pojawia się wskaźnik ładowania.
  3. Po zakończeniu analizy wyświetlane są sugestie wygenerowane przez AI.

- ID: US-010
- Tytuł: Zarządzanie sugestiami AI
- Opis: Jako użytkownik, chcę móc przeglądać sugestie od AI i decydować, które z nich zaakceptować, a które odrzucić.
- Kryteria akceptacji:
  1. Sugestie (np. nowe byty, cytaty) są wyświetlane w czytelny sposób.
  2. Przy każdej sugestii mam do wyboru opcje "Akceptuj" i "Odrzuć".
  3. Zaakceptowane sugestie są dodawane do mojej notatki lub grafu myśli.
  4. Odrzucone sugestie znikają.
  5. Interakcja z każdą sugestią jest logowana na potrzeby mierzenia metryk sukcesu.

### Graf Myśli

- ID: US-011
- Tytuł: Wizualizacja grafu myśli
- Opis: Jako użytkownik, chcę móc zobaczyć moją notatkę i powiązane z nią byty w formie grafu, aby lepiej zrozumieć relacje między nimi.
- Kryteria akceptacji:
  1. Z poziomu notatki mogę przejść do widoku grafu.
  2. Centralnym węzłem grafu jest moja notatka.
  3. Wszystkie byty (tagi) przypisane do notatki są widoczne jako połączone z nią węzły.
  4. Węzły mają różne kolory w zależności od ich typu (np. Autor - niebieski, Dzieło - zielony).
  5. Krawędzie łączące notatkę z bytami wyświetlają typ relacji (jeśli został zdefiniowany).

- ID: US-012
- Tytuł: Eksploracja grafu
- Opis: Jako użytkownik, chcę móc interaktywnie eksplorować graf, klikając na poszczególne węzły, aby zobaczyć ich własne połączenia.
- Kryteria akceptacji:
  1. Kliknięcie na dowolny węzeł zaznacza go i wyświetla przycisk "Ustaw jako centrum".
  2. Graf przeładowuje się i centruje na nowo wybranym węźle dopiero po kliknięciu tego przycisku.
  3. Po przeładowaniu graf pokazuje połączenia pierwszego i drugiego stopnia od nowo wybranego węzła.
  4. Widok grafu automatycznie dopasowuje się, aby pokazać wszystkie widoczne węzły.
  5. Nawigacja po grafie jest płynna i intuicyjna (np. możliwość przesuwania i przybliżania widoku).

- ID: US-013
- Tytuł: Definiowanie typu relacji
- Opis: Jako użytkownik, chcę móc zdefiniować naturę połączenia między dwoma węzłami w grafie, aby precyzyjniej opisać ich relację.
- Kryteria akceptacji:
  1. Po utworzeniu połączenia (krawędzi) między dwoma węzłami, mogę przypisać jej typ.
  2. Typ relacji wybieram z predefiniowanej, zamkniętej listy (np. "wpłynął na", "krytykuje", "jest przykładem").
  3. Etykieta z typem relacji jest widoczna na krawędzi w grafie.

### Wyszukiwanie i Onboarding

- ID: US-014
- Tytuł: Wyszukiwanie notatek po tagach
- Opis: Jako użytkownik, chcę mieć możliwość wyszukania notatek po przypisanych do nich tagach (bytach), abym mógł szybko znaleźć wszystkie zapiski dotyczące np. konkretnego autora.
- Kryteria akceptacji:
  1. Na liście notatek znajduje się pole wyszukiwania.
  2. Po wpisaniu nazwy bytu (np. "Platon") i zatwierdzeniu, lista filtruje się, pokazując tylko te notatki, które mają przypisany dany tag.
  3. Możliwe jest wyszukiwanie po kilku tagach jednocześnie.

- ID: US-015
- Tytuł: Komunikat powitalny dla nowych użytkowników
- Opis: Jako nowy użytkownik, po pierwszym zalogowaniu chcę zobaczyć ekran powitalny, który pokrótce wyjaśni mi, co mogę zrobić i zachęci do stworzenia pierwszej notatki.
- Kryteria akceptacji:
  1. Komunikat powitalny jest wyświetlany tylko raz, po pierwszej pomyślnej rejestracji i zalogowaniu.
  2. Komunikat zawiera krótkie wprowadzenie do aplikacji.
  3. Komunikat zawiera wyraźny przycisk/wezwanie do działania (CTA), np. "Stwórz swoją pierwszą notatkę", który przenosi do formularza tworzenia notatki.

## 6. Metryki sukcesu

- Metryka jakości AI: 75% notatek wzbogaconych przez AI (np. o sugerowane cytaty, streszczenia, byty) jest akceptowanych przez użytkownika.
  - Sposób pomiaru: System będzie logował każdą interakcję użytkownika z sugestiami AI (akceptacja/odrzucenie). Metryka będzie obliczana jako stosunek zaakceptowanych sugestii do wszystkich wygenerowanych.

- Metryka aktywności użytkowników: 75% zarejestrowanych użytkowników generuje przynajmniej jedną notatkę w tygodniu.
  - Sposób pomiaru: System będzie monitorował aktywność tworzenia notatek przez użytkowników.
