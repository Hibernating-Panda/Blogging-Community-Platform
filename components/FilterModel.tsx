export default function FilterModal({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 bg-black/30 flex justify-center items-start pt-24 z-50"
      onClick={onClose}
    >
      <div
        className="bg-white w-[420px] rounded-lg shadow-lg p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold mb-4">Filter</h2>

        <div className="mb-6">
          <h3 className="font-medium mb-2">Filter by</h3>
          <label className="flex gap-2 text-sm mb-2">
            <input type="checkbox" /> No answers
          </label>
          <label className="flex gap-2 text-sm mb-2">
            <input type="checkbox" /> Has bounty
          </label>
        </div>

        <div className="mb-6">
          <h3 className="font-medium mb-2">Sorted by</h3>
          <label className="flex gap-2 text-sm mb-2">
            <input type="radio" name="sort" /> Newest
          </label>
          <label className="flex gap-2 text-sm mb-2">
            <input type="radio" name="sort" /> Most activity
          </label>
        </div>

        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 border rounded-md">
            Cancel
          </button>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-md">
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}
