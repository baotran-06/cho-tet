const panel = document.getElementById('game-music');
const toggle = document.getElementById('game-music-toggle');
const files = document.getElementById('game-music-files');
const list = document.getElementById('game-music-list');
const audio = document.getElementById('game-music-audio');
const status = document.getElementById('game-music-status');
const tracks = [];

audio.volume = .35;
toggle.addEventListener('click', () => {
  panel.hidden = !panel.hidden;
  toggle.setAttribute('aria-expanded', String(!panel.hidden));
  if (!panel.hidden) files.focus();
});

function loadTrack(index) {
  list.value = String(index);
  audio.src = tracks[index].url;
  status.textContent = tracks[index].name;
}

files.addEventListener('change', () => {
  const first = tracks.length === 0;
  let skipped = 0;
  for (const file of files.files) {
    if (!/\.(mp3|wav)$/i.test(file.name) || !file.size || tracks.length >= 50) {
      skipped++;
      continue;
    }
    const option = new Option(file.name, String(tracks.length));
    tracks.push({name:file.name, url:URL.createObjectURL(file)});
    list.add(option);
  }
  list.disabled = audio.hidden = !tracks.length;
  if (first && tracks.length) loadTrack(0);
  if (skipped) status.textContent = 'Một số file bị bỏ qua. Chọn file MP3/WAV, tối đa 50 bài.';
  files.value = '';
});

list.addEventListener('change', () => loadTrack(Number(list.value)));
audio.addEventListener('ended', async () => {
  loadTrack((Number(list.value) + 1) % tracks.length);
  try {
    await audio.play();
  } catch {
    status.textContent = 'Bấm Phát để tiếp tục.';
  }
});
audio.addEventListener('error', () => {
  status.textContent = 'Không phát được file này. Thử chọn một bài khác.';
});
window.addEventListener('pagehide', event => {
  if (!event.persisted) for (const track of tracks) URL.revokeObjectURL(track.url);
});
