// storage.js - GitHub存储管理模块
const storage = (function() {
    // 私有方法
    async function request(endpoint, options = {}) {
      const token = auth.getToken();
      if (!token) throw new Error('未认证');
      
      const GITHUB_USERNAME = 'betterma';
      const GITHUB_REPO = 'mazha';
      
      // 修改为 contents API 路径
      const url = `https://api.github.com/repos/${GITHUB_USERNAME}/${GITHUB_REPO}/contents/${endpoint}`;
      
      try {
        const response = await fetch(`${url}?t=${Date.now()}`, {
          ...options,
          headers: {
            'Authorization': `token ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/vnd.github.v3+json',
            ...(options.headers || {})
          }
        });
        
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || `GitHub API错误：${response.status}`);
        }
        
        return response.json();
      } catch (error) {
        console.error('GitHub存储错误:', error);
        throw error;
      }
    }
    
    // 公共接口
    return {
      // 保存记忆条目
      saveEntry: async function(date, content) {
        const filePath = `diary-entries/${date}.md`;
        const message = `${date} ${content ? '记忆已更新' : '记忆已删除'}`;
        
        try {
          // 检查文件是否存在
          const { sha } = await request(`book/${filePath}`);
          // 更新现有文件
          return request(`book/${filePath}`, {
            method: 'PUT',
            body: JSON.stringify({
              message,
              content: btoa(unescape(encodeURIComponent(content))),
              sha
            })
          });
        } catch {
          // 创建新文件
          return request(`book/${filePath}`, {
            method: 'PUT',
            body: JSON.stringify({
              message,
              content: btoa(unescape(encodeURIComponent(content)))
            })
          });
        }
      },
      
      // 获取记忆条目
      getEntry: async function(date) {
        const filePath = `diary-entries/${date}.md`;
        
        try {
          const file = await request(`book/${filePath}`);
          return decodeURIComponent(escape(atob(file.content)));
        } catch (error) {
          console.log(`没有找到${date}的记忆`);
          return null;
        }
      },
      
      // 获取所有记忆日期
      getEntries: async function() {
        try {
          const data = await request('book/diary-entries');
          return data
            .filter(item => item.type === 'file' && item.name.endsWith('.md'))
            .map(item => ({
              date: item.name.replace('.md', ''),
              path: item.path,
              url: item.download_url
            }))
            .sort((a, b) => b.date.localeCompare(a.date));
        } catch (error) {
          return [];
        }
      },

      deleteEntry: async function(date) {
        const filePath = `diary-entries/${date}.md`;
        // 先获取 sha
        const { sha } = await request(`book/${filePath}`);
        return request(`book/${filePath}`, {
          method: 'DELETE',
          body: JSON.stringify({
            message: `${date} 记忆已删除`,
            sha
          })
        });
      },

      // 新增：获取任意文件内容（如导航JSON）
      getFile: async function(filename) {
        try {
          // 自动补全路径
          let path = filename.startsWith('book/') ? filename : 'book/' + filename;
          const file = await request(path);
          const content = decodeURIComponent(escape(atob(file.content)));
          return { content, sha: file.sha };
        } catch (error) {
          return { content: '', sha: null };
        }
      },

      // 新增：保存任意文件内容（如导航JSON）
      saveFile: async function(filename, content) {
        let sha = null;
        try {
          const file = await request(`book/${filename}`);
          sha = file.sha;
        } catch (e) {
          // 文件不存在时sha为null
        }
        return request(`book/${filename}`, {
          method: 'PUT',
          body: JSON.stringify({
            message: `${filename} 已更新`,
            content: btoa(unescape(encodeURIComponent(content))),
            ...(sha ? { sha } : {})
          })
        });
      }
    };
  })();