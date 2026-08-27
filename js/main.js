(function () {
  /* ---------------- NAV ---------------- */
  var nav = document.querySelector('.nav');
  var toggle = document.querySelector('.nav__toggle');

  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      var open = nav.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
    });

    nav.querySelectorAll('.nav__menu a').forEach(function (link) {
      link.addEventListener('click', function () {
        nav.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });
  }


  /* ---------------- VISOR A PANTALLA COMPLETA ---------------- */
  var Lightbox = (function () {
    var box = document.getElementById('lightbox');
    if (!box) return null;

    var img = box.querySelector('.lightbox__img');
    var caption = box.querySelector('.lightbox__caption');
    var current = box.querySelector('.lightbox__current');
    var total = box.querySelector('.lightbox__total');
    var closeBtn = box.querySelector('.lightbox__close');
    var arrows = Array.prototype.slice.call(box.querySelectorAll('.lightbox__arrow'));

    var shots = [];
    var index = 0;
    var label = '';
    var lastFocus = null;
    var onClose = null;

    function show(i) {
      index = (i + shots.length) % shots.length;
      img.classList.remove('is-ready');
      var next = new Image();
      next.onload = function () {
        img.src = next.src;
        img.classList.add('is-ready');
      };
      next.src = shots[index];
      current.textContent = ('0' + (index + 1)).slice(-2);
    }

    function open(sources, startAt, name, closed) {
      if (!sources.length) return;
      shots = sources;
      label = name || '';
      onClose = closed || null;
      lastFocus = document.activeElement;

      caption.textContent = label;
      img.alt = label;
      total.textContent = ('0' + shots.length).slice(-2);

      box.hidden = false;
      document.body.classList.add('is-locked');
      requestAnimationFrame(function () { box.classList.add('is-visible'); });

      show(startAt || 0);
      closeBtn.focus();
    }

    function close() {
      if (box.hidden) return;
      box.classList.remove('is-visible');
      document.body.classList.remove('is-locked');

      setTimeout(function () {
        box.hidden = true;
        img.src = '';
        img.classList.remove('is-ready');
      }, 400);

      if (onClose) onClose(index);
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    }

    arrows.forEach(function (arrow) {
      arrow.addEventListener('click', function () { show(index + Number(arrow.dataset.dir)); });
    });

    closeBtn.addEventListener('click', close);

    // clic fuera de la foto cierra
    box.addEventListener('click', function (event) {
      if (event.target === box || event.target.closest('.lightbox__stage') === event.target) close();
    });

    document.addEventListener('keydown', function (event) {
      if (box.hidden) return;
      if (event.key === 'Escape') { event.stopPropagation(); close(); }
      else if (event.key === 'ArrowRight') show(index + 1);
      else if (event.key === 'ArrowLeft') show(index - 1);
    }, true);

    return { open: open, close: close, isOpen: function () { return !box.hidden; } };
  })();

  /* ---------------- SERVICIOS (slider del hero) ---------------- */
  (function () {
    var root = document.querySelector('.services');
    if (!root) return;

    var viewport = root.querySelector('.services__viewport');
    var track = root.querySelector('.services__track');
    var cards = Array.prototype.slice.call(root.querySelectorAll('.service'));
    var arrows = Array.prototype.slice.call(root.querySelectorAll('.services__arrow'));
    var counter = root.querySelector('.services__current');
    var fill = root.querySelector('.services__bar-fill');

    var panels = Array.prototype.slice.call(document.querySelectorAll('.hero__panel'));
    var stillMode = window.matchMedia('(prefers-reduced-motion: reduce)');

    var GAP = 16;
    var SLIDE_MS = 4200;

    var index = 0;      // primera card visible
    var open = -1;      // card expandida, -1 si ninguna
    var slideTimer = null;

    /* ---- Medidas: el ancho de card se deriva del espacio disponible ---- */
    function pad() {
      return parseFloat(getComputedStyle(track).paddingLeft) || 0;
    }

    function space() {
      return viewport.clientWidth - pad();
    }

    function base() {
      return parseFloat(getComputedStyle(root).getPropertyValue('--card-w')) || 210;
    }

    function openWidth() {
      return parseFloat(getComputedStyle(root).getPropertyValue('--card-w-open')) || base() * 2;
    }

    function widthOf(i) {
      return i === open ? openWidth() : base();
    }

    /* Desplazamiento acumulado hasta la card i (anchos variables) */
    function offsetOf(i) {
      var x = 0;
      for (var k = 0; k < i; k++) x += widthOf(k) + GAP;
      return x;
    }

    function totalWidth() {
      return offsetOf(cards.length - 1) + widthOf(cards.length - 1);
    }

    function maxShift() {
      return Math.max(0, totalWidth() - space());
    }

    /* ---- Render ---- */
    function render() {
      var limit = maxShift();
      var shift = Math.min(offsetOf(index), limit);

      track.style.transform = 'translateX(' + -shift + 'px)';
      counter.textContent = ('0' + (index + 1)).slice(-2);

      var progress = limit === 0 ? 1 : Math.min(1, (shift + space()) / totalWidth());
      fill.style.width = (progress * 100) + '%';
      fill.style.transform = 'none';

      arrows.forEach(function (arrow) {
        var dir = Number(arrow.dataset.dir);
        arrow.disabled = dir < 0 ? index === 0 : shift >= limit - 0.5;
      });
    }

    /* ---- Galería de la card expandida ---- */
    function stopSlides() {
      clearInterval(slideTimer);
      slideTimer = null;
    }

    function startSlides(card) {
      stopSlides();
      var slides = Array.prototype.slice.call(card.querySelectorAll('.service__slide'));
      if (!slides.length) return;

      slides.forEach(function (slide) {
        if (!slide.style.backgroundImage) {
          slide.style.backgroundImage = 'url("' + slide.dataset.src + '")';
        }
      });

      if (slides.length < 2 || stillMode.matches) return;

      var i = slides.findIndex(function (slide) { return slide.classList.contains('is-current'); });
      slideTimer = setInterval(function () {
        i = (i + 1) % slides.length;
        slides.forEach(function (slide, k) { slide.classList.toggle('is-current', k === i); });
      }, SLIDE_MS);
    }

    /* ---- Texto del hero: el saliente sube, el entrante llega desde abajo ---- */
    function showPanel(id) {
      var next = panels.filter(function (p) { return p.dataset.panel === String(id); })[0];
      var current = panels.filter(function (p) { return p.classList.contains('is-current'); })[0];
      if (!next || next === current) return;

      if (current) {
        current.classList.remove('is-current');
        current.classList.add('is-leaving');
        setTimeout(function () { current.classList.remove('is-leaving'); }, 650);
      }
      next.classList.add('is-current');
    }

    /* ---- Abrir / cerrar ---- */
    function openCard(i) {
      if (open === i) return;
      open = i;

      cards.forEach(function (card, k) {
        card.classList.toggle('is-open', k === i);
        card.setAttribute('aria-expanded', String(k === i));
        card.querySelectorAll('.service__close, .service__expand').forEach(function (btn) {
          btn.tabIndex = k === i ? 0 : -1;
        });
      });

      // la card expandida se alinea a la izquierda para verse completa
      index = i;
      sizeCards();
      startSlides(cards[i]);
      showPanel(cards[i].dataset.service);
    }

    function closeCard() {
      if (open === -1) return;
      open = -1;
      stopSlides();

      cards.forEach(function (card) {
        card.classList.remove('is-open');
        card.setAttribute('aria-expanded', 'false');
        card.querySelectorAll('.service__close, .service__expand').forEach(function (btn) {
          btn.tabIndex = -1;
        });
      });

      sizeCards();
      showPanel('0');
    }

    /* ---- Pantalla completa ---- */
    function openFullscreen(card) {
      if (!Lightbox) return;

      var slides = Array.prototype.slice.call(card.querySelectorAll('.service__slide'));
      var sources = slides.map(function (slide) { return slide.dataset.full || slide.dataset.src; });
      var from = slides.findIndex(function (slide) { return slide.classList.contains('is-current'); });
      var name = card.querySelector('.service__title').textContent.trim();

      stopSlides();

      Lightbox.open(sources, Math.max(0, from), name, function (endedAt) {
        // la card queda en la misma foto en la que se cerró el visor
        slides.forEach(function (slide, k) { slide.classList.toggle('is-current', k === endedAt); });
        if (card.classList.contains('is-open')) startSlides(card);
      });
    }

    /* ---- Eventos ---- */
    cards.forEach(function (card, i) {
      card.addEventListener('click', function (event) {
        if (event.target.closest('.service__close')) {
          closeCard();
          return;
        }
        if (event.target.closest('.service__expand')) {
          openFullscreen(card);
          return;
        }
        openCard(i);
      });

      card.addEventListener('keydown', function (event) {
        if (event.key !== 'Enter' && event.key !== ' ') return;
        event.preventDefault();
        if (open === i) closeCard();
        else openCard(i);
      });
    });

    document.addEventListener('keydown', function (event) {
      if (event.key !== 'Escape') return;
      if (Lightbox && Lightbox.isOpen()) return;
      closeCard();
    });

    arrows.forEach(function (arrow) {
      arrow.addEventListener('click', function () {
        index = Math.min(cards.length - 1, Math.max(0, index + Number(arrow.dataset.dir)));
        render();
      });
    });

    var startX = null;
    track.addEventListener('touchstart', function (e) { startX = e.touches[0].clientX; }, { passive: true });
    track.addEventListener('touchend', function (e) {
      if (startX === null) return;
      var dx = e.changedTouches[0].clientX - startX;
      startX = null;
      if (Math.abs(dx) < 40) return;
      index = Math.min(cards.length - 1, Math.max(0, index + (dx < 0 ? 1 : -1)));
      render();
    });

    /* ---- Dimensionado ---- */
    function sizeCards() {
      var wide = window.innerWidth > 900;
      var available = space();
      var perView = wide ? 3 : 1.5;
      var w = (available - GAP * Math.ceil(perView - 1)) / perView;

      root.style.setProperty('--card-w', Math.round(w) + 'px');
      root.style.setProperty('--card-h', Math.round(w * 4 / 3) + 'px');
      // expandida: dos cards y media en desktop, todo el ancho útil en móvil
      root.style.setProperty('--card-w-open',
        Math.round(wide ? Math.min(w * 2.2, available) : available) + 'px');

      render();
    }

    sizeCards();
    window.addEventListener('resize', sizeCards);
  })();

  /* ---------------- PROJECTS ---------------- */
  var projects = Array.prototype.slice.call(document.querySelectorAll('.project'));
  if (!projects.length) return;

  var SLIDE_MS = 4500;
  var touchMode = window.matchMedia('(max-width: 900px), (hover: none)');
  var stillMode = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* Slideshow: recorre los slides de una galería con crossfade.
     Las imágenes se cargan la primera vez que la galería se necesita. */
  function Slideshow(gallery, slideSelector, dots) {
    var slides = Array.prototype.slice.call(gallery.querySelectorAll(slideSelector));
    var index = 0;
    var timer = null;
    var loaded = false;

    function load() {
      if (loaded) return;
      loaded = true;
      slides.forEach(function (slide) {
        slide.style.backgroundImage = 'url("' + slide.dataset.src + '")';
      });
    }

    function show(next) {
      index = (next + slides.length) % slides.length;
      slides.forEach(function (slide, i) {
        slide.classList.toggle('is-current', i === index);
      });
      if (dots) {
        dots.forEach(function (dot, i) {
          dot.classList.toggle('is-current', i === index);
        });
      }
    }

    return {
      load: load,
      start: function () {
        load();
        if (timer || slides.length < 2 || stillMode.matches) return;
        timer = setInterval(function () { show(index + 1); }, SLIDE_MS);
      },
      stop: function () {
        clearInterval(timer);
        timer = null;
      }
    };
  }

  /* Galerías de fondo (desktop) y de panel (mobile), indexadas por proyecto */
  var shows = { desktop: {}, panel: {} };

  document.querySelectorAll('.projects__gallery').forEach(function (gallery) {
    shows.desktop[gallery.dataset.gallery] = Slideshow(gallery, '.projects__slide', null);
  });

  projects.forEach(function (project) {
    var gallery = project.querySelector('.project__gallery');
    if (!gallery) return;
    var dots = Array.prototype.slice.call(project.querySelectorAll('.project__dot'));
    shows.panel[gallery.dataset.gallery] = Slideshow(gallery, '.project__slide', dots);
  });

  function stopAll(group) {
    Object.keys(shows[group]).forEach(function (id) { shows[group][id].stop(); });
  }

  /* ---- Desktop: el hover activa el proyecto y su slideshow ---- */
  var galleries = Array.prototype.slice.call(document.querySelectorAll('.projects__gallery'));

  function activate(id) {
    galleries.forEach(function (gallery) {
      gallery.classList.toggle('is-active', gallery.dataset.gallery === id);
    });
    stopAll('desktop');
    shows.desktop[id].start();
  }

  /* ---- Mobile: el acordeón activa el slideshow del panel ---- */
  function closeAll(except) {
    projects.forEach(function (project) {
      if (project === except) return;
      project.classList.remove('is-open');
      project.setAttribute('aria-expanded', 'false');
    });
    stopAll('panel');
  }

  projects.forEach(function (project) {
    var id = project.dataset.project;

    project.addEventListener('mouseenter', function () {
      if (touchMode.matches) return;
      activate(id);
      projects.forEach(function (p) { p.classList.toggle('is-active', p === project); });
    });

    /* Las filas ya no son enlaces: el toque abre y el siguiente cierra */
    function toggle() {
      if (!touchMode.matches) return;

      if (project.classList.contains('is-open')) {
        project.classList.remove('is-open');
        project.setAttribute('aria-expanded', 'false');
        stopAll('panel');
        return;
      }

      closeAll(project);
      project.classList.add('is-open');
      project.setAttribute('aria-expanded', 'true');
      shows.panel[id].start();
    }

    project.addEventListener('click', toggle);

    project.addEventListener('keydown', function (event) {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      toggle();
    });

    project.setAttribute('aria-expanded', 'false');
  });

  /* ---- Arranque y cambio de breakpoint ---- */
  function syncMode() {
    closeAll(null);
    stopAll('desktop');
    if (touchMode.matches) {
      galleries.forEach(function (g) { g.classList.remove('is-active'); });
    } else {
      activate(projects[0].dataset.project);
    }
  }

  syncMode();

  if (touchMode.addEventListener) touchMode.addEventListener('change', syncMode);
  else if (touchMode.addListener) touchMode.addListener(syncMode);

  /* Precarga discreta del resto de galerías cuando el navegador está libre */
  var idle = window.requestIdleCallback || function (fn) { return setTimeout(fn, 2000); };
  idle(function () {
    var group = touchMode.matches ? 'panel' : 'desktop';
    Object.keys(shows[group]).forEach(function (id) { shows[group][id].load(); });
  });
})();
