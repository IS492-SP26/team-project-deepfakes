# Sentinel — Threat Intelligence Prototype

A lightweight Next.js prototype for ingesting, triaging, and archiving threat intelligence.

## Quick Start

```bash
cd sentinel
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Pages

| Route | Description |
|-------|-------------|
| `/` | **Ingestion** — Paste raw threat data and run extraction |
| `/clinical?id=...` | **Clinical View** — Split-screen raw text vs. extracted intelligence cards |
| `/archive` | **Archive** — Data table of all approved incidents |

## Stack

- **Next.js 15** (App Router, Server Actions)
- **Tailwind CSS** + custom dark cybersecurity theme
- **Shadcn UI** component patterns (Button, Card, Badge, Textarea)
- **Lucide Icons**
- In-memory mock data store (resets on server restart)
