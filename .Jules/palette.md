## 2025-10-18 - [Auth Loading States]
**Learning:** Async form submissions (login/signup) were missing visual feedback, leading to potential user confusion and multiple submissions.
**Action:** Always wrap async submit handlers in try/finally blocks and toggle button state (disabled/text change/aria-busy) to provide immediate feedback. Use `aria-busy` for accessibility.
