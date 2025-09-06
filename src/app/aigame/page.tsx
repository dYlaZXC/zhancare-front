"use client";

import { Suspense } from "react";
import AIGame from "@/sections/AiGame/AIGame";

function GamePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1E34A0] to-[#1C212C] flex items-center justify-center">
      <Suspense fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white"></div>
        </div>
      }>
        <AIGame />
      </Suspense>
    </div>
  );
}

export default GamePage;