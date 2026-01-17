# Our Kitchen Chronicles - Manual Testing Checklist

## Testing Workflow

### Release Pipeline

```
feature/bug branch → development → staging → main (production)
        ↓                ↓            ↓         ↓
   Preview Deploy   Dev Deploy  Stage Deploy  Production
```

### Pre-Production Testing Checklist (STAGING REQUIRED)

**Before merging staging → main:**

- [ ] **Staging Deployment** - Merge development → staging, verify deployment succeeds
- [ ] **Full Feature Testing** - Run complete 🆕 NEW features test suite on staging
- [ ] **Critical Regression** - Run 🔴 Critical EXISTING features regression tests
- [ ] **Cross-Browser Testing** - Test on Desktop (Chrome/Firefox) + Mobile (iOS/Android)
- [ ] **User Role Testing** - Test all user roles (Guest/User/Manager)
- [ ] **Console Verification** - Check browser DevTools for errors/warnings
- [ ] **Performance Check** - Verify page load times and responsiveness
- [ ] **Bug Documentation** - Document any issues → fix in development → re-test staging
- [ ] **Sign-Off** - Get approval from tester before merging to main

**Production Deployment (main):**

- [ ] **Merge to Main** - Only merge from staging after all checks pass
- [ ] **Smoke Test** - Quick verification of 🆕 NEW features in production
- [ ] **Critical Path Test** - Quick verification of 🔴 Critical EXISTING features
- [ ] **Monitor Deployment** - Watch for errors in production logs
- [ ] **Archive Tests** - Move passing 🆕 NEW tests to ✅ EXISTING section

**⚠️ CRITICAL RULE**: Never merge to `main` without successful staging verification!

---

## Testing Priorities Legend

- 🔴 **Critical** - Must test before production release
- 🟡 **High** - Important functionality, should test
- 🟢 **Medium** - Standard functionality, test if time permits

## Feature Categories

- 🆕 **NEW** - Features added in current release (staging → main)
- ✅ **EXISTING** - Baseline regression test suite (reused each release)

---

## 🆕 NEW FEATURES IN THIS RELEASE (staging → main)

> **Focus Area**: Test these comprehensively on STAGING before merging to main. After production deployment, integrate passing tests into EXISTING section.

**Release Info:**

- **Key areas affected**:
  - **Recipe Population**: Auto-fill from image (Magic Wand).
  - **Security**: Strict Firestore/Storage rules & Dependency updates (`qs`).
  - **Performance**: Recipe Grid N+1 fix.
  - **Router & Arch**: Lazy loading Auth components, Infinite redirect loop fixes.
  - **UI/UX**: Auth Avatar 3D styling, Recipe Card "stretched link", Stable scrollbars.
  - **Accessibility**: Modal Focus Trapping.
  - **Bug Fixes**: Manager Dashboard Double Image.

---

### 1. Auto-Population (Magic Wand)

**Impact**: Import Recipe Modal

- [ ] 🔴 **Magic Wand Button** - Verify button appears in Import Modal and has correct styling.
- [ ] 🔴 **Image Analysis** - Upload an image via the Magic Wand and verify analysis triggers (loading state).
- [ ] 🔴 **Field Population** - Verify Recipe Name, Cooking Time, and Ingredients are populated correctly from the analyzed image.
- [ ] 🟡 **Error Handling** - Verify appropriate error message if analysis fails or image is invalid.

### 2. Router & Lazy Loading (NEW)

**Impact**: Application Architecture, Performance

- [ ] 🔴 **Lazy Loading** - Open Network tab, clear it. Refresh page. Verify "Auth" code chunk (e.g., `auth-*.js`) is **NOT** loaded.
- [ ] 🔴 **Lazy Loading Interaction** - Click "Login". Verify "Auth" chunk is loaded **on demand** and login modal opens.
- [ ] 🔴 **Protected Routes** - Go to `/propose` (while logged out). Verify redirect to Home (or Login) without infinite loop.
- [ ] 🟡 **Navigation** - Open Login modal -> Click Browser Back button. Verify modal closes effectively (or handles history correctly).

### 3. Security & Infrastructure

**Impact**: General App Security, Cloud Functions

- [ ] 🔴 **Strict Rules (User)** - Log in as regular user. Create a recipe. Verify success.
- [ ] 🔴 **Strict Rules (Guest)** - Log out (Guest). Try to save a recipe (via console or UI if accessible). Verify permission denied error.
- [ ] 🔴 **Cloud Functions** - Verify Cloud Functions (e.g., image resizing or specialized tasks) still execute correctly after `qs` update.

### 4. UI/UX & Interactivity

**Impact**: Home, Header, Recipe Cards

- [ ] 🟡 **3D Auth Avatar** - Hover over user avatar. Verify 3D tilt effect. Click and verify menu opens.
- [ ] 🟡 **Recipe Card Stretched Link** - Hover over _any part_ of a recipe card. Verify pointer cursor. Click anywhere on card -> navigates to recipe.
- [ ] 🟡 **Layout Stability** - Open a modal (e.g., Login). Verify page background does **not** shift (check scrollbar gutter).

### 5. Accessibility

**Impact**: Modals

- [ ] 🔴 **Focus Trap** - Open any modal (Import, Login, etc.). Press `Tab` repeatedly. Verify focus stays **inside** the modal and does not escape to background content.
- [ ] 🟡 **Focus Return** - Close the modal (Esc or Close button). Verify focus returns to the element that opened it.

### 6. Performance

**Impact**: Home Page, Category Page

- [ ] 🔴 **Recipe Grid** - Load Home Page. Check Network tab. Verify no "waterfall" of individual requests for recipe favorites (N+1 probem fixed).
- [ ] 🟢 **Rendering** - Verify grid renders smoothly without visible staggering of cards.

### 7. Bug Fixes

**Impact**: Manager Dashboard

- [ ] 🔴 **Double Image** - (Manager) Open Recipe Preview. Verify main image appears only **once**.

---

## ✅ EXISTING FEATURES (Baseline Regression Test Suite)

> **Purpose**: Core functionality that should work in every release. Test critical paths to ensure new features didn't break existing functionality.

### 1. Home Page (index.html)

#### 🔴 Critical

- [ ] Page loads correctly with all content visible
- [ ] Navigation menu displays and links work
- [ ] Featured recipes section displays recipe cards
- [ ] Recipe cards are clickable and navigate to recipe page
- [ ] Firebase connection established (no console errors)
- [ ] **Search Navigation** - Single search result navigates directly to recipe page
- [ ] **Search Toast** - Toast notification appears ("Found 1 recipe...") for single result

#### 🟡 High

- [ ] Logo link stays on home page (doesn't navigate away)
- [ ] Auth avatar shows correct state (login prompt vs user avatar)
- [ ] Page is responsive on mobile devices
- [ ] All category jars display correctly
- [ ] Category jars link to correct category pages

#### 🟢 Medium

- [ ] Search bar functions (accepts input, triggers search)
- [ ] Search input clears after search is performed

---

### 2. Categories Page (categories.html)

#### 🔴 Critical

- [ ] Recipe grid displays recipe cards properly
- [ ] Recipe cards navigate to individual recipe pages
- [ ] "All categories" option shows all approved recipes
- [ ] All categories appear in filter dropdown and work correctly

#### 🟡 High

- [ ] Category filtering works (clicking category shows only those recipes)
- [ ] Search functionality filters recipes correctly
- [ ] Pagination works (next/previous buttons, page info)
- [ ] Filter modal opens and applies filters correctly
- [ ] Categories nav button resets filters

#### 🟢 Medium

- [ ] Search input clears after search is performed
- [ ] Page maintains selected category when navigating back
- [ ] Move to favorites with filter/nav button works
- [ ] Filters preserved on category change
- [ ] Favorites filter appears for logged-in users

---

### 3. Recipe Page (recipe-page.html)

#### 🔴 Critical

- [ ] Recipe details display correctly (name, ingredients, instructions)
- [ ] **Security**: Content handles special characters safely (XSS check)
- [ ] Recipe images load and display properly (carousel)
- [ ] Ingredients list is readable and properly formatted
- [ ] Step-by-step instructions display in correct order
- [ ] Page works for both logged-in and guest users
- [ ] **Image Proposal** - Image proposal modal opens from menu (for users)
- [ ] **Browser History** - Browser history shows correct recipe names

#### 🟡 High

- [ ] Both flat and sectioned ingredients displayed correctly
- [ ] Both flat and sectioned instructions displayed correctly
- [ ] Stage numbering and formatting is correct for multi-stage instructions
- [ ] Check recipes with one or multiple images
- [ ] **Recipe Scroller** - Images scroll smoothly in new scroller component
- [ ] **Modal Responsiveness** - Images/Modals scroll properly on mobile
- [ ] Change amount of dishes (servings adjuster) works
- [ ] Check recipes with media instructions
- [ ] Check media instructions on fullscreen
- [ ] **Tab Title** - Tab title updates to recipe name

#### 🟢 Medium

- [ ] Cooking time and difficulty level shown correctly
- [ ] Back navigation returns to previous page
- [ ] Recipe metadata (category, tags) displays correctly
- [ ] Recipes without main ingredient display correctly (field optional)

---

### 4. Profile Page (profile.html)

#### 🔴 Critical

- [ ] User favorites display correctly
- [ ] Recipe cards navigate to recipe pages
- [ ] Page redirects non-logged-in users appropriately

#### 🟡 High

- [ ] Category filtering works on favorites
- [ ] Search functionality filters favorite recipes
- [ ] Return gets back to favorites (not categories)
- [ ] Remove from favorites button works
- [ ] Can move to categories page by removing the favorites filter
- [ ] Can move to categories page by pressing the categories nav button

#### 🟢 Medium

- [ ] Empty favorites state displays appropriate message
- [ ] Pagination works for large favorite lists

---

### 5. Propose Recipe Page (propose-recipe.html)

#### 🔴 Critical - Basic Form

- [ ] Form displays all required fields (name, ingredients, instructions, etc.)
- [ ] Form validation prevents submission with missing required fields
- [ ] Submit button sends recipe for approval
- [ ] Success message displays after submission
- [ ] Form resets after successful submission
- [ ] Page requires user authentication
- [ ] If closing the modal without logging in - reroutes to home
- [ ] If logging in returns to the same page

#### 🟡 High - Ingredients

- [ ] Add/remove ingredient lines works correctly in flat mode
- [ ] Add/remove ingredient sections works correctly (multi-category mode)
- [ ] Section titles for ingredients can be added/edited
- [ ] Toggle between flat and sectioned ingredient modes
- [ ] Minimum 2 sections with titles when in sectioned mode
- [ ] Data persists when toggling between modes
- [ ] Component-level validation for ingredients (sectioned mode)

#### 🟡 High - Instructions

- [ ] Add/remove instruction steps works correctly in flat mode
- [ ] Add/remove instruction stages works correctly (multi-stage mode)
- [ ] Stage titles for instructions can be added/edited
- [ ] Toggle between flat and multi-stage instruction modes
- [ ] Minimum 2 stages with titles when in multi-stage mode
- [ ] Data persists when toggling between modes
- [ ] Component-level validation for instructions (staged mode)

#### 🟡 High - Form Validation

- [ ] Main ingredient field is OPTIONAL (can be left blank)
- [ ] Validation shows specific error messages per field
- [ ] Invalid fields are highlighted with visual indicators
- [ ] Error highlighting clears when user starts typing

#### 🟢 Medium - Form Protection

- [ ] Warning appears when trying to navigate away with unsaved changes
- [ ] Browser "beforeunload" warning when closing tab with unsaved changes
- [ ] Form dirty state indicator shows when form has been modified
- [ ] Clear button shows confirmation dialog when form is dirty
- [ ] Dirty state clears after successful form submission
- [ ] Navigation guard prevents accidental data loss

#### 🟢 Medium - Other

- [ ] Clear button works
- [ ] Image upload functionality works

---

### 6. Manager Dashboard (manager-dashboard.html)

#### 🔴 Critical

- [ ] User management section displays all users
- [ ] Pending recipes section shows recipes awaiting approval
- [ ] All recipes section displays with search and filter
- [ ] Approve/reject recipe functionality works
- [ ] User role management works (promote/demote users)
- [ ] Page requires manager/admin authentication
- [ ] Recipe search and category filter work correctly
- [ ] **Image Approval** - Consolidated modal for batch approval works
- [ ] **Image Approval** - Approve/Reject All buttons work
- [ ] **Category Migration** - Changing category migrates images correctly

#### 🟡 High

- [ ] Recipe edit modal opens correctly
- [ ] Recipe edit modal saves changes successfully
- [ ] Recipe preview works
- [ ] Modal closes properly after actions
- [ ] **Loading States** - Loading overlays prevent interaction during saved/updates

#### 🟢 Medium

- [ ] Pending images section displays (placeholder for future feature)

---

### 7. Documents Page (documents.html)

#### 🔴 Critical

- [ ] PDF documents list displays correctly
- [ ] PDF files open and display properly
- [ ] Only authenticated users are allowed - reroutes to home on log out

#### 🟢 Medium

- [ ] Documents are organized/categorized appropriately
- [ ] Mobile viewing of PDFs works correctly
- [ ] Search within document works

---

### 8. Authentication System

#### 🔴 Critical

- [ ] Login form accepts valid credentials and logs user in
- [ ] Login form rejects invalid credentials with error message
- [ ] Logout functionality works and clears user session
- [ ] Auth state persists across page refreshes
- [ ] Protected pages redirect unauthenticated users appropriately

#### 🟡 High

- [ ] Sign in with Google
- [ ] Auth modal content is fully visible (no overflow)
- [ ] Sign up with Google
- [ ] Signup form creates new user account successfully
- [ ] Signup form validates email format and password requirements
- [ ] Auth avatar shows correct user state (logged in/out)

#### 🟢 Medium

- [ ] Remember me works
- [ ] Forgot password sends reset email correctly
- [ ] User profile displays and allows editing user information

---

### 9. Navigation & Routing

#### 🔴 Critical

- [ ] Main navigation menu links work correctly
- [ ] Page URLs update correctly when navigating
- [ ] Direct URL access loads correct pages
- [ ] Logo click returns to home page

#### 🟡 High

- [ ] Mobile side menu opens and closes properly
- [ ] Mobile menu does not overlap other interface elements (e.g. drawers)
- [ ] Side menu closes after search/navigation
- [ ] Back button functionality works as expected
- [ ] Navigation preserves user state (auth, filters)

#### 🟢 Medium

- [ ] External links open in appropriate tabs

---

### 10. Ingredients Drawer (my-meal.html)

#### 🔴 Critical

- [ ] Drawer opens/closes correctly via button and backdrop
- [ ] "Current Recipe" vs "All Ingredients" view switching works
- [ ] **Copy to Clipboard** - Copies text and shows feedback toast

---

## Testing Environment & Execution

### Required Test Environments

**⚠️ STAGING IS MANDATORY before production deployment**

1. **Staging (REQUIRED)** - Complete testing before merging to main

   - Run ALL 🆕 NEW features test suite (comprehensive)
   - Run ALL 🔴 Critical EXISTING features (regression)
   - Run 🟡 High priority tests if time permits
   - Test on all required browsers and devices
   - Document ALL issues found
   - Get sign-off approval before proceeding

2. **Production (After staging passes)** - Post-deployment verification
   - Quick smoke test of 🆕 NEW features (verify deployment worked)
   - Quick smoke test of 🔴 Critical EXISTING features (verify no breakage)
   - Monitor logs and error tracking

**Standard regression testing** (both staging and production):

- **Desktop browsers**: Chrome (required), Firefox (required), Safari (if available)
- **Mobile devices**: iOS Safari (required), Android Chrome (required)
- **Tablet**: Test on at least one platform (recommended)

### User Role Coverage (test all roles in staging)

- **Guest** (not logged in)
- **Regular User** (authenticated)
- **Manager** (manager role)

### Staging-to-Main Workflow

```bash
# 1. Ensure staging is deployed and stable
git checkout staging
git pull origin staging

# 2. Review changes between staging and main
git log main..staging --oneline
git diff main..staging --stat

# 3. Run complete test suite on staging environment
# → Use this checklist

# 4. After ALL tests pass and sign-off received
git checkout main
git merge staging --ff-only  # Fast-forward merge only
git push origin main

# 5. Monitor production deployment
# → Run smoke tests in production

# 6. Deploy Infrastructure (Rules & Functions)
# → MANDATORY: Deploy updated security rules and functions
firebase deploy --only firestore:rules,storage,functions
```

---

## Known Issues & Notes

### Features Not Yet Implemented

- **Pending images approval** - UI present in Manager Dashboard but functionality not implemented

### Performance

- **Large media files** (20+ items or files >20MB each) may impact loading times - acceptable as long as page remains responsive

### For Next Release

After this release is deployed to production:

1. **Update CHANGELOG** - Add new entry to [CHANGELOG.md](../CHANGELOG.md) with:
   - Version number and deployment date
   - Added/Changed/Fixed sections from this release
   - Move current "Unreleased" items to new version section
2. **Update EXISTING tests** - Move passing NEW feature tests into appropriate EXISTING sections
3. **Clear NEW section** - Remove all items from NEW features section
4. **Update metadata** - Update release version, commit count, and date below
5. **Prepare next cycle** - Merge development → staging for next release

---

## Release Tracking

**Release Version**: staging → main (2026-01-12)
**Commits in Release**: 25 commits
**Files Changed**: 104 files (+5,379/-290)
**Last Updated**: 2026-01-12

### Testing Sign-Off

**Staging Environment**:

- [ ] Test Date:
- [ ] Tested By:
- [ ] Browser Coverage: Chrome ☐ | Firefox ☐ | Safari ☐ | Mobile iOS ☐ | Mobile Android ☐
- [ ] All 🔴 Critical tests passed: ☐
- [ ] All 🆕 NEW feature tests passed: ☐
- [ ] Issues found (if any):
- [ ] **APPROVED FOR PRODUCTION**: ☐ (signature required)

**Production Environment**:

- [ ] Deployment Date:
- [ ] Smoke Test Passed: ☐
- [ ] Critical Path Verified: ☐
- [ ] Build/Commit Hash:
- [ ] Rollback Plan (if needed):
