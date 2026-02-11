# 🔍 Debugging Magic Link Authentication

## Issue: 401 Error When Using Magic Link

The error you're seeing suggests the magic link authentication flow is failing. Here's how to debug it:

---

## ⚠️ CRITICAL: Run Backend Migration First!

The backend needs the `magic_link_used_at` field in the database. **You MUST run this migration first:**

```bash
cd experimental_admin_back
source venv/bin/activate  # or activate your venv

# Create migration
python manage.py makemigrations consultations --name add_magic_link_used_at

# Apply migration
python manage.py migrate
```

**Without this migration, the auto-login endpoint will fail!**

---

## Debugging Steps

### 1. Check Browser Console

When you click the magic link, open browser console (F12) and look for these logs:

**Success Flow:**
```
🔐 Calling auto-login endpoint...
📥 Auto-login response: 200 {success: true, ...}
✅ Magic link authentication successful
🔑 Access token received: Yes
🔄 Refresh token received: Yes
💾 Tokens stored in sessionStorage and localStorage
👤 User: patient@example.com
🏥 Consultation: meeting_abc123
✅ Using consultation data from magic link auth
```

**Error Flow (What You're Seeing):**
```
❌ Magic link authentication failed: [error message]
⚠️ Token is expired / already used / invalid
```

### 2. Check Backend Logs

In your Django console, look for:

**Success:**
```
✅ Magic link used | consultation_id=123 | patient_id=456 | patient_email=... | ip=...
```

**Errors:**
```
⚠️ Invalid or expired magic link token: ...
⚠️ Consultation not found for magic link: ...
⚠️ Magic link reuse attempt for consultation ...
❌ Error during auto-login: ...
```

### 3. Test Auto-Login Endpoint Directly

```bash
# First, create a consultation and get the magic link from email
# Extract the token from the URL

# Test the endpoint
curl -X POST https://exp-admin.smartalmaty.kz/api/v1/consultations/auto-login/ \
  -H "Content-Type: application/json" \
  -d '{"token": "YOUR_TOKEN_HERE"}'
```

**Expected Response:**
```json
{
  "success": true,
  "access_token": "eyJ...",
  "refresh_token": "eyJ...",
  "user": {
    "id": 123,
    "email": "patient@example.com",
    ...
  },
  "consultation": {
    "id": 456,
    "meeting_id": "meeting_...",
    ...
  }
}
```

---

## Common Issues & Solutions

### Issue 1: Migration Not Run
**Error:** `OperationalError: no such column: consultations_consultation.magic_link_used_at`

**Solution:** Run the migration (see above)

### Issue 2: Token Already Used
**Error:** "This magic link has already been used"

**Solution:**
1. Create a new consultation to get a fresh magic link
2. Or reset the field: `UPDATE consultations_consultation SET magic_link_used_at = NULL WHERE id = X`

### Issue 3: Token Expired
**Error:** "Invalid or expired magic link token"

**Solution:**
1. Tokens expire after 2 hours
2. Create a new consultation to get a fresh token
3. Check server time is correct (NTP sync)

### Issue 4: CORS Error
**Error:** `Access to XMLHttpRequest blocked by CORS policy`

**Solution:** Check Django CORS settings:
```python
# settings.py
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "https://yourfrontend.com",
]
```

### Issue 5: API URL Mismatch
**Error:** `Network Error` or `404 Not Found`

**Solution:** Check frontend .env.local:
```bash
NEXT_PUBLIC_API_URL=https://exp-admin.smartalmaty.kz/api/v1
```

---

## Testing Checklist

- [ ] Backend migration run successfully
- [ ] Django server running
- [ ] Frontend server running
- [ ] Create consultation via admin panel
- [ ] Check patient receives email
- [ ] Email contains magic link with `?token=...`
- [ ] Click magic link opens frontend
- [ ] Browser console shows authentication logs
- [ ] Backend console shows magic link usage log
- [ ] Page shows video call (not error)
- [ ] Click link again shows "already used" error

---

## Debug Mode

Add this to see full request/response:

**Frontend (useMagicLinkAuth.ts):**
Already added verbose logging

**Backend (views.py auto_login):**
Already has comprehensive logging

**Check logs in:**
1. Browser console (F12)
2. Django console (terminal)
3. Network tab (F12 → Network)

---

## Quick Fix if Still Failing

If you keep getting 401 errors, try this temporary test:

1. **Create test endpoint (backend):**
```python
# In consultations/views.py
@action(detail=False, methods=["get"], url_path="test-auth", permission_classes=[AllowAny])
def test_auth(self, request):
    return Response({"message": "Auth endpoint working!"}, status=200)
```

2. **Test it:**
```bash
curl https://exp-admin.smartalmaty.kz/api/v1/consultations/test-auth/
```

Should return: `{"message": "Auth endpoint working!"}`

If this fails → CORS or API URL issue
If this works → Check auto-login endpoint specifically

---

## Contact Info for Further Help

If still having issues after checking all the above:

1. Share browser console logs (full output)
2. Share Django console logs (around the time of request)
3. Share the exact URL you're clicking
4. Share the curl command response

---

## Expected Production Flow

```
1. Patient receives email ✉️
   ↓
2. Clicks magic link 🔗
   https://yoursite.com/video-call/patient?meetingId=123&token=eyJ...
   ↓
3. Frontend: useMagicLinkAuth hook runs
   - Extracts token from URL
   - Cleans URL immediately
   - Calls POST /auto-login/
   ↓
4. Backend: Validates token
   - Checks signature ✅
   - Checks expiration ✅
   - Checks not used before ✅
   - Marks as used in DB
   - Returns JWT tokens
   ↓
5. Frontend: Stores tokens
   - sessionStorage (consultation data)
   - localStorage (tokens)
   ↓
6. Frontend: Fetches consultation
   - Uses stored consultation from magic link
   - Or fetches from API with JWT
   ↓
7. Patient joins video call 📹
```

Good luck debugging! 🐛🔍
