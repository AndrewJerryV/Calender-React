# Interactive Wall Calendar (React)

Polished, responsive wall-calendar inspired component built for the frontend engineering challenge.

## What This Includes

- Wall calendar visual style with:
  - spiral binding
  - hero image panel
  - angled color ribbon
  - paper-like notes area + calendar grid
- Date range selection:
  - pick start date then end date
  - clear visual states for start, end, in-range, and hover-preview
- Integrated notes:
  - monthly general notes
  - notes attached to selected day or date range
  - quick access to saved date-range notes for current month
- Fully responsive layout:
  - desktop: segmented wall-calendar composition
  - mobile: stacked layout with touch-friendly controls
- Standout touches:
  - month-aware color themes and hero imagery
  - month flip animation on navigation
  - holiday markers
- Persistence:
  - all notes saved to localStorage

## Tech

- React 18
- TypeScript
- Vite
- CSS (no UI framework)

## Run Locally

```bash
npm install
npm run dev
```

Then open the local URL printed by Vite.

## Build

```bash
npm run build
npm run preview
```

## Project Structure

- `src/components/InteractiveWallCalendar.tsx`: main interaction logic
- `src/components/InteractiveWallCalendar.css`: component styling
- `src/App.tsx`: app entry wrapper
- `src/styles.css`: global shell and background styling
