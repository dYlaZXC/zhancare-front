import {NicknameEntryProps} from "./types";

export function NicknameEntry({
  nickname,
  onNicknameChange,
  onGenerate,
  loading,
  onStart,
}: NicknameEntryProps) {
  return (
    <div className="text-white mt-20 text-center max-w-md mx-auto">
      <h2 className="text-3xl font-bold mb-4">🧠 AI Викторина</h2>
      <input
        value={nickname}
        onChange={(e) => onNicknameChange(e.target.value)}
        className="px-4 py-2 mb-4 rounded-lg text-black w-full"
        placeholder="Введите никнейм"
      />
      <button
        onClick={onGenerate}
        disabled={loading}
        className="bg-gray-700 text-white px-4 py-2 rounded-lg mb-4"
      >
        {loading ? "Генерация..." : "🤖 Сгенерировать никнейм AI"}
      </button>
      <br />
      <button
        disabled={!nickname.trim()}
        onClick={onStart}
        className={`px-6 py-3 rounded-xl font-semibold ${
          nickname.trim()
            ? "bg-gradient-to-r from-blue-500 to-indigo-500 text-white hover:opacity-90"
            : "bg-gray-500 text-white cursor-not-allowed"
        }`}
      >
        🚀 Начать игру
      </button>
    </div>
  );
}
