"use client";

import { useState, useRef, useEffect } from "react";
import { auth } from "@/lib/firebase";
import { PRESET_CATEGORIES } from "@/types/firestore";
import TurndownService from "turndown";
// import EditorToolbar from "@/components/EditorToolbar";

export default function CreatePostPage() {
  const editorRef = useRef<HTMLDivElement>(null);

  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [boldMode, setBoldMode] = useState(false);
  const [italicMode, setItalicMode] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const [categoryError, setCategoryError] = useState<string>("");
  const [titleError, setTitleError] = useState<string>("");
  const [coverImageError, setCoverImageError] = useState<string>("");
  const [summaryError, setSummaryError] = useState<string>("");
  const [contentError, setContentError] = useState<string>("");

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;

      const sel = window.getSelection();
      if (!sel || !sel.rangeCount) return;

      let node = sel.getRangeAt(0).startContainer as Node;

      while (node && node !== editorRef.current) {
        if (
          node.nodeType === Node.ELEMENT_NODE &&
          (node as HTMLElement).dataset.codeBlock === "true"
        ) {
          e.preventDefault();

          const p = document.createElement("p");
          p.innerHTML = "<br>";

          node.parentNode?.insertBefore(p, node.nextSibling);

          const range = document.createRange();
          range.setStart(p, 0);
          range.collapse(true);

          sel.removeAllRanges();
          sel.addRange(range);
          return;
        }
        node = node.parentNode!;
      }
    };

    document.addEventListener("keydown", handler, true);
    return () => document.removeEventListener("keydown", handler, true);
  }, []);

  function toggleCategory(id: string) {
    setCategories((prev) => {
      // remove if already selected
      if (prev.includes(id)) {
        return prev.filter((c) => c !== id);
      }

      // prevent more than 2
      if (prev.length >= 2) {
        setCategoryError("You can select up to 2 categories only.");
        return prev;
      }

      return [...prev, id];
    });
  }

  /* ----------------------------
     CARET / FORMAT
  ----------------------------- */

  function exitInlineFormatting() {
    const sel = window.getSelection();
    if (!sel || !sel.rangeCount) return;

    let node = sel.getRangeAt(0).startContainer as Node;

    while (node && node !== editorRef.current) {
      if (
        node.nodeType === Node.ELEMENT_NODE &&
        ["SPAN", "CODE"].includes((node as HTMLElement).tagName)
      ) {
        const parent = node.parentNode!;
        const spacer = document.createTextNode("\u200B");

        parent.insertBefore(spacer, node.nextSibling);

        const range = document.createRange();
        range.setStart(spacer, 1);
        range.collapse(true);

        sel.removeAllRanges();
        sel.addRange(range);
        return;
      }
      node = node.parentNode!;
    }
  }

  function hasTextSelection() {
    const sel = window.getSelection();
    return !!sel && !sel.isCollapsed;
  }

  function insertInlineSpan(style: "bold" | "italic") {
    const span = document.createElement("span");
    span.textContent = "\u200B";

    if (style === "bold") span.style.fontWeight = "bold";
    if (style === "italic") span.style.fontStyle = "italic";

    const sel = window.getSelection();
    if (!sel || !sel.rangeCount) return;

    const range = sel.getRangeAt(0);
    range.insertNode(span);

    const newRange = document.createRange();
    newRange.setStart(span.firstChild!, 1);
    newRange.collapse(true);

    sel.removeAllRanges();
    sel.addRange(newRange);
  }

  /* ----------------------------
     TOOLBAR ACTIONS
  ----------------------------- */

  function setNormalTextMode() {
    editorRef.current?.focus();
    exitInlineFormatting();
    setBoldMode(false);
    setItalicMode(false);
  }

  function toggleBold() {
    editorRef.current?.focus();
    if (hasTextSelection()) {
      document.execCommand("bold");
      return;
    }
    setBoldMode((prev) => {
      prev ? exitInlineFormatting() : insertInlineSpan("bold");
      return !prev;
    });
    setItalicMode(false);
  }

  function toggleItalic() {
    editorRef.current?.focus();
    if (hasTextSelection()) {
      document.execCommand("italic");
      return;
    }
    setItalicMode((prev) => {
      prev ? exitInlineFormatting() : insertInlineSpan("italic");
      return !prev;
    });
    setBoldMode(false);
  }

  function detectActiveFormats() {
    const sel = window.getSelection();
    if (!sel || !sel.rangeCount) return;

    let node = sel.getRangeAt(0).startContainer as Node;

    let bold = false;
    let italic = false;

    while (node && node !== editorRef.current) {
      if (node.nodeType === Node.ELEMENT_NODE) {
        const el = node as HTMLElement;

        if (
          el.tagName === "B" ||
          el.tagName === "STRONG" ||
          el.style.fontWeight === "bold"
        ) {
          bold = true;
        }

        if (
          el.tagName === "I" ||
          el.tagName === "EM" ||
          el.style.fontStyle === "italic"
        ) {
          italic = true;
        }
      }
      node = node.parentNode!;
    }

    setBoldMode(bold);
    setItalicMode(italic);
  }

  useEffect(() => {
    document.addEventListener("selectionchange", detectActiveFormats);
    return () => {
      document.removeEventListener("selectionchange", detectActiveFormats);
    };
  }, []);

  function insertCodeBlock() {
    editorRef.current?.focus();

    const sel = window.getSelection();
    if (!sel || !sel.rangeCount) return;

    const range = sel.getRangeAt(0);

    const code = document.createElement("div");
    code.setAttribute("data-code-block", "true");
    code.contentEditable = "true";
    code.className = "vscode-code";
    code.innerHTML = "<br>";

    range.insertNode(code);

    const newRange = document.createRange();
    newRange.setStart(code, 0);
    newRange.collapse(true);

    sel.removeAllRanges();
    sel.addRange(newRange);
  }

  async function submitPost() {
    let valid = true;

    setTitleError("");
    setSummaryError("");
    setCoverImageError("");
    setCategoryError("");
    setContentError("");

    if (title.length < 5 || title.length > 100) {
      setTitleError("Title must be between 5 and 100 characters.");
      valid = false;
    }

    if (summary.length < 10 || summary.length > 300) {
      setSummaryError("Summary must be between 10 and 300 characters.");
      valid = false;
    }

    if (!coverImage) {
      setCoverImageError("Cover image is required.");
      valid = false;
    }

    if (categories.length < 1 || categories.length > 2) {
      setCategoryError("Please select 1–2 categories.");
      valid = false;
    }

    const html = editorRef.current?.innerHTML || "";
    const turndown = new TurndownService({
      codeBlockStyle: "fenced",
      strongDelimiter: "**",
      emDelimiter: "*",
    });
    const markdown = turndown.turndown(html);

    if (markdown.length < 200) {
      setContentError("Content must be at least 200 characters.");
      valid = false;
    }

    if (!valid) return;

    if (!auth.currentUser) {
      alert("Not logged in.");
      return;
    }

    setIsLoading(true);

    const form = new FormData();
    form.append("title", title);
    form.append("summary", summary);
    form.append("categories", JSON.stringify(categories));
    form.append("authorId", auth.currentUser.uid);
    form.append("contentText", markdown);
    if (coverImage) form.append("coverImage", coverImage);

    const token = await auth.currentUser.getIdToken();
    const res = await fetch("/api/posts", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    });

    const data = await res.json();
    setIsLoading(false);

    if (data.id) {
      window.location.href = "/home";
    } else {
      alert(data.error);
    }
  }

  return (
    <div className="flex gap-10 p-6 cursor-default">

      {/* LEFT PANEL */}
      <div className="w-2/3 bg-white border border-gray-300 rounded-xl p-8 shadow-sm">

        {/* HEADER */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">Create Research Post</h1>
            <p className="text-gray-500 text-sm">
              Share your research findings with the community
            </p>
          </div>

          <button
            onClick={submitPost}
            disabled={isLoading}
            className="px-5 py-2 rounded-lg bg-blue-600 text-white cursor-pointer"
          >
            {isLoading ? "Publishing..." : "Publish"}
          </button>
        </div>

        {/* TITLE */}
        {titleError && <p className="text-red-500 text-sm mb-2">{titleError}</p>}
        <input
          className="w-full p-3 border rounded-lg mb-5 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Enter your research title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        {/* COVER IMAGE */}
        {coverImageError && <p className="text-red-500 text-sm mb-2">{coverImageError}</p>}
        <div className="mb-5">
          <label className="block font-semibold mb-2">Research Cover</label>

          <div
            className={`h-80 border rounded-lg flex items-center justify-center relative overflow-hidden ${
              isDragging ? "border-blue-500 bg-blue-50" : "border-gray-300"
            }`}
            onDragEnter={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              const file = e.dataTransfer.files?.[0];
              if (file) setCoverImage(file);
            }}
          >
            <input
              type="file"
              hidden
              id="coverInput"
              accept="image/*"
              onChange={(e) => setCoverImage(e.target.files?.[0] || null)}
            />

            {/* ---------- PREVIEW ---------- */}
            {coverImage ? (
              <>
                <img
                  src={URL.createObjectURL(coverImage)}
                  alt="Cover preview"
                  className="absolute inset-0 w-full h-full object-contain"
                />

                {/* Overlay */}
                <div
                  onClick={() =>
                    document.getElementById("coverInput")?.click()
                  }
                  className="
                    absolute inset-0 bg-black/40 opacity-0 hover:opacity-100
                    transition flex items-center justify-center cursor-pointer
                  "
                >
                  <span className="text-white text-sm font-medium">
                    Change image
                  </span>
                </div>
              </>
            ) : (
              /* ---------- UPLOAD UI ---------- */
              <div
                onClick={() =>
                  document.getElementById("coverInput")?.click()
                }
                className="flex flex-col items-center gap-2 text-gray-500 cursor-pointer"
              >
                <svg height="40" width="40" fill="currentColor" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512"><path d="M480 80c8.8 0 16 7.2 16 16l0 256c0 8.8-7.2 16-16 16l-320 0c-8.8 0-16-7.2-16-16l0-256c0-8.8 7.2-16 16-16l320 0zM160 32c-35.3 0-64 28.7-64 64l0 256c0 35.3 28.7 64 64 64l320 0c35.3 0 64-28.7 64-64l0-256c0-35.3-28.7-64-64-64L160 32zm80 112a32 32 0 1 0 -64 0 32 32 0 1 0 64 0zm140.7 3.8c-4.3-7.3-12.2-11.8-20.7-11.8s-16.4 4.5-20.7 11.8l-46.5 79-17.2-24.6c-4.5-6.4-11.8-10.2-19.7-10.2s-15.2 3.8-19.7 10.2l-56 80c-5.1 7.3-5.8 16.9-1.6 24.8S191.1 320 200 320l240 0c8.6 0 16.6-4.6 20.8-12.1s4.2-16.7-.1-24.1l-80-136zM48 152c0-13.3-10.7-24-24-24S0 138.7 0 152L0 448c0 35.3 28.7 64 64 64l360 0c13.3 0 24-10.7 24-24s-10.7-24-24-24L64 464c-8.8 0-16-7.2-16-16l0-296z"/></svg>

                <span className="text-sm">
                  Drag & drop or click to upload
                </span>
              </div>
            )}
          </div>
        </div>


        {/* CATEGORY */}
        {categoryError && (
          <p className="text-red-500 text-sm mb-2">{categoryError}</p>
        )}
        <section className="bg-white border rounded-lg p-6 mb-6">
          <label className="font-medium">
            Categories
          </label>

          <p className="text-sm text-gray-500 mb-2">
            Select 1–2 categories
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {PRESET_CATEGORIES.map((c) => {
              const checked = categories.includes(c.id);

              return (
                <label
                  key={c.id}
                  className={`
                    flex items-center gap-2
                    border rounded px-3 py-2 cursor-pointer
                    transition
                    ${
                      checked
                        ? "bg-blue-50 border-blue-500"
                        : "hover:bg-gray-50"
                    }
                  `}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleCategory(c.id)}
                    className="accent-blue-600"
                  />

                  <span className="text-sm">{c.name}</span>
                </label>
              );
            })}
          </div>
        </section>


        {/* SUMMARY */}
        <h3 className="text-lg font-semibold mb-2">Summary</h3>
        {summaryError && <p className="text-red-500 text-sm mb-2">{summaryError}</p>}
        <textarea
          className="w-full p-3 border rounded-lg mb-5 outline-none resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Abstract / Summary"
          rows={3}
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
        />

        {/* TOOLBAR */}
        {/* <EditorToolbar
          bold={boldMode}
          italic={italicMode}
          onNormal={setNormalTextMode}
          onBold={toggleBold}
          onItalic={toggleItalic}
          onCode={insertCodeBlock}
        /> */}

        {/* EDITOR */}
        <h3 className="text-lg font-semibold mb-2">Content</h3>
        {contentError && <p className="text-red-500 text-sm mb-2">{contentError}</p>}
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          tabIndex={0}
          className="w-full p-3 border rounded-lg h-48 overflow-y-auto outline-none focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-text"
          data-placeholder="Start writing your post..."
        />
      </div>

      {/* RIGHT PANEL – GUIDELINES */}
      <div className="w-1/4 absolute top-0 pt-20 px-4 right-0 border-l h-full border-[#D9D9D9]">
        <h2 className="text-xl font-bold mb-3">Publishing Guidelines</h2>

        <ul className="space-y-4 text-gray-800">
          <li className="flex items-start gap-2">
            <span className="w-2 h-2 bg-black rounded-full mt-2"></span>
            <div>
              <p className="font-semibold">Clear Title</p>
              <p className="text-sm">Use descriptive searchable title</p>
            </div>
          </li>

          <li className="flex items-start gap-2">
            <span className="w-2 h-2 bg-black rounded-full mt-2"></span>
            <div>
              <p className="font-semibold">Proper Abstract</p>
              <p className="text-sm">
                Summarize key findings and methodology
              </p>
            </div>
          </li>

          <li className="flex items-start gap-2">
            <span className="w-2 h-2 bg-black rounded-full mt-2"></span>
            <div>
              <p className="font-semibold">Proper Formatting</p>
              <p className="text-sm">
                Use proper formatting and structure
              </p>
            </div>
          </li>
        </ul>
      </div>
    </div>
  );
}
