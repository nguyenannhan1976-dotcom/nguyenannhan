# System Instructions for AI Coding Assistant

## UI/UX Rules
1. Do not use standard window dialogs: `window.alert`, `window.confirm`, or `window.prompt` in any generated HTML products or inside the React app itself.
2. If confirmation or alerting is needed, ALWAYS generate or use a custom Modal (HTML/CSS/JS) or Toast component.
3. When generating HTML games via the AI prompt (in `App.tsx` or `GamePreview.tsx`), ensure the system prompt explicitly forbids using `window.alert`, `window.confirm`, or `window.prompt` and instructs the generation of a custom modal instead.
