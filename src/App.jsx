import React, { useMemo, useState } from 'react';

const defaultShots = [
  { id: 1, title: '镜头 01', scene: '雨夜，城市天台', visual: '女主站在霓虹灯下，雨水打湿外套，远处高楼虚化。', camera: '中景 → 缓慢推进', dialogue: '我终于等到这一天了。' },
  { id: 2, title: '镜头 02', scene: '天台入口', visual: '黑衣男人推门而出，逆光形成轮廓，手里握着旧照片。', camera: '低机位特写', dialogue: '你不该回来。' },
  { id: 3, title: '镜头 03', scene: '天台边缘', visual: '两人隔着数米对峙，风吹动衣角，闪电照亮城市。', camera: '大全景 → 环绕', dialogue: '有些账，总要算清楚。' }
];

const nav = ['工作台', 'AI 编剧', '角色库', '分镜导演', '画面生成', '视频生成', '配音字幕', '项目导出'];

export default function App() {
  const [active, setActive] = useState('工作台');
  const [projectName, setProjectName] = useState('我的第一部 AI 漫剧');
  const [idea, setIdea] = useState('一个被家族抛弃的女孩，三年后带着秘密身份回城复仇。');
  const [style, setStyle] = useState('国漫电影感');
  const [provider, setProvider] = useState('DeepSeek');
  const [shots, setShots] = useState(defaultShots);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('就绪');

  const progress = useMemo(() => Math.min(100, 25 + shots.length * 8), [shots.length]);

  function mockGenerate() {
    setBusy(true);
    setStatus('AI 正在生成剧本与分镜…');
    setTimeout(() => {
      setShots([
        ...defaultShots,
        { id: 4, title: '镜头 04', scene: '记忆闪回', visual: '童年女主在旧宅门口被赶出家门，暖黄灯光与现在冷蓝雨夜形成强烈反差。', camera: '手持近景 + 闪白转场', dialogue: '三年前，你们说我永远别回来。' },
        { id: 5, title: '镜头 05', scene: '现实·天台', visual: '女主抬眼，身后城市广告屏亮起她如今公司的品牌标志。', camera: '眼部特写 → 拉远', dialogue: '可现在，是你们需要我。' }
      ]);
      setBusy(false);
      setStatus('生成完成，可继续编辑');
    }, 900);
  }

  function exportProject() {
    const data = { projectName, idea, style, provider, shots, exportedAt: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${projectName || 'ai-manjv-project'}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setStatus('项目已导出');
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">AI</div>
          <div><strong>漫剧工坊</strong><span>Creator Studio</span></div>
        </div>
        <div className="nav-list">
          {nav.map(item => (
            <button key={item} className={active === item ? 'nav-item active' : 'nav-item'} onClick={() => setActive(item)}>
              <span className="dot" />{item}
            </button>
          ))}
        </div>
        <div className="sidebar-card">
          <div className="muted">当前 AI</div>
          <div className="provider-row"><span className="pulse" />{provider}</div>
          <small>支持后续接入豆包 / DeepSeek / ComfyUI / 视频模型</small>
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <div>
            <div className="eyebrow">AI COMIC DRAMA STUDIO</div>
            <h1>{active}</h1>
          </div>
          <div className="top-actions">
            <span className="status">● {status}</span>
            <button className="ghost" onClick={exportProject}>导出项目</button>
            <button className="primary" onClick={mockGenerate} disabled={busy}>{busy ? '生成中…' : '一键生成'}</button>
          </div>
        </header>

        <section className="hero-grid">
          <div className="panel form-panel">
            <div className="panel-title"><div><span className="kicker">PROJECT</span><h2>新建漫剧项目</h2></div><span className="tag">桌面版 MVP</span></div>
            <label>项目名称<input value={projectName} onChange={e => setProjectName(e.target.value)} /></label>
            <label>故事创意<textarea rows="5" value={idea} onChange={e => setIdea(e.target.value)} /></label>
            <div className="two-col">
              <label>视觉风格<select value={style} onChange={e => setStyle(e.target.value)}><option>国漫电影感</option><option>日漫热血</option><option>写实短剧</option><option>赛博朋克</option><option>古风仙侠</option></select></label>
              <label>文本模型<select value={provider} onChange={e => setProvider(e.target.value)}><option>DeepSeek</option><option>豆包</option><option>OpenAI Compatible</option></select></label>
            </div>
            <button className="generate-wide" onClick={mockGenerate} disabled={busy}>✦ {busy ? '正在生成剧本、角色与分镜…' : '生成完整漫剧方案'}</button>
          </div>

          <div className="panel overview-panel">
            <div className="panel-title"><div><span className="kicker">PIPELINE</span><h2>生产进度</h2></div><b>{progress}%</b></div>
            <div className="progress"><span style={{ width: `${progress}%` }} /></div>
            <div className="metric-grid">
              <div className="metric"><strong>01</strong><span>AI 剧本</span><em>已就绪</em></div>
              <div className="metric"><strong>03</strong><span>角色设定</span><em>待生成</em></div>
              <div className="metric"><strong>{String(shots.length).padStart(2,'0')}</strong><span>分镜镜头</span><em>可编辑</em></div>
              <div className="metric"><strong>00</strong><span>视频片段</span><em>待生成</em></div>
            </div>
            <div className="flow">
              {['故事','剧本','角色','分镜','生图','视频','配音','成片'].map((x,i)=><React.Fragment key={x}><span className={i < 4 ? 'flow-node done':'flow-node'}>{x}</span>{i<7&&<i>→</i>}</React.Fragment>)}
            </div>
          </div>
        </section>

        <section className="workspace-grid">
          <div className="panel shots-panel">
            <div className="panel-title"><div><span className="kicker">STORYBOARD</span><h2>AI 分镜导演台</h2></div><button className="mini" onClick={()=>setShots([...shots,{id:Date.now(),title:`镜头 ${String(shots.length+1).padStart(2,'0')}`,scene:'新场景',visual:'填写画面描述',camera:'中景',dialogue:''}])}>＋ 添加镜头</button></div>
            <div className="shot-list">
              {shots.map((shot,index)=>(
                <div className="shot-card" key={shot.id}>
                  <div className="shot-thumb"><span>{String(index+1).padStart(2,'0')}</span><div className="fake-frame"><b>{shot.scene}</b><small>{style}</small></div></div>
                  <div className="shot-content"><div className="shot-head"><strong>{shot.title}</strong><span>{shot.camera}</span></div><p>{shot.visual}</p><blockquote>“{shot.dialogue || '暂无对白'}”</blockquote></div>
                </div>
              ))}
            </div>
          </div>

          <div className="right-stack">
            <div className="panel character-panel">
              <div className="panel-title"><div><span className="kicker">CHARACTERS</span><h2>角色资产</h2></div><span className="tag">一致性锁定</span></div>
              {[['林晚','女主 · 24岁','冷静、克制、强势'],['顾沉','男主 · 27岁','危险、沉默、保护欲'],['林震海','反派 · 52岁','精明、控制欲强']].map((c,i)=><div className="character" key={c[0]}><div className={`avatar a${i+1}`}>{c[0][0]}</div><div><strong>{c[0]}</strong><span>{c[1]}</span><small>{c[2]}</small></div><button>编辑</button></div>)}
            </div>
            <div className="panel api-panel">
              <div className="panel-title"><div><span className="kicker">AI CONNECTORS</span><h2>模型接入</h2></div></div>
              <div className="api-row"><span>DeepSeek 文本</span><b>可配置</b></div>
              <div className="api-row"><span>豆包大模型</span><b>可配置</b></div>
              <div className="api-row"><span>ComfyUI 生图</span><b>下一阶段</b></div>
              <div className="api-row"><span>图生视频</span><b>下一阶段</b></div>
              <p className="hint">正式版会把 API Key 保存在桌面端安全配置中，不写死在前端。</p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
