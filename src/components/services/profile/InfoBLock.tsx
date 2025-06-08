"use client";
import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import InfoField from "./InfoField";

interface Field {
  label: string;
  value: string;
  editable: boolean;
  onChange: (val: string) => void;
  error?: string;
}

interface Props {
  title: string;
  icon: any;
  fields: Field[];
}

const InfoBlock: React.FC<Props> = ({ title, icon, fields }) => (
  <div className="bg-gray-50 p-4 sm:p-5 rounded-2xl shadow-inner">
    <h3 className="flex items-center gap-2 text-base sm:text-lg font-semibold text-slate-700 mb-3">
      <FontAwesomeIcon icon={icon} /> {title}
    </h3>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {fields.map((field, idx) => (
        <InfoField key={idx} {...field} />
      ))}
    </div>
  </div>
);

export default InfoBlock;
