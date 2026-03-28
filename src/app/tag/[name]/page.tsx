import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { format } from "date-fns";

export default async function TagPage({ params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  const decodedName = decodeURIComponent(name).toLowerCase();

  const posts = await prisma.post.findMany({
    where: {
      published: true,
      tags: { some: { name: decodedName } }
    },
    include: { author: { select: { name: true } } },
    orderBy: { createdAt: "desc" }
  });

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 min-h-screen">
      <div className="flex items-center gap-4 mb-2">
        <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center font-bold text-gray-500">#</div>
        <h1 className="text-4xl font-serif font-bold text-gray-900 capitalize">{decodedName}</h1>
      </div>
      
      <p className="text-gray-500 mb-12 border-b border-gray-100 pb-6">{posts.length} stories in this tag</p>

      <div className="space-y-10">
        {posts.length === 0 && (
          <div className="text-center py-20 text-gray-500 text-lg">
            No stories published under this tag yet! Be the first to write one!
          </div>
        )}
        
        {posts.map((post) => (
          <div key={post.id} className="pb-8 border-b border-gray-100 flex flex-col sm:flex-row gap-6 group">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-3">
                <div className="h-6 w-6 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold shrink-0">
                  {post.author?.name?.[0]?.toUpperCase() || 'U'}
                </div>
                <span className="text-sm font-medium text-gray-900">{post.author?.name || "Unknown"}</span>
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
        ))}
      </div>
    </div>
  );
}
