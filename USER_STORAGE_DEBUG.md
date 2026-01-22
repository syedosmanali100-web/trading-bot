# User Storage Test

## Quick Check

Open browser console (F12) and run:

```javascript
// Check if users exist
console.log('Users in storage:', JSON.parse(localStorage.getItem('app_users_db') || '[]'))

// Check storage size
console.log('Total storage keys:', Object.keys(localStorage).length)

// List all keys
console.log('All storage keys:', Object.keys(localStorage))
```

## Manual Backup/Restore

### Backup Users
```javascript
// Copy this output and save it
const backup = localStorage.getItem('app_users_db')
console.log('BACKUP:', backup)
```

### Restore Users
```javascript
// Paste your backup data here
const backupData = 'PASTE_YOUR_BACKUP_HERE'
localStorage.setItem('app_users_db', backupData)
console.log('Users restored!')
```

## Common Issues

1. **Users disappearing after logout**: 
   - Users are in `app_users_db` (permanent)
   - Only `admin_session` and `user_session` are cleared on logout
   - Users should persist

2. **Different browser/incognito**:
   - localStorage is per-browser and per-profile
   - Incognito mode has separate storage
   - Use same browser + profile

3. **Browser cache cleared**:
   - If you clear browser data, localStorage gets wiped
   - Always backup before clearing cache

## Test User Creation

After creating a user, check immediately:
```javascript
const users = JSON.parse(localStorage.getItem('app_users_db') || '[]')
console.table(users)
```

Users should show even after:
- Logout
- Page refresh  
- Closing and reopening browser
- Navigating to different pages

Users will NOT persist after:
- Clearing browser cache/data
- Using incognito/private mode
- Switching browsers
