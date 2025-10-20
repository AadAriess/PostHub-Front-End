import React from "react";
import { FilterGroup, FilterRule } from "@/types/filter";

// Props untuk FilterBuilder
interface FilterBuilderProps {
  group: FilterGroup;
  onChange: (group: FilterGroup) => void;
}

// Daftar field yang tersedia untuk filter
const availableFields = [
  { value: "createdAt", label: "Tanggal Dibuat" },
  { value: "title", label: "Judul" },
  { value: "tags", label: "Tag" },
];

// Operator yang tersedia berdasarkan field
const operatorsByField: Record<string, string[]> = {
  createdAt: ["between", "before", "after"],
  title: ["contains", "equals"],
  tags: ["contains"],
};

// Komponen FilterBuilder
export default function FilterBuilder({ group, onChange }: FilterBuilderProps) {
  // Fungsi untuk memperbarui kondisi tertentu dalam grup
  const updateCondition = (index: number, patch: Partial<FilterRule>) => {
    const updated = [...group.conditions];
    updated[index] = { ...updated[index], ...patch };
    onChange({ ...group, conditions: updated });
  };

  // Fungsi untuk menambah kondisi baru
  const addCondition = () => {
    onChange({
      ...group,
      conditions: [
        ...group.conditions,
        { field: "", operator: "", values: [""] },
      ],
    });
  };

  // Fungsi untuk menghapus kondisi tertentu
  const removeCondition = (index: number) => {
    const updated = group.conditions.filter((_, i) => i !== index);
    onChange({ ...group, conditions: updated });
  };

  // Fungsi untuk menambah grup baru
  const addGroup = () => {
    const newGroup: FilterGroup = { operator: "AND", conditions: [] };
    onChange({ ...group, groups: [...(group.groups || []), newGroup] });
  };

  // Fungsi untuk mengubah operator logika grup
  const handleOperatorChange = (op: "AND" | "OR") =>
    onChange({ ...group, operator: op });

  return (
    <div className="border border-gray-600 rounded-lg p-4 bg-gray-800 mt-3">
      <div className="flex items-center justify-between mb-3">
        <span className="font-semibold text-gray-300">
          Group Operator: {group.operator}
        </span>
        <select
          value={group.operator}
          onChange={(e) => handleOperatorChange(e.target.value as "AND" | "OR")}
          className="bg-gray-700 text-gray-200 rounded px-2 py-1"
        >
          <option value="AND">AND</option>
          <option value="OR">OR</option>
        </select>
      </div>

      {group.conditions.map((cond, i) => {
        const isDateField = cond.field === "createdAt";
        const isBetween = cond.operator === "between";

        return (
          <div
            key={i}
            className="flex flex-wrap gap-2 items-center bg-gray-700 p-2 rounded mb-2"
          >
            {/* Field */}
            <select
              value={cond.field}
              onChange={(e) =>
                updateCondition(i, {
                  field: e.target.value,
                  operator: "",
                  values: [""],
                })
              }
              className="bg-gray-800 text-gray-200 rounded px-2 py-1"
            >
              <option value="">Pilih Field</option>
              {availableFields.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </select>

            {/* Operator */}
            <select
              value={cond.operator}
              onChange={(e) =>
                updateCondition(i, {
                  operator: e.target.value,
                  values: [""],
                })
              }
              className="bg-gray-800 text-gray-200 rounded px-2 py-1"
            >
              <option value="">Operator</option>
              {(operatorsByField[cond.field] || []).map((op) => (
                <option key={op} value={op}>
                  {op}
                </option>
              ))}
            </select>

            {/* Value input */}
            {isDateField ? (
              isBetween ? (
                <>
                  <input
                    type="date"
                    value={cond.values?.[0] ?? ""}
                    onChange={(e) => {
                      const newValues = [...(cond.values || [])];
                      newValues[0] = e.target.value;
                      updateCondition(i, { values: newValues });
                    }}
                    className="bg-gray-800 text-gray-200 rounded px-2 py-1"
                  />
                  <span className="text-gray-300">to</span>
                  <input
                    type="date"
                    value={cond.values?.[1] ?? ""}
                    onChange={(e) => {
                      const newValues = [...(cond.values || [])];
                      newValues[1] = e.target.value;
                      updateCondition(i, { values: newValues });
                    }}
                    className="bg-gray-800 text-gray-200 rounded px-2 py-1"
                  />
                </>
              ) : (
                <input
                  type="date"
                  value={cond.values?.[0] ?? ""}
                  onChange={(e) =>
                    updateCondition(i, { values: [e.target.value] })
                  }
                  className="bg-gray-800 text-gray-200 rounded px-2 py-1"
                />
              )
            ) : (
              <input
                type="text"
                placeholder="Value"
                value={cond.values?.[0] ?? ""}
                onChange={(e) =>
                  updateCondition(i, { values: [e.target.value] })
                }
                className="bg-gray-800 text-gray-200 rounded px-2 py-1 flex-1"
              />
            )}

            {/* Remove button */}
            <button
              onClick={() => removeCondition(i)}
              className="text-red-400 hover:text-red-300"
            >
              ✕
            </button>
          </div>
        );
      })}

      <div className="flex gap-2 mt-3">
        <button
          onClick={addCondition}
          className="bg-indigo-600 px-3 py-1 rounded text-white text-sm"
        >
          + Tambah Rule
        </button>
        <button
          onClick={addGroup}
          className="bg-purple-600 px-3 py-1 rounded text-white text-sm"
        >
          + Tambah Group
        </button>
      </div>

      {/* Nested Groups */}
      {group.groups?.map((g, idx) => (
        <div key={idx} className="ml-4 mt-3 border-l-2 border-gray-500 pl-3">
          <FilterBuilder
            group={g}
            onChange={(newSubGroup) => {
              const updatedGroups = [...(group.groups || [])];
              updatedGroups[idx] = newSubGroup;
              onChange({ ...group, groups: updatedGroups });
            }}
          />
        </div>
      ))}
    </div>
  );
}
