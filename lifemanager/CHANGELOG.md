# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Added
- **Daily Summary**: Added "Supplementary Record" (补录) button to the "Today's Focus" panel header.
- **Components**: Created `SupplementaryFocusModal` component to unify manual record entry logic across pages.
- **Services**: Added `addSupplementaryRecord` service function to ensure consistent data validation and storage.
- **Tests**: Added unit tests (`DailySummary.SupplementaryButton.test.tsx`) and E2E tests (`supplementary.e2e.ts`) for the new feature.

### Changed
- **Focus Timer**: Refactored to use the shared `SupplementaryFocusModal` component, ensuring UI and logic consistency with Daily Summary.
