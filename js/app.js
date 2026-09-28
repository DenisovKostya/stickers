'use strict';
const $ = (selector) => document.querySelector(selector);
const icons = {all: '✳', kohannya: '❤️', summer: '☀️', autumn: '🍂'};
const aliases = {
  hugs:'hug', hugging:'hug', cuddles:'cuddle', cuddling:'cuddle', kisses:'kiss', kissing:'kiss',
  loves:'love', loving:'love', hearts:'heart', romantic:'romance', sleeping:'sleep', sleepy:'sleep',
  crying:'cry', cries:'cry', tears:'cry', sadness:'sad', unhappy:'sad', laughing:'happy', laugh:'happy',
  happiness:'happy', smiles:'happy', smiling:'happy', angry:'angry', anger:'angry', dancing:'dance',
  reading:'read', working:'work', eating:'eat', games:'game', cats:'cat', foxes:'fox',
  обійми:'hug', поцілунок:'kiss', кохання:'love', любов:'love', сон:'sleep', сум:'sad',
  грусть:'sad', любовь:'love', обнимашки:'hug', поцелуй:'kiss'
};
const normalize = (value) => value.toLowerCase().normalize('NFKC').replace(/[\uFE0E\uFE0F\u200D]/gu, '');
const tokens = (value) => normalize(value).match(/[\p{L}\p{N}]+|\p{Extended_Pictographic}/gu) || [];
const canonical = (value) => aliases[value] || value;
let collection, visible = [], selectedPack = 'all', previewIndex = 0, opener, scrollPosition = 0;
const dialog = $('#preview');
function searchable(sticker) {
  return new Set(tokens([sticker.title, ...sticker.keywords, ...sticker.emoji, 'cat fox', sticker.pack].join(' ')).map(canonical));
}
function matches(sticker, query) {
  const words = tokens(query).map(canonical);
  return words.every(word => [...sticker.search].some(tag => tag === word || (/^[\p{L}\p{N}]+$/u.test(word) && tag.startsWith(word))));
}
function packName(id) {return collection.packs.find(pack => pack.id === id)?.name || id;}
function setPack(id) {
  selectedPack = id;
  document.querySelectorAll('.pack-filter').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.pack === id)));
  render();
}
function render() {
  const query = $('#search').value.trim();
  visible = collection.stickers.filter(sticker => (selectedPack === 'all' || sticker.pack === selectedPack) && matches(sticker, query));
  $('#clear-search').hidden = !query;
  $('#selection-title').textContent = selectedPack === 'all' ? 'All little moments' : packName(selectedPack);
  $('#result-count').textContent = `${visible.length} sticker${visible.length === 1 ? '' : 's'}`;
  $('#empty').hidden = visible.length > 0;
  document.querySelectorAll('[data-query]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.query === query.toLowerCase())));
  const fragment = document.createDocumentFragment();
  visible.forEach((sticker, index) => {
    const button = document.createElement('button');
    button.className = 'sticker'; button.dataset.pack = sticker.pack; button.dataset.id = sticker.id;
    button.setAttribute('aria-label', `${sticker.title}. ${packName(sticker.pack)}. ${sticker.emoji.join(' ')}`);
    const media = document.createElement('span'); media.className = 'sticker-media';
    const image = new Image(); image.src = sticker.poster || sticker.file; image.alt = '';
    image.width = sticker.width; image.height = sticker.height; image.loading = index < 12 ? 'eager' : 'lazy'; image.decoding = 'async';
    media.append(image);
    const info = document.createElement('span'); info.className = 'sticker-info';
    const emoji = document.createElement('span'); emoji.className = 'sticker-emoji'; emoji.textContent = sticker.emoji.slice(0, 2).join(' '); emoji.setAttribute('aria-hidden', 'true');
    const pack = document.createElement('span'); pack.className = 'sticker-pack'; pack.textContent = packName(sticker.pack);
    info.append(emoji, pack); button.append(media, info);
    button.addEventListener('click', () => openPreview(index, button)); fragment.append(button);
  });
  $('#gallery').replaceChildren(fragment);
}
function showSticker(index) {
  previewIndex = index;
  const sticker = visible[index];
  $('#preview-pack').textContent = `${icons[sticker.pack] || ''} ${packName(sticker.pack)}`;
  $('#preview-title').textContent = sticker.title;
  $('#preview-emojis').textContent = sticker.emoji.join(' ');
  $('#preview-keywords').textContent = sticker.keywords.join(' · ');
  const media = sticker.type === 'video' ? document.createElement('video') : new Image();
  media.src = sticker.file;
  if (sticker.type === 'video') {
    media.playsInline = true; media.muted = true; media.loop = true; media.controls = true; media.preload = 'metadata';
    if (sticker.poster) media.poster = sticker.poster;
    media.autoplay = !matchMedia('(prefers-reduced-motion: reduce)').matches;
    media.setAttribute('aria-label', sticker.title);
  } else {media.alt = sticker.title;}
  $('#preview-media').querySelector('video')?.pause();
  $('#preview-media').replaceChildren(media);
  $('#preview-position').textContent = `${index + 1} / ${visible.length}`;
  $('#previous').disabled = index === 0; $('#next').disabled = index === visible.length - 1;
}
function openPreview(index, button) {
  opener = button;
  // Dismiss the mobile keyboard before opening the full preview.
  document.activeElement?.blur();
  scrollPosition = window.scrollY;
  document.body.style.top = `-${scrollPosition}px`;
  document.body.classList.add('preview-open');
  showSticker(index); dialog.showModal(); $('#close-preview').focus();
}
function closePreview() {dialog.close();}
dialog.addEventListener('close', () => {
  $('#preview-media').querySelector('video')?.pause(); $('#preview-media').replaceChildren();
  document.body.classList.remove('preview-open'); document.body.style.top = '';
  const root = document.documentElement;
  const previousBehavior = root.style.scrollBehavior;
  root.style.scrollBehavior = 'auto'; window.scrollTo(0, scrollPosition); root.style.scrollBehavior = previousBehavior;
  opener?.focus({preventScroll:true});
});
$('#close-preview').addEventListener('click', closePreview);
dialog.addEventListener('click', (event) => {if (event.target === dialog) {const r = dialog.getBoundingClientRect(); if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) closePreview();}});
$('#previous').addEventListener('click', () => showSticker(previewIndex - 1));
$('#next').addEventListener('click', () => showSticker(previewIndex + 1));
dialog.addEventListener('keydown', (event) => {
  if (event.key === 'ArrowLeft' && previewIndex > 0) {event.preventDefault(); showSticker(previewIndex - 1);}
  if (event.key === 'ArrowRight' && previewIndex < visible.length - 1) {event.preventDefault(); showSticker(previewIndex + 1);}
});
$('#search').addEventListener('input', () => {if (collection) render();});
$('#search').addEventListener('keydown', event => {if (event.key === 'Enter') event.target.blur();});
$('#clear-search').addEventListener('click', () => {$('#search').value = ''; if (collection) render(); $('#search').focus();});
document.querySelectorAll('[data-query]').forEach(button => button.addEventListener('click', () => {$('#search').value = button.dataset.query; if (collection) render();}));
$('#reset').addEventListener('click', () => {$('#search').value = ''; setPack('all');});
async function load() {
  $('#error').hidden = true; $('#result-count').textContent = 'Loading stickers…';
  try {
    const response = await fetch('data/stickers.json');
    if (!response.ok) throw new Error(`Collection request: ${response.status}`);
    collection = await response.json();
    collection.stickers.forEach(sticker => {sticker.search = searchable(sticker);});
    const filters = $('#pack-filters'); filters.replaceChildren();
    [{id:'all', name:'All stickers', count:collection.stickers.length}, ...collection.packs].forEach(pack => {
      const button = document.createElement('button'); button.className = 'pack-filter'; button.dataset.pack = pack.id;
      button.setAttribute('aria-pressed', String(pack.id === selectedPack));
      const icon = document.createElement('span'); icon.className = 'pack-icon'; icon.textContent = icons[pack.id] || '✳'; icon.setAttribute('aria-hidden', 'true');
      const label = document.createElement('span'); label.textContent = pack.name;
      const count = document.createElement('small'); count.textContent = pack.count;
      button.append(icon, label, count); button.addEventListener('click', () => setPack(pack.id)); filters.append(button);
    }); render();
  } catch (error) {$('#error').hidden = false; $('#result-count').textContent = 'Unable to load'; console.error(error);}
}
$('#retry').addEventListener('click', load);
load();
