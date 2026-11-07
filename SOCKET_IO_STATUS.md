# Socket.IO WebSocket Investigation Status

## Issue
Socket.IO WebSocket connections fail with "Unexpected response code: 200" despite MSW worker running.

## Progress Made
1. ✅ Confirmed MSW worker starts successfully
2. ✅ Verified native WebSocket interception CAN work (test-ws path)
3. ✅ Implemented Socket.IO lazy import per MSW issue #2525
4. ✅ Corrected ws.link pattern (origin without path per discussion #2470)
5. ✅ Fixed all lint and build errors
6. ❌ ws.link handler still NOT being triggered for Socket.IO connections

## Root Cause
Handler registered but NOT matching Socket.IO WebSocket connections. Logs show:
- MSW worker starts
- Socket.IO lazy import works
- But `[MSW WS Handler] Connection to:` never appears
- Connections bypass MSW, hit real Vite server → HTTP 200

## Next Steps
1. Verify MSW/binding version compatibility (user mentioned binding incompatible with msw 2.8.5+)
2. Check if ws.link needs different matcher for Socket.IO query params
3. Consider alternative: mock Socket.IO via HTTP polling transport instead of WebSocket
4. Test with MSW dev server instead of vite preview

## API Contract (Jarvis Confirmed)
- POST /api/orders with Idempotency-Key header
- No key → 422 MISSING_KEY
- No session → 401  
- Fingerprint: quoteId + walletId + network + collector
- Same key + same payload → same order
- Same key + different payload → 409 IDEMPOTENCY_CONFLICT
