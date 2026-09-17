import React, { useMemo, useState } from 'react';

const defaultShots = [
  { id: 1, title: '镜头 01', scene: '雨夜，城市天台', visual: '女主站在霓虹灯下，雨水打湿外套，远处高楼虚化。', camera: '中景 → 缓慢推进', dialogue: '我终于等到这一天了。' },
  { id: 2, title: '镜头 02', scene: '天台入口', visual: '黑衣男人推门而出，逆光形成轮廓，手里握着旧照片。', camera: '低机位特写', dialogue: '你不该回来。' },
  { id: 3, title: '镜头 03', scene: '天台边缘', visual: '两人隔着数米对峙，风吹动衣角，闪电照亮城市。', camera: '大全景 → 环绕', dialogue: '有些账，总要算清楚。' }
];

const nav = ['工作台', 'AI 编剧', '角色库', '分镜导演', '画面生成', '视频生成', '配音字幕', '项目导出'];

const providerDefaults = {
  '本地 AI（Ollama）': { baseUrl: 'http://127.0.0.1:11434/v1', model: 'qwen2.5:7b', key: '' },
  DeepSeek: { baseUrl: 'https://api.deepseek.com/v1', model: 'deepseek-chat', key: '' },
  豆包: { baseUrl: 'https://ark.cn-beijing.volces.com/api/v3', model: '', key: '' }
};

function loadProviderConfig(provider) {
  try { return JSON.parse(localStorage.getItem(`aimaiju-${provider}`)) || providerDefaults[provider]; } catch { return providerDefaults[provider]; }
}

function buildPrompt({ projectName, idea, style }) {
  return `你是一名专业AI漫剧编剧兼分镜导演。请为项目《${projectName}》制作可直接用于AI漫剧生产的方案。\n故事创意：${idea}\n视觉风格：${style}\n请输出严格JSON，不要Markdown代码块，结构为：{"story":"完整故事梗概","characters":[{"name":"","role":"","age":"","appearance":"","personality":"","prompt":"固定角色视觉提示词"}],"shots":[{"title":"镜头 01","scene":"","visual":"","camera":"","dialogue":""}]}。至少生成5个分镜，角色提示词要保持人物外观一致。`;
}

async function callAI(provider, config, prompt) {
  if (provider === '本地 AI（Ollama）' && !config.baseUrl) throw new Error('请先启动 Ollama，并填写本地地址。');
  if (provider !== '本地 AI（Ollama）' && !config.key) throw new Error(`请在「模型设置」中填写 ${provider} API Key。`);
  if (provider === '豆包' && !config.model) throw new Error('豆包需要填写 Ark Endpoint ID / 模型 ID。');
  const base = config.baseUrl.replace(/\/$/, '');
  const res = await fetch(`${base}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(config.key ? { Authorization: `Bearer ${config.key}` } : {}) },
    body: JSON.stringify({ model: config.model, messages: [{ role: 'system', content: '你是专业AI漫剧制作助手。' }, { role: 'user', content: prompt }], temperature: 0.8 })
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error?.message || data?.message || `AI 请求失败（${res.status}）`);
  return data?.choices?.[0]?.message?.content || '';
}

function parseAIResult(text) {
  const clean = text.replace(/^```(?:json)?/i, '').replace(/```$/i, '').trim();
  try { return JSON.parse(clean); } catch {
    const start = clean.indexOf('{'); const end = clean.lastIndexOf('}');
    if (start >= 0 && end > start) return JSON.parse(clean.slice(start, end + 1));
    throw new Error('AI 返回内容不是有效 JSON，请重试。');
  }
}

export default function App() {
  const [active, setActive] = useState('工作台');
  const [projectName, setProjectName] = useState('我的第一部 AI 漫剧');
  const [idea, setIdea] = useState('一个被家族抛弃的女孩，三年后带着秘密身份回城复仇。');
  const [style, setStyle] = useState('国漫电影感');
  const [provider, setProvider] = useState('本地 AI（Ollama）');
  const [shots, setShots] = useState(defaultShots);
  const [characters, setCharacters] = useState([]);
  const [story, setStory] = useState('');
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('就绪');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [config, setConfig] = useState(loadProviderConfig('本地 AI（Ollama）'));

  const progress = useMemo(() => Math.min(100, 25 + shots.length * 8), [shots.length]);

  function switchProvider(value) {
    setProvider(value); setConfig(loadProviderConfig(value));
  }

  function saveConfig() {
    localStorage.setItem(`aimaiju-${provider}`, JSON.stringify(config));
    setSettingsOpen(false); setStatus(`${provider} 配置已保存`);
  }

  async function generate() {
    setBusy(true); setStatus(`${provider} 正在生成剧本、角色与分镜…`);
    try {
      const result = await callAI(provider, config, buildPrompt({ projectName, idea, style }));
      const parsed = parseAIResult(result);
      if (parsed.shots?.length) setShots(parsed.shots.map((s, i) => ({ ...s, id: Date.now() + i, title: s.title || `镜头 ${String(i + 1).padStart(2, '0')}` })));
      if (parsed.characters) setCharacters(parsed.characters);
      if (parsed.story) setStory(parsed.story);
      setStatus('AI 生成完成，可继续编辑');
    } catch (e) {
      setStatus(e.message || '生成失败');
    } finally { setBusy(false); }
  }

  function exportProject() {
    const data = { projectName, idea, style, provider, story, characters, shots, exportedAt: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob); const a = document.createElement('a');
    a.href = url; a.download = `${projectName || 'ai-manjv-project'}.json`; a.click(); URL.revokeObjectURL(url); setStatus('项目已导出');
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand"><div className="brand-mark">AI</div><div><strong>漫剧工坊</strong><span>Creator Studio</span></div></div>
        <div className="nav-list">{nav.map(item => <button key={item} className={active === item ? 'nav-item active' : 'nav-item'} onClick={() => setActive(item)}><span className="dot" />{item}</button>)}</div>
        <div className="sidebar-card"><div className="muted">当前 AI</div><div className="provider-row"><span className="pulse" />{provider}</div><small>{provider === '本地 AI（Ollama）' ? '本地运行，不需要云端 API Token' : '云端模型，需要对应平台 API Key'}</small><button className="mini" onClick={() => setSettingsOpen(true)}>⚙ 模型设置</button></div>
      </aside>

      <main className="main">
        <header className="topbar"><div><div className="eyebrow">AI COMIC DRAMA STUDIO</div><h1>{active}</h1></div><div className="top-actions"><span className="status">● {status}</span><button className="ghost" onClick={exportProject}>导出项目</button><button className="primary" onClick={generate} disabled={busy}>{busy ? '生成中…' : '一键生成'}</button></div></header>

        <section className="hero-grid">
          <div className="panel form-panel"><div className="panel-title"><div><span className="kicker">PROJECT</span><h2>新建漫剧项目</h2></div><span className="tag">商用工作流</span></div>
            <label>项目名称<input value={projectName} onChange={e => setProjectName(e.target.value)} /></label>
            <label>故事创意<textarea rows="5" value={idea} onChange={e => setIdea(e.target.value)} /></label>
            <div className="two-col"><label>视觉风格<select value={style} onChange={e => setStyle(e.target.value)}><option>国漫电影感</option><option>日漫热血</option><option>写实短剧</option><option>赛博朋克</option><option>古风仙侠</option></select></label><label>文本模型<select value={provider} onChange={e => switchProvider(e.target.value)}><option>本地 AI（Ollama）</option><option>DeepSeek</option><option>豆包</option></select></label></div>
            <button className="generate-wide" onClick={generate} disabled={busy}>✦ {busy ? '正在调用 AI…' : '生成完整漫剧方案'}</button>
            <div className="local-tip">{provider === '本地 AI（Ollama）' ? '✓ Token-free 模式：模型在你的电脑本地运行，软件不向云端发送剧本。' : `✓ ${provider} 已接入 OpenAI-compatible 接口，可在模型设置里配置。`}</div>
          </div>

          <div className="panel overview-panel"><div className="panel-title"><div><span className="kicker">PIPELINE</span><h2>生产进度</h2></div><b>{progress}%</b></div><div className="progress"><span style={{ width: `${progress}%` }} /></div><div className="metric-grid"><div className="metric"><strong>01</strong><span>AI 剧本</span><em>{story ? '已生成' : '待生成'}</em></div><div className="metric"><strong>{String(characters.length || 3).padStart(2,'0')}</strong><span>角色设定</span><em>{characters.length ? '已生成' : '待生成'}</em></div><div className="metric"><strong>{String(shots.length).padStart(2,'0')}</strong><span>分镜镜头</span><em>可编辑</em></div><div className="metric"><strong>00</strong><span>视频片段</span><em>待生成</em></div></div><div className="flow">{['故事','剧本','角色','分镜','生图','视频','配音','成片'].map((x,i)=><React.Fragment key={x}><span className={i < (story ? 4 : 1) ? 'flow-node done':'flow-node'}>{x}</span>{i<7&&<i>→</i>}</React.Fragment>)}</div></div>
        </section>

        {story && <section className="panel story-panel"><div className="panel-title"><div><span className="kicker">SCRIPT</span><h2>AI 剧本</h2></div></div><p>{story}</p></section>}

        <section className="workspace-grid"><div className="panel shots-panel"><div className="panel-title"><div><span className="kicker">STORYBOARD</span><h2>AI 分镜导演台</h2></div><button className="mini" onClick={()=>setShots([...shots,{id:Date.now(),title:`镜头 ${String(shots.length+1).padStart(2,'0')}`,scene:'新场景',visual:'填写画面描述',camera:'中景',dialogue:''}])}>＋ 添加镜头</button></div><div className="shot-list">{shots.map((shot,index)=><div className="shot-card" key={shot.id}><div className="shot-thumb"><span>{String(index+1).padStart(2,'0')}</span><div className="fake-frame"><b>{shot.scene}</b><small>{style}</small></div></div><div className="shot-content"><div className="shot-head"><strong>{shot.title}</strong><span>{shot.camera}</span></div><p>{shot.visual}</p><blockquote>“{shot.dialogue || '暂无对白'}”</blockquote></div></div>)}</div></div>
          <div className="right-stack"><div className="panel character-panel"><div className="panel-title"><div><span className="kicker">CHARACTERS</span><h2>角色资产</h2></div><span className="tag">一致性锁定</span></div>{(characters.length ? characters : [['林晚','女主 · 24岁','冷静、克制、强势'],['顾沉','男主 · 27岁','危险、沉默、保护欲'],['林震海','反派 · 52岁','精明、控制欲强']]).map((c,i)=><div className="character" key={i}><div className={`avatar a${i+1}`}>{(c.name || c[0])[0]}</div><div><strong>{c.name || c[0]}</strong><span>{c.role || c[1]}</span><small>{c.personality || c[2]}</small></div><button>编辑</button></div>)}</div>
            <div className="panel api-panel"><div className="panel-title"><div><span className="kicker">AI CONNECTORS</span><h2>模型接入</h2></div></div><div className="api-row"><span>本地 Ollama</span><b>免云端 Token</b></div><div className="api-row"><span>DeepSeek</span><b>已支持</b></div><div className="api-row"><span>豆包 Ark</span><b>已支持</b></div><div className="api-row"><span>ComfyUI 生图</span><b>下一阶段</b></div><p className="hint">云端模型的 API 费用由对应平台收取；本地 Ollama 模式不需要 API Key。API Key 只保存在当前电脑的本地存储中。</p></div></div></section>
      </main>

      {settingsOpen && <div className="modal-backdrop" onClick={() => setSettingsOpen(false)}><div className="modal panel" onClick={e => e.stopPropagation()}><div className="panel-title"><div><span className="kicker">MODEL SETTINGS</span><h2>{provider} 配置</h2></div><button className="ghost" onClick={() => setSettingsOpen(false)}>关闭</button></div><label>接口地址<input value={config.baseUrl || ''} onChange={e => setConfig({...config, baseUrl:e.target.value})} /></label><label>{provider === '豆包' ? 'Ark Endpoint ID / 模型 ID' : '模型名称'}<input value={config.model || ''} onChange={e => setConfig({...config, model:e.target.value})} placeholder={provider === '豆包' ? '例如 ep-xxxxxxxx' : '例如 qwen2.5:7b'} /></label>{provider !== '本地 AI（Ollama）' && <label>API Key<input type="password" value={config.key || ''} onChange={e => setConfig({...config, key:e.target.value})} placeholder="粘贴对应平台 API Key" /></label>}<div className="settings-note">{provider === '本地 AI（Ollama）' ? '本地模式：安装并启动 Ollama 后，下载一个本地模型即可运行，不消耗 DeepSeek / 豆包 API Token。' : '云端模式：需要对应平台的 API Key，实际费用和额度由 DeepSeek / 豆包平台决定。'}</div><button className="primary full" onClick={saveConfig}>保存配置</button></div></div>}
    </div>
  );
}
