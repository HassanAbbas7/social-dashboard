import { useState, useEffect, useCallback } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// CONFIG — edit these two values to get started
// ─────────────────────────────────────────────────────────────────────────────

const API_KEY = "AIzaSyCrMNXPAtXs1Z98p1i66EeiRQWxlTEPAhs";

const CHANNEL_IDS = [
  "UC0gGr2lh1BR-nmiCdJPbEFQ",
  "UChoEDU4duXMa1gXSdMOMxKw"
];

// ─────────────────────────────────────────────────────────────────────────────
// YouTube API helpers
// ─────────────────────────────────────────────────────────────────────────────

const YT = "https://www.googleapis.com/youtube/v3";

async function fetchChannels(ids) {
  const url = `${YT}/channels?part=snippet,statistics,brandingSettings&id=${ids.join(",")}&key=${API_KEY}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`YouTube API error: ${res.status}`);
  const data = await res.json();
  return data.items || [];
}

async function fetchRecentVideos(channelId, maxResults = 5) {
  // 1. get uploads playlist id
  const chRes = await fetch(
    `${YT}/channels?part=contentDetails&id=${channelId}&key=${API_KEY}`
  );
  const chData = await chRes.json();
  const uploadsId =
    chData.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
  if (!uploadsId) return [];

  // 2. get recent video ids from uploads playlist
  const plRes = await fetch(
    `${YT}/playlistItems?part=contentDetails&playlistId=${uploadsId}&maxResults=${maxResults}&key=${API_KEY}`
  );
  const plData = await plRes.json();
  const videoIds = (plData.items || []).map(
    (i) => i.contentDetails.videoId
  );
  if (!videoIds.length) return [];

  // 3. get video stats
  const vRes = await fetch(
    `${YT}/videos?part=snippet,statistics&id=${videoIds.join(",")}&key=${API_KEY}`
  );
  const vData = await vRes.json();
  return vData.items || [];
}

// ─────────────────────────────────────────────────────────────────────────────
// Formatters
// ─────────────────────────────────────────────────────────────────────────────

function fmt(n) {
  const num = parseInt(n || "0", 10);
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + "M";
  if (num >= 1_000) return (num / 1_000).toFixed(1) + "K";
  return num.toLocaleString();
}

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86_400_000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

function engagementRate(stats) {
  const views = parseInt(stats.viewCount || "0");
  const likes = parseInt(stats.likeCount || "0");
  const comments = parseInt(stats.commentCount || "0");
  if (!views) return "0%";
  return (((likes + comments) / views) * 100).toFixed(1) + "%";
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

const RED = "#E53935";
const RED_LIGHT = "#FFEBEE";
const RED_MID = "#EF9A9A";

function Spinner() {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "4rem", gap: 16 }}>
      <div style={{
        width: 36, height: 36, borderRadius: "50%",
        border: `3px solid ${RED_LIGHT}`,
        borderTop: `3px solid ${RED}`,
        animation: "spin 0.8s linear infinite",
      }} />
      <span style={{ fontSize: 13, color: "var(--color-text-secondary, #888)" }}>Fetching channel data…</span>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function ErrorBanner({ message }) {
  return (
    <div style={{
      background: RED_LIGHT, border: `0.5px solid ${RED_MID}`,
      borderRadius: 10, padding: "1rem 1.25rem", margin: "1rem 0",
      color: RED, fontSize: 13, lineHeight: 1.6,
    }}>
      <strong>Error:</strong> {message}
    </div>
  );
}

function YTIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={RED}>
      <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 0 0 .5 6.2 31 31 0 0 0 0 12a31 31 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1C4.5 20.5 12 20.5 12 20.5s7.5 0 9.4-.6a3 3 0 0 0 2.1-2.1A31 31 0 0 0 24 12a31 31 0 0 0-.5-5.8zM9.8 15.5V8.5l6.3 3.5-6.3 3.5z"/>
    </svg>
  );
}

function StatPill({ label, value }) {
  return (
    <div style={{
      background: "var(--color-background-secondary, #f5f5f3)",
      borderRadius: 8, padding: "8px 12px", textAlign: "center", flex: 1,
    }}>
      <div style={{ fontSize: 11, color: "var(--color-text-secondary, #888)", marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 16, fontWeight: 600, color: "var(--color-text-primary, #111)" }}>{value}</div>
    </div>
  );
}

function ChannelCard({ channel, videos, selected, onClick }) {
  const { snippet, statistics } = channel;
  const thumb = snippet.thumbnails?.medium?.url || snippet.thumbnails?.default?.url;
  const isActive = selected;

  return (
    <div
      onClick={onClick}
      style={{
        background: "var(--color-background-primary, #fff)",
        border: isActive ? `2px solid ${RED}` : "0.5px solid var(--color-border-tertiary, rgba(0,0,0,0.12))",
        borderRadius: 12, padding: "1.25rem",
        cursor: "pointer", transition: "border-color 0.15s, box-shadow 0.15s",
        boxShadow: isActive ? `0 0 0 3px ${RED}22` : "none",
      }}
    >
      {/* Avatar + name */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
        {thumb ? (
          <img src={thumb} alt={snippet.title} style={{ width: 48, height: 48, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
        ) : (
          <div style={{ width: 48, height: 48, borderRadius: "50%", background: RED_LIGHT, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <YTIcon size={22} />
          </div>
        )}
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: "var(--color-text-primary, #111)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {snippet.title}
          </div>
          <div style={{ fontSize: 12, color: "var(--color-text-secondary, #888)", marginTop: 2 }}>
            {snippet.customUrl || channel.id}
          </div>
        </div>
        <div style={{ marginLeft: "auto", flexShrink: 0 }}>
          <YTIcon size={16} />
        </div>
      </div>

      {/* Metrics row */}
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <StatPill label="Subscribers" value={fmt(statistics.subscriberCount)} />
        <StatPill label="Videos" value={fmt(statistics.videoCount)} />
        <StatPill label="Total views" value={fmt(statistics.viewCount)} />
      </div>

      {/* Description snippet */}
      <p style={{
        fontSize: 12, color: "var(--color-text-secondary, #888)",
        lineHeight: 1.5, margin: 0,
        display: "-webkit-box", WebkitLineClamp: 2,
        WebkitBoxOrient: "vertical", overflow: "hidden",
      }}>
        {snippet.description || "No description provided."}
      </p>
    </div>
  );
}

function VideoRow({ video, index }) {
  const { snippet, statistics } = video;
  const thumb = snippet.thumbnails?.medium?.url || snippet.thumbnails?.default?.url;

  return (
    <a
      href={`https://youtube.com/watch?v=${video.id}`}
      target="_blank"
      rel="noreferrer"
      style={{ textDecoration: "none", color: "inherit" }}
    >
      <div style={{
        display: "flex", alignItems: "center", gap: 14,
        padding: "12px 0",
        borderBottom: "0.5px solid var(--color-border-tertiary, rgba(0,0,0,0.08))",
        transition: "background 0.1s", borderRadius: 6,
      }}>
        {/* Rank */}
        <div style={{
          width: 24, textAlign: "center", fontSize: 13, fontWeight: 600,
          color: index < 3 ? RED : "var(--color-text-secondary, #aaa)", flexShrink: 0,
        }}>
          {index + 1}
        </div>

        {/* Thumbnail */}
        {thumb && (
          <img src={thumb} alt={snippet.title} style={{
            width: 80, height: 45, borderRadius: 6, objectFit: "cover", flexShrink: 0,
          }} />
        )}

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 13, fontWeight: 500, color: "var(--color-text-primary, #111)",
            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
          }}>
            {snippet.title}
          </div>
          <div style={{ fontSize: 11, color: "var(--color-text-secondary, #888)", marginTop: 3 }}>
            {timeAgo(snippet.publishedAt)}
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: "flex", gap: 16, flexShrink: 0, textAlign: "right" }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text-primary, #111)" }}>{fmt(statistics.viewCount)}</div>
            <div style={{ fontSize: 10, color: "var(--color-text-secondary, #aaa)" }}>views</div>
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text-primary, #111)" }}>{fmt(statistics.likeCount)}</div>
            <div style={{ fontSize: 10, color: "var(--color-text-secondary, #aaa)" }}>likes</div>
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text-primary, #111)" }}>{fmt(statistics.commentCount)}</div>
            <div style={{ fontSize: 10, color: "var(--color-text-secondary, #aaa)" }}>comments</div>
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: RED }}>{engagementRate(statistics)}</div>
            <div style={{ fontSize: 10, color: "var(--color-text-secondary, #aaa)" }}>eng. rate</div>
          </div>
        </div>
      </div>
    </a>
  );
}

function SummaryBar({ channels }) {
  const totalSubs = channels.reduce((s, c) => s + parseInt(c.statistics.subscriberCount || "0"), 0);
  const totalViews = channels.reduce((s, c) => s + parseInt(c.statistics.viewCount || "0"), 0);
  const totalVideos = channels.reduce((s, c) => s + parseInt(c.statistics.videoCount || "0"), 0);

  const cards = [
    { label: "Channels tracked", value: channels.length },
    { label: "Total subscribers", value: fmt(totalSubs) },
    { label: "Total video views", value: fmt(totalViews) },
    { label: "Total videos", value: fmt(totalVideos) },
  ];

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0,1fr))", gap: 12, marginBottom: "1.5rem" }}>
      {cards.map((c) => (
        <div key={c.label} style={{
          background: "var(--color-background-secondary, #f5f5f3)",
          borderRadius: 8, padding: "1rem",
        }}>
          <div style={{ fontSize: 12, color: "var(--color-text-secondary, #888)", marginBottom: 6 }}>{c.label}</div>
          <div style={{ fontSize: 22, fontWeight: 600, color: "var(--color-text-primary, #111)" }}>{c.value}</div>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────────────────

export default function YoutubeDashboard() {
  const [channels, setChannels] = useState([]);
  const [videoMap, setVideoMap] = useState({});   // channelId → video[]
  const [selectedId, setSelectedId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [videoLoading, setVideoLoading] = useState(false);

  // Initial channel fetch
  useEffect(() => {
    if (!API_KEY || API_KEY === "YOUR_YOUTUBE_API_KEY_HERE") {
      setError("Please set your YouTube Data API v3 key in the API_KEY constant at the top of the file.");
      setLoading(false);
      return;
    }
    setLoading(true);
    fetchChannels(CHANNEL_IDS)
      .then((items) => {
        setChannels(items);
        if (items.length > 0) setSelectedId(items[0].id);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  // Fetch videos when selected channel changes
  useEffect(() => {
    if (!selectedId) return;
    if (videoMap[selectedId]) return; // already fetched
    setVideoLoading(true);
    fetchRecentVideos(selectedId, 8)
      .then((vids) => setVideoMap((prev) => ({ ...prev, [selectedId]: vids })))
      .catch((e) => setError(e.message))
      .finally(() => setVideoLoading(false));
  }, [selectedId]);

  const selectedChannel = channels.find((c) => c.id === selectedId);
  const selectedVideos = videoMap[selectedId] || [];

  return (
    <div style={{ padding: "1.5rem", maxWidth: 1100, margin: "0 auto", fontFamily: "var(--font-sans, system-ui)" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: "1.5rem" }}>
        <YTIcon size={28} />
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 600, color: "var(--color-text-primary, #111)", margin: 0 }}>
            YouTube Channel Dashboard
          </h2>
          <p style={{ fontSize: 13, color: "var(--color-text-secondary, #888)", margin: "2px 0 0" }}>
            Tracking {CHANNEL_IDS.length} channel{CHANNEL_IDS.length !== 1 ? "s" : ""} · Powered by YouTube Data API v3
          </p>
        </div>
      </div>

      {/* Error */}
      {error && <ErrorBanner message={error} />}

      {/* Loading */}
      {loading && <Spinner />}

      {/* Content */}
      {!loading && !error && channels.length > 0 && (
        <>
          {/* Summary bar */}
          <SummaryBar channels={channels} />

          {/* Channel grid */}
          <div style={{ fontSize: 13, fontWeight: 500, color: "var(--color-text-secondary, #888)", marginBottom: 10 }}>
            Channels — click to inspect
          </div>
          <div style={{
            display: "grid",
            gridTemplateColumns: `repeat(${Math.min(channels.length, 3)}, minmax(0,1fr))`,
            gap: 12,
            marginBottom: "1.75rem",
          }}>
            {channels.map((ch) => (
              <ChannelCard
                key={ch.id}
                channel={ch}
                videos={videoMap[ch.id] || []}
                selected={selectedId === ch.id}
                onClick={() => setSelectedId(ch.id)}
              />
            ))}
          </div>

          {/* Selected channel detail */}
          {selectedChannel && (
            <div style={{
              background: "var(--color-background-primary, #fff)",
              border: "0.5px solid var(--color-border-tertiary, rgba(0,0,0,0.12))",
              borderRadius: 12, padding: "1.25rem",
            }}>
              {/* Panel header */}
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: "1rem" }}>
                <div style={{
                  width: 6, height: 22, background: RED, borderRadius: 3, flexShrink: 0,
                }} />
                <div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: "var(--color-text-primary, #111)" }}>
                    {selectedChannel.snippet.title}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--color-text-secondary, #888)" }}>
                    Recent uploads · sorted by publish date
                  </div>
                </div>
              </div>

              {/* Videos */}
              {videoLoading ? (
                <Spinner />
              ) : selectedVideos.length === 0 ? (
                <div style={{ fontSize: 13, color: "var(--color-text-secondary, #888)", padding: "1rem 0" }}>
                  No videos found for this channel.
                </div>
              ) : (
                <div>
                  {/* Table header */}
                  <div style={{
                    display: "grid",
                    gridTemplateColumns: "24px 80px 1fr 64px 64px 72px 72px",
                    gap: 14, padding: "0 0 8px",
                    borderBottom: `2px solid ${RED_LIGHT}`,
                    fontSize: 11, fontWeight: 500,
                    color: "var(--color-text-secondary, #aaa)",
                    letterSpacing: "0.04em",
                  }}>
                    <span>#</span>
                    <span />
                    <span>Title</span>
                    <span style={{ textAlign: "right" }}>Views</span>
                    <span style={{ textAlign: "right" }}>Likes</span>
                    <span style={{ textAlign: "right" }}>Comments</span>
                    <span style={{ textAlign: "right" }}>Eng. rate</span>
                  </div>
                  {selectedVideos.map((v, i) => (
                    <VideoRow key={v.id} video={v} index={i} />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* No channels found */}
          {channels.length === 0 && !loading && (
            <div style={{ fontSize: 13, color: "var(--color-text-secondary, #888)", padding: "2rem", textAlign: "center" }}>
              No channels found. Check that your channel IDs are correct.
            </div>
          )}
        </>
      )}
    </div>
  );
}