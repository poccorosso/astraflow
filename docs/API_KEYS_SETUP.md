# API密钥配置指南 / API Keys Setup Guide

## 📋 目录 / Table of Contents

1. [快速开始 / Quick Start](#快速开始--quick-start)
2. [Gemini API密钥获取 / Gemini API Key Setup](#gemini-api密钥获取--gemini-api-key-setup)
3. [DeepSeek API密钥获取 / DeepSeek API Key Setup](#deepseek-api密钥获取--deepseek-api-key-setup)
4. [环境变量配置 / Environment Variables](#环境变量配置--environment-variables)
5. [免费vs付费对比 / Free vs Paid Comparison](#免费vs付费对比--free-vs-paid-comparison)
6. [故障排除 / Troubleshooting](#故障排除--troubleshooting)

---

## 快速开始 / Quick Start

### 🚀 最小配置 / Minimal Setup

只需要一个API密钥即可开始使用：
**English**: Only one API key is needed to get started:

```bash
# 选择其中一个 / Choose one of the following:

# 选项1: 仅使用Gemini (推荐新手) / Option 1: Gemini only (recommended for beginners)
GEMINI_API_KEY=your_gemini_api_key_here

# 选项2: 仅使用DeepSeek (成本敏感) / Option 2: DeepSeek only (cost-sensitive)
DEEPSEEK_API_KEY=your_deepseek_api_key_here
```

### 🎯 推荐配置 / Recommended Setup

为了获得最佳体验，建议配置两个API密钥：
**English**: For the best experience, configure both API keys:

```bash
# 混合架构 - 最佳性能和成本平衡 / Hybrid architecture - best performance and cost balance
GEMINI_API_KEY=your_gemini_api_key_here
DEEPSEEK_API_KEY=your_deepseek_api_key_here
```

---

## Gemini API密钥获取 / Gemini API Key Setup

### 🔑 获取免费API密钥 / Get Free API Key

#### 步骤1: 访问Google AI Studio
1. 打开 [Google AI Studio](https://aistudio.google.com/)
2. 使用Google账号登录 / Sign in with Google account
3. 接受服务条款 / Accept terms of service

#### 步骤2: 创建API密钥
1. 点击 "Get API Key" 按钮
2. 选择 "Create API key in new project" 或使用现有项目
3. 复制生成的API密钥 / Copy the generated API key

#### 步骤3: 验证密钥
```bash
# 测试API密钥 / Test API key
curl -H "Content-Type: application/json" \
     -d '{"contents":[{"parts":[{"text":"Hello"}]}]}' \
     -X POST "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=YOUR_API_KEY"
```

### 💰 升级到付费账户 / Upgrade to Paid Account

#### 为什么需要升级? / Why Upgrade?

**免费限制 / Free Limitations**:
- ⏱️ 每分钟15次请求 / 15 requests per minute
- 📅 每天1,500次请求 / 1,500 requests per day
- ❌ 无法使用高级模型 / No access to premium models
- ❌ 无商业使用许可 / No commercial use license

**付费优势 / Paid Benefits**:
- 🚀 每分钟1,000+次请求 / 1,000+ requests per minute
- ♾️ 无每日限制 / No daily limits
- ✅ 访问所有模型 / Access to all models
- ✅ 商业使用许可 / Commercial use license
- 📞 优先技术支持 / Priority support

#### 升级步骤 / Upgrade Steps

1. **访问Google Cloud Console**
   - 打开 [Google Cloud Console](https://console.cloud.google.com/)
   - 选择或创建项目 / Select or create project

2. **启用计费 / Enable Billing**
   - 导航到 "Billing" 部分
   - 添加付款方式 / Add payment method
   - 启用 Generative AI API

3. **配置配额 / Configure Quotas**
   - 访问 "APIs & Services" > "Quotas"
   - 搜索 "Generative Language API"
   - 请求增加配额 / Request quota increase

### 🌍 地区可用性 / Regional Availability

#### 支持的地区 / Supported Regions
- 🇺🇸 美国 / United States
- 🇨🇦 加拿大 / Canada  
- 🇬🇧 英国 / United Kingdom
- 🇪🇺 欧盟国家 / EU Countries
- 🇯🇵 日本 / Japan
- 🇰🇷 韩国 / South Korea
- 🇦🇺 澳大利亚 / Australia

#### 不支持的地区 / Unsupported Regions
- 🇨🇳 中国大陆 / Mainland China
- 🇷🇺 俄罗斯 / Russia
- 部分中东国家 / Some Middle Eastern countries

**解决方案 / Workarounds**:
- 使用VPN服务 / Use VPN service
- 通过代理服务器 / Through proxy server
- 使用其他地区的账户 / Use account from supported region

---

## DeepSeek API密钥获取 / DeepSeek API Key Setup

### 🔑 获取API密钥 / Get API Key

#### 步骤1: 注册账户
1. 访问 [DeepSeek官网](https://platform.deepseek.com/)
2. 点击 "注册" / Click "Sign Up"
3. 使用邮箱或手机号注册 / Register with email or phone

#### 步骤2: 实名认证 (可选)
1. 进入个人中心 / Go to profile
2. 完成实名认证获得更高配额 / Complete verification for higher quota
3. 上传身份证明文件 / Upload ID documents

#### 步骤3: 创建API密钥
1. 导航到 "API Keys" 页面
2. 点击 "创建新密钥" / Click "Create New Key"
3. 设置密钥名称和权限 / Set key name and permissions
4. 复制生成的API密钥 / Copy the generated API key

#### 步骤4: 验证密钥
```bash
# 测试DeepSeek API / Test DeepSeek API
curl -X POST "https://api.deepseek.com/v1/chat/completions" \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_API_KEY" \
     -d '{
       "model": "deepseek-chat",
       "messages": [{"role": "user", "content": "Hello"}]
     }'
```

### 💰 DeepSeek定价 / DeepSeek Pricing

#### 免费额度 / Free Credits
- 🎁 新用户赠送 $5 USD / New users get $5 USD
- 📅 每月免费额度 / Monthly free credits
- 🔄 额度用完后按量付费 / Pay-as-you-go after credits

#### 付费价格 / Paid Pricing (2024年12月)
| 模型 / Model | 输入价格 / Input | 输出价格 / Output |
|--------------|-----------------|------------------|
| **deepseek-chat** | $0.14 / 1M tokens | $0.28 / 1M tokens |
| **deepseek-coder** | $0.14 / 1M tokens | $0.28 / 1M tokens |

#### 成本对比 / Cost Comparison
```
DeepSeek vs Gemini (每100万tokens / per 1M tokens):
- DeepSeek Chat: $0.42 USD
- Gemini 1.5 Pro: $6.25 USD
- 节省成本: 93% / Cost savings: 93%
```

---

## 环境变量配置 / Environment Variables

### 📝 .env文件配置 / .env File Configuration

创建 `backend/.env` 文件：
**English**: Create `backend/.env` file:

```bash
# ===========================================
# API密钥配置 / API Keys Configuration
# ===========================================

# Gemini API密钥 (必需用于网络搜索) / Gemini API Key (required for web search)
GEMINI_API_KEY=your_gemini_api_key_here

# DeepSeek API密钥 (可选，用于成本优化) / DeepSeek API Key (optional, for cost optimization)
DEEPSEEK_API_KEY=your_deepseek_api_key_here
DEEPSEEK_BASE_URL=https://api.deepseek.com

# ===========================================
# 模型配置 / Model Configuration  
# ===========================================

# 默认提供商 / Default Provider
LLM_PROVIDER=auto  # auto, gemini, deepseek

# 默认模型 / Default Models
DEFAULT_GEMINI_MODEL=gemini-1.5-flash
DEFAULT_DEEPSEEK_MODEL=deepseek-chat

# ===========================================
# 功能开关 / Feature Flags
# ===========================================

# 启用混合架构 / Enable Hybrid Architecture
USE_HYBRID_ARCHITECTURE=true

# 允许模拟研究 / Allow Simulated Research
ALLOW_SIMULATED_RESEARCH=false

# 启用付费模型 / Enable Paid Models
ENABLE_PAID_MODELS=false

# ===========================================
# 速率限制 / Rate Limiting
# ===========================================

# 请求限制 / Request Limits
MAX_REQUESTS_PER_MINUTE=10
MAX_REQUESTS_PER_DAY=1000

# 超时设置 / Timeout Settings
REQUEST_TIMEOUT=30
MAX_RETRIES=3
```

### 🔒 安全最佳实践 / Security Best Practices

#### 1. 保护API密钥 / Protect API Keys
```bash
# ❌ 错误做法 - 不要在代码中硬编码 / Wrong - Don't hardcode in code
const API_KEY = "sk-1234567890abcdef";

# ✅ 正确做法 - 使用环境变量 / Correct - Use environment variables
const API_KEY = process.env.GEMINI_API_KEY;
```

#### 2. 文件权限设置 / File Permissions
```bash
# 设置.env文件权限 / Set .env file permissions
chmod 600 backend/.env

# 确保.env在.gitignore中 / Ensure .env is in .gitignore
echo "backend/.env" >> .gitignore
```

#### 3. 密钥轮换 / Key Rotation
```bash
# 定期更换API密钥 / Regularly rotate API keys
# 建议频率: 每3-6个月 / Recommended: Every 3-6 months

# 监控异常使用 / Monitor unusual usage
# 设置使用量警报 / Set usage alerts
```

---

## 免费vs付费对比 / Free vs Paid Comparison

### 📊 详细对比表 / Detailed Comparison

| 特性 / Feature | Gemini免费 / Gemini Free | Gemini付费 / Gemini Paid | DeepSeek / DeepSeek |
|----------------|-------------------------|-------------------------|-------------------|
| **月成本 / Monthly Cost** | $0 | $50-200+ | $5-50 |
| **请求限制 / Request Limits** | 15/分钟, 1500/天 | 1000+/分钟, 无限 | 高配额 / High quota |
| **模型访问 / Model Access** | 基础模型 / Basic | 全部模型 / All | DeepSeek系列 / DeepSeek series |
| **商业使用 / Commercial Use** | ❌ | ✅ | ✅ |
| **网络搜索 / Web Search** | ✅ | ✅ | ❌ (需混合架构) |
| **响应速度 / Response Speed** | 中等 / Medium | 快 / Fast | 很快 / Very Fast |
| **中文支持 / Chinese Support** | 好 / Good | 好 / Good | 优秀 / Excellent |
| **技术支持 / Support** | 社区 / Community | 优先 / Priority | 标准 / Standard |

### 🎯 使用场景建议 / Usage Scenario Recommendations

#### 个人学习 / Personal Learning
```yaml
推荐配置 / Recommended:
  primary: Gemini Free
  backup: DeepSeek
  cost: $0-5/月
  
适合 / Suitable for:
  - 学习和实验 / Learning and experimentation
  - 小规模项目 / Small projects
  - 原型开发 / Prototype development
```

#### 小型企业 / Small Business
```yaml
推荐配置 / Recommended:
  primary: DeepSeek
  search: Gemini Free (混合架构)
  cost: $10-50/月
  
适合 / Suitable for:
  - 初创公司 / Startups
  - 成本敏感应用 / Cost-sensitive apps
  - 中等流量 / Medium traffic
```

#### 企业级应用 / Enterprise Application
```yaml
推荐配置 / Recommended:
  primary: Gemini Paid
  backup: DeepSeek
  cost: $100-500+/月
  
适合 / Suitable for:
  - 大规模应用 / Large-scale apps
  - 高可用性要求 / High availability
  - 商业级支持 / Commercial support
```

---

## 故障排除 / Troubleshooting

### 🚨 常见错误 / Common Errors

#### 1. API密钥无效 / Invalid API Key
```
错误信息 / Error: "API key not valid"
解决方案 / Solution:
1. 检查密钥是否正确复制 / Check if key is copied correctly
2. 确认密钥未过期 / Confirm key hasn't expired
3. 验证密钥权限 / Verify key permissions
```

#### 2. 配额超限 / Quota Exceeded
```
错误信息 / Error: "Quota exceeded"
解决方案 / Solution:
1. 检查当前使用量 / Check current usage
2. 等待配额重置 / Wait for quota reset
3. 升级到付费计划 / Upgrade to paid plan
```

#### 3. 地区限制 / Regional Restrictions
```
错误信息 / Error: "Service not available in your region"
解决方案 / Solution:
1. 使用VPN / Use VPN
2. 更换API端点 / Change API endpoint
3. 联系技术支持 / Contact support
```

#### 4. 网络连接问题 / Network Issues
```
错误信息 / Error: "Connection timeout"
解决方案 / Solution:
1. 检查网络连接 / Check network connection
2. 增加超时时间 / Increase timeout
3. 使用代理服务器 / Use proxy server
```

### 🔧 调试工具 / Debugging Tools

#### API测试脚本 / API Test Script
```bash
#!/bin/bash
# test_apis.sh - API连接测试脚本

echo "测试Gemini API / Testing Gemini API..."
curl -s -H "Content-Type: application/json" \
     -d '{"contents":[{"parts":[{"text":"Hello"}]}]}' \
     -X POST "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=$GEMINI_API_KEY" \
     | jq '.candidates[0].content.parts[0].text'

echo "测试DeepSeek API / Testing DeepSeek API..."
curl -s -X POST "https://api.deepseek.com/v1/chat/completions" \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer $DEEPSEEK_API_KEY" \
     -d '{"model": "deepseek-chat", "messages": [{"role": "user", "content": "Hello"}]}' \
     | jq '.choices[0].message.content'
```

#### 使用量监控 / Usage Monitoring
```python
# monitor_usage.py - 使用量监控脚本
import os
import requests
from datetime import datetime

def check_gemini_quota():
    """检查Gemini配额使用情况"""
    # 注意: Gemini没有直接的配额查询API
    # 需要通过Google Cloud Console查看
    print("请访问 Google AI Studio 查看配额使用情况")
    print("Visit Google AI Studio to check quota usage")

def check_deepseek_quota():
    """检查DeepSeek配额使用情况"""
    api_key = os.getenv('DEEPSEEK_API_KEY')
    headers = {'Authorization': f'Bearer {api_key}'}
    
    try:
        response = requests.get(
            'https://api.deepseek.com/v1/user/balance',
            headers=headers
        )
        if response.status_code == 200:
            data = response.json()
            print(f"DeepSeek余额: ${data.get('balance', 'N/A')}")
        else:
            print(f"无法获取DeepSeek余额: {response.status_code}")
    except Exception as e:
        print(f"检查DeepSeek余额时出错: {e}")

if __name__ == "__main__":
    print(f"使用量检查 - {datetime.now()}")
    check_gemini_quota()
    check_deepseek_quota()
```

---

## 📞 获取帮助 / Getting Help

### 🆘 技术支持渠道 / Support Channels

#### Gemini支持 / Gemini Support
- 📚 [官方文档](https://ai.google.dev/docs)
- 💬 [社区论坛](https://discuss.ai.google.dev/)
- 🐛 [问题报告](https://github.com/google/generative-ai-docs/issues)

#### DeepSeek支持 / DeepSeek Support
- 📚 [官方文档](https://platform.deepseek.com/docs)
- 💬 [Discord社区](https://discord.gg/deepseek)
- 📧 [邮件支持](mailto:support@deepseek.com)

#### 项目支持 / Project Support
- 🐛 [GitHub Issues](https://github.com/your-repo/issues)
- 📖 [项目文档](./README.md)
- 💬 [讨论区](https://github.com/your-repo/discussions)

---

**最后更新 / Last Updated**: 2024年12月 / December 2024
**文档版本 / Document Version**: 1.0
