# Security & Vulnerability Scanning Setup

Complete CI/CD security scanning infrastructure for Omnivore project.

## 📋 Overview

This document describes the automated security scanning and dependency monitoring systems configured for the Omnivore project.

## 🛡️ Security Tools Enabled

### 1. GitHub Dependabot

**File:** `.github/dependabot.yml`

**What it does:**

- Automatically scans dependencies for known security vulnerabilities
- Opens pull requests to update vulnerable packages
- Monitors npm packages, Docker images, and GitHub Actions
- Runs weekly on Mondays at 9:00 AM UTC

**Monitored packages:**

- Root workspace (`/`)
- API-Nest backend (`/packages/api-nest`)
- Omnivore-Polish frontend (`/packages/omnivore-polish`)
- Docker images
- GitHub Actions workflows

**Features:**

- Groups security patches together
- Labels PRs with `dependencies`, `security`, and package-specific tags
- Limits open PRs to prevent spam (5-10 per package)
- Groups related updates (e.g., all @nestjs/\* packages)

**How to use:**

1. Dependabot runs automatically once enabled in GitHub repo settings
2. Review and merge Dependabot PRs in the GitHub Pull Requests tab
3. PRs are labeled and easy to identify
4. Security updates are prioritized

### 2. GitHub Security Audit Workflow

**File:** `.github/workflows/security-audit.yml`

**When it runs:**

- On every push to `main`/`master` branch
- On every pull request
- Weekly schedule (Mondays at 9:00 AM UTC)
- Manual trigger via GitHub Actions UI

**Jobs:**

#### a) npm audit

- Runs `npm audit` on all packages
- Checks for moderate, high, and critical vulnerabilities
- Uploads audit reports as artifacts (30-day retention)
- **Fails the build** if high/critical vulnerabilities found
- Runs in parallel for api-nest and omnivore-polish

#### b) Dependency Review (PR only)

- Analyzes dependency changes in pull requests
- Detects new vulnerable dependencies before merge
- Checks license compatibility
- Fails on high/critical severity issues
- Allowed licenses: MIT, Apache-2.0, BSD-3-Clause, ISC, BSD-2-Clause

#### c) CodeQL Analysis

- GitHub's semantic code analysis tool
- Scans JavaScript and TypeScript code
- Detects:
  - SQL injection vulnerabilities
  - Cross-site scripting (XSS)
  - Command injection
  - Path traversal
  - Insecure cryptography
  - Authentication issues
- Results appear in GitHub Security tab

#### d) Docker Security Scan

- Uses Trivy scanner (industry-standard)
- Scans Docker images for OS vulnerabilities
- Checks base image (Node.js 25.2.1)
- Uploads results to GitHub Security tab
- Only scans on push/schedule (not PRs for speed)

#### e) Security Summary

- Aggregates all job results
- Creates a summary report in GitHub Actions UI
- Links to detailed artifacts

## 📊 How to View Results

### Dependabot Alerts

1. Go to repository → **Security** tab → **Dependabot alerts**
2. View all open vulnerability alerts
3. Click alert to see details and available fixes

### Security Audit Results

1. Go to repository → **Actions** tab
2. Click on latest "Security Audit" workflow run
3. View job status for each security check
4. Download audit report artifacts for details

### CodeQL Results

1. Go to repository → **Security** tab → **Code scanning**
2. View all CodeQL alerts
3. Filter by severity, language, or rule

### Dependabot PRs

1. Go to repository → **Pull requests** tab
2. Filter by label: `dependencies` or `security`
3. Review and merge PRs

## 🚀 Local Security Scanning

Run security checks locally before pushing:

### npm audit (Backend)

```bash
cd packages/api-nest
npm audit
npm audit --audit-level=high  # Only show high/critical
npm audit fix                   # Auto-fix vulnerabilities
```

### npm audit (Frontend)

```bash
cd packages/omnivore-polish
npm audit
npm audit fix
```

### Check all packages

```bash
# From project root
cd packages/api-nest && npm audit && cd ../..
cd packages/omnivore-polish && npm audit && cd ../..
```

### Manual vulnerability check

```bash
# Check specific package for vulnerabilities
npm view <package-name> vulnerabilities

# Check outdated packages
npm outdated
```

## 🔧 Configuration

### Dependabot Settings

**Adjust scan frequency:**
Edit `.github/dependabot.yml` → change `interval`:

```yaml
schedule:
  interval: 'daily' # or "weekly", "monthly"
```

**Add more packages:**

```yaml
- package-ecosystem: 'npm'
  directory: '/packages/your-new-package'
  schedule:
    interval: 'weekly'
  labels:
    - 'dependencies'
    - 'your-package'
```

**Change PR limits:**

```yaml
open-pull-requests-limit: 20 # Increase if you want more PRs
```

### Security Audit Workflow Settings

**Change scan schedule:**
Edit `.github/workflows/security-audit.yml`:

```yaml
schedule:
  - cron: '0 0 * * *' # Daily at midnight UTC
```

**Adjust fail threshold:**

```yaml
# Change this line to be more/less strict
npm audit --audit-level=moderate # or "low", "high", "critical"
```

**Disable specific jobs:**
Comment out jobs you don't want:

```yaml
# docker-security-scan:
#   name: Docker Image Security Scan
#   ...
```

## 📈 Best Practices

### For Dependabot PRs

1. **Review carefully** - Don't auto-merge without testing
2. **Run tests** - Ensure updates don't break functionality
3. **Group related updates** - Merge NestJS updates together
4. **Security first** - Prioritize security updates over feature updates
5. **Check changelogs** - Understand what changed in major version bumps

### For Security Alerts

1. **Act quickly** - Fix high/critical vulnerabilities ASAP
2. **Test fixes** - Verify the fix doesn't break your code
3. **Document decisions** - If you can't fix, document why
4. **Monitor false positives** - Some alerts may not apply to your usage

### For CI/CD

1. **Don't ignore failures** - Investigate and fix failing security checks
2. **Keep Node.js updated** - Update base Docker image regularly
3. **Review artifacts** - Check uploaded audit reports for trends
4. **Enable branch protection** - Require security checks to pass before merge

## 🚨 Incident Response

### When Security Check Fails

1. **Identify the vulnerability:**

   - Check GitHub Security tab for details
   - Review npm audit output in workflow logs
   - Search vulnerability database (e.g., CVE, GitHub Advisory)

2. **Assess impact:**

   - Does it affect production code or just dev dependencies?
   - Is the vulnerable code path used in your application?
   - What's the severity (low, moderate, high, critical)?

3. **Fix options:**

   - **Option 1:** Update the package (`npm update <package>`)
   - **Option 2:** Use `npm audit fix` for automatic fixes
   - **Option 3:** Find alternative package if no fix available
   - **Option 4:** Accept risk and document (not recommended for high/critical)

4. **Test and deploy:**
   - Run full test suite
   - Test affected functionality manually
   - Deploy fix to production ASAP for critical issues

### Example: Fixing a Critical Vulnerability

```bash
# 1. Check the vulnerability
cd packages/api-nest
npm audit

# 2. Try automatic fix
npm audit fix

# 3. If auto-fix doesn't work, update manually
npm update vulnerable-package@latest

# 4. If no fix available, find alternative
npm uninstall vulnerable-package
npm install safer-alternative-package

# 5. Run tests
npm test

# 6. Commit and push
git add package.json package-lock.json
git commit -m "fix: update vulnerable-package to address CVE-XXXX-XXXX"
git push
```

## 🎯 Current Status

### ✅ Enabled

- ✅ Dependabot for npm packages (root, api-nest, omnivore-polish)
- ✅ Dependabot for Docker images
- ✅ Dependabot for GitHub Actions
- ✅ npm audit in CI/CD pipeline
- ✅ Dependency Review for pull requests
- ✅ CodeQL security analysis
- ✅ Docker image scanning with Trivy
- ✅ Weekly automated scans
- ✅ Security summary reports

### 🔜 Future Enhancements

- [ ] Snyk integration (more detailed vulnerability database)
- [ ] SAST (Static Application Security Testing) tools
- [ ] Secret scanning for API keys in code
- [ ] License compliance checking
- [ ] Supply chain security (SLSA, Sigstore)
- [ ] Container image signing
- [ ] Security policy file (SECURITY.md)

## 📚 Additional Resources

- [GitHub Dependabot Documentation](https://docs.github.com/en/code-security/dependabot)
- [npm audit Documentation](https://docs.npmjs.com/cli/v10/commands/npm-audit)
- [GitHub CodeQL](https://codeql.github.com/)
- [Trivy Scanner](https://github.com/aquasecurity/trivy)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [CVE Database](https://cve.mitre.org/)

## 🆘 Support

For security concerns:

- Open a GitHub issue with label `security`
- Contact team via security@lepq.io (if set up)
- Use GitHub Security Advisory for responsible disclosure

---

**Last Updated:** 2025-12-30
**Maintainer:** Omnivore Security Team
