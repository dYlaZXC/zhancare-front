"use client";

import { Suspense } from "react";
import ProtocolAI from "@/sections/ProtocolAI/ProtocolAI";

function ProtocolAIPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-b from-[#1E34A0] to-[#1C212C] flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white"></div>
        </div>
      }
    >
      <ProtocolAI />
    </Suspense>
  );
}

export default ProtocolAIPage;
