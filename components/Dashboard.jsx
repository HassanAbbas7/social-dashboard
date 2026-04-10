import { useState, useEffect } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// CONFIG — fill in your keys and IDs
// ─────────────────────────────────────────────────────────────────────────────

const YOUTUBE_API_KEY = "AIzaSyCrMNXPAtXs1Z98p1i66EeiRQWxlTEPAhs";
const TWITTER_API_KEY = "**************************";

const YOUTUBE_CHANNEL_IDS = [
  "UC0gGr2lh1BR-nmiCdJPbEFQ",
  "UChoEDU4duXMa1gXSdMOMxKw",
  "UCo3BVo2qUIQbpGUrvPo2bSw"
];

const TWITTER_USER_IDS = [
  "1996213399236325376",
"1825223654361485312",
"2036716840718589952",
"1971660619498901506",
"2037275559894347776",
"1998247009996996609",
"1999413119249186821",
"2016372902380318720",
"2004100784611643395",
"2022275498139848704",
"2014338436342468608"
];

// ─────────────────────────────────────────────────────────────────────────────
// Theme tokens
// ─────────────────────────────────────────────────────────────────────────────

const YT_RED   = "#E53935";
const YT_LIGHT = "#FFEBEE";

const TW_BLUE  = "#1D9BF0";
const TW_LIGHT = "#E8F5FD";

// ─────────────────────────────────────────────────────────────────────────────
// YouTube API helpers
// ─────────────────────────────────────────────────────────────────────────────

const YT_BASE = "https://www.googleapis.com/youtube/v3";

async function ytFetchChannels(ids) {
  const res = await fetch(
    `${YT_BASE}/channels?part=snippet,statistics&id=${ids.join(",")}&key=${YOUTUBE_API_KEY}`
  );
  if (!res.ok) throw new Error(`YouTube API error ${res.status}`);
  return (await res.json()).items || [];
}

async function ytFetchRecentVideos(channelId, max = 6) {
  const chRes = await fetch(
    `${YT_BASE}/channels?part=contentDetails&id=${channelId}&key=${YOUTUBE_API_KEY}`
  );
  const chData = await chRes.json();
  const uploadsId = chData.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
  if (!uploadsId) return [];

  const plRes = await fetch(
    `${YT_BASE}/playlistItems?part=contentDetails&playlistId=${uploadsId}&maxResults=${max}&key=${YOUTUBE_API_KEY}`
  );
  const plData = await plRes.json();
  const videoIds = (plData.items || []).map((i) => i.contentDetails.videoId);
  if (!videoIds.length) return [];

  const vRes = await fetch(
    `${YT_BASE}/videos?part=snippet,statistics&id=${videoIds.join(",")}&key=${YOUTUBE_API_KEY}`
  );
  return (await vRes.json()).items || [];
}

// ─────────────────────────────────────────────────────────────────────────────
// Twitter API helpers  (twitterapi.io)
// ─────────────────────────────────────────────────────────────────────────────

const TW_BASE = "/.netlify/functions";

async function twFetchUsers(ids) {
  const res = await fetch(
    `${TW_BASE}/twitter-users?userIds=${ids.join(",")}`
  );

  const data = await res.json();

  if (data.status !== "success") {
    throw new Error(data.msg || "Twitter API error");
  }

  return data.users || [];
}

async function twFetchLastTweets(userId, count = 8) {
  const res = await fetch(
    `${TW_BASE}/twitter-tweets?userId=${userId}`
  );

  const data = await res.json();

  if (data.status !== "success") {
    throw new Error(data.message || "Twitter API error");
  }

  return (data.data.tweets || []).slice(0, count);
}
// ─────────────────────────────────────────────────────────────────────────────
// Formatters
// ─────────────────────────────────────────────────────────────────────────────

function fmt(n) {
  const num = parseInt(n || "0", 10);
  if (isNaN(num)) return "—";
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + "M";
  if (num >= 1_000) return (num / 1_000).toFixed(1) + "K";
  return num.toLocaleString();
}

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return `${Math.floor(days / 7)}w ago`;
}

function ytEngRate(stats) {
  const views    = parseInt(stats?.viewCount || "0");
  const likes    = parseInt(stats?.likeCount || "0");
  const comments = parseInt(stats?.commentCount || "0");
  if (!views) return "0%";
  return (((likes + comments) / views) * 100).toFixed(2) + "%";
}

function twEngRate(tweet) {
  const views  = tweet.viewCount || 0;
  if (!views) return "0%";
  const engage = (tweet.likeCount || 0) + (tweet.retweetCount || 0) + (tweet.replyCount || 0);
  return ((engage / views) * 100).toFixed(2) + "%";
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared UI atoms
// ─────────────────────────────────────────────────────────────────────────────

function Spinner({ color }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "3rem", gap: 12 }}>
      <div
        style={{
          width: 32, height: 32, borderRadius: "50%",
          border: `3px solid ${color}33`,
          borderTop: `3px solid ${color}`,
          animation: "spin 0.8s linear infinite",
        }}
      />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <span style={{ fontSize: 12, color: "var(--color-text-secondary,#888)" }}>Loading…</span>
    </div>
  );
}

function ErrorBanner({ message, color }) {
  return (
    <div style={{
      background: color + "18",
      border: `0.5px solid ${color}55`,
      borderRadius: 10, padding: "0.75rem 1rem",
      color, fontSize: 13, lineHeight: 1.6,
    }}>
      ⚠ {message}
    </div>
  );
}

function StatPill({ label, value, accent }) {
  return (
    <div style={{ background: "var(--color-background-secondary,#f5f5f3)", borderRadius: 8, padding: "8px 10px", textAlign: "center", flex: 1 }}>
      <div style={{ fontSize: 10, color: "var(--color-text-secondary,#888)", marginBottom: 3 }}>{label}</div>
      <div style={{ fontSize: 15, fontWeight: 600, color: accent || "var(--color-text-primary,#111)" }}>{value}</div>
    </div>
  );
}

function SectionLabel({ children }) {
  return (
    <div style={{
      fontSize: 11, fontWeight: 600, letterSpacing: "0.08em",
      color: "var(--color-text-secondary,#999)",
      textTransform: "uppercase", marginBottom: 10,
    }}>
      {children}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Icons
// ─────────────────────────────────────────────────────────────────────────────

function YTIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={YT_RED}>
      <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 0 0 .5 6.2 31 31 0 0 0 0 12a31 31 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1C4.5 20.5 12 20.5 12 20.5s7.5 0 9.4-.6a3 3 0 0 0 2.1-2.1A31 31 0 0 0 24 12a31 31 0 0 0-.5-5.8zM9.8 15.5V8.5l6.3 3.5-6.3 3.5z" />
    </svg>
  );
}

function TWIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={TW_BLUE}>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function BlueCheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill={TW_BLUE}>
      <path d="M22.25 12c0-1.43-.88-2.67-2.19-3.34.46-1.39.2-2.9-.81-3.91-1.01-1-2.52-1.26-3.91-.8-.66-1.31-1.9-2.2-3.34-2.2-1.43 0-2.68.89-3.34 2.19-1.4-.46-2.9-.2-3.91.81-1 1.01-1.26 2.52-.8 3.91-1.31.67-2.2 1.91-2.2 3.35 0 1.43.89 2.67 2.2 3.34-.46 1.39-.21 2.9.8 3.91 1.01 1 2.52 1.26 3.91.81.67 1.31 1.91 2.2 3.35 2.2 1.43 0 2.68-.89 3.33-2.19 1.4.45 2.9.2 3.91-.81 1.01-1.01 1.27-2.52.81-3.91 1.31-.67 2.2-1.91 2.2-3.35zm-12.36 3.86L7.29 13.2a.99.99 0 010-1.41.99.99 0 011.41 0l1.54 1.54 4.02-4.02a.99.99 0 011.41 0 .99.99 0 010 1.41l-4.72 4.72a1 1 0 01-1.42 0z" />
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Tab bar
// ─────────────────────────────────────────────────────────────────────────────

function TabBar({ tabs, active, onChange }) {
  return (
    <div style={{ display: "flex", borderBottom: "0.5px solid var(--color-border-tertiary,rgba(0,0,0,0.1))", marginBottom: "1.5rem" }}>
      {tabs.map((t) => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          style={{
            padding: "10px 20px", fontSize: 13,
            fontWeight: active === t.id ? 600 : 400,
            border: "none", background: "transparent", cursor: "pointer",
            color: active === t.id ? t.color : "var(--color-text-secondary,#888)",
            borderBottom: active === t.id ? `2px solid ${t.color}` : "2px solid transparent",
            marginBottom: -1, transition: "all 0.15s",
            display: "flex", alignItems: "center", gap: 7,
          }}
        >
          {t.icon} {t.label}
        </button>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Summary row
// ─────────────────────────────────────────────────────────────────────────────

function SummaryRow({ items }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4,minmax(0,1fr))", gap: 12, marginBottom: "1.5rem" }}>
      {items.map((s) => (
        <div key={s.label} style={{ background: "var(--color-background-secondary,#f5f5f3)", borderRadius: 8, padding: "1rem" }}>
          <div style={{ fontSize: 11, color: "var(--color-text-secondary,#888)", marginBottom: 5 }}>{s.label}</div>
          <div style={{ fontSize: 20, fontWeight: 600, color: "var(--color-text-primary,#111)" }}>{s.value}</div>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// YouTube tab
// ─────────────────────────────────────────────────────────────────────────────

function YoutubeTab() {
  const [channels,     setChannels]     = useState([]);
  const [videoMap,     setVideoMap]     = useState({});
  const [selectedId,   setSelectedId]   = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [videoLoading, setVideoLoading] = useState(false);
  const [error,        setError]        = useState(null);

  useEffect(() => {
    if (YOUTUBE_API_KEY === "YOUR_YOUTUBE_API_KEY_HERE") {
      setError("Please set YOUTUBE_API_KEY at the top of the file.");
      setLoading(false);
      return;
    }
    ytFetchChannels(YOUTUBE_CHANNEL_IDS)
      .then((items) => {
        setChannels(items);
        if (items.length) setSelectedId(items[0].id);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedId || videoMap[selectedId]) return;
    setVideoLoading(true);
    ytFetchRecentVideos(selectedId)
      .then((vids) => setVideoMap((p) => ({ ...p, [selectedId]: vids })))
      .catch((e) => setError(e.message))
      .finally(() => setVideoLoading(false));
  }, [selectedId]);

  if (loading) return <Spinner color={YT_RED} />;
  if (error)   return <ErrorBanner message={error} color={YT_RED} />;

  const totalSubs  = channels.reduce((s, c) => s + parseInt(c.statistics.subscriberCount  || 0), 0);
  const totalViews = channels.reduce((s, c) => s + parseInt(c.statistics.viewCount        || 0), 0);
  const totalVids  = channels.reduce((s, c) => s + parseInt(c.statistics.videoCount       || 0), 0);

  const selected = channels.find((c) => c.id === selectedId);
  const videos   = videoMap[selectedId] || [];

  return (
    <div>
      <SummaryRow items={[
        { label: "Channels tracked",  value: channels.length },
        { label: "Total subscribers", value: fmt(totalSubs)  },
        { label: "Total views",       value: fmt(totalViews) },
        { label: "Total videos",      value: fmt(totalVids)  },
      ]} />

      <SectionLabel>Channels — click to inspect</SectionLabel>
      <div style={{
        display: "grid",
        gridTemplateColumns: `repeat(${Math.min(channels.length, 3)},minmax(0,1fr))`,
        gap: 12, marginBottom: "1.5rem",
      }}>
        {channels.map((ch) => {
          const thumb    = ch.snippet.thumbnails?.medium?.url;
          const isActive = selectedId === ch.id;
          return (
            <div
              key={ch.id}
              onClick={() => setSelectedId(ch.id)}
              style={{
                background: "var(--color-background-primary,#fff)",
                border: isActive ? `2px solid ${YT_RED}` : "0.5px solid var(--color-border-tertiary,rgba(0,0,0,0.12))",
                borderRadius: 12, padding: "1.25rem", cursor: "pointer",
                boxShadow: isActive ? `0 0 0 3px ${YT_RED}22` : "none",
                transition: "box-shadow 0.15s, border-color 0.15s",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                {thumb
                  ? <img src={thumb} alt="" style={{ width: 44, height: 44, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
                  : <div style={{ width: 44, height: 44, borderRadius: "50%", background: YT_LIGHT, display: "flex", alignItems: "center", justifyContent: "center" }}><YTIcon size={20} /></div>
                }
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text-primary,#111)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {ch.snippet.title}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--color-text-secondary,#888)" }}>
                    {ch.snippet.customUrl || ch.id}
                  </div>
                </div>
                <YTIcon size={14} />
              </div>
              <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                <StatPill label="Subscribers" value={fmt(ch.statistics.subscriberCount)} accent={YT_RED} />
                <StatPill label="Videos"      value={fmt(ch.statistics.videoCount)} />
                <StatPill label="Views"       value={fmt(ch.statistics.viewCount)} />
              </div>
              <p style={{ fontSize: 12, color: "var(--color-text-secondary,#888)", lineHeight: 1.5, margin: 0, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                {ch.snippet.description || "No description."}
              </p>
            </div>
          );
        })}
      </div>

      {/* Video table */}
      {selected && (
        <div style={{ background: "var(--color-background-primary,#fff)", border: "0.5px solid var(--color-border-tertiary,rgba(0,0,0,0.12))", borderRadius: 12, padding: "1.25rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: "1rem" }}>
            <div style={{ width: 5, height: 20, background: YT_RED, borderRadius: 3, flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "var(--color-text-primary,#111)" }}>{selected.snippet.title}</div>
              <div style={{ fontSize: 11, color: "var(--color-text-secondary,#888)" }}>Recent uploads</div>
            </div>
          </div>

          {videoLoading ? <Spinner color={YT_RED} /> : (
            <div>
              <div style={{ display: "grid", gridTemplateColumns: "20px 80px 1fr 60px 60px 70px 72px", gap: 12, padding: "0 0 8px", borderBottom: `2px solid ${YT_LIGHT}`, fontSize: 10, fontWeight: 600, color: "var(--color-text-secondary,#aaa)", letterSpacing: "0.05em" }}>
                <span>#</span><span /><span>Title</span>
                <span style={{ textAlign: "right" }}>Views</span>
                <span style={{ textAlign: "right" }}>Likes</span>
                <span style={{ textAlign: "right" }}>Comments</span>
                <span style={{ textAlign: "right" }}>Eng.%</span>
              </div>
              {videos.map((v, i) => {
                const thumb = v.snippet.thumbnails?.medium?.url;
                return (
                  <a key={v.id} href={`https://youtube.com/watch?v=${v.id}`} target="_blank" rel="noreferrer" style={{ textDecoration: "none", color: "inherit" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: "0.5px solid var(--color-border-tertiary,rgba(0,0,0,0.07))" }}>
                      <div style={{ width: 20, textAlign: "center", fontSize: 12, fontWeight: 600, color: i < 3 ? YT_RED : "var(--color-text-secondary,#ccc)", flexShrink: 0 }}>{i + 1}</div>
                      {thumb && <img src={thumb} alt="" style={{ width: 80, height: 45, borderRadius: 6, objectFit: "cover", flexShrink: 0 }} />}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 500, color: "var(--color-text-primary,#111)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{v.snippet.title}</div>
                        <div style={{ fontSize: 11, color: "var(--color-text-secondary,#888)", marginTop: 2 }}>{timeAgo(v.snippet.publishedAt)}</div>
                      </div>
                      <div style={{ minWidth: 60, textAlign: "right" }}><span style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text-primary,#111)" }}>{fmt(v.statistics.viewCount)}</span></div>
                      <div style={{ minWidth: 60, textAlign: "right" }}><span style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text-primary,#111)" }}>{fmt(v.statistics.likeCount)}</span></div>
                      <div style={{ minWidth: 70, textAlign: "right" }}><span style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text-primary,#111)" }}>{fmt(v.statistics.commentCount)}</span></div>
                      <div style={{ minWidth: 72, textAlign: "right" }}><span style={{ fontSize: 13, fontWeight: 600, color: YT_RED }}>{ytEngRate(v.statistics)}</span></div>
                    </div>
                  </a>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Twitter tab
// ─────────────────────────────────────────────────────────────────────────────

function TwitterTab() {
  const [users,        setUsers]        = useState([]);
  const [tweetMap,     setTweetMap]     = useState({});
  const [selectedId,   setSelectedId]   = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [tweetLoading, setTweetLoading] = useState(false);
  const [error,        setError]        = useState(null);

  useEffect(() => {
  if (TWITTER_API_KEY === "YOUR_TWITTERAPI_IO_KEY_HERE") {
    setError("Please set TWITTER_API_KEY at the top of the file.");
    setLoading(false);
    return;
  }

  const timer = setTimeout(() => {
    twFetchUsers(TWITTER_USER_IDS)
      .then((u) => {
        setUsers(u);
        if (u.length) setSelectedId(u[0].id);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, 1000); // 👈 wait 5 seconds before first request

  return () => clearTimeout(timer);
}, []);

  useEffect(() => {
  if (!selectedId || tweetMap[selectedId]) return;

  setTweetLoading(true);

  const delay = setTimeout(() => {
    twFetchLastTweets(selectedId)
      .then((tweets) =>
        setTweetMap((p) => ({ ...p, [selectedId]: tweets }))
      )
      .catch((e) => setError(e.message))
      .finally(() => setTweetLoading(false));
  }, 1000); // 👈 1 second delay (tweak if needed)

  return () => clearTimeout(delay); // cleanup if user switches fast
}, [selectedId]);
  if (loading) return <Spinner color={TW_BLUE} />;
  if (error)   return <ErrorBanner message={error} color={TW_BLUE} />;

  const totalFollowers = users.reduce((s, u) => s + (u.followers       || 0), 0);
  const totalTweets    = users.reduce((s, u) => s + (u.statusesCount   || 0), 0);
  const totalLikes     = users.reduce((s, u) => s + (u.favouritesCount || 0), 0);
  const verified       = users.filter((u) => u.isBlueVerified).length;

  const selected = users.find((u) => u.id === selectedId);
  const tweets   = tweetMap[selectedId] || [];

  return (
    <div>
      <SummaryRow items={[
        { label: "Accounts tracked",  value: users.length          },
        { label: "Total followers",   value: fmt(totalFollowers)   },
        { label: "Total tweets",      value: fmt(totalTweets)      },
        { label: "Blue verified",     value: verified              },
      ]} />

      <SectionLabel>Accounts — click to inspect</SectionLabel>
      <div style={{
        display: "grid",
        gridTemplateColumns: `repeat(${Math.min(users.length, 3)},minmax(0,1fr))`,
        gap: 12, marginBottom: "1.5rem",
      }}>
        {users.map((u) => {
          const isActive = selectedId === u.id;
          return (
            <div
              key={u.id}
              onClick={() => setSelectedId(u.id)}
              style={{
                background: "var(--color-background-primary,#fff)",
                border: isActive ? `2px solid ${TW_BLUE}` : "0.5px solid var(--color-border-tertiary,rgba(0,0,0,0.12))",
                borderRadius: 12, padding: "1.25rem", cursor: "pointer",
                boxShadow: isActive ? `0 0 0 3px ${TW_BLUE}22` : "none",
                transition: "box-shadow 0.15s, border-color 0.15s",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                {u.profilePicture
                  ? <img src={u.profilePicture} alt="" style={{ width: 44, height: 44, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
                  : <div style={{ width: 44, height: 44, borderRadius: "50%", background: TW_LIGHT, display: "flex", alignItems: "center", justifyContent: "center" }}><TWIcon size={20} /></div>
                }
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text-primary,#111)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{u.name}</span>
                    {u.isBlueVerified && <BlueCheckIcon />}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--color-text-secondary,#888)" }}>@{u.userName}</div>
                </div>
                <TWIcon size={14} />
              </div>

              <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                <StatPill label="Followers"  value={fmt(u.followers)}       accent={TW_BLUE} />
                <StatPill label="Following"  value={fmt(u.following)} />
                <StatPill label="Tweets"     value={fmt(u.statusesCount)} />
              </div>

              <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                <StatPill label="Likes given" value={fmt(u.favouritesCount)} />
                <StatPill label="Media"       value={fmt(u.mediaCount)} />
                <StatPill label="Location"    value={u.location || "—"} />
              </div>

              <p style={{ fontSize: 12, color: "var(--color-text-secondary,#888)", lineHeight: 1.5, margin: 0, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                {u.description || "No bio."}
              </p>
            </div>
          );
        })}
      </div>

      {/* Tweet table */}
      {selected && (
        <div style={{ background: "var(--color-background-primary,#fff)", border: "0.5px solid var(--color-border-tertiary,rgba(0,0,0,0.12))", borderRadius: 12, padding: "1.25rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: "1rem" }}>
            <div style={{ width: 5, height: 20, background: TW_BLUE, borderRadius: 3, flexShrink: 0 }} />
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: "var(--color-text-primary,#111)" }}>@{selected.userName}</span>
                {selected.isBlueVerified && <BlueCheckIcon />}
              </div>
              <div style={{ fontSize: 11, color: "var(--color-text-secondary,#888)" }}>
                Recent tweets · {fmt(selected.statusesCount)} total · {fmt(selected.mediaCount)} media posts
              </div>
            </div>
          </div>

          {tweetLoading ? <Spinner color={TW_BLUE} /> : (
            <div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 60px 60px 70px 60px 72px", gap: 12, padding: "0 0 8px", borderBottom: `2px solid ${TW_LIGHT}`, fontSize: 10, fontWeight: 600, color: "var(--color-text-secondary,#aaa)", letterSpacing: "0.05em" }}>
                <span>Tweet</span>
                <span style={{ textAlign: "right" }}>Views</span>
                <span style={{ textAlign: "right" }}>Likes</span>
                <span style={{ textAlign: "right" }}>Retweets</span>
                <span style={{ textAlign: "right" }}>Replies</span>
                <span style={{ textAlign: "right" }}>Eng.%</span>
              </div>
              {tweets.length === 0 && (
                <div style={{ fontSize: 13, color: "var(--color-text-secondary,#aaa)", padding: "1rem 0" }}>No tweets found.</div>
              )
              
              }
              {console.log(tweetMap)}
              {tweets.map((tw) => (
                <a key={tw.id} href={tw.url} target="_blank" rel="noreferrer" style={{ textDecoration: "none", color: "inherit" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 60px 60px 70px 60px 72px", gap: 12, padding: "12px 0", borderBottom: "0.5px solid var(--color-border-tertiary,rgba(0,0,0,0.07))", alignItems: "start" }}>
                    <div>
                      <div style={{ fontSize: 13, color: "var(--color-text-primary,#111)", lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                        {tw.text}
                      </div>
                      <div style={{ fontSize: 11, color: "var(--color-text-secondary,#aaa)", marginTop: 3 }}>
                        {timeAgo(tw.createdAt)}{tw.isReply ? " · reply" : ""}
                      </div>
                    </div>
                    <div style={{ textAlign: "right", paddingTop: 2 }}><span style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text-primary,#111)" }}>{fmt(tw.viewCount)}</span></div>
                    <div style={{ textAlign: "right", paddingTop: 2 }}><span style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text-primary,#111)" }}>{fmt(tw.likeCount)}</span></div>
                    <div style={{ textAlign: "right", paddingTop: 2 }}><span style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text-primary,#111)" }}>{fmt(tw.retweetCount)}</span></div>
                    <div style={{ textAlign: "right", paddingTop: 2 }}><span style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text-primary,#111)" }}>{fmt(tw.replyCount)}</span></div>
                    <div style={{ textAlign: "right", paddingTop: 2 }}><span style={{ fontSize: 13, fontWeight: 600, color: TW_BLUE }}>{twEngRate(tw)}</span></div>
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Root
// ─────────────────────────────────────────────────────────────────────────────

export default function SocialDashboard() {
  const [tab, setTab] = useState("youtube");

  const tabs = [
    { id: "youtube", label: "YouTube",      color: YT_RED,  icon: <YTIcon size={14} /> },
    { id: "twitter", label: "Twitter / X",  color: TW_BLUE, icon: <TWIcon size={14} /> },
  ];

  return (
    <div style={{ padding: "1.5rem", maxWidth: 1100, margin: "0 auto", fontFamily: "var(--font-sans,system-ui)" }}>
      <div style={{ marginBottom: "1.5rem" }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, color: "var(--color-text-primary,#111)", margin: "0 0 4px" }}>
          Social Media Dashboard
        </h2>
        <p style={{ fontSize: 13, color: "var(--color-text-secondary,#888)", margin: 0 }}>
          YouTube Data API v3 &amp; twitterapi.io
        </p>
      </div>

      <TabBar tabs={tabs} active={tab} onChange={setTab} />

      {tab === "youtube" && <YoutubeTab />}
      {tab === "twitter" && <TwitterTab />}
    </div>
  );
}