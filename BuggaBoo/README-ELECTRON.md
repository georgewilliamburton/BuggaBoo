BuggaBoo Studio - Electron packaging guide

Quick start:
1. Install Node.js (recommended 18.x/20.x LTS)
2. In the `BuggaBoo` folder run:

```bash
npm install
npm run start    # Run Electron during development
npm run build    # Build distributable (requires electron-builder)
```

Notes:
- The build uses `electron-builder` and creates an NSIS installer in `dist/`.
- Ensure `icon.ico` exists in the project root if you want a custom app icon.
- For small devices you can run `npm run start` and test the UI.
