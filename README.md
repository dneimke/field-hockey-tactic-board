# Field Hockey Tactic Board

![Screenshot of the tactic board](./assets/screenshot.png)

An interactive, browser-based tactic board for field hockey that lets coaches and players draw plays, move pieces, animate sequences, and save/load tactics. It's built with Vite and React + TypeScript for a fast development experience and lightweight production builds.

## Features

- Draw passes, runs, and areas on a resizable pitch
- Place and move player pieces with drag-and-drop
- Animate play sequences and control playback speed
- Save and load tactics locally or export them for sharing
- Lightweight, fast UI powered by Vite and React

## Getting Started

These instructions will get you development-ready in under 2 minutes on Windows, macOS, or Linux.

### Prerequisites

- Node.js 18 or newer (LTS recommended)
- Git (to clone the repo)
- A package manager: `npm`, `yarn`, or `pnpm` (commands below use `npm`)

### Clone and Install

Open a terminal and run:

```pwsh
git clone https://github.com/dneimke/field-hockey-tactic-board.git
cd field-hockey-tactic-board
npm install
```

If you prefer `pnpm`:

```pwsh
pnpm install
```

### Run in Development

Start the dev server with hot-reload (Vite):

```pwsh
npm run dev
```

Then open the app in your browser at the URL printed by Vite (usually `http://localhost:5173`).

### Build for Production

```pwsh
npm run build
npm run preview   # optional: preview the production build locally
```

### Typical Scripts

- `npm run dev` — start the development server
- `npm run build` — create an optimized production build
- `npm run preview` — locally preview the production build

Check the `package.json` for any additional scripts your fork may add.

### Editor Recommendations

- VS Code with the following extensions: `ESLint`, `Prettier`, `TypeScript Hero` (optional)
- Enable format on save and TypeScript checking for the best DX

### Usage Notes

- Use the drawing tools to add passes and areas.
- Drag player pieces to reposition them; use the animation controls to record and play sequences.
- Use the Save/Load modals to persist tactics locally or export JSON for sharing.

### Contributing

Contributions are welcome. Please open issues for bugs or feature ideas and submit pull requests with a clear description of your changes.

Suggested workflow:

```pwsh
git checkout -b feat/awesome
# make changes
npm test      # if tests exist
git commit -am "feat: add awesome"
git push --set-upstream origin feat/awesome
```

### Troubleshooting

- If the dev server fails to start, delete `node_modules` and reinstall: `rm -rf node_modules package-lock.json && npm install` (on PowerShell, use `Remove-Item -Recurse -Force node_modules,package-lock.json`).
- If TypeScript reports type issues, ensure your editor is using the workspace TypeScript version.

### License

This project is MIT-licensed — see the `LICENSE` file if present.

Enjoy using the tactic board! 🎯
