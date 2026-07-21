# Product Backlog

This file is the concise delivery index for active BEAST Travel work. Detailed
engineering context lives in [`docs/ROADMAP.md`](docs/ROADMAP.md).

| ID | Capability | Status |
| --- | --- | --- |
| BT-020 | Travel Inbox foundation | Complete |
| BT-021 | Reservation import pipeline foundation | Complete |
| BT-022 | Reservation document analysis | Complete |
| BT-023 | OCR extraction, review, approval, and imported logistics | Complete |
| BT-024 | Unified trip timeline and Today dashboard | Implemented on feature branch |
| BT-025 | Progressive Web App and offline Travel Pack | Implemented on feature branch |

## Follow-up candidates

- Validate and correct low-confidence approved reservation fields before travel.
- Add automatic in-page clock refresh if the Today page must remain open across
  an event boundary without navigation or reload.
- Add end-to-end offline/install automation when a browser-test framework is selected.
- Consider an explicitly encrypted device-storage model before adding passport
  numbers, insurance policy numbers, or personal emergency contacts.
- Evaluate downloadable regional map data separately; BT-025 retains only map
  images and tiles that the traveler has already viewed.
