import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req: Request, { params }: { params: Promise<{ postId: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return new NextResponse("Unauthorized", { status: 401 });

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) return new NextResponse("User not found", { status: 404 });

    const { postId } = await params;

    const existingBookmark = await prisma.bookmark.findUnique({
      where: {
        postId_userId: {
          postId,
          userId: user.id
        }
      }
    });

    if (existingBookmark) {
      await prisma.bookmark.delete({ where: { id: existingBookmark.id } });
      return NextResponse.json({ bookmarked: false });
    } else {
      await prisma.bookmark.create({
        data: { postId, userId: user.id }
      });
      return NextResponse.json({ bookmarked: true });
    }
  } catch (error) {
    console.error("BOOKMARK_ERROR", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
