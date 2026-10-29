import { readdir, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const sourceRoot = path.join(root, "assets", "docs-view");
const manifestJson = path.join(root, "src", "docs-manifest.json");
const manifestJs = path.join(root, "src", "docs-manifest.js");

const IMAGE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp", ".avif", ".gif"]);
const CLASS_IDS = ["6e", "5e", "4e", "3e", "2nde", "1ere", "tle"];

const CLASS_ALIASES = {
  "6e": "6e",
  "6eme": "6e",
  "5e": "5e",
  "5eme": "5e",
  "4e": "4e",
  "4eme": "4e",
  "3e": "3e",
  "3eme": "3e",
  "2nde": "2nde",
  "seconde": "2nde",
  "1ere": "1ere",
  "premiere": "1ere",
  "tle": "tle",
  "terminale": "tle"
};

const SUBJECT_RULES = [
  { id: "svt", pattern: /\bsvt\b/ },
  { id: "pc", pattern: /\bphysique\b|\bphys\b|\bchimie\b|\bchime\b/ },
  { id: "hg", pattern: /\bhistoire\b|\bhisto\b|\bgeo\b|\bgeographie\b|\bhg\b/ },
  { id: "philosophie", pattern: /\bphilosophie\b|\bphilo\b/ },
  { id: "francais", pattern: /\bfrancais\b/ },
  { id: "litterature", pattern: /\blitterature\b/ },
  { id: "anglais", pattern: /\banglais\b|\bang\b/ },
  {
    id: "maths",
    pattern: /\bmaths\b|\bmathematiques\b|\betude\b.*\bfonction\b|\bprobabilites?\b/
  }
];

const SUBJECT_WORDS = [
  "svt",
  "physique",
  "phys",
  "chimie",
  "chime",
  "histoire",
  "histo",
  "geo",
  "geographie",
  "hg",
  "philosophie",
  "philo",
  "francais",
  "litterature",
  "anglais",
  "ang",
  "maths",
  "mathematiques",
  "annale",
  "annales"
];

const SUBJECT_LABELS = {
  maths: "mathématiques",
  pc: "physique-chimie",
  svt: "SVT",
  francais: "français",
  anglais: "anglais",
  hg: "histoire-géographie",
  litterature: "littérature",
  philosophie: "philosophie"
};

const WORD_FIXES = {
  etude: "Étude",
  probabilite: "Probabilité",
  probabilites: "Probabilités",
  francais: "Français",
  litterature: "Littérature",
  geo: "Géo",
  geographie: "Géographie",
  histoire: "Histoire",
  philosophie: "Philosophie",
  chimie: "Chimie",
  mathematiques: "Mathématiques",
  exam: "Examen",
  annales: "Annales",
  annale: "Annale"
};

function normalize(value) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function splitClassName(value) {
  return CLASS_ALIASES[normalize(value)] || null;
}

function tokensOf(fileBase) {
  return fileBase.split(/[-_\s]+/).filter(Boolean);
}

function expandSeries(raw) {
  const value = raw.toUpperCase();
  if (value === "A4CD") return ["A4", "C", "D"];
  if (value === "A4C") return ["A4", "C"];
  if (value === "A4D") return ["A4", "D"];
  if (value === "CDE" || value === "CD") return ["C", "D"];
  if (value === "A4") return ["A4"];
  if (value === "C") return ["C"];
  if (value === "D") return ["D"];
  return [];
}

function extractSeries(tokens) {
  for (let index = tokens.length - 1; index >= 0; index -= 1) {
    const token = tokens[index].replace(/[^a-z0-9]/gi, "");
    if (!token) continue;

    let match = token.match(/^(A4CD|A4C|A4D|CDE|CD|A4|C|D)$/i);
    if (match) {
      return { series: expandSeries(match[1]), index, replacement: null, suffix: "" };
    }

    match = token.match(/^(A4)(\d+)$/i);
    if (match) {
      return { series: ["A4"], index, replacement: null, suffix: match[2] };
    }

    match = token.match(/^(.*?)(A4CD|A4C|A4D|CDE|CD|A4|C|D)(\d*)$/i);
    if (match && match[1]) {
      return {
        series: expandSeries(match[2]),
        index,
        replacement: match[1],
        suffix: match[3]
      };
    }
  }

  return { series: [], index: -1, replacement: null, suffix: "" };
}

function detectSubjects(normalizedStem) {
  return SUBJECT_RULES.filter((rule) => rule.pattern.test(normalizedStem)).map(
    (rule) => rule.id
  );
}

function detectSubject(normalizedStem) {
  const matches = detectSubjects(normalizedStem);
  const isAnnales = /\bannales?\b/.test(normalizedStem);
  if (isAnnales && matches.length >= 2) return "annales";
  return matches[0] || "autres";
}

const SMALL_WORDS = new Set(["de", "du", "des", "la", "le", "les", "et", "en", "a", "au", "aux"]);

function prettyToken(token) {
  const normalized = normalize(token);
  if (WORD_FIXES[normalized]) return WORD_FIXES[normalized];
  if (/^\d+$/.test(token)) return "Volume " + token;
  const volume = token.match(/^vol(?:ume)?(\d+)$/i);
  if (volume) return "Volume " + volume[1];
  if (SMALL_WORDS.has(normalized)) return normalized;
  if (/^[A-Z0-9]{2,5}$/.test(token)) return token;
  return token.charAt(0).toUpperCase() + token.slice(1);
}

function prettyName(tokens) {
  return tokens.map(prettyToken).join(" ").replace(/\s+/g, " ").trim();
}

function parseFile(relativePath, kind, counters) {
  const fileBase = path.basename(relativePath, path.extname(relativePath));
  const tokens = tokensOf(fileBase);
  const seriesInfo = extractSeries(tokens);

  const cleanTokens = tokens.slice();
  if (seriesInfo.index >= 0) {
    cleanTokens[seriesInfo.index] = seriesInfo.replacement || "";
    if (seriesInfo.suffix) {
      cleanTokens.splice(seriesInfo.index + 1, 0, seriesInfo.suffix);
    }
  }

  const normalizedStem = normalize(
    tokens.join("-").replace(/([a-z])([A-Z])/g, "$1-$2")
  );
  const subject = detectSubject(normalizedStem);

  const nameTokens = cleanTokens.filter((token) => {
    if (!token) return false;
    return !SUBJECT_WORDS.includes(normalize(token));
  });

  let name = prettyName(nameTokens);
  if (!name) {
    const subjectLabel = SUBJECT_LABELS[subject];
    if (subject === "annales") name = "Recueil pluridisciplinaire";
    else if (kind === "epreuve") name = "Sujet d'examen";
    else if (subjectLabel) {
      name = subjectLabel.charAt(0).toUpperCase() + subjectLabel.slice(1) + " — recueil";
    } else name = "Recueil de documents";
  }

  counters[subject] = (counters[subject] || 0) + 1;

  return {
    id: kind + "-" + path.basename(path.dirname(relativePath)) + "-" + counters[subject],
    file: encodeURI(relativePath.split(path.sep).join("/")),
    kind,
    name,
    subject,
    series: seriesInfo.series
  };
}

async function walkImages(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walkImages(fullPath)));
    } else if (IMAGE_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) {
      files.push(fullPath);
    }
  }

  return files;
}

function sortDocs(a, b) {
  const subjectOrder = {
    maths: 0,
    pc: 1,
    svt: 2,
    francais: 3,
    anglais: 4,
    hg: 5,
    litterature: 6,
    philosophie: 7,
    annales: 8,
    autres: 9
  };
  const subjectDelta = (subjectOrder[a.subject] ?? 99) - (subjectOrder[b.subject] ?? 99);
  if (subjectDelta !== 0) return subjectDelta;
  return a.name.localeCompare(b.name, "fr", { sensitivity: "base" });
}

function emptyClass() {
  return { documents: [], epreuves: [], folders: [] };
}

export async function buildDocs() {
  const families = await readdir(sourceRoot, { withFileTypes: true });
  const classes = {};
  CLASS_IDS.forEach((id) => {
    classes[id] = emptyClass();
  });

  for (const familyEntry of families) {
    if (!familyEntry.isDirectory()) continue;
    const family = normalize(familyEntry.name);
    const kind = family === "documents" ? "document" : family === "epreuves" ? "epreuve" : null;
    if (!kind) continue;

    const familyPath = path.join(sourceRoot, familyEntry.name);
    const classEntries = await readdir(familyPath, { withFileTypes: true });

    for (const classEntry of classEntries) {
      if (!classEntry.isDirectory()) continue;
      const classId = splitClassName(classEntry.name);
      if (!classId) {
        console.warn("[docs] dossier de classe ignoré : " + classEntry.name);
        continue;
      }

      const classPath = path.join(familyPath, classEntry.name);
      classes[classId].folders.push(family + "/" + classEntry.name);

      const files = await walkImages(classPath);
      const counters = {};

      for (const filePath of files) {
        const relativePath = path.relative(sourceRoot, filePath);
        const parsed = parseFile(relativePath, kind, counters);
        parsed.file = "assets/docs-view/" + parsed.file;
        if (kind === "document") {
          classes[classId].documents.push(parsed);
        } else {
          classes[classId].epreuves.push(parsed);
        }
      }
    }
  }

  let documentCount = 0;
  let epreuveCount = 0;
  const emptyClasses = [];

  CLASS_IDS.forEach((classId) => {
    classes[classId].documents.sort(sortDocs);
    classes[classId].epreuves.sort(sortDocs);
    documentCount += classes[classId].documents.length;
    epreuveCount += classes[classId].epreuves.length;
    if (!classes[classId].documents.length && !classes[classId].epreuves.length) {
      emptyClasses.push(classId);
    }
  });

  const manifest = {
    generatedAt: new Date().toISOString(),
    source: "assets/docs-view",
    classes
  };

  const json = JSON.stringify(manifest, null, 2) + "\n";
  const js =
    "/* Généré automatiquement par scripts/build-docs.mjs. */\n" +
    "window.PAYBOOK_DOCS = " +
    JSON.stringify(manifest, null, 2) +
    ";\n";

  const jsonTemp = manifestJson + ".tmp";
  const jsTemp = manifestJs + ".tmp";
  await writeFile(jsonTemp, json, "utf8");
  await writeFile(jsTemp, js, "utf8");
  await rename(jsonTemp, manifestJson);
  await rename(jsTemp, manifestJs);

  if (process.env.DOCS_QUIET !== "1") {
    console.log(
      "[docs] " +
        documentCount +
        " documents, " +
        epreuveCount +
        " épreuves" +
        (emptyClasses.length ? " · classes vides : " + emptyClasses.join(", ") : "")
    );
  }

  return manifest;
}

const isDirectRun = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isDirectRun) {
  buildDocs().catch((error) => {
    console.error("[docs] échec de génération :", error);
    process.exitCode = 1;
  });
}
