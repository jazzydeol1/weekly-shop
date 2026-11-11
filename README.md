# Deol Weekly Shop

A small phone app for the family to vote on the weekly Ocado shop. Pam approves the final basket with her PIN.

## How it works each week
1. Claude plans next week's shop from past Ocado orders, current offers and the calendar, then updates `plan.json`.
2. Everyone gets a reminder with the link, picks A, B or both on 2–3 choices, and adds a comment if they want.
3. Pam reviews everyone's picks and approves with her PIN.
4. Claude reads the approval from the Google Sheet, fills the Ocado trolley and books a weekend slot. Jas confirms the checkout.

## Files
- `index.html` — the app
- `plan.json` — this week's plan, written by Claude
- `config.js` — the Google Apps Script URL that saves votes
- `apps-script/Code.gs` — backend code for the "Deol Weekly Shop" Google Sheet (not used by the page directly)

## Setup
1. **Google Sheet backend**
   - Open the "Deol Weekly Shop" sheet in Google Drive → Extensions → Apps Script.
   - Replace the code with `apps-script/Code.gs` and save.
   - Project Settings → Script properties → add `PAM_PIN` with Pam's PIN.
   - Deploy → New deployment → type **Web app**, Execute as **Me**, Who has access **Anyone** → Deploy, and allow access.
   - Copy the web app URL (ends in `/exec`) into `config.js`.
2. **GitHub Pages**
   - Repo Settings → Pages → Deploy from branch `main`, folder `/ (root)`.
   - The app will be at `https://sportsdevhub.github.io/weekly-shop/`.
3. **On each phone**: open the link → Share → *Add to Home Screen* (iPhone), or menu → *Install app* (Android).

Without a URL in `config.js` the app runs in demo mode (votes stay on the phone, demo PIN 1234).

Note: GitHub Pages on a free plan needs a public repo, so `plan.json` (the shopping list) is publicly readable. It holds no address or payment details.
