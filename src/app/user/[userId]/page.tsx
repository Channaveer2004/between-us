import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import FollowButton from "./FollowButton";

export default async function PublicProfilePage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params;
  const session = await getServerSession(authOptions);

  const targetedUser = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      _count: { select: { followers: true, following: true, posts: true } },
      posts: {
        where: { 
          published: true,
          OR: [
            { followersOnly: false },
            ...(session?.user?.email ? [
              { author: { followers: { some: { follower: { email: session.user.email } } } } },
              { author: { email: session.user.email } }
            ] : [])
          ]
        },
        orderBy: { createdAt: "desc" },
      }
    }
  });

  if (!targetedUser) return notFound();

  let isFollowing = false;
  let isOwnProfile = false;
  
  if (session?.user?.email) {
    const currentUser = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (currentUser) {
      if (currentUser.id === targetedUser.id) {
        isOwnProfile = true;
      } else {
        const followStatus = await prisma.follows.findUnique({
          where: { followerId_followingId: { followerId: currentUser.id, followingId: targetedUser.id } }
        });
        if (followStatus) isFollowing = true;
      }
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex flex-col md:flex-row gap-12 min-h-screen">
      <div className="md:w-2/3">
        <h2 className="text-4xl font-serif font-bold text-gray-900 mb-8 md:hidden">{targetedUser.name}</h2>
        <div className="border-b border-gray-200 mb-8 pb-4">
          <span className="border-black text-black font-medium text-sm border-b-2 py-4">
            Published Stories
          </span>
        </div>

        <div className="space-y-8">
          {targetedUser.posts.length === 0 ? (
            <p className="text-gray-500">This user hasn't published any stories yet.</p>
          ) : (
            targetedUser.posts.map((post) => (
              <div key={post.id} className="pb-8 border-b border-gray-100 flex flex-col gap-2 group">
                <Link href={`/post/${post.slug}`}>
                  <h3 className="text-2xl font-bold text-gray-900 group-hover:underline mb-2">{post.title}</h3>
                  <p className="text-gray-600 line-clamp-3 mb-4 leading-relaxed">
                    {post.content?.replace(/<[^>]*>?/gm, '').substring(0, 200)}...
                  </p>
                </Link>
                <div className="flex gap-4 text-xs text-gray-500">
                  <span>{format(new Date(post.createdAt), "MMM d, yyyy")}</span>
                  <span>·</span>
                  <span>{Math.max(1, Math.ceil((post.content?.length || 0) / 1000))} min read</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="md:w-1/3">
        <div className="sticky top-24">
          <div className="h-20 w-20 bg-gray-200 rounded-full mb-4 flex items-center justify-center text-3xl font-bold text-gray-600">
            {targetedUser.name?.[0]?.toUpperCase() || "U"}
          </div>
          <h2 className="text-xl font-bold text-gray-900">{targetedUser.name}</h2>
          <p className="text-gray-500 text-sm mt-1">{targetedUser._count.followers} Followers</p>

          <div className="mt-6">
            {!isOwnProfile ? (
              <FollowButton targetUserId={targetedUser.id} initialFollow={isFollowing} />
            ) : (
              <Link href="/profile" className="text-sm text-green-600 hover:text-green-700 font-medium">
                Go to your dashboard
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
