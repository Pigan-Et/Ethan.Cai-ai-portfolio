/**
 * 🚀 自动化数据同步工具：将 Google Sheets 数据清洗并发布至 GitHub 仓储
 * * 🔒 安全与脱敏说明 (Security & Anonymization Notice):
 * 1. 身份凭证隔离：本公开版源码已对生产环境的个人敏感凭证（Personal Access Token）及
 * 私有仓储路径（Repository Path）进行了统一脱敏与占位符替换（Placeholder Substitution）。
 * 2. 部署建议：在实际私有部署或企业落地时，推荐将 TOKEN 与 REPO 路径托管于 Google Apps Script 
 * 的属性服务（PropertiesService.getScriptProperties()）中，实现代码与密钥的绝对解耦。
 */

// --- 核心上传逻辑 ---
function uploadToGitHub() {
  var ui = SpreadsheetApp.getUi();
  
  // 1. 人工二次确认弹窗（防止误触，建立业务发布防错机制）
  var response = ui.alert(
    '🚀 准备发布到 GitHub', 
    '确认当前表格数据已检查完毕，并同步至线上网页吗？', 
    ui.ButtonSet.YES_NO
  );

  // 如果用户点击“否”或直接关闭弹窗，则中止操作
  if (response !== ui.Button.YES) {
    ui.showModalDialog(HtmlService.createHtmlOutput("<p style='font-family:sans-serif;'>操作已取消，数据未同步。</p>").setWidth(200).setHeight(50), "状态");
    return;
  }

  // --- 2. 配置项初始化（已做脱敏处理） ---
  // [🔒 已脱敏] 请在此处替换为您个人的 GitHub 40位 Classic Token
  var TOKEN = "ghp_YOUR_PERSONAL_ACCESS_TOKEN_PLACEHOLDER"; 
  
  // [🔒 已脱敏] 请在此处替换为您实际的 GitHub 用户名/仓储名称
  var REPO = "YOUR_GITHUB_USERNAME/YOUR_REPOSITORY_NAME"; 
  
  var PATH = "data.csv"; 
  var SHEET_NAME = "寻品web";
  
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);
  
  if (!sheet) {
    ui.alert("错误：未找到名为 '" + SHEET_NAME + "' 的工作表！");
    return;
  }

  // 性能优化：强制刷新挂起操作并精准计算尾行，防止大数据量级下的服务超时
  SpreadsheetApp.flush();
  var lastRow = sheet.getLastRow();
  if (lastRow < 1) {
    ui.alert("错误：表格内没有数据！");
    return;
  }

  // 边界控制：限定读取 A-S 列（共19列）的有效业务数据，拒绝冗余空行扫描
  var data = sheet.getRange(1, 1, lastRow, 19).getValues();
  
  // --- 3. ETL 数据清洗与标准 CSV 格式化 ---
  var cleanData = data.filter(row => row[0] !== "" && row[0] !== null).map(function(row) {
    return row.map(function(cell) {
      var str = String(cell === null ? "" : cell);
      // 容错处理：统一中英文全半角符号，清洗换行符，并对标准 CSV 的双引号进行转义包装
      str = str.replace(/，/g, ",").replace(/“/g, '"').replace(/”/g, '"');
      str = str.replace(/(\r\n|\n|\r)/gm, " ");
      str = str.replace(/"/g, '""');
      return '"' + str + '"';
    }).join(",");
  }).join("\n");
  
  // --- 4. 二进制编码与多阶段 GitHub API 传输 ---
  // 追加 UTF-8 BOM 头 (\uFEFF) 确保导出的 CSV 在 Excel 等客户端打开时呈现完美中文字符流，拒绝乱码
  var csvContent = "\uFEFF" + cleanData;
  var blob = Utilities.newBlob(csvContent, "text/csv; charset=utf-8");
  var base64Content = Utilities.base64Encode(blob.getBytes());
  
  var url = "https://api.github.com/repos/" + REPO + "/contents/" + PATH;
  
  try {
    // 阶段一：发起 GET 请求，预先检索目标文件的最新 SHA 校验码，防止 Git 树树冲突引发的 409 Conflict 错误
    var res = UrlFetchApp.fetch(url, {
      headers: { "Authorization": "token " + TOKEN },
      muteHttpExceptions: true
    });
    
    var sha = (res.getResponseCode() === 200) ? JSON.parse(res.getContentText()).sha : "";

    // 阶段二：使用 PUT 方法提交 Payload，完成文件的动态覆盖更新（或首次新建）
    var uploadRes = UrlFetchApp.fetch(url, {
      method: "put",
      headers: { "Authorization": "token " + TOKEN },
      payload: JSON.stringify({
        "message": "⚡ Automated Data Sync: " + new Date().toLocaleString(),
        "content": base64Content,
        "sha": sha
      }),
      muteHttpExceptions: true
    });

    // 阶段三：基于统一响应状态码的业务层状态通知
    if (uploadRes.getResponseCode() === 200 || uploadRes.getResponseCode() === 201) {
      ss.toast("🚀 数据同步成功！云端看板网页将在几秒内完成热更新。", "系统状态", 5);
    } else {
      ui.alert("同步失败，GitHub 接口返回状态码：" + uploadRes.getResponseCode() + "\n提示：请确认 Token 权限或配置路径是否有效。");
    }
  } catch (e) {
    ui.alert("网络通信异常，请求未送达：" + e.toString());
  }
}

// --- 5. 自动创建菜单（用户交互层挂载） ---
function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu('⚙️ 自动化工具')
    .addItem('🚀 检查无误，同步数据至云端看板', 'uploadToGitHub')
    .addToUi();
}
