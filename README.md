# GMB Client Hunting & Email Outreach — Dashboard

**Owner:** Reduan Hossain — Digital Marketer | GMB & Local SEO Specialist
**Email:** reduan.digital@gmail.com
**Data source:** Google Sheet “Reduan Leads 2026-11-22 — USA & Canada”
(ID `1Jzwc25KKmMQkji6AGrh_X9q3kXh1Mw9XlOr3RftLB_8`)
**Snapshot:** 26 November 2026, 11:56 +06 (Asia/Dhaka) — 26 leads
**Status:** Local build only. Not published to GitHub yet.

## Real numbers (snapshot 2026-11-26 11:56 +06)

| Metric | Value |
|---|---|
| Total discovered | 26 |
| USA / Canada | 22 / 4 |
| UK / Australia / NZ | 0 (not started — Phase 2) |
| Emails sent | 8 |
| Bounced (never resend) | 2 — Bay Shores (`info@bayshorescleaning.com`, 22 Nov), Oathridge (`toddp@oathridgeroofing.com`, 24 Nov) |
| US drafts unsent | 12 |
| Canada drafts unsent (CASL) | 4 |
| Replies / Interested / Meetings | 0 / 0 / 0 |
| Today (26 Nov): new leads | 5 (4 US + 1 Canada draft-only) |
| Today (26 Nov): emails sent | 0 / 5 |

## Honesty rules built into this dashboard

- **GMB status is “Not verified” for all 26 leads.** The Sheet never verified
  GMB status for any lead, so no “Not Found / Needs Optimization / Verified”
  split is shown anywhere. Automated GMB checking does not exist yet.
- **Facebook Page creation dates were never verifiable** from public sources.
  Only 3 Facebook URLs are real (Four Roots post, Armor Roofing page,
  Hiller Demolition page); the rest are shown as “Not verified”, never invented.
- **No “businesses reviewed today” number** — it was not recorded, so it is
  not shown. No figure on this page is estimated.
- **No fake portfolio, case study, client, result or review** anywhere.

## Files

| File | What it is |
|---|---|
| `index.html` | The dashboard. Single file, inline CSS/JS, no external JS libraries, works offline. Light/dark toggle, search + filters, click a row for the full lead details. Lead data is embedded in the page (same data as `leads.json`). |
| `leads.json` | The 26 leads as structured data + snapshot metadata. |
| `backend/Code.gs` | Google Apps Script backend: `getLeads`, `addLead` (duplicate check on business name + website + email, case-insensitive), `updateEmailStatus`, `dailyReport`. Reads/writes the Sheet above, tab “All Leads”. |
| `SETUP.md` | Deployment + refresh instructions (Bangla + English). |

## Run locally

```bash
cd ~/workspace/github-projects/gmb-client-hunting
python3 -m http.server 8000
# open http://localhost:8000/
```

Or open `index.html` directly in a browser — it works from `file://` too.

## Standing rules (never break these)

1. **Canada — CASL:** never send cold email to a Canada lead without express
   consent. A public email address is NOT consent. Canada leads stay drafts only.
2. **Never resend to bounced addresses:** `info@bayshorescleaning.com` and
   `toddp@oathridgeroofing.com` — both addresses do not exist.
3. **No inventing:** no review counts, no Facebook creation dates, no GMB
   status, no portfolio/case-study links, no client results.
4. **No sending without approval:** Gmail send is blocked in background runs
   (approval card). Drafts only until Reduan approves in chat (“পাঠাও”).
5. **Duplicates:** never add the same business twice — check business name +
   website + email before adding (see `addLead` in `backend/Code.gs`).
6. **Daily target:** 5 new business emails per day, from
   `reduan.digital@gmail.com`, 7:00 AM Asia/Dhaka.
