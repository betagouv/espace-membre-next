export type ParsedParticipant = {
  prenomNom: string;
  email: string;
};

export type ParseParticipantsResult = {
  participants: ParsedParticipant[];
  /** Nombre de lignes non vides ignorées faute de nom et d'email. */
  ignored: number;
};

const NAME_HEADERS = ["nom", "prenom", "prénom", "name", "participant"];
const EMAIL_HEADERS = ["email", "mail", "courriel", "adresse"];

const normalize = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

/**
 * Découpe une ligne CSV en respectant les guillemets, pour qu'un nom contenant
 * le séparateur ne casse pas les colonnes. Les guillemets doublés à l'intérieur
 * d'un champ cité valent un guillemet littéral, comme dans le format RFC 4180.
 */
const splitLine = (line: string, separator: string): string[] => {
  const cells: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (inQuotes) {
      if (char === '"') {
        if (line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === separator) {
      cells.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  cells.push(current);
  return cells.map((cell) => cell.trim());
};

/**
 * Devine le séparateur : les exports Excel français utilisent le point-virgule,
 * les autres la virgule. On prend celui qui produit le plus de colonnes sur la
 * première ligne, la tabulation servant de repli.
 */
const detectSeparator = (firstLine: string): string => {
  const candidates = [";", ",", "\t"];
  let best = ",";
  let bestCount = 0;
  for (const candidate of candidates) {
    const count = splitLine(firstLine, candidate).length;
    if (count > bestCount) {
      best = candidate;
      bestCount = count;
    }
  }
  return best;
};

const looksLikeEmail = (value: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

/**
 * Lit un CSV de participants. Accepte, dans l'ordre de préférence :
 *
 * 1. un en-tête nommant les colonnes (`nom`/`prénom`, `email`/`mail`...) ;
 * 2. à défaut, deux colonnes dans l'ordre nom puis email ;
 * 3. une seule colonne, interprétée comme un email si elle y ressemble, comme
 *    un nom sinon.
 *
 * Les lignes sans nom ni email sont comptées dans `ignored` plutôt que d'être
 * rendues comme des lignes vides à corriger à la main.
 */
export const parseParticipantsCsv = (
  content: string,
  { max = 200 }: { max?: number } = {},
): ParseParticipantsResult => {
  // Retire le BOM des fichiers produits par Excel, sans quoi la première
  // en-tête ne serait jamais reconnue.
  const withoutBom = content.replace(/^\uFEFF/, "");
  const lines = withoutBom
    .split(/\r\n|\n|\r/)
    .filter((line) => line.trim() !== "");

  if (lines.length === 0) {
    return { participants: [], ignored: 0 };
  }

  const separator = detectSeparator(lines[0]);
  const rows = lines.map((line) => splitLine(line, separator));

  let nameIndex = 0;
  let emailIndex = 1;
  let startRow = 0;

  const header = rows[0].map(normalize);
  const headerNameIndex = header.findIndex((cell) =>
    NAME_HEADERS.some((candidate) => cell.includes(normalize(candidate))),
  );
  const headerEmailIndex = header.findIndex((cell) =>
    EMAIL_HEADERS.some((candidate) => cell.includes(normalize(candidate))),
  );
  // Un en-tête n'est reconnu que si aucune de ses cellules n'est un email :
  // sinon c'est une vraie ligne de données qu'on perdrait.
  const headerHasEmail = rows[0].some((cell) => looksLikeEmail(cell));
  if (!headerHasEmail && (headerNameIndex !== -1 || headerEmailIndex !== -1)) {
    startRow = 1;
    if (headerNameIndex !== -1) nameIndex = headerNameIndex;
    if (headerEmailIndex !== -1) emailIndex = headerEmailIndex;
    // Une seule colonne nommée : l'autre n'existe pas.
    if (headerNameIndex === -1) nameIndex = -1;
    if (headerEmailIndex === -1) emailIndex = -1;
  }

  const participants: ParsedParticipant[] = [];
  let ignored = 0;

  for (const row of rows.slice(startRow)) {
    let prenomNom = nameIndex === -1 ? "" : (row[nameIndex] ?? "");
    let email = emailIndex === -1 ? "" : (row[emailIndex] ?? "");

    // Fichier à une seule colonne : on devine à quoi elle correspond.
    if (row.length === 1) {
      const only = row[0] ?? "";
      if (looksLikeEmail(only)) {
        prenomNom = "";
        email = only;
      } else {
        prenomNom = only;
        email = "";
      }
    } else if (!looksLikeEmail(email) && looksLikeEmail(prenomNom)) {
      // Colonnes inversées par rapport à l'ordre attendu.
      [prenomNom, email] = [email, prenomNom];
    }

    if (!prenomNom && !email) {
      ignored++;
      continue;
    }
    if (participants.length >= max) {
      ignored++;
      continue;
    }
    participants.push({ prenomNom, email });
  }

  return { participants, ignored };
};
