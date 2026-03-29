import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { format } from "date-fns";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const revalidate = 0; // Dynamic rendering for freshness

export default async function Home() {
  const session = await getServerSession(authOptions);
  const userEmail = session?.user?.email;

  const posts = await prisma.post.findMany({
    where: { 
      published: true,
      OR: [
        { followersOnly: false },
        ...(userEmail ? [
          { author: { followers: { some: { follower: { email: userEmail } } } } },
          { author: { email: userEmail } }
        ] : [])
      ]
    },
    include: {
      author: { select: { name: true } }
    },
    orderBy: { createdAt: "desc" },
    take: 20
  });

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <div className="bg-[#0b1b32] border-b border-[#0f2442]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 flex flex-col items-start justify-center min-h-[60vh]">
          <h1 className="text-5xl md:text-7xl font-serif text-sky-50 tracking-tight mb-6 leading-tight max-w-3xl">
            A quiet corner of the internet.
          </h1>
          <p className="text-xl md:text-2xl text-sky-100/70 mb-10 max-w-2xl leading-relaxed font-light">
            Escape the short-form dopamine loop. A space to share your unpolished days, profound learnings, and intimate stories with the people who matter.
          </p>
          <Link
            href="/register"
            className="bg-sky-600 text-white px-8 py-3.5 rounded-full text-lg font-medium hover:bg-sky-500 transition shadow-lg shadow-sky-900/50"
          >
            Start your journal
          </Link>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12 flex flex-col md:flex-row gap-12">
        <div className="md:w-2/3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-8">Recent Reflections</h2>
          
          <div className="space-y-12">
            {posts.length === 0 ? (
              <p className="text-gray-500 text-lg">No stories have been published yet.</p>
            ) : (
              posts.map((post) => (
                <div key={post.id} className="pb-8 border-b border-gray-100 flex flex-col sm:flex-row gap-6 group">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="h-6 w-6 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold shrink-0">
                        {post.author?.name?.[0]?.toUpperCase() || 'U'}
                      </div>
                      <Link href={`/user/${post.authorId}`} className="text-sm font-medium text-gray-900 hover:underline">
                        {post.author?.name || "Unknown"}
                      </Link>
                    </div>
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
                </div>
              ))
            )}
          </div>
        </div>

        <div className="md:w-1/3 md:pl-10 md:border-l md:border-slate-100 hidden md:block">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-6">Themes to explore</h2>
          <div className="flex flex-wrap gap-2">
            {["Reflections", "Dear Diary", "Life Lessons", "Journeys", "Vulnerability", "Small Wins", "Grief"].map(tag => (
              <Link href={`/tag/${tag.toLowerCase()}`} key={tag} className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-full text-sm text-slate-600 cursor-pointer hover:bg-slate-100 transition whitespace-nowrap">
                {tag}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
