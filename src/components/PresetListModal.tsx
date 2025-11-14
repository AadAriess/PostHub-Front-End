import { useQuery, useMutation } from "@apollo/client/react";
import { gql } from "@apollo/client";
import { FilterGroup, GetMyPresetsData } from "../types/filter";

const GET_MY_PRESETS = gql`
  query MyPresets {
    myFilterPresets {
      id
      name
      filters
      createdAt
    }
  }
`;

const DELETE_PRESET = gql`
  mutation DeletePreset($id: Int!) {
    deleteFilterPreset(id: $id)
  }
`;

interface PresetListModalProps {
  onSelect: (filters: any) => void; // fungsi yang menerima filter JSON
  onClose: () => void; // fungsi penutup modal
}

export default function PresetListModal({
  onSelect,
  onClose,
}: PresetListModalProps) {
  const { data, loading, refetch } = useQuery<GetMyPresetsData>(GET_MY_PRESETS);
  const [deletePreset] = useMutation(DELETE_PRESET, {
    onCompleted: () => refetch(), // refresh setelah hapus
  });

  if (loading) return <div>Loading preset...</div>;

  const presets = data?.myFilterPresets || [];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
      <div className="bg-gray-900 p-6 rounded-lg w-[500px] max-h-[80vh] overflow-y-auto">
        <h2 className="text-xl font-bold text-white mb-4">Daftar Preset</h2>

        {presets.map((p) => (
          <div
            key={p.id}
            className="group relative flex justify-between items-center bg-gray-800 hover:bg-gray-700 transition-colors p-3 mb-2 rounded cursor-pointer"
            onClick={() => {
              try {
                const parsed =
                  typeof p.filters === "string"
                    ? JSON.parse(p.filters)
                    : p.filters;
                console.log("✅ Parsed preset filter:", parsed);
                onSelect(parsed);
              } catch (e) {
                console.error("❌ Gagal parse preset filter:", e, p.filters);
              }
            }}
          >
            <span className="text-gray-200">{p.name}</span>

            <button
              onClick={(e) => {
                e.stopPropagation();
                deletePreset({ variables: { id: Number(p.id) } });
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-red-400 hover:text-red-200 opacity-80 hover:opacity-100 z-50"
            >
              🗑️
            </button>
          </div>
        ))}

        <button
          onClick={onClose}
          className="mt-4 px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600"
        >
          Tutup
        </button>
      </div>
    </div>
  );
}
