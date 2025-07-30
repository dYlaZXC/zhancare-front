import {LeaderboardProps} from "./types";

export function Leaderboard({ score, nickname, leaderboard, onRestart }: LeaderboardProps) {
  return (
    <div className="text-white text-center mt-20 max-w-xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">⏱ Время вышло!</h2>
      <p className="mb-2">Вы набрали: <strong>{score}</strong> баллов</p>
      <div className="bg-white/10 p-4 rounded-xl mt-4 text-left">
        <h3 className="text-xl font-bold mb-2 text-center">🏅 Топ-10</h3>
        <ul>
          {leaderboard.map((entry, idx) => (
            <li key={idx} className="mb-1">
              {idx + 1}. {entry.nickname} — {entry.score}
            </li>
          ))}
        </ul>
      </div>
      <button
        onClick={onRestart}
        className="mt-6 px-6 py-2 bg-blue-500 text-white rounded-xl"
      >
        🔁 Начать заново
      </button>
    </div>
  );
}
