# 🔧 GitHub Integration Setup

This guide will help you set up real GitHub repository creation in your HackathonAgent.

## 📋 Prerequisites

1. **GitHub Account**: You need a GitHub account
2. **Personal Access Token**: You need to create a GitHub Personal Access Token

## 🔑 Creating a GitHub Personal Access Token

### Step 1: Go to GitHub Settings
1. Log in to your GitHub account
2. Click your profile picture in the top right
3. Click **Settings**
4. Scroll down and click **Developer settings** (left sidebar)
5. Click **Personal access tokens** → **Tokens (classic)**

### Step 2: Generate New Token
1. Click **Generate new token** → **Generate new token (classic)**
2. Give it a descriptive name: `HackathonAgent`
3. Set expiration: `No expiration` (or your preferred duration)
4. Select these scopes:
   - ✅ **repo** (Full control of private repositories)
     - ✅ **repo:status** (Access commit status)
     - ✅ **repo_deployment** (Access deployment status)
     - ✅ **public_repo** (Access public repositories)
   - ✅ **workflow** (Update GitHub Action workflows)

### Step 3: Copy the Token
1. Click **Generate token**
2. **IMPORTANT**: Copy the token immediately (you won't see it again!)
3. Save it somewhere safe

## 🔧 Environment Setup

### Option 1: Using .env file (Recommended)
1. Create a `.env` file in your `HackathonAgent` directory:
```bash
cd /Users/gowrigalgali/Desktop/HackathonAI/HackathonAgent
touch .env
```

2. Add your GitHub token to the `.env` file:
```env
GITHUB_TOKEN=your_github_token_here
GOOGLE_API_KEY=your_google_api_key_here
```

### Option 2: Using Environment Variables
```bash
export GITHUB_TOKEN="your_github_token_here"
export GOOGLE_API_KEY="your_google_api_key_here"
```

## 🚀 Testing the Setup

1. **Start your backend server**:
```bash
cd /Users/gowrigalgali/Desktop/HackathonAI/HackathonAgent
python backend_api.py
```

2. **Test repository creation**:
   - Go to http://localhost:3001/repo-builder
   - Generate some code
   - Click "Create GitHub Repo"
   - Check your GitHub account - you should see a new repository!

## ✅ What You'll Get

When you create a repository, the system will:

1. **Create a real GitHub repository** under your account
2. **Add all generated files** to the repository
3. **Create proper commits** with meaningful messages
4. **Set up the repository** with description and visibility settings
5. **Return the real GitHub URL** for you to visit

## 🔒 Security Notes

- **Never commit your `.env` file** to version control
- **Keep your GitHub token secure** - treat it like a password
- **Use environment variables** in production deployments
- **Rotate your tokens** periodically for security

## 🐛 Troubleshooting

### "GitHub token not configured" Error
- Make sure your `.env` file is in the correct location
- Verify the token is correctly formatted (no extra spaces)
- Restart your backend server after adding the token

### "Failed to create repository" Error
- Check if the repository name already exists
- Verify your token has the correct permissions
- Make sure your GitHub account is not suspended

### Repository Created but Files Not Added
- This is normal for very large files
- Check the console logs for specific file errors
- The repository will still be created successfully

## 🎉 You're All Set!

Once configured, your HackathonAgent will create real GitHub repositories with all your generated code. No more mock URLs or 404 errors!

Happy coding! 🚀
