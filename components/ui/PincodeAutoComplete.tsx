"use client";

import { useEffect, useState } from "react";
import { Command, CommandInput, CommandItem, CommandList } from "@/components/ui/command";

export default function PincodeAutocomplete({ value, onSelect }) {
  const [query, setQuery] = useState(value || "");
  const [results, setResults] = useState<any[]>([]);

  useEffect(() => {
    if (query.length < 2) return setResults([]);

    const controller = new AbortController();

    fetch(`/api/pincode?pin=${query}`, { signal: controller.signal })
      .then((res) => res.json())
      .then((json) => setResults(json.results || []))
      .catch(() => {});

    return () => controller.abort();
  }, [query]);

  return (
    <div className="border rounded-md">
      <Command>
        <CommandInput
          placeholder="Enter pincode"
          value={query}
          onValueChange={(v) => setQuery(v)}
        />

        {results.length > 0 && (
          <CommandList>
            {results.map((p) => (
              <CommandItem
                key={p.id}
                onSelect={() => {
                  onSelect(p);
                  setQuery(p.pincode);
                  setResults([]);
                }}
              >
                <div>
                  <div className="font-medium">{p.pincode}</div>
                  <div className="text-xs text-muted-foreground">
                    {p.office}, {p.district}, {p.state}
                  </div>
                </div>
              </CommandItem>
            ))}
          </CommandList>
        )}
      </Command>
    </div>
  );
}
