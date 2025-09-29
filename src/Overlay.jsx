import React from "react";

// KEYS 수(4개)에 맞춘 카드 데이터
const overlayData = [
  { id: 0, title: "FRONT", subtitle: "첫 번째 씬", body: "여기에 첫 번째 설명을 채워 넣으세요." },
  { id: 1, title: "RIGHT", subtitle: "두 번째 씬", body: "두 번째 키프레임 도착 시 나타납니다." },
  { id: 2, title: "LEFT",  subtitle: "세 번째 씬", body: "이동 중에는 아무 카드도 보이지 않습니다." },
  { id: 3, title: "TOP",   subtitle: "네 번째 씬", body: "hold 구간 중앙에서 또렷하게 유지됩니다." },
];

export default function Overlay({ sceneIndex, phase }) {
  if (sceneIndex < 0 || sceneIndex >= overlayData.length) return null;
  const card = overlayData[sceneIndex];

  return (
    <div className="overlay-root">
      <div className={`card ${phase}`}>
        <div className="kicker">{card.subtitle}</div>
        <h2 className="title">{card.title}</h2>
        <p className="body">{card.body}</p>
      </div>

      <style>{`
        .overlay-root {
          position: fixed; inset: 0; display: grid; place-items: center;
          pointer-events: none; z-index: 10;
        }
        .card {
          max-width: 36rem; width: min(90vw, 36rem);
          background: rgba(12,16,22,0.6);
          backdrop-filter: blur(6px);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 16px; padding: 20px 24px; color: #e9f1fa;
          opacity: 0; transform: translateY(8px);
          transition: opacity 300ms ease, transform 300ms ease;
        }
        .card.enter, .card.steady { opacity: 1; transform: translateY(0); }
        .card.exit { opacity: 0; transform: translateY(-4px); }

        .kicker { font-size: 0.85rem; letter-spacing: .12em; opacity: .8; }
        .title { margin: 6px 0 8px; font-size: clamp(20px, 4vw, 32px); line-height: 1.15; }
        .body  { line-height: 1.6; opacity: .9; }
      `}</style>
    </div>
  );
}
