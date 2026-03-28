"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function FollowButton({ targetUserId, initialFollow }: { targetUserId: string, initialFollow: boolean }) {
  const { data: session } = useSession();
  const router = useRouter();
  
  const [isFollowing, setIsFollowing] = useState(initialFollow);
  const [isLoading, setIsLoading] = useState(false);

  const toggleFollow = async () => {
    if (!session) {
      router.push("/login");
      return;
    }
    
    setIsLoading(true);
    try {
      const res = await fetch(`/api/users/${targetUserId}/follow`, { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setIsFollowing(data.followed);
        router.refresh();
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={toggleFollow}
      disabled={isLoading}
      className={`px-5 py-2 rounded-full text-sm font-medium transition flex items-center justify-center min-w-25 ${
        isFollowing 
          ? "bg-white text-gray-900 border border-gray-900 hover:bg-gray-50" 
          : "bg-green-600 text-white hover:bg-green-700 border border-transparent"
      }`}
    >
      {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : (isFollowing ? "Following" : "Follow")}
    </button>
  );
}
