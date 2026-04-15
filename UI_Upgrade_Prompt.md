# KrishiMitra AI — Complete Frontend UI/UX Upgrade Prompt

> **How to use this document:** Copy-paste each section's prompt into your AI tool of choice (Cursor, v0.dev, Bolt, Claude, etc.) when rebuilding the corresponding page or component. Each prompt is self-contained and references the specific design system established in Section 1.

---

## SECTION 0 — DESIGN PHILOSOPHY & DIRECTION

Before touching a single line of code, commit to this aesthetic direction:

**Core Vibe:** *Organic Dark Luxury meets Editorial Agriculture* — imagine the Financial Times newspaper design language fused with a premium seed-tech SaaS company. Think deep earth tones, amber accents, high-contrast typography, and data visualizations that feel like illuminated manuscripts.

**The ONE THING users will remember:** A warm, golden harvest glow emanating from interactive elements — every click, hover and transition feels like touching sunlit wheat.

**Anti-patterns to eliminate from the current codebase:**
- The flat, generic green-on-black color palette (currently uses `#52b788` everywhere)
- Overuse of `border: 1px solid rgba(60, 110, 80, 0.3)` on every card
- The Outfit/Inter font stack — too generic for a premium product
- The `glass` class applied identically across all 15+ pages
- Sidebar nav that feels like a SaaS admin panel, not a farmer's trusted advisor

---

## SECTION 1 — GLOBAL DESIGN SYSTEM (Build this first, everything depends on it)

**Prompt for your AI tool:**

```
Rebuild the entire CSS design system in `/frontend/src/index.css` for KrishiMitra AI, 
an agricultural intelligence platform for Indian farmers. Replace the current system 
with the following specifications:

TYPOGRAPHY SYSTEM (import from Google Fonts):
- Display/Hero font: "Cormorant Garamond" weights 400, 600, 700 — for all H1, H2 elements
- UI/Body font: "DM Sans" weights 400, 500, 700 — for all body text, labels, buttons
- Mono/Data font: "JetBrains Mono" weight 400 — for prices, percentages, statistics

CSS CUSTOM PROPERTIES (replace all existing --primary, --secondary, etc.):

:root {
  /* Earth Palette — Dominant 60% */
  --bg-base: #0C0A07;           /* Charred earth — page background */
  --bg-surface: #131008;        /* Slightly lighter for cards */
  --bg-raised: #1A1610;         /* Hover states, elevated cards */
  --bg-overlay: rgba(12,10,7,0.92);

  /* Harvest Gold — Accent 10% (replaces all --secondary uses) */
  --gold: #C8912B;              /* Primary brand accent */
  --gold-light: #E8A93E;        /* Hover states */
  --gold-muted: rgba(200, 145, 43, 0.15); /* Subtle fills */
  --gold-border: rgba(200, 145, 43, 0.3);

  /* Sage Green — Secondary 30% */
  --sage: #4A7C59;              /* Secondary actions */
  --sage-light: #5E9E72;
  --sage-muted: rgba(74, 124, 89, 0.15);

  /* Text Hierarchy */
  --text-primary: #F5F0E8;      /* Warm white — main content */
  --text-secondary: #9E9080;    /* Muted captions */
  --text-tertiary: #5C5248;     /* Placeholder, disabled */
  --text-inverse: #0C0A07;      /* On gold backgrounds */

  /* Semantic Colors */
  --success: #4CAF7D;
  --warning: #E8A93E;           /* Reuse gold-light */
  --danger: #E05252;
  --info: #5B9BD5;

  /* Spacing Scale */
  --space-xs: 4px;
  --space-sm: 8px;
  --space-md: 16px;
  --space-lg: 24px;
  --space-xl: 40px;
  --space-2xl: 64px;
  --space-3xl: 96px;

  /* Border Radius Scale */
  --radius-sm: 6px;
  --radius-md: 12px;
  --radius-lg: 20px;
  --radius-xl: 32px;
  --radius-pill: 9999px;

  /* Typography Scale using clamp() for fluid sizing */
  --text-display: clamp(48px, 7vw, 88px);
  --text-h1: clamp(36px, 5vw, 60px);
  --text-h2: clamp(24px, 3.5vw, 40px);
  --text-h3: clamp(18px, 2.5vw, 26px);
  --text-body: 16px;
  --text-sm: 14px;
  --text-xs: 12px;
  --text-2xs: 10px;

  /* Letter Spacing */
  --tracking-tight: -0.04em;    /* Large headings */
  --tracking-normal: -0.01em;
  --tracking-wide: 0.08em;      /* Labels, caps */
  --tracking-widest: 0.15em;    /* Status badges */

  /* Shadows */
  --shadow-sm: 0 2px 8px rgba(0,0,0,0.4);
  --shadow-md: 0 8px 24px rgba(0,0,0,0.5);
  --shadow-lg: 0 20px 60px rgba(0,0,0,0.6);
  --shadow-gold: 0 0 40px rgba(200,145,43,0.2);

  /* Animations */
  --ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1);
  --ease-spring: cubic-bezier(0.175, 0.885, 0.32, 1.275);
  --transition-fast: 150ms var(--ease-out-expo);
  --transition-base: 300ms var(--ease-out-expo);
  --transition-slow: 600ms var(--ease-out-expo);

  /* Layout */
  --nav-height: 64px;
  --sidebar-width: 240px;
  --content-max-width: 1280px;
}

GLOBAL BODY STYLES:
- Background: var(--bg-base)
- Add a subtle grain texture using an SVG noise pattern at 4% opacity
- Add a very subtle radial glow at top-center: rgba(200,145,43,0.04) at 800px radius
- Font-family: 'DM Sans', sans-serif
- Color: var(--text-primary)
- Letter-spacing: var(--tracking-normal)

HEADING ELEMENTS (h1-h4):
- Font-family: 'Cormorant Garamond', serif  
- Letter-spacing: var(--tracking-tight)
- Line-height: 1.05 for h1, 1.1 for h2, 1.2 for h3/h4

COMPONENT BASE CLASSES (replace current .glass, .btn, etc.):

.surface — replaces .glass:
  background: var(--bg-surface);
  border: 1px solid rgba(245,240,232,0.06);
  border-radius: var(--radius-lg);

.surface-raised — replaces .glass-dark hover states:
  background: var(--bg-raised);
  border: 1px solid var(--gold-border);
  box-shadow: var(--shadow-gold);

.surface-flush — for sidebar sections:
  background: var(--bg-surface);
  border-right: 1px solid rgba(245,240,232,0.06);

.btn — base button:
  font-family: 'DM Sans', sans-serif;
  font-weight: 700;
  font-size: var(--text-sm);
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
  padding: 12px 24px;
  border-radius: var(--radius-md);
  transition: var(--transition-base);
  border: none;
  cursor: pointer;

.btn-primary:
  background: var(--gold);
  color: var(--text-inverse);
  box-shadow: 0 4px 14px rgba(200,145,43,0.35);
  &:hover: background: var(--gold-light), translateY(-2px), shadow increases

.btn-secondary:
  background: transparent;
  color: var(--text-primary);
  border: 1px solid rgba(245,240,232,0.15);
  &:hover: border-color: var(--gold), color: var(--gold)

.btn-ghost:
  background: var(--gold-muted);
  color: var(--gold);
  border: 1px solid var(--gold-border);

.label — replaces all small uppercase badges:
  font-family: 'DM Sans';
  font-size: var(--text-2xs);
  font-weight: 700;
  letter-spacing: var(--tracking-widest);
  text-transform: uppercase;

.stat-number — for prices, yields, percentages:
  font-family: 'JetBrains Mono';
  color: var(--gold);

SCROLL BEHAVIOR:
Add smooth scrolling with a subtle momentum feel using CSS:
html { scroll-behavior: smooth; }
Plus a custom scrollbar using:
::-webkit-scrollbar { width: 4px }
::-webkit-scrollbar-track { background: var(--bg-base) }
::-webkit-scrollbar-thumb { background: var(--gold-border); border-radius: 2px }

SCROLL-TRIGGERED ANIMATIONS (global):
Apply to all cards, sections, stat numbers via IntersectionObserver:
- Initial state: opacity: 0, transform: translateY(24px)
- Triggered state: opacity: 1, transform: translateY(0)
- Duration: 0.6s, easing: var(--ease-out-expo)
- Stagger delay: 0.08s per child element
```

---

## SECTION 2 — NAVIGATION BAR (navbar in App.jsx)

**Current problems:** The nav is crowded with 11 links visible at once, uses generic glass styling, has no visual hierarchy, and the logo mark is just a Leaf icon.

**Prompt:**

```
Redesign the KrishiMitra navbar in App.jsx/index.css with these specifications:

LAYOUT: sticky top-0, height 64px (var(--nav-height)), full-width
BACKGROUND: var(--bg-base) with a 1px bottom border at rgba(245,240,232,0.08)
  — NOT glass/blur, just solid dark to feel editorial and confident

LEFT SECTION — Brand Identity:
  - Create a custom SVG wordmark: "KrishiMitra" in Cormorant Garamond Italic, 22px
  - Before the wordmark: a small geometric wheat grain icon (SVG, hand-drawn style, 
    2px stroke, var(--gold) color, 20x20px)
  - Below the name: "AI" in DM Sans, 9px, letter-spacing: 0.3em, color: var(--gold)
  - No Link wrapper color changes — just inherit

CENTER SECTION — Primary Navigation (7 links max visible):
  - Collapse ALL links into groups. Only show: Home, Chat, Market, Predictions, Intelligence, Data
  - "Predictions" is a dropdown containing: Yield A.I., Pest Alerts, Watering
  - "Intelligence" is a dropdown containing: AI Moat, Knowledge Map
  - Nav link style: DM Sans 13px, font-weight: 500, color: var(--text-secondary)
  - Active/hover: color: var(--text-primary), with a 1px bottom border in var(--gold)
  - Dropdown: surface card with var(--shadow-md), appears on hover with a 
    200ms fade-in + translateY(4px→0) animation

RIGHT SECTION:
  - Language selector: a small pill button showing current language flag emoji + code
  - Login button: .btn .btn-secondary with text "Enter"
  - Logout: just an icon button (LogOut icon, no text)
  - Profile: shows user initials in a 32px circle, var(--gold) background

MOBILE (under 768px):
  - Collapse center links into hamburger
  - Hamburger: three 18px-wide lines with 4px gaps
  - Menu opens as full-screen overlay (position:fixed, inset:0, var(--bg-overlay))
  - Links appear staggered with 0.06s delay each, Cormorant Garamond 36px
  - Close: X icon top-right, clicking overlay closes
```

---

## SECTION 3 — LANDING PAGE (LandingPage.jsx)

**Current problems:** The hero is text-heavy with no real visual anchor, the "innovation section" uses identical cards, and there is no sense of scale or ambition.

**Prompt:**

```
Rebuild LandingPage.jsx as a full-page scroll website with 4 snapping sections.
Use CSS scroll-snap: scroll-snap-type: y mandatory on the container,
scroll-snap-align: start on each section, each section height: 100vh.

SECTION 1 — Hero:
  Layout: Asymmetric 65/35 grid. Text left, visual right.
  
  Left content:
    - Overline: small label "Agricultural Intelligence Platform" in DM Sans caps, 
      var(--gold) color
    - H1: Cormorant Garamond, var(--text-display) size, line-height: 0.95
      Text: "Where Ancient\nWisdom Meets\nAgentic AI"
      — make "Agentic AI" italic and rendered in var(--gold) gradient text
      (use: background: linear-gradient(135deg, #C8912B, #F5D280); 
       background-clip: text; -webkit-text-fill-color: transparent)
    - Subtext: DM Sans 18px, var(--text-secondary), max-width: 400px, line-height: 1.7
      "Specialized agents for soil, weather, mandi pricing and pest forecasting 
       working in concert — built for the 100 million farmers of India."
    - CTA row: two buttons with 20px gap
      Primary: "Start Your Consultation →" (.btn-primary)
      Secondary: "Watch Demo" with a play icon (.btn-secondary)
    - Trust row below CTAs: "Trusted by farmers across 12 states" with 3 circular 
      user avatars (placeholder initials) and a star rating "4.9 / 5.0"

  Right content — Live Dashboard Card:
    - A 400x480px card with class .surface-raised
    - Inside: a mock "Crop Intelligence Dashboard" showing:
      a) A header row: "Field Report — Live" with a pulsing green dot
      b) Three metric rows using JetBrains Mono for numbers:
         "Wheat MSP: ₹2,450 / Q" — trend +1.2%
         "Soil Health: 87/100" — with a thin progress bar
         "Pest Risk: LOW" — in var(--sage) color
      c) A simple SVG line chart (5 data points, var(--gold) stroke, no fill)
    - The card should float slightly using animation: float 6s ease-in-out infinite
      @keyframes float { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-12px) } }
    - Two floating chips outside the card:
      Top-right: "🌤 32°C — Nashik" in a small surface pill
      Bottom-left: "⚡ AI Agent Active" in a var(--gold-muted) pill

  Background:
    - A single large radial gradient: from rgba(200,145,43,0.06) at left-center, 
      fading to transparent over 900px
    - Subtle grain texture overlay at 3% opacity

SECTION 2 — Features (Bento Grid):
  Title: "Everything your farm needs" in Cormorant Garamond h2
  Subtitle: "One platform. Eight intelligent agents." in DM Sans
  
  6-card bento grid (CSS Grid, 3 cols, 2 rows, with span variants):
  Card 1 (spans 2 cols): "RAG-Powered Chat" — large, dark background #1A1610, 
    shows a mock chat conversation screenshot area
  Card 2 (1 col): "Live Mandi Prices" — compact, with a small sparkline SVG
  Card 3 (1 col): "Yield Prediction" — shows "12.4 MT" in large mono font
  Card 4 (1 col): "Pest Forecasting" — "LOW RISK" badge with circular gauge
  Card 5 (2 cols): "Knowledge Graph" — shows a simplified node graph SVG 
    with 6 nodes connected by lines, using var(--gold) for active nodes
  Card 6 (1 col, tall, spans 2 rows): "Offline Edge AI" — vertical, 
    with a "No signal" icon and "Still works without internet" copy
  
  All cards: .surface class, 16px padding, border: 1px solid rgba(245,240,232,0.06)
  Hover: border-color transitions to var(--gold-border), subtle scale(1.02)

SECTION 3 — Social Proof:
  Heading: "Farmers are seeing results" in Cormorant Garamond italic
  
  Dual-row infinite marquee (two rows scrolling opposite directions, 30px/s):
  Each testimonial card: 280px wide, .surface, 20px padding
    - 5 gold stars (★★★★★)
    - Quote text: DM Sans 14px, var(--text-secondary)
    - Bottom: name, role ("Cotton Farmer, Vidarbha"), avatar initials circle
  
  Duplicate the cards array for seamless looping via CSS animation:
  @keyframes scroll-left { from { transform: translateX(0) } to { transform: translateX(-50%) } }

SECTION 4 — CTA:
  Full-viewport dark section.
  Center: Cormorant Garamond h2 at var(--text-h1) size
  "Your farm's intelligence upgrade begins here."
  
  Below: input + button inline (email newsletter signup style)
  - Email input: .surface-raised style, 320px wide, placeholder "Enter your phone/email"
  - Button: .btn-primary "Get Early Access"
  
  Background: a large wheat field silhouette SVG at 6% opacity (create a simple 
  geometric interpretation — triangular grain stalks pattern)
  Add dot navigation on the right side (4 dots, active = filled var(--gold))
```

---

## SECTION 4 — CHAT PAGE (ChatPage.jsx)

**Current problems:** The layout copies ChatGPT's dark aesthetic without personality. The sidebar uses `#171717` which looks like a dev tool. Messages lack visual hierarchy.

**Prompt:**

```
Redesign the ChatPage to feel like consulting a wise agricultural advisor, 
not using a generic chatbot. Keep the sidebar+main split layout but reimagine 
every detail.

SIDEBAR (240px):
  Background: var(--bg-surface)
  Border-right: 1px solid rgba(245,240,232,0.06)
  
  Top section:
    - "New Consultation" button: full-width, .btn-ghost style, with a Pencil icon
    - Below: a thin 1px divider in var(--gold-border)
  
  Session groups: label in DM Sans, 10px, var(--tracking-widest), var(--text-tertiary)
  
  Session items:
    - 44px tall, padding: 10px 16px
    - Icon: small wheat seedling SVG (6px) in var(--text-tertiary)  
    - Title: DM Sans 13px, var(--text-secondary), truncated
    - Active: background var(--bg-raised), left border 2px solid var(--gold),
      title color: var(--text-primary)
    - Hover: background var(--bg-raised)
    - Action buttons (rename/delete) appear on hover, aligned right, 
      28x28px icon-only buttons

  Footer: 
    - User avatar circle (32px, var(--gold) bg, initials) + name in DM Sans 13px
    - "Export Chat" text link in var(--text-tertiary)

MAIN VIEWPORT:
  Background: var(--bg-base)
  
  Header bar (50px):
    - Left: toggle sidebar button (ChevronLeft icon)
    - Center: model badge → replace with "KrishiMitra Advisor — Gemini Flash"
      styled as a pill: .surface border var(--gold-border), DM Sans 12px
    - Right: language selector (flag + code in a small dropdown)
  
  MESSAGES AREA:
    Max-width: 720px, centered, padding: 40px 24px
    
    User messages:
      - No avatar, no bubble
      - Right-aligned text, DM Sans 16px, var(--text-primary)
      - Below message: timestamp in var(--text-tertiary) 11px, right-aligned
    
    Agent messages:
      - Left: a 32x32px avatar circle with a wheat grain SVG icon, 
        background: var(--gold-muted), border: 1px solid var(--gold-border)
      - Content area: no bubble background — just the text on the dark page
      - Before the text: if agents_used exists, show a workflow line:
        Small horizontal list of agent pills: "🌤 Weather" | "📊 Market" | "🌱 Crop"
        Each: 10px DM Sans caps, var(--gold) text, var(--gold-muted) bg, 
        border: var(--gold-border), border-radius: var(--radius-pill)
      - Confidence badge: only show if confidence < 70 — warn in var(--warning)
      - Feedback actions: appear on hover, below the message, left-aligned
        Two icon buttons (ThumbsUp, ThumbsDown) in .surface-raised style
    
    Typing indicator: three dots with a wheat-wave animation (dots rise and fall 
    sequentially, like grain blowing in wind)
    
    Scroll-triggered reveal for each message: 
    opacity: 0 → 1, translateY(8px) → 0, duration: 400ms

  SUGGESTED ACTIONS chips:
    Horizontal scrollable row, no wrap
    Each chip: .surface border 1px, var(--text-secondary) text, DM Sans 13px
    Hover: border-color: var(--gold), color: var(--gold)
    Add icons: 🌦 for weather, 📈 for market, 🐛 for pest, 🌿 for fertilizer

  INPUT BOX:
    Max-width: 720px, centered
    Container: background var(--bg-raised), border: 1px solid rgba(245,240,232,0.1),
    border-radius: var(--radius-lg), padding: 12px 16px
    Focus-within: border-color var(--gold-border)
    
    Top row: attachment thumbnails (if any) as 48px squares
    
    Middle row: 
      - Attachment button (Paperclip icon, 36x36, var(--text-tertiary))
      - Textarea: transparent bg, no border, DM Sans 15px, var(--text-primary)
      - Send button: 40x40, background var(--gold), color var(--text-inverse),
        border-radius: var(--radius-md), arrow icon
        Disabled: opacity 0.3, cursor not-allowed
    
    Below input: "KrishiMitra AI may make mistakes. Verify important advice with your 
    local Krishi Kendra." — 10px, var(--text-tertiary), centered
```

---

## SECTION 5 — MARKET/MANDI PAGE (MarketPage.jsx)

**Current problems:** The 3-column mandi-layout uses inconsistent card styles. Prices are shown without visual drama. The dealer list feels like a table, not an interactive marketplace.

**Prompt:**

```
Redesign MarketPage.jsx with a Bloomberg Terminal aesthetic fused with 
Indian bazaar energy. Dense information, gold-accented data, warm dark background.

LAYOUT: Full-width, 3 columns via CSS Grid:
  Left (280px): Price Ticker Panel
  Center (flex-1): Main Operations
  Right (280px): Intelligence Feed (hide on < 1400px)

LEFT PANEL — Market Pulse:
  Header: "AGRI TICKER" in DM Sans 10px caps, tracking: var(--tracking-widest), 
  var(--gold) color, with a live dot (6px circle, var(--success), pulsing)
  
  Each price row (48px tall):
    - Left: crop name in DM Sans 12px bold, var(--text-primary)
    - Center: price in JetBrains Mono 18px, var(--gold)
    - Right: percentage change in JetBrains Mono 12px
      Positive: var(--success) with an upward arrow ↑
      Negative: var(--danger) with a downward arrow ↓
    - Below: 6-bar sparkline SVG (40x16px)
      Bars: 3px wide, 3px gap, var(--gold) color at various heights
    - Separator: 1px border at rgba(245,240,232,0.04)
  
  Animation: on mount, each row slides in from left with 0.05s stagger

CENTER — Active Listings:
  Label: "INVENTORY MATRIX" caps
  Cards scroll horizontally (overflow-x: auto, no scrollbar visible)
  Each listing card: 220px min-width, .surface-raised, padding: 20px
    - Crop name: Cormorant Garamond 22px bold
    - Weight: JetBrains Mono 14px, "1,200 KG Active" 
    - Ask price: JetBrains Mono 16px, var(--gold)
    - Status badge: "LISTED" in var(--sage) background, caps, 9px
    - Hover: scale(1.02), border-color var(--gold)

CENTER — Dealer Directory:
  Each dealer row: .surface, 72px height, padding: 0 20px
  Grid: 36px avatar | info section | rating | premium badge | CTA button
  
  Avatar: 36x36px circle, var(--gold-muted) bg, var(--gold) initials
  Name: DM Sans 15px bold
  Location: DM Sans 12px, var(--text-tertiary), with MapPin icon 10px
  Rating: JetBrains Mono 13px, "★ 4.9" in var(--warning)
  Premium badge: "+5.0%" in var(--sage) pill
  CTA: "Trade →" button, .btn-primary, compact: 32px height, 80px width
  
  Hover: left border 2px var(--gold) appears, translateX(6px) on the row content
  
  Animation: rows appear with staggered fade-up on mount

CENTER — Settlement Ledger:
  Header: "LEDGER" caps with a timestamp "Updated 2s ago" right-aligned
  
  Table redesign:
  - No traditional table borders — use 4px gap between rows instead
  - Each row is a .surface card (height: 56px, border-radius: var(--radius-md))
  - Columns: TXN ID (mono, var(--gold), 12px) | Counterparty | Commodity | 
    Quantity | ₹ Value (bold, gold) | Status badge | View →
  - Status badges: "CONFIRMED" (sage bg), "COMPLETED" (gold outline)
  - New rows animate in: slide down from above, push existing rows down
  - Hover: row background changes to var(--bg-raised)

RIGHT PANEL — Intelligence:
  "MARKET INTELLIGENCE" header caps
  
  Sentiment Index card:
    - 5 horizontal gauge segments in a bar
    - Colored: danger → warning → sage → gold → success
    - Active segment glows with a 1px golden shadow
    - "BULLISH 0.84" label below in JetBrains Mono, var(--gold)
  
  Market Insight card:
    - Quotation mark " in Cormorant Garamond 72px, var(--gold), positioned 
      absolutely top-left as a decorative element
    - Quote text in Cormorant Garamond Italic 16px, var(--text-secondary)
```

---

## SECTION 6 — ACCOUNT/DASHBOARD PAGE (AccountPage.jsx)

**Current problems:** The sidebar navigation items look like generic icon buttons. The circular chart uses a generic SVG. The form fields use flat glass-input styling.

**Prompt:**

```
Redesign AccountPage.jsx to feel like a premium farmer's digital "khaata" 
(ledger) — something between a bank app and an estate manager's dashboard.

LAYOUT: Keep 280px sidebar + main content grid

SIDEBAR:
  Top: Farmer profile section
    - Large avatar: 64x64px, Cormorant Garamond initial(s), var(--gold) gradient 
      background (linear-gradient(135deg, #C8912B, #8B6520))
    - Name in Cormorant Garamond 20px bold
    - "Premium Account" in DM Sans 10px caps, var(--gold)
    - A thin golden divider line below
  
  Navigation items: replace generic icon+text buttons with a vertical menu:
    Each item: 48px tall, full-width, padding: 0 20px
    Layout: icon (20px) + label in DM Sans 14px + optional count badge right
    Inactive: var(--text-secondary), no background
    Active: background var(--gold-muted), left border 2px solid var(--gold), 
      color var(--text-primary), font-weight: 700
    Hover: color var(--text-primary), background var(--bg-raised)
    
    Icons: use Lucide but customize color to var(--gold) for active state only

OVERVIEW TAB:
  2-column grid at top:
  
  Left — Farm Health Score card (.surface-raised, full height):
    - Large circular progress indicator using SVG:
      Background circle: rgba(245,240,232,0.06) stroke
      Progress circle: var(--gold) stroke with strokeLinecap: round
      Animated via CSS @keyframes drawing in on mount
    - Center text: score "87" in Cormorant Garamond 48px, "/100" in DM Sans 14px
    - Below: "Farm Health Index" label
    - Recommendation: "Optimal for Wheat cultivation" in 13px italic
  
  Right — Season Timeline (.surface):
    - "Season Progress" heading with the season name
    - Large thin progress bar (6px height, var(--gold) fill, rounded)
    - Animated fill using CSS width transition from 0 to actual% on mount
    - Stage labels below: "Sowing | Growth | Maturity | Harvest"
      Active stage: var(--gold) color, font-weight: 700
      Past stages: var(--sage)
      Future stages: var(--text-tertiary)
    - Crop age in days: "62 days since sowing" in JetBrains Mono

  Intelligence cards (2-column):
  Weather card: var(--info) accent, shows current conditions
  Tasks card: checklist with gold checkmarks for completed items

FARM CONFIG TAB:
  Form redesign:
  
  Inputs (.surface-raised style):
    - Remove all .glass-input styles
    - New: background var(--bg-raised), border 1px solid rgba(245,240,232,0.1)
    - Border-radius: var(--radius-md)
    - Padding: 12px 16px
    - DM Sans 15px, var(--text-primary)
    - Focus: border-color var(--gold), box-shadow: 0 0 0 3px var(--gold-muted)
    - Placeholder: var(--text-tertiary)
    - Label above each input: DM Sans 11px, var(--tracking-wide), var(--text-secondary)
  
  Soil type selector — redesign as interactive visual cards:
    4 cards in a 2x2 grid (or horizontal scroll on mobile)
    Each card: 120px x 100px, .surface
    Contains: a small circular color swatch (the soil's actual color), 
    soil name in DM Sans 14px bold, description in 11px
    
    Color swatches:
      Alluvial: linear-gradient(135deg, #8B7355, #C4A97D)
      Black: linear-gradient(135deg, #2C2417, #4A3728)
      Red: linear-gradient(135deg, #8B3A2A, #C45A3A)
      Laterite: linear-gradient(135deg, #C17A3A, #8B5E2A)
    
    Selected: border 2px solid var(--gold), label in var(--gold), 
    checkmark badge top-right (12px circle with ✓)

FARMER DETAILS TAB:
  Section cards with editorial headers:
  Header style: a horizontal line with the section title centered in it:
    .section-divider: two 1px lines flanking the centered text
    Title: Cormorant Garamond Italic 16px, var(--text-secondary)
  
  Sensitive data fields (Aadhaar, account numbers):
    Add a lock icon inside the input on the right side
    Blur the text after 3s of inactivity (CSS filter: blur(4px) on the input value)
    Click-to-reveal: blur removes on focus
```

---

## SECTION 7 — YIELD, PEST & IRRIGATION PREDICTION PAGES

**Current problems:** The three prediction pages look nearly identical. Each has a left panel of sliders and a right results panel that shares the same circular gauge. There is no visual differentiation.

**Prompt:**

```
Differentiate the three prediction pages with distinct visual identities while 
sharing the same underlying layout system.

SHARED LAYOUT SYSTEM for all three:
  Full-width, 12-column CSS grid
  Left panel (7 cols): Parameter controls
  Right panel (5 cols): Results visualization

YIELD PAGE — "Golden Harvest" theme:
  Page accent color override: var(--gold) (same as global)
  
  Left panel header: 
    "YIELD SIMULATOR" in DM Sans caps + a wheat stalk SVG icon (var(--gold))
    Below: Cormorant Garamond 14px italic: "Precision harvest forecasting 
    powered by XGBoost regression analysis"
  
  Sliders: custom styled
    Track: 3px height, background rgba(245,240,232,0.08)
    Fill: var(--gold) via CSS custom property and clip-path trick
    Thumb: 16x16px circle, var(--gold) bg, border 2px solid var(--bg-base),
    box-shadow: 0 0 8px rgba(200,145,43,0.5)
    Label: DM Sans 11px above, value display in JetBrains Mono 14px var(--gold) right
  
  Result display:
    A large rectangular "harvest field" visualization:
    - A 100% x 160px div divided into grid squares (8x5)
    - Each square fills with var(--gold) based on predicted yield percentage
    - Animation: squares fill from bottom-left to top-right with 30ms stagger
    - Below: "12.4 Metric Tons" in JetBrains Mono 48px, var(--gold)
    - Explanation text in Cormorant Garamond Italic 16px, var(--text-secondary)

PEST PAGE — "Danger Signal" theme:
  Page accent color: var(--danger) for high-risk, var(--sage) for low-risk
  
  Left panel header: 
    "BIO-RISK FORECASTER" caps, with a Bug icon that has an alert animation 
    when risk is HIGH (icon shakes with CSS animation: shake 0.5s ease infinite)
  
  Risk gauge: replace the current SVG circle with a thermometer-style vertical gauge:
    - 240px tall, 32px wide
    - Gradient fill from bottom (var(--sage)) through (var(--warning)) to (var(--danger))
    - A floating indicator arrow pointing at the risk level
    - Risk percentage displayed in JetBrains Mono 32px beside it
    - Below: risk level badge "MODERATE RISK" in the appropriate color

IRRIGATION PAGE — "Water Flow" theme:
  Page accent color: #5B9BD5 (info/blue)
  
  Water source selector: custom radio-style with water source icons
    Canal: 🌊, Tubewell: ⚙️, Pond: 💧
    Selected: blue border, blue fill icon
  
  Result: animated water level visualization
    - A 200px x 200px circular container 
    - Inside: CSS water wave animation (using a pseudo-element with 
      border-radius: 40% 60% 60% 40%, animating transform: rotate())
    - Water level height corresponds to irrigation probability %
    - Color: var(--info) (#5B9BD5)
    - Probability percentage floating centered above the water

ALL THREE PAGES:
  Run button: full-width, 56px height, prominent
  Loading state: replace generic Loader2 spin with a crop-specific animation:
    Yield: an ear of wheat growing from bottom CSS keyframe
    Pest: a magnifying glass scanning CSS animation  
    Irrigation: water drops falling animation
```

---

## SECTION 8 — KNOWLEDGE GRAPH PAGE (KnowledgeGraphPage.jsx)

**Current problems:** The page has no actual graph visualization — just a list. This is a missed opportunity for a stunning visual.

**Prompt:**

```
Rebuild KnowledgeGraphPage.jsx with an actual interactive force-directed graph 
visualization using pure SVG and vanilla JS (no D3 required).

LAYOUT: Full-height page
  Left sidebar (320px): Node explorer + search
  Main canvas: The graph SVG, full remaining width and height

LEFT SIDEBAR:
  Header: "EXPERT KNOWLEDGE MAP" in Cormorant Garamond 20px
  Search: .surface-raised input, 100% width, magnifying glass icon inside
  Node list: scrollable, each node is 40px, click to highlight in graph
  
  Selected node detail panel (slides up from bottom of sidebar):
    Node name: Cormorant Garamond 24px
    Type: DM Sans 10px caps badge
    Relationship count: "12 connections" in JetBrains Mono
    Top 5 relationships listed

MAIN CANVAS — SVG Force Graph:
  SVG element: width 100%, height 100%
  Background: var(--bg-base) with a subtle grid pattern (very light lines at 
  40px intervals, rgba(245,240,232,0.03))
  
  Nodes:
    Default: 8px radius circles, var(--bg-raised) fill, 
    1.5px stroke rgba(245,240,232,0.2)
    
    Category colors by node type (assign colors based on label patterns):
      Crops: var(--sage) stroke
      Diseases: var(--danger) stroke  
      Fertilizers: var(--gold) stroke
      Chemicals: var(--info) stroke
      Weather: #8B9CD5 stroke
    
    Hovered: radius increases to 12px, stroke becomes category color fully opaque,
    label appears (DM Sans 11px, var(--text-primary), with a dark pill background)
    
    Selected: radius 14px, outer ring (second SVG circle at r+6, opacity 0.3)
    pulsing with CSS animation, gold stroke
  
  Edges:
    Default: 1px stroke, rgba(245,240,232,0.08), curved (use SVG path with 
    quadratic bezier curves)
    
    Highlighted (connected to selected node): stroke var(--gold), 1.5px, 
    with a flowing dot animation: a small circle travels along the path
    using CSS animation + stroke-dashoffset trick
  
  Simulation: implement a simple spring simulation in JS
    - Each node has x, y, vx, vy
    - Repulsion: nodes push each other away (inverse square)
    - Attraction: edges pull connected nodes together
    - Damping: multiply velocities by 0.9 each tick
    - Run requestAnimationFrame loop for 3s on mount, then freeze
  
  Controls (bottom-right corner of canvas):
    + and - zoom buttons, a "Reset" button
    Zoom via SVG viewBox manipulation
  
  On node click:
    - Selected node gets the gold ring treatment
    - All edges to/from it highlight (gold, flowing animation)
    - Sidebar updates with node details
    - All non-connected nodes dim (opacity: 0.2)
```

---

## SECTION 9 — DATA CENTER PAGE (DataCenterPage.jsx)

**Current problems:** The current design looks like a generic admin panel. The pipeline table is boring. Stats cards are all identical.

**Prompt:**

```
Redesign DataCenterPage.jsx as a "mission control" aesthetic — dark, 
information-dense, with a terminal-meets-NASA-control-room feel.

PAGE HEADER:
  Left: "DATA COMMAND" in Cormorant Garamond 40px + "CENTER" on second line, 
  "Orchestrating 10+ expert ingestion pipelines" below in DM Sans
  
  Right: a connection status card:
    .surface-raised, inline-flex, gap: 24px
    Left section: "Mode" label + "ONLINE" in var(--success) with blinking dot
    Divider: 1px vertical line
    Right section: "Edge AI" label + "KrishiMitra v2.1" in var(--gold)

STAT CARDS — 3 across, differentiated:
  Card 1 — Records Ingested:
    Left: a column chart SVG (8 bars, varying heights, var(--gold) bars, 
    animate bars growing upward on mount via CSS scaleY)
    Right: "1.8k" in JetBrains Mono 40px + "+12% today" badge
  
  Card 2 — Active Pipelines:
    Center: a 10-segment arc gauge (like a car speedometer)
    Each segment is a separate SVG path, 10/10 filled in var(--success)
    "10/10" in JetBrains Mono 32px centered
  
  Card 3 — Storage:
    A 3D-looking cylinder SVG (two ellipses + a rectangle):
    Top ellipse: filled var(--gold) showing 98% capacity
    "98% Synced" label

PIPELINE TABLE redesign as a "terminal log" style:
  Container: .surface with a monospace feel
  
  Header: a terminal bar — three colored dots (red/yellow/green) left-aligned,
  "pipeline_orchestrator.py — process 1 of 10" right-aligned in DM Sans 11px
  
  Table header: 
    Background var(--bg-raised), DM Sans 10px caps, letter-spacing widest,
    columns: PIPELINE | STATUS | RECORDS | LAST RUN | EXECUTE

  Each pipeline row:
    Alternating very subtle background (every other row: rgba(245,240,232,0.01))
    Pipeline name: DM Sans 14px bold + below it: a category tag 
      ("Weather", "Market", "Knowledge" etc.) in var(--text-tertiary)
    Status pill: "●  HEALTHY" where ● is an animated pulsing dot
    Records: JetBrains Mono 16px var(--gold) — numbers should count up from 0 
      to their value on mount using a JS counter animation
    Last run: relative time "2h ago" in var(--text-tertiary)
    Execute button: compact .btn-ghost, "▶ RUN" text, 32px height
      While running: shows "⟳ SYNCING" with spin animation, button disabled
      After success: brief "✓ DONE" in var(--success) then resets
  
  Row entry animation: rows appear sequentially with 50ms stagger, 
  sliding in from the right (translateX(20px) → 0)

  Hover: left border appears (2px var(--gold)), entire row has a very subtle 
  gold glow: box-shadow: inset 0 0 0 1px rgba(200,145,43,0.1)
```

---

## SECTION 10 — UPLOAD / KNOWLEDGE PAGE (UploadPage.jsx)

**Prompt:**

```
Redesign UploadPage.jsx to feel like a prestigious library's document 
intake system — calm, organized, with editorial gravitas.

PAGE HEADER:
  Left: "Knowledge Vault" in Cormorant Garamond 36px
  Subtitle: "Feed your AI with expertise" in DM Sans, italic, var(--text-secondary)
  
  Right: stat pair in .surface-raised pill
    "12 Documents  ·  450 Chunks" with a vertical divider
    Both numbers in JetBrains Mono var(--gold)

DRAG & DROP ZONE:
  Remove current dashed border — replace with a refined treatment:
  
  Normal state:
    .surface background, border-radius: var(--radius-xl)
    A thin 1px border in rgba(245,240,232,0.08)
    Center: a stack of 3 paper/document SVG icons (layered, offset)
    Below: "Drop government PDFs, crop guides, or research papers" 
    in Cormorant Garamond 20px italic
    "or" divider in DM Sans 12px
    "Browse Files" link-style button in var(--gold) with underline
  
  Drag-active state:
    border changes to 2px solid var(--gold)
    background: var(--gold-muted)
    Documents icon gets a download arrow animation
    Text: "Release to upload" in Cormorant Garamond italic

QUEUE ITEMS:
  Each item: horizontal row, .surface, 64px height
  Left: a PDF icon (16px, var(--gold)) with the file size below it
  Center: filename in DM Sans 14px + category tag (auto-detected from name)
  Right: status section
    Idle: "Ingest →" button (.btn-ghost, compact)
    Uploading: a linear progress bar replacing the button (animated fill)
    Success: "✓ 45 chunks added" in var(--success) DM Sans 13px
    Error: "✗ Failed" in var(--danger)
  
  Hover: background var(--bg-raised)
  Stagger-fade in on mount

DOCUMENT REGISTRY (right panel):
  Title: "Neural Registry" in Cormorant Garamond 20px
  Search: compact, .surface-raised, icon inside
  
  Each registered document:
    Row height: 52px, with a left colored stripe (4px) in category color:
      Government docs: var(--gold)
      Research: var(--sage)
      Guidelines: var(--info)
    
    File name: DM Sans 14px bold
    Meta: "{X} chunks · {size} · {relative time}" in DM Sans 11px, var(--text-tertiary)
    Right: a small eye icon button to preview
  
  Empty state: 
    A large book SVG icon (Cormorant-style illustration) with 
    "No documents indexed yet. The vault awaits." in italic
```

---

## SECTION 11 — AI MOAT DASHBOARD (MoatDashboardPage.jsx)

**Prompt:**

```
Redesign MoatDashboardPage.jsx to feel like a Bloomberg data terminal 
tracking the growth of a competitive advantage asset.

PAGE HEADER — dramatic:
  Left: "PROPRIETARY AI MOAT" in two lines
    "PROPRIETARY" — DM Sans 11px caps, letter-spacing: var(--tracking-widest), 
    var(--text-tertiary)
    "AI MOAT" — Cormorant Garamond 52px, line-height: 1, var(--gold) color
  
  Right: Export button redesign
    .btn-primary but larger: 52px height, "EXPORT GOLD DATASET" caps
    With a sparkle icon + "JSONL" format badge in the corner of the button

METRIC CARDS — 3 across (redesign each uniquely):
  
  Card 1 — Samples:
    Background: var(--gold-muted) with a gold gradient overlay top-right corner
    A large number: JetBrains Mono 64px
    Counter animation: counts up from 0 to value over 1.5s using 
    requestAnimationFrame + easeOutExpo easing
    "Gold-standard interactions" label below
  
  Card 2 — Topic Diversity:
    Show topics as a small horizontal dot chart:
    Each topic is a colored dot (8px) with a thin bar extending right 
    (width proportional to count)
    Max 5 topics shown, "View all →" link
  
  Card 3 — Dataset Size:
    A vertical bar chart with time-based growth (simulate 30 days of growth)
    Using SVG rect elements, var(--gold) fill
    "Growing 4.2x per week" badge in var(--success)

CURATION FEED — ticker style:
  Title: "LIVE CURATION TICKER" in DM Sans caps + a pulsing recording dot
  
  Each sample entry: horizontal, 72px tall, with left border in topic-category color
  Layout: timestamp (mono, var(--text-tertiary)) | topic badge | query preview
  
  Query text: truncated, Cormorant Garamond Italic 15px, var(--text-secondary)
  
  New entries: animate in from the top (slide down, existing items push down)
  Empty state: animated ticker-tape lines with "Awaiting gold interactions..." 
  scrolling horizontally like a stock ticker

PHILOSOPHY SECTION at bottom:
  Full-width, .surface-raised 
  Left: a "compound growth" line chart SVG showing exponential curve, var(--gold)
  Right: Cormorant Garamond quote style text, large opening " mark in gold
```

---

## SECTION 12 — LOGIN & REGISTER PAGES (LoginPage.jsx, RegisterPage.jsx)

**Current problems:** The branding side has a stock photo overlay. The form side is generic.

**Prompt:**

```
Redesign both auth pages with a split layout that commands attention:

BRANDING SIDE (55% width):
  Background: NOT a photo overlay. Instead:
    - A deep earth background: var(--bg-base)
    - A large abstract geometric agricultural illustration using SVG only:
      - Concentric thin circles (var(--gold), 0.3 opacity) emanating from center
      - 6-8 stylized wheat stalks drawn in thin 1px strokes (var(--gold), 0.4 opacity)
        positioned in the lower 60% of the panel
      - A sun/circle motif at the top: 120px circle, var(--gold) stroke, not filled
      - The whole illustration is subtle — these are ghost-lines behind the text
  
  Content: positioned in the center-left
    - "KM" monogram: two Cormorant Garamond letters, 72px, var(--gold)
    - Horizontal line: 40px, 1px, var(--gold)
    - Headline: Cormorant Garamond 42px, var(--text-primary), line-height: 1.1
    - Subtext: DM Sans 15px, var(--text-secondary), max-width: 360px
    - Three feature pills at bottom: small rounded pills with icons
      "✓ RAG Intelligence" | "✓ Agentic Reasoning" | "✓ Offline Capable"
      Each: var(--gold-muted) bg, var(--gold-border) border, DM Sans 12px

FORM SIDE (45% width):
  Background: var(--bg-surface)
  Content: centered vertically and horizontally, max-width: 380px
  
  Form header:
    "Welcome back" — Cormorant Garamond 32px (Login)
    "Create account" — Cormorant Garamond 32px (Register)
    Below: DM Sans 14px, var(--text-secondary)
  
  Form inputs: same redesign as AccountPage.jsx inputs
    But also add a floating label animation:
    Label starts as placeholder inside the input
    On focus: label floats up above the input (transform: translateY(-24px) scale(0.85))
    This is a CSS-only floating label using :placeholder-shown trick
  
  Primary CTA: .btn-primary, full width, 52px height
  
  Divider: "— or continue with —" in DM Sans 11px, var(--text-tertiary)
  
  Social buttons: two side-by-side .btn-secondary buttons (Google, Biometrics)
    These are icon + text, 44px height, equal width
  
  Footer link: DM Sans 14px, "New here? Create account" with var(--gold) link

TRANSITION BETWEEN PAGES:
  The branding panel stays fixed as you switch between Login and Register
  Only the form panel transitions (slide out left, new form slides in from right)
  Duration: 400ms, var(--ease-out-expo)
```

---

## SECTION 13 — BILL/INVOICE PAGE (BillPage.jsx)

**Prompt:**

```
This page renders a printable invoice. Make it feel like a genuine 
government-stamped commercial document with Indian aesthetic sensibility.

PRINT VIEW (the document):
  Max-width: 800px, centered, white background (#FFFFFF), black text

  HEADER:
    Left: "KrishiMitra MATRIX" in two weights — "KrishiMitra" thin, "MATRIX" bold
    A decorative horizontal rule below: 3px gradient line 
    (left: var(--gold), right: transparent)
    Right: "TAX INVOICE" in DM Sans 10px caps, and the bill number below in mono

  BODY sections separated by thin horizontal rules

  ENTITY BLOCKS: two columns
    Each in a bordered box (1px solid #E5E5E5), with a colored header strip:
    Seller: left-aligned gold top strip
    Buyer: left-aligned dark top strip

  COMMODITY TABLE:
    Clean table, no cell borders, only horizontal dividers
    Alternating very light gray rows (#FAFAFA on even rows)
    Commodity name: 22px bold, commodity description in 9px below
    Total: right-aligned, 36px, bold

  TOTAL BOX: a black box with white text — the Final Disbursement amount
    "₹" in a small font, the number in JetBrains Mono 40px

  FOOTER: 
    A horizontal band with "APMC REGULATED · MATRIX PLATFORM v4.2" in tiny caps

SCREEN VIEW (before printing):
  Dark background page with the white bill card floating on it (.shadow-2xl)
  
  Top action bar: fixed position above the bill
    Left: "← Back to Market" ghost button  
    Right: "Download PDF" primary button + Print icon button
  
  The bill card appears with a subtle entrance: 
  scale(0.96) opacity(0) → scale(1) opacity(1), 400ms, var(--ease-out-expo)
```

---

## SECTION 14 — SCROLL & ANIMATION SYSTEM (Global, implement last)

**Prompt:**

```
Add a cohesive scroll and animation system across all pages of KrishiMitra.

1. SMOOTH SCROLL:
Add Lenis smooth scroll library via CDN in index.html:
<script src="https://unpkg.com/lenis@1.1.13/dist/lenis.min.js"></script>

Initialize in main.jsx or App.jsx:
const lenis = new Lenis({ duration: 1.2, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)) });
function raf(time) { lenis.raf(time); requestAnimationFrame(raf); }
requestAnimationFrame(raf);

2. SCROLL-TRIGGERED REVEALS (IntersectionObserver):
Create a custom React hook useScrollReveal():
- On mount, observe all elements with class .reveal
- When entering viewport (threshold: 0.1), add class .revealed
- CSS: .reveal { opacity: 0; transform: translateY(28px); transition: opacity 0.6s var(--ease-out-expo), transform 0.6s var(--ease-out-expo) }
- CSS: .reveal.revealed { opacity: 1; transform: translateY(0) }
- For staggered children: .reveal-stagger > * { transition-delay: calc(var(--stagger-index) * 0.08s) }
  Set --stagger-index via inline style in JSX: style={{ '--stagger-index': index }}

Apply .reveal class to: all section headers, all card grids, all table rows, 
all stat cards, the features grid on landing page

3. STAT COUNTER ANIMATION:
Create a useCountUp(targetValue, duration=1500) hook:
- Uses requestAnimationFrame to count from 0 to targetValue
- Starts when the element enters viewport
- Apply to: all price values, all yield numbers, all percentage displays
- Format: auto-detect if value is a price (₹), percentage (%), or plain number

4. PAGE TRANSITIONS:
In App.jsx, wrap Routes in AnimatePresence with a Framer Motion variant:
Initial: { opacity: 0, y: 8 }
Animate: { opacity: 1, y: 0 }
Exit: { opacity: 0, y: -8 }
Transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] }

5. HOVER MICRO-INTERACTIONS (pure CSS additions to index.css):
- All .btn: transition var(--transition-base), translateY on hover
- All .surface cards: transition border-color, box-shadow
- All table rows: transition background-color 150ms
- All nav links: transition color 150ms
- Input focus: transition border-color, box-shadow (use CSS only, no JS)

6. LOADING STATES:
Replace all <Loader2 className="lucide-spin" /> with a custom component:
A stack of three thin horizontal bars that animate like a loading grain silo filling:
  CSS: 3 divs, 24px wide, 3px tall, var(--gold) bg, 6px gap
  Animation: the bars fill from left (scaleX: 0 → 1) in staggered sequence, looping
```

---

## IMPLEMENTATION ORDER

Implement the sections in this exact order to avoid breaking changes:

1. **Section 1** — Design system (index.css) — Everything depends on this
2. **Section 2** — Navbar — Appears on every page
3. **Section 3** — Landing page — First impression
4. **Section 12** — Auth pages — Simple, isolated
5. **Section 4** — Chat page — Core feature, most complex
6. **Section 5** — Market page — Revenue-adjacent feature
7. **Section 6** — Account page — Dashboard
8. **Sections 7** — Three prediction pages (can be done in parallel)
9. **Section 8** — Knowledge graph — Most technically complex
10. **Section 9** — Data center
11. **Section 10** — Upload page
12. **Section 11** — AI Moat
13. **Section 13** — Bill page
14. **Section 14** — Scroll & animation system — Apply globally last

---

## QUALITY CHECKLIST (verify before each section is "done")

Before marking any page complete, confirm:

- [ ] All text uses `Cormorant Garamond` (headings) + `DM Sans` (body) + `JetBrains Mono` (data)
- [ ] No hardcoded color values — all colors from CSS variables
- [ ] At least one scroll-triggered reveal animation per page
- [ ] Hover states on all interactive elements
- [ ] Loading states for all async operations (no raw Loader2 spin)
- [ ] Mobile responsiveness: test at 375px and 768px widths
- [ ] No `rgba()` colors that don't trace back to the design system palette
- [ ] Consistent 8px spacing grid (all padding/gap values are multiples of 8)
- [ ] No generic element IDs like `#center`, `#next-steps` from the old system
- [ ] All buttons have visible focus states (for accessibility)
- [ ] Empty states exist for all lists and data-driven sections
