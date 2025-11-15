# Authentication Module Technical Specification

## 1. Introduction

This document describes the architecture and implementation of the authentication module for the ClassicInsight application. The system will be based on Supabase Auth and integrated with the Astro framework, in accordance with the requirements specified in the PRD (US-001, US-002, US-003, US-004) and the defined technology stack.

## 2. User Interface Architecture (Frontend)

### 2.1. New Pages (Astro)

New pages will be introduced in the `src/pages/` directory to handle authentication processes. These pages will be responsible for rendering appropriate forms and React components.

- **`src/pages/login.astro`**: Login page.
  - Will display the login form.
  - Will be available only to non-logged-in users. Logged-in users attempting to access it will be redirected to the home page (`/`).
- **`src/pages/register.astro`**: Registration page.
  - Will display the registration form.
  - Available only to non-logged-in users.
- **`src/pages/reset-password.astro`**: Password reset page.
  - Will display a form to enter an email address to send a reset link.
- **`src/pages/update-password.astro`**: Password update page.
  - Available after clicking the reset link in the email. Supabase Auth will handle this routing.

### 2.2. New Components (React)

New React components will be created in the `src/components/auth/` directory, which will contain form logic and Supabase communication.

- **`LoginForm.tsx`**: Login form component.
  - Fields: `email`, `password`.
  - Will include a link to the password reset page (`/reset-password`).
  - Client-side validation (e.g., using `zod` and `react-hook-form`):
    - Email format check.
    - Check if password is not empty.
  - Form submission handling:
    - Call `supabase.auth.signInWithPassword()`.
    - Upon successful login, redirect to the main page (`/dashboard`).
    - Display error messages (e.g., "Invalid email or password").
- **`RegisterForm.tsx`**: Registration form component.
  - Fields: `email`, `password`, `confirmPassword`, `aiConsent` (checkbox).
  - Validation:
    - Email format correctness.
    - Minimum password length (8 characters, as per US-001).
    - Password match in `password` and `confirmPassword` fields.
    - Required `aiConsent` checkbox selection.
  - Submission handling:
    - Call `supabase.auth.signUp()`.
    - Upon successful registration, Supabase will send a verification email. The user will be informed about the need to confirm their email address.
    - Automatic login and redirection to the dashboard page (`/dashboard`) after clicking the verification link.
- **`ResetPasswordForm.tsx`**: Password reset form component.
  - Field: `email`.
  - Email format validation.
  - Submission handling:
    - Call `supabase.auth.resetPasswordForEmail()`.
    - Display a success message about sending the link.
- **`UpdatePasswordForm.tsx`**: Password update form component.
  - Fields: `password`, `confirmPassword`.
  - Validation (same as registration form).
  - Submission handling:
    - Call `supabase.auth.updateUser()`.
    - Upon successful password change, redirect to login page with success message.

### 2.3. Modification of Existing Components and Layouts

- **`src/layouts/Layout.astro`**: The main application layout will be modified.
  - Will check the user's login status based on the session read from middleware.
  - Conditionally renders components:
    - For logged-in users: `TopNavigationBar.tsx` with user menu.
    - For non-logged-in users: Simplified header with login and registration links.
- **`src/components/layout/TopNavigationBar.tsx`**:
  - Will be extended with `UserProfileDropdown.tsx`.
- **`src/components/layout/UserProfileDropdown.tsx`**: New component.
  - Will display user's avatar/email.
  - Will contain a "Logout" button that calls `supabase.auth.signOut()` and redirects to the login page.

### 2.4. Scenarios and State Handling

- **Logged-in state (auth)**: User has access to protected pages (`/dashboard`, `/notes`, `/entities`). `Layout.astro` renders the full interface.
- **Non-logged-in state (non-auth)**: User has access only to public pages (`/login`, `/register`). Attempting to access a protected page results in redirection to `/login`.

## 3. Backend Logic

The application uses Astro's `server` mode, which allows server-side logic. Middleware will play a key role.

### 3.1. Middleware (`src/middleware/index.ts`)

Middleware will run on every request and will be responsible for managing user sessions.

- **Session Management**:
  - Using `@supabase/ssr` (or similar package for Astro), middleware will read and manage sessions based on cookies.
  - Will create a Supabase client for the given request and place it in `context.locals` to make it available in API endpoints and `.astro` pages: `context.locals.supabase` and `context.locals.session`.
- **Page Protection**:
  - Will check if the user is on a protected page and has an active session.
  - If the user is not logged in and tries to access a protected page (e.g., `/notes`), they will be redirected to the login page (`/login`).
  - If a logged-in user tries to access `/login` or `/register`, they will be redirected to the home page.

### 3.2. API Endpoints

Authentication logic will be handled by dedicated API endpoints in `src/pages/api/auth/`. The frontend components will communicate with these endpoints instead of directly calling the Supabase SDK, ensuring that secrets are kept on the server. The backend will use the session verified by middleware.

### 3.3. Validation and Error Handling

- Form validation occurs mainly on the client-side (React), providing quick feedback to the user.
- Supabase JS SDK returns detailed errors, which will be caught in React components and displayed to the user in readable messages (e.g., "User with this email already exists").

## 4. Authentication System (Supabase Auth)

### 4.1. Configuration

- Email templates (registration confirmation, password reset) will be configured in the Supabase dashboard.
- Environment variables `SUPABASE_URL` and `SUPABASE_ANON_KEY` will be set in the `.env` file.

### 4.2. Astro Integration

- **Supabase Client**: An instance of the Supabase client will be created in `src/db/supabase.client.ts`, which will be used in client-side components.
- **SSR Session Handling**: According to the official Supabase documentation for Astro (using `@supabase/ssr`), sessions will be managed using cookies.
  - Middleware will be responsible for token refresh and passing sessions to rendered pages.
  - `.astro` pages will be able to access sessions through `Astro.locals.session` and make rendering decisions based on that.

### 4.3. Authentication Processes

- **Registration**:
  1.  User fills out the form in `RegisterForm.tsx`.
  2.  Component calls `supabase.auth.signUp()`.
  3.  Supabase creates a new user with "pending verification" status and sends an email.
  4.  User clicks the verification link.
  5.  Supabase confirms the email address, and the user is redirected to the application as logged in.
- **Login**:
  1.  User fills out `LoginForm.tsx`.
  2.  Component calls `supabase.auth.signInWithPassword()`.
  3.  Supabase verifies credentials, creates a session, and returns tokens (saved in cookies).
  4.  Application redirects the user to the home page.
- **Logout**:
  1.  User clicks "Logout" in `UserProfileDropdown.tsx`.
  2.  `supabase.auth.signOut()` is called.
  3.  Session (cookies) is removed.
  4.  User is redirected to the login page.
- **Password Reset**:
  1.  User provides email in `ResetPasswordForm.tsx`.
  2.  `supabase.auth.resetPasswordForEmail()` is called.
  3.  Supabase sends an email with a reset link.
  4.  User clicks the link and is taken to the password change page.
  5.  In `UpdatePasswordForm.tsx`, calls `supabase.auth.updateUser()` to set the new password.
