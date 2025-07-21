import React, { useState, useEffect } from "react";

interface Props {
  step: number;
}

const TipsPanel: React.FC<Props> = ({ step }) => {
  const [isPopupVisible, setPopupVisible] = useState(false);

  // Close popup when clicking outside of it
  const closePopup = () => setPopupVisible(false);

  // Open the popup
  const openPopup = () => setPopupVisible(true);

  // Automatically show the popup when the step changes
  useEffect(() => {
    if (step === 1 || step === 2 || step === 3) {
      setPopupVisible(true);
    }
  }, [step]);

  return (
    <>
      {/* Mobile Popup */}
      <div
        className={`fixed inset-0 bg-gray-800 bg-opacity-50 z-50 flex justify-center items-center lg:hidden ${isPopupVisible ? "block" : "hidden"}`}
        onClick={closePopup} // Close popup when clicking outside
      >
        <div
          className="bg-white rounded-lg shadow-lg p-6 w-11/12 max-w-lg"
          onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside the popup
        >
          <h4 className="font-semibold text-gray-800">🤖 Помощь AI</h4>
          
          {step === 1 && (
            <>
              <p>Для точных рекомендаций укажите как можно больше деталей о ваших симптомах. Это поможет AI предложить наилучший вариант.</p>
              <p className="text-xs text-gray-500 italic">
                Пример: У меня температура 38.5, слабость, боль в горле уже третий день.
              </p>
            </>
          )}

          {step === 2 && (
            <p>AI предлагает врача, основываясь на ваших симптомах, но вы можете выбрать другого врача из списка ниже.</p>
          )}

          {step === 3 && (
            <p>Проверьте еще раз выбранного врача и начните звонок. Обычно ожидание не превышает 2 минут.</p>
          )}

          <button
            className="mt-4 text-blue-500 hover:underline"
            onClick={closePopup}
          >
            Закрыть
          </button>
        </div>
      </div>

      {/* Desktop Panel */}
      <div className="hidden lg:block bg-white/80 backdrop-blur-md rounded-2xl shadow-md p-6 space-y-4 text-sm text-gray-700">
        <h4 className="font-semibold text-gray-800">🤖 Помощь AI</h4>

        {step === 1 && (
          <>
            <p>Для точных рекомендаций укажите как можно больше деталей о ваших симптомах. Это поможет AI предложить наилучший вариант.</p>
            <p className="text-xs text-gray-500 italic">
              Пример: У меня температура 38.5, слабость, боль в горле уже третий день.
            </p>
          </>
        )}

        {step === 2 && (
          <p>AI предлагает врача, основываясь на ваших симптомах, но вы можете выбрать другого врача из списка ниже.</p>
        )}

        {step === 3 && (
          <p>Проверьте еще раз выбранного врача и начните звонок. Обычно ожидание не превышает 2 минут.</p>
        )}

        {/* Button to show popup on mobile */}
        <button
          className="lg:hidden text-blue-500 hover:underline mt-4"
          onClick={openPopup}
        >
          Подробнее
        </button>
      </div>
    </>
  );
};

export default TipsPanel;
