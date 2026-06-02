"use client";

import { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import IOCGraphModal from "@/components/explore/IOCGraphModal";
import EntityGraphModal, { type EntityType } from "@/components/explore/EntityGraphModal";

const ENTITY_TYPES: Record<string, EntityType> = {
  campaign:      "campaign",
  group:         "group",
  malware:       "malware",
  technique:     "technique",
  vulnerability: "vulnerability",
};

function GraphPageContent() {
  const params = useSearchParams();
  const router = useRouter();

  const type  = params.get("type")  ?? "ioc";
  const value = params.get("value") ?? "";
  const from  = params.get("from")  ?? "";

  const backUrl =
    from === "mitre" ? "/explore?tab=mitre" :
    from === "cve"   ? "/explore?tab=cve"   : "/explore";

  const handleClose = () => router.push(backUrl);

  if (type === "ioc") {
    return (
      <IOCGraphModal
        iocValue={value}
        onClose={handleClose}
        onInvestigate={(ip) =>
          router.push(`/explore/graph?type=ioc&value=${encodeURIComponent(ip)}&from=${from}`)
        }
      />
    );
  }

  const entityType = ENTITY_TYPES[type];
  if (entityType) {
    return (
      <EntityGraphModal
        entityType={entityType}
        entityName={value}
        onClose={handleClose}
      />
    );
  }

  router.replace(backUrl);
  return null;
}

export default function GraphPage() {
  return (
    <Suspense>
      <GraphPageContent />
    </Suspense>
  );
}
