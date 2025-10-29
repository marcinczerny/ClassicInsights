# UI Architecture for ClassicInsight

## 1. UI Structure Overview

The UI architecture for ClassicInsight is designed as a single-page application (SPA) built with React within an Astro framework. It prioritizes simplicity, clarity, and a focused user experience. The structure is centered around two main workspaces: the **Note Workspace** for content creation and the **Graph Workspace** for knowledge exploration.

The core layout consists of a persistent top navigation bar providing access to major sections and user settings. The main content area dynamically renders the different views based on the user's navigation. State management will be handled by React's Context API for global UI state (like user info) and component-level state (`useState`, `useEffect`) for server-side data fetching and caching, ensuring a lightweight MVP. All asynchronous operations will be clearly communicated to the user via loading indicators, and destructive actions will require confirmation.

## 2. Views List

### 2.1. Authentication Views

#### a. Sign Up View
- **Path**: `/sign-up`
- **Purpose**: To allow new users to register for the service.
- **Key Information**: Email address, password, password confirmation, and a mandatory checkbox for AI data processing consent.
- **Key Components**: `AuthForm`, `InputField`, `Checkbox`, `Button`.
- **UX/Accessibility/Security**: Form validation will provide real-time feedback. The consent checkbox will link to a privacy policy. All password fields will be type `password`.

#### b. Sign In View
- **Path**: `/sign-in`
- **Purpose**: To allow registered users to log into their account.
- **Key Information**: Email address, password, and a link to the password reset flow.
- **Key Components**: `AuthForm`, `InputField`, `Button`, `Link`.
- **UX/Accessibility/Security**: Provides clear error messages for invalid credentials.

#### c. Password Reset View
- **Path**: `/forgot-password`
- **Purpose**: To enable users who have forgotten their password to reset it.
- **Key Information**: An input for the user's email address. Subsequent steps are handled via an email link.
- **Key Components**: `Form`, `InputField`, `Button`.
- **UX/Accessibility/Security**: The system provides feedback confirming that a reset email has been sent.

### 2.2. Core Application Views

#### a. Onboarding View
- **Path**: Displayed as a modal over the Main Dashboard on the first visit.
- **Purpose**: To welcome new users and guide them towards their first action.
- **Key Information**: A welcome message and a primary Call-to-Action (CTA) to create a new note.
- **Key Components**: `Modal`, `Button`.
- **UX/Accessibility/Security**: This view is only shown once. The modal will be dismissible.

#### b. Main Dashboard View
- **Path**: `/`
- **Purpose**: To serve as the user's main hub, displaying all their notes and providing access to the thought graph.
- **Key Information**: A list of all user notes (title, modification date), a search bar for filtering notes by entities, and a button to create a new note.
- **Key Components**: `NotesList`, `SearchBar`, `Button`, `GraphPanel` (slide-out).
- **UX/Accessibility/Security**: An "empty state" will be shown if the user has no notes, guiding them to create one. The notes list will be paginated to handle large numbers of notes.

#### c. Note Editor View
- **Path**: `/notes/:id` (e.g., `/notes/new`, `/notes/uuid-1234`)
- **Purpose**: To allow for the creation, viewing, and editing of notes, as well as interacting with AI suggestions.
- **Key Information**: Note title, content editor (Markdown), a list of attached entities (tags), a button to trigger AI analysis, and a section for AI-generated suggestions.
- **Key Components**: `TextInput` (for title), `MarkdownEditor` (`<textarea>`), `EntityTagInput` (with autocomplete), `Button` (`Analyze`), `AISuggestionCard`, `ConfirmationModal` (for deletion).
- **UX/Accessibility/Security**: Saving is auto-triggered or manual with clear status indicators. The "Analyze" button is disabled if consent isn't given. User-generated content is sanitized on display if rendered as HTML.

#### d. Global Entity Management View
- **Path**: `/entities`
- **Purpose**: To provide a centralized place for users to manage all their created entities (tags).
- **Key Information**: A filterable and searchable list of all entities, showing name, type, and the number of notes it's associated with.
- **Key Components**: `DataTable`/`List`, `SearchBar`, `FilterDropdowns`, `EditEntityModal`, `ConfirmationModal`.
- **UX/Accessibility/Security**: Provides a clear overview of the user's knowledge base structure. Destructive actions are confirmed via a modal.

#### e. Profile Management View
- **Path**: `/profile`
- **Purpose**: To allow users to manage their account settings and data.
- **Key Information**: AI data processing consent setting, password change options, and an account deletion option.
- **Key Components**: `ToggleSwitch`, `Button`, `ConfirmationModal` (for account deletion).
- **UX/Accessibility/Security**: The account deletion action is a critical, multi-step confirmation process to prevent accidental data loss.

## 3. User Journey Map

The primary user journey is designed to be a seamless flow from content creation to knowledge discovery.

1.  **Registration & Onboarding**:
    - A new user signs up via the **Sign Up View**.
    - Upon first login, they are directed to the **Main Dashboard**, where an **Onboarding View** (modal) prompts them to create their first note.
    - Clicking the CTA takes them to the **Note Editor View**.

2.  **Content Creation & Enrichment**:
    - In the **Note Editor View**, the user writes a title and content.
    - They add entities (e.g., `#Plato`) using the `EntityTagInput`, creating new entities via a modal when necessary. They define note-to-entity relationships via a dropdown next to each tag.
    - After saving, the user clicks the "Analyze" button. A loading indicator appears.
    - `AISuggestionCards` are populated below the note, which the user can accept or reject. Accepting a suggestion might add a new entity to the note.

3.  **Knowledge Exploration**:
    - From the **Main Dashboard**, the user opens the `GraphPanel`.
    - The graph is initially centered on the most recent note.
    - The user clicks on an entity node (e.g., "Plato"). The graph re-centers, fetching and displaying connections up to two levels deep via a call to the `/api/graph` endpoint.
    - The user activates "Connect Mode", clicks two entity nodes, and defines the relationship between them in a modal (e.g., Socrates `is_student_of` Plato).

## 4. Layout and Navigation Structure

Navigation is designed to be simple and predictable.

-   **Application Shell**: A persistent layout component wraps all authenticated views.
-   **Header Navigation**: The header contains links to the main sections:
    -   **Notes**: Links to the Main Dashboard (`/`).
    -   **Entities**: Links to the Global Entity Management View (`/entities`).
    -   **User Profile Dropdown**: Provides access to the **Profile Management View** (`/profile`) and the **Sign Out** action.
-   **Contextual Navigation**: Navigation within a view, such as clicking a note in the `NotesList` to go to the `Note Editor View`, or clicking the "New Note" button.

## 5. Key Reusable Components

-   **`AuthForm`**: A standardized form for sign-in and sign-up, handling validation and submission state.
-   **`NotesList`**: Displays a list of notes with search and filter capabilities. Handles its own empty and loading states.
-   **`GraphView`**: An interactive component responsible for rendering nodes and edges, handling user interactions like panning, zooming, and node selection.
-   **`EntityTagInput`**: A specialized input for the Note Editor that allows users to add entities, provides autocomplete suggestions from existing entities, and triggers a creation modal for new ones. Includes a dropdown for setting the relationship type.
-   **`AISuggestionCard`**: A card component to display a single AI suggestion with its type, content, and action buttons (`Accept`/`Reject`).
-   **`ConfirmationModal`**: A generic modal used across the app to confirm destructive actions (e.g., Delete Note, Delete Entity, Delete Account), reducing the risk of accidental data loss.
-   **`SearchBar`**: A reusable search input component with debouncing for performance.
