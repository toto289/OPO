
import { NextRequest, NextResponse } from "next/server";
import { getUsers } from "@/lib/api";
import bcrypt from "bcrypt";
import { createHash } from "crypto";

function isConnRefused(err: unknown): boolean {
  if (err && typeof err === "object") {
    if ("code" in err && (err as any).code === "ECONNREFUSED") {
      return true;
    }
    if ("cause" in err && (err as any).cause) {
      return isConnRefused((err as any).cause);
    }
    if ("errors" in err && Array.isArray((err as any).errors)) {
      return (err as any).errors.some(e => isConnRefused(e));
    }
  }
  return false;
}

export async function POST(req: NextRequest) {
  try {
    const { email, pass } = await req.json();
    const users = await getUsers();
    const user = users.find(u => u.email === email);

    let passwordMatch = false;

    if (user?.password) {
      try {
        if (user.password.startsWith("$2")) {
          passwordMatch = await bcrypt.compare(pass, user.password);
        } else if (/^[a-f0-9]{64}$/i.test(user.password)) {
          const hashed = createHash("sha256").update(pass).digest("hex");
          passwordMatch = hashed === user.password;
        } else {
          passwordMatch = pass === user.password;
        }
      } catch (err) {
        console.error(err);
      }
    }

    if (passwordMatch) {
      // In a real app, you'd create a session/JWT token here.
      // For this demo, we'll just confirm success.
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: false }, { status: 401 });
  } catch (error) {
    console.error(error);
    const dbDown = isConnRefused(error);
    const defaultMessage = dbDown ? "Database connection failed" : "Server error";
    const message =
      process.env.NODE_ENV === "development" && error instanceof Error
        ? error.message
        : defaultMessage;
    return NextResponse.json(
      { success: false, error: message },
      { status: dbDown ? 503 : 500 }
    );
  }
}
