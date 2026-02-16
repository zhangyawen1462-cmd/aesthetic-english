# 🌐 CDN 配置指南

## 概述

本项目支持使用自定义 CDN 域名来加速静态资源（图片、视频）的访问。配置后，所有上传到阿里云 OSS 的文件都会自动使用 CDN 域名。

## 配置步骤

### 1. 在阿里云配置 CDN

1. 登录 [阿里云 CDN 控制台](https://cdn.console.aliyun.com/)
2. 添加加速域名（例如：`assets.aestheticenglish.com`）
3. 源站类型选择：**OSS 域名**
4. 选择你的 OSS Bucket
5. 配置 HTTPS 证书（推荐）
6. 等待 CDN 配置生效（通常 5-10 分钟）

### 2. 配置 DNS 解析

在你的域名服务商（如 Cloudflare、阿里云 DNS）添加 CNAME 记录：

```
类型: CNAME
主机记录: assets
记录值: [阿里云提供的 CDN CNAME 地址]
```

### 3. 配置环境变量

#### 本地开发环境

编辑 `.env.local` 文件，添加：

```bash
OSS_CDN_DOMAIN=https://assets.aestheticenglish.com
```

**注意**：
- 必须包含 `https://` 或 `http://`
- 不要在末尾添加斜杠 `/`

#### Vercel 生产环境

1. 打开 [Vercel Dashboard](https://vercel.com/dashboard)
2. 选择你的项目
3. 进入 **Settings** → **Environment Variables**
4. 添加新变量：
   - **Name**: `OSS_CDN_DOMAIN`
   - **Value**: `https://assets.aestheticenglish.com`
   - **Environment**: 选择 `Production`, `Preview`, `Development`
5. 点击 **Save**
6. 重新部署项目

### 4. 验证配置

上传一个测试文件，检查返回的 URL：

**配置前**：
```
https://your-bucket.oss-cn-hongkong.aliyuncs.com/images/1234567890-abc123.jpg
```

**配置后**：
```
https://assets.aestheticenglish.com/images/1234567890-abc123.jpg
```

## 工作原理

```
上传流程：
用户上传文件 → OSS 客户端 → 阿里云 OSS → 返回 OSS URL
                                              ↓
                                    转换为 CDN URL
                                              ↓
                                    保存到 Notion 数据库

访问流程：
用户访问网站 → 加载图片/视频 → CDN 节点 → 快速返回内容
```

## 优势

✅ **更快的加载速度** - CDN 节点分布全球，就近访问  
✅ **降低源站压力** - 减少对 OSS 的直接访问  
✅ **更好的用户体验** - 特别是视频播放更流畅  
✅ **节省流量成本** - CDN 流量通常比 OSS 便宜  

## 故障排查

### 问题 1：上传后仍然显示 OSS 域名

**原因**：环境变量未生效

**解决方案**：
1. 检查 `.env.local` 文件是否正确配置
2. 重启开发服务器：`npm run dev`
3. Vercel 上需要重新部署

### 问题 2：CDN URL 无法访问

**原因**：CDN 配置未生效或 DNS 解析错误

**解决方案**：
1. 检查 DNS 解析是否正确：`nslookup assets.aestheticenglish.com`
2. 检查 CDN 状态是否为"运行中"
3. 清除浏览器缓存
4. 等待 CDN 全球节点同步（最多 24 小时）

### 问题 3：HTTPS 证书错误

**原因**：CDN 未配置 SSL 证书

**解决方案**：
1. 在阿里云 CDN 控制台配置 HTTPS 证书
2. 可以使用免费的 Let's Encrypt 证书
3. 或上传自己的证书

## 可选：不使用 CDN

如果暂时不需要 CDN，只需：

1. 不配置 `OSS_CDN_DOMAIN` 环境变量
2. 系统会自动使用 OSS 默认域名
3. 功能完全正常，只是速度稍慢

## 成本估算

以阿里云为例（2024 年价格）：

- **OSS 流量**：约 ¥0.50/GB
- **CDN 流量**：约 ¥0.24/GB（中国大陆）
- **节省**：约 50%

对于视频内容较多的项目，使用 CDN 可以显著降低成本。

## 相关文档

- [阿里云 OSS 配置指南](./阿里云OSS配置指南.md)
- [自动化发布完整指南](./自动化发布完整指南.md)



