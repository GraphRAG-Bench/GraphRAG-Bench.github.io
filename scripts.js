// gtag 配置
window.dataLayer = window.dataLayer || [];
function gtag() {
  dataLayer.push(arguments);
}
gtag("js", new Date());
gtag("config", "G-H9XFCMDPNS");


// 搜索功能
function searchTable() {
  const input = document.getElementById("searchInput").value.toLowerCase();
  const tables = ["leaderboard-body-story", "leaderboard-body-medical"];

  tables.forEach(tableId => {
    const rows = document.querySelectorAll(`#${tableId} tr`);
    rows.forEach(row => {
      const text = row.innerText.toLowerCase();
      row.style.display = text.includes(input) ? "" : "none";
    });
  });
}

// 列显隐
function toggleColumn(colIndex, show) {
  const tableIds = ["leaderboard-table-story", "leaderboard-table-medical"];

  tableIds.forEach(tableId => {
    const table = document.getElementById(tableId);
    if (!table) return;

    table.querySelectorAll("thead tr").forEach(tr => {
      const cell = tr.cells[colIndex];
      if (cell) cell.style.display = show ? "" : "none";
    });

    table.querySelectorAll("tbody tr").forEach(tr => {
      const cell = tr.cells[colIndex];
      if (cell) cell.style.display = show ? "" : "none";
    });
  });
}


function applyInitialColumnVisibility() {
  document.querySelectorAll(".custom-checkbox").forEach(checkbox => {
    const col = parseInt(checkbox.dataset.col);
    toggleColumn(col, checkbox.checked);
  });
}

// 过滤模型
function applyModelFilters() {
  const tableIds = ["leaderboard-body-story", "leaderboard-body-medical"];
  const openSourceFilters = [];
  const reasoningFilters = [];

  if (document.getElementById("open-source-yes").checked) {
    openSourceFilters.push("open-source");
  }
  if (document.getElementById("proprietary-yes").checked) {
    openSourceFilters.push("proprietary");
  }

  if (document.getElementById("reasoning-yes").checked) {
    reasoningFilters.push("reasoning");
  }
  if (document.getElementById("vanilla-yes").checked) {
    reasoningFilters.push("non-reasoning");
  }

  tableIds.forEach(tableId => {
    const rows = document.querySelectorAll(`#${tableId} tr`);
    rows.forEach(row => {
      const cells = row.querySelectorAll("td");
      const openSourceText = cells[cells.length - 3]?.innerText.trim().toLowerCase();
      const reasoningText = cells[cells.length - 2]?.innerText.trim().toLowerCase();

      const openMatch = openSourceFilters.includes(openSourceText);
      const reasoningMatch = reasoningFilters.includes(reasoningText);

      row.style.display = (openMatch && reasoningMatch) ? "" : "none";
    });
  });
}


// 存储每个表格的原始顺序
let originalOrderMap = {};
let currentSortState = {};  // 记录每张表的当前排序状态
const columnOrder = [
  "Model", "Rank", "Average", "Date",
  "Fact_ACC", "Fact_ROUGE_L",
  "Reason_ACC", "Reason_ROUGE_L",
  "Summarize_ACC", "Summarize_Cov",
  "Creative_ACC", "Creative_FS", "Creative_Cov",
  "Link"
];


function loadCSVData(csvFile, tableId, tbodyId) {
  Papa.parse(csvFile, {
    download: true,
    header: true,
    complete: function (results) {
      const data = results.data;
      const tbody = document.getElementById(tbodyId);
      const table = document.getElementById(tableId);

      let originalRows = [];

      data.forEach(row => {
        const tr = document.createElement("tr");

        columnOrder.forEach(col => {
          const td = document.createElement("td");
          if (col === "Link") {
            td.innerHTML = `<p style="text-align: center;"><a href="${row[col]}" target="_blank">🔗</a></p>`;
          } else {
            td.innerHTML = `<p class="number">${row[col]}</p>`;
          }
          tr.appendChild(td);
        });

        originalRows.push(tr.cloneNode(true));
        tbody.appendChild(tr);
      });

      originalOrderMap[tbodyId] = originalRows;
      currentSortState[tableId] = { column: null, direction: "none" };

      attachSortEvents(tableId, tbodyId);
    }
  });
}

function attachSortEvents(tableId, tbodyId) {
  const table = document.getElementById(tableId);
  const headers = table.querySelectorAll("thead th[data-sort]");

  headers.forEach(header => {
    const colIndex = parseInt(header.getAttribute("data-col"));
    if (isNaN(colIndex)) return;

    header.style.cursor = "pointer";
    header.addEventListener("click", () => sortTable(colIndex, header, tableId, tbodyId));
  });
}

function sortTable(columnIndex, headerEl, tableId, tbodyId) {
  const table = document.getElementById(tableId);
  const tbody = document.getElementById(tbodyId);
  if (!table || !tbody) return;

  const rows = Array.from(tbody.querySelectorAll("tr"));

  let sortState = currentSortState[tableId] || { column: null, direction: "none" };

  // 重置所有箭头
  table.querySelectorAll("th").forEach(th => {
    th.setAttribute("data-sort", "none");
    const arrow = th.querySelector(".arrow");
    if (arrow) arrow.textContent = "↕";
  });

  // 决定新的排序状态
  let newState;
  if (sortState.column === columnIndex) {
    newState = sortState.direction === "desc" ? "asc" : (sortState.direction === "asc" ? "none" : "desc");
  } else {
    newState = "desc";
  }

  currentSortState[tableId] = {
    column: columnIndex,
    direction: newState
  };

  headerEl.setAttribute("data-sort", newState);
  const arrow = headerEl.querySelector(".arrow");
  if (arrow) {
    arrow.textContent = newState === "asc" ? "↑" : newState === "desc" ? "↓" : "↕";
  }

  if (newState === "none") {
    tbody.innerHTML = "";
    if (originalOrderMap[tbodyId]) {
      originalOrderMap[tbodyId].forEach(row => tbody.appendChild(row.cloneNode(true)));
    }
    return;
  }

  rows.sort((a, b) => {
    let valA = a.children[columnIndex]?.querySelector("p")?.innerText.trim() || "";
    let valB = b.children[columnIndex]?.querySelector("p")?.innerText.trim() || "";

    const dateRegex = /^\d{4}-\d{2}$/;
    const isDate = dateRegex.test(valA) && dateRegex.test(valB);

    if (isDate) {
      return newState === "asc" ? valA.localeCompare(valB) : valB.localeCompare(valA);
    }

    const numA = parseFloat(valA);
    const numB = parseFloat(valB);

    const isNumeric = !isNaN(numA) && !isNaN(numB);
    if (isNumeric) {
      return newState === "asc" ? numA - numB : numB - numA;
    }

    return newState === "asc" ? valA.localeCompare(valB) : valB.localeCompare(valA);
  });

  tbody.innerHTML = "";
  rows.forEach(row => tbody.appendChild(row));
}


// slider 功能
document.addEventListener("DOMContentLoaded", function () {
  const slides = document.querySelectorAll(".slider-item");
  let current = 0;

  function showSlide(index) {
    slides.forEach((slide, i) => {
      slide.classList.toggle("active", i === index);
    });
  }

  document.getElementById("prev_btn").addEventListener("click", () => {
    current = (current - 1 + slides.length) % slides.length;
    showSlide(current);
  });

  document.getElementById("next_btn").addEventListener("click", () => {
    current = (current + 1) % slides.length;
    showSlide(current);
  });

  showSlide(current);
});

// 初始化事件
document.addEventListener("DOMContentLoaded", () => {
  applyInitialColumnVisibility();
  document.querySelectorAll(".custom-checkbox").forEach(checkbox => {
    checkbox.addEventListener("change", () => {
      const col = parseInt(checkbox.dataset.col);
      toggleColumn(col, checkbox.checked);
    });
  });

  const filterCheckboxes = document.querySelectorAll(
    "#open-source-yes, #proprietary-yes, #reasoning-yes, #vanilla-yes"
  );
  filterCheckboxes.forEach(cb => cb.addEventListener("change", applyModelFilters));
  applyModelFilters();
});

// ✅ 页面加载后分别加载两个 leaderboard
document.addEventListener("DOMContentLoaded", () => {
  loadCSVData("story_data.csv", "leaderboard-table-story", "leaderboard-body-story");
  loadCSVData("medical_data.csv", "leaderboard-table-medical", "leaderboard-body-medical");
});

function openLeaderboard(leaderboard, updateHash = true) {
  const allBoards = ["story", "medical"]; // 所有可能的 leaderboard ID
  allBoards.forEach((id) => {
    document.getElementById(`leaderboard-${id}`).style.display = "none";
  });

  // 支持一次性显示多个（传入逗号分隔字符串）
  const targets = leaderboard.split(',');
  targets.forEach((id) => {
    const el = document.getElementById(`leaderboard-${id.trim().toLowerCase()}`);
    if (el) el.style.display = "block";
  });

  var tablinks = document.getElementsByClassName("tablinks");
  for (var i = 0; i < tablinks.length; i++) {
    tablinks[i].classList.remove("active");
  }

  targets.forEach((id) => {
    const link = document.querySelector(`[data-leaderboard="${id.trim()}"]`);
    if (link) link.classList.add("active");
  });

  if (updateHash) {
    window.location.hash = leaderboard.toLowerCase();
  }

  // toggleSelectedRow();
}


function openSection(leaderboard) {
  var tabcontent = document.getElementsByClassName("tabcontent");
  for (var i = 0; i < tabcontent.length; i++) {
    tabcontent[i].style.display = "none";
  }

  var tablinks = document.getElementsByClassName("sectionlinks");
  for (var i = 0; i < tablinks.length; i++) {
    tablinks[i].classList.remove("active");
  }

  document.getElementById(`sections-${leaderboard}`).style.display = "block";
  document.querySelector(`[data-sections="${leaderboard}"]`).classList.add("active");

  // Update URL hash if requested
  if (updateHash) {
    window.location.hash = leaderboard.toLowerCase();
  }
}

function preCopy() {
  //执行复制
  let btn = document.querySelector(".btn-pre-copy");
  let pre = document.querySelector("#copy-content");
  //为了实现复制功能。新增一个临时的textarea节点。使用他来复制内容
  let temp = document.createElement("textarea");
  temp.textContent = pre.textContent;
  pre.appendChild(temp);
  temp.select();
  document.execCommand("Copy");
  temp.remove();
  //修改按钮名
  btn.textContent = "Copied";
  //一定时间后吧按钮名改回来
  setTimeout(() => {
    btn.textContent = "Copy";
  }, 1500);
}

document.addEventListener('DOMContentLoaded', function () {
  var tabs = document.querySelectorAll('.tablinks:not(.sectionlinks)');
  tabs.forEach(function (tab) {
    tab.addEventListener('click', function (event) {
      openLeaderboard(this.getAttribute('data-leaderboard'));
      // Scroll to leaderboard section after a slight delay
      setTimeout(() => {
        document.querySelector('.leaderboard').scrollIntoView({ behavior: 'smooth' });
      }, 100);
    });
  });

  // Check URL hash for tab selection
  const hash = window.location.hash.slice(1).toLowerCase();
  if (hash === 'main' || hash === 'mm' || hash === 'text') {
    const tabName = hash.charAt(0).toUpperCase() + hash.slice(1);
    openLeaderboard(tabName, false);
    // Scroll to leaderboard section after a slight delay
    setTimeout(() => {
      document.querySelector('.leaderboard').scrollIntoView({ behavior: 'smooth' });
    }, 100);
  } else if (hash === 'about') {
    setTimeout(() => {
      document.querySelector('#about').scrollIntoView({ behavior: 'smooth' });
    }, 100);
  } else if (hash === 'news') {
    setTimeout(() => {
      document.querySelector('#news').scrollIntoView({ behavior: 'smooth' });
    }, 100);
  } else if (hash === 'resources') {
    setTimeout(() => {
      document.querySelector('#resources').scrollIntoView({ behavior: 'smooth' });
    }, 100);
  } else if (hash === 'examples') {
    setTimeout(() => {
      document.querySelector('#examples').scrollIntoView({ behavior: 'smooth' });
    }, 100);
  } else {
    // Open the 'lite' leaderboard by default if no hash
    openLeaderboard('story,medical', false);
  }
});

const sidebarLinks = document.querySelectorAll('#sidebar a');
const sections = document.querySelectorAll('.link-section');
window.addEventListener('scroll', () => {
  const scrollPosition = window.scrollY;

  sections.forEach((section, index) => {
    const sectionTop = section.offsetTop;
    const sectionHeight = section.offsetHeight;

    if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
      sidebarLinks.forEach(link => link.classList.remove('active'));
      sidebarLinks[index].classList.add('active');
    }
  });
});
