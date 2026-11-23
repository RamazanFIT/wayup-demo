/* Way Up demo — общая логика: язык, меню, вкладки, опросник с UTM */
(() => {
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const q = new URLSearchParams(location.search);
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* язык */
  const setLang = (l) => {
    document.body.dataset.lang = l;
    document.documentElement.lang = l === 'kz' ? 'kk' : 'ru';
    $$('[data-set-lang]').forEach(b => b.setAttribute('aria-pressed', b.dataset.setLang === l));
    $$('[data-ph-ru]').forEach(i => i.placeholder = i.dataset[l === 'kz' ? 'phKz' : 'phRu']);
    $$('option[data-ru]').forEach(o => o.textContent = o.dataset[l]);
    try { localStorage.setItem('wu_lang', l); } catch (e) {}
  };
  $$('[data-set-lang]').forEach(b => b.addEventListener('click', () => setLang(b.dataset.setLang)));
  let saved = null; try { saved = localStorage.getItem('wu_lang'); } catch (e) {}
  setLang(q.get('lang') === 'kz' ? 'kz' : q.get('lang') === 'ru' ? 'ru' : (saved === 'kz' ? 'kz' : 'ru'));

  /* шапка при прокрутке */
  const nav = $('.site-nav');
  const onScroll = () => nav && nav.classList.toggle('scrolled', scrollY > 40);
  addEventListener('scroll', onScroll, {passive: true}); onScroll();

  /* мобильное меню */
  const mm = $('#mmenu');
  const openMenu = (o) => { mm.classList.toggle('open', o); mm.setAttribute('aria-hidden', !o); document.body.style.overflow = o ? 'hidden' : ''; };
  $$('.burger').forEach(b => b.addEventListener('click', () => openMenu(true)));
  $('#mclose').addEventListener('click', () => openMenu(false));
  $$('#mmenu a').forEach(a => a.addEventListener('click', () => openMenu(false)));
  addEventListener('keydown', e => { if (e.key === 'Escape') openMenu(false); });

  /* вкладки стран */
  const tabs = $$('.tab2');
  tabs.forEach(t => t.addEventListener('click', () => {
    tabs.forEach(x => x.setAttribute('aria-selected', x === t));
    $$('.pan').forEach(p => p.classList.toggle('on', p.dataset.pan === t.dataset.tab));
    t.scrollIntoView({block: 'nearest', inline: 'nearest', behavior: reduce ? 'auto' : 'smooth'});
  }));

  /* опросник */
  const form = $('#qform'), done = $('#qdone');
  const UTM = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];
  UTM.forEach(k => { form.elements[k].value = q.get(k) || ''; });
  const answers = {};
  const steps = $$('.qs', form);
  let step = 1;
  const show = (n) => {
    step = n;
    steps.forEach(s => s.classList.toggle('on', +s.dataset.step === n));
    $('#qn').textContent = '0' + n;
    $$('#qbar span').forEach((s, i) => s.classList.toggle('on', i < n));
    $('#qback').hidden = n === 1;
    $('#qhint').style.visibility = n === 4 ? 'hidden' : 'visible';
  };
  const pick = (name, v) => {
    answers[name] = v;
    const st = steps.find(s => s.dataset.name === name);
    if (st) $$('.opt2', st).forEach(o => o.classList.toggle('sel', o.dataset.v === v));
  };
  $$('.opt2', form).forEach(o => o.addEventListener('click', () => {
    const st = o.closest('.qs');
    pick(st.dataset.name, o.dataset.v);
    setTimeout(() => show(+st.dataset.step + 1), reduce ? 0 : 280);
  }));
  $('#qback').addEventListener('click', () => show(Math.max(1, step - 1)));

  const reset = () => {
    form.reset(); Object.keys(answers).forEach(k => delete answers[k]);
    $$('.opt2', form).forEach(o => o.classList.remove('sel'));
    $$('.fld', form).forEach(f => f.classList.remove('bad'));
    UTM.forEach(k => { form.elements[k].value = q.get(k) || ''; });
    form.style.display = ''; done.classList.remove('on'); show(1);
  };
  $('#qagain').addEventListener('click', reset);

  /* кнопки «Консультация», «Подобрать вуз…», программы, страны → опросник */
  $$('[data-quiz]').forEach(b => b.addEventListener('click', (e) => {
    e.preventDefault();
    if (done.classList.contains('on')) reset();
    if (b.dataset.country) { pick('country', b.dataset.country); show(answers.program ? 3 : 2); }
    else if (b.dataset.program) { pick('program', b.dataset.program); show(answers.country ? 3 : 1); }
    $('#quiz').scrollIntoView({behavior: reduce ? 'auto' : 'smooth', block: 'start'});
    $$('#quiz .rv').forEach(x => x.classList.add('in'));
  }));

  /* телефон: маска +7 7XX XXX XX XX */
  const phone = form.elements.phone, name = form.elements.name;
  const fmt = (v) => {
    let d = v.replace(/\D/g, '');
    if (d.startsWith('8')) d = '7' + d.slice(1);
    if (d && !d.startsWith('7')) d = '7' + d;
    d = d.slice(0, 11);
    const p = [d.slice(1, 4), d.slice(4, 7), d.slice(7, 9), d.slice(9, 11)].filter(Boolean);
    return d ? '+7 ' + p.join(' ') : '';
  };
  phone.addEventListener('focus', () => { if (!phone.value) phone.value = '+7 '; });
  phone.addEventListener('input', () => { phone.value = fmt(phone.value); $('#fld-phone').classList.remove('bad'); });
  name.addEventListener('input', () => $('#fld-name').classList.remove('bad'));

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const digits = phone.value.replace(/\D/g, '');
    const okName = name.value.trim().length > 1, okPhone = digits.length === 11 && /^77/.test(digits);
    $('#fld-name').classList.toggle('bad', !okName);
    $('#fld-phone').classList.toggle('bad', !okPhone);
    if (!okName) { name.focus(); return; }
    if (!okPhone) { phone.focus(); return; }
    const L = document.body.dataset.lang;
    const lab = L === 'kz'
      ? {pipe: 'Воронка', name: 'Аты', phone: 'WhatsApp', country: 'Ел', program: 'Бағдарлама', budget: 'Бюджет', intake: 'Түсу жылы', lang: 'Тіл', page: 'Бет'}
      : {pipe: 'Воронка', name: 'Имя', phone: 'WhatsApp', country: 'Страна', program: 'Программа', budget: 'Бюджет', intake: 'Год поступления', lang: 'Язык', page: 'Страница'};
    const esc = s => String(s).replace(/[&<>"]/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c]));
    const rows = [
      [lab.pipe, L === 'kz' ? 'Сату → Жаңа өтінім' : 'Продажи → Новая заявка'],
      [lab.name, name.value.trim()], [lab.phone, phone.value.trim()],
      [lab.country, answers.country || '—'], [lab.program, answers.program || '—'], [lab.budget, answers.budget || '—'],
      [lab.intake, form.elements.intake.selectedOptions[0].textContent], [lab.lang, L.toUpperCase()],
      [lab.page, location.pathname.split('/').pop() || 'index'],
    ];
    const utm = UTM.map(k => [k, form.elements[k].value || '—']);
    $('#crmrows').innerHTML = rows.map(([k, v]) => `<div class="r"><span>${esc(k)}</span><span>${esc(v)}</span></div>`).join('')
      + utm.map(([k, v]) => `<div class="r utm"><span>${esc(k)}</span><span>${esc(v)}</span></div>`).join('');
    const waText = (L === 'kz' ? 'Сәлеметсіз бе! Way Up сайтынан өтінім: ' : 'Здравствуйте! Заявка с сайта Way Up: ')
      + [answers.country, answers.program, answers.budget, form.elements.intake.selectedOptions[0].textContent].filter(Boolean).join(', ')
      + '. ' + name.value.trim();
    $('#qwa').href = 'https://wa.me/77071449552?text=' + encodeURIComponent(waText);
    form.style.display = 'none';
    done.classList.add('on');
    $('#qn').textContent = '✓';
    $$('#qbar span').forEach(s => s.classList.add('on'));
  });

  /* плавающая кнопка WhatsApp: после первого экрана */
  const waf = $('.wafloat');
  const onWa = () => waf && waf.classList.toggle('show', scrollY > innerHeight * .6);
  addEventListener('scroll', onWa, {passive: true}); onWa();

  /* вариант дизайна в футере */
  const cur = (location.pathname.match(/([abc])\.html$/) || [])[1];
  $$('.vars a').forEach(a => a.classList.toggle('cur', a.dataset.var === cur));

  /* появление при прокрутке */
  if ('IntersectionObserver' in window && !reduce) {
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), {threshold: .08, rootMargin: '0px 0px -40px 0px'});
    $$('.rv').forEach(el => io.observe(el));
  } else $$('.rv').forEach(el => el.classList.add('in'));

  /* лёгкий параллакс фото ментора */
  const mb = $('.mentor2 .bg'), ms = $('.mentor2');
  if (mb && !reduce) addEventListener('scroll', () => {
    const r = ms.getBoundingClientRect();
    if (r.bottom > 0 && r.top < innerHeight) mb.style.transform = `translateY(${(r.top / innerHeight) * -40}px)`;
  }, {passive: true});
})();
