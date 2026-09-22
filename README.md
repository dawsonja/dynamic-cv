# ShapeShift dynamic CV prototype

## Test the UI locally

Install dependencies with `npm install`, then use Node.js to run the local app.

## AI configuration

Copy [`.env.example`](.env.example) to a local `.env` file for server-side AI configuration. Add one OpenRouter key there; OpenRouter exposes a unified, OpenAI-compatible API for the Jev decision model and multiple writing/editor models.

The intended model responsibilities are:

- `JEV_MODEL`: classify job descriptions, score target-role fit, identify level, and gate low-confidence recommendations.
- `CV_WRITER_MODEL`: produce a first draft of CV bullet rewrites and bios.
- `CV_EDITOR_MODEL`: check the draft against the supplied CV and market evidence before it is shown to the user.

The local server now exposes `POST /api/career-analysis`. Set `JEV_PROVIDER=typesafe` to call Jev directly at `https://api.typesafe.ai/v1/systemone`, or `openrouter` to use the fallback. It then drafts with the writer model and asks the editor model to reject unsupported claims. API keys stay server-side and must never be committed to Git.

1. Start the development server:

   ```bash
   npm run dev
   ```

2. Open [http://localhost:4173](http://localhost:4173) in a browser.

3. Exercise the main flows:
   - Upload a text-based PDF or DOCX. The app extracts its text and automatically starts the diagnosis; it does not retain the uploaded file.
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
