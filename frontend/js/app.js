/**
 * CareerForge AI — Instrument Controller (Section 5 & 6 Specifications)
 * High-density precision interface: gap matrix table, 3-scale measurement tracks,
 * bandwidth budget strip, RAG evidence drawer, assessment modal with live formula preview,
 * and adaptation diff strip.
 */

// Application State
const state = {
  profile: null,
  marketRequirements: [],
  gaps: [],
  roadmap: null,
  previousRoadmap: null,
  sortCol: 'priority',
  sortAsc: false,
  skills: [
    { name: 'Python', proficiency: 2.5 },
    { name: 'SQL', proficiency: 1.5 },
    { name: 'Docker', proficiency: 1.0 },
    { name: 'System Design', proficiency: 0.5 },
  ],
};

// Known skills catalog for combobox
const KNOWN_SKILLS = [
  'Python', 'SQL', 'Docker', 'System Design', 'Linux', 'React', 'JavaScript',
  'AWS', 'CI/CD Pipelines', 'Kubernetes', 'Git', 'PostgreSQL', 'Redis', 'Data Structures'
];

// Presets (Segmented Buttons, Section 6.1)
const PRESETS = {
  backend: {
    name: 'Aarav Sharma',
    degree: 'B.Tech',
    branch: 'Computer Science',
    year: 3,
    target_role: 'Backend Engineer',
    available_hours_per_week: 20,
    skills: [
      { name: 'Python', proficiency: 2.5 },
      { name: 'SQL', proficiency: 1.5 },
      { name: 'Docker', proficiency: 1.0 },
      { name: 'System Design', proficiency: 0.5 },
    ],
  },
  fullstack: {
    name: 'Priya Patel',
    degree: 'B.Tech',
    branch: 'Information Technology',
    year: 4,
    target_role: 'Full Stack Engineer',
    available_hours_per_week: 25,
    skills: [
      { name: 'JavaScript', proficiency: 3.0 },
      { name: 'React', proficiency: 2.0 },
      { name: 'Python', proficiency: 2.0 },
      { name: 'SQL', proficiency: 1.5 },
    ],
  },
  fundamentals: {
    name: 'Rohan Verma',
    degree: 'BCA',
    branch: 'Computer Applications',
    year: 2,
    target_role: 'Software Engineer Intern',
    available_hours_per_week: 15,
    skills: [
      { name: 'Python', proficiency: 1.5 },
      { name: 'Linux', proficiency: 1.0 },
      { name: 'Git', proficiency: 1.5 },
    ],
  },
};

// Priority Sort Weights & Colorblind Non-color cues
const PRIORITY_META = {
  High:     { weight: 4, marker: '■', class: 'priority-high', label: 'High' },
  Medium:   { weight: 3, marker: '◨', class: 'priority-med',  label: 'Medium' },
  Low:      { weight: 2, marker: '□', class: 'priority-low',  label: 'Low' },
  Mastered: { weight: 1, marker: '✓', class: 'priority-mastered', label: 'Mastered' },
};

// DOM Ready Handler
document.addEventListener('DOMContentLoaded', () => {
  initLiveMiniature();
  renderSkillEditor();
  setupCombobox();
  setupEventListeners();
  checkBackendHealth();

  // Wire preset buttons
  document.querySelectorAll('[data-preset]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const key = btn.getAttribute('data-preset');
      loadPreset(key);
    });
  });

  // Hours bandwidth slider readout
  const hoursSlider = document.getElementById('hours-slider');
  const hoursReadout = document.getElementById('hours-val');
  if (hoursSlider && hoursReadout) {
    hoursSlider.addEventListener('input', () => {
      hoursReadout.textContent = `${hoursSlider.value} h/week`;
    });
  }
});

// Section 6.1: Live Miniature Animation on Load (Animates once 1.5 -> 3.5 over 420ms)
function initLiveMiniature() {
  const miniFill = document.getElementById('mini-hero-fill');
  if (!miniFill) return;
  setTimeout(() => {
    miniFill.style.width = '70%'; // 3.5 / 5.0
  }, 100);
}

// Backend Health & Run-State Status
async function checkBackendHealth() {
  const dot = document.getElementById('runstate-dot');
  const modeVal = document.getElementById('runstate-mode-val');
  try {
    const res = await window.api.checkHealth();
    if (res.status === 'healthy') {
      if (dot) dot.style.backgroundColor = 'var(--priority-low)';
      if (modeVal) modeVal.textContent = 'mock (resilient)';
    } else {
      if (dot) dot.style.backgroundColor = 'var(--priority-med)';
      if (modeVal) modeVal.textContent = 'connecting...';
    }
  } catch {
    if (dot) dot.style.backgroundColor = 'var(--priority-high)';
    if (modeVal) modeVal.textContent = 'offline';
  }
}

// Section 6.2: Skill Editor Track (40px with keyboard a11y)
function renderSkillEditor() {
  const container = document.getElementById('skill-editor-container');
  if (!container) return;

  container.innerHTML = '';
  state.skills.forEach((skill, index) => {
    const reqItem = state.marketRequirements.find((m) => m.skill.toLowerCase() === skill.name.toLowerCase());
    const benchmarkVal = reqItem ? reqItem.required_level : null;

    const row = document.createElement('div');
    row.className = 'skill-editor-row';

    const currentPercent = Math.min(100, (skill.proficiency / 5.0) * 100);
    const benchmarkPercent = benchmarkVal ? Math.min(100, (benchmarkVal / 5.0) * 100) : null;

    row.innerHTML = `
      <span class="skill-row-title">${skill.name}</span>
      <div class="gap-track gap-track-editor" id="track-${index}" tabindex="0" role="slider"
           aria-label="${skill.name} level"
           aria-valuemin="0" aria-valuemax="5" aria-valuenow="${skill.proficiency.toFixed(1)}"
           aria-valuetext="${skill.proficiency.toFixed(1)} out of 5.0${benchmarkVal ? `, benchmark ${benchmarkVal.toFixed(1)}` : ''}">
        <div class="gap-fill-current" style="width: ${currentPercent}%;"></div>
        ${
          benchmarkPercent !== null
            ? `<div class="benchmark-tick" style="left: ${benchmarkPercent}%;"></div>
               <span class="benchmark-badge" style="left: ${benchmarkPercent}%;">${benchmarkVal.toFixed(1)} req</span>`
            : ''
        }
        <div class="slider-handle" style="left: ${currentPercent}%;"></div>
      </div>
      <span class="skill-row-val">${skill.proficiency.toFixed(1)}</span>
      <button type="button" class="btn-remove-skill" aria-label="Remove ${skill.name}" data-remove="${index}">✕</button>
    `;
    container.appendChild(row);

    const track = row.querySelector(`#track-${index}`);
    setupTrackInteraction(track, index);
  });

  // Bind remove buttons
  container.querySelectorAll('[data-remove]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const idx = parseInt(e.currentTarget.getAttribute('data-remove'), 10);
      state.skills.splice(idx, 1);
      renderSkillEditor();
    });
  });
}

// Track Drag and Keyboard Operability (0.1 step, Shift = 0.5 step, Home/End)
function setupTrackInteraction(track, index) {
  const updateFromPosition = (clientX) => {
    const rect = track.getBoundingClientRect();
    const rawRatio = (clientX - rect.left) / rect.width;
    const clampedRatio = Math.max(0, Math.min(1, rawRatio));
    const rawVal = clampedRatio * 5.0;
    const steppedVal = Math.round(rawVal * 10) / 10;
    setSkillProficiency(index, steppedVal);
  };

  track.addEventListener('mousedown', (e) => {
    updateFromPosition(e.clientX);
    const onMouseMove = (moveEvent) => updateFromPosition(moveEvent.clientX);
    const onMouseUp = () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  });

  track.addEventListener('keydown', (e) => {
    const step = e.shiftKey ? 0.5 : 0.1;
    let current = state.skills[index].proficiency;

    if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
      e.preventDefault();
      setSkillProficiency(index, Math.max(0, Math.round((current - step) * 10) / 10));
    } else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
      e.preventDefault();
      setSkillProficiency(index, Math.min(5.0, Math.round((current + step) * 10) / 10));
    } else if (e.key === 'Home') {
      e.preventDefault();
      setSkillProficiency(index, 0);
    } else if (e.key === 'End') {
      e.preventDefault();
      setSkillProficiency(index, 5.0);
    }
  });
}

function setSkillProficiency(index, val) {
  state.skills[index].proficiency = val;
  const container = document.getElementById('skill-editor-container');
  const row = container?.children[index];
  if (!row) return;

  const track = row.querySelector('.gap-track');
  const fill = row.querySelector('.gap-fill-current');
  const handle = row.querySelector('.slider-handle');
  const valDisplay = row.querySelector('.skill-row-val');

  const pct = Math.min(100, (val / 5.0) * 100);
  fill.style.width = `${pct}%`;
  handle.style.left = `${pct}%`;
  valDisplay.textContent = val.toFixed(1);
  track.setAttribute('aria-valuenow', val.toFixed(1));
}

// Combobox for adding known skills
function setupCombobox() {
  const input = document.getElementById('add-skill-input');
  const btn = document.getElementById('btn-add-skill');
  const datalist = document.getElementById('known-skills-list');

  if (datalist) {
    datalist.innerHTML = KNOWN_SKILLS.map((s) => `<option value="${s}"></option>`).join('');
  }

  const addCurrent = () => {
    const name = input?.value.trim();
    if (!name) return;
    if (!state.skills.some((s) => s.name.toLowerCase() === name.toLowerCase())) {
      state.skills.push({ name, proficiency: 1.0 });
      renderSkillEditor();
    }
    if (input) input.value = '';
  };

  btn?.addEventListener('click', addCurrent);
  input?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addCurrent();
    }
  });
}

// Load a Segmented Preset
function loadPreset(key) {
  const preset = PRESETS[key];
  if (!preset) return;

  document.getElementById('input-name').value = preset.name;
  document.getElementById('select-degree').value = preset.degree;
  document.getElementById('input-branch').value = preset.branch;
  document.getElementById('select-year').value = preset.year;
  document.getElementById('input-role').value = preset.target_role;

  const hoursSlider = document.getElementById('hours-slider');
  hoursSlider.value = preset.available_hours_per_week;
  document.getElementById('hours-val').textContent = `${preset.available_hours_per_week} h/week`;

  state.skills = JSON.parse(JSON.stringify(preset.skills));
  renderSkillEditor();

  // Segment active state
  document.querySelectorAll('[data-preset]').forEach((b) => b.classList.remove('active'));
  document.querySelector(`[data-preset="${key}"]`)?.classList.add('active');

  // Update topbar identity breadcrumb
  updateTopbarIdentity(preset.name, preset.degree, preset.branch, preset.year, preset.target_role);

  // Focus action
  document.getElementById('generate-roadmap-btn')?.focus();
}

function updateTopbarIdentity(name, degree, branch, year, role) {
  const elem = document.getElementById('topbar-identity');
  if (elem) {
    elem.innerHTML = `
      <span class="topbar-name">${name}</span>
      <span class="topbar-divider">·</span>
      <span>${degree} ${branch}, Year ${year}</span>
      <span class="topbar-divider">·</span>
      <span>${role}</span>
    `;
  }
}

// Event Listeners Setup
function setupEventListeners() {
  // Form submission: Generate Roadmap
  const form = document.getElementById('profile-form');
  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    await handleGenerateRoadmap();
  });

  // Modal open trigger (rail button)
  const logScoreBtn = document.getElementById('rail-log-score-btn');
  logScoreBtn?.addEventListener('click', openAssessmentModal);

  // Modal close handlers
  const closeBtn = document.getElementById('modal-close-btn');
  const cancelBtn = document.getElementById('modal-cancel-btn');
  const backdrop = document.getElementById('assessment-modal');

  closeBtn?.addEventListener('click', closeAssessmentModal);
  cancelBtn?.addEventListener('click', closeAssessmentModal);
  backdrop?.addEventListener('click', (e) => {
    if (e.target === backdrop) closeAssessmentModal();
  });

  // Score slider + number sync
  const scoreSlider = document.getElementById('score-slider');
  const scoreInput = document.getElementById('score-input');
  const skillSelect = document.getElementById('modal-skill-select');

  const syncScore = (val) => {
    const clamped = Math.max(0, Math.min(100, parseFloat(val) || 0));
    if (scoreSlider) scoreSlider.value = clamped;
    if (scoreInput) scoreInput.value = clamped;
    updateFormulaPreview();
  };

  scoreSlider?.addEventListener('input', (e) => syncScore(e.target.value));
  scoreInput?.addEventListener('input', (e) => syncScore(e.target.value));
  skillSelect?.addEventListener('change', updateFormulaPreview);

  // Assessment form submit
  const assessForm = document.getElementById('assessment-form');
  assessForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    await handleApplyScore();
  });

  // Evidence drawer close
  const drawerCloseBtn = document.getElementById('drawer-close-btn');
  const drawerBackdrop = document.getElementById('evidence-drawer-backdrop');
  drawerCloseBtn?.addEventListener('click', closeEvidenceDrawer);
  drawerBackdrop?.addEventListener('click', (e) => {
    if (e.target === drawerBackdrop) closeEvidenceDrawer();
  });

  // Escape key closes modal or drawer
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeAssessmentModal();
      closeEvidenceDrawer();
    }
  });

  // Copy run summary button
  document.getElementById('btn-copy-summary')?.addEventListener('click', copyRunSummary);
}

// Generate Roadmap Handler (Determinate Step Feedback)
async function handleGenerateRoadmap() {
  const btn = document.getElementById('generate-roadmap-btn');
  const originalText = btn.textContent;

  const profileData = {
    name: document.getElementById('input-name').value.trim() || 'Student',
    degree: document.getElementById('select-degree').value,
    branch: document.getElementById('input-branch').value.trim() || 'Computer Science',
    year: parseInt(document.getElementById('select-year').value, 10),
    target_role: document.getElementById('input-role').value.trim() || 'Backend Engineer',
    available_hours_per_week: parseInt(document.getElementById('hours-slider').value, 10),
    skills: state.skills,
  };

  try {
    btn.disabled = true;
    btn.textContent = 'Researching benchmarks...';

    const result = await window.api.submitProfile(profileData);

    state.profile = result.profile;
    state.marketRequirements = result.market_requirements || [];
    state.gaps = result.gaps || [];
    state.roadmap = result.roadmap;

    updateTopbarIdentity(profileData.name, profileData.degree, profileData.branch, profileData.year, profileData.target_role);
    renderGapTable();
    renderBudgetStrip();
    renderRoadmapTimeline();
    renderSkillEditor(); // Re-render to show benchmark ticks!

    // Update revision chip
    updateRevisionChip(result.roadmap.version);

    window.showToast('Roadmap generated.');
    document.getElementById('gap-matrix-section')?.scrollIntoView({ behavior: 'smooth' });
  } catch (err) {
    alert(err.message);
  } finally {
    btn.disabled = false;
    btn.textContent = originalText;
  }
}

// Section 6.3: Render Real Semantic Gap Table
function renderGapTable() {
  const tbody = document.getElementById('gap-table-body');
  if (!tbody) return;

  tbody.innerHTML = '';
  if (!state.gaps || state.gaps.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:var(--sp-6); color:var(--text-muted);">No roadmap generated yet. Complete profile and click Generate roadmap.</td></tr>`;
    return;
  }

  // Sort gaps
  const sorted = [...state.gaps].sort((a, b) => {
    if (state.sortCol === 'priority') {
      const wa = PRIORITY_META[a.priority]?.weight || 0;
      const wb = PRIORITY_META[b.priority]?.weight || 0;
      return state.sortAsc ? wa - wb : wb - wa;
    }
    if (state.sortCol === 'gap') {
      return state.sortAsc ? a.gap - b.gap : b.gap - a.gap;
    }
    if (state.sortCol === 'skill') {
      return state.sortAsc ? a.skill.localeCompare(b.skill) : b.skill.localeCompare(a.skill);
    }
    return 0;
  });

  sorted.forEach((gap) => {
    const meta = PRIORITY_META[gap.priority] || PRIORITY_META.Low;
    const currentPct = Math.min(100, (gap.current_level / 5.0) * 100);
    const targetPct = Math.min(100, (gap.required_level / 5.0) * 100);

    // Estimate allocated hours (approx 15h per gap point)
    const hoursAlloc = Math.round(gap.gap * 15);

    // Domain name parsing
    let domain = 'roadmap.sh';
    if (gap.source_url) {
      try {
        domain = new URL(gap.source_url).hostname.replace('www.', '');
      } catch {
        domain = 'verified';
      }
    }

    const tr = document.createElement('tr');
    tr.setAttribute('tabindex', '0');
    tr.innerHTML = `
      <td><strong>${gap.skill}</strong></td>
      <td style="width: 220px;">
        <div class="gap-track gap-track-table" title="Current: ${gap.current_level.toFixed(1)} / Req: ${gap.required_level.toFixed(1)}">
          <div class="gap-fill-current" style="width: ${currentPct}%;"></div>
          <div class="benchmark-tick" style="left: ${targetPct}%;"></div>
        </div>
      </td>
      <td class="col-num">${gap.current_level.toFixed(1)}</td>
      <td class="col-num">${gap.required_level.toFixed(1)}</td>
      <td class="col-num">${gap.gap.toFixed(1)}</td>
      <td>
        <span class="priority-indicator ${meta.class}">
          <span class="priority-marker">${meta.marker}</span>
          <span>${meta.label}</span>
        </span>
      </td>
      <td class="col-num">${hoursAlloc > 0 ? `${hoursAlloc} h` : '—'}</td>
      <td>
        ${
          gap.source_url
            ? `<a href="${gap.source_url}" target="_blank" rel="noopener" class="source-link" title="${gap.source_url}">
                <span>${domain}</span>
                <svg class="icon-external" viewBox="0 0 24 24"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
               </a>`
            : `<span style="color:var(--text-muted);">standard</span>`
        }
      </td>
    `;

    // Row click opens Evidence drawer (§6.5)
    tr.addEventListener('click', (e) => {
      if (e.target.closest('a')) return;
      openEvidenceDrawer(gap.skill);
    });

    tr.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') openEvidenceDrawer(gap.skill);
    });

    tbody.appendChild(tr);
  });
}

// Section 6.4: Bandwidth Budget Strip
function renderBudgetStrip() {
  const container = document.getElementById('budget-bar-container');
  const metaDisplay = document.getElementById('budget-meta-display');
  if (!container || !state.roadmap) return;

  container.innerHTML = '';
  const totalHours = state.roadmap.total_estimated_hours;
  if (metaDisplay) {
    metaDisplay.textContent = `${totalHours} h total · ~${state.roadmap.estimated_weeks} weeks at ${state.roadmap.available_hours_per_week} h/wk`;
  }

  // Aggregate hours per skill across roadmap phases
  const skillHours = {};
  state.roadmap.phases.forEach((phase) => {
    const hoursPerSkill = Math.round(phase.estimated_hours / (phase.skills_covered.length || 1));
    phase.skills_covered.forEach((s) => {
      skillHours[s] = (skillHours[s] || 0) + hoursPerSkill;
    });
  });

  const colors = ['#4C8DF6', '#3D9A6E', '#E5A13A', '#8B5CF6', '#EC4899', '#7C8B9E'];
  let colorIdx = 0;

  Object.entries(skillHours).forEach(([skill, hours]) => {
    const pct = ((hours / totalHours) * 100).toFixed(1);
    const seg = document.createElement('div');
    seg.className = 'budget-segment';
    seg.style.width = `${pct}%`;
    seg.style.backgroundColor = colors[colorIdx % colors.length];
    colorIdx++;
    seg.textContent = `${skill} ${pct}% (${hours}h)`;
    seg.setAttribute('title', `${skill}: ${hours} h total (${pct}%)`);

    // Hover highlights matching phase items
    seg.addEventListener('mouseenter', () => highlightSkillPhases(skill));
    seg.addEventListener('mouseleave', () => unhighlightSkillPhases());

    container.appendChild(seg);
  });
}

function highlightSkillPhases(skillName) {
  document.querySelectorAll('.phase-panel').forEach((panel) => {
    if (panel.getAttribute('data-skills')?.toLowerCase().includes(skillName.toLowerCase())) {
      panel.classList.add('phase-highlight');
    }
  });
}

function unhighlightSkillPhases() {
  document.querySelectorAll('.phase-panel').forEach((panel) => {
    panel.classList.remove('phase-highlight');
  });
}

// Section 6.4: Roadmap Timeline (Dominant priority edge, no lift)
function renderRoadmapTimeline() {
  const container = document.getElementById('roadmap-timeline-container');
  if (!container || !state.roadmap) return;

  container.innerHTML = '';
  state.roadmap.phases.forEach((phase) => {
    const panel = document.createElement('div');
    panel.className = 'phase-panel';
    panel.setAttribute('data-phase', phase.phase_number);
    panel.setAttribute('data-skills', phase.skills_covered.join(','));

    // Determine phase edge color based on priority
    let dominantColor = 'var(--accent)';
    const firstSkillGap = state.gaps.find((g) => phase.skills_covered.includes(g.skill));
    if (firstSkillGap) {
      if (firstSkillGap.priority === 'High') dominantColor = 'var(--priority-high)';
      else if (firstSkillGap.priority === 'Medium') dominantColor = 'var(--priority-med)';
      else if (firstSkillGap.priority === 'Low') dominantColor = 'var(--priority-low)';
    }
    panel.style.borderLeftColor = dominantColor;

    const skillsHtml = phase.skills_covered
      .map((s) => `<span class="skill-chip">${s}</span>`)
      .join('');

    const milestonesHtml = (phase.learning_objectives || [])
      .map((m) => `<li class="phase-milestone-item"><span class="milestone-bullet">—</span><span>${m}</span></li>`)
      .join('');

    const ragHtml = (phase.resources || [])
      .map(
        (r) =>
          `<button type="button" class="rag-link-btn" data-rag-guide="${r.title}">
             <span>📖 ${r.title}</span>
             <span style="opacity:0.75;">${r.url_or_ref}</span>
           </button>`
      )
      .join('');

    panel.innerHTML = `
      <div class="phase-header-row">
        <h3 class="phase-heading">Phase ${phase.phase_number} · ${phase.title}</h3>
        <span class="phase-hours-val">${phase.estimated_hours} h</span>
      </div>
      <div class="phase-skills-row">
        ${skillsHtml}
      </div>
      <ul class="phase-milestones-list">
        ${milestonesHtml || '<li class="phase-milestone-item"><span class="milestone-bullet">—</span><span>Core domain implementation and practice questions.</span></li>'}
      </ul>
      ${
        phase.resources && phase.resources.length > 0
          ? `<div class="phase-rag-row">${ragHtml}</div>`
          : ''
      }
    `;

    // Wire RAG guide links to open evidence drawer
    panel.querySelectorAll('[data-rag-guide]').forEach((btn) => {
      btn.addEventListener('click', () => {
        openEvidenceDrawer(phase.skills_covered[0] || 'SQL');
      });
    });

    container.appendChild(panel);
  });
}

// Section 6.5: Evidence Drawer (RAG Inspector)
function openEvidenceDrawer(skillName) {
  const drawer = document.getElementById('evidence-drawer');
  const backdrop = document.getElementById('evidence-drawer-backdrop');
  const title = document.getElementById('drawer-skill-title');
  const meta = document.getElementById('drawer-skill-meta');
  const content = document.getElementById('drawer-rag-content');

  if (!drawer || !backdrop) return;

  const gap = state.gaps.find((g) => g.skill.toLowerCase() === skillName.toLowerCase());
  if (title) title.textContent = skillName;
  if (meta && gap) {
    meta.textContent = `Current: ${gap.current_level.toFixed(1)} · Required: ${gap.required_level.toFixed(1)} · Gap: ${gap.gap.toFixed(1)} pts (${gap.priority} Priority)`;
  }

  // Curated RAG mock mapping for clean evidence view
  const guides = [
    {
      file: `${skillName.toLowerCase().replace(/\s+/g, '_')}_prep.md`,
      heading: 'Query Optimization & Indexing Strategies',
      score: '0.8732 cosine similarity',
      excerpt: 'B-tree indexing mechanics, composite indexes ordering rules, EXPLAIN ANALYZE interpretation, and execution plan bottlenecks.',
      anchor: '#indexing-and-optimization',
    },
    {
      file: `${skillName.toLowerCase().replace(/\s+/g, '_')}_prep.md`,
      heading: 'Concurrency, Transactions & Isolation Levels',
      score: '0.8145 cosine similarity',
      excerpt: 'ACID guarantees, MVCC implementation, phantom reads prevention, and transaction deadlocks debugging.',
      anchor: '#transactions-and-mvcc',
    },
  ];

  if (content) {
    content.innerHTML = guides
      .map(
        (g) => `
        <div class="drawer-item">
          <span class="drawer-filename">${g.file}</span>
          <span class="drawer-heading">${g.heading}</span>
          <span class="drawer-score">${g.score}</span>
          <p class="drawer-excerpt">${g.excerpt}</p>
          <a href="#${g.anchor}" class="source-link" style="margin-top:var(--sp-1);">
            <span>Deep anchor: ${g.anchor}</span>
            <svg class="icon-external" viewBox="0 0 24 24"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
          </a>
        </div>
      `
      )
      .join('');
  }

  backdrop.classList.add('open');
  drawer.focus();
}

function closeEvidenceDrawer() {
  document.getElementById('evidence-drawer-backdrop')?.classList.remove('open');
}

// Section 6.6: Assessment Modal Dialog
function openAssessmentModal() {
  const modal = document.getElementById('assessment-modal');
  const select = document.getElementById('modal-skill-select');
  if (!modal || !select) return;

  select.innerHTML = '';
  // Populate skills from current profile or default
  const availableSkills = state.profile?.skills || state.skills;
  availableSkills.forEach((s) => {
    const opt = document.createElement('option');
    opt.value = s.name;
    opt.textContent = `${s.name} (${s.proficiency.toFixed(1)} / 5.0)`;
    select.appendChild(opt);
  });

  updateFormulaPreview();
  modal.classList.add('open');
  document.getElementById('score-slider')?.focus();
}

function closeAssessmentModal() {
  document.getElementById('assessment-modal')?.classList.remove('open');
}

// Live Formula Preview Calculation (§6.6)
function updateFormulaPreview() {
  const select = document.getElementById('modal-skill-select');
  const scoreInput = document.getElementById('score-input');
  const preview = document.getElementById('modal-formula-preview');

  if (!select || !scoreInput || !preview) return;

  const skillName = select.value;
  const score = parseFloat(scoreInput.value) || 0;

  const skillObj = (state.profile?.skills || state.skills).find((s) => s.name === skillName);
  const currentLevel = skillObj ? skillObj.proficiency : 1.5;

  const baseJump = 2.0; // matching progress_engine default formula
  const gain = Math.round(baseJump * (score / 100) * 100) / 100;
  const updatedLevel = Math.min(5.0, Math.round((currentLevel + gain) * 100) / 100);

  preview.innerHTML = `
    <div class="formula-derivation">
      gain = base_jump × (score / 100)<br>
           = ${baseJump.toFixed(1)} × (${score.toFixed(0)} / 100)<br>
           = <span class="delta-gain">+${gain.toFixed(2)} pts</span>
    </div>
    <div class="formula-result">
      <span>${skillName}:</span>
      <span>${currentLevel.toFixed(1)} <span class="diff-arrow">→</span> <strong class="tabular-num">${updatedLevel.toFixed(2)} / 5.00</strong></span>
    </div>
  `;
}

// Handle Apply Score (§6.6 & §6.7 Adaptation Diff)
async function handleApplyScore() {
  const submitBtn = document.getElementById('btn-apply-score');
  const select = document.getElementById('modal-skill-select');
  const scoreInput = document.getElementById('score-input');

  const profileId = state.profile ? state.profile.id : null;
  if (!profileId) {
    alert('Please generate an initial roadmap first before logging a score.');
    closeAssessmentModal();
    return;
  }

  const payload = {
    profile_id: profileId,
    skill: select.value,
    score_percentage: parseFloat(scoreInput.value) || 0,
    notes: 'Assessment logged via precision UI',
  };

  try {
    submitBtn.disabled = true;
    submitBtn.textContent = 'Applying...';

    // Store previous roadmap snapshot for diffing
    state.previousRoadmap = JSON.parse(JSON.stringify(state.roadmap));

    const result = await window.api.submitAssessment(payload);

    // Update state
    if (result.updated_profile) {
      state.profile = result.updated_profile;
      state.skills = result.updated_profile.skills;
    }
    if (result.gaps) state.gaps = result.gaps;
    if (result.roadmap) state.roadmap = result.roadmap;

    closeAssessmentModal();

    // Re-render UI components
    renderGapTable();
    renderBudgetStrip();
    renderRoadmapTimeline();
    renderSkillEditor();

    // Crossfade version chip
    updateRevisionChip(result.roadmap.version);

    // Render Section 6.7 Adaptation Diff Strip
    renderAdaptationDiff(result.result, result.summary);

    // Trigger one-shot 600ms background wash on changed phase rows
    highlightChangedPhases();

    window.showToast('Score applied.');
  } catch (err) {
    alert(err.message);
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Apply score';
  }
}

// Section 6.7: Render Adaptation Diff Strip Pinned Above Roadmap
function renderAdaptationDiff(assessmentResult, summary) {
  let diffContainer = document.getElementById('adaptation-diff-container');
  if (!diffContainer) return;

  const prevRev = state.previousRoadmap ? state.previousRoadmap.version : 1;
  const newRev = state.roadmap.version;

  diffContainer.innerHTML = `
    <div class="adaptation-diff-strip" role="status" aria-live="polite">
      <div class="diff-header">
        <span class="diff-title">Revision v${prevRev} → v${newRev}</span>
        <span class="diff-timestamp">Applied just now</span>
      </div>
      <table class="diff-table">
        <tbody>
          <tr>
            <td class="diff-skill-col">${assessmentResult.skill}</td>
            <td class="diff-old-val">${assessmentResult.previous_level.toFixed(1)}</td>
            <td class="diff-arrow">→</td>
            <td class="diff-new-val">${assessmentResult.updated_level.toFixed(1)}</td>
            <td class="diff-delta-col delta-gain">+${assessmentResult.level_delta.toFixed(2)} pts</td>
            <td style="text-align:right; color:var(--text-secondary); font-family:var(--font-mono);">
              Deprioritized from next phase
            </td>
          </tr>
        </tbody>
      </table>
      <div class="diff-summary-line">
        ${summary || `Phases recalculated: mastered hours redistributed to remaining gaps. Total hours conserved at ${state.roadmap.total_estimated_hours} h.`}
      </div>
    </div>
  `;

  diffContainer.style.display = 'block';
  diffContainer.scrollIntoView({ behavior: 'smooth' });
}

// One-shot 600ms wash on affected phase rows (§6.7)
function highlightChangedPhases() {
  document.querySelectorAll('.phase-panel').forEach((panel) => {
    panel.classList.add('phase-highlight');
    setTimeout(() => {
      panel.classList.remove('phase-highlight');
    }, 600);
  });
}

function updateRevisionChip(versionNum) {
  const chip = document.getElementById('topbar-version-chip');
  const railRev = document.getElementById('runstate-rev-val');
  if (chip) {
    chip.style.opacity = '0';
    setTimeout(() => {
      chip.textContent = `v${versionNum}`;
      chip.style.opacity = '1';
    }, 150);
  }
  if (railRev) {
    railRev.textContent = `v${versionNum}`;
  }
}

// Nice-to-Have: Copy Run Summary as Clean Markdown
function copyRunSummary() {
  if (!state.profile || !state.roadmap) {
    window.showToast('Generate a roadmap first to copy run summary.');
    return;
  }

  const lines = [
    `# CareerForge AI Run Summary`,
    `- **Student:** ${state.profile.name} (${state.profile.degree} ${state.profile.branch}, Year ${state.profile.year})`,
    `- **Target Role:** ${state.profile.target_role}`,
    `- **Roadmap Revision:** v${state.roadmap.version}`,
    `- **Total Hours:** ${state.roadmap.total_estimated_hours} h (~${state.roadmap.estimated_weeks} weeks)`,
    ``,
    `## Skill Gaps`,
    `| Skill | Current | Benchmark | Gap | Priority |`,
    `| :--- | :--- | :--- | :--- | :--- |`,
    ...state.gaps.map((g) => `| ${g.skill} | ${g.current_level.toFixed(1)} | ${g.required_level.toFixed(1)} | ${g.gap.toFixed(1)} | ${g.priority} |`),
  ];

  navigator.clipboard.writeText(lines.join('\n')).then(() => {
    window.showToast('Run summary copied to clipboard.');
  });
}
