# Media Instructions - Implementation Plan

**Created**: October 19, 2025
**Status**: Phase 3 - Core Implementation In Progress

---

## 🗺️ Implementation Roadmap Overview

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    User Experience Layer                     │
├─────────────────────────────────────────────────────────────┤
│  Recipe Form (Edit/Propose) ──► Recipe Display (View)       │
│         │                              │                     │
│         ▼                              ▼                     │
│  MediaInstructionsEditor      MediaScroller + Fullscreen    │
│         │                              │                     │
└─────────┼──────────────────────────────┼─────────────────────┘
          │                              │
          └──────────┬───────────────────┘
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                    Utility Layer                            │
├─────────────────────────────────────────────────────────────┤
│  recipe-media-utils.js                                      │
│  - uploadMediaInstructionFile()                             │
│  - deleteMediaInstructionFile()                             │
│  - validateMediaInstructionData()                           │
└─────────────────────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                  Firebase Layer                             │
├─────────────────────────────────────────────────────────────┤
│  Storage: /recipes/{id}/media-instructions/                 │
│  Firestore: recipes collection (mediaInstructions field)    │
└─────────────────────────────────────────────────────────────┘
```

---

## 📋 Detailed Implementation Phases

### **Phase 3: Core Implementation** (Current Focus)

#### Task #2: Utility Functions

**File**: `src/lib/utils/recipes/recipe-media-utils.js`
**Estimated Time**: 1-2 hours
**Status**: In Progress

**Functions to Implement:**

1. **uploadMediaInstructionFile(file, recipeId, userId)**

   - Upload to: `recipes/{recipeId}/media-instructions/{uniqueId}_{filename}`
   - Return: `{ id, path, type, uploadedBy, uploadedAt }`
   - Handle: Progress tracking, errors, file validation
   - Pattern: Mirror `recipe-image-utils.js` lines 116-183

2. **deleteMediaInstructionFile(filePath)**

   - Delete from Firebase Storage
   - Handle: File not found, permission errors
   - Use: `StorageService.deleteFile()`

3. **validateMediaInstructionData(mediaInstructions)**
   - Validate array structure
   - Check required fields: id, path, caption, type
   - Return: `{ valid: boolean, errors: [] }`

**Data Structure:**

```javascript
{
  id: String,           // Unique identifier (UUID)
  path: String,         // Firebase Storage path
  caption: String,      // Hebrew instruction text
  type: 'image'|'video', // Media type
  order: Number,        // Display order (0-based)
  uploadedBy: String,   // User ID
  uploadedAt: Timestamp // Upload timestamp
}
```

---

#### Task #3: MediaInstructionsEditor Component

**File**: `src/lib/recipes/media-instructions-editor/media-instructions-editor.js`
**Architecture**: Vanilla JavaScript Web Component (Custom Elements API)
**Estimated Time**: 4-6 hours
**Status**: Pending

**Component Pattern** (following existing Web Component architecture):

```javascript
class MediaInstructionsEditor extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });

    // State
    this.mediaInstructions = [];
    this.uploading = false;
    this.errors = [];
    this.dragOver = false;
  }

  static get observedAttributes() {
    return ['media-data', 'recipe-id', 'user-id'];
  }

  connectedCallback() {
    this.render();
    this.setupEventListeners();
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>/* Scoped styles */</style>
      <div class="media-instructions-editor">
        <!-- File Upload Zone (drag & drop) -->
        <!-- List of Media Items (with preview, caption, delete, reorder) -->
      </div>
    `;
  }
}

customElements.define('media-instructions-editor', MediaInstructionsEditor);
```

**Usage in Forms:**

```html
<media-instructions-editor media-data="[]" recipe-id="recipe-123" user-id="user-456">
</media-instructions-editor>
```

**Features:**

- ✅ Drag & drop file upload zone
- ✅ File input fallback (click to browse)
- ✅ Live preview of uploaded media
- ✅ Caption input for each item (Hebrew RTL: `dir="rtl"`)
- ✅ Delete button per item
- ✅ Drag handles for reordering (vanilla JS drag events)
- ✅ Upload progress indicators
- ✅ Error handling and display

**Reuse Patterns:**

- Web Component architecture: `src/lib/utilities/media-scroller/media-scroller.js`
- Form components: `src/lib/recipes/recipe_form_component/`
- Shadow DOM styling: Existing component patterns
- Event dispatch: CustomEvent for parent communication

---

#### Task #4: Recipe Form Integration

**Files**:

- `src/lib/recipes/recipe_form_component/propose_recipe_component.js`
- `src/lib/recipes/recipe_form_component/edit_recipe_component.js`
- `src/js/utils/recipes/recipe-data-utils.js`

**Estimated Time**: 2-3 hours
**Status**: Pending

**Integration Steps:**

1. **Add Section to Recipe Form HTML**

   ```html
   <section class="media-instructions-section">
     <h3>הוראות הכנה מצולמות</h3>
     <p class="help-text">הוסף תמונות או סרטונים המדגימים את שלבי ההכנה</p>
     <media-instructions-editor media-data="[]" recipe-id="" user-id="">
     </media-instructions-editor>
   </section>
   ```

2. **Listen to Component Events**

   ```javascript
   // In propose_recipe_component.js / edit_recipe_component.js
   const editor = document.querySelector('media-instructions-editor');

   // Listen for updates from the Web Component
   editor.addEventListener('media-changed', (event) => {
     recipe.mediaInstructions = event.detail.mediaInstructions;
   });

   // Initialize with existing data (for edit mode)
   if (recipe.mediaInstructions) {
     editor.setAttribute('media-data', JSON.stringify(recipe.mediaInstructions));
   }
   ```

3. **Extend Validation Schema**

   ```javascript
   // In recipe-data-utils.js
   import { z } from 'zod';

   const mediaInstructionSchema = z.object({
     id: z.string(),
     path: z.string(),
     caption: z.string(),
     type: z.enum(['image', 'video']),
     order: z.number(),
     uploadedBy: z.string(),
     uploadedAt: z.any(),
   });

   // Add to existing recipe schema
   const recipeSchema = z.object({
     // ... existing fields ...
     mediaInstructions: z.array(mediaInstructionSchema).optional(),
   });
   ```

4. **Form Save Logic**

   ```javascript
   // In propose_recipe_component.js / edit_recipe_component.js
   const recipeData = {
     // ... existing fields ...
     mediaInstructions: recipe.mediaInstructions || [],
   };

   await FirestoreService.addDocument('recipes', recipeData);
   ```

**Reuse Patterns:**

- Follow how `images` field is currently handled
- Use existing form persistence system
- Mirror validation patterns from `recipe-data-utils.js`

---

### **Phase 4: Display Components**

#### Task #5: Enhance MediaScroller

**File**: `src/lib/utilities/media-scroller/media-scroller.js` (existing)
**Estimated Time**: 30 minutes
**Status**: Pending

**Modifications:**

1. Add `itemclick` event to dispatch when media is clicked
   ```javascript
   this.dispatchEvent(
     new CustomEvent('itemclick', {
       detail: { item: mediaItem, index: currentIndex },
     }),
   );
   ```
2. Ensure compatibility with new data structure
3. Test with image and video media types

**Component is 90% ready** - minimal changes needed!

---

#### Task #6: Fullscreen Media Viewer Modal

**File**: `src/lib/modals/fullscreen-media-viewer/fullscreen-media-viewer.js` (new)
**Estimated Time**: 2-3 hours
**Status**: Pending

**Component Structure:**

```javascript
class FullscreenMediaViewer extends HTMLElement {
  // Props: mediaItems (array), currentIndex
  // Features:
  // - Fullscreen overlay (dark background)
  // - Large media display (image/video)
  // - Caption below media
  // - Navigation arrows (previous/next)
  // - Close button (X)
  // - Keyboard support (Esc, Arrow Left/Right)
  // - Touch gestures (swipe left/right)
}
```

**Reuse Patterns:**

- Modal structure: Similar to `confirmation_modal`, `image_approval`
- Overlay behavior: Click outside to close
- Keyboard handling: Esc key, arrow keys

---

#### Task #7: Recipe Display Integration

**Files**: Recipe display page/component
**Estimated Time**: 1-2 hours
**Status**: Pending

**Integration:**

```javascript
// In recipe display component
{#if recipe.mediaInstructions && recipe.mediaInstructions.length > 0}
  <section class="media-instructions-section collapsible">
    <h3 class="section-title">
      הוראות הכנה מצולמות
      <button class="collapse-toggle">▼</button>
    </h3>

    <div class="section-content">
      <media-scroller
        media-data={JSON.stringify(recipe.mediaInstructions)}
        title=""
        visible-items="3"
        on:itemclick={handleMediaClick}
      />
    </div>
  </section>

  <fullscreen-media-viewer
    bind:visible={showFullscreen}
    media-items={recipe.mediaInstructions}
    current-index={selectedMediaIndex}
  />
{/if}
```

**Features:**

- Collapsible section (collapsed by default)
- Lazy loading (load media only when expanded)
- Click media → open fullscreen viewer
- Responsive layout (mobile/desktop)

---

### **Phase 5: Testing & Polish**

#### Task #8: Performance & Security

**Estimated Time**: 2-3 hours
**Status**: Pending

**Performance Optimization:**

1. **Image Compression**

   - Option A: Client-side (Canvas API)
   - Option B: Cloud Function (like existing images)
   - Target: Reduce file sizes by 60%+

2. **Lazy Loading**

   - Load media only when section expanded
   - Test with Lighthouse (LCP < 2.5s)

3. **Caching**
   - Leverage browser cache
   - CDN integration

**Security Hardening:**

1. **Caption Sanitization**

   ```javascript
   import DOMPurify from 'dompurify';
   const sanitizedCaption = DOMPurify.sanitize(caption);
   ```

2. **XSS Prevention**

   - Test with `<script>` tags in captions
   - Verify Svelte escaping works correctly

3. **Rate Limiting**
   - Monitor upload frequency per user
   - Consider Cloud Function rate limits

---

## 🎯 Implementation Order

### Session 1: Utilities Layer ✅ (Today)

- [x] Create `recipe-media-utils.js`
- [x] Implement `uploadMediaInstructionFile()`
- [x] Implement `deleteMediaInstructionFile()`
- [x] Implement `validateMediaInstructionData()`
- [x] Manual testing

### Session 2: Editor Component (Next)

- [ ] Create `MediaInstructionsEditor.svelte`
- [ ] Implement drag & drop upload
- [ ] Add caption inputs (RTL)
- [ ] Add delete buttons
- [ ] Implement reordering
- [ ] Test component in isolation

### Session 3: Form Integration (Next)

- [ ] Add editor to propose recipe form
- [ ] Add editor to edit recipe form
- [ ] Extend validation schema
- [ ] Test save/load workflow

### Session 4: Display Components (Next)

- [ ] Enhance MediaScroller (itemclick event)
- [ ] Create FullscreenMediaViewer modal
- [ ] Integrate into recipe display page
- [ ] Test end-to-end workflow

### Session 5: Testing & Polish (Final)

- [ ] Image compression implementation
- [ ] Caption sanitization
- [ ] Performance testing (Lighthouse)
- [ ] Cross-browser testing
- [ ] Mobile responsiveness testing
- [ ] Deploy to production

---

## ⚠️ Potential Challenges & Solutions

### Challenge 1: File Upload Progress

**Issue**: Large files (videos) may take time to upload
**Solution**:

- Implement progress callback in utility function
- Show progress bar in editor component
- Disable form submission during upload
- Use Firebase Storage `on('state_changed')` listener

### Challenge 2: Hebrew RTL Support

**Issue**: Caption input needs RTL text direction
**Solution**:

- Add `dir="rtl"` to caption `<input>` and `<textarea>`
- Use existing RTL CSS patterns from codebase
- Test with Hebrew text
- Ensure placeholder text is also RTL

### Challenge 3: Drag & Drop Library Integration

**Issue**: `svelte-dnd-action` may conflict with file drag & drop
**Solution**:

- Use different drop zones (file drop vs reorder drop)
- Event propagation control: `event.stopPropagation()`
- Clear visual feedback (different border colors)
- Separate handlers for file drag vs item drag

### Challenge 4: Image Compression

**Issue**: Sharp library needs server-side execution
**Solution**:

- **Option A**: Client-side compression using Canvas API (simpler)
  ```javascript
  const canvas = document.createElement('canvas');
  // Resize and compress using canvas
  canvas.toBlob(
    (blob) => {
      /* upload blob */
    },
    'image/jpeg',
    0.8,
  );
  ```
- **Option B**: Cloud Function for compression (like existing images)
- **Option C**: Accept larger files, compress later (async)

**Recommendation**: Start with Option A (client-side) for simplicity

---

## 📚 Key Patterns & Conventions

### 1. File Naming

```
Utils:       recipe-media-utils.js (kebab-case)
Components:  MediaInstructionsEditor.svelte (kebab-case filename, PascalCase class)
Modals:      fullscreen-media-viewer.js (kebab-case)
```

### 2. Import Patterns

```javascript
// Services (absolute paths with @/)
import { StorageService } from '@/services/storage-service.js';
import { FirestoreService } from '@/services/firestore-service.js';
import { authService } from '@/services/auth-service.js';

// Utils (relative or absolute)
import { uploadMediaInstructionFile } from '@/utils/recipes/recipe-media-utils.js';
```

### 3. Error Handling Pattern

```javascript
try {
  const result = await uploadMediaInstructionFile(file, recipeId, userId);
  showToast('העלאה הושלמה בהצלחה', 'success');
  return result;
} catch (error) {
  console.error('Upload failed:', error);
  showToast('העלאה נכשלה. נסה שוב.', 'error');
  throw error; // Re-throw if caller needs to handle
}
```

### 4. Data Validation Pattern

```javascript
// Always validate before saving
const validation = validateMediaInstructionData(mediaInstructions);
if (!validation.valid) {
  showErrors(validation.errors);
  return false;
}
// Proceed with save
```

### 5. Event Dispatching Pattern (Svelte)

```javascript
import { createEventDispatcher } from 'svelte';
const dispatch = createEventDispatcher();

// Dispatch event
dispatch('data-changed', { mediaInstructions });

// Listen in parent
<MediaInstructionsEditor on:data-changed={handleDataChanged} />;
```

---

## 🧪 Testing Strategy

### Unit Tests

**File**: `src/lib/utils/recipes/recipe-media-utils.test.js`

- Test `uploadMediaInstructionFile()` with mock Storage
- Test `deleteMediaInstructionFile()` error handling
- Test `validateMediaInstructionData()` with valid/invalid data

### Component Tests

**File**: `src/lib/recipes/media-instructions/MediaInstructionsEditor.test.js`

- Test file upload interaction
- Test caption input
- Test delete functionality
- Test reordering (drag & drop simulation)

### Integration Tests

- Full form workflow: Propose → Save → Load → Edit
- Display workflow: Load recipe → View media → Fullscreen
- Upload workflow: Select file → Upload → See in list

### Manual Testing Checklist

- [ ] Upload JPG image (< 5MB)
- [ ] Upload PNG image (< 5MB)
- [ ] Upload MP4 video (< 20MB)
- [ ] Upload WEBM video (< 20MB)
- [ ] Try to upload > 50MB file (should fail)
- [ ] Try to upload PDF (should fail)
- [ ] Hebrew caption input (RTL)
- [ ] Reorder media items (drag & drop)
- [ ] Delete media item
- [ ] Save form with media
- [ ] Load form with media
- [ ] View media on recipe display page
- [ ] Open fullscreen viewer
- [ ] Navigate with arrows in fullscreen
- [ ] Test on mobile (touch gestures)
- [ ] Test on different browsers

---

## 📊 Progress Tracking

We'll track progress using:

1. **Task Master** - Task status updates
2. **Implementation Doc** - Phase completion checkboxes
3. **Git Commits** - Granular implementation history

### Task Master Commands

```bash
# Mark subtasks complete
task-master set-status 2 in-progress  # Start Task #2
task-master set-status 2 done         # Complete Task #2

# Update task details
task-master update-task 2 --prompt "Completed upload and delete functions, added tests"
```

---

## 🎯 Success Criteria

**Phase 3 Complete When:**

- [x] All 3 utility functions implemented and tested
- [ ] MediaInstructionsEditor component functional
- [ ] Recipe form integration working
- [ ] Can create recipe with media instructions
- [ ] Can edit recipe with media instructions
- [ ] Data persists to Firestore correctly

**Phase 4 Complete When:**

- [ ] MediaScroller enhanced with click events
- [ ] Fullscreen viewer functional
- [ ] Recipe display shows media instructions
- [ ] Can view media in fullscreen
- [ ] Navigation works (previous/next)

**Phase 5 Complete When:**

- [ ] Image compression implemented
- [ ] XSS prevention verified
- [ ] Performance tests pass (Lighthouse > 90)
- [ ] Cross-browser tests pass
- [ ] Mobile responsiveness verified
- [ ] Production deployment successful

---

## 📝 Notes & Decisions

### Design Decisions

1. **Collaborative Model** - Any auth user can add media (matches Firestore)
2. **50MB File Limit** - Balance between quality and storage costs
3. **Client-Side Compression** - Simpler than Cloud Functions for MVP
4. **Optional Field** - Backward compatible with existing recipes

### Technical Decisions

1. **Use existing MediaScroller** - No need to rebuild, just enhance
2. **Separate storage path** - `/recipes/{id}/media-instructions/` avoids conflicts
3. **UUID for IDs** - Ensures uniqueness across all media
4. **Order field** - Explicit ordering rather than array index (allows future reordering)

---

**Last Updated**: October 19, 2025
**Next Review**: After Phase 3 completion
