import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return new NextResponse("User not found", { status: 404 });
    }

    const { title, content, tags, published, followersOnly } = await req.json();

    if (!title || !content) {
      return new NextResponse("Title and content are required", { status: 400 });
    }
    
    // Parse tags safely
    const tagsArray = typeof tags === "string" && tags.trim() !== "" 
      ? tags.split(",").map((t: string) => t.trim().toLowerCase()).filter((t: string) => t.length > 0)
      : [];

    // Advanced Slug Generator: lowercase, strip special characters, insert 6 char unique string 
    let baseSlug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    const slug = `${baseSlug}-${Math.random().toString(36).substring(2, 8)}`;

    const post = await prisma.post.create({
      data: {
        title,
        content,
        slug,
        published: published ?? false,
        followersOnly: followersOnly ?? false,
        authorId: user.id,
        tags: {
          connectOrCreate: tagsArray.map((tag: string) => ({
            where: { name: tag },
            create: { name: tag }
          }))
        }
      }
    });

    return NextResponse.json(post);
  } catch (error) {
    console.error("POST_CREATION_ERROR", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
