# AI漫剧工坊

Windows 桌面版 AI 漫剧创作软件。

## 当前能力

- 桌面应用界面
- 项目名称 / 故事创意 / 视觉风格配置
- DeepSeek / 豆包 / OpenAI Compatible 模型入口
- AI 编剧入口
- 角色资产管理
- AI 分镜导演台
- 一键生成演示流程
- 项目 JSON 导出
- Electron Windows 桌面运行环境
- GitHub Actions 自动打包 Windows 安装程序

## 本地开发

```bash
npm install
npm run desktop
```

## 生成 Windows 安装包

```bash
npm install
npm run dist
```

生成文件位于：

```text
release/
```

GitHub 每次推送到 `main` 后，也会自动运行 `Build Windows App` 工作流并上传 `.exe` 安装程序 Artifact。

## 下一阶段

当前 AI 一键生成使用本地演示逻辑。正式商用版下一步将接入真实服务：

1. DeepSeek / 豆包真实 API
2. 小说自动拆集与结构化剧本
3. 角色定妆图与角色一致性
4. ComfyUI / 云端图片模型
5. 图生视频模型
6. TTS 多角色配音
7. 自动字幕、BGM、时间线剪辑
8. MP4 成片导出
9. 登录、云项目、额度与会员系统

> API Key 不应写入前端源码。后续桌面正式版会通过主进程或服务端安全调用模型。
