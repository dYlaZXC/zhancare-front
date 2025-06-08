import React from "react";

interface Props {
  step: number;
}

const TipsPanel: React.FC<Props> = ({ step }) => {
  return (
    <div className="hidden lg:block bg-white/80 backdrop-blur-md rounded-2xl shadow-md p-6 space-y-4 text-sm text-gray-700">
      <h4 className="font-semibold text-gray-800">🤖 Помощь AI</h4>

      {step === 1 && (
        <>
          <p>Чем подробнее вы опишете симптомы, тем точнее будет рекомендация.</p>
          <p className="text-xs text-gray-500 italic">
            Пример: У меня уже третий день температура 38.5, сильная слабость и боль в горле.
          </p>
        </>
      )}

      {step === 2 && (
        <p>
          Мы рекомендуем врача, но вы также можете выбрать любого другого в списке ниже.
        </p>
      )}

      {step === 3 && (
        <p>
          Проверьте ещё раз выбранного врача и начните звонок. Ожидание обычно занимает не более 2 минут.
        </p>
      )}
    </div>
  );
};

export default TipsPanel;
