/**
 * useDocsReader Composable
 * SCP 文档阅读器核心逻辑，提供文章列表加载、详情获取、
 * 搜索筛选、收藏管理、阅读进度保存、HTML 清洗等功能。
 */

import { ref, watch, onMounted, onBeforeUnmount } from 'vue'
import { useThemeStore } from '../stores/themeStore'

// ── Types ────────────────────────────────────────────────────────────

export type SCPObjectClass = 'Safe' | 'Euclid' | 'Keter' | 'Thaumiel' | 'Neutralized' | 'Unknown'

export type DocType = 'scp' | 'goi' | 'tales' | 'hubs'

export interface SCPArticle {
  scpNumber: string
  title: string
  objectClass: SCPObjectClass
  series: number
  rating: number
  url: string
  contentPath?: string
}

export interface SCPArticleDetail extends SCPArticle {
  content: string
  rawHtml: string
  wordCount: number
  toc: TOCItem[]
}

export interface TOCItem {
  id: string
  text: string
  level: number
}

export type ReaderTheme = 'dark' | 'light'

interface LocalDocsManifest {
  generatedAt?: string
  source?: string
  scp?: SCPArticle[]
  goi?: SCPArticle[]
  tales?: SCPArticle[]
  hubs?: SCPArticle[]
}

// ── Constants ────────────────────────────────────────────────────────

const TIMEOUT_MS = 20000
const LOCAL_DOCS_BASE = '/docs-data'
const LOCAL_DOCS_MANIFEST = `${LOCAL_DOCS_BASE}/manifest.json`

const GUIDE_HTML = `<style>
.guide-wrap{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;line-height:1.75;max-width:760px;margin:0 auto;padding:0 20px 40px;color:#c9d1d9}
.guide-hero{position:relative;text-align:center;padding:40px 0 36px;margin-bottom:36px;background:linear-gradient(135deg,rgba(13,17,23,0.95) 0%,rgba(22,27,34,0.9) 100%);border-radius:16px;border:1px solid rgba(48,54,61,0.6);overflow:hidden}
.guide-hero::before{content:'';position:absolute;inset:0;background:radial-gradient(ellipse at 50% 0%,rgba(88,166,255,0.08) 0%,transparent 60%);pointer-events:none}
.guide-hero::after{content:'';position:absolute;top:-50%;left:50%;transform:translateX(-50%);width:300px;height:300px;background:radial-gradient(circle,rgba(88,166,255,0.06) 0%,transparent 70%);pointer-events:none}
.guide-hero-badge{display:inline-flex;align-items:center;gap:6px;padding:4px 12px;background:rgba(88,166,255,0.1);border:1px solid rgba(88,166,255,0.25);border-radius:20px;font-size:10.5px;color:#58a6ff;font-weight:500;margin-bottom:14px;letter-spacing:0.3px}
.guide-hero h1{font-size:28px;font-weight:700;color:#e6edf3;margin:0 0 10px;letter-spacing:-0.8px;position:relative;z-index:1}
.guide-hero p{font-size:13.5px;color:#8b949e;margin:0;position:relative;z-index:1}
.guide-toc{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:32px;padding:16px 20px;background:rgba(22,27,34,0.6);border:1px solid rgba(48,54,61,0.5);border-radius:12px}
.guide-toc-item{display:inline-flex;align-items:center;gap:5px;padding:5px 11px;background:rgba(48,54,61,0.4);border:1px solid rgba(48,54,61,0.6);border-radius:6px;font-size:11.5px;color:#8b949e;text-decoration:none;transition:all 0.15s}
.guide-toc-item:hover{background:rgba(56,139,253,0.1);border-color:rgba(88,166,255,0.35);color:#58a6ff}
.guide-toc-item span{color:#484f58;font-size:10px}
.guide-section{margin-bottom:36px}
.guide-section-title{display:flex;align-items:center;gap:10px;padding-bottom:10px;border-bottom:1px solid rgba(48,54,61,0.6);margin:0 0 18px}
.guide-section-title h2{font-size:16px;font-weight:600;color:#e6edf3;margin:0;letter-spacing:-0.2px}
.guide-section-title .dot{width:8px;height:8px;border-radius:50%;flex-shrink:0}
.guide-section p{font-size:13.5px;color:#adbac7;margin:0 0 12px;line-height:1.85}
.guide-section ul,.guide-section ol{margin:0 0 14px;padding-left:22px}
.guide-section li{font-size:13.5px;color:#adbac7;margin-bottom:5px;line-height:1.75}
.guide-section li strong{color:#c9d1d9}
.guide-section code{background:rgba(22,27,34,0.8);border:1px solid rgba(48,54,61,0.7);border-radius:4px;padding:1px 6px;font-size:12px;color:#f0883e;font-family:'SF Mono','Cascadia Code',monospace}
.guide-section pre{background:rgba(13,17,23,0.9);border:1px solid rgba(48,54,61,0.6);border-radius:10px;padding:18px;overflow-x:auto;margin:0 0 16px;position:relative}
.guide-section pre::before{content:'';position:absolute;top:0;left:0;right:0;height:1px;background:linear-gradient(to right,rgba(88,166,255,0.3),transparent)}
.guide-section pre code{background:none;border:none;padding:0;color:#adbac7;font-size:12.5px;line-height:1.75;display:block;white-space:pre}
.guide-intro-card{background:linear-gradient(135deg,rgba(22,27,34,0.8) 0%,rgba(13,17,23,0.9) 100%);border:1px solid rgba(48,54,61,0.6);border-radius:12px;padding:20px 22px;margin-bottom:8px;position:relative;overflow:hidden}
.guide-intro-card::before{content:'';position:absolute;top:0;left:0;right:0;height:2px;background:linear-gradient(to right,rgba(88,166,255,0.4),rgba(63,185,80,0.3),transparent);border-radius:12px 12px 0 0}
.guide-intro-card p{font-size:13.5px;color:#adbac7;margin:0;line-height:1.85}
.guide-tech-tags{display:flex;flex-wrap:wrap;gap:6px;margin-top:14px}
.guide-tech-tag{display:inline-flex;align-items:center;padding:3px 10px;background:rgba(48,54,61,0.35);border:1px solid rgba(48,54,61,0.5);border-radius:5px;font-size:11px;color:#8b949e}
.guide-apps-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(215px,1fr));gap:10px;margin:0 0 6px}
.guide-app-card{background:rgba(22,27,34,0.6);border:1px solid rgba(48,54,61,0.55);border-radius:10px;padding:15px 16px;transition:all 0.2s;cursor:default}
.guide-app-card:hover{background:rgba(30,35,44,0.7);border-color:rgba(88,166,255,0.3);transform:translateY(-2px);box-shadow:0 4px 16px rgba(0,0,0,0.3)}
.guide-app-card h4{font-size:13px;font-weight:600;color:#c9d1d9;margin:0 0 5px;display:flex;align-items:center;gap:7px}
.guide-app-card h4 .app-icon{width:18px;height:18px;display:flex;align-items:center;justify-content:center;flex-shrink:0}
.guide-app-card p{font-size:11.5px;color:#8b949e;margin:0 0 6px;line-height:1.65}
.guide-app-card .app-tag{display:inline-block;background:rgba(88,166,255,0.08);border:1px solid rgba(88,166,255,0.15);border-radius:4px;padding:1px 6px;font-size:10px;color:#58a6ff}
.guide-cmd-block{background:linear-gradient(135deg,rgba(13,17,23,0.95) 0%,rgba(18,22,29,0.9) 100%);border:1px solid rgba(48,54,61,0.6);border-radius:12px;padding:20px 22px;margin-bottom:6px}
.guide-cmd-group{display:flex;gap:20px;margin-bottom:10px}
.guide-cmd-group:last-child{margin-bottom:0}
.guide-cmd-label{min-width:68px;padding-top:2px;font-size:10.5px;font-weight:600;color:#484f58;text-transform:uppercase;letter-spacing:0.5px;flex-shrink:0}
.guide-cmd-cmds{font-size:12.5px;color:#adbac7;line-height:1.8}
.guide-cmd-cmds code{background:none;border:none;padding:0;color:#c9d1d9;font-size:12.5px;margin-right:2px}
.guide-cmd-cmds .cmd{color:#58a6ff;font-weight:500}
.guide-cmd-cmds .val{color:#3fb950}
.guide-killchain{display:flex;flex-direction:column;gap:8px;margin:0 0 16px;position:relative}
.guide-killchain::before{content:'';position:absolute;left:19px;top:32px;bottom:32px;width:1px;background:linear-gradient(to bottom,rgba(88,166,255,0.3),rgba(63,185,80,0.2),transparent);z-index:0}
.guide-step{display:flex;align-items:flex-start;gap:14px;padding:14px 16px;background:rgba(22,27,34,0.6);border:1px solid rgba(48,54,61,0.5);border-radius:10px;position:relative;transition:all 0.2s}
.guide-step:hover{background:rgba(30,35,44,0.65);border-color:rgba(88,166,255,0.25)}
.guide-step-num{width:26px;height:26px;background:rgba(88,166,255,0.1);color:#58a6ff;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;flex-shrink:0;position:relative;z-index:1;border:1px solid rgba(88,166,255,0.2)}
.guide-step.active .guide-step-num{background:rgba(63,185,80,0.12);color:#3fb950;border-color:rgba(63,185,80,0.25)}
.guide-step.active{background:rgba(22,27,34,0.85);border-color:rgba(63,185,80,0.2)}
.guide-step-content h4{font-size:13px;font-weight:600;color:#c9d1d9;margin:0 0 3px;letter-spacing:-0.1px}
.guide-step-content p{font-size:11.5px;color:#8b949e;margin:0 0 6px;line-height:1.65}
.guide-step-tools{display:flex;flex-wrap:wrap;gap:4px}
.guide-step-tools code{background:rgba(48,54,61,0.45);border:none;border-radius:3px;padding:1px 6px;font-size:10.5px;color:#f0883e}
.guide-faq{display:flex;flex-direction:column;gap:8px;margin:0}
.guide-faq-item{background:rgba(22,27,34,0.6);border:1px solid rgba(48,54,61,0.5);border-radius:10px;padding:15px 18px;transition:all 0.15s}
.guide-faq-item:hover{border-color:rgba(88,166,255,0.2)}
.guide-faq-item h4{font-size:13px;font-weight:600;color:#c9d1d9;margin:0 0 5px;display:flex;align-items:center;gap:6px}
.guide-faq-item h4::before{content:'Q';width:18px;height:18px;background:rgba(88,166,255,0.1);color:#58a6ff;border-radius:4px;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;flex-shrink:0}
.guide-faq-item p{font-size:12.5px;color:#8b949e;margin:0;line-height:1.75;padding-left:24px}
.guide-tip{background:rgba(63,185,80,0.06);border:1px solid rgba(63,185,80,0.18);border-radius:10px;padding:14px 18px;margin:14px 0}
.guide-tip h4{font-size:12.5px;font-weight:600;color:#3fb950;margin:0 0 5px;display:flex;align-items:center;gap:6px}
.guide-tip p{font-size:12.5px;color:#8b949e;margin:0;line-height:1.75}
.guide-note{background:rgba(210,153,34,0.07);border:1px solid rgba(210,153,34,0.2);border-radius:10px;padding:14px 18px;margin:14px 0}
.guide-note h4{font-size:12.5px;font-weight:600;color:#d29922;margin:0 0 5px;display:flex;align-items:center;gap:6px}
.guide-note p{font-size:12.5px;color:#adbac7;margin:0;line-height:1.75}
.guide-warn{background:rgba(248,81,73,0.05);border:1px solid rgba(248,81,73,0.18);border-radius:10px;padding:14px 18px;margin:14px 0}
.guide-warn h4{font-size:12.5px;font-weight:600;color:#f85149;margin:0 0 5px;display:flex;align-items:center;gap:6px}
.guide-warn p{font-size:12.5px;color:#8b949e;margin:0;line-height:1.75}
.guide-shortcuts{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:8px;margin:6px 0}
.guide-shortcut{display:flex;align-items:center;gap:10px;padding:10px 13px;background:rgba(22,27,34,0.6);border:1px solid rgba(48,54,61,0.5);border-radius:8px}
.guide-shortcut-keys{display:flex;gap:3px}
.guide-shortcut-key{display:inline-flex;align-items:center;justify-content:center;min-width:22px;height:22px;padding:0 5px;background:rgba(48,54,61,0.6);border:1px solid rgba(88,166,255,0.15);border-radius:4px;font-size:10px;font-weight:600;color:#c9d1d9;font-family:inherit}
.guide-shortcut-desc{font-size:11.5px;color:#8b949e;line-height:1.4}
.guide-footer{text-align:center;padding:24px 0 6px;margin-top:32px;border-top:1px solid rgba(48,54,61,0.5)}
.guide-footer-inner{display:inline-flex;flex-direction:column;align-items:center;gap:6px}
.guide-footer p{font-size:11px;color:#484f58;margin:0}
.guide-footer .ver{font-size:10.5px;color:#363b42}
.guide-divider{height:1px;background:linear-gradient(to right,transparent,rgba(48,54,61,0.6),transparent);margin:28px 0}
</style>
<div class="guide-wrap">
<div class="guide-hero">
<div class="guide-hero-badge">&#9679; 官方使用指南</div>
<h1>SCP-OS 使用指南</h1>
<p>基于 Cloudflare Workers 的全栈 SCP 基金会信息平台</p>
</div>
<nav class="guide-toc">
<a class="guide-toc-item" href="#overview"><span>#</span> 项目概述</a>
<a class="guide-toc-item" href="#apps"><span>#</span> 应用模块</a>
<a class="guide-toc-item" href="#terminal"><span>#</span> 终端命令</a>
<a class="guide-toc-item" href="#pentest"><span>#</span> 渗透会话</a>
<a class="guide-toc-item" href="#faq"><span>#</span> 常见问题</a>
<a class="guide-toc-item" href="#shortcuts"><span>#</span> 快捷操作</a>
</nav>
<div class="guide-section" id="overview">
<div class="guide-section-title"><span class="dot" style="background:rgba(88,166,255,0.7)"></span><h2>项目概述</h2></div>
<div class="guide-intro-card">
<p>SCP-OS 是一个功能丰富的 SCP 基金会主题信息平台，运行于 Cloudflare 全球边缘网络。系统由 Vue 3 + Pinia 前端和 Cloudflare Workers 后端组成，支持桌面端和移动端自适应访问，提供 SCP 条目查询、文档阅读、实时聊天、系统监控等核心功能。</p>
<div class="guide-tech-tags">
<span class="guide-tech-tag">Vue 3</span>
<span class="guide-tech-tag">Pinia</span>
<span class="guide-tech-tag">TypeScript</span>
<span class="guide-tech-tag">Cloudflare Workers</span>
<span class="guide-tech-tag">D1 Database</span>
<span class="guide-tech-tag">KV Storage</span>
<span class="guide-tech-tag">Durable Objects</span>
</div>
</div>
</div>
<div class="guide-divider"></div>
<div class="guide-section" id="apps">
<div class="guide-section-title"><span class="dot" style="background:rgba(63,185,80,0.7)"></span><h2>应用模块一览</h2></div>
<p>SCP-OS 提供 9 个核心应用模块，涵盖信息查询、文档阅读、工具集成等多个维度：</p>
<div class="guide-apps-grid">
<div class="guide-app-card">
<h4><span class="app-icon">&#9654;</span> 终端 <code>Terminal</code></h4>
<p>核心交互界面，38+ 命令。支持 SCP 查询、文件系统操作、网络诊断和渗透测试模拟。</p>
<span class="app-tag">交互核心</span>
</div>
<div class="guide-app-card">
<h4><span class="app-icon">&#128196;</span> 文档阅读器 <code>Docs</code></h4>
<p>SCP 条目浏览器，支持系列/等级筛选、全文搜索、目录导航、收藏和离线缓存。</p>
<span class="app-tag">信息阅读</span>
</div>
<div class="guide-app-card">
<h4><span class="app-icon">&#128172;</span> 聊天 <code>Chat</code></h4>
<p>基于 Durable Objects 的实时多房间聊天系统，支持昵称设置和消息广播。</p>
<span class="app-tag">社交互动</span>
</div>
<div class="guide-app-card">
<h4><span class="app-icon">&#128221;</span> 编辑器 <code>Editor</code></h4>
<p>内置文本编辑器，支持多标签页管理和常用语法高亮。</p>
<span class="app-tag">效率工具</span>
</div>
<div class="guide-app-card">
<h4><span class="app-icon">&#128193;</span> 文件管理器 <code>Files</code></h4>
<p>虚拟文件系统浏览器，支持目录导航和基本文件操作。</p>
<span class="app-tag">效率工具</span>
</div>
<div class="guide-app-card">
<h4><span class="app-icon">&#128202;</span> 仪表盘 <code>Dash</code></h4>
<p>系统性能监控面板，展示关键运行指标和状态。</p>
<span class="app-tag">系统监控</span>
</div>
<div class="guide-app-card">
<h4><span class="app-icon">&#9881;</span> 设置 <code>Settings</code></h4>
<p>系统偏好配置，支持主题、语言和显示选项的个性化调整。</p>
<span class="app-tag">系统配置</span>
</div>
<div class="guide-app-card">
<h4><span class="app-icon">&#9993;</span> 反馈 <code>Feedback</code></h4>
<p>用户反馈通道，提交建议和问题报告给开发团队。</p>
<span class="app-tag">用户服务</span>
</div>
</div>
</div>
<div class="guide-divider"></div>
<div class="guide-section" id="terminal">
<div class="guide-section-title"><span class="dot" style="background:rgba(63,185,80,0.6)"></span><h2>终端命令参考</h2></div>
<p>终端是 SCP-OS 的核心交互工具，输入命令即可执行操作。按 <code>Enter</code> 确认，<code>Tab</code> 自动补全，<code>↑</code><code>↓</code> 浏览历史命令。</p>
<div class="guide-cmd-block">
<div class="guide-cmd-group">
<span class="guide-cmd-label">系统控制</span>
<span class="guide-cmd-cmds"><code class="cmd">start</code> <code class="cmd">restart</code> <code class="cmd">shutdown</code> <code class="cmd">logout</code> <code class="cmd">clear</code></span>
</div>
<div class="guide-cmd-group">
<span class="guide-cmd-label">SCP 查询</span>
<span class="guide-cmd-cmds"><code class="cmd">info</code> <code class="val">&lt;编号&gt;</code> <code class="cmd">search</code> <code class="val">&lt;关键词&gt;</code> <code class="cmd">scp-list</code> <code class="cmd">status</code> <code class="cmd">containment</code></span>
</div>
<div class="guide-cmd-group">
<span class="guide-cmd-label">文件操作</span>
<span class="guide-cmd-cmds"><code class="cmd">ls</code> <code class="cmd">cd</code> <code class="cmd">pwd</code> <code class="cmd">mkdir</code> <code class="cmd">rm</code> <code class="cmd">cat</code> <code class="cmd">echo</code> <code class="cmd">touch</code> <code class="cmd">cp</code> <code class="cmd">mv</code></span>
</div>
<div class="guide-cmd-group">
<span class="guide-cmd-label">系统信息</span>
<span class="guide-cmd-cmds"><code class="cmd">uname</code> <code class="val">[-a]</code> <code class="cmd">df</code> <code class="cmd">free</code> <code class="cmd">uptime</code> <code class="cmd">version</code> <code class="cmd">about</code></span>
</div>
<div class="guide-cmd-group">
<span class="guide-cmd-label">网络与安全</span>
<span class="guide-cmd-cmds"><code class="cmd">network</code> <code class="cmd">check</code> <code class="cmd">performance</code></span>
</div>
<div class="guide-cmd-group">
<span class="guide-cmd-label">其他</span>
<span class="guide-cmd-cmds"><code class="cmd">find</code> <code class="cmd">grep</code> <code class="cmd">chmod</code> <code class="cmd">chown</code></span>
</div>
<div class="guide-cmd-group">
<span class="guide-cmd-label" style="color:#58a6ff">特别功能</span>
<span class="guide-cmd-cmds"><code class="cmd" style="color:#58a6ff">penetration</code> <span style="color:#484f58;font-size:11.5px">启动虚拟渗透会话</span></span>
</div>
</div>
</div>
<div class="guide-divider"></div>
<div class="guide-section" id="pentest">
<div class="guide-section-title"><span class="dot" style="background:rgba(248,81,73,0.6)"></span><h2>虚拟渗透会话</h2></div>
<p>在终端输入 <code>penetration</code> 启动交互式渗透测试模拟，以特遣队特工身份体验完整杀伤链流程：</p>
<div class="guide-killchain">
<div class="guide-step active">
<div class="guide-step-num">1</div>
<div class="guide-step-content">
<h4>信息收集 Reconnaissance</h4>
<p>使用探测工具收集目标网络拓扑和服务信息</p>
<div class="guide-step-tools"><code>nmap</code><code>whois</code><code>dig</code><code>curl</code><code>nikto</code></div>
</div>
</div>
<div class="guide-step">
<div class="guide-step-num">2</div>
<div class="guide-step-content">
<h4>漏洞识别 Vulnerability Scan</h4>
<p>扫描已知漏洞，评估目标系统的可利用性</p>
<div class="guide-step-tools"><code>nmap --script vuln</code><code>sqlmap</code><code>searchsploit</code></div>
</div>
</div>
<div class="guide-step">
<div class="guide-step-num">3</div>
<div class="guide-step-content">
<h4>漏洞利用 Exploitation</h4>
<p>通过 Metasploit 执行漏洞利用获取初始访问权限</p>
<div class="guide-step-tools"><code>msfconsole</code><code>search</code><code>use</code><code>set</code><code>exploit</code></div>
</div>
</div>
<div class="guide-step">
<div class="guide-step-num">4</div>
<div class="guide-step-content">
<h4>权限提升 Privilege Escalation</h4>
<p>利用系统配置缺陷将权限提升至管理员/root 级别</p>
<div class="guide-step-tools"><code>linpeas</code><code>dirty-pipe</code><code>sudo -l</code><code>find / -perm -4000</code></div>
</div>
</div>
<div class="guide-step">
<div class="guide-step-num">5</div>
<div class="guide-step-content">
<h4>持久化 Persistence</h4>
<p>部署后门程序和计划任务确保长期访问通道</p>
<div class="guide-step-tools"><code>crontab</code><code>ssh-key</code><code>backdoor</code><code>service install</code></div>
</div>
</div>
<div class="guide-step">
<div class="guide-step-num">6</div>
<div class="guide-step-content">
<h4>信息窃取 Exfiltration</h4>
<p>提取系统凭证并外发目标敏感数据</p>
<div class="guide-step-tools"><code>mimikatz</code><code>cat /etc/shadow</code><code>tar</code><code>scp</code><code>exfil</code></div>
</div>
</div>
</div>
<div class="guide-tip">
<h4>&#9432; 会话内命令</h4>
<p><code>help</code> 查看可用命令 &middot; <code>phase</code> 查看当前进度 &middot; <code>exit</code> / <code>abort</code> 退出会话</p>
</div>
<div class="guide-note">
<h4>&#9888; 重要提示</h4>
<p>虚拟渗透会话所有操作均为预设剧本模拟，不涉及真实网络攻击，仅供教育与娱乐目的。请勿将其中的技术描述用于实际安全测试。</p>
</div>
</div>
<div class="guide-divider"></div>
<div class="guide-section" id="faq">
<div class="guide-section-title"><span class="dot" style="background:rgba(210,153,34,0.7)"></span><h2>常见问题</h2></div>
<div class="guide-faq">
<div class="guide-faq-item">
<h4>如何启动系统？</h4>
<p>打开终端，输入 <code>start</code> 命令即可启动。首次启动会显示开机动画和初始化日志。桌面端还支持在桌面空白处双击快速启动。</p>
</div>
<div class="guide-faq-item">
<h4>如何搜索 SCP 条目？</h4>
<p>在终端输入 <code>search &lt;关键词&gt;</code>，或打开文档阅读器使用搜索框。支持中英文关键词、SCP 编号（如 173、CN-300）以及分部前缀（如 CN-、ES-、JP-）。</p>
</div>
<div class="guide-faq-item">
<h4>离线可以使用吗？</h4>
<p>部分功能支持离线：文档阅读器有 24 小时本地缓存（已缓存文章可离线阅读）；终端的文件系统命令（ls/cd/cat/mkdir 等）完全本地运行。需要网络的功能：搜索、聊天、系统监控。</p>
</div>
<div class="guide-faq-item">
<h4>渗透测试是真实的攻击吗？</h4>
<p>不是。虚拟渗透会话是完全的模拟系统，输出内容基于预设剧本生成，不会对任何真实服务器产生请求或影响。该功能灵感来自 CTF 竞赛，旨在提供沉浸式学习体验。</p>
</div>
<div class="guide-faq-item">
<h4>如何获取更多帮助？</h4>
<p>在任何界面按下 <code>help</code> 或 <code>?</code> 可查看上下文相关帮助。你也可以通过「反馈」应用提交问题或建议。</p>
</div>
</div>
</div>
<div class="guide-divider"></div>
<div class="guide-section" id="shortcuts">
<div class="guide-section-title"><span class="dot" style="background:rgba(175,82,222,0.7)"></span><h2>快捷操作</h2></div>
<div class="guide-shortcuts">
<div class="guide-shortcut">
<div class="guide-shortcut-keys"><span class="guide-shortcut-key">Tab</span></div>
<span class="guide-shortcut-desc">自动补全命令</span>
</div>
<div class="guide-shortcut">
<div class="guide-shortcut-keys"><span class="guide-shortcut-key">↑</span><span class="guide-shortcut-key">↓</span></div>
<span class="guide-shortcut-desc">浏览历史命令</span>
</div>
<div class="guide-shortcut">
<div class="guide-shortcut-keys"><span class="guide-shortcut-key">Ctrl</span><span class="guide-shortcut-key">C</span></div>
<span class="guide-shortcut-desc">取消当前输入</span>
</div>
<div class="guide-shortcut">
<div class="guide-shortcut-keys"><span class="guide-shortcut-key">Ctrl</span><span class="guide-shortcut-key">L</span></div>
<span class="guide-shortcut-desc">清屏</span>
</div>
<div class="guide-shortcut">
<div class="guide-shortcut-keys"><span class="guide-shortcut-key">双击</span></div>
<span class="guide-shortcut-desc">桌面快速启动终端</span>
</div>
<div class="guide-shortcut">
<div class="guide-shortcut-keys"><span class="guide-shortcut-key">Esc</span></div>
<span class="guide-shortcut-desc">关闭弹窗/返回</span>
</div>
</div>
</div>
<div class="guide-divider"></div>
<div class="guide-warn">
<h4>&#9888; 法律声明</h4>
<p>SCP-OS 为 SCP 基金会主题的虚构信息平台，所有内容（包括 SCP 条目数据）均来自公开的 SCP Wiki，仅供娱乐和教育目的。虚拟渗透会话为模拟系统，不涉及真实网络攻击。系统禁止发布任何违规内容。</p>
</div>
<div class="guide-footer">
<div class="guide-footer-inner">
<p>SCP-OS &middot; Built with Cloudflare Workers &middot; v3.0.2</p>
<p class="ver">Powered by Vue 3 &middot; TypeScript &middot; Cloudflare Edge Network</p>
</div>
</div>
</div>`

// ── Object Class Colors ─────────────────────────────────────────────

export const OBJECT_CLASS_COLORS: Record<SCPObjectClass, string> = {
  Safe: '#3fb950',
  Euclid: '#d29922',
  Keter: '#f85149',
  Thaumiel: '#a371f7',
  Neutralized: '#8b949e',
  Unknown: '#484f58',
}

export const SERIES_OPTIONS = [
  { label: '系列 I', value: 1, range: 'SCP-002 ~ SCP-999' },
  { label: '系列 II', value: 2, range: 'SCP-1000 ~ SCP-1999' },
  { label: '系列 III', value: 3, range: 'SCP-2000 ~ SCP-2999' },
  { label: '系列 IV', value: 4, range: 'SCP-3000 ~ SCP-3999' },
  { label: '系列 V', value: 5, range: 'SCP-4000 ~ SCP-4999' },
  { label: '系列 VI', value: 6, range: 'SCP-5000 ~ SCP-5999' },
  { label: '系列 VII', value: 7, range: 'SCP-6000 ~ SCP-6999' },
  { label: 'CN', value: 0, range: 'SCP-CN-001 ~ SCP-CN-999' },
]

export const CLASS_OPTIONS: { label: string; value: SCPObjectClass }[] = [
  { label: 'Safe', value: 'Safe' },
  { label: 'Euclid', value: 'Euclid' },
  { label: 'Keter', value: 'Keter' },
  { label: 'Thaumiel', value: 'Thaumiel' },
  { label: 'Neutralized', value: 'Neutralized' },
]

export const DOC_TYPE_OPTIONS: { label: string; value: DocType }[] = [
  { label: 'SCP', value: 'scp' },
  { label: 'GOI', value: 'goi' },
  { label: 'Tales', value: 'tales' },
  { label: 'Hubs', value: 'hubs' },
]

export const GUIDE_ARTICLE: SCPArticle = {
  scpNumber: 'GUIDE',
  title: 'SCP-OS 使用指南',
  objectClass: 'Safe',
  series: 0,
  rating: 9999,
  url: '',
}

export const GUIDE_SCP_NUMBER = 'GUIDE'

// ── HTTP Helper ──────────────────────────────────────────────────────

const PAGE_SIZE = 12

async function fetchWithTimeout(url: string, timeoutMs: number = TIMEOUT_MS): Promise<Response> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch(url, { signal: controller.signal })
    return res
  } finally {
    clearTimeout(timeoutId)
  }
}

// ── Composable ───────────────────────────────────────────────────────

export function useDocsReader() {
  const themeStore = useThemeStore()
  const articles = ref<SCPArticle[]>([])
  const filteredArticles = ref<SCPArticle[]>([])
  const currentArticle = ref<SCPArticleDetail | null>(null)
  const loading = ref(false)
  const loadingMore = ref(false)
  const loadingDetail = ref(false)
  const hasMore = ref(true)
  const error = ref<string | null>(null)
  const searchQuery = ref('')
  const selectedSeries = ref<number | null>(null)
  const selectedClass = ref<SCPObjectClass | null>(null)
  const docType = ref<DocType>('scp')
  const readerTheme = ref<ReaderTheme>(themeStore.currentTheme.isDark ? 'dark' : 'light')
  const fontSize = ref(15)
  const isFavorited = ref(false)
  const cacheStatus = ref('')
  const isOnline = ref(navigator.onLine)
  const localDocsLoaded = ref(false)
  const localDocs = ref<Required<Pick<LocalDocsManifest, 'scp' | 'goi' | 'tales' | 'hubs'>>>({
    scp: [],
    goi: [],
    tales: [],
    hubs: [],
  })

  let currentPage = 1
  let searchDebounce: ReturnType<typeof setTimeout> | null = null
  let progressInterval: ReturnType<typeof setInterval> | null = null
  let localDocsPromise: Promise<void> | null = null

  const GUIDE_DETAIL: SCPArticleDetail = {
    ...GUIDE_ARTICLE,
    content: '',
    rawHtml: GUIDE_HTML,
    wordCount: GUIDE_HTML.length,
    toc: [],
  }

  function sanitizeHtml(raw: string): string {
    let html = raw
    html = html.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
    html = html.replace(/\son\w+="[^"]*"/gi, '')
    html = html.replace(/\son\w+='[^']*'/gi, '')
    html = html.replace(/src="\/\//g, 'src="https://')
    html = html.replace(/href="\/\//g, 'href="https://')
    html = html.replace(/href="\/([^"]*)"/g, `href="${'https://scp-wiki.wikidot.com'}/$1"`)
    return html
  }

  function extractToc(html: string): TOCItem[] {
    const toc: TOCItem[] = []
    const div = document.createElement('div')
    div.innerHTML = html
    div.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach((el) => {
      const level = parseInt(el.tagName.charAt(1))
      const id = el.id || el.textContent?.trim().replace(/\s+/g, '-').toLowerCase() || ''
      if (!el.id) el.id = id
      toc.push({ id, text: el.textContent?.trim() || '', level })
    })
    return toc
  }

  function normalizeArticle(item: Partial<SCPArticle>): SCPArticle {
    return {
      scpNumber: String(item.scpNumber || ''),
      title: String(item.title || ''),
      objectClass: item.objectClass || 'Unknown',
      series: Number(item.series || 0),
      rating: Number(item.rating || 0),
      url: String(item.url || ''),
      contentPath: item.contentPath,
    }
  }

  async function loadLocalDocs() {
    if (localDocsLoaded.value) return
    if (!localDocsPromise) {
      localDocsPromise = (async () => {
        const res = await fetchWithTimeout(LOCAL_DOCS_MANIFEST)
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const manifest = (await res.json()) as LocalDocsManifest
        localDocs.value = {
          scp: (manifest.scp || []).map(normalizeArticle),
          goi: (manifest.goi || []).map(normalizeArticle),
          tales: (manifest.tales || []).map(normalizeArticle),
          hubs: (manifest.hubs || []).map(normalizeArticle),
        }
        localDocsLoaded.value = true
      })()
    }
    await localDocsPromise
  }

  function currentLocalArticles(): SCPArticle[] {
    return localDocs.value[docType.value] || []
  }

  function articleMatchesQuery(article: SCPArticle, query: string): boolean {
    if (!query) return true
    const haystack = [article.scpNumber, article.title, article.url].join(' ').toLowerCase()
    return haystack.includes(query)
  }

  function filteredLocalArticles(): SCPArticle[] {
    const query = searchQuery.value.trim().toLowerCase()
    return currentLocalArticles().filter((article) => {
      if (!articleMatchesQuery(article, query)) return false
      if (docType.value !== 'scp') return true
      if (selectedClass.value && article.objectClass !== selectedClass.value) return false
      if (selectedSeries.value && article.series !== selectedSeries.value) return false
      return true
    })
  }

  function localContentUrl(article: SCPArticle): string {
    if (!article.contentPath) throw new Error('Local content path missing')
    return `${LOCAL_DOCS_BASE}/${article.contentPath}`
  }

  async function fetchArticles(page = 1) {
    if (page === 1) {
      loading.value = true
      articles.value = []
    } else {
      loadingMore.value = true
    }
    error.value = null

    try {
      await loadLocalDocs()
      const offset = (page - 1) * PAGE_SIZE
      const allMatching = filteredLocalArticles()
      const list = allMatching.slice(offset, offset + PAGE_SIZE)

      if (page === 1) {
        filteredArticles.value = list
        articles.value = list
      } else {
        filteredArticles.value.push(...list)
        articles.value.push(...list)
      }
      currentPage = page
      hasMore.value = offset + PAGE_SIZE < allMatching.length
    } catch (e) {
      error.value = e instanceof Error ? e.message : '加载失败'
    } finally {
      loading.value = false
      loadingMore.value = false
    }
  }

  function search() {
    if (searchDebounce) clearTimeout(searchDebounce)
    searchDebounce = setTimeout(() => {
      hasMore.value = true
      fetchArticles(1)
    }, 300)
  }

  function setSeries(value: number | null) {
    selectedSeries.value = value
    hasMore.value = true
    fetchArticles(1)
  }

  function setObjectClass(value: SCPObjectClass | null) {
    selectedClass.value = value
    hasMore.value = true
    fetchArticles(1)
  }

  function setDocType(value: DocType) {
    docType.value = value
    selectedSeries.value = null
    selectedClass.value = null
    searchQuery.value = ''
    hasMore.value = true
    currentArticle.value = null
    fetchArticles(1)
  }

  function loadMore() {
    if (!loadingMore.value && hasMore.value) {
      fetchArticles(currentPage + 1)
    }
  }

  async function selectArticle(scpNumber: string, url?: string) {
    loadingDetail.value = true
    error.value = null
    cacheStatus.value = ''

    try {
      if (docType.value !== 'scp') {
        if (url) {
          window.open(url, '_blank')
        } else {
          error.value = '链接不可用'
        }
        loadingDetail.value = false
        return
      }

      await loadLocalDocs()
      const article = localDocs.value.scp.find(
        (item) =>
          item.scpNumber === scpNumber ||
          Number(item.scpNumber) === Number(scpNumber.replace(/^SCP-/i, ''))
      )
      if (!article) throw new Error(`Local document not found: ${scpNumber}`)

      cacheStatus.value = 'loading'
      const contentRes = await fetchWithTimeout(localContentUrl(article))
      if (!contentRes.ok) throw new Error(`HTTP ${contentRes.status}`)
      const detail = (await contentRes.json()) as SCPArticleDetail
      const rawHtml = detail.content || detail.rawHtml || ''
      const sanitized = sanitizeHtml(rawHtml)
      const toc = extractToc(sanitized)

      currentArticle.value = {
        scpNumber: detail.scpNumber || article.scpNumber,
        title: detail.title || article.title,
        objectClass: detail.objectClass || article.objectClass,
        series: detail.series || article.series,
        rating: detail.rating || article.rating,
        url: detail.url || article.url,
        content: rawHtml,
        rawHtml: sanitized,
        toc,
        wordCount: detail.wordCount || rawHtml.length,
      }
      cacheStatus.value = 'cached'
    } catch (e) {
      cacheStatus.value = ''
      error.value = e instanceof Error ? e.message : '加载详情失败'
    } finally {
      loadingDetail.value = false
    }
  }

  function selectGuide() {
    currentArticle.value = { ...GUIDE_DETAIL }
  }

  function clearArticle() {
    currentArticle.value = null
  }

  function increaseFontSize() {
    if (fontSize.value < 24) fontSize.value += 1
  }

  function decreaseFontSize() {
    if (fontSize.value > 12) fontSize.value -= 1
  }

  function toggleFavorite() {
    isFavorited.value = !isFavorited.value
  }

  function scrollToTOCItem(item: TOCItem) {
    const el = document.getElementById(item.id)
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  function saveProgress(_scrollTop?: number) {
    if (!currentArticle.value) return
    try {
      localStorage.setItem(
        `scp-progress-${currentArticle.value.scpNumber}`,
        String(_scrollTop ?? 0)
      )
    } catch {}
  }

  function startProgressAutoSave(_getScrollPosition: () => number) {
    stopProgressAutoSave()
    progressInterval = setInterval(() => {
      saveProgress(_getScrollPosition())
    }, 5000)
  }

  function stopProgressAutoSave() {
    if (progressInterval) {
      clearInterval(progressInterval)
      progressInterval = null
    }
  }

  function handleOnline() {
    isOnline.value = true
  }
  function handleOffline() {
    isOnline.value = false
  }

  watch(
    () => themeStore.currentTheme.isDark,
    (isDark) => {
      readerTheme.value = isDark ? 'dark' : 'light'
    }
  )

  onMounted(() => {
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    fetchArticles(1)
  })

  onBeforeUnmount(() => {
    window.removeEventListener('online', handleOnline)
    window.removeEventListener('offline', handleOffline)
    stopProgressAutoSave()
    if (searchDebounce) clearTimeout(searchDebounce)
  })

  return {
    articles,
    filteredArticles,
    currentArticle,
    loading,
    loadingMore,
    loadingDetail,
    hasMore,
    error,
    searchQuery,
    selectedSeries,
    selectedClass,
    readerTheme,
    fontSize,
    isFavorited,
    cacheStatus,
    isOnline,
    docType,
    SERIES_OPTIONS,
    CLASS_OPTIONS,
    DOC_TYPE_OPTIONS,
    OBJECT_CLASS_COLORS,
    GUIDE_ARTICLE,
    GUIDE_SCP_NUMBER,
    fetchArticles,
    search,
    setSeries,
    setObjectClass,
    setDocType,
    loadMore,
    selectArticle,
    selectGuide,
    clearArticle,
    increaseFontSize,
    decreaseFontSize,
    toggleFavorite,
    scrollToTOCItem,
    saveProgress,
    startProgressAutoSave,
    stopProgressAutoSave,
  }
}
