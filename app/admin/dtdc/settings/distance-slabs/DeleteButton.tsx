"use client";

import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";

export default function DeleteButton({ id }: { id: number }) {
  const router = useRouter();

  async function remove() {
    const ok = confirm("Are you sure you want to delete this slab?");
    if (!ok) return;

    const res = await fetch(`/api/dtdc/settings/distance-slabs/${id}`, {
      method: "DELETE",
    });

    const json = await res.json();

    if (json.ok) router.refresh();
    else alert(json.error);
  }

  return (
    <button
      onClick={remove}
      className="text-red-600 hover:text-red-800 flex items-center gap-1"
    >
      <Trash2 size={16} />
      Delete
    </button>
  );
}
