document.addEventListener('DOMContentLoaded', async function() {
  showLoading('正在加载...');
  const list = document.getElementById('bookList');
  const searchInput = document.getElementById('searchInput');
  let books = [];
  let markedBooks = JSON.parse(localStorage.getItem('markedBooks') || '{}');

  function renderList(filter = '') {
    list.innerHTML = '';
    const filtered = books.filter(book => {
      const keyword = filter.trim().toLowerCase();
      return (
        book.name.toLowerCase().includes(keyword) ||
        book.type.toLowerCase().includes(keyword)
      );
    });
    if (!filtered.length) {
      list.innerHTML = '<li style="color:#888;">暂无符合条件的图书</li>';
      return;
    }
    filtered.forEach((book) => {
      const li = document.createElement('li');
      li.className = 'book-item';
      const isMarked = !!markedBooks[book.path];
      li.innerHTML = `
        <div class="book-main">
          <div class="book-title">${book.name}</div>
          <div class="book-meta">${book.type.toUpperCase()} | ${Math.round(book.size/1024)}KB | 上传于 ${book.uploadTime ? book.uploadTime.slice(0,10) : ''}</div>
        </div>
        <div class="book-actions">
          <a href="${book.path}" download class="btn btn-link">下载</a>
          <button class="btn btn-link mark-btn" title="收藏/标记">${isMarked ? '⭐' : '☆'}</button>
        </div>
      `;
      li.querySelector('.mark-btn').onclick = function() {
        if (markedBooks[book.path]) {
          delete markedBooks[book.path];
        } else {
          markedBooks[book.path] = true;
        }
        localStorage.setItem('markedBooks', JSON.stringify(markedBooks));
        renderList(searchInput.value);
      };
      list.appendChild(li);
    });
  }

  try {
    const res = await fetch('books/books.json?v=' + Date.now());
    books = await res.json();
  } catch {
    books = [];
  }
  renderList();
  hideLoading();

  searchInput.addEventListener('input', function() {
    renderList(this.value);
  });
});

function showLoading(msg) {
  document.getElementById('loadingText').textContent = msg || '正在加载...';
  document.getElementById('globalLoading').style.display = 'flex';
}
function hideLoading() {
  document.getElementById('globalLoading').style.display = 'none';
}