import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import PostActions from "@/components/PostActions";
import Comments from "@/components/Comments";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Link from "next/link";
import { PenSquare } from "lucide-react";

export default async function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const session = await getServerSession(authOptions);
  let userId = null;

  if (session?.user?.email) {
    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (user) userId = user.id;
  }
  
  const post = await prisma.post.findUnique({
    where: { slug },
    include: { 
      author: {
        include: {
          followers: session?.user?.email ? {
            where: { follower: { email: session.user.email } }
          } : false
        }
      },
      _count: { select: { likes: true } },
      likes: userId ? { where: { userId } } : false,
      bookmarks: userId ? { where: { userId } } : false,
    }
  });

  if (!post) {
    return notFound();
  }

  if (post.followersOnly) {
    if (!session?.user?.email) {
      return (
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-32 text-center min-h-[70vh] flex flex-col justify-center items-center">
          <h1 className="text-4xl font-serif font-bold text-gray-900 mb-4">Member-only story</h1>
          <p className="text-gray-500 mb-8 max-w-lg mx-auto leading-relaxed">This story is marked as strictly for followers. Sign in and follow {post.author?.name} to unlock it.</p>
          <Link href="/login" className="bg-green-600 text-white px-6 py-3 rounded-full font-medium shadow-sm hover:bg-green-700 transition">Sign in to read</Link>
        </div>
      );
    }

    const isAuthor = post.author?.email === session.user.email;
    const isFollower = post.author?.followers && post.author.followers.length > 0;

    if (!isAuthor && !isFollower) {
      return (
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-32 text-center min-h-[70vh] flex flex-col justify-center items-center">
          <h1 className="text-4xl font-serif font-bold text-gray-900 mb-4">Member-only story</h1>
          <p className="text-gray-500 mb-8 max-w-lg mx-auto leading-relaxed">You must be following {post.author?.name} to read this private story.</p>
          <Link href={`/user/${post.authorId}`} className="bg-black text-white px-6 py-3 rounded-full font-medium shadow-sm hover:bg-gray-800 transition">View Profile to Follow</Link>
        </div>
      );
    }
  }

  const isLikedInitially = post.likes && post.likes.length > 0;
  const isBookmarkedInitially = post.bookmarks && post.bookmarks.length > 0;

  return (
    <article className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="mb-10">
        <h1 className="text-4xl md:text-5xl font-serif font-bold text-gray-900 leading-tight mb-6">
          {post.title}
        </h1>
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center shrink-0 text-xl font-bold">
            {post.author?.name?.[0]?.toUpperCase() || 'U'}
          </div>
          <div>
            <p className="font-medium text-gray-900">
              <Link href={`/user/${post.authorId}`} className="hover:underline text-black">
                {post.author?.name || "Unknown Author"}
              </Link>
            </p>
            <p className="text-sm text-gray-500">
              Published on {format(new Date(post.createdAt), "MMM d, yyyy")}
            </p>
          </div>
        </div>
        {session?.user?.email === post.author?.email && (
          <div className="mt-8 border-t border-gray-100 pt-4">
            <Link href={`/edit/${post.id}`} className="text-gray-500 hover:text-gray-900 text-sm inline-flex items-center gap-2">
              <PenSquare className="h-4 w-4" /> Edit your article
            </Link>
          </div>
        )}
      </div>
      
      <PostActions 
        postId={post.id} 
        initialLikes={post._count.likes} 
        isLikedInitially={isLikedInitially} 
        isBookmarkedInitially={isBookmarkedInitially} 
      />

      <div 
        className="ProseMirror prose-lg mt-12 mb-16"
        dangerouslySetInnerHTML={{ __html: post.content || "" }} 
      />

      <Comments postId={post.id} postAuthorEmail={post.author?.email || undefined} />
    </article>
  );
}
