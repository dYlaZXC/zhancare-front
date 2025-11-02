# Telegram Auth Page - Behavior Guide

## ✅ Complete Flow (Same as Auth Popup!)

### 📋 Login Flow

```
User Opens /telegram-auth
         ↓
Clicks "Login" Tab
         ↓
Enters Email & Password
         ↓
Clicks "Login" Button
         ↓
✅ Success!
         ↓
Shows Success Message
         ↓
Haptic Feedback (vibration)
         ↓
Redirects in 1 second:
- If Doctor → /doctor-profile
- If Patient → /profile
```

### 📋 Register Flow

```
User Opens /telegram-auth
         ↓
Clicks "Register" Tab
         ↓
Enters Details:
- First Name
- Last Name
- Email
- Phone
- Password
- Confirm Password
         ↓
Clicks "Register" Button
         ↓
✅ Success!
         ↓
Shows Success Message
         ↓
Haptic Feedback (vibration)
         ↓
Switches to "Login" Tab
         ↓
User can now log in
         ↓
After Login → Redirects to profile
```

### 📋 Forgot Password Flow

```
On Login Tab
         ↓
Clicks "Forgot Password?"
         ↓
Shows Forgot Password Form
         ↓
Enters Email
         ↓
Sends Reset Code
         ↓
Enters Code
         ↓
Sets New Password
         ↓
Clicks "Back to Login"
         ↓
Returns to Login Tab
```

## 🎯 Redirect Logic (Exactly Like Popup!)

### Code

```tsx
// After successful login
const redirectUrl = responseData.user.role === "doctor"
  ? "/doctor-profile"
  : "/profile";

setTimeout(() => {
  window.location.href = redirectUrl;
}, 1000);
```

### Behavior

| User Role | Redirects To |
|-----------|--------------|
| `doctor` | `/doctor-profile` |
| `patient` | `/profile` |
| `admin` | `/profile` |

## 🔄 Comparison: Popup vs Telegram Auth

| Feature | Auth Popup | Telegram Auth | Status |
|---------|-----------|---------------|--------|
| Login form | ✅ | ✅ | Same |
| Register form | ✅ | ✅ | Same |
| Forgot password | ✅ | ✅ | Same |
| Role-based redirect | ✅ | ✅ | **Same!** ✅ |
| Success message | ✅ | ✅ | Same |
| Error handling | ✅ | ✅ | Same |
| Multi-language | ✅ | ✅ | Same |
| Animations | ✅ | ✅ | Same |
| Design | ✅ | ✅ | Same |
| Close button (X) | ✅ | ❌ | N/A (full page) |
| Telegram data | ❌ | ✅ | **NEW!** |
| Haptic feedback | ❌ | ✅ | **NEW!** |

## 📱 User Experience

### Login Success

```
1. User clicks "Login"
   → Button shows loading spinner

2. Request sent to Django
   → Shows "Logging in..."

3. Success! ✅
   → Toast: "Вы успешно вошли в систему"
   → Phone vibrates (haptic)
   → Shows loading for 1 second

4. Redirects to:
   → Doctor: /doctor-profile
   → Patient: /profile
```

### Login Error

```
1. User clicks "Login"
   → Button shows loading spinner

2. Request sent to Django
   → Error returned

3. Error! ❌
   → Toast: "Неправильный E-mail или пароль"
   → Phone vibrates (error haptic)
   → User stays on login page
   → Can try again
```

### Register Success

```
1. User fills registration form

2. Clicks "Register"
   → Button shows loading spinner

3. Success! ✅
   → Toast: "Регистрация прошла успешно"
   → Phone vibrates (haptic)
   → Switches to "Login" tab

4. User enters credentials
   → Logs in
   → Redirects to profile
```

## 🔐 Data Flow

### What's Sent to Django

#### Login Request
```json
{
  "email": "user@example.com",
  "password": "password123",
  "telegram_data": "query_id=AAH...",
  "telegram_user": {
    "id": 123456789,
    "first_name": "John",
    "last_name": "Doe",
    "username": "johndoe"
  }
}
```

#### Register Request
```json
{
  "email": "user@example.com",
  "password": "password123",
  "first_name": "John",
  "last_name": "Doe",
  "phone": "+77001234567",
  "telegram_data": "query_id=AAH...",
  "telegram_user": {
    "id": 123456789,
    "first_name": "John",
    "username": "johndoe"
  }
}
```

### What Django Returns

#### Successful Login
```json
{
  "access_token": "abc123...",
  "refresh_token": "xyz789...",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "role": "patient",  // or "doctor"
    "phone": "+77001234567"
  }
}
```

## 🎨 Visual Flow

```
┌────────────────────────────────┐
│    Telegram Auth Page          │
│  /telegram-auth                │
└──────────┬─────────────────────┘
           │
    ┌──────┴──────┐
    │   Login?    │
    └──────┬──────┘
           │
     ┌─────┴─────┐
     │ ✅ Success │
     └─────┬─────┘
           │
    ┌──────┴──────────┐
    │  Check Role:    │
    │  Doctor or      │
    │  Patient?       │
    └──────┬──────────┘
           │
     ┌─────┴─────────┐
     │               │
┌────▼────┐    ┌────▼────┐
│ Doctor  │    │ Patient │
│ Profile │    │ Profile │
└─────────┘    └─────────┘
```

## ✅ Checklist for Django Backend

Your Django backend should:

- [ ] Return `role` in user object
- [ ] Values: `"doctor"` or `"patient"` or `"admin"`
- [ ] Return `access_token` and `refresh_token`
- [ ] Return full `user` object
- [ ] Accept `telegram_data` (optional)
- [ ] Accept `telegram_user` (optional)

Example Django response:
```python
return Response({
    'access_token': token.key,
    'refresh_token': token.key,
    'user': {
        'id': user.id,
        'email': user.email,
        'first_name': user.first_name,
        'last_name': user.last_name,
        'role': user.role,  # IMPORTANT!
        'phone': user.phone,
    }
})
```

## 🚀 Testing Checklist

### As Patient
- [ ] Register new account
- [ ] Switch to login tab automatically
- [ ] Login with credentials
- [ ] Redirected to `/profile`
- [ ] Profile page loads correctly

### As Doctor
- [ ] Login with doctor credentials
- [ ] Redirected to `/doctor-profile`
- [ ] Doctor profile page loads

### Error Cases
- [ ] Wrong password shows error
- [ ] Invalid email shows error
- [ ] Empty fields show validation
- [ ] Network error shows message

### Telegram Features
- [ ] Haptic feedback works on mobile
- [ ] Telegram badge shows
- [ ] Telegram data sent to backend
- [ ] Works in Telegram iOS
- [ ] Works in Telegram Android

## 💡 Important Notes

1. **Redirect happens AFTER 1 second**
   - Gives user time to see success message
   - Smooth transition

2. **Role must be exact**
   - `"doctor"` → `/doctor-profile`
   - Anything else → `/profile`

3. **Tokens stored in localStorage**
   - Same as auth popup
   - Available on profile pages

4. **Registration doesn't auto-login**
   - User must login after registration
   - Same as auth popup behavior

## 🎯 Summary

Your Telegram auth page now works **EXACTLY like your auth popup**:

✅ Same design
✅ Same forms
✅ Same validation
✅ Same error messages
✅ Same success messages
✅ **Same redirect logic!**
✅ **Doctor → /doctor-profile**
✅ **Patient → /profile**

**Plus Telegram features:**
✅ Haptic feedback
✅ Telegram data collection
✅ Telegram user info

---

**Perfect! It's your auth popup as a full page with Telegram integration!** 🚀
