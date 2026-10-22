/**
 * 서울지역 유가 통계 대시보드 - Client Application Logic
 */

let fuelData = [];
let chartInstance = null;
let currentYearFilter = 'ALL';
let currentSort = { column: 'period', ascending: false };
let currentModalRecord = null;
let currentModalFormat = 'format-post';

// DOM Elements
const lastUpdatedText = document.getElementById('lastUpdatedText');
const themeToggleBtn = document.getElementById('themeToggleBtn');
const quickCopyLatestBtn = document.getElementById('quickCopyLatestBtn');

// KPI elements
const kpiGasolinePrice = document.getElementById('kpiGasolinePrice');
const kpiGasolineChange = document.getElementById('kpiGasolineChange');
const kpiGasolineMax = document.getElementById('kpiGasolineMax');
const kpiGasolineMin = document.getElementById('kpiGasolineMin');
const latestMonthGasolineTag = document.getElementById('latestMonthGasolineTag');

const kpiDieselPrice = document.getElementById('kpiDieselPrice');
const kpiDieselChange = document.getElementById('kpiDieselChange');
const kpiDieselMax = document.getElementById('kpiDieselMax');
const kpiDieselMin = document.getElementById('kpiDieselMin');
const latestMonthDieselTag = document.getElementById('latestMonthDieselTag');

const kpiLpgPrice = document.getElementById('kpiLpgPrice');
const kpiLpgChange = document.getElementById('kpiLpgChange');
const kpiLpgMax = document.getElementById('kpiLpgMax');
const kpiLpgMin = document.getElementById('kpiLpgMin');
const latestMonthLpgTag = document.getElementById('latestMonthLpgTag');

// Filter & Table Elements
const yearFilterGroup = document.getElementById('yearFilterGroup');
const searchInput = document.getElementById('searchInput');
const dataTable = document.getElementById('dataTable');
const tableBody = document.getElementById('tableBody');
const tableCountBadge = document.getElementById('tableCountBadge');
const downloadCsvBtn = document.getElementById('downloadCsvBtn');

// Modal Elements
const copyModal = document.getElementById('copyModal');
const modalCloseBtn = document.getElementById('modalCloseBtn');
const modalTitle = document.getElementById('modalTitle');
const copyPreviewTextarea = document.getElementById('copyPreviewTextarea');
const modalConfirmCopyBtn = document.getElementById('modalConfirmCopyBtn');
const tabButtons = document.querySelectorAll('.tab-btn');

// Toast
const toast = document.getElementById('toast');
const toastMessage = document.getElementById('toastMessage');

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  loadData();
  setupEventListeners();
});

// Load JSON Data
async function loadData() {
  try {
    const res = await fetch('data.json');
    if (!res.ok) throw new Error('Data load failed');
    const data = await res.json();
    
    fuelData = data.history || [];
    if (data.last_updated) {
      const updateDate = new Date(data.last_updated);
      if (!isNaN(updateDate.getTime())) {
        lastUpdatedText.textContent = `최근 갱신: ${updateDate.toLocaleDateString('ko-KR')}`;
      } else {
        lastUpdatedText.textContent = `최근 갱신: ${data.last_updated}`;
      }
    }

    renderKPIs();
    renderYearFilters();
    renderChart();
    renderTable();
  } catch (err) {
    console.error('Failed to load fuel data:', err);
    showToast('데이터를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.');
  }
}

// Setup Event Listeners
function setupEventListeners() {
  // Theme Toggle
  themeToggleBtn.addEventListener('click', toggleTheme);

  // Quick Copy Latest Month
  quickCopyLatestBtn.addEventListener('click', () => {
    if (fuelData.length > 0) {
      const latest = fuelData[fuelData.length - 1];
      openCopyModal(latest);
    }
  });

  // Year Filter Buttons
  yearFilterGroup.addEventListener('click', (e) => {
    const btn = e.target.closest('.filter-pill');
    if (!btn) return;
    
    document.querySelectorAll('.filter-pill').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentYearFilter = btn.dataset.year;

    updateChartData();
    renderTable();
  });

  // Search Input
  searchInput.addEventListener('input', () => {
    renderTable();
  });

  // Table Sort Headers
  document.querySelectorAll('th.sortable').forEach(th => {
    th.addEventListener('click', () => {
      const sortKey = th.dataset.sort;
      if (currentSort.column === sortKey) {
        currentSort.ascending = !currentSort.ascending;
      } else {
        currentSort.column = sortKey;
        currentSort.ascending = true;
      }
      renderTable();
    });
  });

  // Download CSV
  downloadCsvBtn.addEventListener('click', exportToCsv);

  // Modal Controls
  modalCloseBtn.addEventListener('click', closeCopyModal);
  copyModal.addEventListener('click', (e) => {
    if (e.target === copyModal) closeCopyModal();
  });

  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      tabButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentModalFormat = btn.dataset.tab;
      updateModalContent();
    });
  });

  modalConfirmCopyBtn.addEventListener('click', () => {
    navigator.clipboard.writeText(copyPreviewTextarea.value).then(() => {
      showToast('클립보드에 복사되었습니다! 게시판에 붙여넣기(Ctrl+V)하세요.');
      closeCopyModal();
    }).catch(err => {
      copyPreviewTextarea.select();
      document.execCommand('copy');
      showToast('복사되었습니다!');
      closeCopyModal();
    });
  });

  // Keyboard Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && copyModal.classList.contains('active')) {
      closeCopyModal();
    }
  });
}

// Render Summary KPIs
function renderKPIs() {
  if (fuelData.length === 0) return;

  const latest = fuelData[fuelData.length - 1];
  const prev = fuelData.length > 1 ? fuelData[fuelData.length - 2] : null;

  // Month Tags
  const monthLabel = `${latest.period} 평균`;
  latestMonthGasolineTag.textContent = monthLabel;
  latestMonthDieselTag.textContent = monthLabel;
  latestMonthLpgTag.textContent = monthLabel;

  // Prices
  kpiGasolinePrice.textContent = latest.gasoline.toLocaleString('ko-KR', { minimumFractionDigits: 2 });
  kpiDieselPrice.textContent = latest.diesel.toLocaleString('ko-KR', { minimumFractionDigits: 2 });
  kpiLpgPrice.textContent = latest.lpg.toLocaleString('ko-KR', { minimumFractionDigits: 2 });

  // Calculate MoM Changes
  renderChangeBadge(kpiGasolineChange, latest.gasoline, prev ? prev.gasoline : null);
  renderChangeBadge(kpiDieselChange, latest.diesel, prev ? prev.diesel : null);
  renderChangeBadge(kpiLpgChange, latest.lpg, prev ? prev.lpg : null);

  // Year Max / Min for latest year
  const sameYearData = fuelData.filter(d => d.year === latest.year);
  if (sameYearData.length > 0) {
    const gasMax = Math.max(...sameYearData.map(d => d.gasoline));
    const gasMin = Math.min(...sameYearData.map(d => d.gasoline));
    kpiGasolineMax.textContent = `${gasMax.toLocaleString('ko-KR', { minimumFractionDigits: 2 })}원`;
    kpiGasolineMin.textContent = `${gasMin.toLocaleString('ko-KR', { minimumFractionDigits: 2 })}원`;

    const dieselMax = Math.max(...sameYearData.map(d => d.diesel));
    const dieselMin = Math.min(...sameYearData.map(d => d.diesel));
    kpiDieselMax.textContent = `${dieselMax.toLocaleString('ko-KR', { minimumFractionDigits: 2 })}원`;
    kpiDieselMin.textContent = `${dieselMin.toLocaleString('ko-KR', { minimumFractionDigits: 2 })}원`;

    const lpgMax = Math.max(...sameYearData.map(d => d.lpg));
    const lpgMin = Math.min(...sameYearData.map(d => d.lpg));
    kpiLpgMax.textContent = `${lpgMax.toLocaleString('ko-KR', { minimumFractionDigits: 2 })}원`;
    kpiLpgMin.textContent = `${lpgMin.toLocaleString('ko-KR', { minimumFractionDigits: 2 })}원`;
  }
}

function renderChangeBadge(element, currentVal, prevVal) {
  if (!prevVal) {
    element.innerHTML = `<span class="change-pill">-</span><span class="change-desc">전월 데이터 없음</span>`;
    return;
  }
  const diff = currentVal - prevVal;
  const pct = (diff / prevVal) * 100;
  const isUp = diff >= 0;
  const sign = isUp ? '▲' : '▼';
  const cls = isUp ? 'up' : 'down';

  element.innerHTML = `
    <span class="change-pill ${cls}">${sign} ${Math.abs(diff).toFixed(2)}원 (${Math.abs(pct).toFixed(2)}%)</span>
    <span class="change-desc">전월 대비</span>
  `;
}

// Render dynamic year filter pills based on latest year in data
function renderYearFilters() {
  if (fuelData.length === 0) return;
  const latestYear = Math.max(...fuelData.map(d => d.year));
  const prevYear = latestYear - 1;

  yearFilterGroup.innerHTML = `
    <button class="filter-pill ${currentYearFilter === 'ALL' ? 'active' : ''}" data-year="ALL">최근 (작년~현재)</button>
    <button class="filter-pill ${currentYearFilter === String(latestYear) ? 'active' : ''}" data-year="${latestYear}">${latestYear}년</button>
    <button class="filter-pill ${currentYearFilter === String(prevYear) ? 'active' : ''}" data-year="${prevYear}">${prevYear}년</button>
  `;
}

// Chart Data: 최근 갱신일 기준 작년 1월부터 최근 갱신월까지 표시
function getChartData() {
  if (fuelData.length === 0) return [];
  const latestYear = Math.max(...fuelData.map(d => d.year));
  const startYear = latestYear - 1;

  if (currentYearFilter === 'ALL') {
    return fuelData.filter(d => d.year >= startYear);
  }
  return fuelData.filter(d => d.year === parseInt(currentYearFilter, 10));
}

// Table Data: 최근 갱신일 기준 작년 1월부터 최근 갱신월까지 표시
function getTableData() {
  return getChartData();
}

function renderChart() {
  const ctx = document.getElementById('fuelChart').getContext('2d');
  const filtered = getChartData();

  const labels = filtered.map(d => d.period);
  const gasolineData = filtered.map(d => d.gasoline);
  const dieselData = filtered.map(d => d.diesel);
  const lpgData = filtered.map(d => d.lpg);

  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  const gridColor = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)';
  const textColor = isDark ? '#94a3b8' : '#475569';

  chartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [
        {
          label: '보통휘발유',
          data: gasolineData,
          borderColor: '#f59e0b',
          backgroundColor: 'rgba(245, 158, 11, 0.1)',
          borderWidth: 3,
          pointBackgroundColor: '#f59e0b',
          pointRadius: 4,
          pointHoverRadius: 7,
          tension: 0.35,
          fill: true
        },
        {
          label: '자동차용경유',
          data: dieselData,
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.08)',
          borderWidth: 3,
          pointBackgroundColor: '#10b981',
          pointRadius: 4,
          pointHoverRadius: 7,
          tension: 0.35,
          fill: true
        },
        {
          label: '자동차부탄 (LPG)',
          data: lpgData,
          borderColor: '#06b6d4',
          backgroundColor: 'rgba(6, 182, 212, 0.08)',
          borderWidth: 3,
          pointBackgroundColor: '#06b6d4',
          pointRadius: 4,
          pointHoverRadius: 7,
          tension: 0.35,
          fill: true
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false,
      },
      plugins: {
        legend: {
          position: 'top',
          labels: {
            color: textColor,
            font: { family: "'Inter', 'Noto Sans KR'", size: 12, weight: '600' },
            usePointStyle: true,
            boxWidth: 8
          }
        },
        tooltip: {
          backgroundColor: isDark ? 'rgba(17, 24, 39, 0.95)' : 'rgba(255, 255, 255, 0.95)',
          titleColor: isDark ? '#f8fafc' : '#0f172a',
          bodyColor: isDark ? '#cbd5e1' : '#334155',
          borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : '#e2e8f0',
          borderWidth: 1,
          padding: 12,
          boxPadding: 6,
          usePointStyle: true,
          callbacks: {
            title: (items) => `${items[0].label} 평균가격`,
            label: (ctx) => ` ${ctx.dataset.label}: ${ctx.parsed.y.toLocaleString('ko-KR', { minimumFractionDigits: 2 })} 원/L`
          }
        }
      },
      scales: {
        x: {
          grid: { color: gridColor },
          ticks: { color: textColor, font: { family: "'Inter', 'Noto Sans KR'", size: 11 } }
        },
        y: {
          grid: { color: gridColor },
          ticks: {
            color: textColor,
            font: { family: "'Inter', 'Noto Sans KR'", size: 11 },
            callback: (val) => `${val.toLocaleString()}원`
          }
        }
      }
    }
  });
}

function updateChartData() {
  if (!chartInstance) return;
  const filtered = getChartData();

  chartInstance.data.labels = filtered.map(d => d.period);
  chartInstance.data.datasets[0].data = filtered.map(d => d.gasoline);
  chartInstance.data.datasets[1].data = filtered.map(d => d.diesel);
  chartInstance.data.datasets[2].data = filtered.map(d => d.lpg);
  chartInstance.update();
}

// Render Table
function renderTable() {
  const query = searchInput.value.trim().toLowerCase();
  let list = getTableData();

  if (query) {
    list = list.filter(item => 
      item.period.toLowerCase().includes(query) ||
      item.display_name.toLowerCase().includes(query)
    );
  }

  // Sort
  list.sort((a, b) => {
    let valA = a[currentSort.column];
    let valB = b[currentSort.column];
    if (typeof valA === 'string') {
      return currentSort.ascending ? valA.localeCompare(valB) : valB.localeCompare(valA);
    }
    return currentSort.ascending ? valA - valB : valB - valA;
  });

  tableCountBadge.textContent = `총 ${list.length}건`;

  if (list.length === 0) {
    tableBody.innerHTML = `<tr><td colspan="5" class="td-center" style="padding: 36px; color: var(--text-muted);">검색 결과가 없습니다.</td></tr>`;
    return;
  }

  tableBody.innerHTML = list.map(item => `
    <tr>
      <td class="td-center">
        <span class="period-badge">${item.display_name}</span>
      </td>
      <td class="td-right" style="color: var(--color-gasoline); font-weight: 700;">
        ${item.gasoline.toLocaleString('ko-KR', { minimumFractionDigits: 2 })}
      </td>
      <td class="td-right" style="color: var(--color-diesel); font-weight: 700;">
        ${item.diesel.toLocaleString('ko-KR', { minimumFractionDigits: 2 })}
      </td>
      <td class="td-right" style="color: var(--color-lpg); font-weight: 700;">
        ${item.lpg.toLocaleString('ko-KR', { minimumFractionDigits: 2 })}
      </td>
      <td class="td-center">
        <button class="btn-table-copy" onclick="openCopyModalByPeriod('${item.period}')" title="게시판 복사용 텍스트">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="icon-sm">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
          </svg>
          <span>복사</span>
        </button>
      </td>
    </tr>
  `).join('');
}

// Global modal trigger
window.openCopyModalByPeriod = function(period) {
  const item = fuelData.find(d => d.period === period);
  if (item) openCopyModal(item);
};

// Copy Modal Handlers
function openCopyModal(record) {
  currentModalRecord = record;
  modalTitle.textContent = `${record.display_name} - 게시판 복사`;
  updateModalContent();
  copyModal.classList.add('active');
  copyModal.setAttribute('aria-hidden', 'false');
}

function closeCopyModal() {
  copyModal.classList.remove('active');
  copyModal.setAttribute('aria-hidden', 'true');
}

function updateModalContent() {
  if (!currentModalRecord) return;
  const r = currentModalRecord;

  let text = '';
  if (currentModalFormat === 'format-post') {
    text = `📢 [${r.display_name} 서울지역 유종별 평균 판매가격 공지]

■ 구분 : ${r.display_name}
■ 지역 : 서울특별시 (VAT 포함)
──────────────────────────────
• 보통휘발유 : ${r.gasoline.toLocaleString('ko-KR', { minimumFractionDigits: 2 })} 원/L
• 자동차용경유 : ${r.diesel.toLocaleString('ko-KR', { minimumFractionDigits: 2 })} 원/L
• 자동차부탄 : ${r.lpg.toLocaleString('ko-KR', { minimumFractionDigits: 2 })} 원/L
──────────────────────────────
※ 출처 : 한국석유공사 오피넷 (Opinet)`;
  } else if (currentModalFormat === 'format-markdown') {
    text = `| 구분 | 보통휘발유 (원/L) | 자동차용경유 (원/L) | 자동차부탄 (원/L) |
| :---: | :---: | :---: | :---: |
| **${r.display_name}** | ${r.gasoline.toLocaleString('ko-KR', { minimumFractionDigits: 2 })} | ${r.diesel.toLocaleString('ko-KR', { minimumFractionDigits: 2 })} | ${r.lpg.toLocaleString('ko-KR', { minimumFractionDigits: 2 })} |`;
  } else if (currentModalFormat === 'format-text') {
    text = `${r.display_name} | 보통휘발유: ${r.gasoline.toLocaleString('ko-KR', { minimumFractionDigits: 2 })}원 | 자동차용경유: ${r.diesel.toLocaleString('ko-KR', { minimumFractionDigits: 2 })}원 | 자동차부탄: ${r.lpg.toLocaleString('ko-KR', { minimumFractionDigits: 2 })}원`;
  }

  copyPreviewTextarea.value = text;
}

// CSV Export
function exportToCsv() {
  const filtered = getTableData();
  if (filtered.length === 0) {
    showToast('저장할 데이터가 없습니다.');
    return;
  }

  let csvContent = '\uFEFF'; // UTF-8 BOM for Korean Excel
  csvContent += '구분,연도,월,보통휘발유(원/L),자동차용경유(원/L),자동차부탄(원/L)\r\n';

  filtered.forEach(row => {
    csvContent += `"${row.display_name}",${row.year},${row.month},${row.gasoline},${row.diesel},${row.lpg}\r\n`;
  });

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `오피넷_서울유가_월간통계_${new Date().toISOString().slice(0,10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  showToast('CSV 파일이 다운로드되었습니다.');
}

// Theme Toggle
function initTheme() {
  const saved = localStorage.getItem('app-theme') || 'dark';
  document.documentElement.setAttribute('data-theme', saved);
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme');
  const next = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('app-theme', next);

  if (chartInstance) {
    chartInstance.destroy();
    renderChart();
  }
}

// Toast Notification
let toastTimer = null;
function showToast(msg) {
  toastMessage.textContent = msg;
  toast.classList.add('show');
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.classList.remove('show');
  }, 2600);
}
