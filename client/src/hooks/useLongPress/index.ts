import { useCallback, useRef } from "react";

interface UseLongPressOptions {
  threshold?: number; // 長押しと判定する時間 (ms)
  onLongPress: (e: any) => void; // 長押し成功時のコールバック
  onClick?: (e: any) => void; // 通常タップ時のコールバック
  moveThreshold?: number; // 指が何px動いたらキャンセルするか
}

export const useLongPress = ({
  threshold = 500,
  onLongPress,
  onClick,
  moveThreshold = 10,
}: UseLongPressOptions) => {
  const timerRef = useRef<ReturnType<typeof setTimeout>>(threshold);
  const isLongPressActive = useRef(false);
  const startPos = useRef<{ x: number; y: number } | null>(null);

  const start = useCallback(
    (e: any) => {
      // 🚀 右クリック（button: 2）ならタイマーを開始しない
      if (e.button && e.button !== 0) return;

      isLongPressActive.current = false;
      const { clientX, clientY } = e.touches ? e.touches[0] : e;
      startPos.current = { x: clientX, y: clientY };

      timerRef.current = setTimeout(() => {
        onLongPress(e);
        isLongPressActive.current = true;
      }, threshold);
    },
    [onLongPress, threshold],
  );

  const stop = useCallback(
    (e: any) => {
      if (timerRef.current) clearTimeout(timerRef.current);

      // 🚀 マウスイベントの場合、左クリック（button: 0）以外は onClick を走らせない
      const isLeftClick = e.button === 0 || e.type.includes("touch");

      if (
        !isLongPressActive.current &&
        onClick &&
        e.type.includes("up") &&
        isLeftClick
      ) {
        onClick(e);
      }

      isLongPressActive.current = false;
      startPos.current = null;
    },
    [onClick],
  );

  const move = useCallback(
    (e: any) => {
      if (!startPos.current) return;
      const { clientX, clientY } = e.touches ? e.touches[0] : e;

      // 移動距離を計算
      const dist = Math.sqrt(
        Math.pow(clientX - startPos.current.x, 2) +
          Math.pow(clientY - startPos.current.y, 2),
      );

      // 一定以上動いたら「スクロール」とみなしてタイマー解除
      if (dist > moveThreshold) {
        if (timerRef.current) clearTimeout(timerRef.current);
      }
    },
    [moveThreshold],
  );

  return {
    onMouseDown: start,
    onMouseUp: stop,
    onMouseLeave: stop,
    onTouchStart: start,
    onTouchEnd: stop,
    onTouchMove: move,
  };
};
