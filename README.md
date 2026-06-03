# DeskHub — Capstone Project

A vanilla-JS support ticket dashboard. Build it after completing the 27-session JavaScript training.

> **For the full project specification, read [PROJECT_GUIDE.md](./PROJECT_GUIDE.md).**
> **For the day-by-day checklist (Days 28–32), read [DAILY_TASKS.md](./DAILY_TASKS.md).**

---

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Run the API + UI together (one command)
npm run dev
```

This starts two things:

| Service | URL | Purpose |
|---|---|---|
| `json-server` | http://localhost:3001 | Fake REST API (CRUD over `db.json`) |
| `live-server` | http://localhost:8080 | Static file server with auto-reload |

---

## What You Need to Create

You're given:

- A working backend (`json-server` over `db.json`) — no backend code needed
- Stub JS modules in `src/` with TODO comments showing what to implement
- An empty `public/` folder

**You build:**

- All HTML files inside `public/` (login, dashboard, tickets list, ticket detail, etc.)
- All CSS — the project has no design tokens; make it look professional
- All JS logic inside `src/` — every TODO in every stub
- The full README explaining your architecture (you'll edit this file)

---

## Folder Structure

```
deskhub-starter/
├── package.json          ← given
├── db.json               ← given (seed data: 5 users, 30 tickets, 20 comments)
├── README.md             ← given (you edit)
├── PROJECT_GUIDE.md      ← given (read this first!)
├── public/               ← YOU create — HTML + CSS lives here
│   ├── index.html        ← (you build)
│   ├── styles/           ← (you build)
│   └── ...
└── src/                  ← partially given — stubs to fill in
    ├── main.js           ← stub
    ├── api/
    │   ├── client.js     ← stub (generic fetch wrapper)
    │   ├── tickets.js    ← stub (ticket CRUD calls)
    │   └── auth.js       ← stub (login / logout)
    ├── modules/
    │   ├── auth.js       ← stub (login UI wiring)
    │   ├── tickets.js    ← stub (list page logic)
    │   ├── ticketDetail.js ← stub (detail page logic)
    │   ├── form.js       ← stub (form validation)
    │   └── ui.js         ← stub (toast, modal, loader)
    └── utils/
        ├── debounce.js   ← stub
        ├── formatDate.js ← stub
        └── storage.js    ← stub (localStorage wrapper)
```

---

## API Cheatsheet

`json-server` gives you a full REST API over `db.json`. No code needed on the backend side.

```
# Tickets
GET    /tickets                              — list all
GET    /tickets?status=open                  — filter
GET    /tickets?_sort=createdAt&_order=desc  — sort
GET    /tickets?_page=1&_limit=10            — paginate
GET    /tickets?q=login                      — full-text search
GET    /tickets/:id                          — one ticket
POST   /tickets                              — create
PATCH  /tickets/:id                          — partial update
DELETE /tickets/:id                          — delete

# Comments (filter by ticket)
GET    /comments?ticketId=:id
POST   /comments

# Users (for fake login)
GET    /users?email=:email
```

Combine query params: `GET /tickets?status=open&priority=urgent&_sort=createdAt&_order=desc&_page=1&_limit=10`

Full json-server docs: https://github.com/typicode/json-server/tree/v0.17.4

---

## Demo Login Credentials

Any of these work for local login (passwords are visible — this is a learning project, not production):

```
priya@deskhub.in   /  demo123   (admin)
aarav@deskhub.in   /  demo123   (agent)
riya@deskhub.in    /  demo123   (agent)
anaya@deskhub.in   /  demo123   (agent)
kabir@deskhub.in   /  demo123   (agent)
```

---

## Submission

1. Push your work to a GitHub repo
2. Update this README — replace these sections with your actual setup notes, screenshots, architecture choices, and known limitations
3. Send the repo link to your trainer

Good luck. Build something you'd be proud to show in an interview.
