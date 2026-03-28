import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req: Request, { params }: { params: Promise<{ commentId: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return new NextResponse("Unauthorized", { status: 401 });

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) return new NextResponse("User not found", { status: 404 });

    const { commentId } = await params;
    const { isLike } = await req.json(); // boolean true or false

    if (typeof isLike !== "boolean") return new NextResponse("Invalid payload", { status: 400 });

    const existingVote = await prisma.commentLike.findUnique({
      where: {
        commentId_userId: { commentId, userId: user.id }
      }
    });

    if (existingVote) {
      if (existingVote.isLike === isLike) {
        // Toggle off if clicking same button
        await prisma.commentLike.delete({ where: { id: existingVote.id } });
        return NextResponse.json({ action: "removed" });
      } else {
        // Swap vote
        const updated = await prisma.commentLike.update({
          where: { id: existingVote.id },
          data: { isLike }
        });
        return NextResponse.json({ action: "updated", vote: updated });
      }
    } else {
      // New vote
      const newVote = await prisma.commentLike.create({
        data: { commentId, userId: user.id, isLike }
      });
      return NextResponse.json({ action: "created", vote: newVote });
    }

  } catch (error) {
    return new NextResponse("Internal Error", { status: 500 });
  }
}
