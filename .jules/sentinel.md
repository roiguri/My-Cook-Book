# Sentinel Journal

## 2025-10-18 - DOM XSS in Recipe Component

**Vulnerability:** Found `innerHTML` being used to render recipe ingredients (`unit`, `item`) without sanitization in `RecipeComponent`. This allowed potential XSS if a user submitted malicious HTML in ingredient fields.
**Learning:** Checking that input is a "string" (type validation) is not sufficient for security. Data stored in Firestore should not be trusted implicitly when rendering to DOM.
**Prevention:** Prefer `textContent` or `document.createTextNode` over `innerHTML` for text content. If `innerHTML` is required for rich text, use a sanitization library like DOMPurify.

## 2025-10-18 - Insecure Firestore Rules (Privilege Escalation)

**Vulnerability:** Found overly permissive Firestore rules (`allow read: if true; allow write: if request.auth != null;`). This allowed any authenticated user to modify any document in the database, including escalating their own privileges by modifying their user role to 'manager'.
**Learning:** Default "authenticated write" rules are insufficient for production applications with role-based access control. Security rules must explicitly enforce data ownership and role validation.
**Prevention:** Implement granular security rules that check `request.auth.uid` against document ownership fields and validate user roles using `get()` lookups for sensitive operations.

## 2025-10-18 - Privilege Escalation on Creation

**Vulnerability:** Even if `update` rules are strict, an `allow create` rule that doesn't validate data can allow privilege escalation. Specifically, a user could create their own profile with `role: 'manager'`.
**Learning:** Security rules must validate data on `create` as strictly as on `update`. Don't assume default values from client code will be respected by an attacker.
**Prevention:** Explicitly validate or enforce restricted fields in `create` rules (e.g., `request.resource.data.role == 'user'`).
