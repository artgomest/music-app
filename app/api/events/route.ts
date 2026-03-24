import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";

// GET /api/events - list all events
export async function GET() {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });

  const events = await prisma.event.findMany({
    orderBy: { date: "asc" },
    include: {
      createdBy: { select: { name: true } },
      repertoireItems: {
        orderBy: { order: "asc" },
        include: { song: true },
      },
    },
  });

  return NextResponse.json(events);
}

// POST /api/events - create event
export async function POST(req: Request) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });

  try {
    const { name, date, description, repertoire } = await req.json();

    if (!name || !date) {
      return NextResponse.json({ error: "Campos obrigatórios ausentes." }, { status: 400 });
    }

    const userId = (session.user as { id?: string }).id;
    if (!userId) return NextResponse.json({ error: "Usuário inválido." }, { status: 401 });

    const event = await prisma.event.create({
      data: {
        name,
        date: new Date(date),
        description: description ?? "",
        createdById: userId,
        repertoireItems: {
          create:
            repertoire?.map(
              (
                item: { songId: string; key: string },
                idx: number
              ) => ({
                songId: item.songId,
                key: item.key,
                order: idx,
              })
            ) ?? [],
        },
      },
      include: {
        repertoireItems: { include: { song: true } },
        createdBy: { select: { name: true } },
      },
    });

    return NextResponse.json(event);
  } catch {
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}
