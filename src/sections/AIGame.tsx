"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

const API_KEY = "QqkMxELY0YVGkCx17Vya04Sq9nGvCahu";
const ENDPOINT = "https://api.mistral.ai/v1/chat/completions";

interface Question {
  symptoms: string;
  options: string[];
  answer: string;
}

interface Score {
  nickname: string;
  score: number;
}

interface AIGameProps {
  onGameStart?: () => void;
}

export default function AIGame({ onGameStart }: AIGameProps) {
  const [nickname, setNickname] = useState("");
  const [loadingNick, setLoadingNick] = useState(false);
  const [started, setStarted] = useState(false);
  const [question, setQuestion] = useState<Question | null>(null);
  const [displayedSymptoms, setDisplayedSymptoms] = useState("");
  const [typedOptions, setTypedOptions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [typing, setTyping] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  const shuffleArray = (arr: string[]) =>
    arr
      .map((value) => ({ value, sort: Math.random() }))
      .sort((a, b) => a.sort - b.sort)
      .map(({ value }) => value);

  const simulateTyping = (symptoms: string, options: string[]) => {
    setTyping(true);
    setDisplayedSymptoms("");
    setTypedOptions([]);
    let i = 0;

    const typeSymptom = () => {
      if (i <= symptoms.length) {
        setDisplayedSymptoms(symptoms.substring(0, i));
        i++;
        setTimeout(typeSymptom, 25);
      } else {
        typeOptions(0);
      }
    };

    const typeOptions = (j: number) => {
      if (j < options.length) {
        setTypedOptions((prev) => [...prev, options[j]]);
        setTimeout(() => typeOptions(j + 1), 250);
      } else {
        setTyping(false);
      }
    };

    typeSymptom();
  };

  const fetchNewUniqueQuestion = async () => {
    setLoading(true);
    setError("");
    setResult(null);
    setSelected(null);
    setDisplayedSymptoms("");
    setTypedOptions([]);

    try {
      const now = new Date().toISOString();
      const prompt = `
Сгенерируй медицинский вопрос для викторины. Верни JSON строго в формате:
{
  "symptoms": "описание симптомов",
  "correct_answer": "правильный диагноз",
  "wrong_answers": ["неправильный1", "неправильный2"]
}
Дата: ${now}
⚠️ Только JSON. Без пояснений.
`;

      const response = await fetch(ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${API_KEY}`,
        },
        body: JSON.stringify({
          model: "open-mistral-nemo",
          temperature: 0.8,
          top_p: 1,
          max_tokens: 400,
          messages: [
            {
              role: "system",
              content: "Ты создаешь медицинские викторины.",
            },
            {
              role: "user",
              content: prompt,
            },
          ],
        }),
      });

      const json = await response.json();
      const content = json.choices?.[0]?.message?.content ?? "";
      const data = JSON.parse(content);
      const { symptoms, correct_answer, wrong_answers } = data;

      const options = shuffleArray(
        Array.from(new Set([correct_answer, ...wrong_answers]))
      ).slice(0, 3);
      if (!options.includes(correct_answer)) {
        options[Math.floor(Math.random() * 3)] = correct_answer;
      }

      const q: Question = {
        symptoms: symptoms.trim(),
        answer: correct_answer,
        options,
      };

      setQuestion(q);
      simulateTyping(q.symptoms, q.options);
    } catch (err) {
      console.error(err);
      setError("❌ Ошибка генерации вопроса.");
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (option: string) => {
    if (selected || typing) return;
    setSelected(option);
    const correct = option === question?.answer;
    if (correct) setScore((s) => s + 1);
    setResult(
      correct ? "✅ Правильно!" : `❌ Неверно. Правильный ответ: ${question?.answer}`
    );
  };

  const saveToLeaderboard = () => {
    const existing: Score[] = JSON.parse(localStorage.getItem("leaderboard") || "[]");
    const updated = [...existing];

    const existingIndex = updated.findIndex((entry) => entry.nickname === nickname);

    if (existingIndex !== -1) {
      if (score > updated[existingIndex].score) {
        updated[existingIndex].score = score;
      }
    } else {
      updated.push({ nickname, score });
    }

    updated.sort((a, b) => b.score - a.score);
    localStorage.setItem("leaderboard", JSON.stringify(updated.slice(0, 10)));
  };

  const resetGame = () => {
    setStarted(false);
    setScore(0);
    setTimeLeft(60);
    setShowLeaderboard(false);
    setQuestion(null);
    setDisplayedSymptoms("");
    setTypedOptions([]);
    setSelected(null);
    setResult(null);
    setError("");
  };

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (started && timeLeft > 0) {
      timer = setTimeout(() => setTimeLeft((t) => t - 1), 1000);
    } else if (started && timeLeft === 0) {
      saveToLeaderboard();
    }
    return () => clearTimeout(timer);
  }, [started, timeLeft]);

  const handleGenerateNickname = async () => {
      setLoadingNick(true);
      const MAX_ATTEMPTS = 5;
    
      const getLeaderboardNicknames = (): string[] => {
        const leaderboard: Score[] = JSON.parse(localStorage.getItem("leaderboard") || "[]");
        return leaderboard.map((entry) => entry.nickname.toLowerCase());
      };
  
      const isUnique = (nickname: string, existing: string[]) =>
        !existing.includes(nickname.toLowerCase());
  
      try {
        const promptBase = `Придумай уникальный никнейм на английском в стиле: CyberDoctor, PsychoTiger. Только ник.`;
    
        const leaderboardNicknames = getLeaderboardNicknames();
        let attempt = 0;
        let uniqueNick = "";
    
        while (attempt < MAX_ATTEMPTS) {
          const prompt =
            attempt === 0
              ? promptBase
              : `${promptBase} Он не должен совпадать с уже существующими никами: ${leaderboardNicknames.join(", ")}.`;
        
          const response = await fetch(ENDPOINT, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${API_KEY}`,
            },
            body: JSON.stringify({
              model: "open-mistral-nemo",
              temperature: 0.7,
              top_p: 1,
              messages: [
                { role: "system", content: "Ты генератор никнеймов." },
                { role: "user", content: prompt },
              ],
            }),
          });
      
          const json = await response.json();
          const raw = json.choices?.[0]?.message?.content?.trim() ?? "";
          const cleanNick = raw.replace(/^"|"$/g, "");
      
          if (cleanNick && isUnique(cleanNick, leaderboardNicknames)) {
            uniqueNick = cleanNick;
            break;
          }
      
          attempt++;
        }
    
        setNickname(uniqueNick || "NeuroFalcon");
      } catch {
        setNickname("NeuroFalcon");
      } finally {
        setLoadingNick(false);
      }
    };


  // === RENDER UI ===

  if (!started) {
    return (
      <div className="text-white mt-20 text-center max-w-md mx-auto">
        <h2 className="text-3xl font-bold mb-4">🧠 AI Викторина</h2>
        <input
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          className="px-4 py-2 mb-4 rounded-lg text-black w-full"
          placeholder="Введите никнейм"
        />
        <button
          onClick={handleGenerateNickname}
          disabled={loadingNick}
          className="bg-gray-700 text-white px-4 py-2 rounded-lg mb-4"
        >
          {loadingNick ? "Генерация..." : "🤖 Сгенерировать никнейм AI"}
        </button>
        <br />
        <button
          disabled={!nickname.trim()}
          onClick={() => {
            setStarted(true);
            fetchNewUniqueQuestion();
            onGameStart?.();
          }}
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

  if (timeLeft === 0) {
    const leaderboard = JSON.parse(localStorage.getItem("leaderboard") || "[]");
    return (
      <div className="text-white text-center mt-20 max-w-xl mx-auto">
        <h2 className="text-2xl font-bold mb-4">⏱ Время вышло!</h2>
        <p className="mb-2">Вы набрали: <strong>{score}</strong> баллов</p>
        <div className="bg-white/10 p-4 rounded-xl mt-4 text-left">
          <h3 className="text-xl font-bold mb-2 text-center">🏅 Топ-10</h3>
          <ul>
            {leaderboard.map((entry: Score, idx: number) => (
              <li key={idx} className="mb-1">
                {idx + 1}. {entry.nickname} — {entry.score}
              </li>
            ))}
          </ul>
        </div>
        <button
          onClick={resetGame}
          className="mt-6 px-6 py-2 bg-blue-500 text-white rounded-xl"
        >
          🔁 Начать заново
        </button>
      </div>
    );
  }

  return (
    <motion.div
      className="bg-white/10 backdrop-blur-lg p-6 sm:p-8 rounded-2xl shadow-xl text-white max-w-2xl mx-auto mt-12"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex justify-between items-center mb-6">
        {/* Circular Timer */}
        <div className="relative w-14 h-14">
          <svg className="w-full h-full" viewBox="0 0 36 36">
            <path
              className="text-gray-700"
              stroke="currentColor"
              strokeWidth="3"
              fill="none"
              d="M18 2.0845
                 a 15.9155 15.9155 0 0 1 0 31.831
                 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
            <path
              className="text-blue-500"
              stroke="currentColor"
              strokeWidth="3"
              fill="none"
              strokeDasharray={`${(timeLeft / 60) * 100}, 100`}
              d="M18 2.0845
                 a 15.9155 15.9155 0 0 1 0 31.831
                 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
            <text
              x="18"
              y="22"
              textAnchor="middle"
              fontSize="10"
              fill="#fff"
              className="font-bold"
            >
              {timeLeft}
            </text>
          </svg>
        </div>

        <div className="text-white/80 text-sm font-medium">
          🏅 Очки: {score}
        </div>
      </div>

      <h3 className="text-xl font-bold mb-4 text-center">
        Угадай диагноз по симптомам
      </h3>

      {loading ? (
        <p className="text-center text-white/70">Загрузка вопроса...</p>
      ) : error ? (
        <div className="text-red-300 text-center">{error}</div>
      ) : (
        <>
          <p className="mb-6 text-center text-white/90 text-lg min-h-[48px]">
            <strong>Симптомы:</strong> {displayedSymptoms}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {typedOptions.map((option, idx) => {
              const isCorrect = selected && option === question?.answer;
              const isWrong = selected && option === selected && !isCorrect;

              return (
                <motion.button
                  key={idx}
                  whileTap={{ scale: 0.97 }}
                  disabled={!!selected || typing}
                  onClick={() => handleSelect(option)}
                  className={`w-full px-4 py-3 rounded-lg font-medium text-center border transition break-words ${
                    isCorrect
                      ? "bg-green-500 border-green-400 text-white"
                      : isWrong
                      ? "bg-red-500 border-red-400 text-white"
                      : "bg-white text-black border-transparent hover:bg-gray-100"
                  } disabled:opacity-70`}
                >
                  {option}
                </motion.button>
              );
            })}
          </div>

          {result && (
            <motion.p
              className="mt-6 text-lg text-center font-semibold"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              {result}
            </motion.p>
          )}

          {result && (
            <div className="flex justify-center mt-6">
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => fetchNewUniqueQuestion()}
                className="bg-gradient-to-r from-white to-gray-200 text-black px-6 py-2 rounded-lg font-semibold hover:opacity-90"
              >
                Следующий вопрос →
              </motion.button>
            </div>
          )}
        </>
      )}
    </motion.div>
  );
}
