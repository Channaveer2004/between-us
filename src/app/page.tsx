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
      <div className="bg-[#FFC017] border-b border-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 flex flex-col items-start justify-center min-h-112.5">
          <h1 className="text-7xl md:text-8xl font-serif text-gray-900 tracking-tighter mb-6 leading-tight">
            Stay curious.
          </h1>
          <p className="text-xl md:text-2xl text-gray-800 mb-8 max-w-lg leading-relaxed">
            Discover stories, thinking, and expertise from writers on any topic.
          </p>
          <Link
            href="/register"
            className="bg-black text-white px-8 py-3 rounded-full text-xl font-medium hover:bg-gray-800 transition"
          >
            Start reading
          </Link>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12 flex flex-col md:flex-row gap-12">
        <div className="md:w-2/3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-6">Latest on between-us</h2>
          
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

        <div className="md:w-1/3 md:pl-8 md:border-l md:border-gray-100 hidden md:block">
          <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-6">Discover more of what matters to you</h2>
          <div className="flex flex-wrap gap-2">
            {["Programming", "Data Science", "Technology", "Self Improvement", "Writing", "Relationships", "Machine Learning"].map(tag => (
              <Link href={`/tag/${tag.toLowerCase()}`} key={tag} className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-full text-sm text-gray-600 cursor-pointer hover:bg-gray-100">
                {tag}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
