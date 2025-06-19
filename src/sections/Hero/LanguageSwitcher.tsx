"use client";

type Props = {
  toggleLanguage: () => void;
  currentLanguage: string;
};

export default function LanguageSwitcher({ toggleLanguage, currentLanguage }: Props) {
  return (
    <button
      onClick={toggleLanguage}
      className="bg-gray-800 text-white px-4 py-2 rounded-lg font-medium hover:bg-gray-700 transition"
    >
      {currentLanguage === "ru" ? "Қазақша" : "Русский"}
    </button>
  );
}
