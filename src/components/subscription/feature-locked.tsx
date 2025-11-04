import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Lock } from "lucide-react";
import Link from "next/link";

export default function FeatureLocked() {
  return (
    <Card className="w-full max-w-md mx-auto mt-8">
      <CardHeader className="text-center pb-2">
        <div className="w-12 h-12 mx-auto bg-yellow-50 rounded-full flex items-center justify-center mb-4">
          <Lock className="w-6 h-6 text-yellow-600" />
        </div>
        <CardTitle className="text-xl">Premium Feature</CardTitle>
        <CardDescription>
          This feature is only available to premium subscribers
        </CardDescription>
      </CardHeader>
      <CardContent className="text-center pt-2">
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Upgrade your plan to access advanced AI features like Mock Interviews and Resume Analysis
          </p>
          <Button asChild className="w-full">
            <Link href="/subscription">Upgrade to Premium</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}