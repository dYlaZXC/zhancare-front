import { motion, AnimatePresence } from "framer-motion";
import { FiUser } from "react-icons/fi";
import { AiOutlineRobot } from "react-icons/ai";

type Props = {
  messages: { user: string; response: string; timestamp: string }[];
  loading: boolean;
  error: string;
  translations: any;
  containerRef: React.RefObject<HTMLDivElement>;
  streamedResponse: string;
};

export const ChatMessages = ({
  messages,
  loading,
  error,
  translations,
  containerRef,
  streamedResponse,
}: Props) => (
  <div
    ref={containerRef}
    className="h-[45vh] overflow-y-auto px-2 sm:px-4 py-3 space-y-3 bg-cover bg-center bg-no-repeat text-sm"
  >
    <AnimatePresence initial={false}>
      {messages.map((msg, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {/* User message */}
          <div className="flex items-start justify-end gap-2">
            <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white px-3 py-2 rounded-2xl rounded-br-none max-w-[75%] shadow break-words whitespace-pre-wrap overflow-hidden">
              <p className="break-words">{msg.user}</p>
              <span className="block text-right text-[10px] text-white/60 mt-1">{msg.timestamp}</span>
            </div>
            <div className="w-7 h-7 flex items-center justify-center rounded-full bg-blue-500 text-white text-xs font-semibold">
              <FiUser className="w-5 h-5" />
            </div>
          </div>

          {/* AI message */}
          {(msg.response || (index === messages.length - 1 && streamedResponse)) && (
            <div className="flex items-start justify-start gap-2 mt-2">
              <div className="w-7 h-7 flex items-center justify-center rounded-full bg-indigo-700 text-white text-xs font-semibold">
                <AiOutlineRobot className="w-5 h-5" />
              </div>
              <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white px-3 py-2 rounded-2xl rounded-bl-none max-w-[75%] shadow break-words whitespace-pre-wrap overflow-hidden">
                <p className="break-words">
                  {index === messages.length - 1 && streamedResponse
                    ? streamedResponse
                    : msg.response}
                </p>
                <span className="block text-[10px] text-white/60 mt-1">{msg.timestamp}</span>
              </div>
            </div>
          )}
        </motion.div>
      ))}
    </AnimatePresence>

    {/* Typing indicator */}
    {loading && !streamedResponse && (
      <div className="flex items-center justify-start gap-2 mt-2">
        <div className="w-7 h-7 flex items-center justify-center rounded-full bg-indigo-700 text-white text-xs font-semibold">
          <AiOutlineRobot className="w-5 h-5" />
        </div>
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white px-3 py-2 rounded-2xl rounded-bl-none max-w-[75%] flex items-center gap-2 shadow break-words whitespace-pre-wrap overflow-hidden">
          <span>{translations.typing}</span>
          <div className="flex gap-1">
            <span className="animate-bounce w-1.5 h-1.5 bg-white rounded-full" />
            <span className="animate-bounce delay-150 w-1.5 h-1.5 bg-white rounded-full" />
            <span className="animate-bounce delay-300 w-1.5 h-1.5 bg-white rounded-full" />
          </div>
        </div>
      </div>
    )}

    {/* Error */}
    {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
  </div>
);
