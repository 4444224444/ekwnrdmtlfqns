import { useState, useRef } from "react";
import { useScroll } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";

/**
 * TIMELINE: { segments:[{type:'hold'|'move', s,e, key?, a?, b?}], total:number }
 * -> 이거 무슨 말이애요??? 이건 나도 모르겠어 시발ㅋㅋㅋㅋ
 * 반환: { time, sceneIndex(-1|0..N-1), phase: 'idle'|'enter'|'steady'|'exit' }
 * -> 대충 우리 유니티에서 배웟던 걸 응용??한다고 생각하면 될까 시픔...
 */
export function useTimelineController(TIMELINE, opts = {}) {
  const { segments, total } = TIMELINE;
  const enterRatio = opts.enterRatio ?? 0.01;  
  const exitRatio  = opts.exitRatio  ?? 0.01;   
  const hysteresis = opts.hysteresis ?? 0.02;  

  const scroll = useScroll();

  const [state, setState] = useState({
    time: 0,
    sceneIndex: -1,
    phase: "idle", 
  });
  const prevRef = useRef(state);

  useFrame(() => {
    const time = Math.max(0, Math.min(1, scroll.offset)) * total;
    const seg =
      segments.find((s) => time >= s.s && time <= s.e) ??
      segments[segments.length - 1];

    const next = { ...prevRef.current, time };

    if (seg.type === "move") {
      next.sceneIndex = -1;
      next.phase = "idle";
    } else {
      // hold
      const L = seg.e - seg.s;
      const p = (time - seg.s) / L; // 0..1
      const enterEnd = enterRatio + hysteresis;
      const exitStart = 1 - exitRatio - hysteresis;

      next.sceneIndex = seg.key;
      next.phase = p < enterEnd ? "enter" : p > exitStart ? "exit" : "steady";
    }

    const prev = prevRef.current;
    if (
      prev.sceneIndex !== next.sceneIndex ||
      prev.phase !== next.phase ||
      prev.time !== next.time
    ) {
      prevRef.current = next;
      setState(next);
    }
  });

  return state;
}

