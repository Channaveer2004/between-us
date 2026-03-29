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
      allowedUsers: session?.user?.email ? {
        where: { email: session.user.email },
        select: { email: true }
      } : false,
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
          <h1 className="text-4xl font-serif font-bold text-slate-900 dark:text-slate-100 mb-4">Private Journal Entry</h1>
          <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-lg mx-auto leading-relaxed">This reflection is deeply personal. You must be explicitly granted access by the author to read it.</p>
          <Link href="/login" className="bg-sky-600 text-white px-6 py-3 rounded-full font-medium shadow-sm hover:bg-sky-500 transition">Sign in to read</Link>
        </div>
      );
    }

    const isAuthor = post.author?.email === session.user.email;
    const isAllowed = post.allowedUsers && post.allowedUsers.length > 0;

    if (!isAuthor && !isAllowed) {
      return (
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-32 text-center min-h-[70vh] flex flex-col justify-center items-center">
          <h1 className="text-4xl font-serif font-bold text-slate-900 dark:text-slate-100 mb-4">Private Journal Entry</h1>
          <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-lg mx-auto leading-relaxed">You have not been granted access reading privileges by {post.author?.name} for this private entry.</p>
          <Link href={`/user/${post.authorId}`} className="bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-100 px-6 py-3 rounded-full font-medium shadow-sm hover:bg-slate-200 dark:hover:bg-slate-700 transition border border-slate-200 dark:border-slate-700">View Author's Profile</Link>
        </div>
      );
    }
  }

  const isLikedInitially = post.likes && post.likes.length > 0;
  const isBookmarkedInitially = post.bookmarks && post.bookmarks.length > 0;

  return (
    <article className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="mb-10">
        <h1 className="text-4xl md:text-5xl font-serif font-bold text-slate-900 dark:text-slate-100 leading-tight mb-6">
          {post.title}
        </h1>
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center shrink-0 text-xl font-bold text-slate-900 dark:text-slate-200">
            {post.author?.name?.[0]?.toUpperCase() || 'U'}
          </div>
          <div>
            <p className="font-medium text-slate-900 dark:text-slate-100">
              <Link href={`/user/${post.authorId}`} className="hover:underline text-slate-900 dark:text-slate-100">
                {post.author?.name || "Unknown Author"}
              </Link>
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Published on {format(new Date(post.createdAt), "MMM d, yyyy")}
            </p>
          </div>
        </div>
        {session?.user?.email === post.author?.email && (
          <div className="mt-8 border-t border-slate-200 dark:border-slate-800 pt-4">
            <Link href={`/edit/${post.id}`} className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 text-sm inline-flex items-center gap-2">
              <PenSquare className="h-4 w-4" /> Edit your entry
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
