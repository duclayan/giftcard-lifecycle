# GiftCard LifeCycle Dashboard

A professional ReactJS dashboard for managing and analyzing gift card activity, built with Material-UI. This app visualizes gift card data, event timelines, risk analytics, and provides advanced search, sorting, and security context for fraud detection.

## Features
- 🎁 Modern UI with Material-UI and custom gift emoji branding
- Search and filter by gift card number, status, channel, and IP address
- Sort by gift card number, risk score, or IP address
- Color-coded risk analytics for fraud detection
- Tooltips for security context on all key fields
- Event timeline visualization for each gift card
- Responsive, full-width layout

## Data Model
- `src/data/GiftCards.json`: Gift card details
- `src/data/GiftCardEvents.json`: Event history for each card
- Python script for generating realistic event data

## Getting Started
1. **Install dependencies:**
   ```bash
   npm install
   ```
2. **Start the app:**
   ```bash
   npm start
   ```
   The dashboard will open at `http://localhost:3000`.

## Customization
- To change the favicon, edit `public/favicon.svg`.
- To update data, modify the JSON files in `src/data/`.

## Security & Analytics
- Risk scores are calculated based on error events per card
- Tooltips provide guidance for security analysis
- Timeline shows all activity for selected cards

## Deployment: Azure Static Web Apps

To deploy this app to Azure Static Web Apps from GitHub:

1. Push your code to a GitHub repository.
2. In the Azure Portal, create a new Static Web App and connect it to your repo.
3. Use these settings when prompted:
   - **Build Preset:** `Create React App`
   - **App location:** `/` (root)
   - **Api location:** (leave blank)
   - **Output location:** `build`
4. The included `staticwebapp.config.yaml` ensures correct routing for React SPA.
5. On push to your repo, Azure will build and deploy automatically.

## License
MIT

---
Made with ❤️ and 🎁 by duclayan and GitHub Copilot.
