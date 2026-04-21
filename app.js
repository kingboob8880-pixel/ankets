/**
 * Статическая анкета для GitHub Pages.
 * Текст userMessage для DeepSeek должен совпадать с window.SHIFA_DEEPSEEK.buildDiagnosisUserMessage в js/engine/deepseek.js.
 */
(function () {
  const SCHEMA_VERSION = 1;
  const EXPORT_KIND = 'rukya_questionnaire_v1';

  function formatQuestionnaireForPrompt(questionnaire, labels) {
    if (!questionnaire || typeof questionnaire !== 'object') return '—';
    const lines = Object.entries(questionnaire)
      .filter(([, v]) => v)
      .map(([k]) => {
        const ru = labels[k];
        return ru ? `- ${k} — ${ru}` : `- ${k}`;
      });
    return lines.length ? lines.join('\n') : '—';
  }

  function buildDiagnosisUserMessage({ complaints, questionnaire, patient }, labels) {
    const qBlock = formatQuestionnaireForPrompt(questionnaire, labels);
    const age = patient && patient.age != null && patient.age !== '' ? patient.age : '—';
    const name = (patient && (patient.name || patient.fullName)) || '—';
    return `Пациент: ${name} (${(patient && patient.gender) || '—'}, ${age} лет)

Жалобы:
${complaints || '—'}

Анкета (отмеченные пункты, с расшифровкой):
${qBlock}

Инструкция: первый элемент в types — главный тип для подбора программы в приложении; поля диагноза должны быть согласованы (джинн, дом, сглаз, приоритет).

Выдай JSON-диагноз по схеме.`;
  }

  function el(tag, attrs, children) {
    const n = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach((k) => {
      if (k === 'class') n.className = attrs[k];
      else if (k === 'text') n.textContent = attrs[k];
      else if (k.startsWith('on') && typeof attrs[k] === 'function') n.addEventListener(k.slice(2).toLowerCase(), attrs[k]);
      else if (attrs[k] != null) n.setAttribute(k, attrs[k]);
    });
    (children || []).forEach((c) => { if (c) n.appendChild(typeof c === 'string' ? document.createTextNode(c) : c); });
    return n;
  }

  async function loadConfig() {
    const r = await fetch('config.json', { cache: 'no-store' });
    if (!r.ok) throw new Error('config.json: ' + r.status);
    return r.json();
  }

  function resolveKeys(treatment, cfg) {
    if (treatment.questionKeys === 'all') return cfg.allQuestionKeys.slice();
    return (treatment.questionKeys || []).filter((k) => cfg.labels[k] || cfg.allQuestionKeys.includes(k));
  }

  async function main() {
    const root = document.getElementById('app');
    const statusEl = document.getElementById('status');
    let cfg;
    try {
      cfg = await loadConfig();
    } catch (e) {
      root.innerHTML = '';
      root.appendChild(el('div', { class: 'error-box' }, [
        el('strong', { text: 'Не удалось загрузить config.json: ' }),
        document.createTextNode(e.message || String(e)),
      ]));
      return;
    }

    const state = {
      step: 0,
      treatment: null,
      patient: { fullName: '', age: '', gender: '', phone: '', city: '' },
      complaints: '',
      questionnaire: {},
      submitStatus: null,
      submitError: '',
      savedPath: '',
      _submitDispatched: false,
    };

    function buildExportPayload() {
      const keys = resolveKeys(state.treatment, cfg);
      const qObj = {};
      keys.forEach((k) => { if (state.questionnaire[k]) qObj[k] = true; });

      const patientForMsg = {
        name: state.patient.fullName,
        fullName: state.patient.fullName,
        gender: state.patient.gender || '—',
        age: state.patient.age,
      };
      const userMessage = buildDiagnosisUserMessage({
        complaints: state.complaints,
        questionnaire: qObj,
        patient: patientForMsg,
      }, cfg.labels);

      const createdAt = new Date().toISOString();
      const externalId = 'q-' + createdAt.replace(/[:.]/g, '-').slice(0, 19);

      return {
        schemaVersion: SCHEMA_VERSION,
        exportKind: EXPORT_KIND,
        treatmentId: state.treatment.id,
        treatmentLabel: state.treatment.label,
        createdAt,
        externalId,
        patient: {
          fullName: state.patient.fullName,
          gender: state.patient.gender || null,
          age: state.patient.age !== '' ? Number(state.patient.age) || state.patient.age : null,
          phone: state.patient.phone || '',
          city: state.patient.city || '',
        },
        complaints: state.complaints,
        questionnaire: qObj,
        clinicalNotes: '',
        deepseek: {
          userMessage,
          systemNote: 'Системный промпт берите из приложения RUKYA PRO (js/engine/deepseek.js), при вызове API подставьте его в role=system.',
        },
      };
    }

    async function performSubmit() {
      const endpoint = (cfg.submitEndpoint || '').trim();
      if (!endpoint) {
        state.submitStatus = 'noconfig';
        render();
        return;
      }
      try {
        const payload = buildExportPayload();
        const headers = { 'Content-Type': 'application/json' };
        const key = (cfg.submitClientKey || '').trim();
        if (key) headers['X-Submit-Key'] = key;
        const r = await fetch(endpoint, {
          method: 'POST',
          headers,
          body: JSON.stringify(payload),
          mode: 'cors',
        });
        let j = {};
        try { j = await r.json(); } catch (_) { /* ignore */ }
        if (!r.ok) throw new Error(j.error || ('HTTP ' + r.status));
        if (!j.ok) throw new Error(j.error || 'Отказ сервера');
        state.submitStatus = 'ok';
        state.savedPath = j.path || '';
        if (window.parent !== window) {
          try {
            window.parent.postMessage({
              type: 'rukya_questionnaire_done',
              schemaVersion: SCHEMA_VERSION,
              treatmentId: state.treatment.id,
              externalId: payload.externalId,
              path: state.savedPath,
            }, '*');
          } catch (_) { /* ignore */ }
        }
      } catch (e) {
        state.submitStatus = 'error';
        state.submitError = (e && e.message) ? String(e.message) : String(e);
      }
      render();
    }

    function render() {
      root.innerHTML = '';
      const card = el('div', { class: 'card' });

      if (state.step === 0) {
        card.appendChild(el('h1', { class: 'title' }, [document.createTextNode('Выберите профиль лечения')]));
        cfg.treatments.forEach((t) => {
          const row = el('button', {
            type: 'button',
            class: 'treatment-btn',
            onclick: () => { state.treatment = t; state.questionnaire = {}; state.step = 1; render(); },
          });
          row.appendChild(el('span', { class: 'treatment-label', text: t.label }));
          row.appendChild(el('span', { class: 'treatment-desc', text: t.description || '' }));
          card.appendChild(row);
        });
      } else if (state.step === 1) {
        card.appendChild(el('h1', { class: 'title' }, [document.createTextNode('Данные пациента')]));
        card.appendChild(el('p', { class: 'muted', text: state.treatment.label }));

        const grid = el('div', { class: 'form-grid' });
        [['fullName', 'ФИО', 'text', true], ['age', 'Возраст', 'number', true], ['gender', 'Пол', 'text', false], ['phone', 'Телефон', 'tel', false], ['city', 'Город', 'text', false]].forEach(([key, label, type, req]) => {
          const fg = el('div', { class: 'form-group' });
          fg.appendChild(el('label', {}, [document.createTextNode(label + (req ? ' *' : ''))]));
          const inp = el('input', {
            class: 'input', type, value: state.patient[key] || '', required: !!req,
            'data-key': key,
          });
          inp.addEventListener('input', () => { state.patient[key] = inp.value; });
          fg.appendChild(inp);
          grid.appendChild(fg);
        });
        card.appendChild(grid);

        card.appendChild(el('label', {}, [document.createTextNode('Жалобы своими словами *')]));
        const ta = el('textarea', { class: 'input', rows: '5', placeholder: 'Опишите состояние, когда началось, что мешает…' });
        ta.value = state.complaints;
        ta.addEventListener('input', () => { state.complaints = ta.value; });
        card.appendChild(ta);

        const nav = el('div', { class: 'nav-row' });
        nav.appendChild(el('button', { type: 'button', class: 'btn btn-ghost', text: '← Назад', onclick: () => { state.step = 0; render(); } }));
        nav.appendChild(el('button', { type: 'button', class: 'btn btn-primary', text: 'Далее →', onclick: () => {
          if (!String(state.patient.fullName || '').trim()) { setStatus('Укажите ФИО'); return; }
          if (state.patient.age === '' || state.patient.age == null) { setStatus('Укажите возраст'); return; }
          if (!String(state.complaints || '').trim()) { setStatus('Укажите жалобы'); return; }
          state.step = 2;
          render();
        } }));
        card.appendChild(nav);
      } else if (state.step === 2) {
        const keys = resolveKeys(state.treatment, cfg);
        keys.forEach((k) => {
          if (state.questionnaire[k] === undefined) state.questionnaire[k] = false;
        });

        card.appendChild(el('h1', { class: 'title' }, [document.createTextNode('Анкета')]));
        card.appendChild(el('p', { class: 'muted', text: 'Отметьте то, что относится к вам.' }));

        const list = el('div', { class: 'check-list' });
        keys.forEach((k) => {
          const lab = cfg.labels[k] || k;
          const row = el('label', { class: 'check-row' });
          const cb = el('input', { type: 'checkbox' });
          cb.checked = !!state.questionnaire[k];
          cb.addEventListener('change', () => { state.questionnaire[k] = cb.checked; });
          row.appendChild(cb);
          row.appendChild(el('span', { text: lab }));
          list.appendChild(row);
        });
        card.appendChild(list);

        const nav = el('div', { class: 'nav-row' });
        nav.appendChild(el('button', { type: 'button', class: 'btn btn-ghost', text: '← Назад', onclick: () => { state.step = 1; render(); } }));
        nav.appendChild(el('button', { type: 'button', class: 'btn btn-primary', text: 'Готово', onclick: () => {
          state.step = 3;
          state.submitStatus = 'loading';
          state.submitError = '';
          state.savedPath = '';
          state._submitDispatched = false;
          render();
        } }));
        card.appendChild(nav);
      } else if (state.step === 3) {
        const resetForm = () => {
          state.step = 0;
          state.treatment = null;
          state.patient = { fullName: '', age: '', gender: '', phone: '', city: '' };
          state.complaints = '';
          state.questionnaire = {};
          state.submitStatus = null;
          state.submitError = '';
          state.savedPath = '';
          state._submitDispatched = false;
          render();
        };

        if (state.submitStatus === 'loading') {
          card.appendChild(el('h1', { class: 'title', text: 'Отправка данных' }));
          card.appendChild(el('p', { class: 'muted', text: 'Пожалуйста, подождите. Окно можно закрыть после появления сообщения об успехе.' }));
          if (!state._submitDispatched) {
            state._submitDispatched = true;
            Promise.resolve().then(() => performSubmit());
          }
        } else if (state.submitStatus === 'ok') {
          card.appendChild(el('h1', { class: 'title', text: 'Спасибо' }));
          card.appendChild(el('p', { class: 'muted', text: 'Ваши ответы переданы. Лекарь получит их через систему. Если нужно что-то уточнить, свяжитесь с клиникой отдельно.' }));
          const row = el('div', { class: 'nav-row' });
          row.appendChild(el('button', { type: 'button', class: 'btn btn-primary', text: 'Заполнить заново', onclick: resetForm }));
          card.appendChild(row);
        } else if (state.submitStatus === 'noconfig') {
          card.appendChild(el('h1', { class: 'title', text: 'Отправка недоступна' }));
          card.appendChild(el('p', { class: 'muted', text: 'Адрес сервера не настроен в config.json (submitEndpoint). Обратитесь к лекарю другим способом.' }));
          const row = el('div', { class: 'nav-row' });
          row.appendChild(el('button', { type: 'button', class: 'btn btn-ghost', text: 'Назад', onclick: () => { state.step = 2; state.submitStatus = null; render(); } }));
          row.appendChild(el('button', { type: 'button', class: 'btn btn-primary', text: 'Сначала', onclick: resetForm }));
          card.appendChild(row);
        } else {
          card.appendChild(el('h1', { class: 'title', text: 'Не удалось отправить' }));
          card.appendChild(el('p', { class: 'muted', text: state.submitError || 'Попробуйте позже или свяжитесь с клиникой.' }));
          const row = el('div', { class: 'nav-row' });
          row.appendChild(el('button', { type: 'button', class: 'btn btn-primary', text: 'Повторить', onclick: () => {
            state.submitStatus = 'loading';
            state._submitDispatched = false;
            render();
          } }));
          row.appendChild(el('button', { type: 'button', class: 'btn btn-ghost', text: 'Назад', onclick: () => { state.step = 2; state.submitStatus = null; render(); } }));
          card.appendChild(row);
        }
      }

      root.appendChild(card);
    }

    function setStatus(msg) {
      if (statusEl) { statusEl.textContent = msg || ''; statusEl.style.display = msg ? 'block' : 'none'; }
    }

    render();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', main);
  else main();
})();
