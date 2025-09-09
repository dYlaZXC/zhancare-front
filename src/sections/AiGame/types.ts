export interface Score {
  nickname: string;
  score: number;
};

export interface Question {
  symptoms: string;
  options: string[];
  answer: string;
};

export interface LeaderboardProps {
  score: number;
  nickname: string;
  leaderboard: Score[];
  onRestart: () => void;
};

export interface NicknameEntryProps {
  nickname: string;
  onNicknameChange: (nickname: string) => void;
  onGenerate: () => void;
  loading: boolean;
  onStart: () => void;
};

export interface TimerScorePanelProps {
  timeLeft: number;
  score: number;
  isPaused?: boolean;
};


export interface QuestionDisplayProps {
  symptoms: string;
  options: string[];
  answer: string;
  selected: string | null;
  typing: boolean;
  result: string | null;
  onSelect: (option: string) => void;
  onNext: () => void;
}