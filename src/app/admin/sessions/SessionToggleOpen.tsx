"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface SessionToggleOpenProps {
  id: string;
  open: boolean;
}

export default function SessionToggleOpen({ id, open }: SessionToggleOpenProps) {
  const [isOpen, setIsOpen] = useState(open);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function toggle() {
    setLoading(true);
    try {
      const res = await fetch(`/api/sessions/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ open: !isOpen }),
      });
      if (res.ok) {
        setIsOpen(!isOpen);
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
        isOpen
          ? "bg-green-100 text-green-700 hover:bg-green-200"
          : "bg-red-100 text-red-700 hover:bg-red-200"
      } disabled:opacity-50`}
    >
      {isOpen ? "開放中" : "已關閉"}
    </button>
  );
}
