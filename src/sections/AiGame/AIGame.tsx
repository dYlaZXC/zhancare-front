"use client";

import { useEffect, useState, useCallback } from "react";
import { NicknameEntry } from "./NicknameEntry";
import { TimerScorePanel } from "./TimerScorePanel";
import { QuestionDisplay } from "./QuestionDisplay";
import { Leaderboard } from "./Leaderboard";
import { motion } from "framer-motion";
import { Score, Question } from "./types";
import { api } from "@/utils/api";
import heroVideo from "@/assets/hero-video.mp4";

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
      // Send the API request with explanation request
      const response = await api.post("/sessions/generate_question/", {
        include_explanation: true
      });
    
      // The response is now already a valid Question object, no need for JSON.parse
      const { symptoms, correct_answer, wrong_answers, explanation } = response.data;
    
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
        explanation: explanation || undefined,
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
    // Only run timer if game is started, time is left, AND not currently typing/loading AND no question is answered
    if (started && timeLeft > 0 && !typing && !loading && !selected) {
      timer = setTimeout(() => setTimeLeft((t) => t - 1), 1000);
    } else if (started && timeLeft === 0) {
      saveToLeaderboard();
    }
    return () => clearTimeout(timer);
  }, [started, timeLeft, typing, loading, selected, saveToLeaderboard]);

  // === RENDER ===

  return (
    <motion.section
      className="relative overflow-hidden h-screen w-full"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
    >
      {/* Background Video */}
      <video
        autoPlay
        muted
        loop
        playsInline
        className="fixed inset-0 w-full h-full object-cover z-0 blur-sm"
      >
        <source src={heroVideo} type="video/mp4" />
      </video>

      {/* Fallback Background for any gaps */}
      <div className="fixed inset-0 bg-gray-900 -z-10" />

      {/* Black Overlay */}
      <motion.div
        className="fixed inset-0 z-10 bg-black/60"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      />

      {/* Game Content */}
      <div className="relative z-20 h-screen flex items-center justify-center px-4">
        {!started ? (
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
        ) : timeLeft === 0 ? (
          <Leaderboard
            score={score}
            nickname={nickname}
            leaderboard={leaderboard}
            onRestart={resetGame}
          />
        ) : (
          <motion.div
            className="backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 p-8 text-white max-w-3xl mx-auto relative overflow-hidden"
            style={{ background: 'rgba(235, 241, 255, 0.08)' }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Animated Background Elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="absolute top-4 left-4 w-16 h-16 rounded-full blur-xl animate-pulse" 
                   style={{ background: 'radial-gradient(circle, rgba(55, 114, 255, 0.2) 0%, transparent 70%)', animationDuration: '4s' }}></div>
              <div className="absolute bottom-4 right-4 w-12 h-12 rounded-full blur-lg animate-bounce" 
                   style={{ background: 'radial-gradient(circle, rgba(50, 103, 230, 0.25) 0%, transparent 70%)', animationDuration: '3s' }}></div>
              <div className="absolute top-1/2 left-1/2 w-8 h-8 rounded-full blur-md animate-ping" 
                   style={{ background: 'radial-gradient(circle, rgba(67, 126, 255, 0.3) 0%, transparent 70%)', animationDuration: '2s' }}></div>
            </div>

            <div className="relative z-10">
              <TimerScorePanel timeLeft={timeLeft} score={score} isPaused={typing || loading || !!selected} />
              
              {loading ? (
                <motion.div 
                  className="text-center py-12"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <div className="inline-flex items-center gap-3 px-6 py-4 backdrop-blur-md rounded-xl border border-white/20"
                       style={{ background: 'rgba(40, 51, 83, 0.3)' }}>
                    <div className="w-6 h-6 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-white/90 font-medium">Загрузка вопроса...</p>
                  </div>
                </motion.div>
              ) : error ? (
                <motion.div 
                  className="text-center py-8"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  <div className="inline-block px-6 py-4 backdrop-blur-md rounded-xl border border-red-400/30 bg-red-900/20">
                    <p className="text-red-300 font-medium">{error}</p>
                  </div>
                </motion.div>
              ) : question ? (
                <QuestionDisplay
                  symptoms={displayedSymptoms}
                  options={typedOptions}
                  answer={question.answer}
                  selected={selected}
                  typing={typing}
                  result={result}
                  explanation={question.explanation}
                  onSelect={handleSelect}
                  onNext={fetchNewUniqueQuestion}
                />
              ) : null}
            </div>

            {/* Glass Effect Overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-white/5 pointer-events-none rounded-2xl"></div>
          </motion.div>
        )}
      </div>
    </motion.section>
  );
}
