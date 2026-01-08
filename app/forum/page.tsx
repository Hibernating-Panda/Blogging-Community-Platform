"use client";

import { useState } from "react";
import QuestionItem from "@/components/QuestionItem";
import FilterModal from "@/components/FilterModel";

export default function ForumPage() {
  const [showFilter, setShowFilter] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800">
      <div className="px-10 py-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold">Newest Questions</h1>

          <a
            href="/forum/ask_question"
            className="bg-blue-600 text-white px-5 py-2 rounded-md"
          >
            Ask Question
          </a>
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-xl">24,182,937 questions</p>

          <div className="flex items-center gap-2">
            <div className="flex border rounded-md overflow-hidden">
              <button className="px-3 py-1 text-sm bg-gray-100 ">
                Newest
              </button>
              <button className="px-3 py-1 text-sm hover:bg-gray-100">
                Active
              </button>
              <button className="px-3 py-1 text-sm hover:bg-gray-100">
                Bountied
              </button>
              <button className="px-3 py-1 text-sm hover:bg-gray-100">
                Unanswered
              </button>
              <button className="px-3 py-1 text-sm hover:bg-gray-100">
                More
              </button>
            </div>

            <button
              onClick={() => setShowFilter(true)}
              className="px-3 py-1 border rounded-md text-sm hover:bg-gray-100"
            >
              Filter
            </button>
          </div>
        </div>

        {/* Question List */}
        <div className="space-y-6">
          <QuestionItem
            id="1"
            title="Which is the best private engineering college in Indore?"
            desc="Are you search for the best private engineering college in Indore?"
            votes={-3}
            answers={0}
            views={8}
            tags={["java"]}
            author="Medicaps"
            time="4 minutes ago"
          />

          <QuestionItem
            id="2"
            title="R sf installation fails on Debian 11 Bullseye"
            desc="I am trying to install the sf package in R..."
            votes={0}
            answers={0}
            views={5}
            tags={["r", "installation"]}
            author="Jack"
            time="11 minutes ago"
          />
        </div>
      </div>

      {showFilter && <FilterModal onClose={() => setShowFilter(false)} />}
    </div>
  );
}
