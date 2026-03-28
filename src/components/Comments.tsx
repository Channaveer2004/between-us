"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { format } from "date-fns";
import { Loader2, Trash2, Edit2, ThumbsUp, ThumbsDown } from "lucide-react";

interface Comment {
  id: string;
  text: string;
  createdAt: string;
  author: {
    name: string | null;
    email: string | null;
  };
  likesCount: number;
  dislikesCount: number;
  userVote: boolean | null;
}

export default function Comments({ postId, postAuthorEmail }: { postId: string, postAuthorEmail?: string }) {
  const { data: session } = useSession();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");

  const fetchComments = () => {
    fetch(`/api/posts/${postId}/comments`)
      .then((res) => res.json())
      .then((data) => {
        setComments(data);
        setIsLoading(false);
      })
      .catch(console.error);
  };

  useEffect(() => {
    fetchComments();
  }, [postId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !session) return;
    
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/posts/${postId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: newComment }),
      });
      
      if (res.ok) {
        fetchComments(); // refresh to get all relations cleanly
        setNewComment("");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (commentId: string) => {
    if (!confirm("Delete this response?")) return;
    try {
      const res = await fetch(`/api/comments/${commentId}`, { method: "DELETE" });
      if (res.ok) {
        setComments(comments.filter(c => c.id !== commentId));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleEditSubmit = async (commentId: string) => {
    if (!editText.trim()) return;
    try {
      const res = await fetch(`/api/comments/${commentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: editText }),
      });
      if (res.ok) {
        const updated = await res.json();
        setComments(comments.map(c => c.id === commentId ? { ...c, text: updated.text } : c));
        setEditingId(null);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleVote = async (commentId: string, isLike: boolean) => {
    if (!session) return; // Optional: redirect to login
    
    // Optimistic UI update
    setComments(comments.map(c => {
      if (c.id === commentId) {
        const previousVote = c.userVote;
        let newLikes = c.likesCount;
        let newDislikes = c.dislikesCount;
        
        // Remove previous vote impact
        if (previousVote === true) newLikes -= 1;
        if (previousVote === false) newDislikes -= 1;
        
        let newUserVote: boolean | null = isLike;
        
        if (previousVote === isLike) {
          newUserVote = null; // Toggle off
        } else {
          if (isLike) newLikes += 1;
          else newDislikes += 1;
        }

        return { ...c, likesCount: newLikes, dislikesCount: newDislikes, userVote: newUserVote };
      }
      return c;
    }));

    // Network request
    await fetch(`/api/comments/${commentId}/vote`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isLike })
    });
  };

  const currentUserEmail = session?.user?.email;

  return (
    <div className="mt-16 pt-8 border-t border-gray-100">
      <h3 className="text-xl font-bold text-gray-900 mb-8">Responses ({comments.length})</h3>
      
      {session ? (
        <form onSubmit={handleSubmit} className="mb-10">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="What are your thoughts?"
            className="w-full p-4 border border-gray-200 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-black focus:border-black resize-none min-h-25"
            maxLength={1000}
          />
          <div className="flex justify-end mt-3">
            <button
              type="submit"
              disabled={isSubmitting || !newComment.trim()}
              className="bg-green-600 text-white px-5 py-2 rounded-full text-sm font-medium hover:bg-green-700 transition disabled:opacity-50 flex items-center"
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Respond
            </button>
          </div>
        </form>
      ) : (
        <div className="p-4 bg-gray-50 rounded-md text-sm text-gray-600 mb-10">
          Sign in to leave a response.
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-8">
          <Loader2 className="h-6 w-6 animate-spin mx-auto text-gray-400" />
        </div>
      ) : (
        <div className="space-y-8">
          {comments.map((comment) => {
            const isUserAuthor = currentUserEmail === comment.author?.email;
            const canDelete = isUserAuthor || currentUserEmail === postAuthorEmail;

            return (
              <div key={comment.id} className="pb-8 border-b border-gray-50 last:border-0 relative group">
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-8 w-8 bg-gray-200 rounded-full flex items-center justify-center text-xs font-bold shrink-0">
                    {comment.author?.name?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-900">{comment.author?.name || "Unknown"}</p>
                    <p className="text-xs text-gray-500">
                      {format(new Date(comment.createdAt), "MMM d, yyyy")}
                    </p>
                  </div>
                  
                  {/* Action Menu (Edit / Delete) */}
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition">
                    {isUserAuthor && (
                      <button onClick={() => { setEditingId(comment.id); setEditText(comment.text); }} className="text-gray-400 hover:text-gray-700">
                        <Edit2 className="h-4 w-4" />
                      </button>
                    )}
                    {canDelete && (
                      <button onClick={() => handleDelete(comment.id)} className="text-gray-400 hover:text-red-600">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>

                {editingId === comment.id ? (
                  <div className="mt-2">
                    <textarea 
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded focus:ring-1 focus:ring-black outline-none text-sm"
                      rows={3}
                    />
                    <div className="flex justify-end gap-2 mt-2">
                      <button onClick={() => setEditingId(null)} className="text-sm text-gray-600 hover:text-black">Cancel</button>
                      <button onClick={() => handleEditSubmit(comment.id)} className="text-sm bg-green-600 text-white px-3 py-1 rounded-full hover:bg-green-700">Save</button>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-800 text-sm whitespace-pre-wrap leading-relaxed">{comment.text}</p>
                )}

                {/* Like / Dislike */}
                <div className="flex items-center gap-4 mt-4 text-gray-500">
                  <button onClick={() => handleVote(comment.id, true)} className={`flex items-center gap-1 text-xs hover:text-black transition ${comment.userVote === true ? 'text-black' : ''}`}>
                    <ThumbsUp className={`h-4 w-4 ${comment.userVote === true ? 'fill-black' : ''}`} /> {comment.likesCount}
                  </button>
                  <button onClick={() => handleVote(comment.id, false)} className={`flex items-center gap-1 text-xs hover:text-black transition ${comment.userVote === false ? 'text-black' : ''}`}>
                    <ThumbsDown className={`h-4 w-4 ${comment.userVote === false ? 'fill-black' : ''}`} /> {comment.dislikesCount}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
