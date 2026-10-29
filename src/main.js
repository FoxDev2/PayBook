(function () {
  "use strict";

  var data = window.PAYBOOK;
  if (!data) return;

  var CLASSES = data.CLASSES;
  var SERIES = data.SERIES;
  var COLLECTIONS = data.COLLECTIONS;

  var state = {
    classId: "6e",
    series: "all"
  };

  var grid = document.getElementById("pack-grid");
  var packCount = document.getElementById("pack-count");
  var librarySummary = document.getElementById("library-summary");
  var seriesFilter = document.getElementById("series-filter");
  var classNote = document.getElementById("class-note");
  var menuToggle = document.querySelector(".menu-toggle");
  var mobileMenu = document.getElementById("mobile-menu");
  var toast = document.getElementById("toast");
  var toastMessage = document.getElementById("toast-message");
  var newsletter = document.getElementById("newsletter-form");
  var newsletterEmail = document.getElementById("newsletter-email");
  var year = document.getElementById("year");
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  var toastTimer;

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

  function cardTemplate(item, cls, index) {
    var seriesBadge = item.series.length
      ? '<span class="badge badge-series">' + seriesLabel(item.series) + "</span>"
      : "";
    var focusBadge = item.focus
      ? '<span class="badge badge-focus">' + item.focus + "</span>"
      : "";

    return (
      '<article class="pack-card" style="--delay:' +
      Math.min(index * 45, 270) +
      'ms">' +
      '<div class="pack-cover cover-' +
      item.tone +
      '" aria-hidden="true">' +
      '<div class="cover-top">' +
      '<span class="cover-brand">' +
      icon("book-open") +
      " PayBook</span>" +
      '<span class="cover-focus">' +
      (item.focus || "Pack complet") +
      "</span>" +
      "</div>" +
      '<div class="cover-main">' +
      '<span class="cover-icon">' +
      icon(item.icon) +
      "</span>" +
      '<span class="cover-subject">' +
      item.subject +
      "</span>" +
      '<span class="cover-meta">' +
      cls.cycleLabel +
      '<span class="dot"></span>' +
      cls.label +
      "</span>" +
      "</div>" +
      "</div>" +
      '<div class="pack-body">' +
      '<div class="pack-badges">' +
      '<span class="badge badge-class">' +
      cls.label +
      "</span>" +
      seriesBadge +
      focusBadge +
      "</div>" +
      '<h3 class="pack-title">' +
      item.title +
      "</h3>" +
      '<p class="pack-desc">' +
      item.description +
      "</p>" +
      '<p class="pack-meta">' +
      icon("check") +
      " Exercices &amp; corrigés inclus</p>" +
      '<div class="pack-footer">' +
      '<div class="price"><strong>' +
      item.price +
      ' <small>F</small></strong><span>l\'unité</span></div>' +
      '<button class="buy-btn" type="button" data-buy="' +
      item.title +
      '" aria-label="Acheter ' +
      item.title +
      '">Acheter ' +
      icon("cart") +
      "</button>" +
      "</div>" +
      "</div>" +
      "</article>"
    );
  }

  function emptyTemplate() {
    return (
      '<div class="empty-state">' +
      icon("graduation") +
      "<h3>Aucun pack pour cette série</h3>" +
      "<p>Essayez une autre série ou une autre classe.</p>" +
      "</div>"
    );
  }

  function visibleCollections(cls) {
    var items = COLLECTIONS[cls.id] || [];
    if (cls.cycle === "lycee" && state.series !== "all") {
      items = items.filter(function (item) {
        return item.series.indexOf(state.series) !== -1;
      });
    }
    return items;
  }

  function summaryText(cls) {
    if (cls.cycle !== "lycee") return cls.label + " · Collège";
    if (state.series === "all") return cls.label + " · Lycée · Toutes séries";
    return cls.label + " · Série " + state.series;
  }

  function noteText(cls) {
    if (cls.cycle !== "lycee") {
      return "Packs communs à la classe de <strong>" + cls.label + "</strong>.";
    }
    if (state.series === "all") {
      return "Filtrez les packs selon votre <strong>série</strong>.";
    }
    return "Série <strong>" + state.series + "</strong> sélectionnée.";
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

    grid.innerHTML = items.length
      ? items
          .map(function (item, index) {
            return cardTemplate(item, cls, index);
          })
          .join("")
      : emptyTemplate();

    packCount.textContent = String(items.length);
    librarySummary.textContent = summaryText(cls);
    seriesFilter.hidden = cls.cycle !== "lycee";
    classNote.innerHTML = noteText(cls);

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

    state.classId = id;
    if (cls.cycle === "college") state.series = "all";

    render();
    closeMenu();
    if (options && options.scroll) scrollToLibrary();
  }

  function applySeries(id, options) {
    if (id !== "all" && !getSeries(id)) return;

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
      var button = event.target.closest("[data-buy]");
      if (!button) return;
      showToast(button.getAttribute("data-buy") + " — l'achat en ligne arrive bientôt.");
    });
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
})();
