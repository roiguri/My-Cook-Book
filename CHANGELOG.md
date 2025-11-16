# Changelog

All notable changes to Our Kitchen Chronicles will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Planned

- Pending images approval functionality (UI exists, backend not implemented)

---

## [1.2.0] - 2025-11-16

### Added

- Multi-image batch approval modal with Approve All/Reject All buttons
- Image proposal workflow - users can suggest images for existing recipes
- Direct navigation for single search results with Hebrew toast notification
- Recipe name now appears in browser tab title instead of recipe ID
- Loading spinner when submitting recipe edits
- Mobile-friendly click-to-toggle controls for images

### Changed

- Images automatically migrate to new category folder when recipe category changes
- Replaced element-scroller with native browser recipe-scroller component
- Loading overlay now prevents page scrolling when active
- Upload area hidden in approval-only mode for image modals
- Replaced placeholder image for recipe cards for recipes with no image.

### Fixed

- Undefined values no longer saved to Firestore in recipe proposals
- Image URLs update correctly after category migration
- Multiple images now migrate correctly (previously only first image)
- Modal overflow fixed - images scroll horizontally without breaking layout
- Cook mode toggle is now mobile-friendly with proper touch targets
- Modal scroll behavior improved on iOS and Android
- Image uploads optimized to prevent duplicates
- Primary image flag now preserved during category migration
- Removed images are properly respected in Approve All/Reject All operations

### Technical

- 23 commits, 31 files changed (+2,015 lines, -1,842 lines)
- Refactored loading spinner to use built-in overlay mode
- Consolidated image approval logic across all contexts
- Improved performance of recipe scroller component

---

## Template for Future Releases

```markdown
## [X.Y.Z] - YYYY-MM-DD

### Added

- New features

### Changed

- Changes to existing functionality

### Deprecated

- Features that will be removed in upcoming releases

### Removed

- Removed features

### Fixed

- Bug fixes

### Security

- Vulnerability fixes

### Technical

- Behind-the-scenes improvements
```

---

## Version History

- [1.2.0] - 2025-11-16 - Image approval improvements, search enhancements
- More releases to be documented as they are deployed...
