# Roadmap

> **Resumen en español:** el objetivo es que alguien arme su backend y el front sea "ensamblar Legos". La prueba de fuego es reconstruir el panel de BotTurno sólo con PanelKit. El editor corre local (`npx panelkit`), el proyecto se guarda como `panelkit.json` en tu repo, exporta React y también puede correr el JSON en vivo. 100% gratis y open source.

PanelKit is done when a small business without a programmer, or a dev who only wants to write the backend, can assemble a full internal system like a bookings panel or a CRM by dragging blocks, and ship it.

**Proof project:** rebuild a real bookings panel (courts, availability grid, agenda, payments, customers, reports) with PanelKit alone.

## Principles

- Everything is JSON (`panelkit.json`), versioned in the user's repo.
- Data source agnostic: any REST API today; adapters for the rest.
- React export you own, plus a runtime that renders the JSON without exporting.
- Modern minimal defaults, Motion animations, Tailwind v4.
- Never copy commercial template code or assets; every block is written here.

## Milestones

### 1. Blocks for real panels — in progress
- [x] Charts: bar, line, area, donut (no chart library)
- [x] Calendar (week / month)
- [x] Availability grid (resources × time slots, click a free slot to book)
- [x] Activity timeline
- [x] Status badges with meaningful colors
- [x] Row actions (edit / delete) and a confirmation step for any event
- [x] Quick filter chips on tables; money, date-time and yes/no columns
- [x] Form fields: time, date-time, phone, URL, password
- [x] Record detail (side panel) and edit-in-modal
- [x] Tabs, sections, modals and rows/columns (blocks that contain other blocks)
- [ ] Wizard (steps)
- [x] Repeater: any blocks once per record (cards, galleries, lists)
- [x] Basic elements: text, image, divider, spacer
- [x] Show only if: conditions picked from lists, code optional
- [x] Kanban by status (drag cards, saves to your API, column totals)
- [x] File / image upload in forms (sent as data URL in JSON)
- [ ] Rich text, map, notifications

### 2. Auth and roles
- [x] Login against your own API (email + password, token stored, sent on every call), demo users for sample data
- [x] Roles: show or hide pages and blocks per role
- [x] Logout and "who am I" in the shell, {{user.x}} in texts
- [ ] Session expiry / refresh token

### 3. Local first: `npx panelkit`
- [ ] CLI that opens the editor on `localhost` and reads/writes `panelkit.json` in the current repo
- [ ] Export straight into a folder of the repo (no zip), ready to commit and push to GitHub
- [ ] Version history from the file (undo across sessions)

### 4. Runtime mode
- [ ] `@panelkit/runtime`: render a `panelkit.json` in any React app without exporting
- [ ] Same blocks, same actions, same theme as the export

### 5. Any data source
- [ ] REST: pagination, auth header presets, error messages, OpenAPI import (create queries from a spec)
- [ ] Adapters: Supabase, Firebase, Google Sheets, Airtable, GraphQL
- [ ] Optional small server for direct Postgres / MySQL

### 6. Editor comfort
- [x] Mobile / tablet preview, widths and hiding per device
- [x] Right-click menu, copy/paste, block search, layers panel, inline text editing, free CSS
- [ ] Free placement grid (rows and columns, Figma-like)
- [ ] Design comments
- [ ] English / Spanish UI
- [ ] AI: describe a panel, get a first draft (nice to have)

### 7. Templates
- [x] CRM, Bookings
- [ ] Inventory, Billing, Gym / clubs, Clinic, Real estate, Support tickets, School

### 8. Launch on GitHub
- [ ] Live demo, GIF in the README, docs site, "good first issue" labels, contributing guide
