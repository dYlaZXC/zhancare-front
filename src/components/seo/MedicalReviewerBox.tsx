import { medicalReviewers } from "@/data/medical-reviewers";
import { UpdatedAt } from "./UpdatedAt";

interface Props {
  reviewerId: string;
  updatedAt: string;
}

export function MedicalReviewerBox({ reviewerId, updatedAt }: Props) {
  const reviewer = medicalReviewers[reviewerId];
  if (!reviewer) return null;

  return (
    <div className="flex items-start gap-4 bg-blue-50 border border-blue-100 rounded-xl px-5 py-4 text-sm">
      <div className="flex-shrink-0 w-11 h-11 rounded-full bg-gradient-to-br from-[#3772ff] to-[#29358f] flex items-center justify-center text-white font-semibold text-sm">
        {reviewer.avatarInitials}
      </div>
      <div className="min-w-0">
        <p className="text-xs text-gray-500 mb-0.5">Проверено медицинским специалистом</p>
        <p className="font-semibold text-gray-800">{reviewer.name}</p>
        <p className="text-gray-500">{reviewer.credentials}</p>
        <UpdatedAt date={updatedAt} className="mt-1" />
      </div>
    </div>
  );
}
