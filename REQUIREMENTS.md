# Jungle Gaming Frontend Challenge - Requirements & Acceptance Checklist

## Challenge Overview

**Official Challenge**: https://github.com/junglegaming/frontend-challenge  
**Figma Design**: https://www.figma.com/design/CeU18pBkD6qZT9nJvCm4qn/Frontend-Challenge--Copy-?node-id=0-1&m=dev  
**Current Deployment**: https://jungle-frontend-challenge-ten.vercel.app/  
**Repository**: https://github.com/lcsbgs-verso/jungle-frontend-challenge

## Assessment Restrictions & Rules

- **No external submissions or contact** with Jungle Gaming
- **No production deployment changes** (no main branch push, no merge without approval)
- **Preserve existing work** on main branch
- **Use separate feature branch** for implementation
- **Vercel PR preview deployments** are acceptable via existing integration
- **No production env/settings changes**
- **Assessment rules must be respected** - report any conflicts rather than silently ignoring

## Mandatory Technology Stack

| Responsibility | Technology | Status |
|---------------|------------|--------|
| Interface | React 19.3 | ✅ Configured |
| Language | TypeScript 6.0 | ✅ Configured |
| Routing | TanStack Router 1.170 | ✅ Configured |
| Remote State | TanStack Query 5.107 | ✅ Configured |
| HTTP Client | Axios 1.21 | ✅ Configured |
| Data Integration | REST APIs | ✅ Configured |
| Real-time | Socket.IO 4.8 | ✅ Configured |
| Styling | Tailwind CSS 4.3 | ✅ Configured |
| Components | shadcn/ui | ✅ Configured |
| Mocking | MSW 2.15 | ✅ Configured |
| E2E & Visual Tests | Playwright 1.65 | ✅ Configured |
| Performance Audit | Lighthouse 13.6 | ✅ Configured |

## Screens & Required Flows

### ✅ = Implemented, 🔄 = Partial, ❌ = Not Started, 🔍 = Needs Verification

| Screen | Required Features | Desktop | Mobile | Status |
|--------|------------------|---------|--------|--------|
| **Home/Catalog** | Highlights, catalog, search, filters, sort, pagination, navigation to NFT | 🔍 | 🔍 | 🔄 |
| **NFT Detail** | Gallery, info, edition, quantity, favorites, purchase | 🔍 | 🔍 | 🔄 |
| **Cart** | Edit quantities, remove, coupon, value summary | 🔍 | 🔍 | 🔄 |
| **Checkout** | Collector data, wallet/network selection, review, order submission | 🔍 | 🔍 | 🔄 |
| **Order Confirmation** | Result, transaction ID, items, fees, total | 🔍 | 🔍 | 🔄 |
| **Login** | Authentication, validation, return to previous flow | 🔍 | 🔍 | 🔄 |
| **Register** | Account creation, validation, conflict handling | 🔍 | 🔍 | 🔄 |
| **Profile** | Edit data, avatar, password change | 🔍 | 🔍 | 🔄 |
| **Wallets** | Register/edit primary and secondary wallets | 🔍 | 🔍 | 🔄 |

### Out of Scope
- Editorial pages, support, activity, offers, downloads
- Real blockchain integration, wallet extensions, payment gateways
- External links should have coherent behavior; out-of-scope actions should not simulate functional success

## Acceptance Criteria Checklist

### 1. Visual Fidelity & Responsive Design (20 points)

#### Design Fidelity
- [ ] Typography matches Figma exactly (fonts, sizes, weights, line-heights)
- [ ] Colors match Figma exactly (backgrounds, text, borders, states)
- [ ] Spacing matches Figma exactly (padding, margins, gaps)
- [ ] Layout composition matches Figma (component hierarchy, alignment)
- [ ] Images and assets match Figma (proportions, quality)
- [ ] Component states match Figma (hover, active, disabled, focus)
- [ ] shadcn/ui components adapted to project visual identity

#### Responsive Behavior
- [ ] 390px (mobile) - all flows functional and visually correct
- [ ] 768px (tablet) - all flows functional and visually correct
- [ ] 1440px (desktop) - all flows functional and visually correct
- [ ] Intermediate widths behave correctly (no breaks between breakpoints)
- [ ] Filters, navigation, forms, cart, checkout work on all sizes
- [ ] Profile and wallets functional on mobile (even without specific Figma frame)
- [ ] Order confirmation functional on mobile

### 2. Flows & User Experience (20 points)

#### Catalog & Detail
- [ ] Search functionality works and updates URL
- [ ] Filters are combinable and update URL
- [ ] Sorting works and updates URL
- [ ] Pagination works and updates URL
- [ ] Filter changes reset pagination
- [ ] URL state survives refresh and browser back/forward
- [ ] API queries reflect URL parameters
- [ ] Empty results handled gracefully
- [ ] API failures handled with proper UI feedback
- [ ] Out-of-order responses handled correctly
- [ ] Direct access to NFT detail works
- [ ] Non-existent NFT handled gracefully
- [ ] Edition unavailable handled
- [ ] Quantity limits enforced
- [ ] Favorites persist for authenticated users

#### Cart
- [ ] Add items to cart with available quantity limits
- [ ] Edit item quantities respecting NFT and edition availability
- [ ] Remove items from cart
- [ ] Cart persists after refresh
- [ ] Visitor cart items preserved when logging in
- [ ] Apply coupon with validation
- [ ] Remove coupon
- [ ] Invalid/expired coupon handled with proper feedback
- [ ] Subtotal calculation correct
- [ ] Discount calculation correct (when coupon applied)
- [ ] Network fee calculation correct
- [ ] Total calculation correct
- [ ] ETH values maintain precision (string decimals)
- [ ] Price/availability changes reflected in real-time when cart is open

#### Checkout & Confirmation
- [ ] Form validation for all checkout fields
- [ ] Review step before submission
- [ ] Registered wallets available for selection
- [ ] Network selection functional
- [ ] Wallet connection simulated
- [ ] Wallet rejection simulated
- [ ] Wallet disconnection handled
- [ ] Price revalidation before order submission
- [ ] Availability revalidation before order submission
- [ ] Coupon revalidation before order submission
- [ ] Fee revalidation before order submission
- [ ] Changes require new user confirmation
- [ ] Duplicate orders prevented (repeated clicks)
- [ ] Duplicate orders prevented (resubmit after timeout)
- [ ] Pending order state represented
- [ ] Confirmed order state represented
- [ ] Rejected order state represented
- [ ] Order recovery after refresh works
- [ ] Order recovery after reconnection works
- [ ] Confirmation shown only for actually confirmed orders
- [ ] Items preserved on failure
- [ ] Successfully purchased items removed from cart
- [ ] Receipt reflects order snapshot (not affected by later catalog changes)
- [ ] Transaction reference and explorer links simulated

#### Account & Session
- [ ] Register with validation
- [ ] Register conflict handling (existing email)
- [ ] Login with validation
- [ ] Logout clears private data from cache
- [ ] Logout clears Socket.IO subscriptions
- [ ] Session recovery after refresh
- [ ] Session expiration during navigation handled
- [ ] Session expiration during checkout handled with context preservation
- [ ] User switch clears previous user's private data
- [ ] Checkout requires authentication
- [ ] Profile requires authentication
- [ ] Wallets require authentication
- [ ] Favorites require authentication
- [ ] Orders require authentication
- [ ] Profile form validation (frontend and API errors)
- [ ] Profile changes persist after refresh
- [ ] Password validation (frontend and API errors)
- [ ] Wallet form validation (frontend and API errors)
- [ ] Wallet changes persist after refresh
- [ ] No plaintext passwords stored

### 3. Integration & State (15 points)

#### TanStack Router
- [ ] All routes use TanStack Router
- [ ] Search params integrated with TanStack Router
- [ ] Private route protection implemented
- [ ] Direct access to any route works
- [ ] Non-existent routes show 404
- [ ] Route guards prevent unauthorized access

#### TanStack Query
- [ ] All API queries use TanStack Query
- [ ] All mutations use TanStack Query
- [ ] Cache synchronization works correctly
- [ ] Loading states displayed
- [ ] Empty states displayed
- [ ] Error states displayed
- [ ] Success states displayed
- [ ] Background refetch states displayed
- [ ] Invalidation after mutations works
- [ ] Invalidation after Socket.IO events works
- [ ] Obsolete responses canceled or discarded
- [ ] Data isolated by user
- [ ] Data isolated by query parameters
- [ ] Failure recovery without duplicate operations
- [ ] Optimistic update implemented (at least one interaction)
- [ ] Rollback on optimistic update failure

#### Type Contracts
- [ ] Type contracts between transport and state
- [ ] Type contracts between state and UI
- [ ] No `any` types (except where absolutely necessary with justification)
- [ ] API response types defined
- [ ] API request types defined

#### Axios
- [ ] All HTTP calls go through Axios
- [ ] Request interceptors configured (if needed)
- [ ] Response interceptors configured (if needed)
- [ ] Error handling standardized

### 4. Real-time with Socket.IO (10 points)

#### Event Handling
- [ ] `nft.updated` event updates price in catalog
- [ ] `nft.updated` event updates availability in catalog
- [ ] `nft.updated` event updates price in detail
- [ ] `nft.updated` event updates availability in detail
- [ ] `nft.updated` event updates price in cart
- [ ] `nft.updated` event updates availability in cart
- [ ] `order.updated` event updates order state
- [ ] `order.updated` event shows confirmation when order confirmed
- [ ] `order.updated` event shows rejection when order rejected

#### Event Quality
- [ ] Events have stable identity
- [ ] Events have affected resource
- [ ] Events have version
- [ ] Client tolerates duplicate events
- [ ] Client tolerates old events (doesn't regress to older state)
- [ ] Client doesn't reapply effects on duplicate events
- [ ] Reconciliation with REST API after reconnection
- [ ] Events from previous session don't update different user's data
- [ ] Listeners released when component unmounts
- [ ] Subscriptions released when component unmounts

#### Critical Scenarios
- [ ] NFT in cart, price changes during navigation, UI notifies and updates summary
- [ ] NFT in cart, availability changes during navigation, UI notifies and updates summary
- [ ] Checkout prevented with outdated quote
- [ ] Connection interrupted while order pending
- [ ] After reconnect/reload, order state recovered without creating duplicate order
- [ ] Confirmed orders are terminal (don't change after confirmation)
- [ ] Rejected orders are terminal (don't change after rejection)

### 5. Mocking with MSW (10 points)

#### Mock Infrastructure
- [ ] All mocks implemented in network layer (not in components/hooks)
- [ ] Mocks share same contracts as real API would
- [ ] Mock state consistent across catalog, favorites, cart, profile, wallets, orders
- [ ] Local persistence allowed for refresh support
- [ ] Reset restores known initial state completely
- [ ] MSW handlers active in development
- [ ] MSW handlers active in production build (for demo)
- [ ] Mock scenarios configurable
- [ ] Mock scenarios reproducible

#### Test Fixtures
- [ ] Sufficient variety to test filters
- [ ] Sufficient variety to test pagination
- [ ] At least 2 test users
- [ ] Demo credentials documented in README

#### Deterministic Scenarios
- [ ] Success scenarios
- [ ] Empty result scenarios
- [ ] Variable latency scenarios
- [ ] Out-of-order response scenarios
- [ ] Connection failure scenarios
- [ ] HTTP 4xx error scenarios
- [ ] HTTP 5xx error scenarios
- [ ] Expired session scenarios
- [ ] Unauthorized access scenarios
- [ ] Registration conflict scenarios
- [ ] Form validation error scenarios
- [ ] Invalid coupon scenarios
- [ ] Expired coupon scenarios
- [ ] Price changed during checkout scenarios
- [ ] Edition sold out during checkout scenarios
- [ ] Timeout after order creation with idempotent recovery scenarios
- [ ] Payment confirmed scenarios
- [ ] Payment rejected scenarios

#### Socket.IO Integration
- [ ] Socket.IO events mocked with MSW-compatible solution
- [ ] Socket.IO binding uses `@mswjs/socket.io-binding` or compatible
- [ ] Uses `socket.io-client` (not direct cache setters)
- [ ] Socket.IO mock transport documented
- [ ] Socket.IO mock limitations documented
- [ ] Changes in mock data reflected in both REST and Socket.IO events

### 6. Testing with Playwright (10 points)

#### E2E Test Coverage
- [ ] 1. Search, combined filters, sort, pagination, history restoration
- [ ] 2. Direct access to detail, non-existent NFT handling
- [ ] 3. Register, login, session expiration, logout, user switch
- [ ] 4. Favorites with mutation failure and state recovery
- [ ] 5. Cart quantities, removal, coupon, persistence after refresh/login
- [ ] 6. Complete purchase from catalog to confirmed receipt
- [ ] 7. Payment failure, repeated clicks, timeout with same order recovery
- [ ] 8. Profile edit, avatar, password, wallets with validation errors
- [ ] 9. Price/availability change via Socket.IO during checkout
- [ ] 10. Duplicate/old events, disconnection, pending order recovery
- [ ] 11. Keyboard navigation, dialog focus, form validation
- [ ] 12. Skeletons during slow load, failure feedback, retry recovery

#### Test Quality
- [ ] Tests run in Chromium
- [ ] Tests run in desktop viewport
- [ ] Tests run in mobile viewport
- [ ] Each test starts from isolated state
- [ ] Clock controlled in time-sensitive tests
- [ ] Latency controlled in time-sensitive tests
- [ ] Event timing controlled in time-sensitive tests
- [ ] Tests observe UI (not just internal state)
- [ ] Tests observe operation results
- [ ] Real-time tests use Socket.IO client (not mock shortcuts)
- [ ] REST tests use MSW handlers (not mock shortcuts)
- [ ] HTML report generated
- [ ] Failure traces captured

#### Visual Regression
- [ ] Homepage baseline captured
- [ ] NFT detail baseline captured
- [ ] Cart baseline captured
- [ ] Checkout baseline captured
- [ ] Baselines versioned in repo
- [ ] Stable test data for consistent screenshots

### 7. Accessibility (5 points)

#### Keyboard Navigation
- [ ] All interactive elements reachable by keyboard
- [ ] Tab order is logical
- [ ] Focus visible on all interactive elements
- [ ] Dialogs trap focus appropriately
- [ ] Drawers trap focus appropriately
- [ ] ESC closes dialogs
- [ ] ESC closes drawers
- [ ] ENTER activates buttons/links
- [ ] SPACE activates buttons

#### Semantic HTML & ARIA
- [ ] Proper heading hierarchy
- [ ] Form fields have associated labels
- [ ] Error messages associated with fields
- [ ] Alternative text for meaningful images
- [ ] Decorative images have empty alt or aria-hidden
- [ ] Landmark regions used appropriately
- [ ] ARIA labels for icon-only buttons
- [ ] ARIA live regions for dynamic updates (mutations, real-time events)

#### Visual Accessibility
- [ ] Text contrast meets WCAG AA minimum (4.5:1 for normal text)
- [ ] Interactive element states not dependent on color alone
- [ ] Focus indicators have sufficient contrast
- [ ] No horizontal overflow at any viewport size
- [ ] Content accessible with 200% zoom (no loss of information)
- [ ] Respects `prefers-reduced-motion` (no shimmer if user prefers reduced motion)

### 8. Performance & Lighthouse (5 points)

#### Lighthouse Targets
- [ ] Performance ≥ 90 (mobile)
- [ ] Accessibility ≥ 95 (mobile)
- [ ] Best Practices ≥ 95 (mobile)
- [ ] SEO ≥ 90 (mobile)
- [ ] Performance ≥ 90 (desktop)
- [ ] Accessibility ≥ 95 (desktop)
- [ ] Best Practices ≥ 95 (desktop)
- [ ] SEO ≥ 90 (desktop)

#### Audit Process
- [ ] Homepage audited
- [ ] NFT detail audited
- [ ] Optimized production build used
- [ ] Default mock scenario used
- [ ] 3 measurements per page/profile (median reported)
- [ ] LCP recorded
- [ ] CLS recorded
- [ ] TBT recorded
- [ ] Audit configuration versioned
- [ ] HTML reports saved
- [ ] JSON reports saved
- [ ] Tool versions documented
- [ ] Environment documented
- [ ] Execution conditions documented
- [ ] Results below targets justified
- [ ] Root causes identified for below-target results
- [ ] Real images/fonts/features used (no audit-only simplifications)

### 9. Architecture & Documentation (5 points)

#### Code Quality
- [ ] Clear separation of concerns
- [ ] Consistent file/folder structure
- [ ] No duplicate business logic
- [ ] Reusable components where appropriate
- [ ] Custom hooks for shared logic
- [ ] Type safety maintained throughout
- [ ] ESLint passes
- [ ] TypeScript type check passes

#### Documentation
- [ ] README.md with setup instructions
- [ ] README.md with environment variables
- [ ] README.md with demo credentials
- [ ] README.md with scenario selection instructions
- [ ] README.md with scenario reset instructions
- [ ] README.md with development commands
- [ ] README.md with build commands
- [ ] README.md with test commands
- [ ] README.md with audit commands
- [ ] README.md with failure scenario reproduction steps
- [ ] REST API contracts documented
- [ ] Socket.IO events documented
- [ ] Session policy documented
- [ ] Cart state strategy documented
- [ ] Cache strategy documented
- [ ] REST/Socket.IO reconciliation documented
- [ ] ARCHITECTURE.md with limitations
- [ ] ARCHITECTURE.md with UX decisions
- [ ] ARCHITECTURE.md with Figma deviations (if any)

## Elimination Criteria (Must NOT Occur)

- [ ] **PASS**: Mandatory stack technologies are actually used (not just installed)
- [ ] **PASS**: Main flows are functional (not just visual mockups)
- [ ] **PASS**: Confirmed purchase requires actual mock response (not fake UI state)
- [ ] **PASS**: No data exposure between users
- [ ] **PASS**: Socket.IO events use real socket.io-client (not direct UI simulation)
- [ ] **PASS**: Executable E2E tests exist and run

## Evaluation Scoring Summary

| Criterion | Points | Status |
|-----------|--------|--------|
| Visual fidelity & responsive | 20 | 🔍 |
| Flows & UX | 20 | 🔍 |
| Integration & state | 15 | 🔍 |
| Real-time | 10 | 🔍 |
| Mocking | 10 | 🔍 |
| Tests | 10 | 🔍 |
| Accessibility | 5 | 🔍 |
| Performance | 5 | 🔍 |
| Architecture & docs | 5 | 🔍 |
| **TOTAL** | **100** | 🔍 |

## Implementation Status

### Current State (as of initial inspection)
- ✅ Repository structure exists
- ✅ All mandatory technologies configured
- ✅ Basic routing structure in place
- ✅ MSW mocking infrastructure exists
- ✅ Socket.IO integration exists
- ✅ 2 smoke tests exist (purchase flow, real-time price update)
- ✅ Demo accounts exist (alice@kurio.test, bruno@kurio.test)
- ⚠️ Only 1 commit on main branch
- ⚠️ Limited test coverage (2 tests vs 12 required scenarios)
- ⚠️ No ARCHITECTURE.md yet
- ⚠️ Visual fidelity not yet verified against Figma
- ⚠️ Lighthouse audits not yet run
- ⚠️ Full E2E test suite incomplete

### Next Steps
1. ⏳ **AWAITING**: Figma screenshots, node IDs, assets, and design metadata from Lucas
2. Extract design tokens (colors, typography, spacing) from Figma
3. Compare existing implementation against Figma designs
4. Identify gaps and deviations
5. Implement missing features and fix deviations
6. Complete E2E test suite (currently 2/12+ scenarios)
7. Run Lighthouse audits
8. Create ARCHITECTURE.md
9. Update README.md with complete documentation
10. Generate screenshots and artifacts for final report

## Notes
- User explicitly stated they will forward exact Figma screenshots, node IDs, assets, and design metadata
- Implementation should NOT proceed with visual guesses if design access is missing
- Need faithful layout, exact typography/assets/colors/spacing/states
- Must test at Figma design dimensions plus mobile/intermediate widths
- Must compare screenshots to Figma and iterate
- Must consult current official docs for important decisions
- Independent audit by Jarvis will follow (don't claim audit approval)
