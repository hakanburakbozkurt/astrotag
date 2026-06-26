const MONTHS_TR = [
  "Ocak",
  "Şubat",
  "Mart",
  "Nisan",
  "Mayıs",
  "Haziran",
  "Temmuz",
  "Ağustos",
  "Eylül",
  "Ekim",
  "Kasım",
  "Aralık",
] as const;

function startOfLocalDay(date: Date): Date {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

export function formatWeekDateRange(start: Date, end: Date): string {
  const startDay = start.getDate();
  const endDay = end.getDate();
  const startMonth = MONTHS_TR[start.getMonth()];
  const endMonth = MONTHS_TR[end.getMonth()];
  const year = end.getFullYear();

  if (start.getMonth() === end.getMonth()) {
    return `${startDay}-${endDay} ${startMonth} ${year}`;
  }

  return `${startDay} ${startMonth} - ${endDay} ${endMonth} ${year}`;
}

/** Pazartesi başlangıçlı hafta aralığı (yerel saat). */
export function getCurrentWeekRange(referenceDate = new Date()): {
  start: Date;
  end: Date;
  label: string;
  dateRangeLabel: string;
} {
  const today = startOfLocalDay(referenceDate);
  const weekday = today.getDay();
  const diffToMonday = weekday === 0 ? -6 : 1 - weekday;

  const start = new Date(today);
  start.setDate(today.getDate() + diffToMonday);

  const end = new Date(start);
  end.setDate(start.getDate() + 6);

  const startDay = start.getDate();
  const endDay = end.getDate();
  const startMonth = MONTHS_TR[start.getMonth()];
  const endMonth = MONTHS_TR[end.getMonth()];

  const label =
    start.getMonth() === end.getMonth()
      ? `${startDay}-${endDay} ${startMonth} Haftalık Bülteni`
      : `${startDay} ${startMonth} - ${endDay} ${endMonth} Haftalık Bülteni`;

  return {
    start,
    end,
    label,
    dateRangeLabel: formatWeekDateRange(start, end),
  };
}
