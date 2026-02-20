const STORAGE_KEYS = {
  credits: "cv_credits",
  apiBase: "cv_api_base",
  apiKey: "cv_api_key",
  model: "cv_model",
  template: "cv_template",
  language: "cv_language",
  onePage: "cv_one_page",
  theme: "cv_theme",
  previewRect: "cv_preview_rect",
  previewMiniRect: "cv_preview_mini_rect"
};

const PLATFORM_SHARED_KEY = "";
const DEFAULT_API_BASE = "https://api.moonshot.cn/v1/chat/completions";
const DEFAULT_API_KEY = "sk-Lld2oG9Tygh98LT73biIOy1ymzHwSrrFAEVJM1kR9zGkWZVE";
const DEFAULT_MODEL = "moonshot-v1-8k";
const DEFAULT_TEMPLATE = "elegant";
const DEFAULT_LANGUAGE = "zh";
const DEFAULT_THEME = "sand";

const form = document.getElementById("resumeForm");
const modeSelect = document.getElementById("modeSelect");
const ownKeyBlock = document.getElementById("ownKeyBlock");
const creditsBlock = document.getElementById("creditsBlock");
const apiBaseInput = document.getElementById("apiBase");
const apiKeyInput = document.getElementById("apiKey");
const modelSelect = document.getElementById("modelSelect");
const refreshModelsBtn = document.getElementById("refreshModelsBtn");
const styleSelect = document.getElementById("styleSelect");
const templateSelect = document.getElementById("templateSelect");
const themeSelect = document.getElementById("themeSelect");
const languageSelect = document.getElementById("languageSelect");
const onePageToggle = document.getElementById("onePageToggle");
const generateBtn = document.getElementById("generateBtn");
const downloadBtn = document.getElementById("downloadBtn");
const statusEl = document.getElementById("status");
const previewEl = document.getElementById("resumePreview");
const previewFloat = document.getElementById("previewFloat");
const previewBackdrop = document.getElementById("previewBackdrop");
const previewToggleBtn = document.getElementById("previewToggleBtn");
const previewMiniGrowBtn = document.getElementById("previewMiniGrowBtn");
const previewMiniShrinkBtn = document.getElementById("previewMiniShrinkBtn");
const previewCollapseBtn = document.getElementById("previewCollapseBtn");
const previewDragHandle = document.getElementById("previewDragHandle");
const previewResizeHandle = document.getElementById("previewResizeHandle");
const previewMiniHead = document.querySelector(".preview-mini-head");
const previewFloatPanel = document.querySelector(".preview-float-panel");
const creditBalanceEl = document.getElementById("creditBalance");
const buyBtns = Array.from(document.querySelectorAll("button[data-pack]"));
const mockProfileSelect = document.getElementById("mockProfileSelect");
const fillMockBtn = document.getElementById("fillMockBtn");
const oneClickTestBtn = document.getElementById("oneClickTestBtn");

let resumeData = null;
let previewRect = null;
let previewMiniRect = null;
let dragState = null;
let resizeState = null;

init();

function init() {
  const savedBase = localStorage.getItem(STORAGE_KEYS.apiBase);
  const savedKey = localStorage.getItem(STORAGE_KEYS.apiKey);
  const savedModel = localStorage.getItem(STORAGE_KEYS.model);
  const savedCredits = Number(localStorage.getItem(STORAGE_KEYS.credits) || 0);
  const savedTemplate = localStorage.getItem(STORAGE_KEYS.template) || DEFAULT_TEMPLATE;
  const savedLanguage = localStorage.getItem(STORAGE_KEYS.language) || DEFAULT_LANGUAGE;
  const savedTheme = localStorage.getItem(STORAGE_KEYS.theme) || DEFAULT_THEME;
  const savedOnePage = localStorage.getItem(STORAGE_KEYS.onePage);

  apiBaseInput.value = savedBase || DEFAULT_API_BASE;
  apiKeyInput.value = savedKey || DEFAULT_API_KEY;
  templateSelect.value = savedTemplate;
  languageSelect.value = savedLanguage;
  themeSelect.value = savedTheme;
  onePageToggle.checked = savedOnePage === null ? true : savedOnePage === "1";

  setModelOptions([savedModel || DEFAULT_MODEL], savedModel || DEFAULT_MODEL);
  setCredits(savedCredits);

  modeSelect.addEventListener("change", renderMode);
  templateSelect.addEventListener("change", onPreviewPreferenceChanged);
  themeSelect.addEventListener("change", onPreviewPreferenceChanged);
  languageSelect.addEventListener("change", onPreviewPreferenceChanged);
  onePageToggle.addEventListener("change", onPreviewPreferenceChanged);

  apiBaseInput.addEventListener("change", () => {
    localStorage.setItem(STORAGE_KEYS.apiBase, apiBaseInput.value.trim());
    loadModelsFromAPI(false);
  });

  apiKeyInput.addEventListener("change", () => {
    localStorage.setItem(STORAGE_KEYS.apiKey, apiKeyInput.value.trim());
    loadModelsFromAPI(false);
  });

  modelSelect.addEventListener("change", () => {
    localStorage.setItem(STORAGE_KEYS.model, modelSelect.value);
  });

  buyBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const n = Number(btn.dataset.pack || 0);
      const next = getCredits() + n;
      setCredits(next);
      setStatus(`购买成功，已增加 ${n} 次，当前余额 ${next}。`);
    });
  });

  generateBtn.addEventListener("click", onGenerate);
  downloadBtn.addEventListener("click", onDownloadPDF);
  fillMockBtn.addEventListener("click", onFillMockData);
  oneClickTestBtn.addEventListener("click", onOneClickTest);
  refreshModelsBtn.addEventListener("click", () => loadModelsFromAPI(true));
  previewToggleBtn.addEventListener("click", togglePreviewFloat);
  previewMiniGrowBtn.addEventListener("click", (event) => {
    event.stopPropagation();
    adjustMiniPreviewHeight(180);
  });
  previewMiniShrinkBtn.addEventListener("click", (event) => {
    event.stopPropagation();
    adjustMiniPreviewHeight(-180);
  });
  previewCollapseBtn.addEventListener("click", (event) => {
    event.stopPropagation();
    closePreviewFloat();
  });
  previewBackdrop.addEventListener("click", closePreviewFloat);
  previewMiniHead.addEventListener("pointerdown", onPreviewDragStart);
  previewFloatPanel.addEventListener("click", () => {
    if (previewFloat.classList.contains("is-mini")) openPreviewFloat();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closePreviewFloat();
  });
  previewDragHandle.addEventListener("pointerdown", onPreviewDragStart);
  if (previewResizeHandle) {
    previewResizeHandle.addEventListener("pointerdown", onPreviewResizeStart);
  }
  previewFloat.addEventListener("transitionend", () => {
    if (previewFloat.classList.contains("is-mini")) {
      scheduleMiniPreviewViewportUpdate();
    }
  });
  window.addEventListener("resize", onWindowResize);

  renderMode();
  loadModelsFromAPI(false);
  applyPreviewPrefs();
  mountInlineFieldHints();
  previewRect = loadPreviewRect();
  previewMiniRect = loadPreviewMiniRect();
  applyMiniRect(previewMiniRect || getDefaultMiniRect());
}

function mountInlineFieldHints() {
  const fields = document.querySelectorAll("input[placeholder], textarea[placeholder]");
  fields.forEach((field) => {
    const hintText = String(field.getAttribute("placeholder") || "").trim();
    if (!hintText) return;
    const label = field.closest("label");
    if (label && !label.querySelector(".label-hint")) {
      const hint = document.createElement("span");
      hint.className = "label-hint";
      hint.textContent = `（${hintText}）`;
      label.insertBefore(hint, field);
    }
    field.removeAttribute("placeholder");
  });
}

function openPreviewFloat() {
  previewFloat.classList.remove("is-mini");
  previewFloat.classList.add("is-expanded");
  document.body.classList.add("preview-open");
  applyOrInitPreviewRect();
  clearMiniPreviewTransform();
}

function closePreviewFloat() {
  previewFloat.classList.remove("is-expanded");
  previewFloat.classList.add("is-mini");
  document.body.classList.remove("preview-open");
  applyMiniRect(previewMiniRect || getDefaultMiniRect());
  scheduleMiniPreviewViewportUpdate();
}

function togglePreviewFloat() {
  if (previewFloat.classList.contains("is-expanded")) {
    closePreviewFloat();
  } else {
    openPreviewFloat();
  }
}

function getViewportPreviewBounds() {
  const margin = 12;
  return {
    margin,
    minW: 520,
    minH: 420,
    maxW: window.innerWidth - margin * 2,
    maxH: window.innerHeight - margin * 2
  };
}

function getViewportMiniBounds() {
  const margin = 12;
  return {
    margin,
    minW: 300,
    minH: 190,
    maxW: Math.min(620, window.innerWidth - margin * 2),
    maxH: Math.min(760, window.innerHeight - margin * 2)
  };
}

function clampPreviewRect(rect) {
  const b = getViewportPreviewBounds();
  const width = Math.max(Math.min(rect.width, b.maxW), Math.min(b.minW, b.maxW));
  const height = Math.max(Math.min(rect.height, b.maxH), Math.min(b.minH, b.maxH));
  const left = Math.min(Math.max(rect.left, b.margin), window.innerWidth - width - b.margin);
  const top = Math.min(Math.max(rect.top, b.margin), window.innerHeight - height - b.margin);
  return { left, top, width, height };
}

function clampMiniRect(rect) {
  const b = getViewportMiniBounds();
  const width = Math.max(Math.min(rect.width, b.maxW), Math.min(b.minW, b.maxW));
  const height = Math.max(Math.min(rect.height, b.maxH), Math.min(b.minH, b.maxH));
  const left = Math.min(Math.max(rect.left, b.margin), window.innerWidth - width - b.margin);
  const top = Math.min(Math.max(rect.top, b.margin), window.innerHeight - height - b.margin);
  return { left, top, width, height };
}

function getDefaultPreviewRect() {
  const width = Math.min(1120, window.innerWidth - 36);
  const height = Math.min(window.innerHeight - 24, Math.max(860, Math.round((window.innerHeight - 24) * 0.96)));
  const left = Math.round((window.innerWidth - width) / 2);
  const top = 12;
  return clampPreviewRect({ left, top, width, height });
}

function getDefaultMiniRect() {
  const width = Math.min(460, window.innerWidth - 24);
  const height = 420;
  const left = window.innerWidth - width - 18;
  const top = window.innerHeight - height - 18;
  return clampMiniRect({ left, top, width, height });
}

function applyPreviewRect(rect) {
  const next = clampPreviewRect(rect);
  previewFloat.style.left = `${next.left}px`;
  previewFloat.style.top = `${next.top}px`;
  previewFloat.style.width = `${next.width}px`;
  previewFloat.style.height = `${next.height}px`;
  previewFloat.style.right = "auto";
  previewFloat.style.bottom = "auto";
  previewFloat.style.transform = "none";
  previewRect = next;
}

function applyMiniRect(rect) {
  const next = clampMiniRect(rect);
  previewFloat.style.left = `${next.left}px`;
  previewFloat.style.top = `${next.top}px`;
  previewFloat.style.width = `${next.width}px`;
  previewFloat.style.height = `${next.height}px`;
  previewFloat.style.right = "auto";
  previewFloat.style.bottom = "auto";
  previewFloat.style.transform = "none";
  previewMiniRect = next;
  if (previewFloat.classList.contains("is-mini")) {
    scheduleMiniPreviewViewportUpdate();
  }
}

function adjustMiniPreviewHeight(delta) {
  const current = previewMiniRect || getDefaultMiniRect();
  applyMiniRect({
    left: current.left,
    top: current.top,
    width: current.width,
    height: current.height + delta
  });
  savePreviewMiniRect();
}

function savePreviewRect() {
  if (!previewRect) return;
  localStorage.setItem(STORAGE_KEYS.previewRect, JSON.stringify(previewRect));
}

function savePreviewMiniRect() {
  if (!previewMiniRect) return;
  localStorage.setItem(STORAGE_KEYS.previewMiniRect, JSON.stringify(previewMiniRect));
}

function loadPreviewRect() {
  const raw = localStorage.getItem(STORAGE_KEYS.previewRect);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (
      typeof parsed?.left === "number" &&
      typeof parsed?.top === "number" &&
      typeof parsed?.width === "number" &&
      typeof parsed?.height === "number"
    ) {
      const normalized = clampPreviewRect(parsed);
      if (normalized.height < 760) return null;
      return normalized;
    }
  } catch {}
  return null;
}

function loadPreviewMiniRect() {
  const raw = localStorage.getItem(STORAGE_KEYS.previewMiniRect);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (
      typeof parsed?.left === "number" &&
      typeof parsed?.top === "number" &&
      typeof parsed?.width === "number" &&
      typeof parsed?.height === "number"
    ) {
      return clampMiniRect(parsed);
    }
  } catch {}
  return null;
}

function applyOrInitPreviewRect() {
  applyPreviewRect(previewRect || getDefaultPreviewRect());
}

function onPreviewDragStart(event) {
  if (event.target.closest("button")) return;
  if (event.button !== 0) return;
  event.preventDefault();
  const isMini = previewFloat.classList.contains("is-mini");
  const currentRect = isMini
    ? previewMiniRect || getDefaultMiniRect()
    : previewRect || getDefaultPreviewRect();
  dragState = {
    pointerId: event.pointerId,
    startX: event.clientX,
    startY: event.clientY,
    startLeft: currentRect.left,
    startTop: currentRect.top,
    mode: isMini ? "mini" : "expanded"
  };
  window.addEventListener("pointermove", onPreviewDragMove);
  window.addEventListener("pointerup", onPreviewDragEnd);
}

function onPreviewDragMove(event) {
  if (!dragState) return;
  if (event.pointerId !== dragState.pointerId) return;
  const left = dragState.startLeft + (event.clientX - dragState.startX);
  const top = dragState.startTop + (event.clientY - dragState.startY);
  if (dragState.mode === "mini") {
    const rect = previewMiniRect || getDefaultMiniRect();
    applyMiniRect({ left, top, width: rect.width, height: rect.height });
  } else {
    const rect = previewRect || getDefaultPreviewRect();
    applyPreviewRect({ left, top, width: rect.width, height: rect.height });
  }
}

function onPreviewDragEnd() {
  if (!dragState) return;
  if (dragState.mode === "mini") savePreviewMiniRect();
  if (dragState.mode === "expanded") savePreviewRect();
  dragState = null;
  window.removeEventListener("pointermove", onPreviewDragMove);
  window.removeEventListener("pointerup", onPreviewDragEnd);
}

function onPreviewResizeStart(event) {
  if (event.button !== 0) return;
  event.preventDefault();
  const isMini = previewFloat.classList.contains("is-mini");
  const currentRect = isMini
    ? previewMiniRect || getDefaultMiniRect()
    : previewRect || getDefaultPreviewRect();
  resizeState = {
    pointerId: event.pointerId,
    startX: event.clientX,
    startY: event.clientY,
    startWidth: currentRect.width,
    startHeight: currentRect.height,
    startLeft: currentRect.left,
    startTop: currentRect.top,
    mode: isMini ? "mini" : "expanded"
  };
  window.addEventListener("pointermove", onPreviewResizeMove);
  window.addEventListener("pointerup", onPreviewResizeEnd);
}

function onPreviewResizeMove(event) {
  if (!resizeState) return;
  if (event.pointerId !== resizeState.pointerId) return;
  const width = resizeState.startWidth + (event.clientX - resizeState.startX);
  const height = resizeState.startHeight + (event.clientY - resizeState.startY);
  if (resizeState.mode === "mini") {
    applyMiniRect({ left: resizeState.startLeft, top: resizeState.startTop, width, height });
  } else {
    applyPreviewRect({ left: resizeState.startLeft, top: resizeState.startTop, width, height });
  }
}

function onPreviewResizeEnd() {
  if (!resizeState) return;
  if (resizeState.mode === "mini") savePreviewMiniRect();
  if (resizeState.mode === "expanded") savePreviewRect();
  resizeState = null;
  window.removeEventListener("pointermove", onPreviewResizeMove);
  window.removeEventListener("pointerup", onPreviewResizeEnd);
}

function onWindowResize() {
  if (previewRect) {
    previewRect = clampPreviewRect(previewRect);
    if (previewFloat.classList.contains("is-expanded")) {
      applyPreviewRect(previewRect);
    }
    savePreviewRect();
  }
  if (previewMiniRect) {
    previewMiniRect = clampMiniRect(previewMiniRect);
    if (previewFloat.classList.contains("is-mini")) {
      applyMiniRect(previewMiniRect);
    }
    savePreviewMiniRect();
  }
  if (previewFloat.classList.contains("is-mini")) {
    scheduleMiniPreviewViewportUpdate();
  }
}

function clearMiniPreviewTransform() {
  previewEl.style.transform = "";
  previewEl.style.transformOrigin = "";
}

function scheduleMiniPreviewViewportUpdate() {
  requestAnimationFrame(updateMiniPreviewViewport);
  setTimeout(() => {
    if (previewFloat.classList.contains("is-mini")) {
      updateMiniPreviewViewport();
    }
  }, 260);
}

function updateMiniPreviewViewport() {
  if (!previewFloat.classList.contains("is-mini")) return;
  if (!previewFloatPanel) return;

  clearMiniPreviewTransform();
  const panelWidth = previewFloatPanel.clientWidth;
  const panelHeight = previewFloatPanel.clientHeight;
  const contentWidth = previewEl.scrollWidth;
  const contentHeight = previewEl.scrollHeight;

  if (!panelWidth || !panelHeight || !contentWidth || !contentHeight) return;
  const scale = Math.min(panelWidth / contentWidth, panelHeight / contentHeight);
  const offsetX = (panelWidth - contentWidth * scale) / 2;
  const offsetY = (panelHeight - contentHeight * scale) / 2;

  previewEl.style.transformOrigin = "top left";
  previewEl.style.transform = `translate(${offsetX}px, ${offsetY}px) scale(${scale})`;
}

function onPreviewPreferenceChanged() {
  localStorage.setItem(STORAGE_KEYS.template, templateSelect.value);
  localStorage.setItem(STORAGE_KEYS.theme, themeSelect.value);
  localStorage.setItem(STORAGE_KEYS.language, languageSelect.value);
  localStorage.setItem(STORAGE_KEYS.onePage, onePageToggle.checked ? "1" : "0");
  applyPreviewPrefs();
  if (resumeData) {
    renderResume(resumeData);
  }
}

function applyPreviewPrefs() {
  previewEl.classList.remove("template-elegant", "template-modern", "template-minimal");
  previewEl.classList.add(`template-${templateSelect.value}`);
  document.body.classList.remove("theme-sand", "theme-forest", "theme-ocean");
  document.body.classList.add(`theme-${themeSelect.value}`);
}

function renderMode() {
  const mode = modeSelect.value;
  ownKeyBlock.classList.toggle("hidden", mode !== "own-key");
  creditsBlock.classList.toggle("hidden", mode !== "credits");
}

function setCredits(value) {
  localStorage.setItem(STORAGE_KEYS.credits, String(value));
  creditBalanceEl.textContent = String(value);
}

function getCredits() {
  return Number(localStorage.getItem(STORAGE_KEYS.credits) || 0);
}

function setStatus(text, isError = false) {
  statusEl.textContent = text;
  statusEl.style.color = isError ? "#a83618" : "#5d6a67";
}

function inferModelsEndpoint(apiBase) {
  const fallback = "https://api.moonshot.cn/v1/models";
  try {
    const url = new URL(apiBase);
    const version = url.pathname.match(/\/(v\d+)\b/i)?.[1] || "v1";
    url.pathname = `/${version}/models`;
    url.search = "";
    url.hash = "";
    return url.toString();
  } catch {
    return fallback;
  }
}

function setModelOptions(models, selected) {
  const unique = Array.from(new Set(models.filter(Boolean)));
  if (!unique.length) unique.push(DEFAULT_MODEL);
  modelSelect.innerHTML = unique.map((id) => `<option value="${escapeHtml(id)}">${escapeHtml(id)}</option>`).join("");
  modelSelect.value = unique.includes(selected) ? selected : unique[0];
  localStorage.setItem(STORAGE_KEYS.model, modelSelect.value);
}

async function loadModelsFromAPI(showStatus = false) {
  const base = apiBaseInput.value.trim();
  const apiKey = apiKeyInput.value.trim();
  if (!base || !apiKey) return;

  const endpoint = inferModelsEndpoint(base);
  try {
    if (showStatus) setStatus("正在读取可用模型列表...");
    refreshModelsBtn.disabled = true;
    const resp = await fetch(endpoint, {
      method: "GET",
      headers: { Authorization: `Bearer ${apiKey}` }
    });
    if (!resp.ok) throw new Error(`模型列表请求失败：${resp.status}`);

    const json = await resp.json();
    const ids = Array.isArray(json?.data) ? json.data.map((x) => String(x?.id || "")).filter(Boolean) : [];
    const preferred = localStorage.getItem(STORAGE_KEYS.model) || DEFAULT_MODEL;
    setModelOptions(ids.length ? ids : [preferred], preferred);
    if (showStatus) setStatus(`已加载 ${ids.length || 1} 个模型。`);
  } catch (err) {
    const keep = modelSelect.value || localStorage.getItem(STORAGE_KEYS.model) || DEFAULT_MODEL;
    setModelOptions([keep], keep);
    if (showStatus) setStatus(err.message || "读取模型列表失败。", true);
  } finally {
    refreshModelsBtn.disabled = false;
  }
}

function collectFormData() {
  const fd = new FormData(form);
  const getLines = (k) =>
    String(fd.get(k) || "")
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);

  const getComma = (k) =>
    String(fd.get(k) || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

  return {
    name: String(fd.get("name") || "").trim(),
    title: String(fd.get("title") || "").trim(),
    email: String(fd.get("email") || "").trim(),
    phone: String(fd.get("phone") || "").trim(),
    summary: String(fd.get("summary") || "").trim(),
    experience: getLines("experience"),
    education: getLines("education"),
    skills: getComma("skills"),
    projects: getLines("projects")
  };
}

function setFormData(data) {
  form.elements.name.value = data.name || "";
  form.elements.title.value = data.title || "";
  form.elements.email.value = data.email || "";
  form.elements.phone.value = data.phone || "";
  form.elements.summary.value = data.summary || "";
  form.elements.experience.value = (data.experience || []).join("\n");
  form.elements.education.value = (data.education || []).join("\n");
  form.elements.skills.value = (data.skills || []).join(", ");
  form.elements.projects.value = (data.projects || []).join("\n");
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRecentYear(offset = 0) {
  return new Date().getFullYear() - offset;
}

function buildMockProfile(type) {
  const names = {
    frontend: ["林沐阳", "陈奕辰", "赵清和", "周可欣"],
    product: ["王若宁", "宋知遥", "叶嘉诚", "顾思远"],
    operation: ["徐一凡", "唐舒然", "邵景言", "梁语岚"]
  };

  const base = {
    frontend: {
      title: "高级前端工程师",
      emailDomain: "example-tech.com",
      summary: "专注 B 端与增长场景前端建设，擅长通过工程化、性能优化与数据驱动手段提升核心业务指标。",
      skills: ["TypeScript", "React", "Next.js", "Node.js", "Vitest", "A/B Test", "数据埋点"],
      experience: [
        `${getRecentYear(0)}-至今｜云帆科技｜前端工程师｜主导营销中台重构，将页面首屏耗时降低 ${randomInt(28, 42)}%，线索转化率提升 ${randomInt(12, 25)}%。`,
        `${getRecentYear(3)}-${getRecentYear(0)}｜远图信息｜前端工程师｜搭建组件库与脚手架，项目交付周期缩短 ${randomInt(20, 35)}%，线上缺陷率下降 ${randomInt(18, 32)}%。`,
        `${getRecentYear(5)}-${getRecentYear(3)}｜象限互动｜前端开发｜负责活动平台与可视化看板，支撑日峰值访问 ${randomInt(80, 150)} 万。`
      ],
      education: [`${getRecentYear(10)}-${getRecentYear(6)}｜华东理工大学｜软件工程（本科）`],
      projects: [
        `增长实验平台｜React + Node.js｜统一实验配置与指标回流，季度实验数量提升 ${randomInt(2, 4)} 倍。`,
        `官网性能治理｜Next.js + Lighthouse CI｜核心页面 LCP 稳定在 ${randomInt(1, 2)}.${randomInt(2, 9)}s。`
      ]
    },
    product: {
      title: "高级产品经理",
      emailDomain: "pm-lab.com",
      summary: "负责从 0 到 1 的产品规划与商业化增长，擅长用户研究、需求拆解和跨团队协作推进。",
      skills: ["用户研究", "PRD", "SQL", "增长策略", "Axure", "Figma", "项目管理"],
      experience: [
        `${getRecentYear(0)}-至今｜北极星软件｜产品经理｜负责企业协同产品路线图，新增付费企业 ${randomInt(120, 260)} 家，续费率提升 ${randomInt(8, 16)}%。`,
        `${getRecentYear(4)}-${getRecentYear(0)}｜启明数据｜产品经理｜搭建客户分层策略和自动化触达流程，人均运营效率提升 ${randomInt(25, 45)}%。`,
        `${getRecentYear(6)}-${getRecentYear(4)}｜量子网络｜产品专员｜参与核心交易链路优化，转化漏斗流失率下降 ${randomInt(10, 22)}%。`
      ],
      education: [`${getRecentYear(11)}-${getRecentYear(7)}｜同济大学｜信息管理与信息系统（本科）`],
      projects: [
        `企业订阅改版｜策略设计 + 数据分析｜推动三档套餐上线，ARPU 提升 ${randomInt(11, 23)}%。`,
        `客户洞察中心｜需求定义 + 跨团队实施｜NPS 提升 ${randomInt(9, 18)} 分。`
      ]
    },
    operation: {
      title: "增长运营经理",
      emailDomain: "growth-demo.com",
      summary: "擅长以用户生命周期为主线构建增长体系，结合内容、活动和自动化触达驱动转化与留存。",
      skills: ["增长模型", "活动运营", "用户分层", "CRM", "数据分析", "内容策略", "私域运营"],
      experience: [
        `${getRecentYear(0)}-至今｜曜石教育｜增长运营｜设计拉新-激活闭环，月均新增线索提升 ${randomInt(30, 55)}%，首购转化提升 ${randomInt(14, 26)}%。`,
        `${getRecentYear(3)}-${getRecentYear(0)}｜星河电商｜运营主管｜负责会员体系升级，复购率提升 ${randomInt(9, 21)}%，沉睡用户召回率提升 ${randomInt(12, 27)}%。`,
        `${getRecentYear(5)}-${getRecentYear(3)}｜青岚传媒｜运营专员｜策划直播与专题活动，单场 GMV 峰值突破 ${randomInt(80, 160)} 万。`
      ],
      education: [`${getRecentYear(9)}-${getRecentYear(5)}｜华南师范大学｜市场营销（本科）`],
      projects: [
        `全渠道拉新战役｜内容 + 社群 + 投放协同｜季度获客成本下降 ${randomInt(13, 24)}%。`,
        `会员成长体系｜标签体系 + 自动化触达｜90 天留存率提升 ${randomInt(10, 19)}%。`
      ]
    }
  };

  const profile = base[type] || base.frontend;
  const name = pick(names[type] || names.frontend);
  const emailPrefix = `${name.toLowerCase().replace(/\s+/g, "")}${randomInt(6, 96)}`;

  return {
    name,
    title: profile.title,
    email: `${emailPrefix}@${profile.emailDomain}`,
    phone: `1${randomInt(3, 9)}${randomInt(1000, 9999)}${randomInt(1000, 9999)}`,
    summary: profile.summary,
    experience: profile.experience,
    education: profile.education,
    skills: profile.skills,
    projects: profile.projects
  };
}

function onFillMockData() {
  const type = mockProfileSelect.value;
  const mock = buildMockProfile(type);
  setFormData(mock);
  setStatus("已填充一份高拟真模拟数据，可直接点击生成。", false);
}

async function onOneClickTest() {
  if (generateBtn.disabled) return;
  setFormData(buildMockProfile(mockProfileSelect.value));
  if (!apiKeyInput.value.trim()) {
    setStatus("请先在“使用我的 API Key”模式填入 Key，再执行一键测试。", true);
    return;
  }

  modeSelect.value = "own-key";
  renderMode();
  apiBaseInput.value = DEFAULT_API_BASE;
  localStorage.setItem(STORAGE_KEYS.apiBase, DEFAULT_API_BASE);
  localStorage.setItem(STORAGE_KEYS.apiKey, apiKeyInput.value.trim());
  setStatus("已注入模拟数据，正在测试生成流程...");
  await loadModelsFromAPI(false);
  await onGenerate();
}

function validateData(data) {
  if (!data.name || !data.title) throw new Error("请至少填写姓名和目标岗位。");
}

async function onGenerate() {
  try {
    const baseData = collectFormData();
    validateData(baseData);
    const mode = modeSelect.value;
    const languageMode = languageSelect.value;

    setStatus("正在生成，请稍候...");
    generateBtn.disabled = true;

    if (mode === "local") {
      resumeData = buildLocalResume(baseData, styleSelect.value, languageMode);
    } else {
      const credential = resolveCredential(mode);
      resumeData = await generateFromAPI(baseData, styleSelect.value, languageMode, credential);
      if (mode === "credits") setCredits(getCredits() - 1);
    }

    renderResume(resumeData);
    setStatus("生成完成，可直接下载 PDF。", false);
  } catch (err) {
    setStatus(err.message || "生成失败，请重试。", true);
  } finally {
    generateBtn.disabled = false;
  }
}

function resolveCredential(mode) {
  if (mode === "own-key") {
    const key = apiKeyInput.value.trim();
    const base = apiBaseInput.value.trim();
    const model = modelSelect.value.trim();
    if (!key) throw new Error("请填写你的 API Key。");
    if (!base) throw new Error("请填写 API 地址。");
    if (!model) throw new Error("请先选择可用模型。");
    return { apiKey: key, apiBase: base, model };
  }

  if (mode === "credits") {
    const credits = getCredits();
    if (credits <= 0) throw new Error("次数不足，请先购买次数。");
    if (!PLATFORM_SHARED_KEY) throw new Error("当前未配置平台密钥。纯前端无法安全托管平台密钥，请改用“我的 API Key”模式。");
    return {
      apiKey: PLATFORM_SHARED_KEY,
      apiBase: apiBaseInput.value.trim() || DEFAULT_API_BASE,
      model: modelSelect.value.trim() || DEFAULT_MODEL
    };
  }

  throw new Error("未知模式");
}

function buildLocalResume(baseData, tone, languageMode) {
  const toneMap = {
    professional: "注重结果与可信表达",
    creative: "表达有亮点但不夸张",
    concise: "短句高信息密度"
  };

  const polishedSummary = baseData.summary
    ? `${baseData.summary}，${toneMap[tone]}。`
    : `${baseData.title}方向候选人，${toneMap[tone]}。`;

  const normalized = {
    ...baseData,
    summary: polishedSummary,
    experience: baseData.experience.length ? baseData.experience : ["暂无正式经历，建议补充实习/项目成果。"],
    projects: baseData.projects.length ? baseData.projects : ["可补充 2-3 个最有代表性的项目。"],
    education: baseData.education.length ? baseData.education : ["请补充教育经历"],
    skills: baseData.skills.length ? baseData.skills : ["沟通", "学习能力", "执行力"]
  };

  const en = buildPseudoEnglishResume(normalized);
  if (languageMode === "en") {
    const englishResume = {
      ...normalized,
      summary: en.summary,
      experience: en.experience,
      education: en.education,
      skills: en.skills,
      projects: en.projects,
      title: en.title,
      en
    };
    return {
      ...englishResume,
      aiHtml: buildLocalPolishedHtml(englishResume, "en")
    };
  }

  const zhOrBiResume = {
    ...normalized,
    en: languageMode === "bilingual" ? en : null
  };
  return {
    ...zhOrBiResume,
    aiHtml: buildLocalPolishedHtml(zhOrBiResume, languageMode)
  };
}

function mapCNRoleToEN(title) {
  const map = {
    "前端": "Frontend Engineer",
    "产品": "Product Manager",
    "运营": "Growth Operations Manager",
    "设计": "Designer",
    "数据": "Data Analyst",
    "后端": "Backend Engineer"
  };

  for (const key of Object.keys(map)) {
    if (title.includes(key)) return map[key];
  }
  return "Professional Candidate";
}

function buildPseudoEnglishResume(data) {
  return {
    title: mapCNRoleToEN(data.title),
    summary: `Experienced in ${mapCNRoleToEN(data.title).toLowerCase()} work with a strong focus on measurable outcomes and collaboration.`,
    experience: data.experience.map((x) => `Led and delivered: ${normalizeSentence(x)}`),
    education: data.education.map((x) => `Education: ${normalizeSentence(x)}`),
    skills: data.skills.map((x) => normalizeWord(x)),
    projects: data.projects.map((x) => `Project impact: ${normalizeSentence(x)}`)
  };
}

function normalizeSentence(text) {
  return String(text || "")
    .replaceAll("｜", " - ")
    .replaceAll("，", ", ")
    .replaceAll("。", ".")
    .trim();
}

function normalizeWord(text) {
  return String(text || "").replaceAll("，", ",").trim();
}

async function generateFromAPI(baseData, tone, languageMode, credential) {
  const systemPrompt = [
    "你是资深简历总监与文案专家，擅长在信息不足时进行合理补全与专业润色。",
    "目标：基于用户输入生成一份可直接展示的高质量简历 HTML 片段，视觉排版清晰、表达高级、结果导向。",
    "硬性要求：",
    "1) 只输出 HTML，不要 JSON，不要 Markdown，不要解释文字，不要代码围栏。",
    "2) 禁止输出 <script>、<style>、<iframe>。",
    "3) 必须包含：姓名、目标岗位、联系方式、职业摘要、核心优势、工作经历、项目经历、教育经历、技能清单。",
    "4) 允许并鼓励在信息缺失时补全“合理且可信”的细节（行业、职责、方法、成果），但不要虚构夸张奖项或明显不实信息。",
    "5) 每段经历尽量写出动作 + 方法 + 结果，优先量化。",
    "6) 使用语气要专业、克制、有竞争力，避免模板化空话。",
    "7) 顶层请使用 <div class=\"cv-ai\"> 包裹，并可使用这些类：cv-head, cv-name, cv-role, cv-contact, cv-grid, cv-main, cv-side, cv-section, cv-kicker, cv-list, cv-tags, cv-tag。"
  ].join("\n");

  const userPrompt = {
    languageMode,
    tone,
    template: templateSelect.value,
    onePagePreferred: onePageToggle.checked,
    profile: baseData,
    writingRules: [
      "若输入过于简略，主动补充细化到可投递水平",
      "优先突出岗位匹配度与可迁移能力",
      "保证整体自然，不要露出“AI生成”的痕迹"
    ]
  };

  const response = await fetch(credential.apiBase, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${credential.apiKey}`
    },
    body: JSON.stringify({
      model: credential.model || DEFAULT_MODEL,
      temperature: 0.5,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: JSON.stringify(userPrompt) }
      ]
    })
  });

  if (!response.ok) {
    const errTxt = await response.text();
    throw new Error(`API 请求失败：${response.status} ${errTxt.slice(0, 180)}`);
  }

  const json = await response.json();
  const content = json?.choices?.[0]?.message?.content;
  if (!content) throw new Error("API 返回内容为空。");

  const html = sanitizeGeneratedHtml(stripCodeFence(content));
  if (!html) {
    throw new Error("AI 返回内容无效，请重试。");
  }

  const localBase = buildLocalResume(baseData, tone, languageMode);
  return {
    ...localBase,
    aiHtml: html
  };
}

function stripCodeFence(text) {
  return text.replace(/^```(?:json|html)?\s*/i, "").replace(/```$/i, "").trim();
}

function sanitizeGeneratedHtml(rawHtml) {
  const html = String(rawHtml || "").trim();
  if (!html) return "";

  const template = document.createElement("template");
  template.innerHTML = html;
  template.content.querySelectorAll("script,style,iframe,object,embed,link,meta").forEach((node) => node.remove());
  template.content.querySelectorAll("*").forEach((el) => {
    Array.from(el.attributes).forEach((attr) => {
      const key = attr.name.toLowerCase();
      const value = String(attr.value || "").toLowerCase();
      if (key.startsWith("on")) el.removeAttribute(attr.name);
      if ((key === "href" || key === "src") && value.startsWith("javascript:")) el.removeAttribute(attr.name);
    });
  });

  return template.innerHTML.trim();
}

function normalizeResume(parsed, fallback, languageMode) {
  const safeArray = (v, fb) => (Array.isArray(v) ? v.map((x) => String(x)) : fb);

  const normalized = {
    name: String(parsed.name || fallback.name || ""),
    title: String(parsed.title || fallback.title || ""),
    email: String(parsed.email || fallback.email || ""),
    phone: String(parsed.phone || fallback.phone || ""),
    summary: String(parsed.summary || fallback.summary || ""),
    experience: safeArray(parsed.experience, fallback.experience),
    education: safeArray(parsed.education, fallback.education),
    skills: safeArray(parsed.skills, fallback.skills),
    projects: safeArray(parsed.projects, fallback.projects),
    en: normalizeENBlock(parsed.en, fallback)
  };

  if (languageMode === "en") {
    return {
      ...normalized,
      title: normalized.en.title || normalized.title,
      summary: normalized.en.summary || normalized.summary,
      experience: normalized.en.experience.length ? normalized.en.experience : normalized.experience,
      education: normalized.en.education.length ? normalized.en.education : normalized.education,
      skills: normalized.en.skills.length ? normalized.en.skills : normalized.skills,
      projects: normalized.en.projects.length ? normalized.en.projects : normalized.projects
    };
  }

  return normalized;
}

function normalizeENBlock(enBlock, fallback) {
  const pseudo = buildPseudoEnglishResume(fallback);
  if (!enBlock || typeof enBlock !== "object") return pseudo;

  const safe = (arr, fb) => (Array.isArray(arr) ? arr.map((x) => String(x)) : fb);
  return {
    title: String(enBlock.title || pseudo.title),
    summary: String(enBlock.summary || pseudo.summary),
    experience: safe(enBlock.experience, pseudo.experience),
    education: safe(enBlock.education, pseudo.education),
    skills: safe(enBlock.skills, pseudo.skills),
    projects: safe(enBlock.projects, pseudo.projects)
  };
}

function renderResume(data) {
  applyPreviewPrefs();
  previewEl.classList.remove("compact-1", "compact-2", "compact-3");

  const languageMode = languageSelect.value;
  if (data?.aiHtml) {
    previewEl.innerHTML = data.aiHtml;
    if (onePageToggle.checked) {
      const result = autoFitOnePage();
      if (result.notice) setStatus(result.notice, result.warn);
    }
    scheduleMiniPreviewViewportUpdate();
    return;
  }

  const fitted = fitResumeToPage(data, languageMode, onePageToggle.checked);
  previewEl.innerHTML = buildResumeHtml(fitted.data, languageMode);
  if (fitted.compactClass) previewEl.classList.add(fitted.compactClass);
  if (fitted.notice) setStatus(fitted.notice, fitted.warn);
  scheduleMiniPreviewViewportUpdate();
}

function buildResumeHtml(data, languageMode) {
  const contactLine = [data.email, data.phone].filter(Boolean).join(" ｜ ");
  if (languageMode === "en") {
    return renderLangSection(
      {
        name: data.name,
        title: data.title,
        contact: [data.email, data.phone].filter(Boolean).join(" | "),
        summary: data.summary,
        experience: data.experience,
        projects: data.projects,
        education: data.education,
        skills: data.skills
      },
      { summary: "Summary", experience: "Experience", projects: "Projects", education: "Education", skills: "Skills" }
    );
  }

  if (languageMode === "bilingual") {
    return (
      renderLangSection(
        {
          name: data.name,
          title: data.title,
          contact: contactLine,
          summary: data.summary,
          experience: data.experience,
          projects: data.projects,
          education: data.education,
          skills: data.skills
        },
        { summary: "个人简介", experience: "工作经历", projects: "项目经历", education: "教育经历", skills: "技能清单" }
      ) +
      '<hr class="lang-divider" />' +
      renderLangSection(
        {
          name: data.name,
          title: data.en?.title || mapCNRoleToEN(data.title),
          contact: [data.email, data.phone].filter(Boolean).join(" | "),
          summary: data.en?.summary || "",
          experience: data.en?.experience || [],
          projects: data.en?.projects || [],
          education: data.en?.education || [],
          skills: data.en?.skills || []
        },
        { summary: "Summary", experience: "Experience", projects: "Projects", education: "Education", skills: "Skills" }
      )
    );
  }

  return renderLangSection(
    {
      name: data.name,
      title: data.title,
      contact: contactLine,
      summary: data.summary,
      experience: data.experience,
      projects: data.projects,
      education: data.education,
      skills: data.skills
    },
    { summary: "个人简介", experience: "工作经历", projects: "项目经历", education: "教育经历", skills: "技能清单" }
  );
}

function fitResumeToPage(data, languageMode, needOnePage) {
  if (!needOnePage) {
    return { data, compactClass: null, notice: "", warn: false };
  }

  const targetHeight = Math.round(previewEl.clientWidth * Math.sqrt(2));
  const compactLevels = ["compact-1", "compact-2", "compact-3"];
  const variants = buildContentVariants(data, languageMode);

  for (const variant of variants) {
    previewEl.innerHTML = buildResumeHtml(variant.data, languageMode);
    previewEl.classList.remove(...compactLevels);
    if (previewEl.scrollHeight <= targetHeight) {
      return { data: variant.data, compactClass: null, notice: "已自动压缩到一页。", warn: false };
    }

    for (const compact of compactLevels) {
      previewEl.classList.add(compact);
      if (previewEl.scrollHeight <= targetHeight) {
        return {
          data: variant.data,
          compactClass: compact,
          notice: `已自动压缩到一页（${compact.replace("compact-", "级别 ")}）。`,
          warn: false
        };
      }
      previewEl.classList.remove(compact);
    }
  }

  return {
    data: variants[variants.length - 1].data,
    compactClass: "compact-3",
    notice: "内容过长：已启用最强压缩与裁剪，PDF 可能超过一页。",
    warn: true
  };
}

function buildContentVariants(data, languageMode) {
  const levels = [
    { maxSummary: 220, maxItem: 140, exp: 6, proj: 5, edu: 4, skill: 10, enMaxSummary: 190 },
    { maxSummary: 170, maxItem: 110, exp: 5, proj: 4, edu: 3, skill: 8, enMaxSummary: 150 },
    { maxSummary: 130, maxItem: 90, exp: 4, proj: 3, edu: 3, skill: 7, enMaxSummary: 110 },
    { maxSummary: 95, maxItem: 72, exp: 3, proj: 2, edu: 2, skill: 6, enMaxSummary: 90 }
  ];
  return [{ data }, ...levels.map((cfg) => ({ data: compressResumeData(data, cfg, languageMode) }))];
}

function compressResumeData(data, cfg, languageMode) {
  const clipText = (text, n) => truncateText(String(text || ""), n);
  const clipList = (list, count, itemLen) => (list || []).slice(0, count).map((x) => clipText(x, itemLen));

  const compressed = {
    ...data,
    summary: clipText(data.summary, cfg.maxSummary),
    experience: clipList(data.experience, cfg.exp, cfg.maxItem),
    projects: clipList(data.projects, cfg.proj, cfg.maxItem),
    education: clipList(data.education, cfg.edu, cfg.maxItem),
    skills: clipList(data.skills, cfg.skill, Math.min(50, cfg.maxItem))
  };

  if (languageMode === "bilingual") {
    compressed.en = {
      title: clipText(data.en?.title || "", 80),
      summary: clipText(data.en?.summary || "", cfg.enMaxSummary),
      experience: clipList(data.en?.experience || [], Math.max(2, cfg.exp - 1), cfg.maxItem),
      projects: clipList(data.en?.projects || [], Math.max(2, cfg.proj - 1), cfg.maxItem),
      education: clipList(data.en?.education || [], Math.max(1, cfg.edu - 1), cfg.maxItem),
      skills: clipList(data.en?.skills || [], Math.max(4, cfg.skill - 2), Math.min(40, cfg.maxItem))
    };
  }
  return compressed;
}

function truncateText(text, maxLen) {
  const normalized = text.trim().replace(/\s+/g, " ");
  if (normalized.length <= maxLen) return normalized;
  return `${normalized.slice(0, Math.max(0, maxLen - 1)).trim()}…`;
}

function buildLocalPolishedHtml(data, languageMode) {
  const contact = [data.email, data.phone].filter(Boolean).join(languageMode === "en" ? " | " : " ｜ ");
  const langLabels =
    languageMode === "en"
      ? {
          profile: "Professional Summary",
          strengths: "Core Strengths",
          exp: "Experience",
          proj: "Projects",
          edu: "Education",
          skills: "Skills"
        }
      : {
          profile: "职业摘要",
          strengths: "核心优势",
          exp: "工作经历",
          proj: "项目经历",
          edu: "教育经历",
          skills: "技能清单"
        };

  const strengths = (data.skills || []).slice(0, 6);
  return `
    <div class="cv-ai">
      <header class="cv-head">
        <h1 class="cv-name">${escapeHtml(data.name)}</h1>
        <p class="cv-role">${escapeHtml(data.title)}</p>
        <p class="cv-contact">${escapeHtml(contact)}</p>
      </header>
      <div class="cv-grid">
        <main class="cv-main">
          <section class="cv-section">
            <h3 class="cv-kicker">${escapeHtml(langLabels.profile)}</h3>
            <p>${escapeHtml(data.summary || "-")}</p>
          </section>
          <section class="cv-section">
            <h3 class="cv-kicker">${escapeHtml(langLabels.exp)}</h3>
            ${renderListWithClass(data.experience, "cv-list")}
          </section>
          <section class="cv-section">
            <h3 class="cv-kicker">${escapeHtml(langLabels.proj)}</h3>
            ${renderListWithClass(data.projects, "cv-list")}
          </section>
        </main>
        <aside class="cv-side">
          <section class="cv-section">
            <h3 class="cv-kicker">${escapeHtml(langLabels.strengths)}</h3>
            <div class="cv-tags">${strengths.map((s) => `<span class="cv-tag">${escapeHtml(s)}</span>`).join("")}</div>
          </section>
          <section class="cv-section">
            <h3 class="cv-kicker">${escapeHtml(langLabels.edu)}</h3>
            ${renderListWithClass(data.education, "cv-list")}
          </section>
          <section class="cv-section">
            <h3 class="cv-kicker">${escapeHtml(langLabels.skills)}</h3>
            ${renderListWithClass(data.skills, "cv-list")}
          </section>
        </aside>
      </div>
    </div>
  `;
}

function renderListWithClass(items, className) {
  const rows = (items || []).filter(Boolean);
  if (!rows.length) return "<p>-</p>";
  return `<ul class="${className}">${rows.map((i) => `<li>${escapeHtml(i)}</li>`).join("")}</ul>`;
}

function renderLangSection(content, labels) {
  return `
    <h1>${escapeHtml(content.name)}</h1>
    <p class="resume-title">${escapeHtml(content.title || "-")}</p>
    <p>${escapeHtml(content.contact || "")}</p>

    <section>
      <h3>${escapeHtml(labels.summary)}</h3>
      <p>${escapeHtml(content.summary || "-")}</p>
    </section>

    <section>
      <h3>${escapeHtml(labels.experience)}</h3>
      ${renderList(content.experience)}
    </section>

    <section>
      <h3>${escapeHtml(labels.projects)}</h3>
      ${renderList(content.projects)}
    </section>

    <section>
      <h3>${escapeHtml(labels.education)}</h3>
      ${renderList(content.education)}
    </section>

    <section>
      <h3>${escapeHtml(labels.skills)}</h3>
      ${renderList(content.skills)}
    </section>
  `;
}

function autoFitOnePage() {
  const targetHeight = Math.round(previewEl.clientWidth * Math.sqrt(2));
  const compactLevels = ["compact-1", "compact-2", "compact-3"];

  previewEl.classList.remove(...compactLevels);
  if (previewEl.scrollHeight <= targetHeight) {
    return { notice: "已自动压缩到一页。", warn: false };
  }

  for (const level of compactLevels) {
    previewEl.classList.add(level);
    if (previewEl.scrollHeight <= targetHeight) {
      return { notice: `已自动压缩到一页（${level.replace("compact-", "级别 ")}）。`, warn: false };
    }
  }

  return { notice: "内容较长：已压缩到最紧凑样式，PDF 可能仍会超过一页。", warn: true };
}

function renderList(items) {
  const rows = (items || []).filter(Boolean);
  if (!rows.length) return "<p>-</p>";
  return `<ul>${rows.map((i) => `<li>${escapeHtml(i)}</li>`).join("")}</ul>`;
}

function escapeHtml(raw) {
  return String(raw || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

async function onDownloadPDF() {
  if (!resumeData) {
    setStatus("请先生成简历，再下载 PDF。", true);
    return;
  }

  try {
    setStatus("正在导出 PDF...");
    downloadBtn.disabled = true;

    const canvas = await html2canvas(previewEl, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#ffffff"
    });

    const imgData = canvas.toDataURL("image/png");
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF("p", "mm", "a4");

    const pageWidth = 210;
    const pageHeight = 297;
    const imgWidth = pageWidth - 16;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = 8;

    pdf.addImage(imgData, "PNG", 8, position, imgWidth, imgHeight);
    heightLeft -= pageHeight - 16;

    while (heightLeft > 0) {
      position = heightLeft - imgHeight + 8;
      pdf.addPage();
      pdf.addImage(imgData, "PNG", 8, position, imgWidth, imgHeight);
      heightLeft -= pageHeight - 16;
    }

    const filename = `${(resumeData.name || "resume").replace(/\s+/g, "_")}_resume.pdf`;
    pdf.save(filename);
    setStatus("PDF 导出成功。", false);
  } catch (err) {
    setStatus(`PDF 导出失败：${err.message || "未知错误"}`, true);
  } finally {
    downloadBtn.disabled = false;
  }
}
