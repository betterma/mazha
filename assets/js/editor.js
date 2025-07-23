// editor.js - 编辑页面逻辑
document.addEventListener('DOMContentLoaded', async function() {
    // 检查认证状态
    if (!auth.isAuthenticated()) {
      window.location.href = 'login.html';
      return;
    }
    
    // 获取日期参数
    const urlParams = new URLSearchParams(window.location.search);
    const entryDate = urlParams.get('date') || dayjs().format('YYYY-MM-DD');
    
    // 设置标题
    const editorTitle = document.getElementById('editorTitle');
    editorTitle.textContent = utils.formatDate(entryDate, 'YYYY年MM月DD日');
    
    // 初始化Quill编辑器
    const quill = new Quill('#editor', {
      modules: {
        toolbar: [
          ['bold', 'italic', 'underline', 'strike'],
          ['blockquote', 'code-block'],
          [{ 'list': 'ordered' }, { 'list': 'bullet' }],
          [{ 'script': 'sub' }, { 'script': 'super' }],
          [{ 'indent': '-1' }, { 'indent': '+1' }],
          [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
          [{ 'color': [] }, { 'background': [] }],
          ['link', 'image'],
          ['clean']
        ]
      },
      placeholder: '写点什么呢...',
      theme: 'snow'
    });
    
    // 图片压缩插入
    quill.getModule('toolbar').addHandler('image', function() {
      const input = document.createElement('input');
      input.setAttribute('type', 'file');
      input.setAttribute('accept', 'image/*');
      input.click();
      input.onchange = async () => {
        const file = input.files[0];
        if (!file) return;
        const compressed = await compressImage(file, 800, 0.7); // 最大宽度800px，质量70%
        const reader = new FileReader();
        reader.onload = (e) => {
          const base64 = e.target.result;
          const range = quill.getSelection();
          quill.insertEmbed(range.index, 'image', base64);
        };
        reader.readAsDataURL(compressed);
      };
    });
    
    async function compressImage(file, maxWidth, quality) {
      return new Promise((resolve) => {
        const img = new Image();
        img.onload = function() {
          let w = img.width, h = img.height;
          if (w > maxWidth) {
            h = h * (maxWidth / w);
            w = maxWidth;
          }
          const canvas = document.createElement('canvas');
          canvas.width = w;
          canvas.height = h;
          canvas.getContext('2d').drawImage(img, 0, 0, w, h);
          canvas.toBlob((blob) => {
            resolve(new File([blob], file.name, {type: blob.type}));
          }, file.type, quality);
        };
        img.src = URL.createObjectURL(file);
      });
    }
    
    // 加载现有日记
    const existingEntry = await storage.getEntry(entryDate);
    if (existingEntry) {
      quill.setText('');
      quill.root.innerHTML = existingEntry;
    }
    
    // 事件监听
    document.getElementById('backButton').addEventListener('click', () => {
      if (confirm('您的内容尚未保存，确定要离开吗？')) {
        window.history.back();
      }
    });
    
    document.getElementById('saveButton').addEventListener('click', async () => {
      const content = quill.root.innerHTML;
      showLoading('保存中...');
      try {
        await storage.saveEntry(entryDate, content);
        alert('日记保存成功！');
        window.history.back();
      } catch (error) {
        alert(`保存失败: ${error.message}`);
      } finally {
        hideLoading();
      }
    });
    
    // 自动保存功能
    let saveTimer = null;
    quill.on('text-change', () => {
      // 清除之前的计时器
      if (saveTimer) clearTimeout(saveTimer);
      
      // 设置新的计时器
      saveTimer = setTimeout(async () => {
        const content = quill.root.innerHTML;
        if (content.trim().length === 0) return;
        
        try {
          await storage.saveEntry(entryDate, content);
          console.log('自动保存成功');
        } catch (error) {
          console.warn('自动保存失败:', error.message);
        }
      }, 30000); // 每30秒自动保存一次
    });
  });