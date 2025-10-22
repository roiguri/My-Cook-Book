# Our Kitchen Chronicles - Manual Testing Checklist

## Testing Priorities Legend

- 🔴 **Critical** - Must test before production release
- 🟡 **High** - Important functionality, should test
- 🟢 **Medium** - Standard functionality, test if time permits

## Feature Categories

- 🆕 **NEW** - Features added in current release (development → main)
- ✅ **EXISTING** - Baseline regression test suite (reused each release)

---

## 🆕 NEW FEATURES IN THIS RELEASE (development → main)

> **Focus Area**: Test these comprehensively before release. After deployment, integrate passing tests into EXISTING section.

### 1. Media Instructions Feature

**Impact**: Recipe Page, Propose Recipe Page, Manager Dashboard

#### Recipe Page - Media Display

- [ ] 🔴 **Media instructions section** appears for recipes with media (titled "טיפים מצולמים")
- [ ] 🔴 **Media instructions section** hidden when recipe has no media
- [ ] 🔴 **Media scroller** displays all uploaded images/videos
- [ ] 🔴 **Media items are clickable** and open fullscreen viewer
- [ ] 🔴 **Fullscreen viewer displays** media at correct size
- [ ] 🔴 **Fullscreen viewer navigation** works (next/previous buttons)
- [ ] 🔴 **Fullscreen viewer captions** display correctly in Hebrew
- [ ] 🔴 **Fullscreen viewer closes** with X button or ESC key
- [ ] 🔴 **Media items display in correct order** (sorted by order field)
- [ ] 🟡 **Failed media loads don't break the page** (section hidden if all fail)
- [ ] 🟡 **Swipe navigation** works on mobile devices
- [ ] 🟡 **Keyboard navigation** works (arrow keys, ESC)
- [ ] 🟢 **Media loads progressively** (doesn't block page render)

#### Propose Recipe - Media Editor

- [ ] 🔴 **Media instructions section** appears in form (titled "טיפים מצולמים")
- [ ] 🔴 **Help text** displays explaining the feature
- [ ] 🔴 **File upload button** opens file picker for images/videos
- [ ] 🔴 **File validation rejects invalid types** (e.g., .txt, .pdf, .doc)
- [ ] 🔴 **File validation rejects oversized files** (>50MB)
- [ ] 🔴 **Preview displays uploaded files** correctly
- [ ] 🔴 **Caption input accepts Hebrew text** for each media item
- [ ] 🔴 **Delete button removes individual items** without affecting others
- [ ] 🔴 **Media uploads successfully** when recipe is submitted
- [ ] 🔴 **Form validation includes media** (rejects corrupted files)
- [ ] 🟡 **Drag & drop works** for adding media files
- [ ] 🟡 **Reorder functionality** allows drag-and-drop reordering
- [ ] 🟡 **Media persists** in form state when editing other fields
- [ ] 🟡 **Preview scroller shows** how media will appear to users
- [ ] 🟡 **Can upload multiple files** at once
- [ ] 🟢 **Upload progress indicator** shows for large files
- [ ] 🟢 **Error messages display** for failed uploads
- [ ] 🟢 **ARIA labels present** for accessibility

#### Manager Dashboard - Media Editing

- [ ] 🔴 **Edit modal opens** for existing recipes
- [ ] 🔴 **Media instructions section** appears in edit modal
- [ ] 🔴 **Existing media loads correctly** in editor
- [ ] 🔴 **Can add new media** to existing recipes
- [ ] 🔴 **Can remove existing media** from recipes
- [ ] 🔴 **Save button persists all changes** (media and other fields)
- [ ] 🔴 **Modal closes properly** after save without errors
- [ ] 🔴 **No data loss** when editing media (existing media preserved)
- [ ] 🟡 **Can reorder existing media** items
- [ ] 🟡 **Can edit captions** of existing media items
- [ ] 🟡 **Recipe list updates** after editing media
- [ ] 🟡 **Form dirty state** triggers on media changes
- [ ] 🟢 **Can mix operations** (add + remove + reorder in single edit)

#### Media Instructions Test Scenarios

**File Type Testing**:

- [ ] 🔴 **Single JPG image** uploads and displays
- [ ] 🔴 **Single PNG image** uploads and displays
- [ ] 🔴 **Single WEBP image** uploads and displays
- [ ] 🔴 **Single MP4 video** uploads and displays
- [ ] 🟡 **Multiple images** (5-10) upload and display
- [ ] 🟡 **Mix of images and videos** works correctly
- [ ] 🟡 **Large files** (near 50MB) upload successfully
- [ ] 🟢 **Very large file** (>50MB) is rejected with clear error

**Edge Cases**:

- [ ] 🔴 **Recipe with no media** - section doesn't appear
- [ ] 🔴 **Recipe with 1 media item** - displays correctly (no scroller needed)
- [ ] 🟡 **Recipe with 20+ media items** - performance remains acceptable
- [ ] 🟡 **Empty captions** are allowed (don't block save)
- [ ] 🟡 **Very long captions** (500+ chars) - text wraps/truncates properly
- [ ] 🟡 **Hebrew captions with emojis** display correctly
- [ ] 🟢 **Special characters in captions** (quotes, brackets) are sanitized

**Upload Workflow**:

- [ ] 🔴 **Upload → Save** - media persists after page reload
- [ ] 🟡 **Upload → Edit caption → Save** - caption changes persist
- [ ] 🟡 **Upload → Reorder → Save** - order changes persist
- [ ] 🟡 **Upload → Delete → Save** - deleted items don't appear
- [ ] 🟡 **Upload partial set → Save → Edit later → Add more** - all media appears
- [ ] 🟢 **Upload → Navigate away → Return** - unsaved media is lost (expected)

**Security & Validation**:

- [ ] 🔴 **XSS attempt in caption** - script tags are escaped/sanitized
- [ ] 🔴 **HTML injection in caption** - tags are escaped
- [ ] 🔴 **Malicious file disguised as image** - rejected by MIME validation
- [ ] 🟡 **Firebase Storage rules** - unauthenticated users can't upload
- [ ] 🟡 **Firebase Storage rules** - users can only delete their own media

### 2. Cook Mode Feature

**Impact**: Recipe Page

#### Basic Functionality

- [ ] 🔴 **Cook mode toggle** appears on recipe page
- [ ] 🔴 **Toggle is accessible** (visible, clickable)
- [ ] 🔴 **Toggle activates cook mode** - screen stays awake
- [ ] 🔴 **Visual indicator shows** when cook mode is active
- [ ] 🔴 **Toggle deactivates cook mode** - screen can sleep again
- [ ] 🔴 **Cook mode releases** when page is closed
- [ ] 🟡 **Cook mode persists** during recipe viewing (doesn't auto-deactivate)
- [ ] 🟡 **Fallback works** for browsers without Wake Lock API
- [ ] 🟡 **Fallback message displays** clearly for unsupported browsers
- [ ] 🟢 **ARIA labels present** for accessibility
- [ ] 🟢 **Keyboard accessible** (Space/Enter toggles)

#### Device-Specific Testing

- [ ] 🔴 **Mobile Android (Chrome)** - Wake Lock works, screen stays on
- [ ] 🔴 **Mobile iOS (Safari)** - Check support status or fallback
- [ ] 🟡 **Desktop Chrome** - Works or shows fallback message
- [ ] 🟡 **Desktop Firefox** - Works or shows fallback message
- [ ] 🟡 **Desktop Safari** - Works or shows fallback message
- [ ] 🟡 **Tablet Android** - Wake Lock works
- [ ] 🟡 **Tablet iOS** - Check support status or fallback

#### Advanced Scenarios

- [ ] 🔴 **Enable → Lock screen** - Screen stays on while cooking
- [ ] 🟡 **Enable → Switch to another app** - Wake Lock still active on return
- [ ] 🟡 **Enable → Browser tab switch** - Wake Lock reacquires on return
- [ ] 🟡 **Enable → Close page** - Wake Lock cleaned up properly
- [ ] 🟢 **Enable → Phone call** - Wake Lock behavior after call ends

### 3. Dashboard Refresh Buttons

**Impact**: Manager Dashboard

#### UI & Interaction

- [ ] 🔴 **Master refresh button** appears in dashboard header
- [ ] 🔴 **4 section refresh buttons** appear (Users, All Recipes, Pending Recipes, Pending Images)
- [ ] 🔴 **Refresh icons are clickable** and respond to clicks
- [ ] 🟡 **Refresh icons show loading state** (spinner/animation) during refresh
- [ ] 🟡 **Tooltips display** on hover (Hebrew text)
- [ ] 🟢 **Icons are accessible** (proper ARIA labels)

#### Functionality

- [ ] 🔴 **Master refresh reloads all 4 sections** simultaneously
- [ ] 🔴 **User section refresh** updates user list only
- [ ] 🔴 **All recipes refresh** updates recipe list only
- [ ] 🔴 **Pending recipes refresh** updates pending recipes only
- [ ] 🔴 **Pending images refresh** updates pending images only
- [ ] 🔴 **Refresh completes without page reload** (AJAX-style)
- [ ] 🟡 **Counters update** after refresh (pending counts, etc.)
- [ ] 🟡 **Scroll position preserved** after refresh (user doesn't lose place)
- [ ] 🟡 **Refresh handles empty results** (no items to display)

#### Edge Cases & Stress Testing

- [ ] 🟡 **Rapid clicking same refresh button** - doesn't cause errors
- [ ] 🟡 **Clicking master + section refresh simultaneously** - handles gracefully
- [ ] 🟡 **Refresh while editing recipe** - doesn't close modal or lose changes
- [ ] 🟡 **Refresh with network errors** - shows error message, doesn't break UI
- [ ] 🟢 **Refresh with slow network** - loading state persists until complete
- [ ] 🟢 **Multiple users refreshing simultaneously** - no data corruption

### 4. Security & Performance Fixes

**Impact**: Recipe Page, Propose Recipe Page, Manager Dashboard

#### XSS Vulnerability Fixes

- [ ] 🔴 **Media viewer captions** - script tags don't execute
- [ ] 🔴 **Media viewer captions** - HTML tags are escaped
- [ ] 🔴 **Media scroller items** - user content is sanitized
- [ ] 🔴 **Caption input fields** - validation prevents script injection
- [ ] 🟡 **Test with common XSS payloads** (`<script>alert('XSS')</script>`, etc.)
- [ ] 🟡 **Test with encoded payloads** (`&lt;script&gt;`, etc.)
- [ ] 🟢 **Console shows no CSP violations** during media operations

#### Memory Leak Fixes

- [ ] 🔴 **Navigate between 10+ recipe pages** - memory doesn't grow unbounded
- [ ] 🔴 **Open/close fullscreen viewer 20+ times** - no memory leaks
- [ ] 🔴 **Open/close media editor 10+ times** - no memory leaks
- [ ] 🟡 **Event listeners cleaned up** - DevTools Event Listeners panel shows cleanup
- [ ] 🟡 **Blob URLs released** - DevTools Memory panel shows blob cleanup
- [ ] 🟡 **No "detached DOM" warnings** in DevTools after navigation
- [ ] 🟢 **Page doesn't slow down** after 30+ minutes of use

#### Performance Improvements

- [ ] 🔴 **Recipe with 10 large media files** loads in <5 seconds
- [ ] 🔴 **Fullscreen viewer opens instantly** (<500ms)
- [ ] 🟡 **Media scroller scrolls smoothly** (60fps on desktop)
- [ ] 🟡 **Mobile performance** acceptable on 3G connection
- [ ] 🟡 **Multiple media render** without UI freezing
- [ ] 🟢 **Lighthouse performance score** >80 for recipe pages with media

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

1. **Staging** - Test all 🆕 NEW features thoroughly + 🔴 Critical existing features
2. **Production** - Quick smoke test of 🆕 NEW features + 🔴 Critical existing features

**Standard regression testing**:

- **Desktop browsers**: Chrome, Firefox, Safari
- **Mobile devices**: iOS Safari, Android Chrome
- **Tablet**: Test on at least one platform

### User Role Coverage

- **Guest** (not logged in)
- **Regular User** (authenticated)
- **Manager** (manager role)

---

## Known Issues & Notes

### Features Not Yet Implemented

- **Pending images approval** - UI present in Manager Dashboard but functionality not implemented

### Performance

- **Large media files** (20+ items or files >20MB each) may impact loading times - acceptable as long as page remains responsive

### For Next Release

After this release is deployed to production:

1. Move passing NEW feature tests into appropriate EXISTING sections
2. Clear NEW features section
3. Add next batch of changes to NEW section

---

**Release Version**: development → main (2025-10-22)
**Last Updated**: 2025-10-22
**Tested By**:
**Test Environment**: Staging ☐ | Production ☐
**Build/Commit**:
