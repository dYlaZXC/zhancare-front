import { motion } from "framer-motion";
import { PaperPlaneIcon } from "@radix-ui/react-icons";

type Props = {
  userInput: string;
  setUserInput: (v: string) => void;
  onSend: () => void;
  loading: boolean;
  translations: any;
  inputRef: React.RefObject<HTMLTextAreaElement>;
};

export const ChatInput = ({
  userInput,
  setUserInput,
  onSend,
  loading,
  translations,
  inputRef,
}: Props) => {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  return (
    <div className="p-3 bg-gradient-to-r from-blue-600 to-blue-800">
      <div className="flex items-end gap-2">
        <textarea
          ref={inputRef}
          rows={1}
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={translations.placeholder}
          className="flex-1 resize-none border border-gray-300 rounded-xl p-3 text-sm focus:outline-none focus:ring focus:ring-blue-300 bg-white text-black max-h-40 overflow-y-auto"
          disabled={loading}
        />

        <motion.button
          whileTap={{ scale: 0.95 }}
          whileHover={!loading ? { scale: 1.05 } : {}}
          disabled={loading || !userInput.trim()}
          onClick={onSend}
          className={`flex items-center gap-1 px-4 py-2 rounded-xl font-semibold transition-all duration-200 ${
            loading || !userInput.trim()
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-white text-black border border-blue-600 hover:bg-blue-100"
          }`}
        >
          <PaperPlaneIcon className="w-4 h-4" />
          <span className="hidden sm:inline">
            {loading ? translations.sending : translations.sendButton}
          </span>
        </motion.button>
      </div>
    </div>
  );
};
