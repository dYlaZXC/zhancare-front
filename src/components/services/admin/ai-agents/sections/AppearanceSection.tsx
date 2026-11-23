"use client";

import type { RefObject } from "react";
import { Building2, Camera, Loader2, Palette, Trash2 } from "lucide-react";
import { Label, Section } from "../components/FormPrimitives";
import { PRESET_COLORS } from "../types/aiAgentTypes";
import type { FormState } from "../types/aiAgentTypes";

export function AppearanceSection({
  form,
  onFieldChange,
  uploadingLogo,
  logoRef,
  onLogoUpload,
  onLogoDelete,
}: {
  form: FormState;
  onFieldChange: (key: keyof FormState, value: string | boolean) => void;
  uploadingLogo: boolean;
  logoRef: RefObject<HTMLInputElement>;
  onLogoUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onLogoDelete: () => void;
}) {
  return (
    <Section title="Внешний вид" subtitle="Цвет бренда и логотип в чате" icon={Palette} color="#f59e0b">

      <div className="space-y-1.5">
        <Label>Основной цвет</Label>
        <div className="flex items-center gap-3">
          {/* Presets */}
          <div className="flex gap-1.5 flex-wrap">
            {PRESET_COLORS.map((c) => (
              <button
                key={c}
                onClick={() => onFieldChange("primary_color", c)}
                className="w-7 h-7 rounded-lg transition-all duration-150 hover:scale-110 active:scale-95 flex-shrink-0"
                style={{
                  background: c,
                  boxShadow:
                    form.primary_color === c
                      ? `0 0 0 2px white, 0 0 0 4px ${c}`
                      : "none",
                }}
              />
            ))}
          </div>
          {/* Color input + hex */}
          <div className="flex items-center gap-2 ml-auto">
            <input
              type="color"
              value={form.primary_color}
              onChange={(e) => onFieldChange("primary_color", e.target.value)}
              className="w-9 h-9 rounded-xl cursor-pointer border-2 border-gray-200 p-0.5 bg-white"
              title="Свой цвет"
            />
            <input
              type="text"
              value={form.primary_color}
              onChange={(e) => onFieldChange("primary_color", e.target.value)}
              className="w-24 px-3 py-2 rounded-xl border border-gray-200 text-xs font-mono text-gray-700 outline-none focus:border-purple-400 transition-all"
              maxLength={7}
            />
          </div>
        </div>
      </div>

      {/* Logo upload */}
      <div>
        <Label>Логотип клиники</Label>
        <div className="flex items-center gap-4 mt-2 p-4 rounded-2xl border border-gray-100 bg-gray-50">
          {/* Preview */}
          <div className="relative group flex-shrink-0">
            <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-gray-200 bg-white flex items-center justify-center shadow-sm">
              {form.logo_url ? (
                <>
                  <img
                    src={form.logo_url}
                    alt="Логотип"
                    className="w-full h-full object-contain p-1.5 rounded-[inherit]"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                      const fb = (e.target as HTMLElement).nextElementSibling as HTMLElement | null;
                      if (fb) fb.style.display = "flex";
                    }}
                  />
                  <Building2 className="w-8 h-8 text-gray-300 hidden items-center justify-center" style={{ display: 'none' }} />
                </>
              ) : (
                <Building2 className="w-8 h-8 text-gray-300" />
              )}
              {uploadingLogo && (
                <div className="absolute inset-0 rounded-2xl bg-black/40 flex items-center justify-center">
                  <Loader2 className="w-5 h-5 text-white animate-spin" />
                </div>
              )}
            </div>
            <button
              onClick={() => logoRef.current?.click()}
              disabled={uploadingLogo}
              className="absolute inset-0 rounded-2xl bg-black/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center cursor-pointer"
            >
              <Camera className="w-5 h-5 text-white" />
            </button>
          </div>

          {/* Info + buttons */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-gray-700 mb-0.5">Логотип клиники</p>
            <p className="text-xs text-gray-400 mb-3">
              JPG, PNG, WEBP — до 5 МБ. Тот же логотип что и в профиле клиники.
            </p>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => logoRef.current?.click()}
                disabled={uploadingLogo}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 hover:bg-amber-100 transition-all disabled:opacity-40"
              >
                <Camera className="w-3.5 h-3.5" />
                {form.logo_url ? "Заменить" : "Загрузить"}
              </button>
              {form.logo_url && (
                <button
                  onClick={onLogoDelete}
                  disabled={uploadingLogo}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-red-500 bg-red-50 border border-red-200 hover:bg-red-100 transition-all disabled:opacity-40"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Удалить
                </button>
              )}
            </div>
          </div>
        </div>
        <input
          ref={logoRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={onLogoUpload}
        />
      </div>
    </Section>
  );
}
