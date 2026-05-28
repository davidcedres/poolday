import { CELL_W, CELL_H } from "../data/grid";
import "./BlankCard.css";

const CARD_PAD = 16;

interface Props {
  col: number;
  row: number;
  dist: number; // distance from origin in grid units
}

export default function BlankCard({ col, row, dist }: Props) {
  // Opacity fades as distance increases
  const opacity = dist <= 8
    ? 0.55
    : dist <= 14
    ? 0.30
    : 0.13;

  return (
    <div
      className="blank-card"
      style={{
        left: col * CELL_W + CARD_PAD,
        top: row * CELL_H + CARD_PAD,
        width: CELL_W - CARD_PAD * 2,
        height: CELL_H - CARD_PAD * 2,
        opacity,
      }}
    />
  );
}
