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

- **Commits in staging ahead of main**: 23 commits
- **Files changed**: 31 files (+2,015 insertions, -1,842 deletions)
- **Key areas affected**: Image handling, search, modals, recipe display, loading states

---

### 1. Image Approval System Improvements

**Impact**: Manager Dashboard, Recipe Cards, Recipe Detail Page

#### Multi-Image Batch Approval Modal

- [ ] 🔴 **New consolidated modal** opens when approving images
- [ ] 🔴 **Approve All button** approves all pending images at once
- [ ] 🔴 **Reject All button** rejects all pending images at once
- [ ] 🔴 **Individual approve/reject** works for each image
- [ ] 🔴 **Removed images are respected** - deleted images don't get approved in batch operations
- [ ] 🔴 **Modal is responsive** on mobile devices
- [ ] 🔴 **Upload area is hidden** in approval-only mode
- [ ] 🟡 **Click-to-toggle controls** work on mobile (tap to show/hide controls)
- [ ] 🟡 **Image controls are mobile-friendly** (proper touch targets)
- [ ] 🟡 **isPrimary flag** is respected when populating images in edit mode
- [ ] 🟢 **Modal scrolls properly** with many images

#### Image Proposal Workflow

- [ ] 🔴 **Image proposal modal** opens from recipe menu
- [ ] 🔴 **Success message displays** after proposing images
- [ ] 🔴 **Proposed images appear** in pending images section
- [ ] 🟡 **Upload area matches** styling between images and media instructions
- [ ] 🟢 **Loading state shows** during image upload

#### Recipe Cards & Display

- [ ] 🔴 **Placeholder image** is displayed for recipe cards that are missing a primary image.
- [ ] 🟡 **Recipe scroller** (new browser-native component) displays images smoothly
- [ ] 🟡 **Modal overflow fixed** - images scroll horizontally without breaking layout

---

### 2. Category Change Image Migration

**Impact**: Manager Dashboard, Edit Recipe Modal

#### Image Migration on Category Change

- [ ] 🔴 **Category change triggers migration** - images move to new category folder
- [ ] 🔴 **Image URLs update correctly** after migration
- [ ] 🔴 **Migration completes** before recipe save
- [ ] 🔴 **No image loss** during migration
- [ ] 🟡 **Multiple images migrate** correctly (not just first image)
- [ ] 🟡 **Primary image flag preserved** during migration
- [ ] 🟡 **Error handling** if migration fails (recipe save prevented)
- [ ] 🟢 **Loading state shows** during migration process

---

### 3. Search & Navigation Improvements

**Impact**: Home Page, Header Search Bar

#### Direct Navigation for Single Results

- [ ] 🔴 **Single search result** navigates directly to recipe page
- [ ] 🔴 **Toast notification** appears showing "נמצא מתכון אחד: [recipe name]"
- [ ] 🔴 **Multiple results** still show results page (existing behavior)
- [ ] 🔴 **No results** shows appropriate message (existing behavior)
- [ ] 🟡 **Toast notification auto-dismisses** after 3-5 seconds
- [ ] 🟡 **Toast notification is clickable** (dismisses on click)
- [ ] 🟡 **Toast notification styled properly** in Hebrew
- [ ] 🟢 **Toast notification accessible** (ARIA labels)

#### Recipe Detail Page Improvements

- [ ] 🔴 **Tab title shows recipe name** instead of recipe ID
- [ ] 🔴 **Tab title updates** when navigating between recipes
- [ ] 🟡 **Tab title fallback** shows appropriate text if recipe name unavailable
- [ ] 🟢 **Browser history** shows correct recipe names

---

### 4. Loading States & UX Improvements

**Impact**: Manager Dashboard, Modals, Recipe Forms

#### Loading Overlays

- [ ] 🔴 **Loading overlay prevents scrolling** when active
- [ ] 🔴 **Loading spinner shows** when submitting recipe edits
- [ ] 🔴 **Page remains responsive** after loading completes
- [ ] 🟡 **Loading spinner uses overlay mode** (simplified implementation)
- [ ] 🟡 **Multiple loading states** don't conflict
- [ ] 🟢 **Loading spinner accessible** (ARIA live region)

#### Modal Responsiveness

- [ ] 🔴 **Modals are responsive** on mobile devices
- [ ] 🔴 **Cook mode toggle is mobile-friendly** (proper size and touch targets)
- [ ] 🟡 **Modal scroll behavior** works on iOS and Android
- [ ] 🟡 **Modal close buttons** are accessible on mobile
- [ ] 🟢 **Modals don't break** on very small screens (<375px)

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
- [ ] Recipe images load and display properly (carousel)
- [ ] Ingredients list is readable and properly formatted
- [ ] Step-by-step instructions display in correct order
- [ ] Page works for both logged-in and guest users

#### 🟡 High

- [ ] Both flat and sectioned ingredients displayed correctly
- [ ] Both flat and sectioned instructions displayed correctly
- [ ] Stage numbering and formatting is correct for multi-stage instructions
- [ ] Check recipes with one or multiple images
- [ ] Change amount of dishes (servings adjuster) works
- [ ] Check recipes with media instructions
- [ ] Check media instructions on fullscreen

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

#### 🟡 High

- [ ] Recipe edit modal opens correctly
- [ ] Recipe edit modal saves changes successfully
- [ ] Recipe preview works
- [ ] Modal closes properly after actions

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
- [ ] Side menu closes after search/navigation
- [ ] Back button functionality works as expected
- [ ] Navigation preserves user state (auth, filters)

#### 🟢 Medium

- [ ] External links open in appropriate tabs

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

**Release Version**: staging → main (2025-11-16)
**Commits in Release**: 23 commits
**Files Changed**: 31 files (+2,015/-1,842)
**Last Updated**: 2025-11-16

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
