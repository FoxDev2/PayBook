(function () {
  "use strict";

  var data = window.PAYBOOK;
  if (!data) return;

  var CLASSES = data.CLASSES;
  var SERIES = data.SERIES;
  var SUBJECTS = data.SUBJECTS;
  var COLLECTIONS = data.COLLECTIONS;
  var AVAILABILITY = data.AVAILABILITY;

  var state = {
    classId: "6e",
    series: "all"
  };

  var grid = document.getElementById("pack-grid");
  var packCount = document.getElementById("pack-count");
  var librarySummary = document.getElementById("library-summary");
  var seriesFilter = document.getElementById("series-filter");
  var classNote = document.getElementById("class-note");
  var availabilityNote = document.getElementById("availability-note");
  var menuToggle = document.querySelector(".menu-toggle");
  var mobileMenu = document.getElementById("mobile-menu");
  var toast = document.getElementById("toast");
  var toastMessage = document.getElementById("toast-message");
  var newsletter = document.getElementById("newsletter-form");
  var newsletterEmail = document.getElementById("newsletter-email");
  var year = document.getElementById("year");

  var previewDialog = document.getElementById("preview-dialog");
  var previewTitle = document.getElementById("preview-title");
  var previewMeta = document.getElementById("preview-meta");
  var previewImage = document.getElementById("preview-image");
  var previewFallback = document.getElementById("preview-fallback");
  var previewDocTitle = document.getElementById("preview-doc-title");
  var previewDocMeta = document.getElementById("preview-doc-meta");
  var previewThumbs = document.getElementById("preview-thumbs");
  var previewCounter = document.getElementById("preview-counter");
  var previewPrice = document.getElementById("preview-price");
  var previewPrev = document.querySelector("[data-preview-prev]");
  var previewNext = document.querySelector("[data-preview-next]");
  var previewFigure = document.querySelector(".preview-figure");

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  var toastTimer;
  var touchStartX = null;

  var previewState = {
    collection: null,
    index: 0,
    trigger: null
  };

  var docsVersion = window.PAYBOOK_DOCS ? window.PAYBOOK_DOCS.generatedAt : null;
  var refreshInFlight = false;
  var isLocalDev =
    window.location.protocol !== "file:" &&
    /^(localhost|127\.0\.0\.1|\[::1\])$/.test(window.location.hostname);

  function getClass(id) {
    return CLASSES.find(function (item) {
      return item.id === id;
    });
  }

  function getSeries(id) {
    return SERIES.find(function (item) {
      return item.id === id;
    });
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function icon(name) {
    return (
      '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true">' +
      '<use href="#i-' +
      name +
      '"></use></svg>'
    );
  }

  function seriesLabel(series) {
    if (!series.length) return "";
    return (series.length > 1 ? "Séries " : "Série ") + series.join(" · ");
  }

  function docSeriesLabel(doc) {
    if (!doc.series.length) return "Toutes séries";
    return seriesLabel(doc.series);
  }

  function cardCountLabel(item) {
    var count = item.docs.length;
    if (item.kind === "epreuve") return count + " aperçus";
    return count + (count > 1 ? " docs" : " doc");
  }

  function cardTemplate(item, cls, index) {
    var firstDoc = item.docs[0];
    var coverClass = "pack-cover cover-" + item.tone + (firstDoc ? " has-photo" : "");
    var coverMedia = firstDoc
      ? '<img class="cover-photo" src="' +
        escapeHtml(firstDoc.file) +
        '" alt="" loading="lazy" decoding="async" />' +
        '<span class="cover-scrim"></span>'
      : "";
    var seriesText =
      item.hasCommonSeries || !item.series.length
        ? "Toutes séries"
        : seriesLabel(item.series);
    var seriesBadge =
      cls.cycle === "lycee"
        ? '<span class="badge badge-series">' + escapeHtml(seriesText) + "</span>"
        : "";
    var focusBadge = item.focus
      ? '<span class="badge badge-focus">' + escapeHtml(item.focus) + "</span>"
      : "";
    var metaText =
      item.kind === "epreuve"
        ? "Aperçu des épreuves du pack"
        : item.docs.length +
          (item.docs.length > 1 ? " documents disponibles" : " document disponible");
    var metaIcon = item.kind === "epreuve" ? "eye" : "check";

    return (
      '<article class="pack-card" style="--delay:' +
      Math.min(index * 45, 270) +
      'ms">' +
      '<div class="' +
      coverClass +
      '" aria-hidden="true">' +
      coverMedia +
      '<div class="cover-top">' +
      '<span class="cover-brand">' +
      icon("book-open") +
      " PayBook</span>" +
      '<span class="cover-focus">' +
      escapeHtml(cardCountLabel(item)) +
      "</span>" +
      "</div>" +
      '<div class="cover-main">' +
      '<span class="cover-icon">' +
      icon(item.icon) +
      "</span>" +
      '<span class="cover-subject">' +
      escapeHtml(item.subject) +
      "</span>" +
      '<span class="cover-meta">' +
      escapeHtml(cls.cycleLabel) +
      '<span class="dot"></span>' +
      escapeHtml(cls.label) +
      "</span>" +
      "</div>" +
      "</div>" +
      '<div class="pack-body">' +
      '<div class="pack-badges">' +
      '<span class="badge badge-class">' +
      escapeHtml(cls.label) +
      "</span>" +
      seriesBadge +
      focusBadge +
      "</div>" +
      '<h3 class="pack-title">' +
      escapeHtml(item.title) +
      "</h3>" +
      '<p class="pack-desc">' +
      escapeHtml(item.description) +
      "</p>" +
      '<p class="pack-meta">' +
      icon(metaIcon) +
      " " +
      escapeHtml(metaText) +
      "</p>" +
      '<div class="pack-footer">' +
      '<div class="price"><strong>' +
      item.price +
      ' <small>F</small></strong><span>' +
      escapeHtml(item.priceUnit) +
      "</span></div>" +
      '<div class="pack-actions">' +
      '<button class="view-btn" type="button" data-view="' +
      escapeHtml(item.id) +
      '" aria-label="Voir un aperçu de ' +
      escapeHtml(item.title) +
      '">Voir ' +
      icon("eye") +
      "</button>" +
      '<button class="buy-btn" type="button" data-buy="' +
      escapeHtml(item.title) +
      '" aria-label="Acheter ' +
      escapeHtml(item.title) +
      '">Acheter ' +
      icon("cart") +
      "</button>" +
      "</div>" +
      "</div>" +
      "</div>" +
      "</article>"
    );
  }

  function emptyTemplate(cls, hasCollections) {
    if (!hasCollections) {
      return (
        '<div class="empty-state">' +
        icon("clock") +
        "<h3>La " +
        escapeHtml(cls.label) +
        " arrive bientôt</h3>" +
        "<p>Aucun document n'est encore disponible pour cette classe. " +
        "Revenez prochainement pour découvrir les premiers packs.</p>" +
        "</div>"
      );
    }

    return (
      '<div class="empty-state">' +
      icon("filter") +
      "<h3>Aucun document en série " +
      escapeHtml(state.series) +
      "</h3>" +
      "<p>Essayez une autre série ou revenez bientôt : de nouveaux " +
      "documents sont ajoutés régulièrement.</p>" +
      "</div>"
    );
  }

  function sortSeries(series) {
    return series.slice().sort(function (a, b) {
      return (
        SERIES.findIndex(function (item) {
          return item.id === a;
        }) -
        SERIES.findIndex(function (item) {
          return item.id === b;
        })
      );
    });
  }

  function visibleCollections(cls) {
    var items = (COLLECTIONS[cls.id] || []).slice();

    if (cls.cycle !== "lycee" || state.series === "all") return items;

    return items
      .map(function (item) {
        var docs = item.docs.filter(function (doc) {
          return !doc.series.length || doc.series.indexOf(state.series) !== -1;
        });

        if (!docs.length) return null;

        var series = [];
        docs.forEach(function (doc) {
          doc.series.forEach(function (id) {
            if (series.indexOf(id) === -1) series.push(id);
          });
        });

        return Object.assign({}, item, {
          docs: docs,
          series: sortSeries(series),
          hasCommonSeries: docs.some(function (doc) {
            return !doc.series.length;
          })
        });
      })
      .filter(Boolean);
  }

  function summaryText(cls) {
    if (cls.cycle !== "lycee") return cls.label + " · Collège";
    if (state.series === "all") return cls.label + " · Lycée · Toutes séries";
    return cls.label + " · Série " + state.series;
  }

  function noteText(cls) {
    var availability = AVAILABILITY[cls.id];
    if (availability && availability.isEmpty) {
      return "Les documents de <strong>" + cls.label + "</strong> sont en préparation.";
    }
    if (cls.cycle !== "lycee") {
      return "Packs communs à la classe de <strong>" + cls.label + "</strong>.";
    }
    if (state.series === "all") {
      return "Filtrez les packs selon votre <strong>série</strong>.";
    }
    return "Série <strong>" + state.series + "</strong> sélectionnée.";
  }

  function formatList(names) {
    if (names.length <= 1) return names.join("");
    if (names.length === 2) return names[0] + " et " + names[1];
    return names.slice(0, -1).join(", ") + " et " + names[names.length - 1];
  }

  function updateAvailability(cls, items) {
    if (!availabilityNote) return;

    var availability = AVAILABILITY[cls.id];
    if (!availability || availability.isEmpty || availability.isComplete) {
      availabilityNote.hidden = true;
      availabilityNote.innerHTML = "";
      return;
    }

    if (cls.cycle === "lycee" && state.series !== "all" && !items.length) {
      availabilityNote.hidden = true;
      availabilityNote.innerHTML = "";
      return;
    }

    var missing = availability.missingSubjects.map(function (id) {
      return SUBJECTS[id] ? SUBJECTS[id].name : id;
    });
    var details = [];

    if (missing.length) {
      details.push("Les packs de " + formatList(missing) + " arrivent bientôt.");
    }
    if (availability.missingEpreuves) {
      details.push("Les épreuves arrivent bientôt.");
    }
    if (!details.length) {
      availabilityNote.hidden = true;
      availabilityNote.innerHTML = "";
      return;
    }

    var total = (COLLECTIONS[cls.id] || []).length;
    var title =
      total +
      (total > 1 ? " packs disponibles" : " pack disponible") +
      " pour " +
      cls.label;

    availabilityNote.innerHTML =
      icon("clock") +
      "<div><strong>" +
      escapeHtml(title) +
      "</strong><p>" +
      escapeHtml(details.join(" ")) +
      "</p></div>";
    availabilityNote.hidden = false;
  }

  function syncControls(cls) {
    document.querySelectorAll("[data-class-link], [data-class-tab]").forEach(function (el) {
      var id = el.getAttribute("data-class-link") || el.getAttribute("data-class-tab");
      var active = id === state.classId;
      el.classList.toggle("is-active", active);

      if (el.hasAttribute("aria-pressed")) {
        el.setAttribute("aria-pressed", String(active));
      } else if (active) {
        el.setAttribute("aria-current", "true");
      } else {
        el.removeAttribute("aria-current");
      }
    });

    document.querySelectorAll("[data-series-link], [data-series-chip]").forEach(function (el) {
      var id = el.getAttribute("data-series-link") || el.getAttribute("data-series-chip");
      var active = cls.cycle === "lycee" && id === state.series;
      el.classList.toggle("is-active", active);

      if (el.hasAttribute("aria-pressed")) {
        el.setAttribute("aria-pressed", String(active));
      } else if (active) {
        el.setAttribute("aria-current", "true");
      } else {
        el.removeAttribute("aria-current");
      }
    });
  }

  function centerActiveTab(cls) {
    var activeTab = document.querySelector('.class-tab[data-class-tab="' + cls.id + '"]');
    if (!activeTab || !activeTab.parentElement) return;

    var tabs = activeTab.parentElement;
    var target = activeTab.offsetLeft - (tabs.clientWidth - activeTab.offsetWidth) / 2;
    tabs.scrollTo({
      left: Math.max(0, target),
      behavior: reduceMotion.matches ? "auto" : "smooth"
    });
  }

  function render() {
    var cls = getClass(state.classId);
    if (!cls) return;

    var items = visibleCollections(cls);
    var hasCollections = (COLLECTIONS[cls.id] || []).length > 0;

    grid.innerHTML = items.length
      ? items
          .map(function (item, index) {
            return cardTemplate(item, cls, index);
          })
          .join("")
      : emptyTemplate(cls, hasCollections);

    packCount.textContent = String(items.length);
    librarySummary.textContent = summaryText(cls);
    seriesFilter.hidden = cls.cycle !== "lycee";
    classNote.innerHTML = noteText(cls);

    updateAvailability(cls, items);
    syncControls(cls);
    centerActiveTab(cls);
  }

  function scrollToLibrary() {
    var library = document.getElementById("bibliotheque");
    if (!library) return;
    library.scrollIntoView({
      behavior: reduceMotion.matches ? "auto" : "smooth",
      block: "start"
    });
  }

  function applyClass(id, options) {
    var cls = getClass(id);
    if (!cls) return;

    if (previewDialog && previewDialog.open) closePreview();

    state.classId = id;
    if (cls.cycle === "college") state.series = "all";

    render();
    closeMenu();
    if (options && options.scroll) scrollToLibrary();
  }

  function applySeries(id, options) {
    if (id !== "all" && !getSeries(id)) return;

    if (previewDialog && previewDialog.open) closePreview();

    if (getClass(state.classId).cycle !== "lycee") {
      state.classId = "tle";
    }
    state.series = id;

    render();
    closeMenu();
    if (options && options.scroll) scrollToLibrary();
  }

  function openMenu() {
    if (!menuToggle || !mobileMenu) return;
    mobileMenu.classList.add("is-open");
    mobileMenu.removeAttribute("inert");
    mobileMenu.setAttribute("aria-hidden", "false");
    menuToggle.classList.add("is-open");
    menuToggle.setAttribute("aria-expanded", "true");
    menuToggle.setAttribute("aria-label", "Fermer le menu");
    document.body.classList.add("menu-open");
  }

  function closeMenu() {
    if (!menuToggle || !mobileMenu) return;
    mobileMenu.classList.remove("is-open");
    mobileMenu.setAttribute("inert", "");
    mobileMenu.setAttribute("aria-hidden", "true");
    menuToggle.classList.remove("is-open");
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.setAttribute("aria-label", "Ouvrir le menu");
    document.body.classList.remove("menu-open");
  }

  function showToast(message) {
    if (!toast || !toastMessage) return;
    toastMessage.textContent = message;
    toast.classList.add("is-visible");
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(function () {
      toast.classList.remove("is-visible");
    }, 3800);
  }

  function findCurrentCollection(id) {
    return visibleCollections(getClass(state.classId)).find(function (item) {
      return item.id === id;
    });
  }

  function previewMetaText(item, cls) {
    var count =
      item.kind === "epreuve"
        ? item.docs.length + " aperçus · pack de 10"
        : item.docs.length + (item.docs.length > 1 ? " documents" : " document");
    var seriesText = "";
    if (cls.cycle === "lycee") {
      seriesText =
        item.hasCommonSeries || !item.series.length
          ? " · Toutes séries"
          : " · " + seriesLabel(item.series);
    }
    return cls.label + " · " + cls.cycleLabel + " · " + count + seriesText;
  }

  function buildPreviewThumbs() {
    if (!previewThumbs || !previewState.collection) return;

    previewThumbs.innerHTML = "";
    previewState.collection.docs.forEach(function (doc, index) {
      var button = document.createElement("button");
      button.type = "button";
      button.className = "preview-thumb";
      button.setAttribute("data-thumb", String(index));
      button.setAttribute("aria-label", "Afficher " + doc.name);

      var image = document.createElement("img");
      image.src = doc.file;
      image.alt = "";
      image.loading = "eager";
      image.decoding = "async";

      button.appendChild(image);
      previewThumbs.appendChild(button);
    });
  }

  function scrollActiveThumb(index) {
    if (!previewThumbs) return;
    var thumb = previewThumbs.children[index];
    if (!thumb) return;

    window.requestAnimationFrame(function () {
      var target = thumb.offsetLeft - (previewThumbs.clientWidth - thumb.offsetWidth) / 2;
      previewThumbs.scrollTo({
        left: Math.max(0, target),
        behavior: reduceMotion.matches ? "auto" : "smooth"
      });
    });
  }

  function setPreviewDoc(index) {
    var collection = previewState.collection;
    if (!collection) return;

    var docs = collection.docs;
    if (!docs.length) return;
    index = Math.max(0, Math.min(index, docs.length - 1));
    previewState.index = index;

    var doc = docs[index];
    var cls = getClass(state.classId);
    var docMeta = [collection.subject, cls.label];
    if (cls.cycle === "lycee") docMeta.push(docSeriesLabel(doc));

    if (previewImage) {
      previewImage.hidden = false;
      if (previewFallback) previewFallback.hidden = true;
      previewImage.src = doc.file;
      previewImage.alt = doc.name + " — " + collection.subject + " " + cls.label;
    }
    if (previewDocTitle) previewDocTitle.textContent = doc.name;
    if (previewDocMeta) previewDocMeta.textContent = docMeta.join(" · ");
    if (previewCounter) previewCounter.textContent = index + 1 + " / " + docs.length;

    if (previewPrev) previewPrev.disabled = index <= 0;
    if (previewNext) previewNext.disabled = index >= docs.length - 1;

    if (previewThumbs) {
      Array.prototype.forEach.call(previewThumbs.children, function (thumb, thumbIndex) {
        var active = thumbIndex === index;
        thumb.classList.toggle("is-active", active);
        thumb.setAttribute("aria-current", active ? "true" : "false");
      });
    }

    scrollActiveThumb(index);
  }

  function openPreview(id, trigger) {
    if (!previewDialog) return;

    var item = findCurrentCollection(id);
    if (!item || !item.docs.length) return;

    var cls = getClass(state.classId);
    closeMenu();

    previewState.collection = item;
    previewState.index = 0;
    previewState.trigger = trigger || null;

    if (previewTitle) previewTitle.textContent = item.title;
    if (previewMeta) previewMeta.textContent = previewMetaText(item, cls);
    if (previewPrice) previewPrice.textContent = item.price + " F " + item.priceUnit;

    document.body.classList.add("preview-open");
    if (typeof previewDialog.showModal === "function") {
      previewDialog.showModal();
    } else {
      previewDialog.setAttribute("open", "");
    }

    buildPreviewThumbs();
    setPreviewDoc(0);
  }

  function closePreview() {
    if (!previewDialog) return;
    if (previewDialog.open && typeof previewDialog.close === "function") {
      previewDialog.close();
      return;
    }
    previewDialog.removeAttribute("open");
    document.body.classList.remove("preview-open");
  }

  function stepPreview(delta) {
    var collection = previewState.collection;
    if (!collection) return;
    var next = previewState.index + delta;
    if (next < 0 || next >= collection.docs.length) return;
    setPreviewDoc(next);
  }

  function refreshDocs() {
    if (refreshInFlight || !window.fetch) return;

    refreshInFlight = true;
    window
      .fetch("./src/docs-manifest.json?t=" + Date.now(), { cache: "no-store" })
      .then(function (response) {
        return response.ok ? response.json() : null;
      })
      .then(function (manifest) {
        refreshInFlight = false;
        if (!manifest || !manifest.generatedAt || manifest.generatedAt === docsVersion) {
          return;
        }

        docsVersion = manifest.generatedAt;
        window.PAYBOOK_DOCS = manifest;
        data.rebuild();

        if (previewDialog && previewDialog.open) closePreview();
        render();
        showToast("Bibliothèque mise à jour : de nouveaux documents sont disponibles.");
      })
      .catch(function () {
        refreshInFlight = false;
      });
  }

  document.addEventListener("click", function (event) {
    if (event.target.closest(".site-header a")) {
      closeMenu();
    }

    var classLink = event.target.closest("[data-class-link]");
    if (classLink) {
      event.preventDefault();
      applyClass(classLink.getAttribute("data-class-link"), { scroll: true });
      return;
    }

    var classTab = event.target.closest("[data-class-tab]");
    if (classTab) {
      applyClass(classTab.getAttribute("data-class-tab"), { scroll: false });
      return;
    }

    var seriesLink = event.target.closest("[data-series-link]");
    if (seriesLink) {
      event.preventDefault();
      applySeries(seriesLink.getAttribute("data-series-link"), { scroll: true });
      return;
    }

    var seriesChip = event.target.closest("[data-series-chip]");
    if (seriesChip) {
      applySeries(seriesChip.getAttribute("data-series-chip"), { scroll: false });
      return;
    }

    if (
      mobileMenu &&
      mobileMenu.classList.contains("is-open") &&
      !event.target.closest(".site-header")
    ) {
      closeMenu();
    }
  });

  if (menuToggle) {
    menuToggle.addEventListener("click", function () {
      if (mobileMenu.classList.contains("is-open")) {
        closeMenu();
      } else {
        openMenu();
      }
    });
  }

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && mobileMenu && mobileMenu.classList.contains("is-open")) {
      closeMenu();
      if (menuToggle) menuToggle.focus();
    }
  });

  var desktopQuery = window.matchMedia("(min-width: 900px)");
  function handleDesktopChange(event) {
    if (event.matches) closeMenu();
  }
  if (desktopQuery.addEventListener) {
    desktopQuery.addEventListener("change", handleDesktopChange);
  } else if (desktopQuery.addListener) {
    desktopQuery.addListener(handleDesktopChange);
  }

  if (grid) {
    grid.addEventListener("click", function (event) {
      var viewButton = event.target.closest("[data-view]");
      if (viewButton) {
        openPreview(viewButton.getAttribute("data-view"), viewButton);
        return;
      }

      var buyButton = event.target.closest("[data-buy]");
      if (!buyButton) return;
      showToast(buyButton.getAttribute("data-buy") + " — Commande enregistrée, vous serez redirigé vers le vendeur.");
      window.location.href = "https://wa.me/message/GY4OCB3BR7SMD1";
    });
  }

  if (previewDialog) {
    previewDialog.addEventListener("click", function (event) {
      if (event.target === previewDialog) {
        closePreview();
        return;
      }

      if (event.target.closest("[data-preview-close]")) {
        closePreview();
        return;
      }

      if (event.target.closest("[data-preview-prev]")) {
        stepPreview(-1);
        return;
      }

      if (event.target.closest("[data-preview-next]")) {
        stepPreview(1);
        return;
      }

      var thumb = event.target.closest("[data-thumb]");
      if (thumb) {
        setPreviewDoc(Number(thumb.getAttribute("data-thumb")));
      }
    });

    previewDialog.addEventListener("keydown", function (event) {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        stepPreview(-1);
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        stepPreview(1);
      }
    });

    previewDialog.addEventListener("close", function () {
      document.body.classList.remove("preview-open");
      var trigger = previewState.trigger;
      previewState.trigger = null;
      previewState.collection = null;
      if (trigger && document.contains(trigger)) trigger.focus();
    });

    if (previewImage) {
      previewImage.addEventListener("error", function () {
        previewImage.hidden = true;
        if (previewFallback) previewFallback.hidden = false;
      });
      previewImage.addEventListener("load", function () {
        previewImage.hidden = false;
        if (previewFallback) previewFallback.hidden = true;
      });
    }

    if (previewFigure) {
      previewFigure.addEventListener(
        "touchstart",
        function (event) {
          touchStartX = event.changedTouches[0].clientX;
        },
        { passive: true }
      );
      previewFigure.addEventListener(
        "touchend",
        function (event) {
          if (touchStartX === null) return;
          var distance = event.changedTouches[0].clientX - touchStartX;
          touchStartX = null;
          if (Math.abs(distance) < 42) return;
          stepPreview(distance > 0 ? -1 : 1);
        },
        { passive: true }
      );
    }
  }

  document.querySelectorAll("[data-social]").forEach(function (button) {
    button.addEventListener("click", function () {
      showToast(button.getAttribute("data-social") + " — cette page sera bientôt disponible.");
    });
  });

  if (newsletter) {
    newsletter.addEventListener("submit", function (event) {
      event.preventDefault();
      if (!newsletterEmail.checkValidity()) {
        newsletterEmail.reportValidity();
        return;
      }
      newsletter.reset();
      showToast("Merci ! Vous serez informé dès la sortie des prochains packs.");
    });
  }

  function initScrollSpy() {
    var links = Array.prototype.slice.call(document.querySelectorAll(".main-nav .nav-link"));
    if (!links.length || !("IntersectionObserver" in window)) return;

    var sections = links
      .map(function (link) {
        return document.getElementById(link.getAttribute("href").slice(1));
      })
      .filter(Boolean);

    function setActive(id) {
      links.forEach(function (link) {
        var active = link.getAttribute("href") === "#" + id;
        link.classList.toggle("is-active", active);
        if (active) {
          link.setAttribute("aria-current", "page");
        } else {
          link.removeAttribute("aria-current");
        }
      });
    }

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) setActive(entry.target.id);
        });
      },
      { rootMargin: "-38% 0px -52% 0px", threshold: 0 }
    );

    sections.forEach(function (section) {
      observer.observe(section);
    });
  }

  if (year) year.textContent = String(new Date().getFullYear());

  render();
  initScrollSpy();

  if (isLocalDev && window.fetch && data.rebuild) {
    window.setInterval(refreshDocs, 3000);
  }
})();
