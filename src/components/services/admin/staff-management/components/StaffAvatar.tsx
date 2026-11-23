"use client";

import { useState } from "react";
import type { StaffMember } from "../types/staffTypes";

const BACKEND = process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') ?? 'http://127.0.0.1:8000';
function resolveAvatarUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  return `${BACKEND}${url}`;
}

export function StaffAvatar({ member }: { member: StaffMember }) {
  const [error, setError] = useState(false);
  const resolvedUrl = resolveAvatarUrl(member.avatar);

  const gradient = member.role === 'doctor'
    ? 'linear-gradient(135deg, #3772ff 0%, #2c5bcc 100%)'
    : 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)';

  if (!resolvedUrl || error) {
    return (
      <div
        className="w-16 h-16 rounded-full flex items-center justify-center text-white text-xl font-bold flex-shrink-0"
        style={{ background: gradient }}
      >
        {member.first_name?.[0] ?? "?"}{member.last_name?.[0] ?? "?"}
      </div>
    );
  }

  return (
    <div className="w-16 h-16 rounded-full overflow-hidden flex-shrink-0 border-2 border-gray-100">
      <img
        src={resolvedUrl}
        alt={`${member.first_name ?? ''} ${member.last_name ?? ''}`}
        className="w-full h-full object-cover"
        onError={() => setError(true)}
      />
    </div>
  );
}
