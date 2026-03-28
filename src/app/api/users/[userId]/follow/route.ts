import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req: Request, { params }: { params: Promise<{ userId: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return new NextResponse("Unauthorized", { status: 401 });

    const currentUser = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!currentUser) return new NextResponse("User not found", { status: 404 });

    const { userId: targetUserId } = await params;

    if (currentUser.id === targetUserId) {
      return new NextResponse("Cannot follow yourself", { status: 400 });
    }

    const existingFollow = await prisma.follows.findUnique({
      where: {
        followerId_followingId: {
          followerId: currentUser.id,
          followingId: targetUserId
        }
      }
    });

    if (existingFollow) {
      await prisma.follows.delete({
        where: {
          followerId_followingId: {
            followerId: currentUser.id,
            followingId: targetUserId
          }
        }
      });
      return NextResponse.json({ followed: false });
    } else {
      await prisma.follows.create({
        data: {
          followerId: currentUser.id,
          followingId: targetUserId
        }
      });
      return NextResponse.json({ followed: true });
    }
  } catch (error) {
    console.error("FOLLOW_ERROR", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
