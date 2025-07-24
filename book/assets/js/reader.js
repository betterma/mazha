function showLoading(msg) {
  document.getElementById('loadingText').textContent = msg || '正在加载...';
  document.getElementById('globalLoading').style.display = 'flex';
}
function hideLoading() {
  document.getElementById('globalLoading').style.display = 'none';
}

document.addEventListener('DOMContentLoaded', function() {
  (async function() {
    showLoading('正在加载...');
    const params = new URLSearchParams(location.search);
    const file = params.get('file');
    const type = (params.get('type') || '').toLowerCase();
    if (!file) {
      document.getElementById('reader').textContent = '未指定文件';
      hideLoading();
      return;
    }

    document.getElementById('bookTitle').textContent = decodeURIComponent(file.split('/').pop());

    // 获取文件内容
    const { content } = await storage.getFile(file);
    if (!content) {
      document.getElementById('reader').textContent = '文件不存在';
      hideLoading();
      return;
    }

    // base64解码为Uint8Array
    function base64ToUint8Array(base64) {
      const binary = atob(content);
      const len = binary.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
      return bytes;
    }

    if (type === 'txt') {
      document.getElementById('reader').innerHTML = `<pre>${decodeURIComponent(escape(atob(content)))}</pre>`;
      hideLoading();
    } else if (type === 'md') {
      document.getElementById('reader').innerHTML = marked.parse(decodeURIComponent(escape(atob(content))));
      hideLoading();
    } else if (type === 'pdf') {
      const bytes = base64ToUint8Array(content);
      const pdfjsLib = window['pdfjs-dist/build/pdf'];
      pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js';
      const pdf = await pdfjsLib.getDocument({ data: bytes }).promise;
      let html = '';
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 1.2 });
        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
        html += `<div style="margin-bottom:16px;"><img src="${canvas.toDataURL()}" style="max-width:100%;"></div>`;
      }
      document.getElementById('reader').innerHTML = html;
      hideLoading();
    } else if (type === 'epub') {
      const bytes = base64ToUint8Array(content);
      const blob = new Blob([bytes], { type: 'application/epub+zip' });
      const url = URL.createObjectURL(blob);
      const book = ePub(url);
      book.renderTo("reader", { width: "100%", height: 500 });
      hideLoading();
    } else if (type === 'docx') {
      const bytes = base64ToUint8Array(content);
      mammoth.convertToHtml({ arrayBuffer: bytes }).then(function(result){
        document.getElementById('reader').innerHTML = result.value;
        hideLoading();
      }, function(){
        document.getElementById('reader').innerHTML = '文档解析失败';
        hideLoading();
      });
    } else {
      document.getElementById('reader').innerHTML = '暂不支持该格式';
      hideLoading();
    }
  })();
});