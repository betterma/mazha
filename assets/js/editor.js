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
      
      try {
        await storage.saveEntry(entryDate, content);
        alert('日记保存成功！');
        window.history.back();
      } catch (error) {
        alert(`保存失败: ${error.message}`);
        console.error('保存错误:', error);
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