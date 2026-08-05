"use client";

import React, { useRef, useState, useEffect } from "react";
import { Camera, Trash2, Loader2, User } from "lucide-react";
import { api } from "@/utils/api";
import { toast } from "react-toastify";

const BACKEND = process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') ?? 'http://127.0.0.1:8000';

function resolveAvatarUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  return `${BACKEND}${url}`;
}

interface AvatarUploadCardProps {
  user: { first_name: string; last_name: string; avatar?: string | null };
  onAvatarChange: (url: string | null) => void;
}

export const AvatarUploadCard: React.FC<AvatarUploadCardProps> = ({ user, onAvatarChange }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(resolveAvatarUrl(user.avatar));
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [avatarBroken, setAvatarBroken] = useState(false);

  useEffect(() => { setAvatarBroken(false); }, [preview]);

  const initials = `${user.first_name?.[0] ?? ''}${user.last_name?.[0] ?? ''}`.toUpperCase();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Файл слишком большой. Максимум 5 МБ.");
      return;
    }

    // Instant preview
    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("avatar", file);
      const res = await api.post("/user-profile/avatar/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const url = resolveAvatarUrl(res.data.avatar);
      setPreview(url);
      onAvatarChange(url);
      toast.success("Фото профиля обновлено.");
    } catch {
      toast.error("Не удалось загрузить фото.");
      setPreview(resolveAvatarUrl(user.avatar));
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete("/user-profile/avatar/");
      setPreview(null);
      onAvatarChange(null);
      toast.success("Фото удалено.");
    } catch {
      toast.error("Не удалось удалить фото.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6">
      <h3 className="text-sm font-semibold text-gray-700 mb-4">Фото профиля</h3>
      <div className="flex items-center gap-5">
        {/* Avatar circle */}
        <div className="relative flex-shrink-0">
          <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-gray-100 bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
            {preview && !avatarBroken ? (
              <img src={preview} alt="avatar" className="w-full h-full object-cover rounded-[inherit]" onError={() => setAvatarBroken(true)} />
            ) : initials ? (
              <span className="text-white font-bold text-2xl">{initials}</span>
            ) : (
              <User className="w-8 h-8 text-white" />
            )}
          </div>
          {(uploading || deleting) && (
            <div className="absolute inset-0 rounded-2xl bg-black/40 flex items-center justify-center">
              <Loader2 className="w-5 h-5 text-white animate-spin" />
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900">
            {user.first_name} {user.last_name}
          </p>
          <p className="text-xs text-gray-400 mt-0.5 mb-3">JPG, PNG или WebP · до 5 МБ</p>
          <div className="flex gap-2">
            <button
              onClick={() => inputRef.current?.click()}
              disabled={uploading || deleting}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold disabled:opacity-50 transition-colors"
            >
              <Camera className="w-3.5 h-3.5" />
              {preview ? "Заменить" : "Загрузить"}
            </button>
            {preview && (
              <button
                onClick={handleDelete}
                disabled={uploading || deleting}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 text-xs font-semibold disabled:opacity-50 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Удалить
              </button>
            )}
          </div>
        </div>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
};
