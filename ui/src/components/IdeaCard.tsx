import { useRef, useState } from "react";
import type { Idea, Heat } from "../data/ideas";
import { CELL_W, CELL_H } from "../data/grid";
import "./IdeaCard.css";

const HEAT_LABELS: Record<Heat, string> = {
  shipped: "Shipped",
  "in-progress": "Blocked",
  validated: "In Progress",
  raw: "Backlog",
  parked: "Parked",
};

const CARD_PAD = 16;
const DRAG_THRESHOLD = 6;

interface Props {
  idea: Idea;
  scale: number;
  isNext: boolean;
  query: string;
  onSelect: (idea: Idea, x: number, y: number) => void;
  onMove: (key: string, col: number, row: number) => void;
}

export default function IdeaCard({ idea, scale, isNext, query, onSelect, onMove }: Props) {
  const wiggleDuration = 3 + idea.wiggleOffset * 2.5;
  const wiggleDelay = -(idea.wiggleOffset * wiggleDuration);

  const matched = !query || [idea.title, idea.key, idea.issueType]
    .some(s => s?.toLowerCase().includes(query.toLowerCase()));

  const [isDragging, setIsDragging] = useState(false);
  const [snapCol, setSnapCol] = useState(idea.col);
  const [snapRow, setSnapRow] = useState(idea.row);
  const [bopKey, setBopKey] = useState(0);

  const dragStart = useRef({ clientX: 0, clientY: 0 });
  const wasDragged = useRef(false);
  const currentSnap = useRef({ col: idea.col, row: idea.row });

  const displayCol = isDragging ? snapCol : idea.col;
  const displayRow = isDragging ? snapRow : idea.row;

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!idea.key) return;
    e.stopPropagation();
    wasDragged.current = false;
    dragStart.current = { clientX: e.clientX, clientY: e.clientY };
    currentSnap.current = { col: idea.col, row: idea.row };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!e.buttons || !idea.key) return;
    const dx = e.clientX - dragStart.current.clientX;
    const dy = e.clientY - dragStart.current.clientY;
    if (!wasDragged.current && Math.hypot(dx, dy) < DRAG_THRESHOLD) return;

    if (!wasDragged.current) {
      wasDragged.current = true;
      setIsDragging(true);
      setBopKey(k => k + 1); // initial bop on lift
    }

    const newCol = idea.col + Math.round((dx / scale) / CELL_W);
    const newRow = idea.row + Math.round((dy / scale) / CELL_H);

    if (newCol !== currentSnap.current.col || newRow !== currentSnap.current.row) {
      currentSnap.current = { col: newCol, row: newRow };
      setSnapCol(newCol);
      setSnapRow(newRow);
      setBopKey(k => k + 1);
    }
  };

  const onPointerUp = () => {
    if (!wasDragged.current || !idea.key) return;
    setIsDragging(false);
    onMove(idea.key, currentSnap.current.col, currentSnap.current.row);
    wasDragged.current = false;
  };

  const onClick = (e: React.MouseEvent) => {
    if (wasDragged.current) { wasDragged.current = false; return; }
    e.stopPropagation();
    onSelect(idea, e.clientX, e.clientY);
  };

  return (
    <div
      className={`idea-card idea-card--${idea.heat}${isDragging ? " idea-card--dragging" : ""}`}
      style={{
        left: displayCol * CELL_W + CARD_PAD,
        top: displayRow * CELL_H + CARD_PAD,
        width: CELL_W - CARD_PAD * 2,
        minHeight: CELL_H - CARD_PAD * 2,
        animationDuration: `${wiggleDuration}s`,
        animationDelay: `${wiggleDelay}s`,
        animationPlayState: isDragging ? "paused" : "running",
        cursor: isDragging ? "grabbing" : idea.key ? "grab" : undefined,
        userSelect: "none",
        opacity: matched ? 1 : 0.1,
        transition: "opacity 0.2s ease",
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onClick={onClick}
    >
      {/* key remount restarts the bop animation each cell crossing */}
      <div key={bopKey} className={isDragging ? "idea-card__bop" : "idea-card__inner"}>
        <div className="idea-card__toprow">
          <span className="idea-card__heat-dot" />
          {idea.key && <span className="idea-card__key">{idea.key}</span>}
          {isNext && <span className="idea-card__next-badge">↑ Next</span>}
        </div>
        <p className="idea-card__title">{idea.title}</p>
        <div className="idea-card__footer">
          <span className="idea-card__badge">{HEAT_LABELS[idea.heat]}</span>
          {idea.issueType && <span className="idea-card__type">{idea.issueType}</span>}
        </div>
      </div>
    </div>
  );
}
