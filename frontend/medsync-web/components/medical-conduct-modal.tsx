"use client";

import type { ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

type MedicalConductModalProps = {
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
};

export function MedicalConductModal({
  title,
  onClose,
  children,
  footer,
  className,
}: MedicalConductModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F172A]/45 px-4 py-8 backdrop-blur-[2px]">
      <div
        className={cn(
          "w-full max-w-[1120px] rounded-[12px] bg-white p-6 shadow-[0_24px_80px_rgba(15,23,42,0.24)]",
          className
        )}
      >
        <div className="flex items-start justify-between gap-4">
          <h2 className="text-[18px] font-semibold text-[#0F172A]">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex size-9 items-center justify-center rounded-full text-[#52627A] transition-colors hover:bg-[#F8FAFC] hover:text-[#0F172A]"
            aria-label="Fechar modal"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="mt-6 space-y-6">{children}</div>

        {footer ? <div className="mt-6 flex flex-wrap items-center justify-end gap-3">{footer}</div> : null}
      </div>
    </div>
  );
}
