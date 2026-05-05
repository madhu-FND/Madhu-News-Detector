# TruthLens – Complete Setup Guide
## Fake News Detection Website with AI

---

## STEP 1: ACCOUNTS YOU NEED (ALL FREE)

### 1. GitHub (for hosting code)
- Go to: https://github.com
- Sign up with any email
- Confirm email

### 2. Vercel (FREE hosting – no credit card)
- Go to: https://vercel.com
- Sign up with your GitHub account

### 3. Supabase (already done ✅)
- URL: https://ryrjqxryqqjiuoizeidr.supabase.co
- You already have this

---

## STEP 2: SETUP SUPABASE DATABASE

1. Go to https://supabase.com → Login
2. Open your project
3. Click **SQL Editor** (left sidebar)
4. Paste and run this SQL:

```sql
-- NEWS TABLE
CREATE TABLE IF NOT EXISTS news (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT,
  source TEXT,
  category TEXT DEFAULT 'General',
  status TEXT DEFAULT 'real',
  confidence INT DEFAULT 90,
  posted_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- SCANS TABLE
CREATE TABLE IF NOT EXISTS scans (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID,
  text_snippet TEXT,
  verdict TEXT,
  fake_score INT,
  confidence INT,
  explanation TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ALERTS TABLE
CREATE TABLE IF NOT EXISTS alerts (
  id BIGSERIAL PRIMARY KEY,
  title TEXT,
  message TEXT,
  type TEXT DEFAULT 'info',
  sent_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ENABLE ROW LEVEL SECURITY
ALTER TABLE news ENABLE ROW LEVEL SECURITY;
ALTER TABLE scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;

-- POLICIES (allow public read, authenticated write)
CREATE POLICY "Public read news" ON news FOR SELECT USING (true);
CREATE POLICY "Public read alerts" ON alerts FOR SELECT USING (true);
CREATE POLICY "Auth insert news" ON news FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Auth delete news" ON news FOR DELETE USING (auth.role() = 'authenticated');
CREATE POLICY "Auth insert scans" ON scans FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Auth insert alerts" ON alerts FOR INSERT WITH CHECK (auth.role() = 'authenticated');
```

5. Click **Run** → Should say "Success"

---

## STEP 3: CREATE ADMIN ACCOUNT IN SUPABASE

1. In Supabase → Go to **Authentication** → **Users**
2. Click **Invite User** or **Add User**
3. Email: madhu5269281@gmail.com
4. Password: madhu@123
5. Click **Create**

---

## STEP 4: UPLOAD TO GITHUB

### On Mobile (using GitHub website):
1. Go to https://github.com
2. Click **+** (top right) → **New Repository**
3. Name: `truthlens-fakenews`
4. Set to **Public**
5. Click **Create Repository**
6. Click **uploading an existing file**
7. Upload these 3 files:
   - `index.html`
   - `style.css`
   - `app.js`
8. Click **Commit changes**

---

## STEP 5: DEPLOY ON VERCEL

1. Go to https://vercel.com
2. Click **Add New Project**
3. Click **Import Git Repository**
4. Connect your GitHub
5. Select `truthlens-fakenews`
6. Click **Deploy**
7. Wait 1-2 minutes
8. You'll get a URL like: `https://truthlens-fakenews.vercel.app`

**YOUR SITE IS LIVE! 🎉**

---

## STEP 6: TEST YOUR WEBSITE

1. Open your Vercel URL
2. Go to **Scan News** → Paste any news → Click Analyze
3. Login → Register a new account
4. Login with admin: madhu5269281@gmail.com / madhu@123
5. Go to **Admin** → Post a news article
6. Check **Today's News** to see it appear

---

## FEATURES INCLUDED (70+)

### AI & Detection
1. ✅ Gemini AI fake news detection
2. ✅ NLP text analysis
3. ✅ Confidence score (0-100%)
4. ✅ Fake/Real/Mixed verdict
5. ✅ Detailed explanation
6. ✅ Keyword extraction
7. ✅ Sentiment analysis breakdown
8. ✅ 4-factor credibility bars
9. ✅ Image scanner (Gemini Vision)
10. ✅ URL analysis

### Voice & Input
11. ✅ Voice search (Web Speech API)
12. ✅ Voice in chatbot
13. ✅ Text input
14. ✅ URL input
15. ✅ Image upload
16. ✅ Drag & drop images

### UI/UX
17. ✅ Professional dark theme
18. ✅ Animated splash screen
19. ✅ Loading animations
20. ✅ Animated confidence ring
21. ✅ Progress bars animation
22. ✅ News ticker (live scrolling)
23. ✅ Toast notifications
24. ✅ Alert banner
25. ✅ Responsive mobile design
26. ✅ Hamburger menu mobile
27. ✅ Smooth page transitions
28. ✅ Hover effects
29. ✅ Gradient accents
30. ✅ Floating chat button

### News Features
31. ✅ Today's news feed
32. ✅ Filter by Fake/Real/Breaking/Satire
33. ✅ Search news
34. ✅ Category labels
35. ✅ Confidence % display
36. ✅ Time ago display
37. ✅ Click news to analyze
38. ✅ Homepage news preview
39. ✅ Top stats on homepage

### History & Data
40. ✅ Scan history viewer
41. ✅ Search history
42. ✅ Filter history
43. ✅ Delete individual entries
44. ✅ Clear all history
45. ✅ Export history as CSV
46. ✅ Auto-save all scans

### AI Chatbot
47. ✅ TruthBot AI assistant
48. ✅ Full conversation context
49. ✅ Quick suggestion buttons
50. ✅ Voice input for chat
51. ✅ Typing indicator
52. ✅ Chat history in session
53. ✅ Fake news expert knowledge

### Admin Controls
54. ✅ Admin-only access (1 admin)
55. ✅ Post news articles
56. ✅ Set status (Fake/Real/Breaking/Satire)
57. ✅ Set confidence score
58. ✅ Category selection
59. ✅ Schedule posts with date/time alarm
60. ✅ AI auto-generate posts
61. ✅ Send alerts to all users
62. ✅ Alert types (warning/danger/info)
63. ✅ Admin statistics dashboard
64. ✅ Manage/delete published news
65. ✅ View platform stats

### Auth & Backend
66. ✅ Supabase authentication
67. ✅ Email/password signup & login
68. ✅ Session persistence
69. ✅ Admin role detection
70. ✅ Save scans to database
71. ✅ Real-time news from database
72. ✅ Alerts from database

### Share & Export
73. ✅ Share result (Web Share API)
74. ✅ Copy to clipboard fallback
75. ✅ Generate downloadable HTML report
76. ✅ Export scan history as CSV

---

## TROUBLESHOOTING

**"Cannot read properties of undefined"**
→ Supabase tables not created yet. Run the SQL from Step 2.

**Admin link not showing**
→ Must login with madhu5269281@gmail.com exactly. Check spelling.

**Voice not working**
→ Must use Chrome or Edge browser. Safari doesn't support it.

**AI analysis not working**
→ Check if Gemini API key is correct. It may have usage limits.

**News not saving**
→ Check Supabase RLS policies are created correctly.

---

## YOUR CREDENTIALS

| Service | Email | Password |
|---------|-------|----------|
| Admin Login | madhu5269281@gmail.com | madhu@123 |
| Supabase | Your account | Your password |
| Gemini API | AIzaSyB9Q3Xx1IQLxZWH9itgLr9ZV1SzIEkTN74 | — |

---

## FILES TO UPLOAD

1. `index.html` – Main HTML structure
2. `style.css` – All styles and animations  
3. `app.js` – All JavaScript logic

That's it! Only 3 files needed. 🎉
