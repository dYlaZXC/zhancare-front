"use client";
import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import classNames from "classnames";

interface Item {
  date: string;
  text: string;
  color?: string;
}

interface Props {
  title: string;
  icon: any;
  items: Item[];
  showAll: boolean;
  toggleShow: () => void;
  total: number;
}

const TimelineBlock: React.FC<Props> = ({
  title,
  icon,
  items,
  total,
  showAll,
  toggleShow,
}) => (
  <div className="bg-gray-50 p-4 sm:p-5 rounded-2xl shadow-inner transition-all animate-fade-in">
    <h3 className="flex items-center gap-2 text-base sm:text-lg font-semibold text-slate-700 mb-3">
      <FontAwesomeIcon icon={icon} /> {title}
    </h3>

    <div className="relative border-l-2 border-blue-200 ml-3">
      {items.length === 0 ? (
        <p className="text-gray-400 text-xs italic mt-2 ml-4">Нет данных</p>
      ) : (
        items.map((item, i) => (
          <div key={i} className="mb-4 ml-6">
            <div className="absolute w-3 h-3 bg-blue-500 rounded-full -left-1.5 top-1" />
            <p className="text-xs text-gray-400">
              {new Intl.DateTimeFormat("ru-RU").format(new Date(item.date))}
            </p>
            <p className={classNames("text-sm font-medium mt-0.5", item.color)}>
              {item.text}
            </p>
          </div>
        ))
      )}
    </div>

    {!showAll && total > items.length && (
      <div className="mt-4 ml-6">
        <button
          onClick={toggleShow}
          className="text-xs text-blue-600 hover:underline font-medium"
        >
          Показать все ({total})
        </button>
      </div>
    )}
  </div>
);

export default TimelineBlock;
