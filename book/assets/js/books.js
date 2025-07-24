document.addEventListener('DOMContentLoaded', async function() {
  showLoading('正在加载...');
  const list = document.getElementById('bookList');
  let indexFile = await storage.getFile('books/index.json');
  let books = [];
  try { books = JSON.parse(indexFile.content || '[]'); } catch {}
  if (!books.length) {
    list.innerHTML = '<li style="color:#888;">暂无图书</li>';
    hideLoading();
    return;
  }
  books.forEach((book, idx) => {
    const li = document.createElement('li');
    li.className = 'book-item';
    li.innerHTML = `
      <div class="book-main">
        <div class="book-title">${book.name}</div>
        <div class="book-meta">${book.type.toUpperCase()} | ${Math.round(book.size/1024)}KB | 上传于 ${book.uploadTime.slice(0,10)}</div>
      </div>
      <div class="book-actions">
        <a href="reader.html?file=${encodeURIComponent(book.path)}&type=${book.type}" class="btn btn-link">阅读</a>
        <button class="btn btn-link book-delete-btn" data-idx="${idx}" style="color:#e00;">删除</button>
      </div>
    `;
    list.appendChild(li);
  });
  hideLoading();

  list.onclick = async function(e) {
    if (e.target.classList.contains('book-delete-btn')) {
      const idx = +e.target.getAttribute('data-idx');
      if (!confirm('确定要删除这本书吗？')) return;
      showLoading('正在删除...');
      let indexFile = await storage.getFile('books/index.json');
      let books = [];
      try { books = JSON.parse(indexFile.content || '[]'); } catch {}
      const book = books[idx];
      try {
        await storage.deleteFile(book.path);
      } catch {}
      books.splice(idx, 1);
      await storage.saveFile('books/index.json', JSON.stringify(books, null, 2));
      hideLoading();
      location.reload();
    }
  };
});

function showLoading(msg) {
  document.getElementById('loadingText').textContent = msg || '正在加载...';
  document.getElementById('globalLoading').style.display = 'flex';
}
function hideLoading() {
  document.getElementById('globalLoading').style.display = 'none';
}