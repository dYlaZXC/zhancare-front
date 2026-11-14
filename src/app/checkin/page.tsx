"use client";

import { Suspense } from "react";
import PatientCheckin from "@/components/services/patient/PatientCheckin";

export default function CheckinPage() {
  return (
    <Suspense fallback={null}>
      <PatientCheckin />
    </Suspense>
  );
}
