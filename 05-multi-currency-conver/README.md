# 固定汇率多币种换算器

## 解决什么问题
跨国商务或多地区跨境电商运营中，频繁进行人民币与东南亚等多种外币（如 SGD, VND, IDR, MYR, PHP, THB）的换算时，传统计算器操作繁琐且效率低下。

## 核心功能
- 支持人民币（CNY）与多种东南亚常用货币（新加坡元、越南盾、印尼盾、马来西亚令吉、菲律宾比索、泰铢）按内部固定汇率双向换算
- 聚焦输入框自动高亮并计算，支持一键清空与格式化结果复制
- 苹果风格（Apple-style）简洁 UI，响应式布局适配桌面端与移动端

## 使用方式
1. 直接在浏览器中打开 `index.html` 文件
2. 选择任意一种货币输入金额，其他币种自动完成换算
3. 点击“复制结果”可一键导出所有币种换算数据

## 技术实现
- HTML5 / CSS3 (CSS Grid & Flexbox, Apple Design System)
- Vanilla JavaScript (原生 ES6+ 动态渲染 & 实时汇率换算逻辑)
- Clipboard API 实现快捷复制

## 业务价值
- 极大提升跨境业务人员的多币种核算与报价效率
- 提供极简直观的交互体验，无需依赖复杂的第三方工具
- 零依赖轻量化设计，秒级加载与运行

- ## 在线演示
[https://pigan-et.github.io/shopee-products/](https://pigan-et.github.io/multi-currency-converter/)
