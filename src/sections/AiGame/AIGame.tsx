"use client";

import { useEffect, useState, useCallback } from "react";
import { NicknameEntry } from "./NicknameEntry";
import { TimerScorePanel } from "./TimerScorePanel";
import { QuestionDisplay } from "./QuestionDisplay";
import { Leaderboard } from "./Leaderboard";
import { motion } from "framer-motion";
import { Score, Question } from "./types";
import { api } from "@/utils/api";

export default function AIGame() {
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
  const [leaderboard, setLeaderboard] = useState<Score[]>([]);

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
      // Send the API request
      const response = await api.post("/sessions/generate_question/");
    
      // The response is now already a valid Question object, no need for JSON.parse
      const { symptoms, correct_answer, wrong_answers } = response.data;
    
      // Shuffle the options, ensuring the correct answer is included
      const options = shuffleArray(
        Array.from(new Set([correct_answer, ...wrong_answers]))
      ).slice(0, 3);
    
      if (!options.includes(correct_answer)) {
        options[Math.floor(Math.random() * 3)] = correct_answer;
      }
    
      // Prepare the question object for display
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
      correct
        ? "✅ Правильно!"
        : `❌ Неверно. Правильный ответ: ${question?.answer}`
    );
  };

  const saveToLeaderboard = useCallback(async () => {
    try {
      await api.post("/sessions/submit/", {
        nickname,
        score,
      });

      const res = await api.get("/sessions/leaderboard/");
      setLeaderboard(res.data);
    } catch (e) {
      console.warn("Ошибка при отправке результатов или загрузке лидерборда");
    }
  }, [nickname, score]);

  const handleGenerateNickname = async () => {
    setLoadingNick(true);
    try {
      const res = await api.post("/sessions/generate_nickname/");
      setNickname(res.data.nickname || "NeuroFalcon");
    } catch {
      setNickname("NeuroFalcon");
    } finally {
      setLoadingNick(false);
    }
  };

  const resetGame = () => {
    setStarted(false);
    setScore(0);
    setTimeLeft(60);
    setQuestion(null);
    setDisplayedSymptoms("");
    setTypedOptions([]);
    setSelected(null);
    setResult(null);
    setError("");
    setLeaderboard([]);
  };

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (started && timeLeft > 0) {
      timer = setTimeout(() => setTimeLeft((t) => t - 1), 1000);
    } else if (started && timeLeft === 0) {
      saveToLeaderboard();
    }
    return () => clearTimeout(timer);
  }, [started, timeLeft, saveToLeaderboard]);

  // === RENDER ===

  if (!started) {
    return (
      <NicknameEntry
        nickname={nickname}
        onNicknameChange={setNickname}
        loading={loadingNick}
        onGenerate={handleGenerateNickname}
        onStart={() => {
          setStarted(true);
          fetchNewUniqueQuestion();
        }}
      />
    );
  }

  if (timeLeft === 0) {
    return (
      <Leaderboard
        score={score}
        nickname={nickname}
        leaderboard={leaderboard}
        onRestart={resetGame}
      />
    );
  }

  return (
    <motion.div
      className="bg-white/10 backdrop-blur-lg p-6 sm:p-8 rounded-2xl shadow-xl text-white max-w-2xl mx-auto mt-12"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <TimerScorePanel timeLeft={timeLeft} score={score} />
      {loading ? (
        <p className="text-center text-white/70">Загрузка вопроса...</p>
      ) : error ? (
        <div className="text-red-300 text-center">{error}</div>
      ) : question ? (
        <QuestionDisplay
          symptoms={displayedSymptoms}
          options={typedOptions}
          answer={question.answer}
          selected={selected}
          typing={typing}
          result={result}
          onSelect={handleSelect}
          onNext={fetchNewUniqueQuestion}
        />
      ) : null}
    </motion.div>
  );
}
