<authentication_analysis>

### 1. Authentication Flows

Based on the `prd.md` and `auth-spec.md` documents, the key authentication flows are:

- **User Registration:** A new user signs up with an email and password, provides consent, and verifies their email address.
- **User Login:** An existing user logs in with their credentials.
- **User Logout:** A logged-in user signs out.
- **Password Reset:** A user who has forgotten their password can reset it via email.
- **Session Management:** The system manages the user's session, including token validation and refresh, for both client-side and server-side requests.

### 2. Main Actors and Interactions

- **Browser (React Components):** The user interacts with React forms for login, registration, etc. It communicates with the Supabase Auth service directly for client-side authentication operations.
- **Astro (Middleware & Server-side Pages):** The Astro backend, specifically the middleware, intercepts every request. It uses cookies to manage the user's session, validates tokens, and protects routes. It also renders pages server-side, providing session information to them.
- **Supabase Auth:** The external BaaS provider that handles the core authentication logic, including user management, issuing JWTs, and sending emails (verification, password reset).

### 3. Token Verification and Refresh

- Supabase Auth issues a pair of tokens: an `access_token` (short-lived) and a `refresh_token` (long-lived).
- The tokens are stored securely in the browser's cookies.
- The Astro middleware inspects the `access_token` on every server-side request.
- If the `access_token` is expired, the Supabase SDK (via `@supabase/ssr` in the middleware) automatically uses the `refresh_token` to get a new pair of tokens from Supabase Auth. This process is seamless to the user.
- The client-side Supabase SDK also handles token refresh automatically for client-side operations.

### 4. Description of Authentication Steps

1.  **Registration:** The user submits the registration form. The browser-side React component calls `supabase.auth.signUp()`. Supabase Auth creates the user and sends a verification email. After the user clicks the link, they are authenticated and redirected.
2.  **Login:** The user submits the login form. The browser calls `supabase.auth.signInWithPassword()`. Supabase Auth verifies the credentials and returns tokens, which are set as cookies. The user is redirected to the dashboard.
3.  **Authenticated Request to Astro Page:**
    - The browser sends a request to an Astro page (e.g., `/dashboard`).
    - The Astro middleware intercepts the request, reads the auth cookies, and validates the session with Supabase.
    - If the session is valid, the middleware passes the session data to the page via `context.locals` and allows the request to proceed.
    - If the session is invalid (or missing), the middleware redirects the user to the login page.
4.  **Logout:** The user clicks the logout button. The browser calls `supabase.auth.signOut()`. The SDK clears the session cookies, and the user is redirected to the login page.
    </authentication_analysis>

```mermaid
sequenceDiagram
    autonumber

    participant Browser as Browser (React)
    participant Middleware as Middleware (Astro)
    participant Supabase as Supabase Auth

    %% User Registration Flow
    Note over Browser, Supabase: Scenario 1: User Registration

    activate Browser
    Browser->>Browser: User fills registration form<br/>and clicks "Register"
    Browser->>Supabase: Call `signUp(email, password)`
    deactivate Browser

    activate Supabase
    Supabase->>Supabase: Create user and send<br/>verification email
    Supabase-->>Browser: Success response
    deactivate Supabase

    Note over Browser, Supabase: User clicks link in email,<br/>verification and login follows

    %% User Login Flow
    Note over Browser, Supabase: Scenario 2: User Login

    activate Browser
    Browser->>Browser: User fills login form<br/>and clicks "Login"
    Browser->>Supabase: Call `signInWithPassword(email, password)`
    deactivate Browser

    activate Supabase
    Supabase->>Supabase: Verify credentials<br/>and create session (JWT)
    Supabase-->>Browser: Return `access` and `refresh` tokens
    deactivate Supabase

    activate Browser
    Browser->>Browser: Save tokens to cookies
    Browser->>Middleware: Redirect to protected<br/>page (e.g. /dashboard)
    deactivate Browser

    %% Accessing Protected Route
    Note over Browser, Supabase: Scenario 3: Accessing Protected Page

    activate Middleware
    Middleware->>Middleware: Read tokens<br/>from request cookies
    Middleware->>Supabase: Verify access token
    deactivate Middleware

    activate Supabase
    alt Token is valid
        Supabase-->>Middleware: Confirm session validity
    else Token expired
        Supabase->>Supabase: Use `refresh_token` to<br/>generate new token pair
        Supabase-->>Middleware: Return new, valid session
    else Session invalid
        Supabase-->>Middleware: Deny access
    end
    deactivate Supabase

    activate Middleware
    alt Session is valid
        Middleware->>Middleware: Render page and<br/>pass session data
    else Session invalid
        Middleware->>Browser: Redirect to<br/>login page (/login)
    end
    Middleware-->>Browser: Return HTML response
    deactivate Middleware

    %% User Logout Flow
    Note over Browser, Supabase: Scenario 4: Logout

    activate Browser
    Browser->>Browser: User clicks "Logout"
    Browser->>Supabase: Call `signOut()`
    deactivate Browser

    activate Supabase
    Supabase->>Supabase: Invalidate session
    Supabase-->>Browser: Confirm logout
    deactivate Supabase

    activate Browser
    Browser->>Browser: Remove tokens from cookies
    Browser->>Middleware: Redirect to<br/>login page
    deactivate Browser
```
