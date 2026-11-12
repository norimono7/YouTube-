const STORAGE_KEY = "nuts-youtube-simulator-v1";
const form = document.querySelector("#videoForm");
const titleInput = document.querySelector("#videoTitle");
const titleCounter = document.querySelector("#titleCounter");
const profileSelect = document.querySelector("#profileSelect");
const videoList = document.querySelector("#videoList");
const formError = document.querySelector("#formError");
const sliders = ["quality", "sound", "originality"].map((id) => document.querySelector(`#${id}`));

const readProfiles = () => {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; }
  catch { return {}; }
};
let profiles = readProfiles();
let activeChannel = Object.keys(profiles)[0] || "";

function saveProfiles() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles));
}

function createChannel() {
  const name = window.prompt("チャンネル名を入力してください（20文字以内）", activeChannel || "");
  if (name === null) return;
  const trimmed = name.trim();
  if (!trimmed || trimmed.length > 20) {
    window.alert("チャンネル名は1〜20文字で入力してください。");
    return;
  }
  if (!profiles[trimmed]) profiles[trimmed] = { totalViews: 0, subscribers: 0, videos: [] };
  activeChannel = trimmed;
  saveProfiles();
  renderProfileOptions();
  render();
}

function ensureChannel() {
  if (!activeChannel) {
    createChannel();
    if (!activeChannel) {
      activeChannel = "マイチャンネル";
      profiles[activeChannel] = { totalViews: 0, subscribers: 0, videos: [] };
      saveProfiles();
    }
  }
}

function renderProfileOptions() {
  profileSelect.innerHTML = Object.keys(profiles).map((name) =>
    `<option value="${escapeHtml(name)}" ${name === activeChannel ? "selected" : ""}>${escapeHtml(name)}</option>`
  ).join("");
}

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[char]);
}

function formatNumber(number) {
  return new Intl.NumberFormat("ja-JP").format(number);
}

function updatePerformance() {
  const values = sliders.map((slider) => Number(slider.value));
  const total = values.reduce((sum, value) => sum + value, 0);
  document.querySelector("#performanceTotal").textContent = `${total}%`;
  document.querySelector("#performanceTotal").style.color = "var(--purple)";
  values.forEach((value, index) => {
    document.querySelector(`#${["quality", "sound", "originality"][index]}Value`).textContent = `${value}%`;
  });
}

function calculateResult(genre, performance) {
  const genreBonus = { 音楽: 1.15, ゲーム: 1.22, 料理: .95, 紹介: 1.02, 乗り物: .9, 絵: .78, 教育: .92, 旅行: 1.08, 解説: 1.12, その他: .82 };
  const quality = performance.quality * .35 + performance.sound * .2 + performance.originality * .45;
  const swing = 0.5 + Math.random() * 1.5;
  const views = Math.max(1, Math.round(quality * quality * (genreBonus[genre] || 1) * swing * 3.2));
  const subscribers = Math.max(0, Math.round(views / (38 + Math.random() * 76)));
  return { views, subscribers };
}

function render() {
  const channel = profiles[activeChannel];
  if (!channel) return;
  document.querySelector("#channelHeading").textContent = `${activeChannel}を育てよう。`;
  document.querySelector("#totalViews").textContent = formatNumber(channel.totalViews);
  document.querySelector("#subscribers").textContent = formatNumber(channel.subscribers);
  document.querySelector("#videoCount").textContent = channel.videos.length;
  document.querySelector("#videoCountLabel").textContent = `${channel.videos.length}本`;
  if (!channel.videos.length) {
    videoList.innerHTML = `<div class="empty-state"><div class="empty-icon">✦</div><h3>最初の動画を投稿しよう</h3><p>左のフォームから動画を投稿すると、ここに結果が表示されます。</p></div>`;
    return;
  }
  videoList.innerHTML = channel.videos.map((video) => `
    <article class="video-item">
      <div class="video-thumbnail">${escapeHtml(video.genre.slice(0, 1))}</div>
      <div><h3>${escapeHtml(video.title)}</h3><div class="video-meta">${escapeHtml(video.genre)}　・　画質 ${video.performance.quality}% / 音 ${video.performance.sound}% / 独創性 ${video.performance.originality}%</div></div>
      <div class="video-result"><strong>${formatNumber(video.views)}</strong><span>回再生</span><div class="video-growth">+${video.subscribers} 登録</div></div>
    </article>`).join("");
}

titleInput.addEventListener("input", () => { titleCounter.textContent = `${titleInput.value.length} / 20`; });
sliders.forEach((slider) => slider.addEventListener("input", updatePerformance));
document.querySelector("#newChannelButton").addEventListener("click", createChannel);
profileSelect.addEventListener("change", (event) => { activeChannel = event.target.value; render(); });
form.addEventListener("submit", (event) => {
  event.preventDefault();
  const title = titleInput.value.trim();
  const genre = document.querySelector("#genre").value;
  const performanceValues = sliders.map((slider) => Number(slider.value));
  if (!title || title.length > 20 || !genre) { formError.textContent = "動画名とジャンルを入力してください。"; return; }
  const performance = { quality: performanceValues[0], sound: performanceValues[1], originality: performanceValues[2] };
  const result = calculateResult(genre, performance);
  const channel = profiles[activeChannel];
  channel.videos.unshift({ title, genre, performance, ...result, postedAt: Date.now() });
  channel.totalViews += result.views;
  channel.subscribers += result.subscribers;
  saveProfiles();
  form.reset();
  sliders[0].value = 100; sliders[1].value = 100; sliders[2].value = 100;
  titleCounter.textContent = "0 / 20"; formError.textContent = "";
  updatePerformance(); render();
});

ensureChannel();
renderProfileOptions();
updatePerformance();
render();
