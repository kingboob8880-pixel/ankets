/**
 * Анкета для GitHub Pages — длинная форма (11 разделов).
 * Экспорт: schemaVersion 2, sections + rukya_questionnaire_v1.
 */
(function () {
  const EXPORT_KIND = 'rukya_questionnaire_v1';
  const SCHEMA_VERSION = 2;

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

  /** Пустой объект ответов по surveySections */
  function emptyAnswers(sections) {
    const out = {};
    sections.forEach((sec) => {
      out[sec.id] = {};
      (sec.fields || []).forEach((f) => { out[sec.id][f.key] = ''; });
    });
    return out;
  }

  /** Текст всех разделов для промпта и импорта */
  function formatSectionsHuman(cfg, answers) {
    const lines = [];
    (cfg.surveySections || []).forEach((sec) => {
      lines.push('');
      lines.push('— ' + sec.title + ' —');
      (sec.fields || []).forEach((f) => {
        const v = (answers[sec.id] && answers[sec.id][f.key]) ? String(answers[sec.id][f.key]).trim() : '';
        if (v) lines.push(f.label + '\n' + v);
      });
    });
    return lines.join('\n').trim();
  }

  function buildUserMessage(patient, sectionsBlock) {
    const name = patient.fullName || '—';
    const g = patient.gender || '—';
    const age = patient.age != null && patient.age !== '' ? patient.age : '—';
    return `Пациент: ${name} (${g}, ${age} лет)

Жалобы и описание (анкета, полный текст по разделам):
${sectionsBlock || '—'}

Инструкция: первый элемент в types — главный тип для подбора программы в приложении; поля диагноза должны быть согласованы (джинн, дом, сглаз, приоритет).

Выдай JSON-диагноз по схеме.`;
  }

  function getS1(answers) {
    return answers.s1 || {};
  }

  function buildExport(cfg, answers, meta) {
    const s1 = getS1(answers);
    const fullHuman = formatSectionsHuman(cfg, answers);
    const s2 = answers.s2 || {};
    const complaintsShort = [s2.current_state, s2.daily_impact].filter(Boolean).map((x) => String(x).trim()).join('\n\n') || fullHuman.slice(0, 2000);

    const patient = {
      fullName: String(s1.fullName || '').trim(),
      gender: String(s1.gender || '').trim() || null,
      age: s1.age !== '' && s1.age != null ? (Number(s1.age) || s1.age) : null,
      phone: String(s1.phone || '').trim(),
      city: String(s1.city || '').trim(),
    };

    const referral = String(s1.referral || '').trim();
    const clinicalNotes = [referral ? 'Источник обращения: ' + referral : '', 'Схема анкеты: schema v' + SCHEMA_VERSION + ', ' + (cfg.surveyId || 'longform')].filter(Boolean).join('\n');

    const sectionsOut = {};
    (cfg.surveySections || []).forEach((sec) => {
      sectionsOut[sec.id] = { ...(answers[sec.id] || {}) };
    });

    const userMessage = buildUserMessage({ ...patient, gender: patient.gender || '—' }, fullHuman);

    return {
      schemaVersion: SCHEMA_VERSION,
      exportKind: EXPORT_KIND,
      surveyId: cfg.surveyId || 'patient_longform_2026',
      treatmentId: null,
      treatmentLabel: null,
      createdAt: meta.createdAt,
      externalId: meta.externalId,
      patient,
      referral: referral || null,
      sections: sectionsOut,
      complaints: complaintsShort,
      questionnaire: {},
      clinicalNotes,
      deepseek: {
        userMessage,
        systemNote: 'Системный промпт берите из приложения RUKYA PRO (js/engine/deepseek.js), при вызове API подставьте его в role=system.',
      },
    };
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

    if (!cfg.surveySections || !cfg.surveySections.length) {
      root.innerHTML = '<div class="error-box">В config.json нет surveySections.</div>';
      return;
    }

    const totalSteps = cfg.surveySections.length + 1;
    const state = {
      step: 0,
      answers: emptyAnswers(cfg.surveySections),
    };

    function validateMinimal() {
      const s1 = getS1(state.answers);
      if (!String(s1.fullName || '').trim()) return 'Укажите ФИО в разделе 1.';
      const s2 = state.answers.s2 || {};
      if (!String(s2.current_state || '').trim()) return 'Заполните описание текущего состояния (раздел 2).';
      return null;
    }

    function render() {
      root.innerHTML = '';
      const card = el('div', { class: 'card' });
      const isFinal = state.step >= cfg.surveySections.length;

      if (isFinal) {
        const err = validateMinimal();
        if (err) {
          card.appendChild(el('h1', { class: 'title', text: 'Проверка' }));
          card.appendChild(el('p', { class: 'muted', text: err }));
          card.appendChild(el('button', {
            type: 'button',
            class: 'btn btn-primary',
            text: '← Исправить',
            onclick: () => { state.step = 0; render(); },
          }));
          root.appendChild(card);
          return;
        }

        const createdAt = new Date().toISOString();
        const externalId = 'q-' + createdAt.replace(/[:.]/g, '-').slice(0, 19);
        const exportObj = buildExport(cfg, state.answers, { createdAt, externalId });
        const jsonStr = JSON.stringify(exportObj, null, 2);

        card.appendChild(el('h1', { class: 'title' }, [document.createTextNode('Готово')]));
        card.appendChild(el('p', { class: 'muted', text: 'Скопируйте JSON и передайте лекарю. Импорт: RUKYA PRO → Импорт JSON.' }));

        const ta = el('textarea', { class: 'json-out', readonly: 'readonly', rows: '18' });
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
          state.answers = emptyAnswers(cfg.surveySections);
          render();
        } }));
        card.appendChild(row);

        if (window.parent !== window) {
          try {
            window.parent.postMessage({
              type: 'rukya_questionnaire_done',
              schemaVersion: SCHEMA_VERSION,
              externalId,
            }, '*');
          } catch (_) { /* ignore */ }
        }
        root.appendChild(card);
        return;
      }

      const sec = cfg.surveySections[state.step];
      const stepNum = state.step + 1;
      card.appendChild(el('div', { class: 'muted', style: 'font-size:.85rem;margin-bottom:8px', text: `Шаг ${stepNum} из ${cfg.surveySections.length}` }));
      card.appendChild(el('h1', { class: 'title', text: sec.title }));

      (sec.fields || []).forEach((f) => {
        card.appendChild(el('label', { class: 'field-label', text: f.label }));
        const rows = Math.max(2, Number(f.rows) || 3);
        const ta = el('textarea', {
          class: 'input',
          rows: String(rows),
          placeholder: 'Ваш ответ…',
        });
        ta.value = (state.answers[sec.id] && state.answers[sec.id][f.key]) || '';
        ta.addEventListener('input', () => {
          if (!state.answers[sec.id]) state.answers[sec.id] = {};
          state.answers[sec.id][f.key] = ta.value;
        });
        card.appendChild(ta);
      });

      const nav = el('div', { class: 'nav-row' });
      if (state.step > 0) {
        nav.appendChild(el('button', { type: 'button', class: 'btn btn-ghost', text: '← Назад', onclick: () => { state.step--; render(); } }));
      }
      nav.appendChild(el('button', {
        type: 'button',
        class: 'btn btn-primary',
        text: state.step < cfg.surveySections.length - 1 ? 'Далее →' : 'К итогу →',
        onclick: () => {
          if (state.step < cfg.surveySections.length - 1) state.step++;
          else state.step++;
          render();
        },
      }));
      card.appendChild(nav);

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
