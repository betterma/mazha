document.addEventListener('DOMContentLoaded', async function() {
  showLoading('正在加载...');
  const list = document.getElementById('bookList');
  // 直接请求books/books.json，内容为[{name, path, type, size, uploadTime}]
  let books = [];
  try {
    const res = await fetch('books/books.json?v=' + Date.now());
    books = await res.json();
  } catch {
    books = [];
  }
  if (!books.length) {
    list.innerHTML = '<li style="color:#888;">暂无图书</li>';
    hideLoading();
    return;
  }
  books.forEach((book) => {
    const li = document.createElement('li');
    li.className = 'book-item';
    li.innerHTML = `
      <div class="book-main">
        <div class="book-title">${book.name}</div>
        <div class="book-meta">${book.type.toUpperCase()} | ${Math.round(book.size/1024)}KB | 上传于 ${book.uploadTime ? book.uploadTime.slice(0,10) : ''}</div>
      </div>
      <div class="book-actions">
        <a href="reader.html?file=${encodeURIComponent(book.path)}&type=${book.type}" class="btn btn-link">阅读</a>
      </div>
    `;
    list.appendChild(li);
  });
  hideLoading();
});

function showLoading(msg) {
  document.getElementById('loadingText').textContent = msg || '正在加载...';
  document.getElementById('globalLoading').style.display = 'flex';
}
function hideLoading() {
  document.getElementById('globalLoading').style.display = 'none';
}