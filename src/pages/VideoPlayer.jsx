import YouTube from "react-youtube";
import { useRef, useEffect } from "react";
import "./VideoPlayer.css";

export default function VideoPlayer({ video, extractVideoID, onClose }) {
  const playerRef = useRef(null);
  const videoId = video ? extractVideoID(video.url) : null;

  /* ===== Player Ready ===== */
  const onPlayerReady = (event) => {
    playerRef.current = event.target;

    const isTouchDevice =
      "ontouchstart" in window || navigator.maxTouchPoints > 0;

    if (isTouchDevice) {
      event.target.mute(); // 行動裝置預設靜音
    } else {
      event.target.unMute();
      event.target.setVolume(100);
    }

    // ❌ 不要在這裡 play（避免新人進來重播）
  };

  /* ===== 行動裝置：首次觸控解除靜音 ===== */
  useEffect(() => {
    const isTouchDevice =
      "ontouchstart" in window || navigator.maxTouchPoints > 0;

    if (!isTouchDevice) return;

    const handleTouch = () => {
      if (playerRef.current) {
        playerRef.current.unMute();
        playerRef.current.setVolume(100);
      }
      window.removeEventListener("touchstart", handleTouch);
    };

    window.addEventListener("touchstart", handleTouch);
    return () => window.removeEventListener("touchstart", handleTouch);
  }, []);

  /* ===== 只有「影片真的換了」才播放 ===== */
  const lastVideoIdRef = useRef(null);

  useEffect(() => {
    if (!playerRef.current || !videoId) return;

    if (lastVideoIdRef.current !== videoId) {
      playerRef.current.playVideo(); // ✅ 換歌才播
      lastVideoIdRef.current = videoId;
    }
  }, [videoId]);

  return (
    <div className="video-player-float">
      {videoId ? (
        <>
          <YouTube
            videoId={videoId}
            onReady={onPlayerReady}
            opts={{
              width: "100%",
              height: "100%",
              playerVars: {
                autoplay: 0, // ❌ 關掉自動播放
                playsinline: 1,
                controls: 1,
                rel: 0,
                muted: 0,
              },
            }}
          />

          <div className="video-info">
            🎧 正在播放（由 {video.user?.name || "未知"} 點播）
            <button className="close-btn" onClick={onClose}>
              ✖
            </button>
          </div>
        </>
      ) : (
        <div className="video-placeholder">🎬 尚未播放影片</div>
      )}
    </div>
  );
}
