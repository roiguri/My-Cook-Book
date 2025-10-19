# Recipe Media Instructions - Implementation Tracking

**Feature Branch**: `feature/recipe-media`
**Base Branch**: `development`
**Started**: September 10, 2025
**Resumed**: October 18, 2025

---

## 🎯 Current Status

### Completed

- ✅ **PRD Created** - Comprehensive requirements in [media-instructions-prd.md](./media-instructions-prd.md)
- ✅ **Task Master Setup** - 8 implementation tasks generated with `media-instructions` tag
- ✅ **Existing Component** - MediaScroller component exists at `src/lib/utilities/media-scroller/media-scroller.js`
- ✅ **Documentation** - Implementation tracking document created
- ✅ **Rebase Complete** - Successfully rebased onto `development` (no conflicts!)
- ✅ **Backup Created** - `feature/recipe-media-backup` branch for safety

### In Progress

- 🔄 **Ready for Phase 2** - Firebase Security Rules implementation

### Pending

- ❌ **Code Implementation** - No actual code written yet (only planning artifacts)
- ❌ **Security Rules** - No local rules files (managed via Firebase Console)
- ❌ **Testing** - No tests written

---

## 🏗️ Environment Setup

### Firebase Projects

- **Staging**: `cook-book-test-479e8` (also set as `default`)
- **Production**: `my-cook-book-67fde`
- **Configuration**: [.firebaserc](../../.firebaserc)

### Environment Variables

- `.env.local` → Development (uses staging)
- `.env.staging` → Staging environment
- `.env.production` → Production environment

### Security Rules Status

⚠️ **CRITICAL**: No local rules files exist. Rules are managed in Firebase Console.

- **Action Required**: Export and version control current rules before making changes

---

## 🔒 Backward Compatibility Requirements

### Existing Recipe Schema

Recipes currently use this structure:

```javascript
{
  name, category, prepTime, waitTime, servings,
  ingredients: [...] or ingredientSections: [...],
  instructions: [...] or stages: [...],
  images: [
    {
      id, fileName, full, compressed, access,
      isPrimary, uploadedBy, uploadTimestamp
    }
  ]
}
```

### New Field (Must Be Optional)

```javascript
{
  // ... existing fields ...
  mediaInstructions: [
    // OPTIONAL - must not break existing recipes
    {
      id,
      path,
      caption,
      type,
      order,
      uploadedBy,
      uploadedAt,
    },
  ];
}
```

### Storage Paths

- **Existing**: `img/recipes/full/{category}/{recipeId}/` and `img/recipes/compressed/`
- **New**: `recipes/{recipeId}/media-instructions/`
- **Reason for Separation**: Avoid conflicts with existing image upload system

---

## 📋 Implementation Phases

### Phase 0: Firebase Safety Setup

**Status**: ✅ Completed (October 19, 2025)

- [x] Export current `storage.rules` from Firebase Console
- [x] Export current `firestore.rules` from Firebase Console
- [x] Create local `storage.rules` file
- [x] Create local `firestore.rules` file
- [x] Update `firebase.json` to reference rules files
- [x] Commit baseline rules to version control
- [x] Test rules deployment to staging

**Outcome**:

- ✅ Rules files already existed in project root
- ✅ Updated `firebase.json` with firestore and storage configuration
- ✅ Successfully deployed to staging (`cook-book-test-479e8`)
- ✅ Verified storage rules matched existing deployment (no changes)
- ✅ Firestore rules deployed successfully (new ruleset created)
- ✅ All rules now version-controlled in git

**Safety Notes**:

- Don't modify existing rules, only ADD new paths
- Test in staging before production
- Keep existing `img/recipes/*` rules unchanged

---

### Phase 1: Rebase & Preparation

**Status**: ✅ Completed (October 18, 2025)

#### Branch Divergence Analysis

Branch is ~50 commits behind `development` including:

- Form refactoring (sectioned ingredients, validation)
- New features (cook mode, dashboard refresh)
- Performance optimizations (image optimization, CSS)
- Bug fixes and test improvements

#### Rebase Strategy

- [x] Create backup branch: `git branch feature/recipe-media-backup`
- [x] Review conflicts that may occur:
  - TaskMaster files (`.taskmaster/`)
  - Form components (if modified)
  - Validation utils (if extended)
- [x] Execute rebase: `git rebase development`
- [x] Resolve conflicts carefully (preserve our planning work)
  - **Result**: No conflicts! Rebase succeeded cleanly
  - **Note**: Auto-formatting applied to PRD file (cosmetic only)
- [x] Test dev server: Verify application runs
- [x] Test existing features: No regressions introduced

#### Post-Rebase Verification

- [x] Dev server starts without errors
- [x] Existing recipes load correctly
- [x] Recipe form works (create/edit)
- [x] TaskMaster tasks preserved (all 8 tasks intact)
- [x] PRD document intact (formatting applied only)

---

### Phase 2: Security Rules (Task #1)

**Status**: ✅ Completed (October 19, 2025)
**Task Master**: Task #1

#### Design Decision: Collaborative Model (Not Ownership-Based)

**Discovery**: App uses collaborative editing model, not ownership-based access control.

- Firestore rules: `allow write: if request.auth != null` (any auth user can edit any recipe)
- `userId` field is for **attribution**, not **authorization**
- `approved` field controls visibility (manager approval workflow)

**Implemented**: Option 1 - Collaborative model (matches Firestore)

- Any authenticated user can add media to any recipe
- Consistent with existing Firestore permissions
- Simple, performant (no ownership queries needed)

#### Subtasks

- [x] Design storage rules for `recipes/{recipeId}/media-instructions/`
  - Path: `/recipes/{recipeId}/media-instructions/{fileName}`
  - Read: Public (anyone can view)
  - Write: Any authenticated user + file validation
- [x] Implement `isValidMediaFile()` function (size, MIME type)
  - 50MB max file size
  - Accept image/_ and video/_ MIME types
  - Reject executables and other file types
- [x] ~~Implement `userOwnsRecipe()` function~~ - Not needed (collaborative model)
- [x] ~~Add Firestore validation~~ - Not needed (optional field)
- [x] Deploy to staging: `firebase deploy --only storage --project staging`
  - New ruleset: `f7caad19-7091-4ff9-890c-2137ca59d270`
  - Deployed: 2025-10-19 04:38:00 UTC
- [ ] Test in staging with `.env.staging` - **NEXT STEP**
- [ ] Monitor for 24-48 hours
- [ ] Deploy to production: `firebase deploy --only storage --project production`
- [ ] Monitor production for issues

#### Testing Checklist (Updated for Collaborative Model)

- [ ] Upload valid image (JPG, PNG, WEBP) as authenticated user - should succeed
- [ ] Upload valid video (MP4, WEBM) as authenticated user - should succeed
- [ ] Upload large file (>50MB) - should fail (file size limit)
- [ ] Upload as unauthenticated user - should fail (auth required)
- [ ] ~~Upload to recipe you don't own~~ - N/A (collaborative model allows this)
- [ ] Existing recipes still work (no regressions)

---

### Phase 3: Core Implementation (Tasks #2-4)

**Status**: Not Started
**Task Master**: Tasks #2, #3, #4

#### Task #2: Media Utility Functions

**File**: `src/lib/utils/recipes/recipe-media-utils.js`

- [ ] Create file structure
- [ ] Implement `uploadMediaInstructionFile(file, recipeId, userId)`
  - Upload to `recipes/{recipeId}/media-instructions/`
  - Return metadata object
  - Handle errors gracefully
- [ ] Implement `deleteMediaInstructionFile(filePath)`
  - Remove from Firebase Storage
  - Handle missing files
- [ ] Implement `validateMediaInstructionData(mediaInstructions)`
  - Validate array structure
  - Check required fields (path, caption, type)
  - Validate file types
- [ ] Write unit tests (use existing test patterns)
- [ ] Add compression using Sharp (like `functions/index.js`)

#### Task #3: MediaInstructionsEditor Component

**File**: `src/lib/recipes/media-instructions/MediaInstructionsEditor.svelte`

- [ ] Create component directory structure
- [ ] Implement file upload with drag & drop
- [ ] Add caption input (Hebrew RTL support)
- [ ] Add delete button for each item
- [ ] Implement reordering with `svelte-dnd-action`
- [ ] Add preview using MediaScroller
- [ ] Emit data change events
- [ ] Follow recent form refactoring patterns
- [ ] Add validation error display
- [ ] Test component in isolation

#### Task #4: Recipe Form Integration

**Files**: `RecipeForm` component + validation utils

- [ ] Import MediaInstructionsEditor component
- [ ] Add "הוראות הכנה מצולמות" section to form
- [ ] Bind to recipe.mediaInstructions field
- [ ] Extend Zod schema: `mediaInstructions: z.array(...).optional()`
- [ ] Test form save with media instructions
- [ ] Test form save without media instructions (backward compatibility)
- [ ] Test form validation
- [ ] Test form persistence across sessions

---

### Phase 4: Display Components (Tasks #5-7)

**Status**: Not Started
**Task Master**: Tasks #5, #6, #7

#### Task #5: Enhance MediaScroller

**File**: `src/lib/utilities/media-scroller/media-scroller.js`

- [ ] Add `itemclick` event dispatch
- [ ] Pass item index and data with event
- [ ] Test with new data structure
- [ ] Ensure video/image handling works
- [ ] Verify responsive behavior
- [ ] Test touch gestures

#### Task #6: Fullscreen Media Viewer

**New Component**: Modal component

- [ ] Create component file
- [ ] Implement fullscreen overlay
- [ ] Add navigation controls (Previous/Next)
- [ ] Add close button and Esc key handler
- [ ] Display caption below media
- [ ] Support keyboard navigation
- [ ] Add touch swipe gestures
- [ ] Test accessibility (focus trap, ARIA)
- [ ] Test on mobile devices

#### Task #7: Recipe View Integration

**Files**: Recipe display page/component

- [ ] Add collapsible "הוראות הכנה מצולמות" section
- [ ] Conditionally render: `{#if recipe.mediaInstructions?.length > 0}`
- [ ] Implement lazy loading for section
- [ ] Wire up MediaScroller with data
- [ ] Connect itemclick to FullscreenMediaViewer
- [ ] Test end-to-end workflow
- [ ] Test with recipes that have no media (backward compatibility)

---

### Phase 5: Testing & Deployment (Task #8)

**Status**: Not Started
**Task Master**: Task #8

#### Performance Optimization

- [ ] Implement image compression on upload
- [ ] Add lazy loading for media section
- [ ] Test with Lighthouse (target: LCP < 2.5s)
- [ ] Measure storage impact
- [ ] Test with slow network conditions

#### Security & Sanitization

- [ ] Sanitize captions with DOMPurify
- [ ] Test XSS prevention (try script tags in captions)
- [ ] Verify storage security rules work
- [ ] Test rate limiting behavior
- [ ] Review content moderation needs

#### Staging Deployment

- [ ] Deploy to staging
- [ ] Test new recipes WITH media
- [ ] Test existing recipes WITHOUT media
- [ ] Cross-browser testing (Chrome, Firefox, Safari)
- [ ] Mobile testing (iOS, Android)
- [ ] Performance testing

#### Production Rollout

- [ ] Deploy code to production
- [ ] Monitor Firebase Console for errors
- [ ] Monitor storage costs
- [ ] Monitor performance metrics
- [ ] Collect user feedback

---

## 🚨 Safety Protocols

### Before Every Firebase Deployment

1. ✅ Tested thoroughly in staging
2. ✅ Verified existing recipes still work
3. ✅ No breaking changes to existing fields
4. ✅ Rollback plan documented
5. ✅ Monitoring plan in place

### Rollback Strategy

If issues arise after deployment:

1. **Code Rollback**: Revert to previous commit
2. **Rules Rollback**: Redeploy previous rules from git history
3. **Feature Disable**: Hide MediaInstructionsEditor UI
4. **Data Safety**: `mediaInstructions` field is optional - existing recipes unaffected

### Monitoring Checklist

- [ ] Firebase Console → Storage usage trends
- [ ] Firebase Console → Firestore read/write counts
- [ ] Application logs for errors
- [ ] User reports of issues
- [ ] Performance metrics (Lighthouse CI)

---

## 📝 Decision Log

### Decision 1: Separate Storage Paths

**Date**: October 18, 2025
**Decision**: Use `recipes/{recipeId}/media-instructions/` instead of extending `img/recipes/`
**Rationale**:

- Avoids conflicts with existing image upload system
- Clearer separation of concerns
- Easier to manage security rules independently
- Existing functionality remains completely untouched

### Decision 2: Optional Field

**Date**: October 18, 2025
**Decision**: Make `mediaInstructions` an optional field
**Rationale**:

- Ensures backward compatibility with existing recipes
- No migration required for existing data
- Feature can be rolled out gradually
- Reduces deployment risk

### Decision 3: Staging-First Deployment

**Date**: October 18, 2025
**Decision**: Always deploy and test in staging before production
**Rationale**:

- Dual Firebase projects require careful coordination
- Breaking production would affect active users
- Staging allows safe experimentation
- 24-48 hour monitoring period before production

---

## 📊 Success Metrics

### Development Metrics

- [ ] All 8 Task Master tasks completed
- [ ] Zero breaking changes to existing recipes
- [ ] 100% backward compatibility maintained
- [ ] All tests passing

### Performance Metrics

- [ ] Recipe page load time < 2.5s (LCP)
- [ ] No degradation in existing page performance
- [ ] Image compression reduces storage by 60%+
- [ ] Lazy loading prevents unnecessary downloads

### User Adoption Metrics (Post-Launch)

- [ ] 30% of new recipes include media instructions (3 months)
- [ ] Zero security incidents
- [ ] No user-reported data loss
- [ ] Positive user feedback

---

## 🔗 Related Documents

- [PRD: Recipe Media Instructions](./media-instructions-prd.md)
- [Firebase Configuration](../../.firebaserc)
- [Task Master Tasks](../tasks/tasks.json)
- [MediaScroller Component](../../src/lib/utilities/media-scroller/media-scroller.js)

---

**Last Updated**: October 18, 2025
**Next Review**: After Phase 1 (Rebase) completion
