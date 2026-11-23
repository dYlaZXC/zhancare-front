interface Props {
  text: string;
}

export function EmergencyWarning({ text }: Props) {
  return (
    <div className="flex gap-3 bg-red-50 border-l-4 border-red-500 rounded-r-xl px-5 py-4">
      <span className="text-red-500 text-xl flex-shrink-0 mt-0.5" aria-hidden>🚨</span>
      <div>
        <p className="font-semibold text-red-700 mb-1">Когда нужна скорая помощь</p>
        <p className="text-red-600 text-sm leading-relaxed">{text}</p>
        <a
          href="tel:103"
          className="inline-flex items-center gap-1.5 mt-3 text-sm font-semibold text-red-700 hover:text-red-800 underline underline-offset-2"
        >
          📞 Позвонить в скорую: 103
        </a>
      </div>
    </div>
  );
}
