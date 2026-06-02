function generateToNewTabFixedRows() {
  // --- [1. 配置区：保持不变] ---
  var ID_COL_NUM = 6;          // Pro ID 所在的列
  var TITLE_WRITE_COL = 13;    // Title 写入列
  var TITLE_POOL_COL = 253;    // 新 Title 备选池开始列 (即使在IQ列后，脚本也会去读)
  var MAIN_IMG_COL = 24;       // 首图所在列
  var SLIDE_START_COL = 25;    // 轮播图开始列
  var SLIDE_END_COL = 32;      // 轮播图结束列
  var WEIGHT_COL = 237;        // 重量列
  
  var MAX_COPY_COL = 251;      // 🎯 目标只复制到
  var ROW_HEIGHT_1 = 40;       
  var ROW_HEIGHT_234 = 60;     
  // -----------------------------

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sourceSheet = ss.getActiveSheet();
  var selection = sourceSheet.getActiveRange();

  // 1. 获取选中的唯一 ID
  var selectedValues = selection.getValues();
  var selectionStartCol = selection.getColumn();
  var uniqueIds = Array.from(new Set(
    selectedValues.map(function(r) {
      var colOffset = ID_COL_NUM - selectionStartCol;
      return (colOffset >= 0 && colOffset < r.length) ? r[colOffset] : null;
    }).filter(id => id !== "" && id !== null && id !== undefined)
  ));

  if (uniqueIds.length === 0) {
    Browser.msgBox("请确保选中区域包含 ID 列 (" + ID_COL_NUM + ")");
    return;
  }

  // 2. 询问副本数量 (保留弹窗)
  var response = Browser.inputBox("副本生成", "每个商品生成几个副本？", Browser.Buttons.OK_CANCEL);
  if (response == "cancel" || response == "") return;
  var numCopies = parseInt(response);
  if (isNaN(numCopies) || numCopies <= 0) return;

  // 3. 准备目标表 (清空旧内容和格式)
  var targetSheet = ss.getSheetByName("Generated_Upload") || ss.insertSheet("Generated_Upload");
  targetSheet.clear(); 

  // 4. 复制表头 (只取前 4 行，限 IQ 列，且不带格式)
  var headerData = sourceSheet.getRange(1, 1, 4, MAX_COPY_COL).getValues();
  targetSheet.getRange(1, 1, 4, MAX_COPY_COL).setValues(headerData);
  
  targetSheet.setRowHeight(1, ROW_HEIGHT_1);
  targetSheet.setRowHeights(2, 3, ROW_HEIGHT_234);
  targetSheet.setFrozenRows(4);

  var currentTargetRow = 5;
  var allData = sourceSheet.getDataRange().getValues();

  // 5. 核心逻辑
  uniqueIds.forEach(function(id) {
    // 找出该 ID 对应的所有行索引
    var itemRowIndices = [];
    for (var i = 4; i < allData.length; i++) {
      if (allData[i][ID_COL_NUM - 1] == id) itemRowIndices.push(i);
    }

    if (itemRowIndices.length > 0) {
      var rowCount = itemRowIndices.length;
      // 获取源数据块 (限 IQ 列的纯数值)
      var sourceRowsBase = itemRowIndices.map(function(idx) {
        return allData[idx].slice(0, MAX_COPY_COL);
      });
      // 获取该商品的标题池
      var firstRowIdx = itemRowIndices[0];
      var newTitles = allData[firstRowIdx].slice(TITLE_POOL_COL - 1, TITLE_POOL_COL - 1 + numCopies);

      for (var k = 0; k < numCopies; k++) {
        // 在内存中深度克隆当前副本的数据块
        var currentBlock = JSON.parse(JSON.stringify(sourceRowsBase));

        // A. 替换 Title 和 处理重量 (在内存中完成)
        currentBlock.forEach(function(row) {
          // 替换标题
          if (newTitles[k]) row[TITLE_WRITE_COL - 1] = newTitles[k];
          
          // 格式化重量
          var val = parseFloat(row[WEIGHT_COL - 1]);
          if (!isNaN(val)) {
            row[WEIGHT_COL - 1] = val.toFixed(2).toString();
          }
        });

        // B. 80% 概率图片交换 (整块同步)
        if (Math.random() < 0.8) {
          var slides = currentBlock[0].slice(SLIDE_START_COL - 1, SLIDE_END_COL);
          var validIndices = [];
          for (var s = 0; s < slides.length; s++) {
            if (slides[s]) validIndices.push(SLIDE_START_COL - 1 + s);
          }

          if (validIndices.length > 0) {
            var selectedIdx = validIndices[Math.floor(Math.random() * validIndices.length)];
            currentBlock.forEach(function(row) {
              var oldMain = row[MAIN_IMG_COL - 1];
              row[MAIN_IMG_COL - 1] = row[selectedIdx];
              row[selectedIdx] = oldMain;
            });
          }
        }

        // C. 一次性写入当前副本块
        var targetRange = targetSheet.getRange(currentTargetRow, 1, rowCount, MAX_COPY_COL);
        targetRange.setNumberFormat("@"); // 设为文本
        targetRange.setValues(currentBlock);

        currentTargetRow += rowCount;
      }
    }
  });

  targetSheet.activate();
  ss.toast("生成完毕！仅限 IQ 列，无条件格式，运行速度已大幅提升。", "Success");
}
