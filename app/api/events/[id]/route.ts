import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";

// GET /api/events/[id]
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });

  const { id } = await params;
  const event = await prisma.event.findUnique({
    where: { id },
    include: {
      createdBy: { select: { name: true } },
      repertoireItems: {
        orderBy: { order: "asc" },
        include: { song: true },
      },
    },
  });

  if (!event) return NextResponse.json({ error: "Evento não encontrado." }, { status: 404 });
  return NextResponse.json(event);
}

// PUT /api/events/[id]
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });

  const { id } = await params;
  try {
    const { name, date, description, repertoire } = await req.json();

    await prisma.repertoireItem.deleteMany({ where: { eventId: id } });

    const event = await prisma.event.update({
      where: { id },
      data: {
        name,
        date: new Date(date),
        description: description ?? "",
        repertoireItems: {
          create:
            repertoire?.map(
              (item: { songId: string; key: string }, idx: number) => ({
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

// DELETE /api/events/[id]
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });

  const { id } = await params;
  await prisma.event.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
