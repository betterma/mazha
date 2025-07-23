// auth.js - 认证管理模块
const auth = (function() {
    // 私有方法
    const GITHUB_USER_KEY = 'github_username';
    const GITHUB_TOKEN_KEY = 'github_token';
    const REPO_NAME_KEY = 'github_repo';
  
    return {
      // 检查是否已认证
      isAuthenticated: function() {
        return localStorage.getItem(GITHUB_TOKEN_KEY) !== null;
      },
      
      // 保存令牌
      saveToken: function(token) {
        localStorage.setItem(GITHUB_TOKEN_KEY, token);
      },
      
      // 获取令牌
      getToken: function() {
        return localStorage.getItem(GITHUB_TOKEN_KEY);
      },
      
      // 设置仓库信息
      setRepoInfo: function(username, repo) {
        localStorage.setItem(GITHUB_USER_KEY, username);
        localStorage.setItem(REPO_NAME_KEY, repo);
      },
      
      // 获取仓库信息
      getRepoInfo: function() {
        const username = localStorage.getItem(GITHUB_USER_KEY);
        const repo = localStorage.getItem(REPO_NAME_KEY);
        return { username, repo };
      },
      
      // 清除所有认证信息
      logout: function() {
        localStorage.removeItem(GITHUB_TOKEN_KEY);
        localStorage.removeItem(GITHUB_USER_KEY);
        localStorage.removeItem(REPO_NAME_KEY);
      }
    };
  })();