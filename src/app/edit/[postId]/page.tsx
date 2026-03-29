"use client";

import { useState, useEffect } from "react";
import Editor from "@/components/Editor";
import { useRouter, useParams } from "next/navigation";
import { Loader2, Users } from "lucide-react";
import { useSession } from "next-auth/react";

export default function EditPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const params = useParams();
  const postId = params.postId as string;
  
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState("");
  const [followersOnly, setFollowersOnly] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
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
          }
        })
        .finally(() => setIsLoadingFollowers(false));
    }
  }, [status]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    if (postId) {
      fetch(`/api/posts/${postId}`)
        .then(res => {
          if (!res.ok) throw new Error("Not found");
          return res.json();
        })
        .then(data => {
          setTitle(data.title);
          setTags(data.tags?.map((t: any) => t.name).join(", ") || "");
          setFollowersOnly(data.followersOnly || false);
          if (data.allowedUsers && Array.isArray(data.allowedUsers)) {
            setSelectedFollowers(data.allowedUsers.map((u: any) => u.id));
          }
          setIsLoading(false);
        })
        .catch(() => {
          router.push("/");
        });
    }
  }, [postId, status, router]);

  const handleUpdate = async () => {
    if (!title.trim() || !content.trim()) {
      setError("Title and content are required.");
      return;
    }
    
    setIsPublishing(true);
    setError("");

    try {
      const res = await fetch(`/api/posts/${postId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          title, 
          content, 
          tags, 
          followersOnly,
          allowedUserIds: followersOnly ? selectedFollowers : []
        }),
      });

      if (!res.ok) throw new Error("Failed to update post.");

      const post = await res.json();
      router.push(`/post/${post.slug}`);
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsPublishing(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this post?")) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/posts/${postId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete post.");
      router.push("/profile");
      router.refresh();
    } catch (err: any) {
      setError(err.message);
      setIsDeleting(false);
    }
  };

  if (status === "loading" || isLoading) {
    return <div className="p-8 text-center text-gray-500">Loading...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-sm uppercase tracking-wider text-slate-500 dark:text-slate-400 font-bold">Edit journal entry</h1>
        <div className="flex gap-4">
          <button
            onClick={handleDelete}
            disabled={isDeleting || isPublishing}
            className="text-red-500 hover:text-red-700 text-sm font-medium transition disabled:opacity-50"
          >
            Delete
          </button>
          <button
            onClick={handleUpdate}
            disabled={isPublishing || isDeleting}
            className="bg-sky-600 text-white px-5 py-2 rounded-full text-sm font-medium hover:bg-sky-700 transition disabled:opacity-50 flex items-center"
          >
            {isPublishing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Save Changes
          </button>
        </div>
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
            className="flex-1 text-lg text-slate-600 dark:text-slate-300 placeholder-slate-400 dark:placeholder-slate-600 border-none focus:outline-none focus:ring-0 p-0 bg-transparent"
          />
          <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-900 px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-800 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition whitespace-nowrap w-max shrink-0">
            <input
              type="checkbox"
              checked={followersOnly}
              onChange={(e) => {
                const isChecked = e.target.checked;
                setFollowersOnly(isChecked);
                if (isChecked && selectedFollowers.length === 0) {
                  setSelectedFollowers(followers.map(f => f.id));
                }
              }}
              className="rounded text-sky-600 focus:ring-sky-500 h-4 w-4 cursor-pointer"
            />
            <span className="font-medium text-slate-700 dark:text-slate-300">Followers Only <span className="text-slate-400 dark:text-slate-500 font-normal">gate</span></span>
          </label>
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
