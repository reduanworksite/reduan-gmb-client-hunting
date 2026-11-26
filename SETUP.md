# SETUP — GMB Client Hunting Dashboard

## English

### 1. View the dashboard (no setup needed)
```bash
cd ~/workspace/github-projects/gmb-client-hunting
python3 -m http.server 8000
# open http://localhost:8000/
```
Or double-click `index.html` — it works from `file://` as well. No external
JS libraries, no build step.

### 2. Deploy the Apps Script backend (for live Sheet sync)
1. Open the Google Sheet:
   https://docs.google.com/spreadsheets/d/1Jzwc25KKmMQkji6AGrh_X9q3kXh1Mw9XlOr3RftLB_8/edit
2. Extensions → Apps Script.
3. Delete the default `Code.gs` content and paste `backend/Code.gs`.
4. Save. Run `getLeads` once to authorize (the script runs as
   `reduan.digital@gmail.com` — the Sheet owner).
5. Deploy → New deployment → Web app → Execute as: **Me** → Who has access:
   **Only myself** → Deploy. Copy the Web App URL (`.../exec`).
6. Test it: open `<web-app-url>?action=getLeads` — it returns the leads as JSON.
   `?action=dailyReport&date=2026-11-26` returns the daily report.

### 3. How dashboard data refreshes
- **Today (manual):** the dashboard uses the snapshot in `leads.json`
  (26 Nov 2026, 11:56 +06). After each day's research, update `leads.json`
  from the Sheet (same 26 fields per lead) and re-open `index.html`.
  The numbers on the page are computed from that file — nothing is hardcoded
  twice, except the overview cards, which must be updated to match.
- **After Apps Script is deployed (automatic):** point the dashboard at the
  Web App URL (`?action=getLeads`) instead of the embedded data, so the page
  always shows the live Sheet. Until then, the “Live Sheet sync” item stays
  under Pending Integrations — do not claim it works.

### 4. Adding a new lead (duplicate-safe)
- Use `addLead()` in `backend/Code.gs` (or the Sheet directly, then refresh
  `leads.json`). It refuses a lead when business name + website + email
  already exist (case-insensitive), when the email is already used by another
  business, or when the email is on the bounced list.
- **Bounced — never resend:** `info@bayshorescleaning.com`,
  `toddp@oathridgeroofing.com`.
- **Canada — CASL:** new Canada leads are drafts only. Never send cold email
  without express consent.

### 5. Recording a send
- Only after a send/draft/bounce is **confirmed**, call
  `updateEmailStatus("Business Name", "SENT 2026-11-26")`.
  Never mark an email “Sent” from an intention — only from Gmail confirmation.

### 6. What is NOT working yet (do not present as working)
- Automated GMB status check — no API verifies GMB automatically.
- Facebook Page creation-date verification — not reliably available publicly.
- UK / Australia / New Zealand hunting — Phase 2, not started.
- Gmail auto-send in background runs — blocked by the approval card; drafts
  only until Reduan approves in chat (“পাঠাও”).

---

## বাংলা

### ১. ড্যাশবোর্ড দেখা (কোনো সেটআপ লাগে না)
```bash
cd ~/workspace/github-projects/gmb-client-hunting
python3 -m http.server 8000
# ব্রাউজারে http://localhost:8000/ খুলুন
```
অথবা `index.html` সরাসরি খুললেই চলবে। কোনো বাইরের JS লাইব্রেরি নেই।

### ২. Apps Script ব্যাকএন্ড চালু করা (লাইভ Sheet sync-এর জন্য)
1. Google Sheet খুলুন (উপরে লিংক দেওয়া আছে)।
2. Extensions → Apps Script।
3. `backend/Code.gs`-এর কোড পেস্ট করুন।
4. একবার `getLeads` চালিয়ে অনুমোদন দিন (Sheet-এর মালিক
   `reduan.digital@gmail.com` হিসেবে চলবে)।
5. Deploy → New deployment → Web app → Execute as: **Me** → Who has access:
   **Only myself** → Deploy। Web App URL কপি করুন।
6. পরীক্ষা করুন: `<web-app-url>?action=getLeads` — JSON-এ lead আসবে।

### ৩. ড্যাশবোর্ডের ডেটা কীভাবে আপডেট হয়
- **এখন (ম্যানুয়াল):** ড্যাশবোর্ড `leads.json`-এর স্ন্যাপশট ব্যবহার করে
  (২৬ নভেম্বর ২০২৬, ১১:৫৬)। প্রতিদিনের রিসার্চের পর Sheet থেকে `leads.json`
  আপডেট করুন।
- **Apps Script চালু হলে (অটোমেটিক):** ড্যাশবোর্ড Web App URL থেকে লাইভ
  ডেটা নেবে। ততদিন “Live Sheet sync” Pending হিসেবেই থাকবে।

### ৪. নতুন Lead যোগ করা (ডুপ্লিকেট-নিরাপদ)
- `addLead()` ব্যবহার করুন — একই business name + website + email থাকলে
  যোগ হবে না। Bounced ইমেইলে কখনো পাঠাবেন না।
- **কানাডা — CASL:** কানাডার lead-এ express consent ছাড়া cold email
  পাঠানো যাবে না — শুধু draft।

### ৫. ইমেইল পাঠানোর পর
- Gmail-এ পাঠানো **নিশ্চিত হওয়ার পরেই** `updateEmailStatus()` দিয়ে
  স্ট্যাটাস আপডেট করুন। অনুমানের ভিত্তিতে “Sent” লিখবেন না।

### ৬. যা এখনো কাজ করে না (কাজ করে বলে দেখাবেন না)
- অটোমেটিক GMB স্ট্যাটাস যাচাই, Facebook Page তৈরির তারিখ যাচাই,
  UK/Australia/New Zealand hunting (Phase 2), ব্যাকগ্রাউন্ডে Gmail auto-send
  (approval card-এ আটকে যায় — Reduan চ্যাটে “পাঠাও” বললে তবেই পাঠানো যাবে)।
