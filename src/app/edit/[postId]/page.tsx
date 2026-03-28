"use client";

import { useState, useEffect } from "react";
import Editor from "@/components/Editor";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useSession } from "next-auth/react";
import { useParams } from "next/navigation";

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
          setContent(data.content || "");
          setTags(data.tags?.map((t: any) => t.name).join(", ") || "");
          setFollowersOnly(data.followersOnly || false);
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
        body: JSON.stringify({ title, content, tags, followersOnly }),
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
        <h1 className="text-sm uppercase tracking-wider text-gray-500 font-bold">Edit story</h1>
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
            className="bg-green-600 text-white px-5 py-2 rounded-full text-sm font-medium hover:bg-green-700 transition disabled:opacity-50 flex items-center"
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
            className="flex-1 text-lg text-gray-600 placeholder-gray-400 border-none focus:outline-none focus:ring-0 p-0 bg-transparent"
          />
          <label className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-200 cursor-pointer hover:bg-gray-100 transition whitespace-nowrap w-max shrink-0">
            <input
              type="checkbox"
              checked={followersOnly}
              onChange={(e) => setFollowersOnly(e.target.checked)}
              className="rounded text-green-600 focus:ring-green-500 h-4 w-4 cursor-pointer"
            />
            <span className="font-medium text-gray-700">Followers Only </span>
          </label>
        </div>
        <div className="mt-8 pt-4">
          <Editor content={content} onChange={setContent} />
        </div>
      </div>
    </div>
  );
}
