# Changelog

All notable changes to Execution Timer are documented in this file.

## [1.0.1] - 2026-07-15

### Fixed

- Detect debugger pause and continue events through the Debug Adapter Protocol.
- Exclude paused time without getting stuck after continuing.
- Track concurrent debug sessions independently and use a single status update interval.
- Fully reset timer state between sessions and when resetting an active timer.
- Dispose all VS Code event registrations when the extension is deactivated.

### Changed

- Added deterministic unit tests for the timer state machine.
- Replaced deprecated and missing development dependencies.
- Added compile, lint, test, check, and package scripts.
- Cleaned generated source files and project metadata.

## [1.0.0] - 2024-09-03

- Initial release.
