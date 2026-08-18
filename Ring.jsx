import React from "react";
import { fmt } from "./portions";

export default function Ring({ value, target, color, label, sub }) {
  const size = 74, stroke = 8, r = (size - stroke) / 2, c = 2 * Math.PI * r;
  const pct = target > 0 ? Math.min(1, value / target) : 0;
  const over = target > 0 && value > target;
  return (
    <div className="ring-wrap">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#E7E1D2" strokeWidth={stroke} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke={over ? "#B4443C" : color} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c * (1 - pct)}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: "stroke-dashoffset 0.4s ease" }}
        />
        <text x="50%" y="47%" textAnchor="middle" className="ring-num" fill="#2B2A25">{fmt(value)}</text>
        <text x="50%" y="65%" textAnchor="middle" className="ring-den" fill="#8A8672">/{sub}</text>
      </svg>
      <div className="ring-label" style={{ color }}>{label}</div>
    </div>
  );
}
