// index.js - 主页面逻辑
document.addEventListener('DOMContentLoaded', async function() {
    // 初始化日期
    let currentDate = dayjs();
    let entries = [];
    
    // DOM引用
    const calendarGrid = document.getElementById('calendarGrid');
    const entriesContainer = document.getElementById('entriesContainer');
    const currentMonth = document.getElementById('currentMonth');
    const prevMonthBtn = document.getElementById('prevMonth');
    const nextMonthBtn = document.getElementById('nextMonth');
    const newEntryBtn = document.getElementById('newEntry');
    const userDropdown = document.getElementById('userDropdown');
    const userMenu = document.getElementById('userMenu');
    const logoutBtn = document.getElementById('logout');
    const refreshBtn = document.getElementById('refresh');
    const settingsModal = document.getElementById('settingsModal');
    
    // 检查认证状态
    if (!auth.isAuthenticated()) {
      window.location.href = 'login.html';
      return;
    }
    
    // 初始化UI
    renderCalendar(currentDate);
    await loadEntries();
    
    // 事件监听器
    prevMonthBtn.addEventListener('click', () => {
      currentDate = currentDate.subtract(1, 'month');
      renderCalendar(currentDate);
    });
    
    nextMonthBtn.addEventListener('click', () => {
      currentDate = currentDate.add(1, 'month');
      renderCalendar(currentDate);
    });
    
    newEntryBtn.addEventListener('click', () => {
      const today = dayjs().format('YYYY-MM-DD');
      window.location.href = `editor.html?date=${today}`;
    });
    
    userDropdown.addEventListener('click', () => {
      userMenu.classList.toggle('show');
    });
    
    logoutBtn.addEventListener('click', () => {
      if (confirm('确定要退出登录吗？')) {
        auth.logout();
        window.location.href = 'login.html';
      }
    });
    
    refreshBtn.addEventListener('click', () => {
      loadEntries();
    });
    
    // 关闭下拉菜单（点击外部）
    document.addEventListener('click', (event) => {
      if (!userDropdown.contains(event.target) && 
          !userMenu.contains(event.target)) {
        userMenu.classList.remove('show');
      }
    });
    
    // 渲染日历
    function renderCalendar(date) {
      currentMonth.textContent = `${date.year()}年${date.month() + 1}月`;
      
      const calendar = utils.generateCalendar(date.year(), date.month());
      calendarGrid.innerHTML = '';
      
      // 添加星期标题
      const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
      for (const weekday of weekdays) {
        const dayCell = document.createElement('div');
        dayCell.className = 'calendar-weekday';
        dayCell.textContent = weekday;
        calendarGrid.appendChild(dayCell);
      }
      
      // 添加日期单元格
      calendar.forEach(day => {
        const dayCell = document.createElement('div');
        dayCell.className = 'calendar-day';
        
        if (day !== null) {
          dayCell.textContent = day;
          dayCell.classList.add('calendar-day-active');
          
          // 构造当前月份的完整日期
          const dayDate = dayjs(`${date.year()}-${date.month() + 1}-${day}`).format('YYYY-MM-DD');
          
          // 检查是否有日记条目
          if (entries.some(entry => entry.date === dayDate)) {
            dayCell.classList.add('has-entry');
          }
          
          // 点击处理
          dayCell.addEventListener('click', () => {
            window.location.href = `editor.html?date=${dayDate}`;
          });
        }
        
        calendarGrid.appendChild(dayCell);
      });
    }
    
    // 加载日记条目
    async function loadEntries() {
      try {
        entriesContainer.innerHTML = '<div class="loading">加载日记中...</div>';
        entries = await storage.getEntries();
        
        if (entries.length === 0) {
          entriesContainer.innerHTML = '<div class="empty">还没有日记，开始写第一篇吧！</div>';
          return;
        }
        
        entriesContainer.innerHTML = '';
        
        entries.forEach(entry => {
          const entryEl = document.createElement('div');
          entryEl.className = 'entry-item';
          entryEl.innerHTML = `
            <div class="entry-date">${utils.formatDate(entry.date, 'YYYY年MM月DD日')}</div>
            <div class="entry-snippet">加载中...</div>
          `;
          
          // 加载日记预览
          fetch(entry.url)
            .then(response => response.text())
            .then(text => {
              // 提取第一句话作为预览
              const preview = text.substring(0, 100);
              entryEl.querySelector('.entry-snippet').textContent = 
                preview + (text.length > 100 ? '...' : '');
            });
          
          entryEl.addEventListener('click', () => {
            window.location.href = `editor.html?date=${entry.date}`;
          });
          
          entriesContainer.appendChild(entryEl);
        });
      } catch (error) {
        entriesContainer.innerHTML = `<div class="error">加载失败: ${error.message}</div>`;
        console.error('加载日记错误:', error);
      }
    }
  });