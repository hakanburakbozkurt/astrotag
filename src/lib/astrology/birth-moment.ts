/** Yerel doğum tarih/saatini IANA timezone ile UTC Date'e çevirir. */
export function localBirthToUtc(
  birthDate: string,
  birthTime: string,
  timeZone: string
): Date {
  const [year, month, day] = birthDate.split("-").map(Number);
  const [hour, minute = 0] = birthTime.split(":").map(Number);

  let utcMs = Date.UTC(year, month - 1, day, hour, minute, 0);

  for (let attempt = 0; attempt < 4; attempt += 1) {
    const formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });

    const parts = formatter.formatToParts(new Date(utcMs));
    const read = (type: Intl.DateTimeFormatPartTypes) =>
      Number(parts.find((part) => part.type === type)?.value ?? "0");

    const localMs = Date.UTC(
      read("year"),
      read("month") - 1,
      read("day"),
      read("hour"),
      read("minute"),
      read("second")
    );

    const desiredMs = Date.UTC(year, month - 1, day, hour, minute, 0);
    utcMs += desiredMs - localMs;
  }

  return new Date(utcMs);
}
