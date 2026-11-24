# Design Doc: Enhanced-AI Platform Improvements & Bugfixes

- **Date:** 2026-11-24
- **Topic:** Branding, Gemini API Integration, Local Auth System, and Editor Bugfixes
- **Status:** Proposed (Pending User Approval)

---

## 1. Intent & Context
Enhanced-AI is a minimalist, distraction-free blogging and writing web platform. This design addresses critical bugs, connects the real Google Gemini API, updates application branding to "Enhanced-AI", and replaces the mockup authentication with a valid, secure client-side user management system (Option 1).

---

## 2. Goals, Non-Goals, & Anti-Goals

### Goals
1. **Title & Branding:** Update browser title, metadata, header logo, and footer to `"Enhanced-AI"`.
2. **Gemini API Integration:** Set up `.env.local` with the user's Gemini API key (`YOUR_GEMINI_API_KEY`) and verify model `gemini-2.5-flash` powering both autocomplete and AI writing assistance.
3. **Valid Local Authentication (Option 1):**
   - Maintain a local user registry (`enhance_ai_users`) in `localStorage`.
   - Real Sign-up: Email format validation, password minimum length (6+ chars), duplicate email check.
   - Real Log-in: Verify email existence and password match with clear user feedback.
   - User Data Isolation: Link each article to `userId` so each user has their own private drafts and published posts.
4. **Editor & Autocomplete Fixes:**
   - Insert autocomplete ghost suggestions at the active cursor/caret position rather than blindly appending to the document end.
   - Ensure proper word spacing between existing text and predicted completions.
   - Trigger auto-save immediately whenever navigating back to the dashboard or clicking navigation links.
5. **AI Assistant Enhancements:**
   - Allow headline and outline generation based on title even when document body is empty.
   - Replace destructive "Overwrite Paper" with "Copy to Clipboard", "Insert at Cursor", and optional "Replace All" with confirmation.
   - Add Article Export (Download as Markdown / `.txt`) for instant blogger utility.

### Non-Goals
- Cloud database / Firebase backend setup (user selected Option 1 for zero-config local persistence).
- Heavy rich-text styling overhauls (preserve the bright, clean minimalist aesthetic).

### Anti-Goals
- Breaking existing responsive layouts or UI themes.
- Destructive content overwrites without user intent.

---

## 3. Approaches Evaluated

- **Approach 1: Valid Local User Management & Scoped Storage (Chosen)**
  - *Pros:* Fully self-contained, no external cloud credentials needed, works immediately out of the box, provides realistic login/signup flow with user-isolated articles.
  - *Cons:* Data is scoped to the browser/device.
  - *Decision:* Selected by the user.

- **Approach 2: Full Firebase Auth Integration**
  - *Pros:* Cloud synchronization.
  - *Cons:* Requires external Firebase project creation, API keys, and network auth rules.
  - *Decision:* Not needed for the current scope.

- **Approach 3: Remove Auth Screen Completely**
  - *Pros:* Instant access without login screens.
  - *Cons:* Eliminates personal accounts, profile display, and user-specific workspace separation.
  - *Decision:* User preferred keeping auth via Option 1.

---

## 4. Detailed Specification of Changes

### A. Environment & Branding
1. Create `.env.local` with:
   ```env
   GEMINI_API_KEY=YOUR_GEMINI_API_KEY
   ```
2. Update `app/layout.tsx`:
   - `metadata.title = "Enhanced-AI"`
   - `metadata.description = "Enhanced-AI: The AI-assisted blogging and writing platform."`
3. Update `metadata.json` and `package.json` names to `Enhanced-AI`.
4. Update `app/page.tsx` navbar logo text: `Enhanced-<span className="text-orange-500 font-bold">AI</span>`.

### B. Authentication System (Option 1)
1. **Data Model:**
   ```ts
   interface StoredUser {
     uid: string;
     email: string;
     displayName: string;
     passwordHash: string; // encoded/hashed locally
     createdAt: string;
   }
   ```
2. **Signup Flow:**
   - Validates email regex and password length >= 6.
   - Checks if email already exists in `enhance_ai_users`.
   - On success: registers user, creates session in `enhance_ai_user`, seeds initial welcome articles for this new user, and redirects to Dashboard.
3. **Login Flow:**
   - Looks up email in `enhance_ai_users`.
   - Compares password; shows descriptive toast error if incorrect or if email is not found.
   - On success: sets active session and loads user's scoped articles.
4. **Data Isolation:**
   - Articles store `userId: string`.
   - Dashboard only renders articles matching `currentUser.uid`.

### C. Autocomplete & API Robustness
1. In `app/api/autocomplete/route.ts`:
   - Keep `gemini-2.5-flash`.
   - Ensure suggestions do not double-up or strip needed leading whitespace.
2. In `app/page.tsx`:
   - In `acceptSuggestion`: calculate slice `editorContent.slice(0, caretPos) + ghostSuggestion + editorContent.slice(caretPos)` and update caret.
   - In `handleContentChange`: capture text up to current caret position for more accurate context.

### D. AI Copilot Tools & Editor Quality
1. In `app/api/enhance/route.ts`:
   - Allow `action === "headlines"` or `action === "outline"` when `text` is empty but `title` is provided.
2. In `app/page.tsx`:
   - AI action buttons: Add "Copy to Clipboard" and "Insert at Cursor".
   - Navigation: Add auto-save call before `setCurrentView("DASHBOARD")` or `setCurrentView("LANDING")`.
   - Add "Export as .md" button in Editor header for easy blogging export.

---

## 5. Verification Plan
1. **Build & Lint:** Run `npm run build` and `npm run lint` to ensure 0 TypeScript or build errors.
2. **Auth Testing:**
   - Test Sign Up with invalid email / short password -> expect validation error.
   - Test Sign Up with valid data -> expect success and dashboard entry.
   - Test Logout -> expect landing page view.
   - Test Log In with wrong password -> expect error toast.
   - Test Log In with correct password -> expect successful login.
3. **Gemini Live Testing:**
   - Test typing in editor -> expect live Gemini autocomplete suggestions on Tab.
   - Test Tone Tuner, Headlines, and Outlines -> verify real Gemini output returned and can be inserted/copied.
4. **Metadata & Tab Check:**
   - Verify browser document title displays "Enhanced-AI".
