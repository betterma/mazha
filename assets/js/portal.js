const NAV_FILE = 'nav-links.json';

async function loadNavLinks() {
  try {
    const file = await storage.getFile(NAV_FILE);
    return JSON.parse(file.content || '[]');
  } catch {
    // 默认初始数据
    return [
      { title: 'pages', url: 'https://betterma.github.io/pages' },
      { title: 'zyx', url: 'https://betterma.github.io/zyx' },
      { title: 'mazha', url: 'https://betterma.github.io/mazha' }
    ];
  }
}

async function saveNavLinks(links) {
  await storage.saveFile(NAV_FILE, JSON.stringify(links, null, 2));
}

function renderNav(links) {
  const navList = document.getElementById('navList');
  navList.innerHTML = '';
  links.forEach((link, idx) => {
    const li = document.createElement('li');
    li.className = 'entry-item';
    li.innerHTML = `
      <div class="entry-main">
        <a href="${link.url}" target="_blank" class="entry-date" style="font-size:17px;">${link.title}</a>
        <div class="entry-snippet" style="font-size:13px;color:#888;">${link.url}</div>
      </div>
      <div class="entry-actions">
        <button class="btn-link entry-delete-btn" data-idx="${idx}" title="删除">删除</button>
      </div>
    `;
    navList.appendChild(li);
  });
}

async function refresh() {
  const links = await loadNavLinks();
  renderNav(links);
  window._navLinks = links;
}

document.addEventListener('DOMContentLoaded', () => {
  refresh();

  document.getElementById('addNavForm').onsubmit = async function(e) {
    e.preventDefault();
    const title = document.getElementById('navTitle').value.trim();
    const url = document.getElementById('navUrl').value.trim();
    if (!title || !url) return;
    const links = window._navLinks || [];
    links.push({ title, url });
    await saveNavLinks(links);
    document.getElementById('navTitle').value = '';
    document.getElementById('navUrl').value = '';
    refresh();
  };

  document.getElementById('navList').onclick = async function(e) {
    if (e.target.classList.contains('entry-delete-btn')) {
      const idx = +e.target.getAttribute('data-idx');
      const links = window._navLinks || [];
      links.splice(idx, 1);
      await saveNavLinks(links);
      refresh();
    }
  };
});