"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useFacialSetup } from "@/hooks/useFacialSetup";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/icons";
import Link from "next/link";

export default function FacialSetupNotification() {
  const pathname = usePathname();
  const { user, needsFacialSetup } = useFacialSetup();
  const [showNotification, setShowNotification] = useState(false);

  useEffect(() => {
    // Show notification on profile page if user needs facial setup
    if (pathname === "/profile" && needsFacialSetup) {
      setShowNotification(true);
    } else {
      setShowNotification(false);
    }
  }, [pathname, needsFacialSetup]);

  if (!showNotification || !user) {
    return null;
  }

  return (
    <Alert className="mb-6 border-orange-200 bg-orange-50">
      <Icons.checkCircle className="h-4 w-4 text-orange-600" />
      <AlertDescription className="flex items-center justify-between">
        <div>
          <strong className="text-orange-800">
            Facial Recognition Setup Required
          </strong>
          <p className="text-orange-700 text-sm mt-1">
            Complete facial recognition setup to access all features of
            RabbitJob securely.
          </p>
        </div>
        <Button asChild size="sm" className="ml-4">
          <Link href="/setup-facial">Complete Setup</Link>
        </Button>
      </AlertDescription>
    </Alert>
  );
}
