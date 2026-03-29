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
        <h1 className="text-sm uppercase tracking-wider text-slate-500 font-bold">New journal entry</h1>
        <button
          onClick={handlePublish}
          disabled={isPublishing}
          className="bg-sky-600 text-white px-5 py-2 rounded-full text-sm font-medium hover:bg-sky-700 transition disabled:opacity-50 flex items-center"
        >
          {isPublishing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          Save entry
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
          placeholder="What's on your mind today?"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full text-5xl font-serif font-bold text-slate-900 placeholder-slate-300 border-none focus:outline-none focus:ring-0 p-0 bg-transparent"
        />
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 mt-4">
          <input
            type="text"
            placeholder="Add themes (comma separated) e.g. reflections, tiny wins, dear diary"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            className="w-full text-lg text-slate-600 placeholder-slate-400 border-none focus:outline-none focus:ring-0 p-0 bg-transparent flex-1"
          />
          <div className="flex items-center gap-2 shrink-0 bg-gray-50 py-2 px-4 rounded-full border border-gray-200">
            <input 
              type="checkbox" 
              id="followersOnly" 
              checked={followersOnly} 
              onChange={(e) => setFollowersOnly(e.target.checked)}
              className="h-4 w-4 text-sky-600 border-slate-300 rounded focus:ring-sky-500 cursor-pointer"
            />
            <label htmlFor="followersOnly" className="text-sm text-slate-700 font-medium cursor-pointer">Followers Only</label>
          </div>
        </div>
        <div className="mt-8 pt-4">
          <Editor content={content} onChange={setContent} />
        </div>
      </div>
    </div>
  );
}
