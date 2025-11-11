# ST Booster System - Complete Rework ✅

## 🔧 Fixes Applied

### 1. **Character Finding Bug Fixed**
- **Before:** `!boost Finn` would say "character not found"
- **After:** Case-insensitive search works correctly for all characters
- **Issue:** Code was accessing `characters[name]` instead of using array.find()

### 2. **Cost Increased**
- **Before:** 8 shards → 1 ST Booster
- **After:** 💎 **100 shards** → 1 ST Booster
- Makes ST Boosters rare and valuable!

### 3. **Complete Mechanic Rework**
- **Before:** Simply added +5-25% ST
- **After:** **Completely re-rolls the character's ST with weighted probabilities**

---

## 🎮 How The New System Works

### Core Mechanic: ST Re-Roll
When you use an ST Booster, it **doesn't add to your ST** - it **generates a completely new ST value**!

Think of it like spinning a roulette wheel with your character's fate on the line.

---

## ⚖️ Weighted Probability System

The system is designed to make high ST characters **very risky** to boost:

### Low ST Characters (0-50%)
- ✅ **60% chance to IMPROVE**
- ❌ **40% chance to DECREASE**
- **Strategy:** Safe to boost, good odds!

### Medium ST Characters (50-75%)
- ✅ **45% chance to IMPROVE**
- ❌ **55% chance to DECREASE**
- **Strategy:** Slight risk, but still reasonable

### High ST Characters (75-90%)
- ✅ **25% chance to IMPROVE**
- ❌ **75% chance to DECREASE**
- **Strategy:** High risk! Only boost if desperate

### Very High ST Characters (90%+) 💀
- ✅ **10% chance to IMPROVE**
- ❌ **90% chance to DECREASE**
- **Strategy:** EXTREME RISK! Will likely lose significant ST
- **Special:** If you DO improve, gains are capped at +5% max

---

## 🛡️ Protection System

### 3 Boost Limit Per Character
- Each character can only be boosted **3 times EVER**
- After 3 boosts, the character is permanently locked from boosting
- Check remaining boosts with `!char <name>`
- **Boost count is saved to MongoDB** - persists across bot restarts

---

## 📊 Example Scenarios

### Example 1: Low ST Character (Good Odds)
```
Character: Nix
Current ST: 35%

!boost nix

Possible outcomes:
✅ 35% → 68% (+33%) - LEGENDARY BOOST!
✅ 35% → 52% (+17%) - RARE BOOST!
✅ 35% → 44% (+9%) - BOOST!
❌ 35% → 28% (-7%) - Minor Decrease
❌ 35% → 18% (-17%) - Decrease

Odds: 60% improve, 40% decrease
```

### Example 2: High ST Character (Risky!)
```
Character: Bruce
Current ST: 82%

!boost bruce

Possible outcomes:
✅ 82% → 91% (+9%) - RARE BOOST! (25% chance)
❌ 82% → 74% (-8%) - Minor Decrease
❌ 82% → 58% (-24%) - MAJOR DECREASE!
❌ 82% → 41% (-41%) - MAJOR DECREASE!
❌ 82% → 29% (-53%) - DEVASTATING!

Odds: 25% improve, 75% decrease
Most likely: LOSE ST
```

### Example 3: 90%+ ST Character (EXTREME RISK!)
```
Character: Buck
Current ST: 94%

!boost buck

Possible outcomes:
✅ 94% → 97% (+3%) - Small Boost (10% chance, max +5%)
❌ 94% → 85% (-9%) - Decrease
❌ 94% → 67% (-27%) - MAJOR DECREASE!
❌ 94% → 42% (-52%) - DEVASTATING!
❌ 94% → 18% (-76%) - CATASTROPHIC!

Odds: 10% improve, 90% decrease
Most likely: LOSE 20-50% ST
Strategy: DON'T DO IT unless you're desperate!
```

---

## 🎯 When to Use ST Boosters

### ✅ Good Use Cases:
1. **Low ST characters (0-50%):** Great odds to improve!
2. **Stuck with bad ST:** If you got 15% ST, boosting has good upside
3. **You have 3 tries:** Use first boost on low ST, save others
4. **Competitive edge:** Need that extra 10-20% for raids/battles

### ❌ Bad Use Cases:
1. **Already have 85%+ ST:** High chance to LOSE ST
2. **You're at 92% ST:** 90% chance to drop significantly
3. **Used 2 boosts already:** Last boost is precious, don't waste
4. **Just got 78% ST:** That's already good, don't risk it

---

## 💡 Strategic Tips

### 1. **Check Boost Count First**
```
!char nix
```
Shows: `ST Boosts: 1/3 used` (2 remaining)

### 2. **View System Info**
```
!shards
```
Shows your shards, boosters, and probability breakdown

### 3. **Craft Carefully**
```
!craft
```
Costs 100 shards! Make sure you're ready to use it

### 4. **Plan Your 3 Boosts**
- **Boost 1:** Use on low ST (safe)
- **Boost 2:** If Boost 1 failed, try again
- **Boost 3:** Save for emergency or very low ST

### 5. **Know When to Stop**
If you get to 70-80% ST, **STOP BOOSTING**. You're in a good spot and further boosts will likely decrease your ST.

---

## 📋 Commands Reference

### View ST Booster Info
```
!shards
```
Shows:
- Your shard count
- ST Boosters you have
- Total boosts used (across all characters)
- Crafting cost (100 shards)
- Probability breakdown

### Craft ST Booster
```
!craft
```
- Costs: 100 shards
- Get: 1 ST Booster
- Warning message about risk

### Use ST Booster
```
!boost <character name>
```
Examples:
```
!boost nix
!boost Bruce
!boost finn
```
- Case-insensitive ✅
- Works with any character you own
- Shows before/after ST and boost count

### Check Character Boost Status
```
!char <character name>
```
Shows:
- Current ST%
- ST Boosts: X/3 used
- ⚡ Y left or ❌ Max reached

---

## 🎨 Result Messages

### When You Improve ST
- **+20% or more:** 💫 LEGENDARY BOOST (gold color)
- **+10-19%:** 🌟 RARE BOOST (purple color)
- **+1-9%:** ⭐ BOOST (blue color)

### When ST Decreases
- **-20% or more:** 💔 MAJOR DECREASE (red color)
- **-10-19%:** ⚠️ DECREASE (orange color)
- **-1-9%:** 📉 MINOR DECREASE (yellow color)

---

## 🔒 Technical Details

### How the Weighted Algorithm Works

1. **Generate base random ST (0-100%)**
2. **Calculate bias based on current ST:**
   - ST < 50: lowerBias = 0.4 (40% favor lower)
   - ST 50-75: lowerBias = 0.55 (55% favor lower)
   - ST 75-90: lowerBias = 0.75 (75% favor lower)
   - ST 90+: lowerBias = 0.9 (90% favor lower)

3. **Roll dice:**
   - If roll < lowerBias: Generate ST **below** current
   - Otherwise: Generate ST **above** current

4. **For 90+ ST improvements:**
   - Capped at +5% maximum
   - Makes it near impossible to reach 100% ST via boosting

### MongoDB Persistence
- `character.boostCount` saved to database
- Persists across bot restarts
- Cannot be reset (permanent limit)

### HP Recalculation
- HP automatically recalculated based on new ST
- Uses same formula as initial character creation
- Battle system immediately uses new stats

---

## ⚠️ Important Warnings

1. **NO REFUNDS:** Once you use a booster, the result is final
2. **PERMANENT LIMIT:** 3 boosts per character, forever
3. **HIGH RISK AT HIGH ST:** 90%+ ST has 90% chance to DECREASE
4. **COST:** 100 shards per booster (very expensive)
5. **NO UNDO:** Can't reverse a bad roll

---

## 🎲 Risk vs Reward Summary

| Current ST | Improve Chance | Decrease Chance | Recommendation |
|-----------|---------------|-----------------|----------------|
| 0-30% | 60% | 40% | ✅ **GO FOR IT** |
| 31-50% | 60% | 40% | ✅ **Safe bet** |
| 51-65% | 45% | 55% | ⚠️ **Slight risk** |
| 66-75% | 45% | 55% | ⚠️ **Consider stopping** |
| 76-85% | 25% | 75% | 🛑 **High risk** |
| 86-90% | 25% | 75% | 🛑 **Very risky** |
| 91-95% | 10% | 90% | ☠️ **EXTREME RISK** |
| 96-100% | 10% | 90% | ☠️ **DON'T DO IT** |

---

## 🏆 Optimal Strategy

### The "Smart Booster" Approach:
1. **Only boost characters with <60% ST**
2. **Stop if you reach 70%+**
3. **Save your 3rd boost** for emergencies
4. **Never boost 85%+ ST** (too risky)
5. **Accept that 75% ST is excellent**

### The "Gambler" Approach:
1. **Boost anything, anytime**
2. **Chase that 95%+ ST**
3. **Risk it for the biscuit**
4. **Hope RNG is on your side**
5. **Probably end up with 30% ST** 😅

---

**Good luck! May RNG be in your favor! 🎲**
