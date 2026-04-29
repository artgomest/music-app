import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

// GET /api/profile - get current user profile + stats
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });

  const userId = session.user.id;
  if (!userId) return NextResponse.json({ error: "Usuário inválido." }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      instruments: true,
      notes: true,
      avatarUrl: true,
      createdAt: true,
      songPlays: {
        orderBy: { playedAt: "desc" },
        include: {
          song: { select: { title: true, artist: true } },
        },
      },
    },
  });

  if (!user) return NextResponse.json({ error: "Usuário não encontrado." }, { status: 404 });

  const thisMonth = new Date();
  thisMonth.setDate(1);
  const playsThisMonth = user.songPlays.filter(
    (p) => p.playedAt >= thisMonth
  ).length;

  return NextResponse.json({ ...user, playsThisMonth });
}

// PATCH /api/profile - update profile
export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });

  const userId = session.user.id;
  if (!userId) return NextResponse.json({ error: "Usuário inválido." }, { status: 401 });

  try {
    const { name, instruments, notes } = await req.json();

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(name && { name }),
        ...(instruments !== undefined && { instruments }),
        ...(notes !== undefined && { notes }),
      },
      select: {
        id: true, name: true, email: true, role: true,
        instruments: true, notes: true, avatarUrl: true,
      },
    });

    return NextResponse.json(user);
  } catch {
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}
