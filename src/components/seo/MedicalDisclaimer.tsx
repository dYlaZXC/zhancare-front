export function MedicalDisclaimer() {
  return (
    <div className="border border-gray-200 rounded-xl px-5 py-4 bg-gray-50 text-xs text-gray-500 leading-relaxed">
      <p className="font-semibold text-gray-600 mb-1">Медицинская оговорка</p>
      <p>
        Информация на этой странице носит исключительно образовательный характер и не заменяет
        профессиональную медицинскую консультацию, диагностику или лечение. При любых
        вопросах о здоровье обратитесь к квалифицированному врачу. Не игнорируйте
        медицинские рекомендации на основании прочитанного здесь. При неотложных состояниях
        звоните по номеру{" "}
        <a href="tel:103" className="font-semibold text-gray-600 hover:underline">
          103 (скорая помощь)
        </a>
        .
      </p>
    </div>
  );
}
