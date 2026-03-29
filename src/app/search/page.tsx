import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { format } from "date-fns";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const resolvedParams = await searchParams;
  const q = resolvedParams?.q || "";

  const session = await getServerSession(authOptions);
  const userEmail = session?.user?.email;

  const [posts, users] = await Promise.all([
    prisma.post.findMany({
      where: {
        published: true,
        AND: [
          {
            OR: [
              { followersOnly: false },
              ...(userEmail ? [
                { allowedUsers: { some: { email: userEmail } } },
                { author: { email: userEmail } }
              ] : [])
            ]
          },
          {
            OR: [
              { title: { contains: q, mode: "insensitive" } },
              { content: { contains: q, mode: "insensitive" } }
            ]
          }
        ]
      },
      include: { author: { select: { name: true } } },
      orderBy: { createdAt: "desc" }
    }),
    prisma.user.findMany({
      where: {
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { email: { contains: q, mode: "insensitive" } }
        ]
      },
      take: 10
    })
  ]);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 min-h-screen">
      <h1 className="text-4xl font-serif font-bold text-slate-900 dark:text-slate-100 mb-2">Results for <span className="text-slate-500 dark:text-slate-400">"{q}"</span></h1>
      <div className="flex gap-4 text-slate-500 dark:text-slate-400 mb-12 border-b border-slate-100 dark:border-slate-800 pb-4">
        <span>{users.length} people</span>
        <span>·</span>
        <span>{posts.length} stories</span>
      </div>

      {users.length === 0 && posts.length === 0 && (
        <div className="text-center py-20 text-slate-500 dark:text-slate-400 text-lg">
          We couldn't find any people or posts matching "{q}". Try reaching out with different keywords!
        </div>
      )}

      {users.length > 0 && (
        <div className="mb-12">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-6">People</h2>
          <div className="flex flex-wrap gap-6">
            {users.map(user => (
              <Link key={user.id} href={`/user/${user.id}`} className="flex items-center gap-4 p-4 border border-slate-100 dark:border-slate-800 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-900 transition w-full sm:w-[calc(50%-12px)]">
                <div className="h-12 w-12 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-xl font-bold shrink-0 text-slate-600 dark:text-slate-100">
                  {user.name?.[0]?.toUpperCase() || 'U'}
                </div>
                <div className="overflow-hidden">
                  <h3 className="font-bold text-slate-900 dark:text-slate-100 truncate">{user.name || "Unknown User"}</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 truncate">{user.bio || user.email}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {posts.length > 0 && (
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-6">Stories</h2>
          <div className="space-y-10">
            {posts.map((post) => (
              <div key={post.id} className="pb-8 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row gap-6 group">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="h-6 w-6 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-xs font-bold shrink-0 text-slate-600 dark:text-slate-100">
                      {post.author?.name?.[0]?.toUpperCase() || 'U'}
                    </div>
                    <Link href={`/user/${post.authorId}`} className="text-sm font-medium text-slate-900 dark:text-slate-200 hover:underline">
                      {post.author?.name || "Unknown"}
                    </Link>
                  </div>
                  <Link href={`/post/${post.slug}`}>
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 group-hover:underline mb-2">{post.title}</h3>
                    <p className="text-slate-600 dark:text-slate-400 line-clamp-3 mb-4 leading-relaxed">
                      {post.content?.replace(/<[^>]*>?/gm, '').substring(0, 200)}...
                    </p>
                  </Link>
                  <div className="flex gap-4 text-xs text-slate-500 dark:text-slate-500">
                    <span>{format(new Date(post.createdAt), "MMM d, yyyy")}</span>
                    <span>·</span>
                    <span>{Math.max(1, Math.ceil((post.content?.length || 0) / 1000))} min read</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
