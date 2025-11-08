<user_journey_analysis>
### 1. Wypis ścieżek użytkownika
Na podstawie dostarczonych dokumentów (`prd.md` i `auth-spec.md`) zidentyfikowano następujące ścieżki użytkownika:
- **Korzystanie z aplikacji jako gość:** Użytkownik niezalogowany ma dostęp do stron publicznych, ale przy próbie dostępu do zasobów chronionych jest przekierowywany na stronę logowania.
- **Rejestracja nowego konta:** Użytkownik podaje e-mail, hasło oraz wyraża zgodę na przetwarzanie danych, a następnie musi potwierdzić swój adres e-mail, klikając w link weryfikacyjny.
- **Logowanie do systemu:** Zarejestrowany użytkownik podaje swoje dane uwierzytelniające, aby uzyskać dostęp do swojego konta.
- **Odzyskiwanie hasła:** Użytkownik, który zapomniał hasła, może zainicjować procedurę jego resetowania poprzez podanie swojego adresu e-mail.
- **Wylogowanie:** Zalogowany użytkownik może w każdej chwili zakończyć swoją sesję.
- **Korzystanie z aplikacji jako zalogowany użytkownik:** Użytkownik ma dostęp do pełnej funkcjonalności aplikacji, w tym do panelu z notatkami i grafu myśli.

### 2. Główne podróże i stany
- **Podróż Gościa:** Obejmuje wejście na stronę główną, nawigację do formularzy logowania/rejestracji oraz obsługę prób dostępu do chronionych sekcji.
- **Podróż Rejestracyjna:** Rozpoczyna się od wypełnienia formularza, przechodzi przez walidację danych, wysłanie e-maila weryfikacyjnego i kończy się aktywacją konta po kliknięciu w link.
- **Podróż Logowania:** Składa się z wypełnienia formularza logowania i weryfikacji poświadczeń.
- **Podróż Resetowania Hasła:** Inicjowana przez użytkownika, obejmuje wysłanie linku do resetu na e-mail i proces ustawiania nowego hasła.
- **Podróż Zalogowanego Użytkownika:** Obejmuje dostęp do głównego panelu aplikacji oraz możliwość wylogowania się.

### 3. Punkty decyzyjne i alternatywne ścieżki
- **Weryfikacja sesji:** System sprawdza, czy użytkownik jest zalogowany. Jeśli tak, uzyskuje dostęp do zasobów chronionych; jeśli nie, jest traktowany jako gość.
- **Walidacja formularzy:** Dane wprowadzane w formularzach (rejestracji, logowania, zmiany hasła) są walidowane. Błędne dane skutkują wyświetleniem komunikatów o błędach, a poprawne pozwalają kontynuować proces.
- **Weryfikacja e-mail:** Kliknięcie w link weryfikacyjny jest kluczowym punktem decyzyjnym w procesie rejestracji, który aktywuje konto użytkownika.
- **Status poświadczeń logowania:** System sprawdza, czy dane logowania są poprawne. Błędne dane uniemożliwiają logowanie.

### 4. Cel każdego stanu
- **StronaGłówna (dla Gościa):** Służy jako punkt wejścia i wizytówka aplikacji, kierując niezalogowanych użytkowników do odpowiednich akcji (logowanie/rejestracja).
- **FormularzRejestracji:** Umożliwia zebranie od użytkownika informacji niezbędnych do utworzenia konta.
- **OczekiwanieNaWeryfikacjeEmaila:** Stan pośredni, który informuje użytkownika o konieczności potwierdzenia adresu e-mail, co jest kluczowe dla bezpieczeństwa i weryfikacji.
- **FormularzLogowania:** Zapewnia mechanizm uwierzytelniania dla powracających użytkowników.
- **PanelUzytkownika:** Główny obszar roboczy aplikacji, w którym użytkownik realizuje kluczowe zadania (np. zarządzanie notatkami).
- **ProcesResetuHasla:** Zapewnia użytkownikom bezpieczną ścieżkę do odzyskania dostępu do konta w przypadku zapomnienia hasła.
</user_journey_analysis>

```mermaid
stateDiagram-v2
    direction LR
    [*] --> StronaStartowa

    state "Użytkownik Niezalogowany" as Gosc {
        StronaStartowa --> FormularzLogowania: Kliknięcie "Zaloguj"
        StronaStartowa --> Rejestracja: Kliknięcie "Zarejestruj"
        
        state "Proces Logowania" as Logowanie {
            FormularzLogowania
            note right of FormularzLogowania
                Pola: email, hasło
                Link do resetowania hasła
            end note
            
            FormularzLogowania --> WeryfikacjaDanychLogowania: Przesłanie formularza
            
            state if_dane_logowania <<choice>>
            WeryfikacjaDanychLogowania --> if_dane_logowania
            if_dane_logowania --> PanelUzytkownika: Dane poprawne
            if_dane_logowania --> FormularzLogowania: Dane błędne
        }

        state "Proces Rejestracji" as Rejestracja {
            [*] --> FormularzRejestracji
            note right of FormularzRejestracji
                Pola: email, hasło, powtórz hasło
                Checkbox: zgoda na przetwarzanie AI
            end note
            
            FormularzRejestracji --> WalidacjaDanychRejestracji: Przesłanie formularza
            
            state if_dane_rejestracji <<choice>>
            WalidacjaDanychRejestracji --> if_dane_rejestracji
            if_dane_rejestracji --> OczekiwanieNaWeryfikacjeEmaila: Dane poprawne
            if_dane_rejestracji --> FormularzRejestracji: Dane błędne
            
            OczekiwanieNaWeryfikacjeEmaila: Użytkownik musi kliknąć link w mailu
            OczekiwanieNaWeryfikacjeEmaila --> PanelUzytkownika: Email zweryfikowany
        }
        
        state "Proces Resetowania Hasła" as ResetHasla {
            FormularzLogowania --> FormularzEmailDoResetu: Kliknięcie "Zapomniałem hasła"
            note right of FormularzEmailDoResetu
                Pole: email
            end note
            
            FormularzEmailDoResetu --> WeryfikacjaEmailaDoResetu: Przesłanie formularza
            
            state if_email_istnieje <<choice>>
            WeryfikacjaEmailaDoResetu --> if_email_istnieje
            if_email_istnieje --> WyslanoLink: Email istnieje w bazie
            if_email_istnieje --> FormularzEmailDoResetu: Email nie istnieje
            
            WyslanoLink: Użytkownik musi kliknąć link w mailu
            WyslanoLink --> FormularzNowegoHasla: Kliknięcie linku
            
            note right of FormularzNowegoHasla
                Pola: nowe hasło, powtórz hasło
            end note

            FormularzNowegoHasla --> WalidacjaNowegoHasla: Przesłanie formularza
            
            state if_nowe_hasla_zgodne <<choice>>
            WalidacjaNowegoHasla --> if_nowe_hasla_zgodne
            if_nowe_hasla_zgodne --> PotwierdzenieZmianyHasla: Hasła zgodne
            if_nowe_hasla_zgodne --> FormularzNowegoHasla: Hasła niezgodne
            
            PotwierdzenieZmianyHasla --> FormularzLogowania
        }
    }

    state "Użytkownik Zalogowany" as Zalogowany {
        PanelUzytkownika
        note left of PanelUzytkownika
            Główny widok aplikacji
            Dostęp do notatek, grafu itp.
        end note
        PanelUzytkownika --> Wylogowanie: Kliknięcie "Wyloguj"
        Wylogowanie --> StronaStartowa
    }
    
    StronaStartowa: Wejście do aplikacji
    note right of StronaStartowa
        Middleware sprawdza sesję.
        Jeśli sesja istnieje, przekierowuje
        do Panelu Użytkownika.
    end note
    StronaStartowa --> PanelUzytkownika: Sesja aktywna
```

