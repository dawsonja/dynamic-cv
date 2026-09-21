# ShapeShift dynamic CV prototype

## Test the UI locally

The prototype has no package dependencies. You only need Node.js for the build check and Python 3 to serve the files.

1. Start the development server:

   ```bash
   npm run dev
   ```

2. Open [http://localhost:4173](http://localhost:4173) in a browser.

3. Exercise the main flows:
   - Remove the example CV and upload a PDF or DOCX.
   - Select and deselect target industries.
   - Apply or dismiss CV recommendations.
   - Switch between **CV Review** and **Bio Builder**.
   - Resize the browser below 900 px and 520 px to inspect the responsive layouts.

Stop the server with <kbd>Ctrl</kbd>+<kbd>C</kbd>.

## Test the production build

```bash
npm run build
npm run preview
```

Open [http://localhost:4173](http://localhost:4173) again. The preview command serves the generated `dist/` directory rather than the source tree.

For a quick non-visual validation, run:

```bash
node --check src/main.js
git diff --check
```
