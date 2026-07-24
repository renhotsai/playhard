"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface ScriptTogglePublishedProps {
  id: string;
  published: boolean;
}

export default function ScriptTogglePublished({ id, published }: ScriptTogglePublishedProps) {
  const [isPublished, setIsPublished] = useState(published);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function toggle() {
    setLoading(true);
    try {
      const res = await fetch(`/api/scripts/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ published: !isPublished }),
      });
      if (res.ok) {
        setIsPublished(!isPublished);
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
        isPublished
          ? "bg-green-100 text-green-700 hover:bg-green-200"
          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
      } disabled:opacity-50`}
    >
      {isPublished ? "已上架" : "未上架"}
    </button>
  );
}
