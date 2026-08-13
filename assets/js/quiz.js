/* The Twelve Ways of Love™ — Love Intelligence Code quiz
   Content and scoring carried over verbatim from the approved design prototype. */
(function () {
  'use strict';

  var CONFIG = window.MLI_CONFIG || {};
  var FORM_ENDPOINT = CONFIG.formEndpoint || '';
  var CONTACT_EMAIL = CONFIG.contactEmail || 'hello@myloveintelligence.com';
  var BASE = 'assets/uploads/';

  var WAYS = {
    praise:       { name: 'Words of Praise',           icon: 'WORDS-OF-PRAISE-ICON.png',                    desc: 'You feel loved when someone names what they see in you — out loud, in words that are specific and true.' },
    conversation: { name: 'Conversation',              icon: 'CONVERSATION-ICON-Vector-Color.png',           desc: 'Real back-and-forth talk is how your heart connects. The rambling debrief IS the relationship.' },
    listening:    { name: 'Listening',                 icon: 'LISTENING-ICON-Vector-Color.png',              desc: 'Being fully heard — without fixing, without hurrying — is your deepest experience of love.' },
    time:         { name: 'Time Together',             icon: 'TIME-TOGETHER-ICON-Vector-Color.png',          desc: 'Presence is your love language of choice. Unhurried, shared hours say everything.' },
    touch:        { name: 'Physical Touch',            icon: 'PHYSICAL-TOUCH-ICON-Vector-Color.png',         desc: 'A hand on the shoulder says more than a paragraph. Closeness, for you, is literal.' },
    service:      { name: 'Acts of Service',           icon: 'ACTS-OF-SERVICE-ICON-Vector-Color.png',        desc: 'Love, to you, looks like someone quietly carrying the load beside you — done, handled, cared for.' },
    gifts:        { name: 'Gifts',                     icon: 'GIFTS-ICON-Vector-Color.png',                  desc: 'A thoughtful token says: I was thinking of you when you weren’t there. You keep the ticket stubs.' },
    protection:   { name: 'Protection',                icon: 'PROTECTION-ICON-Vector-Color.png',             desc: 'Feeling safe — stood up for, watched over — is how love lands for you. Safety first, always.' },
    teaching:     { name: 'Teaching',                  icon: 'TEACHING-ICON-Color-Vector.png',               desc: 'Sharing what you know, and learning side by side, is how you bond. Growth is your romance.' },
    sharing:      { name: 'Sharing',                   icon: 'SHARING-ICON-Color-Vector.png',                desc: 'The split dessert, the long drive, the inside joke — love, for you, is a life made of shared things.' },
    mystery:      { name: 'Magical Mystery',           icon: 'MAGICAL-MYSTERY-ICON-Vector-Color.png',        desc: 'Surprise, wonder and a little adventure keep your love alive. Don’t tell you the plan.' },
    organizing:   { name: 'Organizing for Perfection', icon: 'ORGANIZING-FOR-PERFECTION-ICON-Vector-Color.png', desc: 'Making things right and beautiful for someone is your love made visible. Order is affection.' }
  };

  var QUESTIONS = [
    { q: 'It’s been a long, heavy week. What would actually help?', opts: [
      ['A long hug, no words needed', 'touch'],
      ['Someone asking “how are you, really?” — then just listening', 'listening'],
      ['Coming home to find dinner already handled', 'service'],
      ['An unhurried evening together, phones away', 'time']
    ]},
    { q: 'Someone you love is away for a week. What do you miss first?', opts: [
      ['The rambling end-of-day debriefs', 'conversation'],
      ['Their hand in yours on the couch', 'touch'],
      ['Splitting the little things — coffee, jokes, errands', 'sharing'],
      ['The spark of not knowing what’s next together', 'mystery']
    ]},
    { q: 'Which “I love you” lands deepest?', opts: [
      ['“I’m proud of you — here’s what I see in you.”', 'praise'],
      ['A small gift that proves they know you', 'gifts'],
      ['“I’ve got you. You’re safe with me.”', 'protection'],
      ['“What’s mine is yours. Always.”', 'sharing']
    ]},
    { q: 'A perfect Saturday with someone you love looks like…', opts: [
      ['A surprise plan they won’t reveal yet', 'mystery'],
      ['A slow morning with nowhere to be', 'time'],
      ['Learning something new, side by side', 'teaching'],
      ['Making home beautiful together', 'organizing']
    ]},
    { q: 'After a disagreement, what heals fastest?', opts: [
      ['Being heard all the way out, without interruption', 'listening'],
      ['Talking it through to real understanding', 'conversation'],
      ['Reaching for each other before it’s even resolved', 'touch'],
      ['Hearing what they still love about me', 'praise']
    ]},
    { q: 'You feel most loved by your family when…', opts: [
      ['Everything is “ours” — the table, the stories, the traditions', 'sharing'],
      ['They close ranks around me when it matters', 'protection'],
      ['They show up with hands, not just words', 'service'],
      ['They simply stay — present and unhurried', 'time']
    ]},
    { q: 'Which small gesture would move you most?', opts: [
      ['A note naming three things they admire in you', 'praise'],
      ['Your chaos, quietly set in beautiful order', 'organizing'],
      ['They kept the ticket stub from your first outing', 'gifts'],
      ['They taught you the thing they’re best at', 'teaching']
    ]},
    { q: 'When you’re sick, care looks like…', opts: [
      ['Soup made, pharmacy run, no fuss', 'service'],
      ['Someone guarding my rest like a doorkeeper', 'protection'],
      ['Someone sitting close, hearing every worry', 'listening'],
      ['Flowers and your favorite magazine at the door', 'gifts']
    ]},
    { q: 'Love stays alive for you through…', opts: [
      ['Wonder — surprises, awe, new horizons', 'mystery'],
      ['Questions you’ve never asked each other before', 'conversation'],
      ['Growing together — trading skills, books, ideas', 'teaching'],
      ['Rituals kept beautifully — our table, our way', 'organizing']
    ]}
  ];

  var state = { screen: 'intro', qIndex: 0, picks: [], email: '', sent: false };

  var screens = {};
  var root;

  function $(sel, r) { return (r || document).querySelector(sel); }
  function $$(sel, r) { return Array.prototype.slice.call((r || document).querySelectorAll(sel)); }

  function show(name) {
    state.screen = name;
    Object.keys(screens).forEach(function (key) {
      if (screens[key]) screens[key].hidden = key !== name;
    });
    // Re-trigger the entry animation.
    var el = screens[name];
    if (el) {
      el.classList.remove('quiz-screen');
      void el.offsetWidth;
      el.classList.add('quiz-screen');
      var heading = el.querySelector('h1, h2');
      if (heading) {
        heading.setAttribute('tabindex', '-1');
        heading.focus({ preventScroll: true });
      }
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /* Ranked Ways, strongest first.

     Only the top one is ever shown. Everyone has FOUR Ways, and which four is
     set by their birth date — not by quiz answers — so the quiz can only ever
     offer a taste. The other three come from the paid Report, which is why the
     birth date is collected before the reveal. */
  function result() {
    var scores = {};
    state.picks.forEach(function (k) { scores[k] = (scores[k] || 0) + 1; });
    var ranked = Object.keys(WAYS)
      .map(function (k) { return [k, scores[k] || 0]; })
      .sort(function (a, b) { return b[1] - a[1]; });
    return ranked.map(function (r) { return WAYS[r[0]]; });
  }

  function renderQuestion() {
    var q = QUESTIONS[state.qIndex];
    if (!q) return;

    $('[data-q-num]', root).textContent   = String(state.qIndex + 1);
    $('[data-q-total]', root).textContent = String(QUESTIONS.length);
    $('[data-q-text]', root).textContent  = q.q;
    $('[data-progress]', root).style.width =
      Math.round(((state.qIndex + 1) / QUESTIONS.length) * 100) + '%';

    var backBtn = $('[data-q-back]', root);
    if (backBtn) backBtn.hidden = state.qIndex === 0;

    var list = $('[data-q-options]', root);
    while (list.firstChild) list.removeChild(list.firstChild);
    q.opts.forEach(function (pair) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'quiz-opt';
      btn.textContent = pair[0];
      btn.addEventListener('click', function () {
        state.picks = state.picks.slice(0, state.qIndex).concat([pair[1]]);
        if (state.qIndex + 1 >= QUESTIONS.length) {
          show('birth');           // birth date first, then the reveal
        } else {
          state.qIndex += 1;
          renderQuestion();
        }
      });
      list.appendChild(btn);
    });
  }

  function renderResult() {
    var primary = result()[0];

    $$('[data-primary-name]', root).forEach(function (el) { el.textContent = primary.name; });
    var desc = $('[data-primary-desc]', root);
    if (desc) desc.textContent = primary.desc;

    var pIcon = $('[data-primary-icon]', root);
    if (pIcon) { pIcon.src = BASE + primary.icon; pIcon.alt = primary.name; }
  }

  /* Birth-data gate. Sits between the last question and the reveal, because the
     Code is derived from birth date, time and place (per Vedic tradition) — not
     from the answers. Asking after the reveal would imply the quiz had already
     worked it out.

     Time is optional on purpose: plenty of people do not know theirs, and making
     it mandatory would lose the lead entirely. Date and place are required
     because without them there is nothing to calculate. */
  function initBirthForm() {
    var form = $('[data-birth-form]', root);
    if (!form) return;

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var dateEl  = $('#birth-date', form);
      var timeEl  = $('#birth-time', form);
      var placeEl = $('#birth-place', form);
      var err     = $('.form-error', form);

      var date  = (dateEl && dateEl.value || '').trim();
      var time  = (timeEl && timeEl.value || '').trim();
      var place = (placeEl && placeEl.value || '').trim();

      var fail = function (msg, el) {
        if (err) { err.textContent = msg; err.hidden = false; }
        if (el) el.focus();
      };

      if (!date) return fail('Please add your date of birth to see your Way.', dateEl);
      if (new Date(date) > new Date()) return fail('That date is in the future — please check it.', dateEl);
      if (!place) return fail('Please add your place of birth — your Code is calculated from it.', placeEl);

      if (err) err.hidden = true;

      state.birthDate  = date;
      state.birthTime  = time;
      state.birthPlace = place;
      renderResult();
      show('result');
    });
  }

  function initGuideForm() {
    var form    = $('[data-guide-form]', root);
    var success = $('[data-guide-success]', root);
    if (!form) return;

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var input = $('input[type="email"]', form);
      var email = (input && input.value || '').trim();
      var err   = $('.form-error', form);

      if (!email || email.indexOf('@') === -1) {
        if (err) { err.textContent = 'Please enter a valid email address.'; err.hidden = false; }
        if (input) input.focus();
        return;
      }
      if (err) err.hidden = true;

      var ranked = result();
      var birthLines =
        'Birth date:  ' + (state.birthDate || '(not given)') +
        '\nBirth time:  ' + (state.birthTime || '(not known)') +
        '\nBirth place: ' + (state.birthPlace || '(not given)');
      var payload = {
        email: email,
        form: 'love-code-quiz',
        subject: 'Love Intelligence Report request',
        birth_date: state.birthDate || '',
        birth_time: state.birthTime || '',
        birth_place: state.birthPlace || '',
        revealed_way: ranked[0].name,
        answers: state.picks.join(', ')
      };

      var btn = $('button[type="submit"]', form);
      var label = btn ? btn.textContent : '';
      if (btn) { btn.disabled = true; btn.textContent = 'Sending…'; }

      var done = function () {
        form.hidden = true;
        if (success) success.hidden = false;
      };

      if (!FORM_ENDPOINT) {
        var body = 'Love Intelligence Report request\n\nEmail: ' + email +
                   '\n' + birthLines +
                   '\nWay revealed by the quiz: ' + ranked[0].name;
        window.location.href = 'mailto:' + CONTACT_EMAIL +
          '?subject=' + encodeURIComponent('Love Intelligence Report request') +
          '&body=' + encodeURIComponent(body);
        done();
        if (btn) { btn.disabled = false; btn.textContent = label; }
        return;
      }

      // Same Contact Form 7 endpoint the other forms use, so a quiz lead lands
      // in Flamingo alongside everything else rather than in its own silo.
      var fd = new FormData();
      var id = String(CONFIG.formId || '');
      fd.append('_wpcf7', id);
      fd.append('_wpcf7_version', '6.0');
      fd.append('_wpcf7_locale', 'en_US');
      fd.append('_wpcf7_unit_tag', 'wpcf7-f' + id + '-o1');
      fd.append('_wpcf7_container_post', '0');
      fd.append('your-name', 'Quiz — ' + ranked[0].name);
      fd.append('your-email', email);
      fd.append('your-subject', 'Love Intelligence Report request');
      fd.append('your-message',
        birthLines +
        '\nWay revealed by the quiz: ' + ranked[0].name +
        '\n\nQuiz answers: ' + state.picks.join(', '));

      fetch(FORM_ENDPOINT, {
        method: 'POST',
        headers: { 'Accept': 'application/json' },
        body: fd
      }).then(function (res) {
        return res.json().catch(function () { return {}; }).then(function (b) {
          if (!res.ok) throw new Error('bad response');
          var st = b.status || '';
          if (st === 'validation_failed' || st === 'spam') throw new Error(b.message || 'rejected');
          done();
        });
      }).catch(function () {
        if (err) {
          err.textContent = 'Something went wrong. Please email ' + CONTACT_EMAIL + '.';
          err.hidden = false;
        }
      }).then(function () {
        if (btn) { btn.disabled = false; btn.textContent = label; }
      });
    });
  }

  function init() {
    root = $('[data-quiz]');
    if (!root) return;

    screens = {
      intro:    $('[data-screen="intro"]', root),
      question: $('[data-screen="question"]', root),
      birth:    $('[data-screen="birth"]', root),
      result:   $('[data-screen="result"]', root)
    };

    var begin = $('[data-quiz-begin]', root);
    if (begin) begin.addEventListener('click', function () {
      state.qIndex = 0;
      state.picks = [];
      renderQuestion();
      show('question');
    });

    var back = $('[data-q-back]', root);
    if (back) back.addEventListener('click', function () {
      state.qIndex = Math.max(0, state.qIndex - 1);
      renderQuestion();
    });

    var retake = $('[data-quiz-retake]', root);
    if (retake) retake.addEventListener('click', function () {
      state = { screen: 'intro', qIndex: 0, picks: [], email: '', birthDate: '', birthTime: '', birthPlace: '', sent: false };
      var form = $('[data-guide-form]', root);
      var success = $('[data-guide-success]', root);
      var birth = $('[data-birth-form]', root);
      if (form) { form.hidden = false; form.reset(); }
      if (birth) birth.reset();
      if (success) success.hidden = true;
      show('intro');
    });

    initBirthForm();
    initGuideForm();
    show('intro');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
