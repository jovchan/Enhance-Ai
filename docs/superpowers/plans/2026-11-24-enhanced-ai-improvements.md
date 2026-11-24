# Enhanced-AI Platform Improvements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the website into "Enhanced-AI" with verified Google Gemini 2.5 Flash completions, a fully functioning local multi-user auth system, cursor-aware autocomplete, non-destructive AI writing assistance, and article export tools.

**Architecture:** Next.js 15 App Router with client-side React 19 UI state and Next.js server route handlers. API routes communicate with the Google Generative AI SDK using server-side environment variables (`GEMINI_API_KEY`). User accounts and article documents are persisted in browser `localStorage` with relational `userId` filtering.

**Tech Stack:** Next.js 15, React 19, TypeScript 5, Tailwind CSS 4, `@google/genai` 2.4, Lucide React, Motion.

**Spec:** `docs/superpowers/specs/2026-11-24-enhanced-ai-improvements-design.md`

## Global Constraints
- Browser title and application branding must strictly match `"Enhanced-AI"`.
- Gemini API key must be read from `process.env.GEMINI_API_KEY` loaded via `.env.local`.
- Passwords must be validated with minimum 6 characters and valid email syntax.
- All article operations must be strictly scoped to the active user's `userId`.
- No destructive content replacements without explicit user confirmation; provide copy and insert alternatives.
- Clean minimalist UI styling (white background, slate typography, orange/blue/green accents) must be preserved.

## Review Focus
1. **Empty editor headline/outline generation:** When user inputs a title but draft content is blank, AI actions should use the title and return suggestions instead of failing with an error.
2. **Autocomplete caret preservation:** Accepting a ghost suggestion in the middle of a paragraph must insert at cursor position, not append to the end of the text.
3. **Word boundary spacing:** Autocomplete predictions must seamlessly separate with a single space if preceded by alphanumeric text, without creating accidental merged words.
4. **Auth validation edge cases:** Duplicate email registration, wrong password login, and whitespace-only credentials must trigger clear toast warnings without corrupting storage.
5. **Data isolation across accounts:** Logging out from User A and logging in as User B must only display User B's articles.

---

### Task 1: Environment, Dependencies & Branding Alignment

**Files:**
- Create: `.env.local`
- Modify: `app/layout.tsx:4-7`
- Modify: `metadata.json:1-6`
- Modify: `package.json:1-4`
- Modify: `app/page.tsx:540-560`

**Interfaces:**
- Consumes: User's provided Gemini API key via .env.local
- Produces: Correct document metadata, `.env.local` environment variable, updated branding in UI

- [ ] **Step 1: Install project dependencies**
Run `npm install` to ensure `@google/genai`, Next.js, React, and Lucide React are installed into `node_modules`.

- [ ] **Step 2: Create `.env.local` with Gemini API key**
Create `.env.local` containing:
```env
GEMINI_API_KEY=YOUR_GEMINI_API_KEY
```

- [ ] **Step 3: Update `app/layout.tsx` metadata**
Change title from `'My Google AI Studio App'` to `'Enhanced-AI'` and description to `'Enhanced-AI - AI-Assisted Blogging & Writing Platform'`.

- [ ] **Step 4: Update `metadata.json` and `package.json`**
Set `"name": "Enhanced-AI"` in both files.

- [ ] **Step 5: Update header logo text in `app/page.tsx`**
Update header title to render `Enhanced-<span className="text-orange-500 font-bold">AI</span>`.

- [ ] **Step 6: Verify branding and env configuration**
Verify that `.env.local` exists and contains the key, and that `layout.tsx` exports the updated metadata.
Run: `npm run build` to verify clean build without typescript errors.

---

### Task 2: Valid Local Authentication System & User Data Isolation

**Files:**
- Create: `lib/auth.ts`
- Modify: `app/page.tsx:41-80, 114-130, 177-215, 830-890, 895-945`

**Interfaces:**
- Consumes: `enhance_ai_users` and `enhance_ai_user` from `localStorage`
- Produces: `registerUser(name, email, password)`, `loginUser(email, password)`, `logoutUser()`, and `Article.userId` scoping

- [ ] **Step 1: Create auth helper module in `lib/auth.ts`**
Implement data types and helper functions:
```ts
export interface UserAccount {
  uid: string;
  email: string;
  displayName: string;
  passwordHash: string;
  createdAt: string;
}
export function validateEmail(email: string): boolean
export function hashPassword(password: string): string
export function getRegisteredUsers(): UserAccount[]
export function registerUser(displayName: string, email: string, password: string): { user?: UserAccount; error?: string }
export function authenticateUser(email: string, password: string): { user?: UserAccount; error?: string }
```

- [ ] **Step 2: Update `Article` interface to include `userId`**
In `app/page.tsx`, add `userId: string` to `interface Article`.

- [ ] **Step 3: Connect `handleAuthSubmit` to `lib/auth.ts`**
Replace mock credentials logic in `handleAuthSubmit` with calls to `registerUser` and `authenticateUser`:
- Show clear toast on invalid email format.
- Show clear toast on password < 6 characters.
- Show clear toast on duplicate email during signup.
- Show clear toast on wrong password or email not found during login.

- [ ] **Step 4: Scope article database by active `userId`**
- When creating a new article (`handleCreateArticle`), assign `userId: currentUser.uid`.
- Seed default starter articles only for newly registered users, assigned to their `uid`.
- Filter `articles` in Dashboard and state sync so users only see their own articles.
- On logout, clear `currentUser` and return to `LANDING` view.

- [ ] **Step 5: Verification of Auth and Data Scoping**
Verify in browser/node script:
1. Register with password "123" -> Fails with min 6 characters warning.
2. Register "user1@test.com" with "secret123" -> Succeeds.
3. Attempt duplicate register "user1@test.com" -> Fails with "Email already registered".
4. Login with wrong password -> Fails with "Invalid password".
5. Login with "secret123" -> Succeeds and loads user1's articles.

---

### Task 3: Autocomplete Improvements & Cursor-Aware Insertion

**Files:**
- Modify: `app/api/autocomplete/route.ts:50-105`
- Modify: `app/page.tsx:340-415, 1250-1298`

**Interfaces:**
- Consumes: `/api/autocomplete` with `{ text, title }`
- Produces: Contextual completion string with proper spacing; caret-aware insertion in textarea

- [ ] **Step 1: Refine Gemini prompt & formatting in `app/api/autocomplete/route.ts`**
Ensure that the returned suggestion:
- Strips any surrounding quotes returned by the model.
- Maintains appropriate leading whitespace if the preceding character in `text` is not whitespace.
- Uses `gemini-2.5-flash` with temperature 0.2 for quick, tight sentence completions.

- [ ] **Step 2: Update `handleContentChange` to track caret position**
In `app/page.tsx`, record `caretPosition` in state or ref on change/click/keyup.
Send the text slice up to the caret position (last 300 characters) to `/api/autocomplete`.

- [ ] **Step 3: Update `acceptSuggestion` for caret-based insertion**
Replace `editorContent + ghostSuggestion` with:
```ts
const pos = textEditorRef.current?.selectionStart ?? editorContent.length;
const before = editorContent.slice(0, pos);
const after = editorContent.slice(pos);
const newText = before + ghostSuggestion + after;
setEditorContent(newText);
setGhostSuggestion("");
```
Restore focus and set caret to `pos + ghostSuggestion.length`.

- [ ] **Step 4: Verification of Autocomplete**
Run a test request against `/api/autocomplete` to verify it returns non-mocked completions using the configured API key. Verify that typing and pressing Tab inserts text at the cursor position.

---

### Task 4: AI Assistant Flexibility & Non-Destructive Actions

**Files:**
- Modify: `app/api/enhance/route.ts:20-95`
- Modify: `app/page.tsx:415-455, 1320-1455`

**Interfaces:**
- Consumes: `/api/enhance` with `{ action, text, title, tone }`
- Produces: Headlines/Outlines from title even if content is empty; "Copy to Clipboard" and "Insert at Cursor" actions

- [ ] **Step 1: Update `app/api/enhance/route.ts` validation**
Allow `headlines` and `outline` actions to proceed if `text` is empty as long as `title` is non-empty. Use fallback prompt: `"Generate 5 blog headlines for a blog post titled '${title}'"`.

- [ ] **Step 2: Add Non-Destructive Action Buttons in AI Copilot Sidebar**
In `app/page.tsx` AI Copilot Output panel:
- Add **"Copy to Clipboard"** button (copies `aiOutputResult` to system clipboard and shows toast).
- Add **"Insert at Cursor"** button (inserts `aiOutputResult` at current editor cursor position).
- Retain **"Replace Full Article"** as a secondary option with explicit confirmation prompt.

- [ ] **Step 3: Add Auto-save on Navigation**
Ensure clicking the logo or "Dashboard" link in `app/page.tsx` calls `saveCurrentArticle()` before switching views.

- [ ] **Step 4: Add Article Export (.md / .txt) in Editor Toolbar**
In the Editor header toolbar, add an "Export" button with dropdown/options:
- Download as Markdown (`.md`): file containing `# Title\n\nContent`.
- Download as Plain Text (`.txt`).

- [ ] **Step 5: Verification of AI Actions and Export**
Verify in editor:
1. Open blank article titled "Future of Cloud AI".
2. Click "Generate Headlines" -> Successfully generates titles without error.
3. Click "Copy to Clipboard" -> Toast confirmation and text copied.
4. Click "Insert at Cursor" -> Inserts into editor without wiping the title or existing text.
5. Click "Export .md" -> Triggers file download with article title as filename.

---

### Task 5: Build Verification, Regression Testing & Final Polish

**Files:**
- Review all files: `app/layout.tsx`, `app/page.tsx`, `lib/auth.ts`, `app/api/autocomplete/route.ts`, `app/api/enhance/route.ts`.

- [ ] **Step 1: Run type checking and linter**
Run: `npm run lint` and `npx tsc --noEmit`
Expected: 0 errors.

- [ ] **Step 2: Run production build**
Run: `npm run build`
Expected: Successful Next.js production build output.

- [ ] **Step 3: Verification of all requirements**
1. Document title displays "Enhanced-AI" in browser tab.
2. Gemini API key is active and functional.
3. Auth system correctly registers, validates, logs in, logs out, and isolates articles per user.
4. Autocomplete and AI Copilot tools operate smoothly with non-destructive actions.
