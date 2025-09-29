import { Suspense, useState, useEffect } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  Environment,
  useGLTF,
  Center,
  ScrollControls,
  useScroll,
} from "@react-three/drei";

import Overlay from "./Overlay";
import { useTimelineController } from "./useTimeline";

// 카메라 전환되는 거 어디다가 할지 끄아아아아아아아아아
const KEYS = [
  { pos: new THREE.Vector3(180, 180, 180), look: new THREE.Vector3(0, 0, 0), fov: 50 }, // 1번째
  { pos: new THREE.Vector3(140, 50, 250), look: new THREE.Vector3(0, 20, 0), fov: 60 }, // 2번째
  { pos: new THREE.Vector3(-220, 70, 160), look: new THREE.Vector3(0, 25, 0), fov: 40 }, // 3번째
  { pos: new THREE.Vector3(0, 360, 90), look: new THREE.Vector3(0, 0, 0), fov: 55 }, // 4번째
];

const MOVE_DUR = [1.8, 1.8, 1.8]; // 이건 움직이는 거
const HOLD_DUR = [0.5, 0.5, 0.5, 0.5]; // 얼마나 홀드되어잇을건지 초 정하는 거

const TIMELINE = (() => {
  const segs = [];
  let t = 0;
  segs.push({ type: "hold", key: 0, s: t, e: (t += HOLD_DUR[0]) });
  for (let i = 0; i < KEYS.length - 1; i++) {
    segs.push({ type: "move", a: i, b: i + 1, s: t, e: (t += MOVE_DUR[i]) });
    segs.push({ type: "hold", key: i + 1, s: t, e: (t += HOLD_DUR[i + 1]) });
  }
  return { segments: segs, total: t };
})();

const ease = (x) => 0.5 * (1 - Math.cos(Math.PI * x));
const MODEL_URL = `${import.meta.env.BASE_URL}models/scene.gltf`;

/* 요기블록이쓰리디모델불러오는거 */
function Model() {
  const { scene } = useGLTF(MODEL_URL);
  return (
    <Center>
      <primitive object={scene} dispose={null} />
    </Center>
  );
}
useGLTF.preload(MODEL_URL);

/* 카메라 설정씨발럼아 */
function CameraRig() {
  const { camera } = useThree();
  const scroll = useScroll();
  const { segments, total } = TIMELINE;

  useFrame(() => {
    const time = THREE.MathUtils.clamp(scroll.offset, 0, 1) * total;
    const seg =
      segments.find((s) => time >= s.s && time <= s.e) ?? segments.at(-1);

    if (seg.type === "hold") {
      const k = KEYS[seg.key];
      camera.position.lerp(k.pos, 0.2);
      camera.lookAt(k.look);
      camera.fov = THREE.MathUtils.lerp(camera.fov, k.fov, 0.2);
      camera.updateProjectionMatrix();
      return;
    }

    const a = KEYS[seg.a], b = KEYS[seg.b];
    const f = ease((time - seg.s) / (seg.e - seg.s));
    const pos = a.pos.clone().lerp(b.pos, f);
    const look = a.look.clone().lerp(b.look, f);
    const fov = THREE.MathUtils.lerp(a.fov, b.fov, f);

    camera.position.lerp(pos, 0.12);
    camera.lookAt(look);
    camera.fov = THREE.MathUtils.lerp(camera.fov, fov, 0.12);
    camera.updateProjectionMatrix();
  });

  return null;
}

/**
 * 컨트롤러 결과를 부모(ThreeScene) state로 "끌어올리는" 브리지
 *  솔직히 뭔 개소린지 잘은 모르겟는데 부모로 끌어올려야 렌더가 잘 된대요 원리가 뭘까
 * - ScrollControls 자식이어야 useScroll 사용 가능함!! 이거 기억!!
 * - DOM을 렌더하지 않고 onChange로만 부모에 값을 전달해서 띄우기 이것도 기억!!!!
 */
function ControllerBridge({ onChange }) {
  const { sceneIndex, phase } = useTimelineController(TIMELINE, {
    enterRatio: 0.2, exitRatio: 0.2, hysteresis: 0.02,
  });

  useEffect(() => {
    onChange({ sceneIndex, phase });
  }, [sceneIndex, phase, onChange]);

  return null;
}

export default function ThreeScene() {
  // Overlay는 Canvas "밖"에서 렌더하고 그 상태를 부모에 보관을 해야댐;; ㅈㄴ어렵뉴
  const [overlayState, setOverlayState] = useState({ sceneIndex: -1, phase: "idle" });

  return (
    <>
      <Canvas camera={{ position: [140, 50, 250], fov: 50, near: 0.1, far: 2000 }}>
        <color attach="background" args={["#0b0f14"]} />
        <ambientLight intensity={0.5} />
        <directionalLight position={[3, 5, 2]} intensity={1.2} />

        <Suspense fallback={null}>
          <ScrollControls pages={6} damping={0.12}>
            <Model />
            <CameraRig />
            {/* 부모 state만 갱신하기*/}
            <ControllerBridge onChange={setOverlayState} />
          </ScrollControls>
          <Environment preset="city" />
        </Suspense>
      </Canvas>

      {/* DOM 오버레이는 Canvas 밖에 둬야 렌더가 제대로 된대요 암튼 그렇대 */}
      <Overlay sceneIndex={overlayState.sceneIndex} phase={overlayState.phase} />
    </>
  );
}
