"use client";

type Props = {
  bold: boolean;
  italic: boolean;
  onNormal: () => void;
  onBold: () => void;
  onItalic: () => void;
  onCode: () => void;
};

export default function EditorToolbar({
  bold,
  italic,
  onBold,
  onItalic,
  onCode,
}: Props) {
  return (
    <div className="flex gap-2 mb-2">
      <button
        type="button"
        onClick={onBold}
        className={`px-3 py-1 border rounded font-bold cursor-pointer ${
          bold ? "bg-black text-white" : ""
        }`}
      >
        B
      </button>

      <button
        type="button"
        onClick={onItalic}
        className={`px-3 py-1 border rounded italic cursor-pointer ${
          italic ? "bg-black text-white" : ""
        }`}
      >
        I
      </button>

      <button
        type="button"
        onClick={onCode}
        className="px-3 py-1 border rounded font-mono cursor-pointer"
      >
        {"</>"}
      </button>
    </div>
  );
}
