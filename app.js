const DEFAULT_DATA = window.FLASHCARD_DATA;

const els = {
  categoryFilter: document.getElementById('categoryFilter'),
  tagFilter: document.getElementById('tagFilter'),
  statusFilter: document.getElementById('statusFilter'),
  sortMode: document.getElementById('sortMode'),
  searchText: document.getElementById('searchText'),
  showJapanese: document.getElementById('showJapanese'),
  autoNext: document.getElementById('autoNext'),
  totalCount: document.getElementById('totalCount'),
  visibleCount: document.getElementById('visibleCount'),
  okCount: document.getElementById('okCount'),
  okRate: document.getElementById('okRate'),
  progressFill: document.getElementById('progressFill'),
  deckTitle: document.getElementById('deckTitle'),
  counterText: document.getElementById('counterText'),
  flashcard: document.getElementById('flashcard'),
  questionEn: document.getElementById('questionEn'),
  questionJa: document.getElementById('questionJa'),
  answerEn: document.getElementById('answerEn'),
  answerJa: document.getElementById('answerJa'),
  categoryBadge: document.getElementById('categoryBadge'),
  statusBadge: document.getElementById('statusBadge'),
  originalNoBadge: document.getElementById('originalNoBadge'),
  tagsList: document.getElementById('tagsList'),
  cardList: document.getElementById('cardList'),
  listSummary: document.getElementById('listSummary'),
  flipBtn: document.getElementById('flipBtn'),
  okBtn: document.getElementById('okBtn'),
  skipBtn: document.getElementById('skipBtn'),
  prevBtn: document.getElementById('prevBtn'),
  nextBtn: document.getElementById('nextBtn'),
  resetOkBtn: document.getElementById('resetOkBtn'),
  shuffleBtn: document.getElementById('shuffleBtn'),
  playSpeechBtn: document.getElementById('playSpeechBtn'),
  pauseSpeechBtn: document.getElementById('pauseSpeechBtn'),
  resumeSpeechBtn: document.getElementById('resumeSpeechBtn'),
  stopSpeechBtn: document.getElementById('stopSpeechBtn'),
  repeatCurrentBtn: document.getElementById('repeatCurrentBtn'),
  repeatSelectionBtn: document.getElementById('repeatSelectionBtn'),
  voiceSelect: document.getElementById('voiceSelect'),
  speechSourceSelect: document.getElementById('speechSourceSelect'),
  speechRate: document.getElementById('speechRate'),
  speechRateValue: document.getElementById('speechRateValue'),
  speechProgressFill: document.getElementById('speechProgressFill'),
  speechProgressLabel: document.getElementById('speechProgressLabel'),
  speechRepeatStart: document.getElementById('speechRepeatStart'),
  speechRepeatEnd: document.getElementById('speechRepeatEnd'),
  toggleEditorBtn: document.getElementById('toggleEditorBtn'),
  editorPanel: document.getElementById('editorPanel'),
  editAnswerJa: document.getElementById('editAnswerJa'),
  editAnswerEn: document.getElementById('editAnswerEn'),
  autoTranslateJaToEn: document.getElementById('autoTranslateJaToEn'),
  saveEditBtn: document.getElementById('saveEditBtn'),
  resetEditBtn: document.getElementById('resetEditBtn'),
  speechStatus: document.getElementById('speechStatus'),
  translateStatus: document.getElementById('translateStatus'),
  excelFileInput: document.getElementById('excelFileInput'),
  importExcelBtn: document.getElementById('importExcelBtn'),
  resetImportedDataBtn: document.getElementById('resetImportedDataBtn'),
  importStatus: document.getElementById('importStatus'),
  remoteApiUrl: document.getElementById('remoteApiUrl'),
  remoteAdminKey: document.getElementById('remoteAdminKey'),
  autoSyncRemote: document.getElementById('autoSyncRemote'),
  saveRemoteConfigBtn: document.getElementById('saveRemoteConfigBtn'),
  syncRemoteBtn: document.getElementById('syncRemoteBtn'),
  remoteStatus: document.getElementById('remoteStatus'),
  remoteSyncDetails: document.getElementById('remoteSyncDetails'),
};

const STORAGE_KEY = 'gbc_flashcards_ok_map_v1';
const SETTINGS_KEY = 'gbc_flashcards_settings_v2';
const EDITS_KEY = 'gbc_flashcards_answer_edits_v1';
const IMPORTED_DATA_KEY = 'gbc_flashcards_imported_dataset_v1';
const REMOTE_CONFIG_KEY = 'gbc_flashcards_remote_config_v1';
const REMOTE_CACHE_KEY = 'gbc_flashcards_remote_cache_v1';

function createSpeechState() {
  return {
    mode: 'idle',
    sourceValue: 'current',
    sourceKey: 'question',
    label: '質問',
    text: '',
    chunks: [],
    chunkOffsets: [],
    startChunk: 0,
    endChunk: 0,
    currentChunkIndex: -1,
    boundaryCharIndex: 0,
    repeatMode: 'off',
    activeUtterance: null,
  };
}

const state = {
  allItems: [],
  meta: { categories: [], tags: [], totalCount: 0 },
  visibleItems: [],
  currentIndex: 0,
  flipped: false,
  okMap: loadJson(STORAGE_KEY, {}),
  settings: loadSettings(),
  editsMap: loadJson(EDITS_KEY, {}),
  importedData: loadJson(IMPORTED_DATA_KEY, null),
  remoteConfig: loadRemoteConfig(),
  remotePayload: loadJson(REMOTE_CACHE_KEY, null),
  remoteSyncTimer: null,
  editorOpen: false,
  touch: {
    startX: 0,
    startY: 0,
    startTime: 0,
    lastHandledAt: 0,
  },
  translateTimer: null,
  translateRequestId: 0,
  speech: createSpeechState(),
  lastCardToggleAt: 0,
};

function loadJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function saveJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function loadSettings() {
  const defaults = {
    category: 'all',
    tag: 'all',
    status: 'all',
    sort: 'original',
    search: '',
    showJapanese: true,
    autoNext: false,
    voiceName: 'auto',
    speechSource: 'current',
    speechRate: '0.92',
  };
  return { ...defaults, ...loadJson(SETTINGS_KEY, {}) };
}

function saveSettings() {
  state.settings = {
    category: els.categoryFilter.value,
    tag: els.tagFilter.value,
    status: els.statusFilter.value,
    sort: els.sortMode.value,
    search: els.searchText.value,
    showJapanese: els.showJapanese.checked,
    autoNext: els.autoNext.checked,
    voiceName: els.voiceSelect?.value || 'auto',
    speechSource: els.speechSourceSelect?.value || 'current',
    speechRate: els.speechRate?.value || '0.92',
  };
  saveJson(SETTINGS_KEY, state.settings);
}

function saveOkMap() {
  saveJson(STORAGE_KEY, state.okMap);
}

function saveEditsMap() {
  saveJson(EDITS_KEY, state.editsMap);
}

function saveImportedData() {
  saveJson(IMPORTED_DATA_KEY, state.importedData);
}

function loadRemoteConfig() {
  return {
    endpoint: '',
    adminKey: '',
    autoSync: true,
    ...loadJson(REMOTE_CONFIG_KEY, {}),
  };
}

function normalizeEndpoint(value) {
  return String(value || '').trim().replace(/\/+$/, '');
}

function saveRemoteConfig() {
  state.remoteConfig = {
    endpoint: normalizeEndpoint(els.remoteApiUrl?.value || ''),
    adminKey: String(els.remoteAdminKey?.value || '').trim(),
    autoSync: Boolean(els.autoSyncRemote?.checked),
  };
  saveJson(REMOTE_CONFIG_KEY, state.remoteConfig);
  scheduleRemoteSync();
  return state.remoteConfig;
}

function populateRemoteConfigFields() {
  if (els.remoteApiUrl) els.remoteApiUrl.value = state.remoteConfig.endpoint || '';
  if (els.remoteAdminKey) els.remoteAdminKey.value = state.remoteConfig.adminKey || '';
  if (els.autoSyncRemote) els.autoSyncRemote.checked = state.remoteConfig.autoSync !== false;
}

function describeRemotePayload(payload) {
  const count = payload?.itemCount || payload?.dataset?.items?.length || 0;
  const time = payload?.updatedAt ? new Date(payload.updatedAt).toLocaleString('ja-JP') : '時刻不明';
  const file = payload?.fileName ? ` / ${payload.fileName}` : '';
  return `${count}件 / ${time}${file}`;
}

function setRemoteStatus(message, tone = 'muted') {
  if (!els.remoteStatus) return;
  els.remoteStatus.textContent = message;
  els.remoteStatus.dataset.tone = tone;
}

function saveRemotePayload(payload) {
  state.remotePayload = payload;
  saveJson(REMOTE_CACHE_KEY, payload);
}

function getRemoteEndpoint() {
  return normalizeEndpoint(els.remoteApiUrl?.value || state.remoteConfig.endpoint);
}

function buildRemoteFetchUrl() {
  const endpoint = getRemoteEndpoint();
  if (!endpoint) return '';
  const sep = endpoint.includes('?') ? '&' : '?';
  return `${endpoint}${sep}_=${Date.now()}`;
}

async function fetchRemoteDataset({ silent = false } = {}) {
  const endpoint = getRemoteEndpoint();
  if (!endpoint) {
    if (!silent) setRemoteStatus('共有データAPI URLを設定すると、全端末で同じカード内容を使えます。');
    return null;
  }

  try {
    if (!silent) setRemoteStatus('共有データを取得中…', 'loading');
    const response = await fetch(buildRemoteFetchUrl(), { cache: 'no-store' });
    if (!response.ok) throw new Error(`http_${response.status}`);
    const payload = await response.json();
    if (!payload?.dataset?.items?.length) throw new Error('empty_dataset');
    return payload;
  } catch (error) {
    if (!silent) {
      setRemoteStatus('共有データの取得に失敗しました。オフライン時は前回同期した内容を利用します。', 'error');
    }
    return null;
  }
}

function applyRemotePayload(payload, { keepCurrent = true, announce = true } = {}) {
  if (!payload?.dataset?.items?.length) return false;
  const keepCurrentId = keepCurrent ? (getCurrentItem()?.id || null) : null;
  installDataset(payload.dataset, { imported: false });
  saveRemotePayload(payload);
  buildFilters();
  applyFilters(keepCurrentId);
  if (announce) {
    setRemoteStatus(`共有データを同期しました（${describeRemotePayload(payload)}）`, 'success');
  }
  return true;
}

async function syncRemoteDataset({ silent = false, force = false } = {}) {
  const payload = await fetchRemoteDataset({ silent });
  if (!payload) return false;
  const currentVersion = state.remotePayload?.version || '';
  const incomingCount = payload.itemCount || payload.dataset?.items?.length || 0;
  if (force || payload.version !== currentVersion || incomingCount !== state.allItems.length) {
    applyRemotePayload(payload, { keepCurrent: true, announce: !silent });
  } else if (!silent) {
    setRemoteStatus(`共有データは最新です（${describeRemotePayload(payload)}）`, 'success');
  }
  return true;
}

async function pushDatasetToRemote(dataset, fileName) {
  const endpoint = getRemoteEndpoint();
  const adminKey = String(els.remoteAdminKey?.value || state.remoteConfig.adminKey || '').trim();
  if (!endpoint) return { mode: 'local_only' };
  if (!adminKey) throw new Error('missing_admin_key');

  saveRemoteConfig();
  setRemoteStatus('共有データへアップロード中…', 'loading');
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      adminKey,
      fileName,
      dataset,
    }),
    cache: 'no-store',
  });
  if (!response.ok) {
    if (response.status === 401) throw new Error('unauthorized');
    throw new Error(`http_${response.status}`);
  }
  return response.json();
}

function scheduleRemoteSync() {
  if (state.remoteSyncTimer) clearInterval(state.remoteSyncTimer);
  const config = state.remoteConfig || {};
  if (!config.endpoint || config.autoSync === false) return;
  state.remoteSyncTimer = window.setInterval(() => {
    if (document.visibilityState === 'visible') {
      syncRemoteDataset({ silent: true });
    }
  }, 5 * 60 * 1000);
}


function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function normalizeTags(tagsRaw) {
  return String(tagsRaw || '')
    .replaceAll('／', '/')
    .split('/')
    .map(tag => tag.trim())
    .filter(Boolean);
}

function buildMeta(items) {
  return {
    totalCount: items.length,
    categories: [...new Set(items.map(item => item.category).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'ja')),
    tags: [...new Set(items.flatMap(item => item.tags || []).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'ja')),
  };
}

function sortByOriginal(items) {
  return [...items].sort((a, b) => Number(a.originalNo || 999999) - Number(b.originalNo || 999999));
}

function installDataset(dataset, { imported = false } = {}) {
  const safeItems = Array.isArray(dataset?.items) ? dataset.items : [];
  state.allItems = safeItems;
  state.meta = dataset?.meta || buildMeta(safeItems);
  state.importedData = imported ? { meta: state.meta, items: safeItems } : null;
  saveImportedData();
}

function getEffectiveItem(item) {
  if (!item) return null;
  const edit = state.editsMap[item.id];
  if (!edit) return item;
  return {
    ...item,
    answerJa: typeof edit.answerJa === 'string' ? edit.answerJa : item.answerJa,
    answerEn: typeof edit.answerEn === 'string' ? edit.answerEn : item.answerEn,
    edited: true,
  };
}

function getCurrentItem() {
  return state.visibleItems[state.currentIndex];
}

function getCurrentEffectiveItem() {
  return getEffectiveItem(getCurrentItem());
}

function isOk(item) {
  return Boolean(state.okMap[item.id]);
}

function buildFilters() {
  els.categoryFilter.innerHTML = ['<option value="all">すべてのカテゴリ</option>']
    .concat(state.meta.categories.map(category => `<option value="${escapeHtml(category)}">${escapeHtml(category)}</option>`))
    .join('');

  els.tagFilter.innerHTML = ['<option value="all">すべてのタグ</option>']
    .concat(state.meta.tags.map(tag => `<option value="${escapeHtml(tag)}">${escapeHtml(tag)}</option>`))
    .join('');

  els.categoryFilter.value = state.settings.category || 'all';
  if (![...els.categoryFilter.options].some(option => option.value === els.categoryFilter.value)) {
    els.categoryFilter.value = 'all';
  }
  els.tagFilter.value = state.settings.tag || 'all';
  if (![...els.tagFilter.options].some(option => option.value === els.tagFilter.value)) {
    els.tagFilter.value = 'all';
  }
  els.statusFilter.value = state.settings.status || 'all';
  els.sortMode.value = state.settings.sort || 'original';
  els.searchText.value = state.settings.search || '';
  els.showJapanese.checked = !!state.settings.showJapanese;
  els.autoNext.checked = !!state.settings.autoNext;
  if (els.speechRate) {
    els.speechRate.value = state.settings.speechRate || '0.92';
  }
  if (els.speechSourceSelect) {
    els.speechSourceSelect.value = state.settings.speechSource || 'current';
  }
  updateRateLabel();
}

function populateVoiceOptions() {
  if (!('speechSynthesis' in window) || !els.voiceSelect) return;
  const voices = window.speechSynthesis.getVoices().filter(voice => /^en/i.test(voice.lang));
  const selected = state.settings.voiceName || 'auto';
  const options = ['<option value="auto">自動で最適な音声を選択</option>']
    .concat(
      voices.map(voice => `<option value="${escapeHtml(voice.name)}">${escapeHtml(voice.name)} (${escapeHtml(voice.lang)})</option>`)
    )
    .join('');
  els.voiceSelect.innerHTML = options;
  els.voiceSelect.value = [...els.voiceSelect.options].some(option => option.value === selected) ? selected : 'auto';
}

function scoreVoice(voice) {
  const name = `${voice.name} ${voice.lang}`.toLowerCase();
  let score = 0;
  const preferred = ['samantha', 'daniel', 'karen', 'moira', 'ava', 'allison', 'serena', 'siri', 'google us english', 'google uk english female', 'google uk english male', 'microsoft aria', 'microsoft jenny', 'microsoft guy'];
  preferred.forEach((keyword, index) => {
    if (name.includes(keyword)) score += 120 - index;
  });
  if (voice.localService) score += 20;
  if (name.includes('female')) score += 6;
  if (/en-(us|gb|au|ca)/i.test(voice.lang)) score += 10;
  if (name.includes('compact')) score -= 10;
  return score;
}

function resolveVoice() {
  if (!('speechSynthesis' in window)) return null;
  const voices = window.speechSynthesis.getVoices().filter(voice => /^en/i.test(voice.lang));
  if (!voices.length) return null;
  if (els.voiceSelect?.value && els.voiceSelect.value !== 'auto') {
    return voices.find(voice => voice.name === els.voiceSelect.value) || null;
  }
  return [...voices].sort((a, b) => scoreVoice(b) - scoreVoice(a))[0] || null;
}

function splitIntoSpeechChunks(text) {
  return String(text || '')
    .replace(/\s+/g, ' ')
    .trim()
    .split(/(?<=[.!?])\s+|(?<=[。！？])\s*/)
    .flatMap(sentence => {
      if (sentence.length <= 160) return sentence ? [sentence] : [];
      const parts = [];
      for (let i = 0; i < sentence.length; i += 140) {
        parts.push(sentence.slice(i, i + 140));
      }
      return parts;
    })
    .filter(Boolean);
}

function createChunkOffsets(chunks) {
  const offsets = [];
  let total = 0;
  chunks.forEach(chunk => {
    offsets.push(total);
    total += chunk.length;
  });
  return offsets;
}

function updateRateLabel() {
  if (!els.speechRateValue) return;
  const rate = Number(els.speechRate?.value || state.settings.speechRate || 0.92);
  els.speechRateValue.textContent = `${rate.toFixed(2)}x`;
}

function getSpeechSourceValue() {
  return els.speechSourceSelect?.value || state.settings.speechSource || 'current';
}

function resolveSpeechSource(sourceValue = getSpeechSourceValue()) {
  const item = getCurrentEffectiveItem();
  if (!item) return null;
  const normalized = sourceValue === 'question' || sourceValue === 'answer' ? sourceValue : 'current';
  const sourceKey = normalized === 'current' ? (state.flipped ? 'answer' : 'question') : normalized;
  const text = sourceKey === 'answer' ? item.answerEn : item.questionEn;
  const label = sourceKey === 'answer' ? '回答' : '質問';
  return {
    sourceValue: normalized,
    sourceKey,
    label,
    text: String(text || '').trim(),
  };
}

function formatSpeechRangeLabel(chunk, index) {
  const safe = String(chunk || '').replace(/\s+/g, ' ').trim();
  const preview = safe.length > 34 ? `${safe.slice(0, 34)}…` : safe || '（空白）';
  return `${index + 1}. ${preview}`;
}

function populateSpeechRepeatOptions(chunks, { keepSelection = true } = {}) {
  if (!els.speechRepeatStart || !els.speechRepeatEnd) return;
  if (!chunks.length) {
    const empty = '<option value="0">再生対象を選んでください</option>';
    els.speechRepeatStart.innerHTML = empty;
    els.speechRepeatEnd.innerHTML = empty;
    els.speechRepeatStart.disabled = true;
    els.speechRepeatEnd.disabled = true;
    return;
  }

  const previousStart = keepSelection ? els.speechRepeatStart.value : '0';
  const previousEnd = keepSelection ? els.speechRepeatEnd.value : String(chunks.length - 1);
  const options = chunks
    .map((chunk, index) => `<option value="${index}">${escapeHtml(formatSpeechRangeLabel(chunk, index))}</option>`)
    .join('');

  els.speechRepeatStart.disabled = false;
  els.speechRepeatEnd.disabled = false;
  els.speechRepeatStart.innerHTML = options;
  els.speechRepeatEnd.innerHTML = options;

  const startExists = [...els.speechRepeatStart.options].some(option => option.value === previousStart);
  const endExists = [...els.speechRepeatEnd.options].some(option => option.value === previousEnd);
  els.speechRepeatStart.value = startExists ? previousStart : '0';
  els.speechRepeatEnd.value = endExists ? previousEnd : String(chunks.length - 1);
}

function syncSpeechRangeBounds() {
  if (!els.speechRepeatStart || !els.speechRepeatEnd || !state.speech.chunks.length) return { start: 0, end: 0 };
  const lastIndex = Math.max(0, state.speech.chunks.length - 1);
  let start = Math.max(0, Math.min(Number(els.speechRepeatStart.value || 0), lastIndex));
  let end = Math.max(0, Math.min(Number(els.speechRepeatEnd.value || lastIndex), lastIndex));
  if (end < start) {
    end = start;
    els.speechRepeatEnd.value = String(end);
  }
  els.speechRepeatStart.value = String(start);
  return { start, end };
}

function setSpeechStatus(message, tone = 'muted') {
  if (!els.speechStatus) return;
  els.speechStatus.textContent = message;
  els.speechStatus.dataset.tone = tone;
}

function getSpeechProgressChars() {
  if (!state.speech.chunks.length || state.speech.currentChunkIndex < 0) return 0;
  const base = state.speech.chunkOffsets[state.speech.currentChunkIndex] || 0;
  const currentChunk = state.speech.chunks[state.speech.currentChunkIndex] || '';
  const offset = Math.max(0, Math.min(state.speech.boundaryCharIndex || 0, currentChunk.length));
  return base + offset;
}

function updateSpeechProgress(progressChars = null) {
  const totalChars = state.speech.text.length || 0;
  const currentChars = progressChars === null
    ? (state.speech.mode === 'idle' ? 0 : getSpeechProgressChars())
    : progressChars;
  const clamped = Math.max(0, Math.min(currentChars, totalChars));
  const percent = totalChars ? Math.round((clamped / totalChars) * 100) : 0;
  if (els.speechProgressFill) {
    els.speechProgressFill.style.width = `${percent}%`;
  }
  if (els.speechProgressLabel) {
    const chunkTotal = state.speech.chunks.length;
    const chunkIndex = state.speech.currentChunkIndex >= 0 ? Math.min(chunkTotal, state.speech.currentChunkIndex + 1) : 0;
    els.speechProgressLabel.textContent = chunkTotal ? `${percent}% / ${chunkIndex}/${chunkTotal}文節` : `${percent}%`;
  }
}

function updateSpeechUi() {
  updateRateLabel();
  updateSpeechProgress();
  const hasChunks = state.speech.chunks.length > 0;
  if (els.pauseSpeechBtn) els.pauseSpeechBtn.disabled = state.speech.mode !== 'playing';
  if (els.resumeSpeechBtn) els.resumeSpeechBtn.disabled = state.speech.mode !== 'paused';
  if (els.stopSpeechBtn) els.stopSpeechBtn.disabled = state.speech.mode === 'idle';
  if (els.repeatCurrentBtn) {
    els.repeatCurrentBtn.classList.toggle('is-active', state.speech.repeatMode === 'all');
    els.repeatCurrentBtn.disabled = !hasChunks;
  }
  if (els.repeatSelectionBtn) {
    els.repeatSelectionBtn.classList.toggle('is-active', state.speech.repeatMode === 'range');
    els.repeatSelectionBtn.disabled = !hasChunks;
  }
  if (els.playSpeechBtn) {
    els.playSpeechBtn.disabled = !hasChunks;
  }
}

function prepareSpeechSource(sourceValue = getSpeechSourceValue(), { keepSelection = false } = {}) {
  const config = resolveSpeechSource(sourceValue);
  if (!config) {
    state.speech = { ...createSpeechState(), sourceValue };
    populateSpeechRepeatOptions([], { keepSelection: false });
    updateSpeechUi();
    return null;
  }

  const chunks = splitIntoSpeechChunks(config.text);
  const shouldKeepSelection = keepSelection && state.speech.sourceKey === config.sourceKey && state.speech.text === config.text;
  state.speech = {
    ...state.speech,
    sourceValue: config.sourceValue,
    sourceKey: config.sourceKey,
    label: config.label,
    text: config.text,
    chunks,
    chunkOffsets: createChunkOffsets(chunks),
    startChunk: 0,
    endChunk: Math.max(0, chunks.length - 1),
    currentChunkIndex: state.speech.currentChunkIndex,
    boundaryCharIndex: state.speech.boundaryCharIndex,
  };
  populateSpeechRepeatOptions(chunks, { keepSelection: shouldKeepSelection });
  const range = syncSpeechRangeBounds();
  state.speech.startChunk = range.start;
  state.speech.endChunk = range.end;
  updateSpeechUi();
  return config;
}

function getSelectedSpeechRange() {
  const range = syncSpeechRangeBounds();
  state.speech.startChunk = range.start;
  state.speech.endChunk = range.end;
  return range;
}

function stopSpeech({ silent = false, preserveSource = true } = {}) {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
  const preserved = preserveSource
    ? {
        sourceValue: state.speech.sourceValue,
        sourceKey: state.speech.sourceKey,
        label: state.speech.label,
        text: state.speech.text,
        chunks: state.speech.chunks,
        chunkOffsets: state.speech.chunkOffsets,
      }
    : {};
  const range = preserveSource
    ? {
        startChunk: state.speech.startChunk,
        endChunk: state.speech.endChunk,
      }
    : {};
  state.speech = {
    ...createSpeechState(),
    ...preserved,
    ...range,
  };
  if (!silent) {
    setSpeechStatus('読み上げ停止');
  }
  updateSpeechUi();
}

function speakSpeechChunk(index) {
  const chunks = state.speech.chunks;
  if (!chunks.length) {
    setSpeechStatus('読み上げ対象の英語テキストがありません。', 'error');
    updateSpeechUi();
    return;
  }

  if (index > state.speech.endChunk) {
    if (state.speech.repeatMode === 'all' || state.speech.repeatMode === 'range') {
      speakSpeechChunk(state.speech.startChunk);
      return;
    }
    state.speech.mode = 'idle';
    state.speech.currentChunkIndex = state.speech.endChunk;
    state.speech.boundaryCharIndex = (chunks[state.speech.endChunk] || '').length;
    state.speech.activeUtterance = null;
    setSpeechStatus(`${state.speech.label}の読み上げが完了しました`, 'success');
    updateSpeechProgress(state.speech.text.length);
    updateSpeechUi();
    return;
  }

  const chunk = chunks[index];
  const voice = resolveVoice();
  const rate = Number(els.speechRate?.value || state.settings.speechRate || 0.92);
  const utterance = new SpeechSynthesisUtterance(chunk);
  utterance.rate = rate;
  utterance.pitch = 1.0;
  utterance.volume = 1;
  utterance.lang = voice?.lang || 'en-US';
  if (voice) utterance.voice = voice;

  state.speech.currentChunkIndex = index;
  state.speech.boundaryCharIndex = 0;
  state.speech.activeUtterance = utterance;

  utterance.onstart = () => {
    state.speech.mode = 'playing';
    const voiceLabel = voice ? ` / ${voice.name}` : '';
    setSpeechStatus(`${state.speech.label}を読み上げ中${voiceLabel}`, 'loading');
    updateSpeechUi();
  };
  utterance.onboundary = event => {
    if (typeof event.charIndex === 'number') {
      state.speech.boundaryCharIndex = event.charIndex;
      updateSpeechProgress();
    }
  };
  utterance.onend = () => {
    if (state.speech.activeUtterance !== utterance) return;
    state.speech.boundaryCharIndex = chunk.length;
    updateSpeechProgress((state.speech.chunkOffsets[index] || 0) + chunk.length);
    state.speech.activeUtterance = null;
    speakSpeechChunk(index + 1);
  };
  utterance.onerror = () => {
    if (state.speech.activeUtterance !== utterance) return;
    state.speech.mode = 'idle';
    state.speech.activeUtterance = null;
    setSpeechStatus('読み上げに失敗しました。別の英語音声を選ぶと改善することがあります。', 'error');
    updateSpeechUi();
  };

  window.speechSynthesis.speak(utterance);
}

function playSpeech({ sourceValue = getSpeechSourceValue(), repeatMode = 'off', useSelection = false, startChunk = null, endChunk = null } = {}) {
  if (!('speechSynthesis' in window)) {
    setSpeechStatus('このブラウザでは読み上げ機能を利用できません。', 'error');
    return;
  }

  const config = prepareSpeechSource(sourceValue, { keepSelection: true });
  if (!config || !config.text) {
    setSpeechStatus('読み上げ対象の英語テキストがありません。', 'error');
    return;
  }

  if (!state.speech.chunks.length) {
    setSpeechStatus('読み上げ対象の文節を作れませんでした。', 'error');
    return;
  }

  const lastIndex = state.speech.chunks.length - 1;
  const selectedRange = useSelection ? getSelectedSpeechRange() : { start: 0, end: lastIndex };
  const safeStart = Math.max(0, Math.min(Number.isInteger(startChunk) ? startChunk : selectedRange.start, lastIndex));
  const safeEnd = Math.max(safeStart, Math.min(Number.isInteger(endChunk) ? endChunk : selectedRange.end, lastIndex));

  window.speechSynthesis.cancel();
  state.speech.mode = 'playing';
  state.speech.repeatMode = repeatMode;
  state.speech.startChunk = safeStart;
  state.speech.endChunk = safeEnd;
  state.speech.currentChunkIndex = safeStart;
  state.speech.boundaryCharIndex = 0;
  state.speech.activeUtterance = null;
  updateSpeechProgress(state.speech.chunkOffsets[safeStart] || 0);
  updateSpeechUi();
  speakSpeechChunk(safeStart);
}

function pauseSpeech() {
  if (!('speechSynthesis' in window) || state.speech.mode !== 'playing') return;
  window.speechSynthesis.pause();
  state.speech.mode = 'paused';
  setSpeechStatus(`${state.speech.label}を一時停止しました`, 'muted');
  updateSpeechUi();
}

function resumeSpeech() {
  if (!('speechSynthesis' in window) || state.speech.mode !== 'paused') return;
  window.speechSynthesis.resume();
  state.speech.mode = 'playing';
  setSpeechStatus(`${state.speech.label}を再開しました`, 'loading');
  updateSpeechUi();
}

function toggleRepeatCurrent() {
  if (state.speech.repeatMode === 'all' && state.speech.mode !== 'idle') {
    state.speech.repeatMode = 'off';
    setSpeechStatus('全体リピートをオフにしました。', 'muted');
    updateSpeechUi();
    return;
  }
  playSpeech({ sourceValue: getSpeechSourceValue(), repeatMode: 'all' });
}

function startSelectionRepeat() {
  const range = getSelectedSpeechRange();
  playSpeech({
    sourceValue: getSpeechSourceValue(),
    repeatMode: 'range',
    useSelection: true,
    startChunk: range.start,
    endChunk: range.end,
  });
}

function parseWorkbookToDataset(workbook) {
  const targetName = workbook.SheetNames.includes('Categorized_QA') ? 'Categorized_QA' : workbook.SheetNames[0];
  const sheet = workbook.Sheets[targetName];
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
  if (!rows.length) {
    throw new Error('empty_sheet');
  }

  const headers = rows[0].map(value => String(value || '').trim());
  const idx = {
    category: headers.indexOf('カテゴリ'),
    tags: headers.indexOf('関連タグ'),
    questionJa: headers.indexOf('日本語質問'),
    answerJa: headers.indexOf('日本語回答'),
    questionEn: headers.indexOf('英語質問'),
    answerEn: headers.indexOf('英語回答'),
    originalNo: headers.indexOf('元No.'),
  };

  if (idx.category < 0 || idx.questionEn < 0 || idx.answerEn < 0) {
    throw new Error('invalid_headers');
  }

  const items = rows.slice(1).filter(row => row.some(cell => String(cell || '').trim())).map((row, index) => {
    const category = String(row[idx.category] || '').trim();
    const tagsText = String(row[idx.tags] || '').trim();
    const questionJa = String(row[idx.questionJa] || '').trim();
    const answerJa = String(row[idx.answerJa] || '').trim();
    const questionEn = String(row[idx.questionEn] || '').trim();
    const answerEn = String(row[idx.answerEn] || '').trim();
    const originalNo = String(row[idx.originalNo] || index + 1).trim();
    const id = `${category || 'uncategorized'}__${originalNo}__${index + 1}`;
    return {
      id,
      category,
      tags: normalizeTags(tagsText),
      tagsText,
      questionJa,
      answerJa,
      questionEn,
      answerEn,
      originalNo,
    };
  }).filter(item => item.questionEn || item.answerEn);

  const sortedItems = sortByOriginal(items);
  return {
    meta: buildMeta(sortedItems),
    items: sortedItems,
  };
}

async function importExcelFile() {
  const file = els.excelFileInput?.files?.[0];
  if (!file) {
    if (els.importStatus) els.importStatus.textContent = '先にExcelファイルを選択してください。';
    return;
  }
  if (typeof XLSX === 'undefined') {
    if (els.importStatus) els.importStatus.textContent = 'Excel読み込みライブラリの初期化に失敗しました。';
    return;
  }

  try {
    if (els.importStatus) els.importStatus.textContent = `${file.name} を読み込み中…`;
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array' });
    const dataset = parseWorkbookToDataset(workbook);
    const remoteResult = await pushDatasetToRemote(dataset, file.name);

    state.editsMap = {};
    saveEditsMap();

    if (remoteResult?.mode === 'local_only') {
      installDataset(dataset, { imported: true });
      buildFilters();
      applyFilters();
      if (els.importStatus) {
        els.importStatus.textContent = `${file.name} から ${dataset.items.length} 件のカードを更新しました。共有API未設定のため、この端末だけ更新しています。`;
      }
      setRemoteStatus('共有データAPI URLを設定すると、次回から全端末へ自動反映できます。');
      return;
    }

    applyRemotePayload(remoteResult, { keepCurrent: false, announce: false });
    if (els.importStatus) {
      els.importStatus.textContent = `${file.name} を共有データへ反映しました。${remoteResult.itemCount || dataset.items.length} 件が全端末向けの最新データになります。`;
    }
    setRemoteStatus(`共有データを更新しました（${describeRemotePayload(remoteResult)}）`, 'success');
  } catch (error) {
    if (els.importStatus) {
      if (error.message === 'invalid_headers') {
        els.importStatus.textContent = 'Excelの列名を確認してください。Categorized_QA シートの「カテゴリ / 英語質問 / 英語回答」などが必要です。';
      } else if (error.message === 'missing_admin_key') {
        els.importStatus.textContent = '共有APIが設定されていますが、管理キーが未入力です。更新する端末では管理キーを入力してください。';
      } else if (error.message === 'unauthorized') {
        els.importStatus.textContent = '管理キーが一致しないため共有データを更新できませんでした。';
      } else {
        els.importStatus.textContent = 'Excelの読み込みまたは共有データ反映に失敗しました。ファイル形式または共有API設定を確認してください。';
      }
    }
    if (error.message === 'missing_admin_key' || error.message === 'unauthorized') {
      setRemoteStatus('共有データの更新に失敗しました。管理キーまたはAPI設定を確認してください。', 'error');
    }
  }
}

function resetImportedDataset() {
  installDataset(DEFAULT_DATA, { imported: false });
  buildFilters();
  applyFilters();
  if (els.importStatus) {
    els.importStatus.textContent = 'この端末だけ同梱データに戻しました。共有同期を有効にしている場合、再同期時に共有データへ戻ります。';
  }
}

function sortItems(items, mode) {
  const copied = [...items];
  if (mode === 'category') {
    copied.sort((a, b) => {
      const cat = a.category.localeCompare(b.category, 'ja');
      if (cat !== 0) return cat;
      return Number(a.originalNo || 999999) - Number(b.originalNo || 999999);
    });
    return copied;
  }
  if (mode === 'random') {
    for (let i = copied.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copied[i], copied[j]] = [copied[j], copied[i]];
    }
    return copied;
  }
  return sortByOriginal(copied);
}

function applyFilters(keepCurrentId = null) {
  saveSettings();
  const search = els.searchText.value.trim().toLowerCase();
  let items = state.allItems.filter(item => {
    const merged = getEffectiveItem(item);
    if (els.categoryFilter.value !== 'all' && merged.category !== els.categoryFilter.value) return false;
    if (els.tagFilter.value !== 'all' && !merged.tags.includes(els.tagFilter.value)) return false;
    if (els.statusFilter.value === 'ok' && !isOk(merged)) return false;
    if (els.statusFilter.value === 'unlearned' && isOk(merged)) return false;
    if (search) {
      const haystack = [merged.questionEn, merged.answerEn, merged.questionJa, merged.answerJa, merged.category, merged.tagsText]
        .join(' ')
        .toLowerCase();
      if (!haystack.includes(search)) return false;
    }
    return true;
  });

  items = sortItems(items, els.sortMode.value);
  state.visibleItems = items;

  if (!items.length) {
    state.currentIndex = 0;
    renderStats();
    renderEmptyState();
    return;
  }

  let nextIndex = 0;
  if (keepCurrentId) {
    const foundIndex = items.findIndex(item => item.id === keepCurrentId);
    if (foundIndex >= 0) nextIndex = foundIndex;
  } else if (state.currentIndex < items.length) {
    nextIndex = state.currentIndex;
  }
  state.currentIndex = Math.max(0, Math.min(nextIndex, items.length - 1));
  state.flipped = false;
  renderAll();
}

function renderStats() {
  const total = state.allItems.length;
  const visible = state.visibleItems.length;
  const okCount = state.allItems.filter(isOk).length;
  const okRate = total ? Math.round((okCount / total) * 100) : 0;
  els.totalCount.textContent = String(total);
  els.visibleCount.textContent = String(visible);
  els.okCount.textContent = String(okCount);
  els.okRate.textContent = `${okRate}%`;
  els.progressFill.style.width = `${okRate}%`;
}

function renderEmptyState() {
  els.deckTitle.textContent = '条件に合うカードがありません';
  els.counterText.textContent = '0 / 0';
  els.questionEn.textContent = '表示できるカードがありません';
  els.questionJa.textContent = 'フィルター条件を変更してください。';
  els.answerEn.textContent = '';
  els.answerJa.textContent = '';
  els.categoryBadge.textContent = '—';
  els.statusBadge.textContent = '—';
  els.originalNoBadge.textContent = 'No. —';
  els.tagsList.innerHTML = '';
  els.flashcard.classList.remove('flipped');
  els.cardList.innerHTML = '<div class="empty-state">条件に一致するカードがありません。カテゴリや検索条件を変更してください。</div>';
  els.listSummary.textContent = '0件';
  setSpeechStatus('読み上げ対象のカードがありません');
  prepareSpeechSource(getSpeechSourceValue(), { keepSelection: false });
  renderEditor();
}

function resetCardScroll() {
  document.querySelectorAll('.face-body').forEach(section => {
    section.scrollTop = 0;
  });
}

function scrollCardIntoView() {
  if (window.innerWidth > 720 || !els.flashcard) return;
  requestAnimationFrame(() => {
    const top = els.flashcard.getBoundingClientRect().top + window.scrollY - 10;
    window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
  });
}

function renderEditor() {
  if (!els.editorPanel) return;
  const item = getCurrentEffectiveItem();
  if (!item) {
    els.editorPanel.classList.add('hidden');
    return;
  }
  els.editorPanel.classList.toggle('hidden', !state.editorOpen);
  if (!state.editorOpen) return;
  els.editAnswerJa.value = item.answerJa || '';
  els.editAnswerEn.value = item.answerEn || '';
  if (els.translateStatus) {
    els.translateStatus.textContent = navigator.onLine
      ? '日本語を編集すると、オンライン時に英語回答へ自動反映します。'
      : 'オフライン中は自動英訳できません。必要に応じて英語欄を直接編集してください。';
  }
}

function renderCard() {
  const item = getCurrentEffectiveItem();
  if (!item) {
    renderEmptyState();
    return;
  }
  const ok = isOk(item);
  els.deckTitle.textContent = item.category || 'カテゴリ未設定';
  els.counterText.textContent = `${state.currentIndex + 1} / ${state.visibleItems.length}`;
  els.questionEn.textContent = item.questionEn || 'No question';
  els.answerEn.textContent = item.answerEn || 'No answer';
  els.questionJa.textContent = els.showJapanese.checked ? item.questionJa || '' : '';
  els.answerJa.textContent = els.showJapanese.checked ? item.answerJa || '' : '';
  els.categoryBadge.textContent = item.category || 'カテゴリなし';
  els.statusBadge.textContent = ok ? 'OK済み' : '未OK';
  els.originalNoBadge.textContent = item.edited ? `No. ${item.originalNo || '—'} / 編集済み` : `No. ${item.originalNo || '—'}`;
  els.okBtn.textContent = ok ? 'OKを解除' : 'このカードをOK';
  els.tagsList.innerHTML = item.tags.length
    ? item.tags.map(tag => `<span class="tag-pill">${escapeHtml(tag)}</span>`).join('')
    : '<span class="tag-pill">タグなし</span>';
  els.flashcard.classList.toggle('flipped', state.flipped);
  resetCardScroll();
  prepareSpeechSource(getSpeechSourceValue(), { keepSelection: false });
  renderEditor();
}

function renderList() {
  els.listSummary.textContent = `${state.visibleItems.length}件`;
  if (!state.visibleItems.length) {
    els.cardList.innerHTML = '<div class="empty-state">表示中のカードはありません。</div>';
    return;
  }

  els.cardList.innerHTML = state.visibleItems.map((item, index) => {
    const merged = getEffectiveItem(item);
    const active = index === state.currentIndex ? 'active' : '';
    const ok = isOk(merged) ? 'ok' : '';
    const editedLabel = merged.edited ? ' / 編集済み' : '';
    return `
      <div class="list-item ${active} ${ok}" data-id="${escapeHtml(merged.id)}">
        <div class="list-item-index">${index + 1}</div>
        <div>
          <h4>${escapeHtml(merged.questionEn)}</h4>
          <p>${escapeHtml(merged.category)} / No.${escapeHtml(merged.originalNo || '—')}${escapeHtml(editedLabel)}</p>
        </div>
        <button type="button" data-jump="${escapeHtml(merged.id)}">開く</button>
      </div>
    `;
  }).join('');

  requestAnimationFrame(() => {
    const activeItem = els.cardList.querySelector('.list-item.active');
    if (activeItem) {
      activeItem.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    }
  });
}

function renderAll() {
  renderStats();
  renderCard();
  renderList();
}

function toggleFlip(force) {
  state.flipped = typeof force === 'boolean' ? force : !state.flipped;
  els.flashcard.classList.toggle('flipped', state.flipped);
  if (getSpeechSourceValue() === 'current') {
    if (state.speech.mode !== 'idle') {
      stopSpeech({ silent: true });
      setSpeechStatus('カード面が変わったため読み上げを停止しました。');
    }
    prepareSpeechSource('current', { keepSelection: false });
  }
}

function markCardToggle() {
  state.lastCardToggleAt = Date.now();
}

function recentlyToggledCard() {
  return Date.now() - (state.lastCardToggleAt || 0) < 450;
}

function setJapaneseVisibility(visible) {
  if (!els.showJapanese) return;
  const nextVisible = Boolean(visible);
  if (els.showJapanese.checked === nextVisible) return;
  els.showJapanese.checked = nextVisible;
  saveSettings();
  renderCard();
}

function isInteractiveElement(target) {
  return Boolean(target?.closest?.('button, input, select, textarea, label, summary, a, [data-jump]'));
}

function handleCardTap(event) {
  if (isInteractiveElement(event?.target)) return;
  markCardToggle();
  toggleFlip();
}

async function translateJapaneseToEnglish(text) {
  const requestId = ++state.translateRequestId;
  const endpoint = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=ja&tl=en&dt=t&q=${encodeURIComponent(text)}`;
  const response = await fetch(endpoint);
  if (!response.ok) {
    throw new Error('translation_failed');
  }
  const data = await response.json();
  if (requestId !== state.translateRequestId) {
    return null;
  }
  const translated = Array.isArray(data?.[0]) ? data[0].map(part => part?.[0] || '').join('') : '';
  return translated.trim();
}

async function runAutoTranslation({ immediate = false } = {}) {
  if (!els.editAnswerJa || !els.editAnswerEn || !els.autoTranslateJaToEn?.checked) return;
  const text = els.editAnswerJa.value.trim();
  if (!text) {
    if (immediate) els.editAnswerEn.value = '';
    return;
  }
  if (!navigator.onLine) {
    if (els.translateStatus) els.translateStatus.textContent = 'オフライン中は自動英訳できません。必要に応じて英語欄を直接編集してください。';
    return;
  }
  try {
    if (els.translateStatus) els.translateStatus.textContent = '日本語から英語へ自動反映中…';
    const translated = await translateJapaneseToEnglish(text);
    if (translated !== null) {
      els.editAnswerEn.value = translated;
      if (els.translateStatus) els.translateStatus.textContent = '英語回答へ自動反映しました。必要に応じて微調整できます。';
    }
  } catch {
    if (els.translateStatus) els.translateStatus.textContent = '自動英訳に失敗しました。英語欄を手動で編集してください。';
  }
}

function scheduleAutoTranslation() {
  clearTimeout(state.translateTimer);
  if (!state.editorOpen || !els.autoTranslateJaToEn?.checked) return;
  state.translateTimer = setTimeout(() => runAutoTranslation(), 650);
}

function buildEditPayload(item, answerJa, answerEn) {
  const trimmedJa = answerJa.trim();
  const trimmedEn = answerEn.trim();
  const sameJa = trimmedJa === (item.answerJa || '').trim();
  const sameEn = trimmedEn === (item.answerEn || '').trim();
  if (sameJa && sameEn) return null;
  return {
    answerJa: trimmedJa,
    answerEn: trimmedEn,
    updatedAt: new Date().toISOString(),
  };
}

async function saveCurrentEdit() {
  const item = getCurrentItem();
  if (!item || !els.editAnswerJa || !els.editAnswerEn) return;
  if (els.autoTranslateJaToEn?.checked) {
    await runAutoTranslation({ immediate: true });
  }
  const payload = buildEditPayload(item, els.editAnswerJa.value, els.editAnswerEn.value);
  if (payload) {
    state.editsMap[item.id] = payload;
  } else {
    delete state.editsMap[item.id];
  }
  saveEditsMap();
  if (els.translateStatus) {
    els.translateStatus.textContent = payload ? '編集を保存しました。' : '元の回答に戻したため、編集内容を解除しました。';
  }
  applyFilters(item.id);
}

function resetCurrentEdit() {
  const item = getCurrentItem();
  if (!item) return;
  delete state.editsMap[item.id];
  saveEditsMap();
  state.translateRequestId += 1;
  if (els.translateStatus) {
    els.translateStatus.textContent = 'このカードの編集を解除しました。';
  }
  applyFilters(item.id);
}

function toggleEditor(force) {
  state.editorOpen = typeof force === 'boolean' ? force : !state.editorOpen;
  els.editorPanel.classList.toggle('hidden', !state.editorOpen);
  if (els.toggleEditorBtn) {
    els.toggleEditorBtn.textContent = state.editorOpen ? '編集を閉じる' : '回答を編集';
  }
  renderEditor();
}

function goToIndex(index) {
  if (!state.visibleItems.length) return;
  stopSpeech();
  state.currentIndex = (index + state.visibleItems.length) % state.visibleItems.length;
  state.flipped = false;
  renderAll();
  scrollCardIntoView();
}

function nextCard() {
  goToIndex(state.currentIndex + 1);
}

function prevCard() {
  goToIndex(state.currentIndex - 1);
}

function toggleOkCurrent() {
  const item = getCurrentItem();
  if (!item) return;
  const willBecomeOk = !isOk(item);
  if (isOk(item)) {
    delete state.okMap[item.id];
  } else {
    state.okMap[item.id] = true;
  }
  saveOkMap();
  const currentId = item.id;
  applyFilters(currentId);
  if (els.autoNext.checked && willBecomeOk && state.visibleItems.length > 1) {
    nextCard();
  }
}

function resetAllOk() {
  const confirmed = window.confirm('すべてのOK状態を解除します。よろしいですか？');
  if (!confirmed) return;
  state.okMap = {};
  saveOkMap();
  applyFilters(getCurrentItem()?.id || null);
}

function randomizeCurrentView() {
  els.sortMode.value = 'random';
  applyFilters(getCurrentItem()?.id || null);
}

function handleFlashcardPointerDown(event) {
  if (isInteractiveElement(event?.target)) return;
  state.touch.startX = event.clientX;
  state.touch.startY = event.clientY;
  state.touch.startTime = Date.now();
}

function handleFlashcardPointerUp(event) {
  if (isInteractiveElement(event?.target)) return;

  const dx = event.clientX - state.touch.startX;
  const dy = event.clientY - state.touch.startY;
  const elapsed = Date.now() - state.touch.startTime;

  if (Math.abs(dx) > 34 && Math.abs(dx) > Math.abs(dy) * 1.15) {
    setJapaneseVisibility(dx > 0);
    state.touch.lastHandledAt = Date.now();
    return;
  }

  const isTap = Math.abs(dx) < 16 && Math.abs(dy) < 16 && elapsed < 500;
  if (isTap) {
    handleCardTap(event);
    state.touch.lastHandledAt = Date.now();
  }
}

function attachEvents() {
  [els.categoryFilter, els.tagFilter, els.statusFilter, els.sortMode].forEach(el => {
    el.addEventListener('change', () => applyFilters(getCurrentItem()?.id || null));
  });
  els.searchText.addEventListener('input', () => applyFilters(getCurrentItem()?.id || null));
  els.showJapanese.addEventListener('change', () => {
    saveSettings();
    renderCard();
  });
  els.autoNext.addEventListener('change', saveSettings);

  els.flipBtn.addEventListener('click', () => toggleFlip());
  els.okBtn.addEventListener('click', toggleOkCurrent);
  els.skipBtn.addEventListener('click', nextCard);
  els.prevBtn.addEventListener('click', prevCard);
  els.nextBtn.addEventListener('click', nextCard);
  els.resetOkBtn.addEventListener('click', resetAllOk);
  els.shuffleBtn.addEventListener('click', randomizeCurrentView);
  els.flashcard.addEventListener('pointerdown', handleFlashcardPointerDown, { passive: true });
  els.flashcard.addEventListener('pointerup', handleFlashcardPointerUp, { passive: true });
  els.flashcard.addEventListener('click', event => {
    if (Date.now() - (state.touch.lastHandledAt || 0) < 420) return;
    if (recentlyToggledCard()) return;
    handleCardTap(event);
  });

  els.playSpeechBtn?.addEventListener('click', () => playSpeech({ sourceValue: getSpeechSourceValue() }));
  els.pauseSpeechBtn?.addEventListener('click', pauseSpeech);
  els.resumeSpeechBtn?.addEventListener('click', resumeSpeech);
  els.stopSpeechBtn?.addEventListener('click', () => stopSpeech());
  els.repeatCurrentBtn?.addEventListener('click', toggleRepeatCurrent);
  els.repeatSelectionBtn?.addEventListener('click', startSelectionRepeat);
  els.speechSourceSelect?.addEventListener('change', () => {
    saveSettings();
    prepareSpeechSource(getSpeechSourceValue(), { keepSelection: false });
  });
  els.speechRepeatStart?.addEventListener('change', syncSpeechRangeBounds);
  els.speechRepeatEnd?.addEventListener('change', syncSpeechRangeBounds);
  els.voiceSelect?.addEventListener('change', () => {
    saveSettings();
    if (state.speech.mode !== 'idle') {
      const restartChunk = Math.max(state.speech.startChunk, state.speech.currentChunkIndex >= 0 ? state.speech.currentChunkIndex : state.speech.startChunk);
      playSpeech({
        sourceValue: state.speech.sourceValue || getSpeechSourceValue(),
        repeatMode: state.speech.repeatMode || 'off',
        startChunk: restartChunk,
        endChunk: state.speech.endChunk,
      });
      setSpeechStatus('音声を切り替えました。現在位置付近から再開しました。', 'success');
    }
  });
  els.speechRate?.addEventListener('input', () => {
    saveSettings();
    updateRateLabel();
    if (state.speech.mode !== 'idle') {
      const restartChunk = Math.max(state.speech.startChunk, state.speech.currentChunkIndex >= 0 ? state.speech.currentChunkIndex : state.speech.startChunk);
      playSpeech({
        sourceValue: state.speech.sourceValue || getSpeechSourceValue(),
        repeatMode: state.speech.repeatMode || 'off',
        startChunk: restartChunk,
        endChunk: state.speech.endChunk,
      });
      setSpeechStatus('再生速度を変更しました。現在位置付近から再開しました。', 'success');
    } else {
      updateSpeechUi();
    }
  });

  els.toggleEditorBtn?.addEventListener('click', () => toggleEditor());
  els.saveEditBtn?.addEventListener('click', saveCurrentEdit);
  els.resetEditBtn?.addEventListener('click', resetCurrentEdit);
  els.autoTranslateJaToEn?.addEventListener('change', () => {
    if (els.autoTranslateJaToEn.checked) {
      scheduleAutoTranslation();
    } else if (els.translateStatus) {
      els.translateStatus.textContent = '自動反映をオフにしました。英語欄を手動で編集できます。';
    }
  });
  els.editAnswerJa?.addEventListener('input', scheduleAutoTranslation);

  els.importExcelBtn?.addEventListener('click', importExcelFile);
  els.resetImportedDataBtn?.addEventListener('click', resetImportedDataset);
  els.saveRemoteConfigBtn?.addEventListener('click', async () => {
    saveRemoteConfig();
    if (state.remoteConfig.endpoint) {
      setRemoteStatus('共有設定を保存しました。最新データを確認します…', 'loading');
      await syncRemoteDataset({ silent: false, force: true });
    } else {
      setRemoteStatus('共有設定を保存しました。API URLが未設定のため、この端末だけで動作します。');
    }
  });
  els.syncRemoteBtn?.addEventListener('click', () => syncRemoteDataset({ silent: false, force: true }));
  els.autoSyncRemote?.addEventListener('change', saveRemoteConfig);

  els.cardList.addEventListener('click', event => {
    const button = event.target.closest('[data-jump]');
    if (!button) return;
    const id = button.getAttribute('data-jump');
    const index = state.visibleItems.findIndex(item => item.id === id);
    if (index >= 0) goToIndex(index);
  });

  document.addEventListener('keydown', event => {
    const tag = document.activeElement?.tagName?.toLowerCase();
    const typing = tag === 'input' || tag === 'textarea' || document.activeElement?.isContentEditable;
    if (typing && event.key !== 'Escape') return;

    if (event.code === 'Space') {
      event.preventDefault();
      toggleFlip();
    } else if (event.key === 'ArrowRight') {
      nextCard();
    } else if (event.key === 'ArrowLeft') {
      prevCard();
    } else if (event.key.toLowerCase() === 'o') {
      toggleOkCurrent();
    } else if (event.key.toLowerCase() === 'r') {
      randomizeCurrentView();
    }
  });

  window.addEventListener('online', () => {
    renderEditor();
    syncRemoteDataset({ silent: true, force: true });
  });
  window.addEventListener('offline', renderEditor);
  window.addEventListener('focus', () => syncRemoteDataset({ silent: true }));
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      syncRemoteDataset({ silent: true });
    }
  });
  if ('speechSynthesis' in window) {
    window.speechSynthesis.addEventListener?.('voiceschanged', populateVoiceOptions);
    populateVoiceOptions();
    setTimeout(populateVoiceOptions, 300);
  }
}

function init() {
  populateRemoteConfigFields();
  const cachedRemoteDataset = state.remotePayload?.dataset?.items?.length ? state.remotePayload.dataset : null;
  const startingData = cachedRemoteDataset || (state.importedData?.items?.length ? state.importedData : DEFAULT_DATA);
  installDataset(startingData, { imported: Boolean(!cachedRemoteDataset && state.importedData?.items?.length) });
  buildFilters();
  attachEvents();
  applyFilters();
  prepareSpeechSource(getSpeechSourceValue(), { keepSelection: false });
  updateSpeechUi();
  scheduleRemoteSync();

  if (cachedRemoteDataset) {
    setRemoteStatus(`前回同期した共有データを表示中（${describeRemotePayload(state.remotePayload)}）`, 'success');
    if (els.importStatus) {
      els.importStatus.textContent = `前回同期した共有データ（${cachedRemoteDataset.items.length}件）を復元しました。`;
    }
  } else if (state.importedData?.items?.length && els.importStatus) {
    els.importStatus.textContent = `前回読み込んだExcelの内容（${state.importedData.items.length}件）を復元しました。`;
  }

  if (state.remoteConfig.endpoint) {
    syncRemoteDataset({ silent: false, force: true });
  } else {
    setRemoteStatus('共有データAPI URLを設定すると、Excelアップロード内容を全端末へ自動反映できます。');
  }
}

init();
