(function () {
  "use strict";

  var SUBJECTS = {
    maths: {
      name: "Mathématiques",
      icon: "calculator",
      tone: "teal",
      description:
        "Fiches de cours, exercices progressifs et corrigés pour consolider les bases."
    },
    francais: {
      name: "Français",
      icon: "book-open",
      tone: "sky",
      description:
        "Lecture, grammaire et expression écrite : un parcours complet pour progresser."
    },
    anglais: {
      name: "Anglais",
      icon: "globe",
      tone: "mist",
      description:
        "Vocabulaire, compréhension et exercices guidés pour gagner en aisance."
    },
    pc: {
      name: "Physique-Chimie",
      icon: "flask",
      tone: "pine",
      description:
        "Des notions expliquées, des exercices variés et leurs corrigés détaillés."
    },
    svt: {
      name: "SVT",
      icon: "leaf",
      tone: "sage",
      description:
        "Schémas, méthodes et exercices pour comprendre le vivant et la Terre."
    },
    hg: {
      name: "Histoire-Géographie",
      icon: "map",
      tone: "sand",
      description:
        "Cartes, repères et entraînements pour maîtriser les programmes."
    },
    litterature: {
      name: "Littérature",
      icon: "feather",
      tone: "mist",
      description:
        "Textes, analyses et sujets guidés pour approfondir l'étude littéraire."
    },
    philosophie: {
      name: "Philosophie",
      icon: "sparkles",
      tone: "pine",
      description:
        "Notions, auteurs et sujets corrigés pour structurer une pensée claire."
    },
    annales: {
      name: "Annales",
      icon: "layers",
      tone: "sand",
      description:
        "Recueils multi-matières, sujets corrigés et entraînements pour les examens."
    },
    autres: {
      name: "Autres documents",
      icon: "book-open",
      tone: "mist",
      description:
        "Documents complémentaires et supports variés pour accompagner la classe."
    }
  };

  var EPREUVES = {
    name: "Épreuves & annales",
    icon: "layers",
    tone: "sand",
    description:
      "Des sujets d'examen récents et leurs corrigés, réunis en un pack de 10 pour s'entraîner en conditions réelles."
  };

  var CLASSES = [
    {
      id: "6e",
      label: "6ᵉ",
      short: "6ᵉ",
      cycle: "college",
      cycleLabel: "Collège",
      price: 550,
      focus: null
    },
    {
      id: "5e",
      label: "5ᵉ",
      short: "5ᵉ",
      cycle: "college",
      cycleLabel: "Collège",
      price: 550,
      focus: null
    },
    {
      id: "4e",
      label: "4ᵉ",
      short: "4ᵉ",
      cycle: "college",
      cycleLabel: "Collège",
      price: 550,
      focus: null
    },
    {
      id: "3e",
      label: "3ᵉ",
      short: "3ᵉ",
      cycle: "college",
      cycleLabel: "Collège",
      price: 550,
      focus: "Prépa BEPC"
    },
    {
      id: "2nde",
      label: "2nde",
      short: "2nde",
      cycle: "lycee",
      cycleLabel: "Lycée",
      price: 850,
      focus: null
    },
    {
      id: "1ere",
      label: "1ère",
      short: "1ère",
      cycle: "lycee",
      cycleLabel: "Lycée",
      price: 850,
      focus: null
    },
    {
      id: "tle",
      label: "Terminale",
      short: "Tle",
      cycle: "lycee",
      cycleLabel: "Lycée",
      price: 850,
      focus: "Prépa BAC"
    }
  ];

  var SERIES = [
    { id: "A4", label: "A4", hint: "Littéraire" },
    { id: "C", label: "C", hint: "Sciences" },
    { id: "D", label: "D", hint: "Sciences exp." }
  ];

  var EXPECTED_SUBJECTS = {
    "6e": ["maths", "francais", "anglais", "pc", "svt", "hg"],
    "5e": ["maths", "francais", "anglais", "pc", "svt", "hg"],
    "4e": ["maths", "francais", "anglais", "pc", "svt", "hg"],
    "3e": ["maths", "francais", "anglais", "pc", "svt", "hg"],
    "2nde": ["maths", "pc", "svt", "francais", "anglais", "hg"],
    "1ere": ["maths", "pc", "svt", "francais", "anglais", "litterature", "hg"],
    "tle": ["maths", "pc", "svt", "philosophie", "francais", "hg"]
  };

  var SUBJECT_ORDER = [
    "maths",
    "pc",
    "svt",
    "francais",
    "anglais",
    "hg",
    "litterature",
    "philosophie",
    "annales",
    "autres"
  ];

  var EPREUVES_PRICE = 500;
  var COLLECTIONS = {};
  var AVAILABILITY = {};

  function focusSentence(classId) {
    if (classId === "3e") return " Une préparation ciblée pour le BEPC.";
    if (classId === "tle") return " Des entraînements ciblés pour le BAC.";
    return "";
  }

  function getManifest() {
    return window.PAYBOOK_DOCS && window.PAYBOOK_DOCS.classes
      ? window.PAYBOOK_DOCS
      : { classes: {} };
  }

  function groupDocuments(docs) {
    var groups = {};
    docs.forEach(function (doc) {
      if (!groups[doc.subject]) groups[doc.subject] = [];
      groups[doc.subject].push(doc);
    });
    return groups;
  }

  function sortSeries(series) {
    return series.slice().sort(function (a, b) {
      return SERIES.findIndex(function (item) {
        return item.id === a;
      }) - SERIES.findIndex(function (item) {
        return item.id === b;
      });
    });
  }

  function seriesUnion(docs) {
    var series = [];
    docs.forEach(function (doc) {
      doc.series.forEach(function (id) {
        if (series.indexOf(id) === -1) series.push(id);
      });
    });
    return sortSeries(series);
  }

  function makeCollection(cls, subjectId, docs, kind) {
    var isEpreuve = kind === "epreuve";
    var meta = isEpreuve ? EPREUVES : SUBJECTS[subjectId] || SUBJECTS.autres;
    var series = seriesUnion(docs);

    return {
      id: cls.id + "-" + (isEpreuve ? "epreuves" : subjectId),
      kind: kind,
      subjectId: isEpreuve ? "epreuves" : subjectId,
      subject: meta.name,
      icon: meta.icon,
      tone: meta.tone,
      description: meta.description + (isEpreuve ? "" : focusSentence(cls.id)),
      series: series,
      hasCommonSeries: docs.some(function (doc) {
        return !doc.series.length;
      }),
      docs: docs,
      price: isEpreuve ? EPREUVES_PRICE : cls.price,
      priceUnit: isEpreuve ? "le pack de 10" : "le document",
      focus: cls.focus,
      title: isEpreuve
        ? "Pack Épreuves " + cls.label
        : "Pack " + meta.name + " " + cls.label,
      previewLabel: isEpreuve ? "sujets" : "documents"
    };
  }

  function subjectRank(subjectId) {
    var index = SUBJECT_ORDER.indexOf(subjectId);
    return index === -1 ? 99 : index;
  }

  function buildCollections(cls) {
    var manifest = getManifest();
    var bucket = manifest.classes[cls.id] || { documents: [], epreuves: [] };
    var documents = bucket.documents || [];
    var epreuves = bucket.epreuves || [];
    var groups = groupDocuments(documents);
    var collections = [];

    Object.keys(groups).forEach(function (subjectId) {
      collections.push(makeCollection(cls, subjectId, groups[subjectId], "document"));
    });

    collections.sort(function (a, b) {
      return subjectRank(a.subjectId) - subjectRank(b.subjectId);
    });

    if (epreuves.length) {
      collections.push(makeCollection(cls, "epreuves", epreuves, "epreuve"));
    }

    return collections;
  }

  function buildAvailability(cls, collections) {
    var available = collections
      .filter(function (item) {
        return item.kind === "document";
      })
      .map(function (item) {
        return item.subjectId;
      });
    var expected = EXPECTED_SUBJECTS[cls.id] || [];
    var missing = expected.filter(function (subjectId) {
      return available.indexOf(subjectId) === -1;
    });
    var hasEpreuves = collections.some(function (item) {
      return item.kind === "epreuve";
    });
    var missingEpreuves = cls.cycle === "lycee" && !hasEpreuves;

    return {
      total: collections.length,
      missingSubjects: missing,
      missingEpreuves: missingEpreuves,
      isEmpty: collections.length === 0,
      isComplete: missing.length === 0 && !missingEpreuves
    };
  }

  function rebuild() {
    Object.keys(COLLECTIONS).forEach(function (id) {
      delete COLLECTIONS[id];
    });
    Object.keys(AVAILABILITY).forEach(function (id) {
      delete AVAILABILITY[id];
    });

    CLASSES.forEach(function (cls) {
      var collections = buildCollections(cls);
      COLLECTIONS[cls.id] = collections;
      AVAILABILITY[cls.id] = buildAvailability(cls, collections);
    });

    document.dispatchEvent(
      new CustomEvent("paybook:data", {
        detail: { collections: COLLECTIONS, availability: AVAILABILITY }
      })
    );
  }

  var api = window.PAYBOOK || {};
  api.CLASSES = CLASSES;
  api.SERIES = SERIES;
  api.SUBJECTS = SUBJECTS;
  api.EXPECTED_SUBJECTS = EXPECTED_SUBJECTS;
  api.COLLECTIONS = COLLECTIONS;
  api.AVAILABILITY = AVAILABILITY;
  api.rebuild = rebuild;
  window.PAYBOOK = api;

  rebuild();
})();
