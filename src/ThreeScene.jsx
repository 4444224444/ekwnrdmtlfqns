// src/ThreeScene.jsx
import { Suspense, useMemo } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  Environment,
  useGLTF,
  Center,
  ScrollControls,
  useScroll,
  Scroll,
} from "@react-three/drei";

// GLTF 폴더형 기준: public/models/scene.gltf + scene.bin + textures/
const MODEL_URL = `${import.meta.env.BASE_URL}models/scene.gltf`;

/* -------------------- 3D 모델 -------------------- */
function Model() {
  const { scene } = useGLTF(MODEL_URL);
  // Center가 모델 중심/스케일을 보기 좋게 보정한다
  return (
    <Center>
      <primitive object={scene} dispose={null} />
    </Center>
  );
}
useGLTF.preload(MODEL_URL);

/* --------------- 카메라 리그(이동+홀드) --------------- */
function CameraRig() {
  const { camera } = useThree();
  const scroll = useScroll();

  // 보고 싶은 시점들(키포인트)
  // 필요한 만큼 추가/수정 가능
  const keys = useMemo(
    () => [
      { name: "front", pos: new THREE.Vector3(180, 180, 180), look: new THREE.Vector3(0, 0, 0),  fov: 50 },
      { name: "right", pos: new THREE.Vector3(140,  50, 250), look: new THREE.Vector3(0, 20, 0), fov: 60 },
      { name: "left",  pos: new THREE.Vector3(-220, 70, 160), look: new THREE.Vector3(0, 25, 0), fov: 40 },
      { name: "top",   pos: new THREE.Vector3(0,  360,  90),  look: new THREE.Vector3(0, 0, 0),  fov: 55 },
    ],
    []
  );

  // 타임라인(비율). 합은 1일 필요는 없음. pages로 스크롤 길이를 보정하면 된다.
  // moveDur[i]: keys[i] -> keys[i+1] 이동 시간
  // holdDur[i]: keys[i] 위치에서 머무는 시간
  const { segments, total } = useMemo(() => {
    const moveDur = [0.18, 0.18, 0.18];          // 3회 이동
    const holdDur = [0.16, 0.22, 0.22, 0.18];    // 4개 지점 머무는 시간(원하면 더 길게)
    const segs = [];
    let acc = 0;

    // 첫 지점에서 홀드
    segs.push({ type: "hold", keyIndex: 0, start: acc, end: (acc += holdDur[0]) });

    // 이동 → 홀드 반복
    for (let i = 0; i < keys.length - 1; i++) {
      segs.push({ type: "move", from: i, to: i + 1, start: acc, end: (acc += moveDur[i]) });
      segs.push({ type: "hold", keyIndex: i + 1, start: acc, end: (acc += holdDur[i + 1]) });
    }
    return { segments: segs, total: acc };
  }, [keys]);

  // 부드러운 이징
  const easeInOut = (x) => 0.5 * (1 - Math.cos(Math.PI * x));

  useFrame(() => {
    // 0~1 스크롤 → 0~total 타임라인으로 매핑
    const time = scroll.offset * total;

    // 현재 구간(세그먼트) 탐색
    const seg =
      segments.find((s) => time >= s.start && time <= s.end) || segments.at(-1);

    if (seg.type === "hold") {
      const k = keys[seg.keyIndex];
      camera.position.lerp(k.pos, 0.25);
      camera.lookAt(k.look);
      camera.fov = THREE.MathUtils.lerp(camera.fov, k.fov, 0.25);
      camera.updateProjectionMatrix();
      return;
    }

    // move: a→b 보간
    const a = keys[seg.from];
    const b = keys[seg.to];
    const local = (time - seg.start) / (seg.end - seg.start); // 0~1
    const f = easeInOut(THREE.MathUtils.clamp(local, 0, 1));

    const pos = a.pos.clone().lerp(b.pos, f);
    const look = a.look.clone().lerp(b.look, f);
    const fov = THREE.MathUtils.lerp(a.fov, b.fov, f);

    camera.position.lerp(pos, 0.18);
    camera.lookAt(look);
    camera.fov = THREE.MathUtils.lerp(camera.fov, fov, 0.18);
    camera.updateProjectionMatrix();
  });

  return null;
}

/* -------------------- 텍스트 오버레이(보임 보강판) -------------------- */
function Overlay() {
  const scroll = useScroll();

  // 각 카드가 보일 스크롤 구간과 위치를 마음대로 조정
  const items = [
    {
      start: 0.00, end: 0.30, // 시작 구간을 넉넉하게
      title: "Front View",
      desc: "정면에서 전체 비율을 확인한다.",
      style: { top: "14vh", left: "50%", transform: "translateX(-50%)" },
    },
    {
      start: 0.30, end: 0.55,
      title: "Right Side",
      desc: "우측에서 구조와 깊이를 살핀다.",
      style: { top: "70vh", left: "8vw" },
    },
    {
      start: 0.55, end: 0.82,
      title: "Left Side",
      desc: "좌측에서 실루엣과 레이어를 점검한다.",
      style: { top: "22vh", right: "8vw" },
    },
    {
      start: 0.82, end: 1.00,
      title: "Top View",
      desc: "위에서 전체 배치를 조망한다.",
      style: { bottom: "10vh", left: "50%", transform: "translateX(-50%)" },
    },
  ];

  // 부드러운 페이드. 최소 0.001로 깜빡임/완전투명 방지
  const alphaFor = (s, e, t) => {
    const w = Math.max(e - s, 1e-6);
    const a = (t - s) / w;
    const edge = 0.08; // 페이드 폭
    let val = 0;
    if (a > 0 && a < 1) {
      if (a < edge) val = a / edge;
      else if (a > 1 - edge) val = (1 - a) / edge;
      else val = 1;
    }
    return Math.max(val, 0.001); // 레이어가 보이도록 최소값
  };

  const t = THREE.MathUtils.clamp(scroll.offset, 0, 1);

  const Card = ({ title, desc, style, alpha }) => (
    <div
      style={{
        position: "absolute",
        width: "min(640px, 86vw)",
        padding: "16px 20px",
        borderRadius: 14,
        background: "rgba(8, 12, 18, 0.72)",
        backdropFilter: "blur(6px)",
        border: "1px solid rgba(255,255,255,0.08)",
        color: "#e9eff6",
        opacity: alpha,
        transition: "opacity 120ms linear",
        pointerEvents: alpha > 0.2 ? "auto" : "none",
        zIndex: 1000, // ← 캔버스 위로
        ...style,
      }}
    >
      <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 6 }}>{title}</div>
      <div style={{ fontSize: 14, lineHeight: 1.6, opacity: 0.9 }}>{desc}</div>
    </div>
  );

  // 오버레이 루트 컨테이너 자체도 zIndex/포지션을 확실히
  return (
    <Scroll html>
      <div
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 1000,   // ← 최상단
          pointerEvents: "none",
        }}
      >
        {items.map((it, i) => (
          <Card
            key={i}
            title={it.title}
            desc={it.desc}
            style={it.style}
            alpha={alphaFor(it.start, it.end, t)}
          />
        ))}
      </div>
    </Scroll>
  );
}

/* -------------------- 씬 루트 -------------------- */
export default function ThreeScene() {
  return (
    <Canvas camera={{ position: [140, 50, 250], fov: 50, near: 0.1, far: 2000 }}>
      <color attach="background" args={["#0b0f14"]} />
      <ambientLight intensity={0.5} />
      <directionalLight position={[3, 5, 2]} intensity={1.2} />

      <Suspense fallback={null}>
        {/* 스크롤 길이가 짧으면 pages 값을 더 키우면 된다(예: 6~8) */}
        <ScrollControls pages={6} damping={0.25}>
          <Model />
          <CameraRig />
          <Overlay />
        </ScrollControls>

        <Environment preset="city" />
      </Suspense>
      {/* OrbitControls는 사용하지 않는다(마우스 확대/회전/이동 잠금) */}
    </Canvas>
  );
}
