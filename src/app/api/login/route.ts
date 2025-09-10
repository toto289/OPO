
import { NextRequest, NextResponse } from "next/server";
import { getUsers } from "@/lib/api";
import bcrypt from "bcrypt";

export async function POST(req: NextRequest) {
  try {
    const { email, pass } = await req.json();
    const users = await getUsers();
    const user = users.find(u => u.email === email);

    if (user && user.password && (await bcrypt.compare(pass, user.password))) {
      // In a real app, you'd create a session/JWT token here.
      // For this demo, we'll just confirm success.
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ success: false }, { status: 401 });
    }
  } catch (error) {
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
