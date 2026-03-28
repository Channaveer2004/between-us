import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: Request, { params }: { params: Promise<{ postId: string }> }) {
  try {
    const { postId } = await params;
    const session = await getServerSession(authOptions);
    const userEmail = session?.user?.email;
    
    const comments = await prisma.comment.findMany({
      where: { postId },
      include: {
        author: {
          select: { name: true, image: true, email: true }
        },
        likes: true
      },
      orderBy: { createdAt: "desc" }
    });

    let currentUserId = null;
    if (userEmail) {
      const u = await prisma.user.findUnique({ where: { email: userEmail } });
      if (u) currentUserId = u.id;
    }

    const finalComments = comments.map(c => ({
      id: c.id,
      text: c.text,
      createdAt: c.createdAt,
      author: c.author,
      likesCount: c.likes.filter(l => l.isLike).length,
      dislikesCount: c.likes.filter(l => !l.isLike).length,
      userVote: currentUserId ? c.likes.find(l => l.userId === currentUserId)?.isLike ?? null : null
    }));

    return NextResponse.json(finalComments);
  } catch (error) {
    console.error("GET_COMMENTS_ERROR", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function POST(req: Request, { params }: { params: Promise<{ postId: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return new NextResponse("Unauthorized", { status: 401 });

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) return new NextResponse("User not found", { status: 404 });

    const { postId } = await params;
    const { text } = await req.json();

    if (!text) return new NextResponse("Missing text", { status: 400 });

    const comment = await prisma.comment.create({
      data: {
        text,
        postId,
        authorId: user.id
      },
      include: {
        author: {
          select: { name: true, image: true }
        }
      }
    });

    return NextResponse.json(comment);
  } catch (error) {
    console.error("POST_COMMENT_ERROR", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
