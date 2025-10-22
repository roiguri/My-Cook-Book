# Product Requirements Document: Recipe Media Instructions

## 1. Overview

### Problem Statement

Currently, recipes in My-Cook-Book support text-based instructions only. Users need visual guidance (images/videos) to better understand cooking steps, especially for complex techniques or unfamiliar ingredients. Adding media instructions will significantly improve recipe usability and user cooking success.

### Solution Summary

Add a new "Media Instructions" feature that allows recipe creators to attach images or videos to cooking steps, with descriptive text. Display these media instructions in an interactive, scrollable format using the existing media-scroller component.

## 2. Goals & Success Metrics

### Primary Goals

- **Enhance Recipe Clarity**: Provide visual guidance for cooking steps
- **Improve User Success**: Reduce cooking failures through better instruction clarity
- **Maintain Performance**: Leverage existing components without major architectural changes

### Success Metrics

- 30% of new recipes include media instructions within 3 months
- Increased recipe completion rate (measured by user feedback)
- No performance degradation in recipe loading times
- Zero security incidents with uploaded media files

## 3. User Stories

### As a Recipe Creator

- I want to upload images/videos for cooking steps so users can see exactly what each step should look like
- I want to add descriptive text to each media item to explain the cooking technique
- I want to reorder media instructions to match the cooking sequence
- I want to preview how media instructions will appear to users

### As a Recipe User

- I want to view step-by-step visual instructions while cooking
- I want to see media in fullscreen for better detail
- I want to navigate through media instructions easily on mobile while cooking
- I want media to load quickly without interrupting my cooking flow

## 4. Technical Requirements

### 4.1 Data Structure

#### Recipe Document Extension (Firestore)

```javascript
{
  // Existing recipe fields...
  mediaInstructions: [
    {
      id: String, // Unique identifier
      path: String, // Firebase Storage path
      caption: String, // Hebrew instruction text
      type: 'image' | 'video', // Media type
      order: Number, // Display order
      uploadedBy: String, // User ID
      uploadedAt: Timestamp, // Upload timestamp
    },
  ];
}
```

#### Storage Structure (Firebase Storage)

```
/recipes/{recipeId}/media-instructions/
  ├── step1_image.jpg
  ├── step2_video.mp4
  └── step3_image.png
```

### 4.2 Component Architecture

#### Media Instructions Editor (New Component)

- **File**: `src/lib/recipes/media-instructions/media-instructions-editor.js`
- **Purpose**: Form component for editing media instructions
- **Features**:
  - File upload with drag & drop
  - Caption text input (Hebrew support)
  - Live preview using media-scroller
  - Reorder functionality
  - Delete individual items
  - File validation (type, size)

#### Media Instructions Display (Enhanced Existing)

- **Component**: Enhance existing `media-scroller`
- **Features**:
  - Click-to-fullscreen modal
  - Touch/keyboard navigation
  - Responsive design
  - Loading states

#### Data Layer Extensions

- **File**: `src/js/utils/recipes/recipe-media-utils.js`
- **Functions**:
  - `uploadMediaInstructionFile(file, recipeId, stepId)`
  - `deleteMediaInstructionFiles(recipeId, mediaInstructions)`
  - `validateMediaInstructionData(mediaInstructions)`

### 4.3 Integration Points

#### Recipe Form Component

- Add new "Media Instructions" section after regular instructions
- Integrate with existing validation system
- Support simultaneous text and media instructions

#### Recipe Display Component

- Show media instructions below text instructions
- Responsive layout for mobile/desktop
- Progressive loading of media content

#### Recipe Data Utils

- Extend `validateRecipeData()` for media instructions
- Update `formatRecipeData()` to handle media instructions
- Add sanitization for media URLs and captions

## 5. User Interface Specifications

### 5.1 Recipe Form (Edit Mode)

#### Layout

```
[Existing Recipe Form Sections]

┌─ Media Instructions (הוראות הכנה מצולמות) ─┐
│ [+ Add Media Instruction]                  │
│                                           │
│ ┌─ Media Item 1 ──────────────────────┐   │
│ │ [Image/Video Preview]    [Delete]    │   │
│ │ Caption: [Text Input]                │   │
│ │ [≡ Drag Handle]                      │   │
│ └─────────────────────────────────────┘   │
│                                           │
│ ┌─ Media Item 2 ──────────────────────┐   │
│ │ [Image/Video Preview]    [Delete]    │   │
│ │ Caption: [Text Input]                │   │
│ │ [≡ Drag Handle]                      │   │
│ └─────────────────────────────────────┘   │
│                                           │
│ Preview: [Media Scroller Component]       │
└───────────────────────────────────────────┘
```

#### File Upload Modal

```
┌─ Add Media Instruction ─────────────────┐
│ Drag & Drop Files Here                  │
│ ┌─────────────────────────────────────┐ │
│ │  📁 Select Files or Drop Here       │ │
│ │                                     │ │
│ │  Supported: JPG, PNG, WEBP, MP4    │ │
│ │  Max Size: 50MB per file           │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ Caption (תיאור):                        │
│ [Text Input - Hebrew]                   │
│                                         │
│ [Cancel] [Upload]                       │
└─────────────────────────────────────────┘
```

### 5.2 Recipe Display (View Mode)

#### Layout

```
[Recipe Header, Ingredients, Instructions]

┌─ Media Instructions (הוראות הכנה מצולמות) ─┐
│ ▼ Click to expand/collapse                │
│                                           │
│ [◀] [Media 1] [Media 2] [Media 3] [▶]     │
│     Caption text here                     │
│                                           │
│ • Click any media for fullscreen         │
│ • Swipe on mobile for navigation         │
└───────────────────────────────────────────┘
```

#### Fullscreen Modal

```
┌─ Fullscreen Media View ─────────────────┐
│                                    [✕]  │
│                                         │
│         [Large Media Content]           │
│                                         │
│ [◀ Previous]     Caption Text    [Next ▶] │
│                                         │
│ Step 2 of 5                            │
└─────────────────────────────────────────┘
```

## 6. Technical Implementation Details

### 6.1 File Upload & Storage

#### Upload Process

1. User selects files in form
2. Client-side validation (type, size)
3. Upload to Firebase Storage via `StorageService`
4. Generate storage path: `recipes/{recipeId}/media-instructions/{stepId}_{filename}`
5. Store metadata in component state
6. On recipe save, write mediaInstructions array to Firestore

#### File Validation

- **Image Types**: JPG, PNG, WEBP
- **Video Types**: MP4, WEBM
- **Size Limits**: 50MB per file
- **Security**: Validate MIME types, scan for malicious content

### 6.2 Data Flow

#### Create/Edit Recipe

```
User uploads media → StorageService.uploadFile() → Firebase Storage
User adds caption → Component state updated
User saves recipe → mediaInstructions → Firestore document update
```

#### Display Recipe

```
Recipe loads → Get mediaInstructions from Firestore
Media paths → Generate signed URLs if needed
Component renders → media-scroller displays items
User clicks item → Fullscreen modal opens
```

### 6.3 Performance Considerations

#### Optimization Strategies

- **Lazy Loading**: Load media only when section is expanded
- **Compression**: Automatically compress large images on upload
- **Caching**: Leverage browser cache for repeated media access
- **Progressive Loading**: Show thumbnails first, full media on demand

#### Storage Quotas

- Monitor storage usage per recipe
- Implement cleanup for deleted recipes
- Consider video compression recommendations

## 7. Security & Privacy

### 7.1 Upload Security

- Server-side file type validation
- Virus scanning for uploaded files
- Content moderation for inappropriate images
- User authentication required for uploads

### 7.2 Firebase Security Rules

```javascript
// Storage rules extension
match /recipes/{recipeId}/media-instructions/{allPaths=**} {
  allow read: if true; // Public read access
  allow create: if request.auth != null
    && isValidMediaFile(request.resource)
    && userOwnsRecipe(recipeId, request.auth.uid);
  allow update, delete: if request.auth != null
    && userOwnsRecipe(recipeId, request.auth.uid);
}

function isValidMediaFile(resource) {
  return resource.size < 50 * 1024 * 1024 // 50MB
    && (resource.contentType.matches('image/.*') ||
        resource.contentType.matches('video/.*'));
}
```

### 7.3 Content Guidelines

- No copyrighted material
- Family-friendly content only
- Clear cooking-related content
- Respect privacy (no faces without permission)

## 8. Testing Requirements

### 8.1 Unit Tests

- Media upload functionality
- Data validation functions
- Component rendering with various media types
- Error handling for failed uploads

### 8.2 Integration Tests

- Recipe form with media instructions
- Recipe display with media content
- Media-scroller component integration
- Fullscreen modal functionality

### 8.3 User Acceptance Tests

- Upload various file types and sizes
- Mobile responsiveness testing
- Hebrew text input and display
- Cross-browser compatibility

### 8.4 Performance Tests

- Recipe loading with large media files
- Multiple media items rendering
- Mobile performance with limited bandwidth
- Storage quota impact testing

## 9. Rollout Plan

### Phase 1: Core Implementation (4-6 weeks)

- [ ] Data structure setup (Firestore schema)
- [ ] Media upload component development
- [ ] Media-scroller enhancements
- [ ] Firebase Storage integration
- [ ] Basic security rules

### Phase 2: Form Integration (2-3 weeks)

- [ ] Recipe form integration
- [ ] Validation system updates
- [ ] Preview functionality
- [ ] Error handling and user feedback

### Phase 3: Display & Polish (2-3 weeks)

- [ ] Recipe display integration
- [ ] Fullscreen modal implementation
- [ ] Mobile optimization
- [ ] Performance optimization

### Phase 4: Testing & Launch (1-2 weeks)

- [ ] Comprehensive testing
- [ ] User feedback collection
- [ ] Documentation updates
- [ ] Feature rollout to users

## 10. Future Enhancements

### Post-Launch Improvements

- **Video Thumbnails**: Auto-generate thumbnails for videos
- **Media Editing**: Basic image editing tools (crop, rotate)
- **Bulk Upload**: Upload multiple files at once
- **Media Library**: Reuse media across recipes
- **Voice Instructions**: Audio narration for steps
- **AI Suggestions**: Auto-suggest optimal media for recipe steps

### Analytics & Insights

- Track media instruction usage rates
- Identify most helpful media types
- Monitor storage costs and optimization opportunities
- User engagement metrics for media-enhanced recipes

## 11. Dependencies & Risks

### Technical Dependencies

- Firebase Storage quotas and pricing
- Existing media-scroller component stability
- Mobile browser video playback support
- Network bandwidth for media loading

### Risk Mitigation

- **Storage Costs**: Implement compression and cleanup policies
- **Performance**: Progressive loading and caching strategies
- **Security**: Comprehensive validation and content moderation
- **User Adoption**: Clear UI/UX and help documentation

---

**Document Version**: 1.0  
**Last Updated**: Current Date  
**Next Review**: After Phase 1 completion
