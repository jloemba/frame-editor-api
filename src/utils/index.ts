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
