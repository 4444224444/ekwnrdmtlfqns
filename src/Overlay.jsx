import React from "react";

// KEYS 수(4개)에 맞춘 카드 데이터 + 개별 스타일
const overlayData = [
  { id: 0, title: "요기 첫번째에다가", subtitle: "이렇게띄우면", body: "되던데 캬아아아아아아아아아악",
    style: { color: "yellow", fontSize: "5.5rem", textAlign: "left" } },
  { id: 1, title: "ㅈㄴ졸려", subtitle: "아름다운이땅에금수강산에", body: "집에가자ㅈ제발내소원",
    style: { color: "red", fontSize: "2.5rem", textAlign: "center" } },
  { id: 2, title: "자퇴하실분", subtitle: "저요저요저요저요저요저요저요저요", body: "이런썅칼!!집에보내줘근데졸업도시켜줘",
    style: { color: "blue", fontSize: "4.5rem", textAlign: "right" } },
  { id: 3, title: "쌀국수", subtitle: "엌ㅋㅋㅋㅋ", body: "조희원바부안나희바부",
    style: { color: "green", fontSize: "1.5rem", textAlign: "center" } },
];

export default function Overlay({ sceneIndex, phase }) {
  if (sceneIndex < 0 || sceneIndex >= overlayData.length) return null;
  const card = overlayData[sceneIndex];

  return (
    <div className="overlay-root">
      <div className={`card ${phase}`} style={card.style}>
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
          opacity: 0; transform: translateY(12px);
          transition: opacity 300ms ease, transform 300ms ease;
        }
        .card.enter, .card.steady { opacity: 1; transform: translateY(0); }
        .card.exit { opacity: 0; transform: translateY(-8px); }

        .kicker { opacity: .9; margin-bottom: .5rem; }
        .title  {  2.5rem; font-weight: bold; margin: .25rem 0; }
        .body   {  1.5rem; margin-top: .5rem; }
      `}</style>
    </div>
  );
}
