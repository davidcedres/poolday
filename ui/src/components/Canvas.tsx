import { useRef, useState, useCallback, useEffect, useMemo } from "react";
import type { Idea } from "../data/ideas";
import { CELL_W, CELL_H, GRID_HALF, RENDER_RADIUS } from "../data/grid";
import IdeaCard from "./IdeaCard";
import BlankCard from "./BlankCard";
import IssuePanel from "./IssuePanel";
import "./Canvas.css";

interface Props {
  ideas: Idea[];
  query: string;
  onMove: (key: string, col: number, row: number) => void;
}

const MIN_SCALE = 0.18;
const MAX_SCALE = 2.5;
const INITIAL_SCALE = 0.75;

export default function Canvas({ ideas, query, onMove }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(INITIAL_SCALE);
  const [viewSize, setViewSize] = useState({ w: window.innerWidth, h: window.innerHeight });

  const [selected, setSelected] = useState<{ idea: Idea; x: number; y: number } | null>(null);

  const dragging = useRef(false);
  const last = useRef({ x: 0, y: 0 });

  // Centre canvas on mount and track resize
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => {
      setViewSize({ w: el.clientWidth, h: el.clientHeight });
      setOffset({ x: el.clientWidth / 2, y: el.clientHeight / 2 });
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Build idea lookup: "col,row" → Idea
  const ideaMap = useMemo(() => {
    const m = new Map<string, Idea>();
    for (const idea of ideas) m.set(`${idea.col},${idea.row}`, idea);
    return m;
  }, [ideas]);

  // The "next" issue is the lowest-ranked non-blocked item
  const nextKey = useMemo(() => {
    const backlog = ideas.filter(i => i.heat !== "in-progress" && i.rank != null);
    if (!backlog.length) return null;
    return backlog.reduce((a, b) => (a.rank! < b.rank! ? a : b)).key ?? null;
  }, [ideas]);

  // Compute which cells are visible in the current viewport
  const visibleCells = useMemo(() => {
    const cells: Array<{ col: number; row: number; dist: number; idea: Idea | null }> = [];

    // World-space bounds of the viewport
    const wx0 = -offset.x / scale;
    const wx1 = (viewSize.w - offset.x) / scale;
    const wy0 = -offset.y / scale;
    const wy1 = (viewSize.h - offset.y) / scale;

    const buf = 2; // extra cells outside viewport for smooth pan
    const colMin = Math.max(-GRID_HALF, Math.floor(wx0 / CELL_W) - buf);
    const colMax = Math.min(GRID_HALF - 1, Math.ceil(wx1 / CELL_W) + buf);
    const rowMin = Math.max(-GRID_HALF, Math.floor(wy0 / CELL_H) - buf);
    const rowMax = Math.min(GRID_HALF - 1, Math.ceil(wy1 / CELL_H) + buf);

    for (let row = rowMin; row <= rowMax; row++) {
      for (let col = colMin; col <= colMax; col++) {
        const dist = Math.sqrt(col * col + row * row);
        if (dist > RENDER_RADIUS) continue;
        const idea = ideaMap.get(`${col},${row}`) ?? null;
        cells.push({ col, row, dist, idea });
      }
    }
    return cells;
  }, [offset, scale, viewSize, ideaMap]);

  // ── Pan ────────────────────────────────────────────────────────
  const onMouseDown = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest(".idea-card, .issue-panel")) return;
    setSelected(null);
    dragging.current = true;
    last.current = { x: e.clientX, y: e.clientY };
    e.preventDefault();
  }, []);

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragging.current) return;
    const dx = e.clientX - last.current.x;
    const dy = e.clientY - last.current.y;
    last.current = { x: e.clientX, y: e.clientY };
    setOffset(o => ({ x: o.x + dx, y: o.y + dy }));
  }, []);

  const stopDrag = useCallback(() => { dragging.current = false; }, []);

  // ── Zoom ───────────────────────────────────────────────────────
  const onWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    setScale(prev => {
      const next = Math.min(MAX_SCALE, Math.max(MIN_SCALE, prev * (1 - e.deltaY * 0.001)));
      const ratio = next / prev;
      setOffset(o => ({ x: mx + (o.x - mx) * ratio, y: my + (o.y - my) * ratio }));
      return next;
    });
  }, []);

  // ── Touch ──────────────────────────────────────────────────────
  const lastTouch = useRef<{ x: number; y: number; dist: number } | null>(null);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      lastTouch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY, dist: 0 };
    } else if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      lastTouch.current = {
        x: (e.touches[0].clientX + e.touches[1].clientX) / 2,
        y: (e.touches[0].clientY + e.touches[1].clientY) / 2,
        dist: Math.hypot(dx, dy),
      };
    }
  }, []);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    if (!lastTouch.current) return;
    if (e.touches.length === 1) {
      const dx = e.touches[0].clientX - lastTouch.current.x;
      const dy = e.touches[0].clientY - lastTouch.current.y;
      setOffset(o => ({ x: o.x + dx, y: o.y + dy }));
      lastTouch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY, dist: 0 };
    } else if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.hypot(dx, dy);
      const ratio = dist / lastTouch.current.dist;
      setScale(s => Math.min(MAX_SCALE, Math.max(MIN_SCALE, s * ratio)));
      lastTouch.current = {
        x: (e.touches[0].clientX + e.touches[1].clientX) / 2,
        y: (e.touches[0].clientY + e.touches[1].clientY) / 2,
        dist,
      };
    }
  }, []);

  return (
    <div
      ref={containerRef}
      className="canvas"
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={stopDrag}
      onMouseLeave={stopDrag}
      onWheel={onWheel}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={() => { lastTouch.current = null; }}
    >
      <div
        className="canvas__world"
        style={{ transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})` }}
      >
        {visibleCells.map(({ col, row, dist, idea }) =>
          idea
            ? <IdeaCard key={`${col},${row}`} idea={idea} scale={scale} isNext={idea.key === nextKey} query={query} onSelect={(idea, x, y) => setSelected({ idea, x, y })} onMove={onMove} />
            : <BlankCard key={`${col},${row}`} col={col} row={row} dist={dist} />
        )}
      </div>

      <div className="canvas__zoom-hint">{Math.round(scale * 100)}%</div>

      {selected && (
        <IssuePanel
          idea={selected.idea}
          x={selected.x}
          y={selected.y}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}
