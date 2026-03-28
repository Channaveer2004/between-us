"use client";

import { useState } from "react";
import Editor from "@/components/Editor";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useSession } from "next-auth/react";

export default function WritePage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState("");
  const [followersOnly, setFollowersOnly] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [error, setError] = useState("");

  if (status === "loading") {
    return <div className="p-8 text-center text-gray-500">Loading...</div>;
  }

  if (status === "unauthenticated") {
    router.push("/login");
    return null;
  }

  const handlePublish = async () => {
    if (!title.trim() || !content.trim()) {
      setError("Title and content are required.");
      return;
    }
    
    setIsPublishing(true);
    setError("");

    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          content,
          tags,
          published: true, // Auto-publish for simplicity
          followersOnly,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to publish post.");
      }

      const post = await res.json();
      router.push(`/post/${post.slug}`);
      router.refresh();
    } catch (err: any) {
      setError(err.message);
      setIsPublishing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-sm uppercase tracking-wider text-gray-500 font-bold">Draft a new story</h1>
        <button
          onClick={handlePublish}
          disabled={isPublishing}
          className="bg-green-600 text-white px-5 py-2 rounded-full text-sm font-medium hover:bg-green-700 transition disabled:opacity-50 flex items-center"
        >
          {isPublishing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          Publish
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-md text-sm">
          {error}
        </div>
      )}

      <div className="space-y-6">
        <input
          type="text"
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full text-5xl font-serif font-bold text-gray-900 placeholder-gray-300 border-none focus:outline-none focus:ring-0 p-0 bg-transparent"
        />
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 mt-4">
          <input
            type="text"
            placeholder="Add tags (comma separated) e.g. tech, story, coding"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            className="w-full text-lg text-gray-600 placeholder-gray-400 border-none focus:outline-none focus:ring-0 p-0 bg-transparent flex-1"
          />
          <div className="flex items-center gap-2 shrink-0 bg-gray-50 py-2 px-4 rounded-full border border-gray-200">
            <input 
              type="checkbox" 
              id="followersOnly" 
              checked={followersOnly} 
              onChange={(e) => setFollowersOnly(e.target.checked)}
              className="h-4 w-4 text-green-600 border-gray-300 rounded focus:ring-green-500 cursor-pointer"
            />
            <label htmlFor="followersOnly" className="text-sm text-gray-700 font-medium cursor-pointer">Followers Only</label>
          </div>
        </div>
        <div className="mt-8 pt-4">
          <Editor content={content} onChange={setContent} />
        </div>
      </div>
    </div>
  );
}
