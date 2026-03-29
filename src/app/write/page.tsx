"use client";

import { useState } from "react";
import Editor from "@/components/Editor";
import { useRouter } from "next/navigation";
import { Loader2, Users } from "lucide-react";
import { useSession } from "next-auth/react";
import { useEffect } from "react";

export default function WritePage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState("");
  const [followersOnly, setFollowersOnly] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [error, setError] = useState("");
  const [followers, setFollowers] = useState<any[]>([]);
  const [selectedFollowers, setSelectedFollowers] = useState<string[]>([]);
  const [isLoadingFollowers, setIsLoadingFollowers] = useState(false);

  useEffect(() => {
    if (status === "authenticated") {
      setIsLoadingFollowers(true);
      fetch('/api/user/followers')
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            setFollowers(data);
            setSelectedFollowers(data.map(f => f.id));
          }
        })
        .finally(() => setIsLoadingFollowers(false));
    }
  }, [status]);

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
          allowedUserIds: followersOnly ? selectedFollowers : [],
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
        <h1 className="text-sm uppercase tracking-wider text-slate-500 dark:text-slate-400 font-bold">New journal entry</h1>
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
          className="w-full text-5xl font-serif font-bold text-slate-900 dark:text-slate-100 placeholder-slate-300 dark:placeholder-slate-700 border-none focus:outline-none focus:ring-0 p-0 bg-transparent"
        />
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 mt-4">
          <input
            type="text"
            placeholder="Add themes (comma separated) e.g. reflections, tiny wins, dear diary"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            className="w-full text-lg text-slate-600 dark:text-slate-300 placeholder-slate-400 dark:placeholder-slate-600 border-none focus:outline-none focus:ring-0 p-0 bg-transparent flex-1"
          />
          <div className="flex items-center gap-2 shrink-0 bg-slate-50 dark:bg-slate-900 py-2 px-4 rounded-full border border-slate-200 dark:border-slate-800">
            <input 
              type="checkbox" 
              id="followersOnly" 
              checked={followersOnly} 
              onChange={(e) => setFollowersOnly(e.target.checked)}
              className="h-4 w-4 text-sky-600 border-slate-300 dark:border-slate-600 rounded focus:ring-sky-500 cursor-pointer"
            />
            <label htmlFor="followersOnly" className="text-sm text-slate-700 dark:text-slate-300 font-medium cursor-pointer">Followers Only</label>
          </div>
        </div>

        {followersOnly && (
          <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 mt-4">
            <div className="flex items-center gap-2 mb-4 text-slate-700 dark:text-slate-300 font-medium">
              <Users className="h-5 w-5" />
              <h3>Select who can view this entry</h3>
            </div>
            
            {isLoadingFollowers ? (
              <div className="flex gap-2 items-center text-slate-500 text-sm"><Loader2 className="h-4 w-4 animate-spin"/> Loading followers...</div>
            ) : followers.length === 0 ? (
              <p className="text-sm text-slate-500">You don't have any followers yet.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                {followers.map(follower => (
                  <label key={follower.id} className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 cursor-pointer hover:border-sky-300 dark:hover:border-sky-700 transition">
                    <input 
                      type="checkbox"
                      checked={selectedFollowers.includes(follower.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedFollowers([...selectedFollowers, follower.id]);
                        } else {
                          setSelectedFollowers(selectedFollowers.filter(id => id !== follower.id));
                        }
                      }}
                      className="h-4 w-4 text-sky-600 rounded focus:ring-sky-500"
                    />
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="h-6 w-6 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-700 dark:text-slate-300 shrink-0">
                        {follower.name?.[0]?.toUpperCase() || 'U'}
                      </div>
                      <span className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">{follower.name}</span>
                    </div>
                  </label>
                ))}
              </div>
            )}
            <p className="text-xs text-slate-500 mt-4 leading-relaxed">
              If checked, only the selected followers above will receive access to read this journal entry. Anyone unchecked will not be able to see it on their feed.
            </p>
          </div>
        )}

        <div className="mt-8 pt-4">
          <Editor content={content} onChange={setContent} />
        </div>
      </div>
    </div>
  );
}
