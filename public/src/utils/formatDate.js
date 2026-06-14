const LOCALE = "en-IN";
const TZ = "Asia/Kolkata";

const dateFormatter = new Intl.DateTimeFormat(LOCALE, {
  timeZone: TZ,
  day: "numeric",
  month: "short",
  year: "numeric",
});

const dateTimeFormatter = new Intl.DateTimeFormat(LOCALE, {
  timeZone: TZ,
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
});

const relativeFormatter = new Intl.RelativeTimeFormat("en", {
  numeric: "auto",
});

function parseDate(iso) {
  if (iso == null || iso === "") return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
}


export function formatDate(iso) {
  const d = parseDate(iso);
  return d ? dateFormatter.format(d) : "";
}


export function formatDateTime(iso) {
  const d = parseDate(iso);
  return d ? dateTimeFormatter.format(d) : "";
}


export function formatRelative(iso) {
  const d = parseDate(iso);
  if (!d) return "";

  const now = Date.now();
  let diffSec = Math.round((d.getTime() - now) / 1000);

  const abs = Math.abs(diffSec);
  if (abs < 45) {
    return relativeFormatter.format(0, "second");
  }

  const divisions = [
    { s: 60, unit: "minute" },
    { s: 60, unit: "hour" },
    { s: 24, unit: "day" },
    { s: 7, unit: "week" },
    { s: 4.34524, unit: "month" },
    { s: 12, unit: "year" },
  ];

  let unit = "second";
  let value = diffSec;

  for (const { s, unit: nextUnit } of divisions) {
    if (abs < s) break;
    value /= s;
    unit = nextUnit;
  }

  const rounded =
    unit === "second" ? Math.trunc(value) : Math.round(value);

  return relativeFormatter.format(rounded, unit);
}