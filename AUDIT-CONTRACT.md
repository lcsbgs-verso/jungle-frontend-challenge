# Audit Contract - Mock Authentication & Testing Guide

**HEAD**: `ecb259c76d71f1dfc498e9cb57c3321ea995712b`  
**Date**: 2026-11-07 05:11 UTC

## Mock Session Storage

### Session Token Format
```typescript
// Mock session token stored in localStorage
key: 'session'
value: string // UUID v4 format
example: '550e8400-e29b-41d4-a716-446655440000'
```

### Cookie Format
Mock implementation uses localStorage, NOT cookies. Session persists via:
```javascript
localStorage.getItem('session')
localStorage.setItem('session', token)
localStorage.removeItem('session')
```

## HTTP Header Formation

### Authenticated Requests
```http
Authorization: Bearer <session-token>
Content-Type: application/json
```

### Idempotent Checkout
```http
POST /api/orders
Authorization: Bearer <session-token>
Idempotency-Key: <client-generated-uuid>
Content-Type: application/json
```

Example:
```http
POST /api/orders HTTP/1.1
Host: localhost:4173
Authorization: Bearer 550e8400-e29b-41d4-a716-446655440000
Idempotency-Key: 7c9e6679-7425-40de-944b-e07fc1f90ae7
Content-Type: application/json

{
  "quoteId": "quote-123",
  "collector": { "name": "Alice", "email": "alice@example.com" },
  "walletId": "wallet-eth-1"
}
```

## Authentication Endpoints

### POST /api/login
**Request**:
```json
{
  "email": "alice@example.com",
  "password": "senhaAlice123"
}
```

**Response 200**:
```json
{
  "session": "550e8400-e29b-41d4-a716-446655440000",
  "profile": {
    "name": "Alice Silva",
    "email": "alice@example.com",
    "avatar": "/avatars/alice.jpg"
  }
}
```

**Response 401** (invalid credentials):
```json
{
  "code": "INVALID_CREDENTIALS",
  "message": "E-mail ou senha incorretos."
}
```

### POST /api/register
**Request**:
```json
{
  "name": "Bob Santos",
  "email": "bob@example.com",
  "phone": "+5511987654321",
  "password": "senhaBob456"
}
```

**Response 200**:
```json
{
  "session": "660f9511-f39c-52e5-b827-557766551111",
  "profile": {
    "name": "Bob Santos",
    "email": "bob@example.com",
    "phone": "+5511987654321",
    "avatar": null
  }
}
```

### GET /api/session
**Headers**:
```
Authorization: Bearer <session-token>
```

**Response 200** (valid session):
```json
{
  "name": "Alice Silva",
  "email": "alice@example.com",
  "avatar": "/avatars/alice.jpg"
}
```

**Response 401** (expired/invalid):
```json
{
  "code": "SESSION_EXPIRED",
  "message": "Sessão expirada. Faça login novamente."
}
```

## Mock Seed Users (Pre-seeded in Database)

### User 1: Alice
```json
{
  "email": "alice@example.com",
  "password": "senhaAlice123",
  "profile": {
    "name": "Alice Silva",
    "email": "alice@example.com",
    "phone": "+5511999887766",
    "avatar": "/avatars/alice.jpg"
  }
}
```

### User 2: Bob
```json
{
  "email": "bob@example.com",
  "password": "senhaBob456",
  "profile": {
    "name": "Bob Santos",
    "email": "bob@example.com",
    "phone": "+5511987654321",
    "avatar": "/avatars/bob.jpg"
  }
}
```

### User 3: Carol (Guest → Registered)
```json
{
  "email": "carol@example.com",
  "password": "senhaCarol789",
  "profile": {
    "name": "Carol Oliveira",
    "email": "carol@example.com",
    "phone": null,
    "avatar": null
  }
}
```

## Login UI Selectors & Test IDs

### Desktop Login Modal (`/entrar`)
```typescript
// Form container
modal: '[role="dialog"]' 
form: 'form'

// Inputs
emailInput: 'input[type="email"]'
passwordInput: 'input[type="password"]'

// Actions
submitButton: 'button[type="submit"]'
forgotPasswordLink: 'a[href="/recuperar"]' // or text="Esqueceu sua senha?"
registerLink: 'a[href="/cadastro"]' // or text="Criar conta"

// Error display
errorMessage: '.error-message' // or '[role="alert"]'
```

### Desktop Register Modal (`/cadastro`)
```typescript
// Inputs
nameInput: 'input[name="name"]'
emailInput: 'input[type="email"]'
phoneInput: 'input[type="tel"]'
passwordInput: 'input[name="password"]'
confirmPasswordInput: 'input[name="confirmPassword"]'

// Actions
submitButton: 'button[type="submit"]'
loginLink: 'a[href="/entrar"]' // or text="Já tem conta? Entrar"
```

### Mobile Login (`/entrar` on mobile viewport)
Same selectors as desktop - responsive layout

### Session Indicators
```typescript
// Logged out state
loginLink: 'a[href="/entrar"]' // Header "Entrar" button
profileButton: null // Not visible

// Logged in state
profileButton: 'button:has-text("Perfil")' // or avatar button
logoutButton: 'button:has-text("Sair")'
```

## Playwright Test Examples

### Login Test
```typescript
await page.goto('/entrar')
await page.fill('input[type="email"]', 'alice@example.com')
await page.fill('input[type="password"]', 'senhaAlice123')
await page.click('button[type="submit"]')
await page.waitForURL('/')

// Verify session stored
const session = await page.evaluate(() => localStorage.getItem('session'))
expect(session).toBeTruthy()
```

### Authenticated API Call Test
```typescript
// Must use browser context, NOT Node request!
const response = await page.evaluate(async () => {
  const res = await fetch('/api/orders', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('session')}`,
      'Idempotency-Key': crypto.randomUUID()
    },
    body: JSON.stringify({
      quoteId: 'quote-123',
      collector: { name: 'Alice', email: 'alice@example.com' },
      walletId: 'wallet-eth-1'
    })
  })
  return { status: res.status, body: await res.json() }
})
```

## Common Test Auth Failures

### SESSION_EXPIRED on Browser Fetch
**Cause**: Session not set in localStorage before API call
**Fix**: Login via UI first, or manually set session:
```typescript
await page.evaluate(() => {
  localStorage.setItem('session', '550e8400-e29b-41d4-a716-446655440000')
})
```

### Login Button Timeout
**Cause**: Modal not loaded, wrong selector, or button disabled
**Debug**:
```typescript
await page.screenshot({ path: 'login-modal.png' })
const visible = await page.isVisible('button[type="submit"]')
const disabled = await page.isDisabled('button[type="submit"]')
console.log({ visible, disabled })
```

### 401 on Authenticated Route
**Cause**: 
1. Session token invalid/expired
2. Authorization header malformed
3. Using Node `request.post()` instead of browser `page.evaluate(fetch)`

**Fix**: Always test APIs via browser context:
```typescript
// ✅ CORRECT
await page.evaluate(() => fetch('/api/orders', { ... }))

// ❌ WRONG - bypasses Service Worker!
await request.post('/api/orders', { ... })
```

## Mock Database Reset

### Reset to Initial State
```http
POST /api/__demo
Content-Type: application/json

{
  "type": "reset"
}
```

This clears all orders, resets NFT prices/stock, and invalidates all sessions.

### Demo Actions
```typescript
// Trigger price change
POST /api/__demo { "type": "price", "nftId": "emerald-ape" }

// Trigger stock depletion
POST /api/__demo { "type": "stock", "nftId": "emerald-ape" }

// Simulate disconnect
POST /api/__demo { "type": "disconnect" }

// Force order completion
POST /api/__demo { "type": "finish" }
```

## Session Expiration

Sessions expire after **7 days** (mocked as immediate for expired scenario):
```typescript
// Set scenario to 'expired' to invalidate all sessions
POST /api/__demo
{ "type": "scenario", "scenario": "expired" }
```

---

**Note**: This is a MOCK contract for testing. Do NOT use in production.  
All credentials are seeded test data with hashed passwords in mock database.
