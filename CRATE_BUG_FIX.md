# Crate Duplication Bug Fix

## Problem Identified
Every time the bot restarted, users were getting crates (especially legendary crates) added back to their account, even after opening them. This affected ALL crate types: bronze, silver, gold, emerald, legendary, and tyrant.

## Root Causes
There were TWO separate issues causing this bug:

### Issue #1: stripUnnecessaryFields Bug (Fixed)
In `mongoManager.js`, the `stripUnnecessaryFields()` function deleted all numeric fields with value 0 before saving. MongoDB's `$set` operator only updates fields present in the update object, so deleted fields remained unchanged in MongoDB.

### Issue #2: In-Memory Modification Without Atomic Persistence (Primary Issue)
The crate opening logic modified counts in memory first, then relied on batched saves. This created race conditions where:
- Crate was opened (decremented in memory)
- Batched save might not execute before bot restart
- On reload, old count was restored from MongoDB

## Solution: Atomic MongoDB Operations
**Files Modified**: `mongoManager.js`, `crateSystem.js`

### Changes Made:

1. **mongoManager.js** - New function `decrementCrate(userId, crateType)`:
   - Uses MongoDB's atomic `findOneAndUpdate` with `$inc: { [crateKey]: -1 }`
   - Only decrements if count > 0 (using `$gt: 0` filter)
   - Returns the updated crate count
   - Changes are **immediately persisted** in MongoDB

2. **crateSystem.js** - Modified `openCrate()` function:
   - When USE_MONGODB is true, calls `decrementCrate()` atomically
   - **Critical**: Returns immediately if decrement fails (prevents reward exploit)
   - On success, updates only the crate count in memory
   - Proceeds with reward processing
   - Saves all rewards via `saveDataImmediate()`

3. **mongoManager.js** - Fixed `stripUnnecessaryFields()`:
   - Removed deletion of numeric counters (crates, shards, boosters, tokens, messageCount)
   - Kept cleanup for empty arrays/objects only

## How It Works Now

### Before (Broken):
```
1. Check in-memory count → has 1 crate
2. Decrement in memory → now 0
3. Add rewards
4. Schedule batched save (might not execute)
5. Bot restarts
6. Load from MongoDB → still shows 1 crate ❌
```

### After (Fixed):
```
1. Check in-memory count → has 1 crate
2. Atomically decrement in MongoDB → immediate DB write ✅
3. If decrement fails → return error, no rewards
4. If succeeds → update memory, add rewards
5. Save rewards immediately
6. Bot restarts
7. Load from MongoDB → shows 0 crates ✅
```

## Impact
- ✅ **Crate decrement is atomic and immediate** - prevents all duplication scenarios
- ✅ **Early return on failure** - prevents reward exploitation
- ✅ **Race condition eliminated** - MongoDB write happens before rewards
- ✅ **Works with bot restarts** - count is already persisted in DB

## Testing
To verify the fix:
1. User opens a legendary crate
2. MongoDB is immediately updated (crate count decremented)
3. Even if bot crashes before `saveDataImmediate`, the crate is gone
4. Bot restart loads correct count from MongoDB
5. No crate duplication occurs

## Technical Details
- Uses MongoDB `findOneAndUpdate` for atomic operations
- Filter ensures only users with crates > 0 can decrement
- `returnDocument: 'after'` returns the updated count
- Preserves user object structure and all fields
- Compatible with both MongoDB and JSON storage modes
