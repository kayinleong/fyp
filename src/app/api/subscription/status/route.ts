import { NextResponse } from "next/server";
import { validateSession } from "@/lib/actions/auth.action";
import { checkPremiumAccess } from "@/lib/actions/subscription.action";

export async function GET() {
  try {
    const sessionResponse = await validateSession();
    const userId = sessionResponse.user?.uid;

    if (!userId) {
      return NextResponse.json(
        { isPremium: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    const { hasPremiumAccess, error } = await checkPremiumAccess(userId);

    if (error) {
      return NextResponse.json(
        { isPremium: false, error: "Failed to check subscription status" },
        { status: 500 }
      );
    }

    return NextResponse.json({ isPremium: hasPremiumAccess });
  } catch (error) {
    console.error("Error fetching subscription status:", error);
    return NextResponse.json(
      { isPremium: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

