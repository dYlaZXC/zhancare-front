interface Props {
  date: string;
  className?: string;
}

export function UpdatedAt({ date, className = "" }: Props) {
  const formatted = new Date(date).toLocaleDateString("ru-RU", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <p className={`text-xs text-gray-400 ${className}`}>
      Обновлено: {formatted}
    </p>
  );
}
