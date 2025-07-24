/book/assets/js/upload.js
document.getElementById('uploadBtn').onclick = async function() {
  const files = document.getElementById('bookInput').files;
  const list = document.getElementById('uploadList');
  if (!files.length) return alert('请选择文件');
  list.innerHTML = '';
  let indexFile = await storage.getFile('books/index.json');
  let books = [];
  try { books = JSON.parse(indexFile.content || '[]'); } catch {}
  for (let file of files) {
    const li = document.createElement('li');
    li.textContent = `正在上传：${file.name}`;
    list.appendChild(li);

    // 读取文件内容并base64编码
    const arrayBuffer = await file.arrayBuffer();
    const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
    const ext = file.name.split('.').pop().toLowerCase();
    const bookMeta = {
      name: file.name,
      type: ext,
      size: file.size,
      uploadTime: new Date().toISOString(),
      path: `books/${file.name}`
    };
    // 存储文件
    await storage.saveFile(bookMeta.path, base64);
    // 更新目录
    books = books.filter(b => b.name !== file.name); // 避免重复
    books.push(bookMeta);
    li.textContent = `上传完成：${file.name}`;
  }
  await storage.saveFile('books/index.json', JSON.stringify(books, null, 2));
  alert('全部上传完成！');
};