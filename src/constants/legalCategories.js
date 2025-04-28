/**
 * Legal categories available in the application
 */
export const legalCategories = [
  {
    id: 1,
    title: "Arbeitsrecht",
    description: "Aktuelle Entwicklungen im Arbeitsrecht",
    longDescription:
      "Das Arbeitsrecht regelt die Rechtsbeziehungen zwischen Arbeitgebern und Arbeitnehmern sowie die Rechte und Pflichten beider Parteien. Es umfasst Themen wie Arbeitsverträge, Kündigungsschutz, Arbeitszeit, Urlaub, Entgeltfortzahlung und Arbeitsschutz.",
    compatibleJurisdictions: ["BR", "EU"], // Nur Bundesrecht und EU-Recht
  },
  {
    id: 2,
    title: "Sozialrecht",
    description: "Neuigkeiten aus dem Bereich Sozialrecht",
    longDescription:
      "Das Sozialrecht umfasst alle Rechtsnormen der sozialen Sicherheit. Dazu gehören die gesetzliche Kranken-, Renten- und Arbeitslosenversicherung, sowie Regelungen zur Sozialhilfe und anderen Sozialleistungen.",
    compatibleJurisdictions: ["BR", "LR", "EU"], // Alle Jurisdiktionen
  },
  {
    id: 3,
    title: "Steuerrecht",
    description: "Updates zu steuerrechtlichen Themen",
    longDescription:
      "Das Steuerrecht regelt die Erhebung von Steuern durch den Staat. Es beinhaltet Vorschriften zu verschiedenen Steuerarten wie Einkommensteuer, Umsatzsteuer, Gewerbesteuer und deren Berechnung, Erhebung und Rechtsmittel.",
    compatibleJurisdictions: ["BR", "LR", "EU"], // Alle Jurisdiktionen
  },
  // Neue Rechtsbereiche
  {
    id: 4,
    title: "Verfassungsrecht",
    description: "Entwicklungen im Verfassungsrecht",
    longDescription:
      "Das Verfassungsrecht behandelt die grundlegende rechtliche Ordnung eines Staates. Es umfasst die Verfassung selbst sowie alle Rechtsnormen mit Verfassungsrang, die Grundrechte, die Organisation und Funktion der staatlichen Organe sowie deren Verhältnis zueinander.",
    compatibleJurisdictions: ["BR", "LR", "EU"], // Alle Jurisdiktionen
  },
  {
    id: 5,
    title: "Verwaltungsrecht",
    description: "Aktuelle Änderungen im Verwaltungsrecht",
    longDescription:
      "Das Verwaltungsrecht regelt das Verhältnis zwischen der öffentlichen Verwaltung und den Bürgern sowie die Organisation und Tätigkeit der öffentlichen Verwaltung selbst. Es umfasst Bereiche wie Baurecht, Umweltrecht, Polizei- und Ordnungsrecht.",
    compatibleJurisdictions: ["BR", "LR", "EU"], // Alle Jurisdiktionen
  },
  {
    id: 6,
    title: "Zivilrecht",
    description: "Neuigkeiten im Zivilrecht",
    longDescription:
      "Das Zivilrecht, auch Privatrecht genannt, regelt die Rechtsbeziehungen zwischen Privatpersonen und juristischen Personen. Es umfasst das Vertragsrecht, Sachenrecht, Schadensersatzrecht und weitere Bereiche der privaten Rechtsbeziehungen.",
    compatibleJurisdictions: ["BR", "EU"], // Bundesrecht und EU-Recht
  },
  {
    id: 7,
    title: "Wirtschaftsprivatrecht",
    description: "Updates zum Wirtschaftsprivatrecht",
    longDescription:
      "Das Wirtschaftsprivatrecht umfasst die rechtlichen Regelungen für wirtschaftliche Aktivitäten zwischen Privatpersonen und Unternehmen. Es beinhaltet Handelsrecht, Gesellschaftsrecht, Wettbewerbsrecht, Urheberrecht und verwandte Rechtsbereiche.",
    compatibleJurisdictions: ["BR", "EU"], // Bundesrecht und EU-Recht
  },
  {
    id: 8,
    title: "Finanzrecht",
    description: "Änderungen im Finanzrecht",
    longDescription:
      "Das Finanzrecht regelt den Umgang mit finanziellen Mitteln im öffentlichen Bereich sowie die Finanzmarktregulierung. Es umfasst das Haushaltsrecht, Finanzausgleich, Banken- und Kapitalmarktrecht sowie Versicherungsaufsichtsrecht.",
    compatibleJurisdictions: ["BR", "EU"], // Bundesrecht und EU-Recht
  },
  {
    id: 9,
    title: "Strafrecht",
    description: "Entwicklungen im Strafrecht",
    longDescription:
      "Das Strafrecht befasst sich mit der staatlichen Sanktionierung von Handlungen, die als strafwürdig angesehen werden. Es umfasst das materielle Strafrecht (Straftaten und Rechtsfolgen) sowie das formelle Strafrecht (Strafverfahrensrecht).",
    compatibleJurisdictions: ["BR", "EU"], // Bundesrecht und EU-Recht
  },
  {
    id: 10,
    title: "Verfahrensrecht",
    description: "Aktuelle Änderungen im Verfahrensrecht",
    longDescription:
      "Das Verfahrensrecht regelt die formellen Abläufe von Gerichtsverfahren und Verwaltungsverfahren. Es umfasst die Zivilprozessordnung, Strafprozessordnung, Verwaltungsverfahrensgesetze und weitere verfahrensrechtliche Vorschriften.",
    compatibleJurisdictions: ["BR", "LR"], // Bundesrecht und Landesrecht
  },
  {
    id: 11,
    title: "Jugendrechtliche Vorschriften",
    description: "Updates zu jugendrechtlichen Themen",
    longDescription:
      "Die jugendrechtlichen Vorschriften umfassen alle Rechtsnormen, die speziell für Kinder und Jugendliche gelten. Dazu gehören arbeitsrechtliche Bestimmungen wie das Kinder- und Jugendlichen-Beschäftigungsgesetz, schulrechtliche Vorschriften wie das Schulpflichtgesetz, strafrechtliche Normen wie das Jugendgerichtsgesetz und verwaltungsrechtliche Regelungen.",
    compatibleJurisdictions: ["BR", "LR"], // Bundesrecht und Landesrecht
  },
]; 