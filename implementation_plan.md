# CocktailClips Implementation Plan

## Product definition

CocktailClips is a local batch short-video generator, not a general-purpose nonlinear editor.

Primary workflow:

```text
Source video + SRT/transcript
        ↓
External AI scene plan (paste or JSON upload)
        ↓
Validate and preview timestamps
        ↓
Cut all planned clips with FFmpeg
        ↓
Create hook frame + subscribe outro
        ↓
Render one 9:16 reel locally
        ↓
Preview and download final MP4
```

## Product rules

- The external AI creates the scene plan; CocktailClips imports and executes it.
- The backend is authoritative for project state and processing status.
- The UI must never show completion based only on a frontend timer.
- Every operation must show actionable validation and error states.
- Advanced project JSON editing remains available, but is not part of the primary path.
- All source, intermediate, and final files remain inside the local project directory.

## Target project structure

```text
projects/{project_id}/
├── source.mp4
├── source.srt                 # optional transcript
├── scene-plan.json            # normalized imported AI plan
├── project.json               # single source of truth
├── clips/
│   ├── 001.mp4
│   └── 002.mp4
└── final/
    └── reel.mp4
```

## Canonical AI plan format

```json
{
  "clips": [
    {
      "id": "001",
      "start": "00:02:13.500",
      "end": "00:02:42.800",
      "title": "He revealed the secret",
      "hook": "You won't believe what he admitted",
      "next_hook": "Follow for more"
    }
  ]
}
```

The importer should also accept common variants such as `scenes`, `start_time`, `end_time`, `description`, and missing optional hook fields.

---

## Phase 1 — Import and validate external AI plan

### Task 1 — AI scene-plan importer

- Add a visible importer to the single-page workflow.
- Support paste-from-clipboard JSON.
- Support `.json` upload.
- Validate JSON syntax and accepted scene-plan shapes.
- Normalize `clips`/`scenes` and timestamp field variants.
- Reject invalid timestamps, missing ranges, negative ranges, and `start >= end`.
- Preview imported rows before applying them.
- Import into the backend project through `/projects/import-scenes`.
- Refresh project state after successful import.
- Show imported count, invalid rows, and actionable errors.
- Remove the fake “Analyze Video” behavior from the primary workflow.

### Acceptance criteria

- A user can paste an AI response and see the detected clips before importing.
- A user can upload a JSON plan and see the same preview.
- Invalid JSON never changes the project.
- A successful import updates `project.json` and refreshes the UI.
- The UI clearly tells the user that analysis happens in an external AI tool.

### Status

**Complete.** Implemented in `AIPlanImporter.tsx`, `WorkflowPage.tsx`, `Scenes.tsx`, and `backend/app/main.py`.

## Phase 2 — Real batch clip cutting

### Task 2 — Batch FFmpeg clip cutting

- Add `POST /projects/{id}/cut-all`.
- Process imported planned clips with FFmpeg in project order.
- Extract transcript lines from SRT for each range when available.
- Persist `clip_file`, transcript, status, and per-clip error details.
- Return the refreshed project and a batch summary.
- Replace the frontend simulation in `Clips.tsx` with the real endpoint.
- Show real success/failure counts and allow retrying the batch.

### Acceptance criteria

- The Cut clips action calls the backend, not a frontend timer.
- Every valid planned clip produces a local file under `projects/{id}/clips/`.
- The project JSON contains the generated file and `cut` status.
- A failed clip is reported without falsely marking it complete.
- The UI refreshes from the backend response and shows actionable errors.

### Status

**Implemented.** The backend batch endpoint and frontend integration are in place. Runtime validation with a real MP4, SRT, and FFmpeg installation is still required before marking this production-ready.

## Phase 3 — Source and clip preview

### Task 3 — Real source and clip previews

- Add a backend source-video streaming endpoint.
- Show actual source duration and metadata.
- Add clip preview URLs.
- Show generated clip media in clip cards after cutting.
- Add a simple range preview for imported timestamps.
- Add recut support with real backend calls.

### Acceptance criteria

- The source player loads from the backend project file, not a guessed static path.
- Video duration and current time come from the actual media metadata.
- A cut clip card shows a real local video preview.
- Preview controls open or play the actual generated clip.
- Missing media produces a clear empty state instead of a blank black card.

### Status

**Implemented.** Source and generated-clip streaming, real media metadata, timestamp-bounded scene preview, and backend-connected recut controls are in place. Runtime validation with real media remains before production sign-off.

## Phase 4 — Hook and reel renderer

### Task 4 — Render the final vertical reel

- Extract the first frame from the first included clip for the hook card.
- Add hook text from the imported AI plan.
- Normalize every clip to 1080x1920 / 9:16.
- Add a subscribe/outro card with configurable text.
- Concatenate hook + normalized clips + outro.
- Store one explicit `final/reel.mp4` project output.
- Expose the renderer through `POST /projects/{id}/render-reel`.
- Replace simulated Stitch and Export actions with the real renderer.
- Support rendering selected clips individually with separate branded output files and downloads.

### Acceptance criteria

- Rendering fails with an actionable error when clips are missing or uncut.
- The hook uses an actual first frame from the first included clip.
- The output is 1080x1920 and stored as `final/reel.mp4`.
- The project has an explicit `output.file` and completed output status.
- Export previews and downloads the real generated reel.
- Selected clips can be rendered and downloaded independently.

### Status

**Implemented.** Backend renderer, real Stitch action, real Export action, vertical preview, and download wiring are complete. Runtime FFmpeg verification remains.

## Phase 5 — Final output UX

### Task 5 — Final output state and delivery

- Replace simulated export progress with backend status.
- Add final reel preview.
- Add download button and local file information.
- Add retry for failed render.
- Never mark output complete unless the file exists.

### Acceptance criteria

- Export never displays success without a real `final/reel.mp4`.
- The final output can be previewed in the browser.
- The final output can be downloaded locally.
- A failed render exposes the backend error and allows retry.
- Output dimensions and file size come from the generated file where available.

### Status

**Mostly implemented.** The Export UI uses the real render endpoint, previews the final output, supports download/retry, and the backend persists explicit output state. Dynamic display of output file size/duration and real FFmpeg end-to-end validation remain.

## Phase 6 — Advanced features

### Task 6 — Editable branding settings

- Add a backend branding update endpoint.
- Expose hook duration, outro duration, subscribe text, and channel name in the UI.
- Persist settings in `project.json`.
- Use persisted settings during reel rendering.
- Invalidate the previous output when branding changes.

### Status

**Implemented in code.** The branding endpoint, UI controls, persistence, output invalidation, and renderer integration are present. Runtime verification and using channel/logo assets in the rendered frame remain.

### Later advanced features

- Caption style settings.
- Logo upload.
- Intro/outro asset upload.
- Advanced JSON editor under an advanced section.
- Optional per-clip restitch and recut actions.

## Current implementation risks to remove

- Fake scene analysis and random scenes.
- Frontend-only cutting, stitching, and export timers.
- Static/hardcoded export metadata.
- Silent fallback to copying only the first clip.
- Import UI that claims JSON support but does not submit it.
- Navigation that hides the tools after project creation.

## Phase 7 — Desktop workspace shell

### Task 7 — Projects rail, activity rail, and focused workspace

- Add `GET /projects` to list locally saved projects with name, ID, clip count, and updated time.
- Add a persistent right rail with previous projects at the top.
- Allow switching projects without leaving the workspace.
- Add a persistent activity/log panel below the project list.
- Keep urgent toast messages at the bottom center as a fallback only.
- Use the middle pane for the active workflow input/output.
- Keep the layout responsive by collapsing the right rail below the main pane on small screens.

### Acceptance criteria

- Previous projects are visible without opening a separate dashboard.
- Selecting a previous project loads it in the same workspace.
- Processing messages and errors remain inspectable after a toast disappears.
- The primary workflow remains visually focused and not squeezed by transient popups.

### Status

**Implemented in code.** The three-pane shell, local project rail, persistent activity panel, and bottom fallback notifications are in place. Responsive visual testing remains.
