# Crate Duplication Bug Fix

## Problem Identified
Every time the bot restarted, users were getting 1 legendary crate (and potentially other crates) added back to their account, even after opening them.

## Root Cause
The bug was in `mongoManager.js` in the `stripUnnecessaryFields()` function:

1. When a user opened a crate, the crate count went to 0 in memory
2. Before saving to MongoDB, `stripUnnecessaryFields()` deleted all fields with value 0
3. MongoDB's `$set` operator only updates fields that are present in the update object
4. **Critical Issue**: Fields that were deleted from the update object remained unchanged in MongoDB
5. On next load, the old crate count (e.g., `legendaryCrates: 1`) was loaded from MongoDB
6. User got their crate back!

## Solution
**File Modified**: `mongoManager.js` (lines 118-126)

**Change**: Removed deletion of numeric counters from `stripUnnecessaryFields()`:
- ✅ Crate counts (bronze, silver, gold, emerald, legendary, tyrant) now persist as 0
- ✅ Other numeric fields (shards, stBoosters, pendingTokens, messageCount) also fixed
- ✅ Empty arrays and objects still get cleaned up (mailbox, completedQuests, inventory)

## Impact
- **Going Forward**: All crate operations will now persist correctly
- **Existing Data**: Any inflated crate counts will self-correct as users open their crates
- **No Manual Cleanup Needed**: The fix prevents future issues and existing issues resolve naturally during gameplay

## Testing
The fix ensures that when a user:
1. Opens a crate → count goes to 0
2. Data is saved → 0 is written to MongoDB (not deleted)
3. Bot restarts → 0 is loaded from MongoDB
4. User correctly has 0 crates

## Other Affected Counters
This fix also prevents similar issues with:
- Shards
- ST Boosters  
- Pending Tokens
- Message Count

All numeric counters now persist correctly across restarts.
