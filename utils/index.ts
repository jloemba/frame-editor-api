export function formatDateLongFR(dateStr: string): string {
  const date = new Date(dateStr);

  // Jours et mois en français
  const days = [
    "DIMANCHE",
    "LUNDI",
    "MARDI",
    "MERCREDI",
    "JEUDI",
    "VENDREDI",
    "SAMEDI",
  ];
  const month = [
    "JANVIER",
    "FÉVRIER",
    "MARS",
    "AVRIL",
    "MAI",
    "JUIN",
    "JUILLET",
    "AOÛT",
    "SEPTEMBRE",
    "OCTOBRE",
    "NOVEMBRE",
    "DÉCEMBRE",
  ];

  const weekDays = days[date.getDay()];
  const day = date.getDate();
  const nameMonth = month[date.getMonth()];
  const year = date.getFullYear();

  return `${weekDays} ${day} ${nameMonth} ${year}`;
}

export function parseFrenchDate(dateStr: string): string {
    const months: { [key: string]: string } = {
      janvier: "01",
      février: "02",
      mars: "03",
      avril: "04",
      mai: "05",
      juin: "06",
      juillet: "07",
      août: "08",
      septembre: "09",
      octobre: "10",
      novembre: "11",
      décembre: "12",
    };

    const parts = dateStr.toLowerCase().split(" ");
    // On cherche dynamiquement les index car le nom du jour peut être présent ou non
    const day = parts.find((p) => !isNaN(parseInt(p)));
    const monthName = parts.find((p) => months[p]);
    const year = parts.find((p) => p.length === 4 && !isNaN(parseInt(p)));

    if (!day || !monthName || !year) {
      throw new Error(`Impossible de parser la date : ${dateStr}`);
    }

    // 2. On formate en YYYY-MM-DD (en ajoutant un 0 devant le jour si besoin)
    const paddedDay = day.padStart(2, "0");
    const month = months[monthName];

    return `${year}-${month}-${paddedDay}`;
  }

  export function currentTimestampFR(): string {
        const now = new Date();
    const timestamp = now.toLocaleString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
    return timestamp;
  }