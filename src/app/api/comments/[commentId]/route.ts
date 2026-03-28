import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function PATCH(req: Request, { params }: { params: Promise<{ commentId: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return new NextResponse("Unauthorized", { status: 401 });

    const { commentId } = await params;
    const { text } = await req.json();

    const comment = await prisma.comment.findUnique({ where: { id: commentId }, include: { author: true } });
    if (!comment || comment.author.email !== session.user.email) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const updated = await prisma.comment.update({
      where: { id: commentId },
      data: { text }
    });

    return NextResponse.json(updated);
  } catch (error) {
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ commentId: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return new NextResponse("Unauthorized", { status: 401 });

    const { commentId } = await params;
    
    // Allow author of comment OR author of post to delete
    const comment = await prisma.comment.findUnique({ 
      where: { id: commentId }, 
      include: { author: true, post: { include: { author: true } } } 
    });

    if (!comment) return new NextResponse("Not Found", { status: 404 });

    if (comment.author.email !== session.user.email && comment.post.author.email !== session.user.email) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    await prisma.comment.delete({ where: { id: commentId } });

    return new NextResponse("Deleted", { status: 200 });
  } catch (error) {
    return new NextResponse("Internal Error", { status: 500 });
  }
}
