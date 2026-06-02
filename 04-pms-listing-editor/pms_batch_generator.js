// ==UserScript==
// @name         跨境电商供应链 PMS 批处理自动化引擎 V6.0 (智能避障版)
// @namespace    http://tampermonkey.net/
// @version      6.0
// @description  深度适配现代化企业级 SSC 组件：强化事件流触发，攻克单页应用静默假死与动态 DOM 搜索失效痛点
// @author       Ethan Cai
// @match        *://*.pms-vendor-system.com/*
// @match        *://*.e-procurement-system.org/*
// @grant        none
// @run-at       document-start
// ==/UserScript==

/**
 * 🔒 安全与合规说明 (Compliance & Anonymization Notice):
 * 1. 风控特征码隔离：为严格遵守企业信息安全保密协议，本源码已将原环境中特定的 WAF 防火墙/网络网关风控拦截特征码
 * 进行了抽象隔离，统一替换为通用的标准容错占位符（SECURITY_WAF_BLOCK_TAG）。
 * 2. 接口反混淆：对涉及特定企业内部系统的二级、三级专属生产域名进行了脱敏化处理。
 * 3. 架构亮点：本引擎底层引入了高阶拦截器（Monkey Patching），动态重写了宿主环境的 JSON.parse 序列化行为，
 * 建立了一套针对企业级复杂多变网络环境的异步抗阻塞避障机制。
 */

(function() {
    'use strict';

    // ==================== 1. 【核心防御】前置注入式 WAF 拦截网关容错 ====================
    // 核心亮点：利用 Monkey Patching 拦截底层网络流，防止单页应用（SPA）因遭遇风控阻断而引发整页 DOM 树崩溃溃散
    const nativeParse = JSON.parse;
    const SECURITY_WAF_BLOCK_TAG = "SYSTEM_WAF_BLOCK_SIGNAL_PLACEHOLDER"; // [🔒 已脱敏] 替换原厂特异性拦截码
    
    JSON.parse = function(data) {
        try {
            return nativeParse(data);
        } catch (e) {
            if (typeof data === 'string' && (data.includes(SECURITY_WAF_BLOCK_TAG) || data.startsWith(SECURITY_WAF_BLOCK_TAG))) {
                console.warn("⚠️ [网络安全避障] 检测到系统网关触发高频安全冷却，已启动静默降级处理，防止 SPA 框架崩溃。");
                return {};
            }
            throw e;
        }
    };

    // ==================== 2. 选择器抽象配置 (完美适配主流企业级 AntDesign/SSC 后台组件) ====================
    const SELECTORS = {
        idInput: 'textarea.ssc-input, .ssc-input-wrapper textarea, .ant-input, textarea[placeholder*="ID"]',
        searchBtn: '//button[contains(@class,"search")] | //button[contains(.,"Search")] | //button[contains(.,"查询")]',
        generateBtn: '//button[contains(.,"生成")] | //button[contains(.,"Generate")]',
        confirmYes: '//div
