import {TimerScorePanelProps} from "./types";

export function TimerScorePanel({ timeLeft, score }: TimerScorePanelProps) {
  return (
    <div className="flex justify-between items-center mb-6">
      <div className="relative w-14 h-14">
        <svg className="w-full h-full" viewBox="0 0 36 36">
          <path
            className="text-gray-700"
            stroke="currentColor"
            strokeWidth="3"
            fill="none"
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
          />
          <path
            className="text-blue-500"
            stroke="currentColor"
            strokeWidth="3"
            fill="none"
            strokeDasharray={`${(timeLeft / 60) * 100}, 100`}
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
          />
          <text x="18" y="22" textAnchor="middle" fontSize="10" fill="#fff" className="font-bold">
            {timeLeft}
          </text>
        </svg>
      </div>
      <div className="text-white/80 text-sm font-medium">🏅 Очки: {score}</div>
    </div>
  );
}
