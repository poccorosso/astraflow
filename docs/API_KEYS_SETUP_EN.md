# API Keys Setup Guide

## 📋 Table of Contents

1. [Quick Start](#quick-start)
2. [Gemini API Key Setup](#gemini-api-key-setup)
3. [DeepSeek API Key Setup](#deepseek-api-key-setup)
4. [Environment Variables](#environment-variables)
5. [Free vs Paid Comparison](#free-vs-paid-comparison)
6. [Troubleshooting](#troubleshooting)

---

## Quick Start

### 🚀 Minimal Setup

Only one API key is needed to get started:

```bash
# Choose one of the following:

# Option 1: Gemini only (recommended for beginners)
GEMINI_API_KEY=your_gemini_api_key_here

# Option 2: DeepSeek only (cost-sensitive)
DEEPSEEK_API_KEY=your_deepseek_api_key_here
```

### 🎯 Recommended Setup

For the best experience, configure both API keys:

```bash
# Hybrid architecture - best performance and cost balance
GEMINI_API_KEY=your_gemini_api_key_here
DEEPSEEK_API_KEY=your_deepseek_api_key_here
```

---

## Gemini API Key Setup

### 🔑 Get Free API Key

#### Step 1: Visit Google AI Studio
1. Open [Google AI Studio](https://aistudio.google.com/)
2. Sign in with Google account
3. Accept terms of service

#### Step 2: Create API Key
1. Click "Get API Key" button
2. Select "Create API key in new project" or use existing project
3. Copy the generated API key

#### Step 3: Verify Key
```bash
# Test API key
curl -H "Content-Type: application/json" \
     -d '{"contents":[{"parts":[{"text":"Hello"}]}]}' \
     -X POST "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=YOUR_API_KEY"
```

### 💰 Upgrade to Paid Account

#### Why Upgrade?

**Free Limitations**:
- ⏱️ 15 requests per minute
- 📅 1,500 requests per day
- ❌ No access to premium models
- ❌ No commercial use license

**Paid Benefits**:
- 🚀 1,000+ requests per minute
- ♾️ No daily limits
- ✅ Access to all models
- ✅ Commercial use license
- 📞 Priority support

#### Upgrade Steps

1. **Visit Google Cloud Console**
   - Open [Google Cloud Console](https://console.cloud.google.com/)
   - Select or create project

2. **Enable Billing**
   - Navigate to "Billing" section
   - Add payment method
   - Enable Generative AI API

3. **Configure Quotas**
   - Visit "APIs & Services" > "Quotas"
   - Search "Generative Language API"
   - Request quota increase

### 🌍 Regional Availability

#### Supported Regions
- 🇺🇸 United States
- 🇨🇦 Canada  
- 🇬🇧 United Kingdom
- 🇪🇺 EU Countries
- 🇯🇵 Japan
- 🇰🇷 South Korea
- 🇦🇺 Australia

#### Unsupported Regions
- 🇨🇳 Mainland China
- 🇷🇺 Russia
- Some Middle Eastern countries

**Workarounds**:
- Use VPN service
- Through proxy server
- Use account from supported region

---

## DeepSeek API Key Setup

### 🔑 Get API Key

#### Step 1: Register Account
1. Visit [DeepSeek Platform](https://platform.deepseek.com/)
2. Click "Sign Up"
3. Register with email or phone

#### Step 2: Identity Verification (Optional)
1. Go to profile
2. Complete verification for higher quota
3. Upload ID documents

#### Step 3: Create API Key
1. Navigate to "API Keys" page
2. Click "Create New Key"
3. Set key name and permissions
4. Copy the generated API key

#### Step 4: Verify Key
```bash
# Test DeepSeek API
curl -X POST "https://api.deepseek.com/v1/chat/completions" \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_API_KEY" \
     -d '{
       "model": "deepseek-chat",
       "messages": [{"role": "user", "content": "Hello"}]
     }'
```

### 💰 DeepSeek Pricing

#### Free Credits
- 🎁 New users get $5 USD
- 📅 Monthly free credits
- 🔄 Pay-as-you-go after credits

#### Paid Pricing (December 2024)
| Model | Input Price | Output Price |
|-------|-------------|--------------|
| **deepseek-chat** | $0.14 / 1M tokens | $0.28 / 1M tokens |
| **deepseek-coder** | $0.14 / 1M tokens | $0.28 / 1M tokens |

#### Cost Comparison
```
DeepSeek vs Gemini (per 1M tokens):
- DeepSeek Chat: $0.42 USD
- Gemini 1.5 Pro: $6.25 USD
- Cost savings: 93%
```

---

## Environment Variables

### 📝 .env File Configuration

Create `backend/.env` file:

```bash
# ===========================================
# API Keys Configuration
# ===========================================

# Gemini API Key (required for web search)
GEMINI_API_KEY=your_gemini_api_key_here

# DeepSeek API Key (optional, for cost optimization)
DEEPSEEK_API_KEY=your_deepseek_api_key_here
DEEPSEEK_BASE_URL=https://api.deepseek.com

# ===========================================
# Model Configuration  
# ===========================================

# Default Provider
LLM_PROVIDER=auto  # auto, gemini, deepseek

# Default Models
DEFAULT_GEMINI_MODEL=gemini-1.5-flash
DEFAULT_DEEPSEEK_MODEL=deepseek-chat

# ===========================================
# Feature Flags
# ===========================================

# Enable Hybrid Architecture
USE_HYBRID_ARCHITECTURE=true

# Allow Simulated Research
ALLOW_SIMULATED_RESEARCH=false

# Enable Paid Models
ENABLE_PAID_MODELS=false

# ===========================================
# Rate Limiting
# ===========================================

# Request Limits
MAX_REQUESTS_PER_MINUTE=10
MAX_REQUESTS_PER_DAY=1000

# Timeout Settings
REQUEST_TIMEOUT=30
MAX_RETRIES=3
```

### 🔒 Security Best Practices

#### 1. Protect API Keys
```bash
# ❌ Wrong - Don't hardcode in code
const API_KEY = "sk-1234567890abcdef";

# ✅ Correct - Use environment variables
const API_KEY = process.env.GEMINI_API_KEY;
```

#### 2. File Permissions
```bash
# Set .env file permissions
chmod 600 backend/.env

# Ensure .env is in .gitignore
echo "backend/.env" >> .gitignore
```

#### 3. Key Rotation
```bash
# Regularly rotate API keys
# Recommended: Every 3-6 months

# Monitor unusual usage
# Set usage alerts
```

---

## Free vs Paid Comparison

### 📊 Detailed Comparison

| Feature | Gemini Free | Gemini Paid | DeepSeek |
|---------|-------------|-------------|----------|
| **Monthly Cost** | $0 | $50-200+ | $5-50 |
| **Request Limits** | 15/min, 1500/day | 1000+/min, unlimited | High quota |
| **Model Access** | Basic models | All models | DeepSeek series |
| **Commercial Use** | ❌ | ✅ | ✅ |
| **Web Search** | ✅ | ✅ | ❌ (needs hybrid) |
| **Response Speed** | Medium | Fast | Very Fast |
| **Chinese Support** | Good | Good | Excellent |
| **Support** | Community | Priority | Standard |

### 🎯 Usage Scenario Recommendations

#### Personal Learning
```yaml
Recommended:
  primary: Gemini Free
  backup: DeepSeek
  cost: $0-5/month
  
Suitable for:
  - Learning and experimentation
  - Small projects
  - Prototype development
```

#### Small Business
```yaml
Recommended:
  primary: DeepSeek
  search: Gemini Free (hybrid architecture)
  cost: $10-50/month
  
Suitable for:
  - Startups
  - Cost-sensitive apps
  - Medium traffic
```

#### Enterprise Application
```yaml
Recommended:
  primary: Gemini Paid
  backup: DeepSeek
  cost: $100-500+/month
  
Suitable for:
  - Large-scale apps
  - High availability
  - Commercial support
```

---

## Troubleshooting

### 🚨 Common Errors

#### 1. Invalid API Key
```
Error: "API key not valid"
Solution:
1. Check if key is copied correctly
2. Confirm key hasn't expired
3. Verify key permissions
```

#### 2. Quota Exceeded
```
Error: "Quota exceeded"
Solution:
1. Check current usage
2. Wait for quota reset
3. Upgrade to paid plan
```

#### 3. Regional Restrictions
```
Error: "Service not available in your region"
Solution:
1. Use VPN
2. Change API endpoint
3. Contact support
```

#### 4. Network Issues
```
Error: "Connection timeout"
Solution:
1. Check network connection
2. Increase timeout
3. Use proxy server
```

### 🔧 Debugging Tools

#### API Test Script
```bash
#!/bin/bash
# test_apis.sh - API connection test script

echo "Testing Gemini API..."
curl -s -H "Content-Type: application/json" \
     -d '{"contents":[{"parts":[{"text":"Hello"}]}]}' \
     -X POST "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=$GEMINI_API_KEY" \
     | jq '.candidates[0].content.parts[0].text'

echo "Testing DeepSeek API..."
curl -s -X POST "https://api.deepseek.com/v1/chat/completions" \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer $DEEPSEEK_API_KEY" \
     -d '{"model": "deepseek-chat", "messages": [{"role": "user", "content": "Hello"}]}' \
     | jq '.choices[0].message.content'
```

#### Usage Monitoring
```python
# monitor_usage.py - Usage monitoring script
import os
import requests
from datetime import datetime

def check_gemini_quota():
    """Check Gemini quota usage"""
    # Note: Gemini doesn't have direct quota query API
    # Need to check through Google Cloud Console
    print("Please visit Google AI Studio to check quota usage")

def check_deepseek_quota():
    """Check DeepSeek quota usage"""
    api_key = os.getenv('DEEPSEEK_API_KEY')
    headers = {'Authorization': f'Bearer {api_key}'}
    
    try:
        response = requests.get(
            'https://api.deepseek.com/v1/user/balance',
            headers=headers
        )
        if response.status_code == 200:
            data = response.json()
            print(f"DeepSeek Balance: ${data.get('balance', 'N/A')}")
        else:
            print(f"Cannot get DeepSeek balance: {response.status_code}")
    except Exception as e:
        print(f"Error checking DeepSeek balance: {e}")

if __name__ == "__main__":
    print(f"Usage Check - {datetime.now()}")
    check_gemini_quota()
    check_deepseek_quota()
```

---

## 📞 Getting Help

### 🆘 Support Channels

#### Gemini Support
- 📚 [Official Documentation](https://ai.google.dev/docs)
- 💬 [Community Forum](https://discuss.ai.google.dev/)
- 🐛 [Issue Reports](https://github.com/google/generative-ai-docs/issues)

#### DeepSeek Support
- 📚 [Official Documentation](https://platform.deepseek.com/docs)
- 💬 [Discord Community](https://discord.gg/deepseek)
- 📧 [Email Support](mailto:support@deepseek.com)

#### Project Support
- 🐛 [GitHub Issues](https://github.com/your-repo/issues)
- 📖 [Project Documentation](../README.md)
- 💬 [Discussions](https://github.com/your-repo/discussions)

---

**Last Updated**: December 2024
**Document Version**: 1.0
