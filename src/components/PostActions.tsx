"use client";

import { useState } from "react";
import { Heart, Bookmark } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

interface PostActionsProps {
  postId: string;
  initialLikes: number;
  isLikedInitially: boolean;
  isBookmarkedInitially: boolean;
}

export default function PostActions({ postId, initialLikes, isLikedInitially, isBookmarkedInitially }: PostActionsProps) {
  const { data: session } = useSession();
  const router = useRouter();
  
  const [likes, setLikes] = useState(initialLikes);
  const [isLiked, setIsLiked] = useState(isLikedInitially);
  const [isBookmarked, setIsBookmarked] = useState(isBookmarkedInitially);

  const handleLike = async () => {
    if (!session) {
      router.push("/login");
      return;
    }
    
    setIsLiked(!isLiked);
    setLikes(isLiked ? likes - 1 : likes + 1);
    await fetch(`/api/posts/${postId}/like`, { method: "POST" });
    router.refresh(); // Sync server state
  };

  const handleBookmark = async () => {
    if (!session) {
      router.push("/login");
      return;
    }
    
    setIsBookmarked(!isBookmarked);
    await fetch(`/api/posts/${postId}/bookmark`, { method: "POST" });
    router.refresh(); // Sync server state
  };

  return (
    <div className="flex justify-between items-center py-4 border-t border-b border-gray-100 dark:border-slate-800 my-8 text-gray-500 dark:text-slate-400">
      <div className="flex items-center gap-6">
        <button onClick={handleLike} className="flex items-center gap-2 hover:text-black dark:hover:text-slate-200 transition">
          <Heart className={`h-6 w-6 ${isLiked ? "fill-red-500 text-red-500" : ""}`} strokeWidth={1.5} />
          <span className="text-sm">{likes}</span>
        </button>
        {/* We can add a Comment toggle button here later! */}
      </div>
      
      <div className="flex items-center">
        <button onClick={handleBookmark} className="flex items-center gap-2 hover:text-black dark:hover:text-slate-200 transition">
          <Bookmark className={`h-6 w-6 ${isBookmarked ? "fill-black text-black dark:fill-slate-200 dark:text-slate-200" : ""}`} strokeWidth={1.5} />
        </button>      
      </div>
    </div>
  );
}
