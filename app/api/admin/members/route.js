import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

/**
 * GET /api/admin/members
 * Get all members with their roles and divisions
 */
export async function GET() {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin (role_id: 1=Super Admin, 2=Admin)
    if (!session.role_id || session.role_id > 2) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const members = await prisma.member.findMany({
      include: {
        role: true,
        division: true,
        subDivision: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    const formatted = members.map((member) => ({
      id: member.id,
      name: member.name,
      email: member.email,

      role_id: member.roleId,
      role_name: member.role?.name || null,

      division_id: member.divisionId,
      division_name: member.division?.name || null,

      sub_division_id: member.subDivisionId,
      sub_division_name: member.subDivision?.name || null,
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    console.error("Error fetching members:", error);

    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
}
