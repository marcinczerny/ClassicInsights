# ClassicInsight

## Table of Contents

- [Project Description](#project-description)
- [Tech Stack](#tech-stack)
- [Getting Started Locally](#getting-started-locally)
- [Available Scripts](#available-scripts)
- [Project Scope](#project-scope)
- [Project Status](#project-status)
- [License](#license)

## Project Description

ClassicInsight is a Minimum Viable Product (MVP) web application designed for literature and philosophy enthusiasts. Its primary goal is to facilitate the exploration, analysis, and comparison of philosophical works and literary classics. The application allows users to create and manage notes, which can then be enriched by artificial intelligence with related quotes, summaries, and key ideas. A key feature is the visualization of connections between notes and concepts in the form of an interactive mind map.

## Tech Stack

The project is built with a modern, component-based architecture. The main technologies used are:

- **Framework**: [Astro 5](https://astro.build/)
- **UI Library**: [React 19](https://react.dev/)
- **Language**: [TypeScript 5](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/)
- **UI Components**: [Shadcn/ui](https://ui.shadcn.com/)
- **Database**: [Supabase](https://supabase.com/) (as inferred from project structure guidelines)
- **Testing**:
  - **Unit/Integration Tests**: [Vitest](https://vitest.dev/), [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
  - **E2E Tests**: [Playwright](https://playwright.dev/)
  - **API Mocking**: [Mock Service Worker (MSW)](https://mswjs.io/)

## Testing

The project includes comprehensive testing setup following modern testing practices:

### Test Types

- **Unit Tests**: Test individual functions, components, and utilities in isolation using Vitest and React Testing Library
- **Integration Tests**: Test component integration with mocked API calls using MSW
- **E2E Tests**: Test complete user flows in the browser using Playwright with Chromium

### Running Tests

```bash
# Unit tests
npm test                    # Run all unit tests
npm run test:watch         # Run tests in watch mode
npm run test:ui            # Open Vitest UI for interactive testing
npm run test:coverage      # Run tests with coverage report

# Integration tests
npm run test:integration   # Run integration tests

# E2E tests
npm run test:e2e           # Run E2E tests
npm run test:e2e:ui        # Open Playwright UI
npm run test:e2e:debug     # Debug E2E tests
npm run test:e2e:headed    # Run with visible browser
```

### Test Structure

- Unit tests are located alongside source files as `*.test.ts` or `*.test.tsx`
- Integration tests use `*.integration.test.ts` pattern
- E2E tests are in the `e2e/` directory as `*.spec.ts` files
- Test utilities and mocks are in `src/test/` directory

### Coverage Goals

The project aims to maintain high test coverage:
- Branches: 70%
- Functions: 70%
- Lines: 70%
- Statements: 70%

## Getting Started Locally

To set up and run the project on your local machine, follow these steps.

### Prerequisites

- [Node.js](https://nodejs.org/) (LTS version recommended)
- [npm](https://www.npmjs.com/) (comes with Node.js)

### Installation & Setup

1.  **Clone the repository:**
    ```sh
    git clone https://github.com/marcinczerny/classic-insights.git
    cd classic-insights
    ```

2.  **Install dependencies:**
    ```sh
    npm install
    ```

3.  **Set up environment variables:**
    The project requires a connection to a Supabase backend. Create a `.env` file in the root of the project by copying the example structure below.

    ```env
    # .env

    # Public Supabase URL
    PUBLIC_SUPABASE_URL="your_supabase_project_url"

    # Public Supabase Anon Key
    PUBLIC_SUPABASE_ANON_KEY="your_supabase_anon_key"
    ```

4.  **Run the development server:**
    ```sh
    npm run dev
    ```
    The application will be available at `http://localhost:4321`.

## Available Scripts

The following scripts are available in the `package.json`:

| Script       | Description                                        |
| ------------ | -------------------------------------------------- |
| `npm run dev`    | Starts the development server with hot-reloading.  |
| `npm run build`  | Builds the application for production.             |
| `npm run preview`| Serves the production build locally for preview.   |
| `npm run lint`   | Lints the codebase for errors.                     |
| `npm run lint:fix`| Lints the codebase and automatically fixes issues. |
| `npm run format` | Formats the code using Prettier.                   |
| `npm test`       | Runs unit tests with Vitest.                       |
| `npm run test:watch`| Runs unit tests in watch mode.                     |
| `npm run test:ui`| Opens Vitest UI for interactive testing.            |
| `npm run test:coverage`| Runs tests with coverage report.                   |
| `npm run test:integration`| Runs integration tests.                            |
| `npm run test:e2e`| Runs end-to-end tests with Playwright.             |
| `npm run test:e2e:ui`| Opens Playwright UI for E2E testing.               |
| `npm run test:e2e:debug`| Runs E2E tests in debug mode.                      |
| `npm run test:e2e:headed`| Runs E2E tests with visible browser.               |

## Project Scope

This project is currently being developed as an MVP. The scope is defined as follows:

### Key Features (MVP)

-   **User Management**: Secure user registration, login, logout, and password reset.
-   **Note Management**: Create, read, update, and delete text-based notes with Markdown support.
-   **Entity Tagging**: Add entities (e.g., Author, Work, Idea) as tags to notes.
-   **AI Enrichment**: Manually trigger AI analysis on a note to get suggestions for related quotes, summaries, and new graph nodes.
-   **Mind Map Visualization**: View notes, entities, and their relationships as an interactive graph.
-   **Search**: Filter notes based on their assigned tags.

### Out of Scope for MVP

The following features are not planned for the initial release but may be considered in the future:

-   Social features like sharing notes or graphs.
-   Advanced multimedia support (images, audio).
-   Fully automated AI text synthesis.
-   Importing notes from external applications.
-   Real-time collaboration.
-   A public API.

## Project Status

**In Development**: This project is actively under development and is currently focused on delivering the core features defined in the MVP scope.

## License

MIT
