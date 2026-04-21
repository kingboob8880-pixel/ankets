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
    };

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
        nav.appendChild(el('button', { type: 'button', class: 'btn btn-primary', text: 'Готово', onclick: () => { state.step = 3; render(); } }));
        card.appendChild(nav);
      } else {
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

        const exportObj = {
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

        const jsonStr = JSON.stringify(exportObj, null, 2);

        card.appendChild(el('h1', { class: 'title' }, [document.createTextNode('Готово')]));
        card.appendChild(el('p', { class: 'muted', text: 'Скопируйте JSON и отправьте лекарю. Импорт: RUKYA PRO → Импорт JSON → вставить файл или буфер.' }));

        const ta = el('textarea', { class: 'json-out', readonly: 'readonly', rows: '16' });
        ta.value = jsonStr;
        card.appendChild(ta);

        const row = el('div', { class: 'nav-row' });
        row.appendChild(el('button', { type: 'button', class: 'btn btn-primary', text: 'Копировать JSON', onclick: async () => {
          try {
            await navigator.clipboard.writeText(jsonStr);
            setStatus('Скопировано в буфер');
          } catch {
            ta.select();
            setStatus('Выделите текст вручную (Ctrl+C)');
          }
        } }));
        row.appendChild(el('button', { type: 'button', class: 'btn btn-ghost', text: 'Скачать .json', onclick: () => {
          const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8' });
          const a = document.createElement('a');
          a.href = URL.createObjectURL(blob);
          a.download = `rukya-questionnaire-${externalId}.json`;
          a.click();
          URL.revokeObjectURL(a.href);
          setStatus('Файл сохранён');
        } }));
        row.appendChild(el('button', { type: 'button', class: 'btn btn-ghost', text: 'Сначала', onclick: () => {
          state.step = 0;
          state.treatment = null;
          state.patient = { fullName: '', age: '', gender: '', phone: '', city: '' };
          state.complaints = '';
          state.questionnaire = {};
          render();
        } }));
        card.appendChild(row);

        if (window.parent !== window) {
          try {
            window.parent.postMessage({ type: 'rukya_questionnaire_done', schemaVersion: SCHEMA_VERSION, treatmentId: state.treatment.id, externalId }, '*');
          } catch (_) { /* ignore */ }
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
