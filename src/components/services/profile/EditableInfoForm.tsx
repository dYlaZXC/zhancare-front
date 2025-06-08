"use client";

import React from "react";
import InfoBlock from "./InfoBLock";

interface EditableInfoFormProps {
  first_name: string;
  last_name: string;
  email: string;
  isEditing: boolean;
  onChange: (field: "first_name" | "last_name" | "email", value: string) => void;
  error?: { email?: string };
}

const EditableInfoForm: React.FC<EditableInfoFormProps> = ({
  first_name,
  last_name,
  email,
  isEditing,
  onChange,
  error,
}) => {
  return (
    <InfoBlock
      title="Основная информация"
      icon="user"
      fields={[
        {
          label: "Имя",
          value: first_name,
          editable: isEditing,
          onChange: (val) => onChange("first_name", val),
        },
        {
          label: "Фамилия",
          value: last_name,
          editable: isEditing,
          onChange: (val) => onChange("last_name", val),
        },
        {
          label: "Email",
          value: email,
          editable: isEditing,
          onChange: (val) => onChange("email", val),
          error: error?.email,
        },
      ]}
    />
  );
};

export default EditableInfoForm;
