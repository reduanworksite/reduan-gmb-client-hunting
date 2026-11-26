/**
 * GMB Client Hunting — Google Apps Script backend
 * =================================================
 * Sheet: "Reduan Leads 2026-11-22 — USA & Canada"
 * Sheet ID: 1Jzwc25KKmMQkji6AGrh_X9q3kXh1Mw9XlOr3RftLB_8
 * Tab used by every function: "All Leads"
 *
 * What this does (and does NOT do):
 * - Reads/writes lead rows in the real Google Sheet. No demo data, nothing invented.
 * - addLead() refuses duplicates: same business name + website + email
 *   (case-insensitive, trimmed). A bounced address is NEVER re-added as
 *   sendable — bounced leads stay Bounced.
 * - It does NOT send email by itself. Gmail sending is a separate, manual
 *   step approved by Reduan in chat, because Gmail send is blocked in
 *   background runs (approval card). updateEmailStatus() only records the
 *   outcome AFTER a send/draft/bounce is confirmed.
 * - It does NOT verify GMB status. There is no reliable API for that;
 *   gmbStatus stays "Not verified" unless a human verifies it manually.
 *
 * Deploy: Extensions > Apps Script in the Sheet > paste this file >
 * Deploy > New deployment > Web app > Execute as: Me >
 * Who has access: Only myself. Copy the Web App URL into the dashboard
 * refresh script (see SETUP.md).
 */

const SHEET_ID = '1Jzwc25KKmMQkji6AGrh_X9q3kXh1Mw9XlOr3RftLB_8';
const TAB_ALL_LEADS = 'All Leads';

// Column layout of "All Leads" (20 columns, header row = row 1).
// A Business Name | B Country | C State/Province | D City | E Business Niche |
// F Business Website | G Google Maps URL | H Google Review Count |
// I Business Opening Evidence | J Facebook Page URL | K Facebook Page Creation Date |
// L First Post Date | M Public Business Email | N Public Business Phone |
// O Identified Marketing Problems | P Recommended Services | Q Verification Status |
// R Research Source URLs | S Lead Type | T Outreach Eligibility
const COLS = {
  name: 1, country: 2, state: 3, city: 4, niche: 5, website: 6, mapsUrl: 7,
  reviewCount: 8, openingEvidence: 9, facebookUrl: 10, facebookCreated: 11,
  firstPost: 12, email: 13, phone: 14, problems: 15, services: 16,
  verification: 17, sources: 18, leadType: 19, eligibility: 20
};

// Bounced addresses — NEVER resend, NEVER re-add as a sendable lead.
const BOUNCED_EMAILS = [
  'info@bayshorescleaning.com',   // Bay Shores Cleaning Company — bounced 2026-11-22
  'toddp@oathridgeroofing.com'    // Oathridge Roofing — bounced 2026-11-24 22:33 +06
];

function getSheet_() {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const sheet = ss.getSheetByName(TAB_ALL_LEADS);
  if (!sheet) throw new Error('Tab "' + TAB_ALL_LEADS + '" not found in the Sheet.');
  return sheet;
}

function norm_(v) {
  return String(v == null ? '' : v).trim().toLowerCase();
}

/** Read every lead row as an object. Used by the dashboard refresh. */
function getLeads() {
  const sheet = getSheet_();
  const last = sheet.getLastRow();
  if (last < 2) return [];
  const values = sheet.getRange(2, 1, last - 1, 20).getValues();
  return values
    .filter(function (r) { return norm_(r[COLS.name - 1]) !== ''; })
    .map(function (r, i) {
      return {
        row: i + 2,
        businessName: r[0], country: r[1], state: r[2], city: r[3],
        niche: r[4], website: r[5], googleMapsUrl: r[6],
        googleReviewCount: r[7], openingEvidence: r[8],
        facebookPageUrl: r[9], facebookPageCreationDate: r[10],
        firstPostDate: r[11], email: r[12], phone: r[13],
        marketingProblems: r[14], recommendedServices: r[15],
        verificationStatus: r[16], sourceUrls: r[17],
        leadType: r[18], outreachEligibility: r[19],
        // GMB status is NOT a Sheet column: it was never verified.
        // Keep it honest — always "Not verified" until checked manually.
        gmbStatus: 'Not verified'
      };
    });
}

/**
 * Add one lead. `lead` uses the same field names as getLeads() returns.
 * Returns { ok: true, row } on success, or { ok: false, reason } when the
 * lead is a duplicate or the email is on the bounced list.
 * Duplicate check: business name + website + email, case-insensitive.
 */
function addLead(lead) {
  if (!lead || !lead.businessName || !lead.email) {
    return { ok: false, reason: 'businessName and email are required.' };
  }
  if (BOUNCED_EMAILS.indexOf(norm_(lead.email)) !== -1) {
    return { ok: false, reason: 'Email is on the bounced list — never resend.' };
  }
  const existing = getLeads();
  const dup = existing.filter(function (l) {
    return norm_(l.businessName) === norm_(lead.businessName) &&
           norm_(l.website) === norm_(lead.website) &&
           norm_(l.email) === norm_(lead.email);
  })[0];
  if (dup) {
    return { ok: false, reason: 'Duplicate lead — already in the Sheet at row ' + dup.row + '.' };
  }
  // Same email on a different business name is also suspicious — flag it.
  const sameEmail = existing.filter(function (l) {
    return norm_(l.email) === norm_(lead.email);
  })[0];
  if (sameEmail) {
    return { ok: false, reason: 'Email already used by "' + sameEmail.businessName + '" (row ' + sameEmail.row + ').' };
  }

  const sheet = getSheet_();
  const row = [
    lead.businessName, lead.country || '', lead.state || '', lead.city || '',
    lead.niche || '', lead.website || '', lead.googleMapsUrl || '',
    lead.googleReviewCount || 'Not verified — do not assume 0-5',
    lead.openingEvidence || '', lead.facebookPageUrl || '',
    lead.facebookPageCreationDate || 'Not verifiable from sources found',
    lead.firstPostDate || '', lead.email, lead.phone || '',
    lead.marketingProblems || '', lead.recommendedServices || '',
    lead.verificationStatus || '', lead.sourceUrls || '',
    lead.leadType || 'Type A',
    lead.outreachEligibility || ''
  ];
  sheet.appendRow(row);
  return { ok: true, row: sheet.getLastRow() };
}

/**
 * Record an email outcome AFTER it is confirmed (never before sending).
 * businessName must match a row in All Leads (case-insensitive).
 * status: 'SENT YYYY-MM-DD' | 'BOUNCED YYYY-MM-DD' | 'DRAFT YYYY-MM-DD' | 'DRAFT — CASL'
 * Writes into column T (Outreach Eligibility) and appends a note to column Q.
 */
function updateEmailStatus(businessName, status) {
  if (!businessName || !status) {
    return { ok: false, reason: 'businessName and status are required.' };
  }
  const sheet = getSheet_();
  const last = sheet.getLastRow();
  if (last < 2) return { ok: false, reason: 'No leads in the Sheet.' };
  const names = sheet.getRange(2, 1, last - 1, 1).getValues();
  for (let i = 0; i < names.length; i++) {
    if (norm_(names[i][0]) === norm_(businessName)) {
      const row = i + 2;
      const current = sheet.getRange(row, COLS.eligibility).getValue();
      sheet.getRange(row, COLS.eligibility).setValue(status);
      sheet.getRange(row, COLS.verification).setValue(
        String(current ? current + ' | ' : '') + 'Email status updated ' + status + ' via Apps Script.'
      );
      return { ok: true, row: row };
    }
  }
  return { ok: false, reason: 'Business not found: ' + businessName };
}

/**
 * Daily report built ONLY from real Sheet rows — no invented numbers.
 * Returns an object the dashboard (or a daily email) can display.
 * - businessesReviewedToday is NOT counted here: the Sheet does not record
 *   how many businesses were reviewed, so the field is honestly null.
 */
function dailyReport(dateIso) {
  const leads = getLeads();
  const today = dateIso || Utilities.formatDate(new Date(), 'Asia/Dhaka', 'yyyy-MM-dd');
  const count = function (fn) { return leads.filter(fn).length; };
  const isSent = function (l) { return String(l.outreachEligibility).indexOf('SENT') === 0; };
  const isBounced = function (l) { return String(l.outreachEligibility).indexOf('BOUNCED') === 0; };
  const isDraft = function (l) { return String(l.outreachEligibility).indexOf('DRAFT') === 0; };
  const isCanada = function (l) { return norm_(l.country) === 'canada'; };
  const isUsa = function (l) { return norm_(l.country) === 'usa'; };

  // Discovery date is not a Sheet column; the daily batch files record it.
  // dailyReport therefore reports cumulative totals + today's email outcomes
  // from column T, and leaves "new leads today" to the batch file.
  return {
    date: today,
    totalLeads: leads.length,
    usaLeads: count(isUsa),
    canadaLeads: count(isCanada),
    emailsSentTotal: count(isSent),
    bouncedTotal: count(isBounced),
    draftsTotal: count(isDraft),
    gmbNotVerified: count(function (l) { return l.gmbStatus === 'Not verified'; }),
    repliesReceived: 0,          // No reply tracking exists in the Sheet yet — do not invent.
    meetingsScheduled: 0,        // Same: no meeting data recorded yet.
    businessesReviewedToday: null, // Not recorded anywhere — shown as "not recorded", never guessed.
    note: 'GMB status is Not verified for all leads. Replies/meetings are 0 until a reply is actually recorded.'
  };
}

/** Web-app entry point: GET ?action=getLeads | ?action=dailyReport&date=YYYY-MM-DD */
function doGet(e) {
  const action = (e && e.parameter && e.parameter.action) || 'getLeads';
  let out;
  try {
    if (action === 'dailyReport') out = dailyReport(e.parameter.date || null);
    else out = getLeads();
    return ContentService
      .createTextOutput(JSON.stringify({ ok: true, action: action, data: out }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: String(err) }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
