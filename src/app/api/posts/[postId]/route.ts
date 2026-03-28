import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: Request, { params }: { params: Promise<{ postId: string }> }) {
  try {
    const { postId } = await params;
    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: { tags: true }
    });
    if (!post) {
      return new NextResponse("Not Found", { status: 404 });
    }
    return NextResponse.json(post);
  } catch (error) {
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ postId: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return new NextResponse("Unauthorized", { status: 401 });
    
    const { postId } = await params;
    const post = await prisma.post.findUnique({ where: { id: postId }, include: { author: true } });
    if (!post || post.author.email !== session.user.email) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { title, content, tags, followersOnly } = await req.json();
    
    const tagsArray = typeof tags === "string" && tags.trim() !== "" 
      ? tags.split(",").map((t: string) => t.trim().toLowerCase()).filter((t: string) => t.length > 0)
      : [];

    const updatedPost = await prisma.post.update({
      where: { id: postId },
      data: {
        title,
        content,
        followersOnly: typeof followersOnly === 'boolean' ? followersOnly : undefined,
        tags: {
          set: [],
          connectOrCreate: tagsArray.map((tag: string) => ({
            where: { name: tag },
            create: { name: tag }
          }))
        }
      }
    });

    return NextResponse.json(updatedPost);
  } catch (error) {
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ postId: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return new NextResponse("Unauthorized", { status: 401 });
    
    const { postId } = await params;
    const post = await prisma.post.findUnique({ where: { id: postId }, include: { author: true } });
    if (!post || post.author.email !== session.user.email) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    await prisma.post.delete({ where: { id: postId } });
    return new NextResponse("Deleted", { status: 200 });
  } catch (error) {
    return new NextResponse("Internal Error", { status: 500 });
  }
}
