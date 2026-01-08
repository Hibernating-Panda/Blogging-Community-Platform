"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";

export default function QuestionDetailPage() {
  const params = useParams();
  const id = params.id;

  useEffect(() => {
    // Scroll to comments if hash exists
    if (window.location.hash === "#comments") {
      const el = document.getElementById("comments");
      el?.scrollIntoView({ behavior: "smooth" });
    }
  }, []);

  return (
    <div className="p-6 space-y-8 bg-gray-100">
      {/* QUESTION HEADER */}
      <div className="flex justify-between items-start border-b pb-4">
        {/* LEFT: Question Title + Meta */}
        <div className="flex-1">
          <h1 className="text-2xl font-semibold leading-snug">
            Android Instrumentation test : Run button icon is not appearing for
            custom buildType & classes not getting resolved
          </h1>

          <div className="flex gap-6 text-sm text-gray-500 mt-2">
            <span>Asked 10 days ago</span>
            <span>Modified 5 days ago</span>
            <span>Viewed 186 times</span>
          </div>
        </div>

        {/* RIGHT: Ask Question Button */}
        <div className="ml-4">
          <button
            onClick={() => (window.location.href = "/forum/ask_question")}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm"
          >
            Ask Question
          </button>
        </div>
      </div>

      {/* QUESTION BODY */}
      <div className="space-y-4 text-gray-800 leading-relaxed">
        <p>
          I am trying to run Android instrumentation tests using a custom
          buildType. However, the Run button icon does not appear and classes
          are not getting resolved.
        </p>

        <p>
          I tried syncing Gradle and invalidating caches, but the issue still
          persists. Is there something I am missing in the Gradle configuration?
        </p>
      </div>

      {/* TAGS */}
      <div className="flex gap-2">
        {["android", "instrumentation-test", "gradle"].map((tag) => (
          <span
            key={tag}
            className="bg-blue-50 text-blue-700 px-3 py-1 rounded text-sm"
          >
            {tag}
          </span>
        ))}
      </div>

      {/* COMMENTS */}
      {/* COMMENTS SECTION */}
      <div id="comments" className="pt-6 border-t border-gray-200 mt-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-sm font-semibold text-gray-700">1 Comment</h2>
        </div>

        {/* COMMENTS SECTION */}
        <div
          id="comments"
          className="mt-8 pt-6 border-t border-gray-700 bg-[#0d1117] text-[#c9d1d9]"
        >
          <div className="flex items-center gap-2 mb-4 px-4">
            <h2 className="text-lg font-normal">1 Comment</h2>
            <span className="text-gray-400 text-xs mt-1">⌵</span>
          </div>

          {/* INPUT BOX - Matching the image style */}
          <div className="px-4 mb-4">
            <div className="flex items-center gap-3 border border-gray-600 rounded-md p-2 bg-[#161b22] hover:border-blue-500 cursor-text">
              <div className="w-6 h-6 rounded bg-green-900 flex items-center justify-center text-[10px]">
                {/* Small logo/avatar icon as seen in image */}
                🟢
              </div>
              <span className="text-gray-400 text-sm">Add a comment</span>
            </div>
          </div>

          {/* COMMENT LIST */}
          <div className="space-y-4 px-4 pb-6">
            <div className="flex gap-3 text-[14px]">
              {/* Circular Avatar */}
              <div className="flex-shrink-0">
                <div className="w-8 h-8 rounded-full bg-blue-500 overflow-hidden">
                  <img
                    src="https://via.placeholder.com/32"
                    alt="avatar"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>

              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[#58a6ff] font-medium hover:underline cursor-pointer">
                    Raju Ugale
                  </span>
                  <span className="text-gray-500 text-xs">
                    Dec 29, 2025 at 16:44
                  </span>
                </div>

                <p className="text-[#c9d1d9] leading-relaxed">
                  I have updated the question, facing this for custom buildType
                </p>

                {/* Action Buttons: Vote, Reply, More */}
                <div className="flex gap-2 mt-3">
                  <button className="flex items-center gap-1.5 bg-[#21262d] border border-gray-600 px-3 py-1 rounded-md text-xs hover:bg-[#30363d]">
                    <span className="text-[10px]">▲</span> 0
                  </button>
                  <button className="flex items-center gap-1.5 bg-[#21262d] border border-gray-600 px-3 py-1 rounded-md text-xs hover:bg-[#30363d]">
                    <span className="text-[10px]">💬</span> Reply
                  </button>
                  <button className="bg-[#21262d] border border-gray-600 px-2 py-1 rounded-md text-xs hover:bg-[#30363d]">
                    •••
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ADD COMMENT LINK/INPUT */}
        <div className="mt-4">
          <button className="text-gray-400 hover:text-blue-500 text-[13px]">
            Your Answer
          </button>

          {/* If you want the textarea to show on click: */}
          <div className="mt-3 space-y-2">
            <textarea
              placeholder="Use comments to ask for more information or suggest improvements. Avoid answering in comments."
              rows={3}
              className="w-full border border-gray-300 rounded-sm p-3 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white"
            />
            <div className="flex justify-start">
              <button className="bg-blue-500 text-white px-3 py-1.5 rounded-sm hover:bg-blue-600 text-[12px] font-medium shadow-sm">
                Post Your Comment
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
