import { getRadioStations } from "../services/radio-service.js";
import { initializeFloatingPanel } from "./floating-panel.js";

const paths = {
  music: '<path d="M9 18V5l11-2v13M9 8l11-2"/><circle cx="6" cy="18" r="3"/><circle cx="17" cy="16" r="3"/>',
  previous: '<path d="m15 5-7 7 7 7"/>', next: '<path d="m9 5 7 7-7 7"/>',
  power: '<path d="M12 2v10M6 5a9 9 0 1 0 12 0"/>',
  volume: '<path d="M3 9h4l5-4v14l-5-4H3zM16 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14"/>',
  mute: '<path d="M3 9h4l5-4v14l-5-4H3zM17 9l5 6m0-6-5 6"/>',
  shuffle: '<path d="m3 4 14 16h4m-4-4 4 4-4 3M3 20 17 4h4m-4-3 4 3-4 4"/>',
  radio: '<rect x="3" y="7" width="18" height="14" rx="3"/><path d="m5 7 13-5M14 11h4m-4 4h4"/><circle cx="8" cy="14" r="2"/>'
};
const icon = name => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name]}</svg>`;

export function initializeRadio() {
  if (document.querySelector("#codex-radio")) return;
  const radio = document.createElement("section");
  radio.id = "codex-radio";
  radio.className = "radio";
  radio.hidden = true;
  radio.dataset.phase = "idle";
  radio.setAttribute("aria-label", "Radio player");
  radio.innerHTML = `
    <div class="radio-window-bar">
      <button class="radio-drag-handle" type="button" aria-label="Drag radio, or move with arrow keys" title="Drag to move, or use arrow keys"><span aria-hidden="true">⠿</span></button>
      <a class="radio-spotify-login" href="https://accounts.spotify.com/en/login" target="_blank" rel="noopener noreferrer" title="Sign in on Spotify (opens a new tab)">Log in to Spotify</a>
      <button class="radio-icon-button radio-minimize" type="button" aria-expanded="true" aria-controls="codex-radio" aria-label="Minimize radio beside search" title="Minimize radio beside search"><span aria-hidden="true"></span></button>
    </div>
    <div class="radio-top">
      <div class="radio-presets" role="group" aria-label="Music genres">${["Pop", "Rock", "Rap"].map((name, i) => `<button class="radio-preset" type="button" data-genre="${name.toLowerCase()}" aria-pressed="${i === 0}">${icon("music")}<span>${name}</span></button>`).join("")}</div>
      <div class="radio-tuning" role="group" aria-label="Stations"><button class="radio-icon-button" type="button" data-radio="previous" aria-label="Previous station">${icon("previous")}</button><span class="radio-dial" aria-hidden="true"></span><button class="radio-icon-button" type="button" data-radio="next" aria-label="Next station">${icon("next")}</button></div>
    </div>
    <div class="radio-tuner" aria-hidden="true"><div class="radio-band"><span>FM</span><span>AM</span></div><div class="radio-wave"><div class="radio-wave-bars">${Array.from({ length: 60 }, (_, i) => `<i style="--bar-height:${24 + Math.round((Math.sin(i * .72) + 1) * 17 + (Math.cos(i * .29) + 1) * 9)}%;--bar-delay:${-(i % 9) * .13}s"></i>`).join("")}</div><span class="radio-needle"></span></div></div>
    <div class="radio-station"><p class="radio-station-name">No station</p><p class="radio-status" role="status" aria-live="polite">Choose a genre to start listening.</p></div>
    <div class="radio-bottom"><button class="radio-icon-button radio-power" type="button" data-radio="power" aria-label="Turn on radio" aria-pressed="false">${icon("power")}</button><span class="radio-frequency" title="Tuning position">87.5</span><span class="radio-signal" title="Stream bitrate"><i></i><span>FM</span></span><div class="radio-volume"><button class="radio-icon-button" type="button" data-radio="mute" aria-label="Mute radio" aria-pressed="false">${icon("volume")}</button><input type="range" min="0" max="100" value="65" aria-label="Radio volume"></div><button class="radio-icon-button" type="button" data-radio="shuffle" aria-label="Random station" title="Random station">${icon("shuffle")}</button></div>`;
  document.body.append(radio);
  const dock = document.createElement("button");
  dock.id = "radio-dock-button";
  dock.className = "radio-dock-button";
  dock.type = "button";
  dock.hidden = true;
  dock.setAttribute("aria-label", "Open radio player");
  dock.setAttribute("aria-controls", "codex-radio");
  dock.title = "Open radio player";
  dock.innerHTML = `${icon("radio")}<span>Radio</span><i aria-hidden="true"></i>`;
  document.querySelector(".topbar .search").after(dock);

  // The same audio element stays mounted through page changes and minimization.
  const audio = document.createElement("audio");
  audio.id = "codex-radio-audio";
  audio.preload = "none";
  audio.hidden = true;
  document.body.append(audio);
  const status = radio.querySelector(".radio-status");
  const stationName = radio.querySelector(".radio-station-name");
  const power = radio.querySelector('[data-radio="power"]');
  const mute = radio.querySelector('[data-radio="mute"]');
  const slider = radio.querySelector(".radio-volume input");
  let genre = "pop", stations = [], stationIndex = 0, request = 0;
  let wantsPlayback = false;
  let playbackTimer;
  try { slider.value = localStorage.getItem("codex-radio-volume") || "65"; } catch { /* Default volume. */ }

  function setPhase(phase, message) {
    radio.dataset.phase = phase;
    dock.dataset.phase = phase;
    status.textContent = message;
    const on = wantsPlayback && phase !== "error";
    power.setAttribute("aria-pressed", String(on));
    power.setAttribute("aria-label", on ? "Pause radio" : "Turn on radio");
    dock.title = stations.length ? `Open radio · ${stationName.textContent}` : "Open radio player";
  }
  function updateVolume() {
    audio.volume = Number(slider.value) / 100;
    slider.style.setProperty("--volume", `${slider.value}%`);
    try { localStorage.setItem("codex-radio-volume", slider.value); } catch { /* Session volume. */ }
  }
  function updateStation() {
    const station = stations[stationIndex];
    stationName.textContent = station.name;
    radio.querySelector(".radio-signal span").textContent = station.bitrate ? `${station.bitrate}k` : "Live";
    radio.querySelector(".radio-frequency").textContent = (87.5 + stationIndex * .2).toFixed(1);
    radio.querySelector(".radio-needle").style.left = `${8 + stationIndex / Math.max(1, stations.length - 1) * 84}%`;
  }
  async function playStation() {
    if (!stations.length || !wantsPlayback) return;
    clearTimeout(playbackTimer);
    audio.pause();
    audio.src = stations[stationIndex].url;
    updateStation();
    setPhase("connecting", "Connecting to station…");
    playbackTimer = window.setTimeout(() => { if (wantsPlayback && audio.readyState < 3) { wantsPlayback = false; audio.pause(); setPhase("error", "Station unavailable. Try the next station."); } }, 12000);
    try { await audio.play(); } catch (error) {
      if (error.name !== "AbortError" && wantsPlayback) { clearTimeout(playbackTimer); wantsPlayback = false; setPhase("error", "Press power to retry or choose another station."); }
    }
  }
  async function selectGenre(next) {
    const token = ++request;
    genre = next;
    wantsPlayback = true;
    clearTimeout(playbackTimer);
    audio.pause();
    stations = [];
    radio.querySelectorAll(".radio-preset").forEach(button => button.setAttribute("aria-pressed", String(button.dataset.genre === genre)));
    setPhase("loading", "Finding stations…");
    try {
      const found = await getRadioStations(genre);
      if (token !== request) return;
      stations = found;
      stationIndex = 0;
      updateStation();
      if (wantsPlayback) await playStation();
      else setPhase("paused", "Paused");
    } catch {
      if (token === request) { wantsPlayback = false; setPhase("error", "Stations couldn't load. Choose a genre to retry."); }
    }
  }
  radio.querySelectorAll(".radio-preset").forEach(button => button.addEventListener("click", () => selectGenre(button.dataset.genre)));
  function tune(step, random = false) {
    if (!stations.length) { selectGenre(genre); return; }
    stationIndex = random ? (stationIndex + 1 + Math.floor(Math.random() * Math.max(1, stations.length - 1))) % stations.length : (stationIndex + step + stations.length) % stations.length;
    wantsPlayback = true;
    playStation();
  }
  radio.querySelector('[data-radio="previous"]').addEventListener("click", () => tune(-1));
  radio.querySelector('[data-radio="next"]').addEventListener("click", () => tune(1));
  radio.querySelector('[data-radio="shuffle"]').addEventListener("click", () => tune(1, true));
  power.addEventListener("click", async () => {
    if (wantsPlayback) { wantsPlayback = false; clearTimeout(playbackTimer); audio.pause(); setPhase("paused", "Paused"); return; }
    wantsPlayback = true;
    if (!stations.length) { selectGenre(genre); return; }
    if (audio.src === stations[stationIndex].url && radio.dataset.phase !== "error") {
      try { await audio.play(); } catch { wantsPlayback = false; setPhase("error", "Press power to retry."); }
    } else playStation();
  });
  slider.addEventListener("input", updateVolume);
  mute.addEventListener("click", () => {
    audio.muted = !audio.muted;
    mute.innerHTML = icon(audio.muted ? "mute" : "volume");
    mute.setAttribute("aria-label", audio.muted ? "Unmute radio" : "Mute radio");
    mute.setAttribute("aria-pressed", String(audio.muted));
  });
  audio.addEventListener("playing", () => { clearTimeout(playbackTimer); setPhase("playing", stations[stationIndex]?.country || "Live radio"); });
  audio.addEventListener("waiting", () => { if (wantsPlayback) setPhase("buffering", "Buffering station…"); });
  audio.addEventListener("error", () => { if (wantsPlayback && radio.dataset.phase !== "loading") { clearTimeout(playbackTimer); wantsPlayback = false; setPhase("error", "Station unavailable. Try the next station."); } });

  const floating = initializeFloatingPanel(radio, { handle: radio.querySelector(".radio-drag-handle"), minimizeButton: radio.querySelector(".radio-minimize"), restoreButton: dock, storageKey: "codex-music-panel" });
  function syncVisibility() {
    const view = document.querySelector(".view.active")?.id;
    const allowed = view === "view-wiki" || view === "view-quill";
    radio.hidden = !allowed || floating.minimized;
    dock.hidden = !allowed || !floating.minimized;
    document.querySelector(".topbar").classList.toggle("has-minimized-radio", !dock.hidden);
    floating.reflow();
  }
  radio.addEventListener("floating-panel:resize", syncVisibility);
  window.addEventListener("codex:view-change", syncVisibility);
  updateVolume();
  syncVisibility();
}
