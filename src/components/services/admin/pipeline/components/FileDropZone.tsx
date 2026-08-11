import { useRef } from "react";
import { Upload, X } from "lucide-react";

export function FileDropZone({ label, accept, file, onChange }: { label: string; accept: string; file: File | null; onChange: (f: File | null) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <div>
      <p className="text-xs font-semibold text-gray-500 mb-1.5">{label}</p>
      <div onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl px-4 py-3.5 cursor-pointer transition-all ${
          file ? "border-emerald-300 bg-emerald-50" : "border-gray-200 hover:border-blue-300 hover:bg-blue-50/20"
        }`}>
        <input ref={inputRef} type="file" accept={accept} className="hidden" onChange={e => onChange(e.target.files?.[0] ?? null)} />
        {file ? (
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm text-emerald-700 font-medium truncate">{file.name}</span>
            <button type="button" onClick={e => { e.stopPropagation(); onChange(null); if (inputRef.current) inputRef.current.value = ""; }}
              className="flex-shrink-0 text-gray-400 hover:text-red-500 transition-colors"><X className="w-4 h-4" /></button>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-gray-400">
            <Upload className="w-4 h-4 flex-shrink-0" />
            <span className="text-sm">Нажмите или перетащите файл .xlsx</span>
          </div>
        )}
      </div>
    </div>
  );
}
