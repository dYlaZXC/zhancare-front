import { motion } from "framer-motion";
import {QuestionDisplayProps} from "./types"

export function QuestionDisplay({
  symptoms,
  options,
  answer,
  selected,
  typing,
  result,
  onSelect,
  onNext,
}: QuestionDisplayProps) {
  return (
    <>
      <h3 className="text-xl font-bold mb-4 text-center">
        Угадай диагноз по симптомам
      </h3>

      <p className="mb-6 text-center text-white/90 text-lg min-h-[48px]">
        <strong>Симптомы:</strong> {symptoms}
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {options.map((option, idx) => {
          const isCorrect = selected && option === answer;
          const isWrong = selected && option === selected && !isCorrect;
          return (
            <motion.button
              key={idx}
              whileTap={{ scale: 0.97 }}
              disabled={!!selected || typing}
              onClick={() => onSelect(option)}
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
            onClick={onNext}
            className="bg-gradient-to-r from-white to-gray-200 text-black px-6 py-2 rounded-lg font-semibold hover:opacity-90"
          >
            Следующий вопрос →
          </motion.button>
        </div>
      )}
    </>
  );
}
