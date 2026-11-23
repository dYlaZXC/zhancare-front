import { medicalSources } from "@/data/medical-sources";

interface Props {
  sourceIds: string[];
}

export function SourcesList({ sourceIds }: Props) {
  const sources = sourceIds
    .map((id) => medicalSources[id])
    .filter(Boolean);

  if (sources.length === 0) return null;

  return (
    <div className="text-sm text-gray-600">
      <p className="font-semibold text-gray-700 mb-2">Источники</p>
      <ol className="space-y-1 list-decimal list-inside">
        {sources.map((src) => (
          <li key={src.id}>
            <a
              href={src.url}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="hover:underline text-[#3772ff]"
            >
              {src.title}
            </a>
            {" "}— {src.organization}
            {src.year ? `, ${src.year}` : ""}
          </li>
        ))}
      </ol>
    </div>
  );
}
