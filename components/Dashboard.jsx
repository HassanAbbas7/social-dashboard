import { useState } from "react";

// ── Data ──────────────────────────────────────────────────────────────────────

const CHANNELS = [
  {
    id: "yt",
    platform: "YouTube",
    name: "TechTalks Studio",
    handle: "@techtalks",
    color: { bg: "#FBDADA", text: "#A32D2D", bar: "#F09595" },
    metrics: [
      { label: "Subscribers", value: "128K", delta: "+1.4K", up: true },
      { label: "Views", value: "842K", delta: "+9%", up: true },
      { label: "Comments", value: "3.1K", delta: "−4%", up: false },
    ],
    spark: [40, 55, 48, 70, 62, 85, 100],
  },
  {
    id: "fb",
    platform: "Facebook",
    name: "TechTalks Official",
    handle: "fb.com/techtalks",
    color: { bg: "#D6E7FA", text: "#185FA5", bar: "#85B7EB" },
    metrics: [
      { label: "Followers", value: "74.2K", delta: "+310", up: true },
      { label: "Reach", value: "310K", delta: "+5%", up: true },
      { label: "Post likes", value: "9.8K", delta: "+2%", up: true },
    ],
    spark: [55, 65, 50, 75, 80, 70, 90],
  },
  {
    id: "ig",
    platform: "Instagram",
    name: "TechTalks",
    handle: "@techtalkshq",
    color: { bg: "#F9DDEF", text: "#993556", bar: "#ED93B1" },
    metrics: [
      { label: "Followers", value: "61.4K", delta: "+820", up: true },
      { label: "Impressions", value: "198K", delta: "+18%", up: true },
      { label: "Story views", value: "14.2K", delta: "+7%", up: true },
    ],
    spark: [30, 42, 60, 55, 78, 88, 100],
  },
  {
    id: "tk",
    platform: "TikTok",
    name: "TechTalks",
    handle: "@techtalks_tt",
    color: { bg: "#DDDCE8", text: "#3C3489", bar: "#AFA9EC" },
    metrics: [
      { label: "Followers", value: "21K", delta: "+1.1K", up: true },
      { label: "Video views", value: "88.3K", delta: "+31%", up: true },
      { label: "Shares", value: "2.4K", delta: "+14%", up: true },
    ],
    spark: [20, 28, 35, 50, 72, 88, 100],
  },
];

const POSTS = [
  {
    id: 1,
    platform: "YouTube",
    platformId: "yt",
    title: "Why React Server Components actually matter in 2025",
    age: "3 days ago",
    stats: [
      { label: "views", value: "24.1K" },
      { label: "likes", value: "1.8K" },
      { label: "comments", value: "342" },
    ],
  },
  {
    id: 2,
    platform: "Instagram",
    platformId: "ig",
    title: "Behind the scenes: our new studio setup 🎥",
    age: "1 day ago",
    stats: [
      { label: "reach", value: "8.4K" },
      { label: "likes", value: "2.1K" },
      { label: "comments", value: "87" },
    ],
  },
  {
    id: 3,
    platform: "Facebook",
    platformId: "fb",
    title: "Are you team tabs or spaces? Drop your answer below",
    age: "5 days ago",
    stats: [
      { label: "reach", value: "12.7K" },
      { label: "likes", value: "940" },
      { label: "comments", value: "215" },
    ],
  },
  {
    id: 4,
    platform: "TikTok",
    platformId: "tk",
    title: "POV: you pushed to prod on a Friday",
    age: "2 days ago",
    stats: [
      { label: "views", value: "33K" },
      { label: "likes", value: "4.2K" },
      { label: "shares", value: "189" },
    ],
  },
];

const PLATFORM_SHARE = [
  { id: "yt", label: "YouTube", pct: 45, bar: "#F09595" },
  { id: "fb", label: "Facebook", pct: 26, bar: "#85B7EB" },
  { id: "ig", label: "Instagram", pct: 22, bar: "#ED93B1" },
  { id: "tk", label: "TikTok", pct: 7, bar: "#AFA9EC" },
];

const ALERTS = [
  { dot: "#1D9E75", text: "YouTube video hit 25K views — fastest in 6 months", time: "2 hours ago" },
  { dot: "#378ADD", text: "Facebook page reached 74K followers milestone", time: "Yesterday" },
  { dot: "#D4537E", text: "TikTok engagement rate at 12% — above average", time: "2 days ago" },
  { dot: "#D85A30", text: "Instagram reach dropped 8% — consider posting more reels", time: "3 days ago" },
];

const SUMMARY = [
  { label: "Total followers", value: "284.6K", delta: "+3.2% this month", up: true },
  { label: "Total impressions", value: "1.4M", delta: "+11.5% this month", up: true },
  { label: "Avg. engagement rate", value: "4.8%", delta: "−0.3% this month", up: false },
  { label: "Posts published", value: "38", delta: "+5 vs last month", up: true },
];

const PLATFORM_ABBR = { yt: "YT", fb: "FB", ig: "IG", tk: "TK" };

// ── Sub-components ─────────────────────────────────────────────────────────────

function PlatformBadge({ id, size = 32 }) {
  const ch = CHANNELS.find((c) => c.id === id);
  if (!ch) return null;
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: 8,
        background: ch.color.bg,
        color: ch.color.text,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: size * 0.4,
        fontWeight: 600,
        flexShrink: 0,
      }}
    >
      {PLATFORM_ABBR[id]}
    </div>
  );
}

function Delta({ up, children }) {
  return (
    <span style={{ fontSize: 12, color: up ? "#1D9E75" : "#D85A30" }}>
      {children}
    </span>
  );
}

function Sparkbar({ data, color }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height: 36 }}>
      {data.map((h, i) => (
        <div
          key={i}
          style={{
            flex: 1,
            height: `${h}%`,
            background: color,
            borderRadius: "2px 2px 0 0",
            minWidth: 6,
          }}
        />
      ))}
    </div>
  );
}

function StatCard({ label, value, delta, up }) {
  return (
    <div
      style={{
        background: "var(--color-background-secondary, #f5f5f3)",
        borderRadius: 8,
        padding: "1rem",
      }}
    >
      <div style={{ fontSize: 12, color: "var(--color-text-secondary, #666)", marginBottom: 6 }}>
        {label}
      </div>
      <div style={{ fontSize: 22, fontWeight: 500, color: "var(--color-text-primary, #111)" }}>
        {value}
      </div>
      <Delta up={up}>{delta}</Delta>
    </div>
  );
}

function ChannelCard({ channel }) {
  return (
    <div
      style={{
        background: "var(--color-background-primary, #fff)",
        border: "0.5px solid var(--color-border-tertiary, rgba(0,0,0,0.12))",
        borderRadius: 12,
        padding: "1rem 1.25rem",
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <PlatformBadge id={channel.id} />
          <div>
            <div style={{ fontSize: 14, fontWeight: 500, color: "var(--color-text-primary, #111)" }}>
              {channel.name}
            </div>
            <div style={{ fontSize: 12, color: "var(--color-text-secondary, #666)" }}>
              {channel.handle}
            </div>
          </div>
        </div>
        <span
          style={{
            fontSize: 11,
            padding: "3px 8px",
            borderRadius: 99,
            background: "var(--color-background-success, #e1f5ee)",
            color: "var(--color-text-success, #0f6e56)",
            border: "0.5px solid var(--color-border-success, #5dcaa5)",
          }}
        >
          Active
        </span>
      </div>

      {/* Metrics */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0,1fr))", gap: 8, marginBottom: 14 }}>
        {channel.metrics.map((m) => (
          <div
            key={m.label}
            style={{
              background: "var(--color-background-secondary, #f5f5f3)",
              borderRadius: 8,
              padding: "8px 10px",
            }}
          >
            <div style={{ fontSize: 11, color: "var(--color-text-secondary, #666)", marginBottom: 3 }}>
              {m.label}
            </div>
            <div style={{ fontSize: 15, fontWeight: 500, color: "var(--color-text-primary, #111)" }}>
              {m.value}
            </div>
            <Delta up={m.up}>{m.delta}</Delta>
          </div>
        ))}
      </div>

      <Sparkbar data={channel.spark} color={channel.color.bar} />
    </div>
  );
}

function PostRow({ post }) {
  const ch = CHANNELS.find((c) => c.id === post.platformId);
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "10px 0",
        borderBottom: "0.5px solid var(--color-border-tertiary, rgba(0,0,0,0.12))",
      }}
    >
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: 8,
          background: ch?.color.bg || "#eee",
          color: ch?.color.text || "#333",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 16,
          flexShrink: 0,
        }}
      >
        {post.platformId === "yt" ? "▶" : post.platformId === "tk" ? "♪" : "★"}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 13,
            fontWeight: 500,
            color: "var(--color-text-primary, #111)",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {post.title}
        </div>
        <div style={{ fontSize: 11, color: "var(--color-text-secondary, #666)", marginTop: 2 }}>
          {post.platform} · {post.age}
        </div>
      </div>
      <span
        style={{
          fontSize: 10,
          padding: "2px 7px",
          borderRadius: 99,
          background: ch?.color.bg || "#eee",
          color: ch?.color.text || "#333",
          flexShrink: 0,
        }}
      >
        {post.platform}
      </span>
      <div style={{ display: "flex", gap: 14, flexShrink: 0 }}>
        {post.stats.map((s) => (
          <div key={s.label} style={{ textAlign: "right" }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: "var(--color-text-primary, #111)" }}>
              {s.value}
            </div>
            <div style={{ fontSize: 10, color: "var(--color-text-secondary, #666)" }}>{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PlatformSharePanel() {
  return (
    <div
      style={{
        background: "var(--color-background-primary, #fff)",
        border: "0.5px solid var(--color-border-tertiary, rgba(0,0,0,0.12))",
        borderRadius: 12,
        padding: "1rem 1.25rem",
      }}
    >
      <div style={{ fontSize: 14, fontWeight: 500, color: "var(--color-text-secondary, #666)", marginBottom: 12 }}>
        Follower share by platform
      </div>
      {PLATFORM_SHARE.map((p) => (
        <div
          key={p.id}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "7px 0",
            borderBottom: "0.5px solid var(--color-border-tertiary, rgba(0,0,0,0.08))",
          }}
        >
          <PlatformBadge id={p.id} size={24} />
          <div style={{ fontSize: 13, color: "var(--color-text-primary, #111)", flex: 1 }}>{p.label}</div>
          <div
            style={{
              width: 80,
              height: 6,
              background: "var(--color-background-secondary, #f0f0ee)",
              borderRadius: 3,
              overflow: "hidden",
            }}
          >
            <div style={{ width: `${p.pct}%`, height: "100%", background: p.bar, borderRadius: 3 }} />
          </div>
          <div style={{ fontSize: 12, color: "var(--color-text-secondary, #666)", minWidth: 32, textAlign: "right" }}>
            {p.pct}%
          </div>
        </div>
      ))}
    </div>
  );
}

function AlertsPanel() {
  return (
    <div
      style={{
        background: "var(--color-background-primary, #fff)",
        border: "0.5px solid var(--color-border-tertiary, rgba(0,0,0,0.12))",
        borderRadius: 12,
        padding: "1rem 1.25rem",
      }}
    >
      <div style={{ fontSize: 14, fontWeight: 500, color: "var(--color-text-secondary, #666)", marginBottom: 12 }}>
        Alerts &amp; activity
      </div>
      {ALERTS.map((a, i) => (
        <div
          key={i}
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: 10,
            padding: "8px 0",
            borderBottom:
              i < ALERTS.length - 1
                ? "0.5px solid var(--color-border-tertiary, rgba(0,0,0,0.08))"
                : "none",
          }}
        >
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: a.dot,
              marginTop: 4,
              flexShrink: 0,
            }}
          />
          <div>
            <div style={{ fontSize: 12, color: "var(--color-text-primary, #111)", lineHeight: 1.5 }}>
              {a.text}
            </div>
            <div style={{ fontSize: 11, color: "var(--color-text-secondary, #666)", marginTop: 2 }}>
              {a.time}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Main Dashboard ─────────────────────────────────────────────────────────────

export default function SocialDashboard() {
  const [activeRange, setActiveRange] = useState("30d");
  const ranges = ["7d", "30d", "90d"];

  return (
    <div style={{ padding: "1.5rem", maxWidth: 1100, margin: "0 auto", fontFamily: "var(--font-sans, system-ui)" }}>
      {/* Top bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "1.5rem",
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 500, color: "var(--color-text-primary, #111)", margin: 0 }}>
            Social media overview
          </h2>
          <p style={{ fontSize: 13, color: "var(--color-text-secondary, #666)", marginTop: 2 }}>
            4 channels across 3 platforms
          </p>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {ranges.map((r) => (
            <button
              key={r}
              onClick={() => setActiveRange(r)}
              style={{
                fontSize: 12,
                padding: "5px 12px",
                borderRadius: 8,
                border: "0.5px solid var(--color-border-secondary, rgba(0,0,0,0.25))",
                background: activeRange === r ? "var(--color-background-secondary, #f0f0ee)" : "transparent",
                color:
                  activeRange === r
                    ? "var(--color-text-primary, #111)"
                    : "var(--color-text-secondary, #666)",
                cursor: "pointer",
                fontWeight: activeRange === r ? 500 : 400,
              }}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Summary row */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, minmax(0,1fr))",
          gap: 12,
          marginBottom: "1.5rem",
        }}
      >
        {SUMMARY.map((s) => (
          <StatCard key={s.label} {...s} />
        ))}
      </div>

      {/* Channels */}
      <div style={{ fontSize: 14, fontWeight: 500, color: "var(--color-text-secondary, #666)", marginBottom: 10 }}>
        Channels
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, minmax(0,1fr))",
          gap: 12,
          marginBottom: "1.5rem",
        }}
      >
        {CHANNELS.map((ch) => (
          <ChannelCard key={ch.id} channel={ch} />
        ))}
      </div>

      {/* Recent posts */}
      <div style={{ fontSize: 14, fontWeight: 500, color: "var(--color-text-secondary, #666)", marginBottom: 10 }}>
        Recent posts
      </div>
      <div
        style={{
          background: "var(--color-background-primary, #fff)",
          border: "0.5px solid var(--color-border-tertiary, rgba(0,0,0,0.12))",
          borderRadius: 12,
          padding: "1rem 1.25rem",
          marginBottom: "1.5rem",
        }}
      >
        {POSTS.map((p, i) => (
          <div key={p.id} style={i === POSTS.length - 1 ? { borderBottom: "none" } : {}}>
            <PostRow post={p} />
          </div>
        ))}
      </div>

      {/* Bottom row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <PlatformSharePanel />
        <AlertsPanel />
      </div>
    </div>
  );
}