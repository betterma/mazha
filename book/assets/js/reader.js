function showLoading(msg) {
  document.getElementById('loadingText').textContent = msg || '正在加载...';
  document.getElementById('globalLoading').style.display = 'flex';
}
function hideLoading() {
  document.getElementById('globalLoading').style.display = 'none';
}

// 进度存储key
function getProgressKey(file) {
  return 'read-progress-' + encodeURIComponent(file);
}

function saveProgress(file, data) {
  try { localStorage.setItem(getProgressKey(file), JSON.stringify(data)); } catch(e) {}
}
function loadProgress(file) {
  try {
    const d = localStorage.getItem(getProgressKey(file));
    return d ? JSON.parse(d) : null;
  } catch(e) { return null; }
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

    // 恢复进度
    const progress = loadProgress(file) || {};

    if (type === 'txt' || type === 'md') {
      let html = type === 'txt'
        ? `<pre>${decodeURIComponent(escape(atob(content)))}</pre>`
        : marked.parse(decodeURIComponent(escape(atob(content))));
      document.getElementById('reader').innerHTML = html;
      // 滚动恢复
      if(progress.scrollTop) document.getElementById('reader').scrollTop = progress.scrollTop;
      // 监听滚动保存
      document.getElementById('reader').addEventListener('scroll', function() {
        saveProgress(file, { scrollTop: this.scrollTop });
      });
      hideLoading();
    } else if (type === 'pdf') {
      const bytes = base64ToUint8Array(content);
      const pdfjsLib = window['pdfjs-dist/build/pdf'];
      pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js';
      const pdf = await pdfjsLib.getDocument({ data: bytes }).promise;
      let html = '';
      let pageToGo = progress.page || 1;
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 1.2 });
        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
        html += `<div style=\"margin-bottom:16px;\"><img src=\"${canvas.toDataURL()}\" style=\"max-width:100%;\"></div>`;
      }
      document.getElementById('reader').innerHTML = html;
      // 滚动到上次阅读页
      if(pageToGo > 1) {
        const imgs = document.getElementById('reader').querySelectorAll('img');
        if(imgs[pageToGo-1]) imgs[pageToGo-1].scrollIntoView();
      }
      // 监听滚动保存页码
      document.getElementById('reader').addEventListener('scroll', function() {
        const imgs = this.querySelectorAll('img');
        let page = 1;
        for(let i=0;i<imgs.length;i++) {
          if(imgs[i].getBoundingClientRect().top >= 0) { page = i+1; break; }
        }
        saveProgress(file, { page });
      });
      hideLoading();
    } else if (type === 'epub') {
      const bytes = base64ToUint8Array(content);
      const blob = new Blob([bytes], { type: 'application/epub+zip' });
      const url = URL.createObjectURL(blob);
      const book = ePub(url);
      const rendition = book.renderTo("reader", { width: "100%", height: 500 });
      // 恢复epub进度
      if(progress.cfi) {
        book.ready.then(()=>rendition.display(progress.cfi));
      }
      // 监听epub进度
      rendition.on('relocated', function(loc){
        saveProgress(file, { cfi: loc.start.cfi });
      });
      hideLoading();
    } else if (type === 'docx') {
      const bytes = base64ToUint8Array(content);
      mammoth.convertToHtml({ arrayBuffer: bytes }).then(function(result){
        document.getElementById('reader').innerHTML = result.value;
        // 滚动恢复
        if(progress.scrollTop) document.getElementById('reader').scrollTop = progress.scrollTop;
        // 监听滚动保存
        document.getElementById('reader').addEventListener('scroll', function() {
          saveProgress(file, { scrollTop: this.scrollTop });
        });
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