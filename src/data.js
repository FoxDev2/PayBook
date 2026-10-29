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
    }
  };

  var CLASSES = [
    {
      id: "6e",
      label: "6ᵉ",
      short: "6ᵉ",
      cycle: "college",
      cycleLabel: "Collège",
      price: 300,
      focus: null
    },
    {
      id: "5e",
      label: "5ᵉ",
      short: "5ᵉ",
      cycle: "college",
      cycleLabel: "Collège",
      price: 300,
      focus: null
    },
    {
      id: "4e",
      label: "4ᵉ",
      short: "4ᵉ",
      cycle: "college",
      cycleLabel: "Collège",
      price: 300,
      focus: null
    },
    {
      id: "3e",
      label: "3ᵉ",
      short: "3ᵉ",
      cycle: "college",
      cycleLabel: "Collège",
      price: 300,
      focus: "Prépa BEPC"
    },
    {
      id: "2nde",
      label: "2nde",
      short: "2nde",
      cycle: "lycee",
      cycleLabel: "Lycée",
      price: 350,
      focus: null
    },
    {
      id: "1ere",
      label: "1ère",
      short: "1ère",
      cycle: "lycee",
      cycleLabel: "Lycée",
      price: 400,
      focus: null
    },
    {
      id: "tle",
      label: "Terminale",
      short: "Tle",
      cycle: "lycee",
      cycleLabel: "Lycée",
      price: 450,
      focus: "Prépa BAC"
    }
  ];

  var SERIES = [
    { id: "A4", label: "A4", hint: "Littéraire" },
    { id: "C", label: "C", hint: "Sciences" },
    { id: "D", label: "D", hint: "Sciences exp." }
  ];

  var COLLEGE_SUBJECTS = ["maths", "francais", "anglais", "pc", "svt", "hg"];

  var SUBJECT_SETS = {
    "6e": COLLEGE_SUBJECTS,
    "5e": COLLEGE_SUBJECTS,
    "4e": COLLEGE_SUBJECTS,
    "3e": COLLEGE_SUBJECTS,
    "2nde": [
      { subject: "maths", series: ["C", "D"] },
      { subject: "pc", series: ["C", "D"] },
      { subject: "svt", series: ["C", "D"] },
      { subject: "francais", series: ["A4", "C", "D"] },
      { subject: "anglais", series: ["A4", "C", "D"] },
      { subject: "hg", series: ["A4", "C", "D"] }
    ],
    "1ere": [
      { subject: "maths", series: ["C", "D"] },
      { subject: "pc", series: ["C", "D"] },
      { subject: "svt", series: ["C", "D"] },
      { subject: "francais", series: ["A4", "C", "D"] },
      { subject: "litterature", series: ["A4"] },
      { subject: "hg", series: ["A4", "C", "D"] }
    ],
    "tle": [
      { subject: "maths", series: ["C", "D"] },
      { subject: "pc", series: ["C", "D"] },
      { subject: "svt", series: ["C", "D"] },
      { subject: "philosophie", series: ["A4", "C", "D"] },
      { subject: "francais", series: ["A4"] },
      { subject: "hg", series: ["A4"] }
    ]
  };

  function focusSentence(classId) {
    if (classId === "3e") return " Une préparation ciblée pour le BEPC.";
    if (classId === "tle") return " Des entraînements ciblés pour le BAC.";
    return "";
  }

  function buildCollections(cls) {
    return SUBJECT_SETS[cls.id].map(function (entry, index) {
      var normalized =
        typeof entry === "string" ? { subject: entry, series: [] } : entry;
      var subject = SUBJECTS[normalized.subject];

      return {
        id: cls.id + "-" + normalized.subject,
        subject: subject.name,
        icon: subject.icon,
        tone: subject.tone,
        description: subject.description + focusSentence(cls.id),
        series: normalized.series,
        price: cls.price,
        focus: cls.focus,
        title: "Pack " + subject.name + " " + cls.label,
        position: index + 1
      };
    });
  }

  var COLLECTIONS = {};
  CLASSES.forEach(function (cls) {
    COLLECTIONS[cls.id] = buildCollections(cls);
  });

  window.PAYBOOK = {
    CLASSES: CLASSES,
    SERIES: SERIES,
    COLLECTIONS: COLLECTIONS
  };
})();
