# Security Vulnerabilities Found (2025-12-30)

npm audit detected **12 vulnerabilities** in the api-nest package.

## Summary

- **High severity:** 6 vulnerabilities
- **Moderate severity:** 2 vulnerabilities
- **Low severity:** 4 vulnerabilities

## Critical Issues to Fix

### 1. TypeORM SQL Injection (HIGH)

**Package:** `typeorm <0.3.26`
**Vulnerability:** SQL injection via crafted request to repository.save or repository.update
**Advisory:** https://github.com/advisories/GHSA-q2pj-6v73-8rgj
**Fix:** `npm update typeorm` (currently using 0.3.17, need 0.3.26+)

### 2. Axios DoS Attack (HIGH)

**Package:** `axios 1.0.0 - 1.11.0`
**Vulnerability:** DoS attack through lack of data size check
**Advisory:** https://github.com/advisories/GHSA-4hjh-wcwx-xvwj
**Fix:** `npm audit fix` (auto-fixable)

### 3. Validator URL Bypass (HIGH)

**Package:** `validator <=13.15.20`
**Vulnerability:** URL validation bypass in isURL function
**Advisory:**

- https://github.com/advisories/GHSA-9965-vmph-33xx
- https://github.com/advisories/GHSA-vghf-hv5q-vc2g
  **Fix:** `npm update validator`

### 4. jws HMAC Signature Verification (HIGH)

**Package:** `jws =4.0.0 || <3.2.3`
**Vulnerability:** Improperly verifies HMAC signatures
**Advisory:** https://github.com/advisories/GHSA-869p-cjfg-cm3x
**Fix:** `npm audit fix` (auto-fixable)

### 5. glob Command Injection (HIGH)

**Package:** `glob 10.2.0 - 10.4.5`
**Vulnerability:** CLI command injection via -c/--cmd
**Advisory:** https://github.com/advisories/GHSA-5j98-mcp5-4vw2
**Fix:** `npm audit fix` (auto-fixable)
**Note:** This affects dev dependency @nestjs/cli

### 6. js-yaml Prototype Pollution (MODERATE)

**Package:** `js-yaml <3.14.2 || >=4.0.0 <4.1.1`
**Vulnerability:** Prototype pollution in merge (<<)
**Advisory:** https://github.com/advisories/GHSA-mh29-5h37-fv8m
**Fix:** `npm audit fix --force` (breaking change - updates @nestjs/swagger)
**Note:** This affects @nestjs/swagger dependency

## Fix Instructions

### Quick Fix (Non-Breaking Changes)

```bash
cd packages/api-nest
npm audit fix
```

This will fix:

- axios
- jws
- glob
- tmp
- validator (if compatible version exists)

### Manual Fixes Required

#### TypeORM Update

```bash
npm update typeorm
# Or specify version explicitly
npm install typeorm@latest
```

**Testing required:** TypeORM updates can affect database queries. Test:

- All repository operations
- Database migrations
- Query builder usage

#### @nestjs/swagger Update (Breaking)

```bash
npm audit fix --force
# This will update @nestjs/swagger to 11.2.3+
```

**Testing required:** Check if API documentation still works:

- `/api` endpoint (Swagger UI)
- DTO decorators (@ApiProperty, etc.)

## Impact Assessment

### Production Impact

- **TypeORM SQL Injection:** HIGH - Could allow unauthorized data access
- **Axios DoS:** MEDIUM - Could affect external API calls
- **Validator bypass:** MEDIUM - Depends on how validation is used
- **jws HMAC:** HIGH - Affects JWT authentication (critical!)

### Dev-Only Impact

- **glob command injection:** LOW - Only affects CLI tools during development
- **tmp file write:** LOW - Only affects development tooling
- **js-yaml:** LOW - Used by config/documentation generation

## Recommended Action Plan

1. **Immediate (Today)**

   - Run `npm audit fix` to auto-fix non-breaking issues
   - Update TypeORM manually (test thoroughly)
   - Update jws (affects JWT - critical for auth)

2. **This Week**

   - Update @nestjs/swagger (breaking change - needs testing)
   - Update validator library
   - Run full test suite after all updates

3. **Ongoing**
   - Enable Dependabot (see SECURITY_SCANNING_SETUP.md)
   - Monitor GitHub Security alerts
   - Run weekly npm audit

## Test Checklist After Fixes

- [ ] Unit tests pass
- [ ] E2E tests pass
- [ ] API documentation loads (`/api` endpoint)
- [ ] User authentication works (JWT)
- [ ] Database queries work correctly
- [ ] Password reset flow works
- [ ] Email verification works
- [ ] External API calls work (Postmark, etc.)

## Notes

- Node version mismatch: Package requires Node 25.2.1, system has 25.1.0 (minor issue, not blocking)
- Some dependencies are dev-only and have lower priority
- Focus on production dependencies first (TypeORM, axios, validator, jws)

## References

- npm audit: https://docs.npmjs.com/cli/v10/commands/npm-audit
- GitHub Advisory Database: https://github.com/advisories
- OWASP Top 10: https://owasp.org/www-project-top-ten/
