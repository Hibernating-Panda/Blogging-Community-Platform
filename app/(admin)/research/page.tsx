"use client";

import Image from "next/image";
import Sidebar from "@/components/sidebar";
import Navbar from "@/components/navbar";
import React, { useState } from "react";
import { profile } from "console";
import { Scroll } from "lucide-react";

const researchPosts = [
    {
        id: 1,
        title: "Advancements in AI Research",
        date: "2024-01-15",
        content: "This post discusses recent breakthroughs in artificial intelligence research.",
        image: "/photo2.png",
        profileImage: "/profile.jpeg",
        user: "JohnDoe"
    },
        {
        id: 2,
        title: "Advancements in AI Research",
        date: "2024-01-15",
        content: "This post discusses recent breakthroughs in artificial intelligence research.",
        image: "/photo2.png",
        profileImage: "/profile.jpeg",
        user: "John Smith"
    },
];

export default function AdminResearchPage(){
      const [selectedPost, setSelectedPost] = useState<any>(null);
      const [selectedDeletePost, setSelectedDeletePost] = useState<any>(null);
    return(
        <div className=" min-h-screen min-w-screen bg-white text-black">
        <div className="fixed top-0 left-0 right-0 h-16 bg-white border-b z-20">
            <Navbar/>
        </div>
    <div className="flex pt-16 h-screen">
        <div className="w-64 border-r">
            <Sidebar/>
        </div>
            <main className="bg-white items-center flex-1 p-6 overflow-y-auto overflow-auto">
            <div className="flex-1 p-6 overflow-y-auto bg-gray-100 rounded-2xl border-2 border-black shadow-md">
                    <h1 className="text-4xl font-bold ml-1">Research</h1>
                                <div className="bg-white p-6 rounded-2xl mt-4">
                                  {researchPosts.map((post) => (
                                    <div
                                      key={post.id}
                                      className="flex p-4 mb-4 hover:bg-gray-100 rounded-2xl items-center border"
                                    >
                                      {/* Profile image */}
                                      <Image
                                        src={post.image}
                                        alt={post.title}
                                        width={100}
                                        height={50}
                                        className="rounded-xl"
                                      />
                    
                                      {/* User info */}
                                      <div className="flex flex-col ml-4">
                                        <p className="text-lg font-medium">{post.title}</p>
                                        <p className="text-sm text-gray-500">{post.date}</p>
                                      </div>
                    
                                      {/* View details */}
                                      <button
                                        onClick={() => setSelectedPost(post)}
                                        className="ml-auto mr-3 px-4 py-2 border rounded-lg bg-white hover:bg-blue-100"
                                      >
                                        View
                                      </button>
                    
                                      {/* Delete */}
                                      <button
                                        onClick={() => setSelectedDeletePost(post)}
                                        className="flex items-center border-2 rounded-lg bg-white hover:bg-red-100 p-2"
                                      >
                                        <span className="text-red-500 mr-2">Delete</span>
                                        <Image
                                          src="/delete.png"
                                          alt="delete"
                                          width={20}
                                          height={20}
                                        />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                </div>
            </main>
        </div>
              {selectedPost && (
                <div
                  onClick={() => setSelectedPost(null)}
                  className="absolute inset-0 bg-black/50 flex items-center justify-center z-50"
                >
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="bg-white rounded-2xl items-center p-6 w-[80%] h-full relative "
                  >
                    <button
                      onClick={() => setSelectedPost(null)}
                      className="absolute top-3 right-3 text-gray-500 hover:text-black"
                    >
                      ✕
                    </button>

                    <div className="flex mb-4">
                        <Image
                          src={selectedPost.profileImage}
                          alt={selectedPost.user}
                          width={50}
                          height={50}
                        className="rounded-4xl"
                        />
                        <div className="ml-4 flex flex-col">
                            <h1 className="text-xl font-semibold">{selectedPost.user}</h1>
                            <h2 className="text-sm text-gray-500">{selectedPost.date}</h2>
                        </div>
                    </div>
                        <div className="flex flex-col ">
                            <h2>SOS</h2>
                            <h3>{selectedPost.content}</h3>
                        </div>
                        <div className="flex flex-col items-center mb-4">
                        <Image
                            src={selectedPost.image}
                            alt={selectedPost.title}
                            width={screen.width * 1}
                            height={screen.height * 0.3}
                            className="rounded-4xl"
                        />
                        <div className="ml-4">
                                                    <p>This post discusses recent breakthroughs in artificial intelligence research.This post discusses recent breakthroughs in artificial intelligence research.This post discusses recent breakthroughs in artificial intelligence research.This post discusses recent breakthroughs in artificial intelligence research.This post discusses recent breakthroughs in artificial intelligence research.This post discusses recent breakthroughs in artificial intelligence research.This post discusses recent breakthroughs in artificial intelligence research.This post discusses recent breakthroughs in artificial intelligence research.This post discusses recent breakthroughs in artificial intelligence research.This post discusses recent breakthroughs in artificial intelligence research lligence research.This post discusses recent breakthroughs in artificial intelligence research.This post discusses recent breakthroughs in artificial intelligence research.This post discusses recent breakthroughs in artificial intelligence research.This post discusses recent breakthroughs in artificial intelligence research.This post discusses recent breakthroughs in artificial intelligence research.This post discusses recent breakthroughs in artificial intelligence research.This post discusses recent breakthroughs in artificial intelligence research.This post discusses recent breakthroughs in artificial intelligence research.This post discusses recent breakthroughs in artificial intelligence researchlligence research.This post discusses recent breakthroughs in artificial intelligence research.This post discusses recent breakthroughs in artificial intelligence research.This post discusses recent breakthroughs in artificial intelligence research.This post discusses recent breakthroughs in artificial intelligence research.This post discusses recent breakthroughs in artificial intelligence research.This post discusses recent breakthroughs in artificial intelligence research.This post discusses recent breakthroughs in artificial intelligence research.This post discusses recent breakthroughs in artificial intelligence research.This post discusses recent breakthroughs in artificial intelligence researchlligence research.This post discusses recent breakthroughs in artificial intelligence research.This post discusses recent breakthroughs in artificial intelligence research.This post discusses recent breakthroughs in artificial intelligence research.This post discusses recent breakthroughs in artificial intelligence research.This post discusses recent breakthroughs in artificial intelligence research.This post discusses recent breakthroughs in artificial intelligence research.This post discusses recent breakthroughs in artificial intelligence research.This post discusses recent breakthroughs in artificial intelligence research.This post discusses recent breakthroughs in artificial intelligence researchlligence research.This post discusses recent breakthroughs in artificial intelligence research.This post discusses recent breakthroughs in artificial intelligence research.This post discusses recent breakthroughs in artificial intelligence research.This post discusses recent breakthroughs in artificial intelligence research.This post discusses recent breakthroughs in artificial intelligence research.This post discusses recent breakthroughs in artificial intelligence research.This post discusses recent breakthroughs in artificial intelligence research.This post discusses recent breakthroughs in artificial intelligence research.This post discusses recent breakthroughs in artificial intelligence research.</p>

                        </div>
                        </div>
                  </div>
                </div>
              )}

        {selectedDeletePost && (
        <div
          onClick={() => setSelectedDeletePost(null)}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl p-6 w-[400px] relative"
          >
            <button
              onClick={() => setSelectedDeletePost(null)}
              className="absolute top-3 right-3 text-gray-500 hover:text-black"
            >
              ✕
            </button>

            <h2 className="text-xl font-semibold mb-4">
              Delete Post: {selectedDeletePost.title}
            </h2>

            <p>Are you sure you want to delete this post?</p>

            <div className="flex justify-end mt-4 space-x-2">
              <button
                onClick={() => setSelectedDeletePost(null)}
                className="px-4 py-2 border rounded-lg hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  // Handle deletion logic here
                  setSelectedDeletePost(null);
                }}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    )
}