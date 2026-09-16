"use client";

/**
 * The section dock: a macOS-style dock that magnifies the item under the
 * pointer. Adapted from React Bits' <Dock /> (reactbits.dev, MIT).
 *
 * Changed from the original, each for a reason:
 *   - Imports `framer-motion`, not `motion`. They are the same library under two
 *     package names, and PDGMS-Frontend already ships framer-motion 12, so the
 *     port adds no dependency.
 *   - TypeScript, and a CSS module instead of global `.dock-*` classes, which
 *     would collide with anything else in the app using the same names.
 *   - An `active` flag per item, so the dock shows which section is on screen.
 *   - The outer strip lets clicks through. The original grows a full-width box
 *     up to 256px tall on hover, which would swallow clicks on the page under it.
 *   - `placement="top"` mirrors it: items grow downward and the label shows
 *     under the icon. At the top the strip keeps a fixed height, because a strip
 *     that grows on hover there would push the page down under the reader.
 */

import {
  AnimatePresence,
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  type MotionValue,
  type SpringOptions,
} from "framer-motion";
import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import styles from "./Dock.module.css";

export interface DockItemData {
  icon: ReactNode;
  label: string;
  onClick: () => void;
  active?: boolean;
  className?: string;
}

interface DockProps {
  items: DockItemData[];
  className?: string;
  distance?: number;
  panelHeight?: number;
  baseItemSize?: number;
  dockHeight?: number;
  magnification?: number;
  spring?: SpringOptions;
  placement?: "top" | "bottom";
}

function DockItem({
  item,
  mouseX,
  spring,
  distance,
  magnification,
  baseItemSize,
  placement,
}: {
  item: DockItemData;
  mouseX: MotionValue<number>;
  spring: SpringOptions;
  distance: number;
  magnification: number;
  baseItemSize: number;
  placement: "top" | "bottom";
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isHovered = useMotionValue(0);

  const mouseDistance = useTransform(mouseX, (val) => {
    const rect = ref.current?.getBoundingClientRect() ?? { x: 0, width: baseItemSize };
    return val - rect.x - baseItemSize / 2;
  });
  const targetSize = useTransform(
    mouseDistance,
    [-distance, 0, distance],
    [baseItemSize, magnification, baseItemSize]
  );
  const size = useSpring(targetSize, spring);

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      item.onClick();
    }
  };

  return (
    <motion.div
      ref={ref}
      style={{ width: size, height: size }}
      onHoverStart={() => isHovered.set(1)}
      onHoverEnd={() => isHovered.set(0)}
      onFocus={() => isHovered.set(1)}
      onBlur={() => isHovered.set(0)}
      onClick={item.onClick}
      onKeyDown={onKeyDown}
      className={`${styles.item} ${item.active ? styles.itemOn : ""} ${item.className ?? ""}`}
      tabIndex={0}
      role="button"
      aria-label={item.label}
      aria-current={item.active ? "true" : undefined}
    >
      <div className={styles.icon}>{item.icon}</div>
      <DockLabel isHovered={isHovered} placement={placement}>
        {item.label}
      </DockLabel>
    </motion.div>
  );
}

function DockLabel({
  children,
  isHovered,
  placement,
}: {
  children: ReactNode;
  isHovered: MotionValue<number>;
  placement: "top" | "bottom";
}) {
  const lift = placement === "top" ? 10 : -10;
  const [visible, setVisible] = useState(false);
  useEffect(() => isHovered.on("change", (v) => setVisible(v === 1)), [isHovered]);
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 0 }}
          animate={{ opacity: 1, y: lift }}
          exit={{ opacity: 0, y: 0 }}
          transition={{ duration: 0.2 }}
          className={placement === "top" ? `${styles.label} ${styles.labelBelow}` : styles.label}
          role="tooltip"
          style={{ x: "-50%" }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function Dock({
  items,
  className = "",
  spring = { mass: 0.1, stiffness: 150, damping: 12 },
  magnification = 70,
  distance = 200,
  panelHeight = 68,
  dockHeight = 256,
  baseItemSize = 50,
  placement = "bottom",
}: DockProps) {
  const top = placement === "top";
  const mouseX = useMotionValue(Infinity);
  const isHovered = useMotionValue(0);

  const maxHeight = useMemo(
    () => Math.max(dockHeight, magnification + magnification / 2 + 4),
    [magnification, dockHeight]
  );
  const heightRow = useTransform(isHovered, [0, 1], [panelHeight, maxHeight]);
  const height = useSpring(heightRow, spring);

  return (
    <motion.div
      style={top ? { height: panelHeight } : { height }}
      className={top ? `${styles.outer} ${styles.outerTop}` : styles.outer}
    >
      <motion.div
        onMouseMove={({ pageX }) => {
          isHovered.set(1);
          mouseX.set(pageX);
        }}
        onMouseLeave={() => {
          isHovered.set(0);
          mouseX.set(Infinity);
        }}
        className={`${styles.panel} ${top ? styles.panelTop : ""} ${className}`}
        style={{ height: panelHeight }}
        role="toolbar"
        aria-label="Sections"
      >
        {items.map((item, i) => (
          <DockItem
            key={i}
            item={item}
            mouseX={mouseX}
            spring={spring}
            distance={distance}
            magnification={magnification}
            baseItemSize={baseItemSize}
            placement={placement}
          />
        ))}
      </motion.div>
    </motion.div>
  );
}
