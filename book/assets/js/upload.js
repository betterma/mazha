function showLoading(msg) {
  document.getElementById('loadingText').textContent = msg || '正在上传...';
  document.getElementById('globalLoading').style.display = 'flex';
}
function hideLoading() {
  document.getElementById('globalLoading').style.display = 'none';
}

document.getElementById('uploadBtn').onclick = async function() {
  const files = document.getElementById('bookInput').files;
  const list = document.getElementById('uploadList');
  if (!files.length) return alert('请选择文件');
  list.innerHTML = '';
  this.disabled = true;
  showLoading('正在上传...');
  let indexFile = await storage.getFile('books/index.json');
  let books = [];
  try { books = JSON.parse(indexFile.content || '[]'); } catch {}
  let success = 0, fail = 0;
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const li = document.createElement('li');
    li.textContent = `正在上传：${file.name}`;
    list.appendChild(li);
    showLoading(`正在上传：${file.name} (${i+1}/${files.length})`);
    try {
      const arrayBuffer = await file.arrayBuffer();
      // 针对大文件btoa可能溢出，需分片处理
      let base64 = '';
      const uint8 = new Uint8Array(arrayBuffer);
      const chunkSize = 0x8000;
      if (uint8.length > 1024 * 1024) { // 超过1MB分片
        let binary = '';
        for (let j = 0; j < uint8.length; j += chunkSize) {
          binary += String.fromCharCode.apply(null, uint8.subarray(j, j + chunkSize));
        }
        base64 = btoa(binary);
      } else {
        base64 = btoa(String.fromCharCode(...uint8));
      }
      const ext = file.name.split('.').pop().toLowerCase();
      const bookMeta = {
        name: file.name,
        type: ext,
        size: file.size,
        uploadTime: new Date().toISOString(),
        path: `books/${file.name}`
      };
      await storage.saveFile(bookMeta.path, base64);
      books = books.filter(b => b.name !== file.name);
      books.push(bookMeta);
      li.textContent = `上传完成：${file.name}`;
      success++;
    } catch(e) {
      li.textContent = `上传失败：${file.name}，原因：${e.message || e}`;
      li.style.color = 'red';
      fail++;
    }
  }
  try {
    await storage.saveFile('books/index.json', JSON.stringify(books, null, 2));
  } catch(e) {
    alert('目录更新失败，请重试！');
  }
  hideLoading();
  this.disabled = false;
  if(success) alert(`上传完成！成功${success}个，失败${fail}个`);
  if(success) location.href = 'index.html';
};