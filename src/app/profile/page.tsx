import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";

export default async function ProfilePage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.email) {
    redirect("/login");
  }

  const resolvedParams = await searchParams;
  const activeTab = resolvedParams?.tab === "saved" ? "saved" : (resolvedParams?.tab === "followers" ? "followers" : "stories");

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: {
      followers: {
        include: {
          follower: { select: { id: true, name: true, email: true } }
        }
      },
      posts: {
        orderBy: { createdAt: "desc" }
      },
      bookmarks: {
        include: {
          post: {
            include: { author: true }
          }
        },
        orderBy: { createdAt: "desc" }
      }
    }
  });

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex flex-col md:flex-row gap-12 min-h-screen">
      
      {/* Main content: Posts / Reading List */}
      <div className="md:w-2/3">
        <h1 className="text-4xl font-serif font-bold text-slate-900 dark:text-slate-100 mb-8 md:hidden">{user.name}</h1>
        
        <div className="border-b border-slate-200 dark:border-slate-800 mb-8">
          <nav className="-mb-px flex space-x-8">
            <Link 
              href="/profile"
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'stories' ? 'border-slate-900 text-slate-900 dark:border-slate-100 dark:text-slate-100' : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:border-slate-300 dark:hover:border-slate-700'}`}
            >
              Your Stories
            </Link>
            <Link 
              href="/profile?tab=saved"
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'saved' ? 'border-slate-900 text-slate-900 dark:border-slate-100 dark:text-slate-100' : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:border-slate-300 dark:hover:border-slate-700'}`}
            >
              Reading List
            </Link>
            <Link 
              href="/profile?tab=followers"
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'followers' ? 'border-slate-900 text-slate-900 dark:border-slate-100 dark:text-slate-100' : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:border-slate-300 dark:hover:border-slate-700'}`}
            >
              Followers
            </Link>
          </nav>
        </div>

        <div className="space-y-8">
          {activeTab === "stories" && (
            user.posts.length === 0 ? (
              <p className="text-slate-500 dark:text-slate-400">You haven't written any stories yet.</p>
            ) : (
              user.posts.map((post) => (
                <div key={post.id} className="pb-8 border-b border-slate-100 dark:border-slate-800">
                  <Link href={`/post/${post.slug}`} className="block group">
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 group-hover:underline mb-2">{post.title}</h2>
                    <p className="text-slate-600 dark:text-slate-400 line-clamp-2 mb-3">
                      {post.content?.replace(/<[^>]*>?/gm, '').substring(0, 150)}...
                    </p>
                  </Link>
                  <div className="flex gap-4 text-sm text-slate-500 dark:text-slate-500 mt-2">
                    <span>Published on {format(new Date(post.createdAt), "MMM d, yyyy")}</span>
                    <Link href={`/edit/${post.id}`} className="hover:text-slate-900 dark:hover:text-slate-300 underline">Edit</Link>
                  </div>
                </div>
              ))
            )
          )}

          {activeTab === "saved" && (
            user.bookmarks.length === 0 ? (
              <p className="text-slate-500 dark:text-slate-400 text-lg py-12 text-center">No saved stories. Start reading and click the bookmark icon to save your favorites!</p>
            ) : (
              user.bookmarks.map((bookmark) => (
                <div key={bookmark.id} className="pb-8 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row gap-6 group">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="h-6 w-6 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-slate-100 flex items-center justify-center text-xs font-bold shrink-0">
                        {bookmark.post.author?.name?.[0]?.toUpperCase() || 'U'}
                      </div>
                      <span className="text-sm font-medium text-slate-900 dark:text-slate-200">{bookmark.post.author?.name || "Unknown"}</span>
                    </div>
                    <Link href={`/post/${bookmark.post.slug}`}>
                      <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 group-hover:underline mb-2">{bookmark.post.title}</h3>
                      <p className="text-slate-600 dark:text-slate-400 line-clamp-2 mb-4 leading-relaxed">
                        {bookmark.post.content?.replace(/<[^>]*>?/gm, '').substring(0, 150)}...
                      </p>
                    </Link>
                    <div className="flex gap-4 text-xs text-slate-500 dark:text-slate-500">
                      <span>{format(new Date(bookmark.post.createdAt), "MMM d, yyyy")}</span>
                      <span>·</span>
                      <span className="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-sm">Reading List</span>
                    </div>
                  </div>
                </div>
              ))
            )
          )}

          {activeTab === "followers" && (
            user.followers.length === 0 ? (
              <p className="text-slate-500 dark:text-slate-400 text-lg py-12 text-center">You don't have any followers yet. Keep writing and sharing to grow your audience!</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {user.followers.map((f) => {
                  const follower = f.follower;
                  return (
                    <Link key={follower.id} href={`/user/${follower.id}`} className="flex items-center gap-4 p-4 border border-slate-100 dark:border-slate-800 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-900 transition">
                      <div className="h-12 w-12 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-xl font-bold shrink-0 text-slate-600 dark:text-slate-100">
                        {follower.name?.[0]?.toUpperCase() || 'U'}
                      </div>
                      <div className="overflow-hidden">
                        <h3 className="font-bold text-slate-900 dark:text-slate-100 truncate">{follower.name || "Unknown User"}</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 truncate">{follower.email}</p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )
          )}
        </div>
      </div>

      {/* Sidebar: Profile Info */}
      <div className="md:w-1/3">
        <div className="sticky top-24">
          <div className="h-24 w-24 bg-slate-200 dark:bg-slate-800 rounded-full mb-6 flex items-center justify-center text-4xl font-bold shrink-0 text-slate-900 dark:text-slate-100">
            {user.name?.[0]?.toUpperCase()}
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">{user.name}</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mb-6 mt-1">{user.email}</p>
        </div>
      </div>
      
    </div>
  );
}
