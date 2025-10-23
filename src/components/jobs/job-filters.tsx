"use client";

import { useState } from "react";
import { Label } from "../ui/label";
import { Checkbox } from "../ui/checkbox";
import { Button } from "../ui/button";
import { Slider } from "../ui/slider";
import { useRouter, useSearchParams } from "next/navigation";

export default function JobFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Initialize state from URL parameters
  const [isRemote, setIsRemote] = useState(
    searchParams.get("remote") === "true"
  );
  const [salaryRange, setSalaryRange] = useState([
    parseInt(searchParams.get("minSalary") || "0"),
    parseInt(searchParams.get("maxSalary") || "200000"),
  ]);
  const [isLoading, setIsLoading] = useState(false);

  const handleFilter = async () => {
    setIsLoading(true);

    try {
      // Create URL with filter parameters
      const params = new URLSearchParams();
      if (isRemote) params.set("remote", "true");
      params.set("minSalary", salaryRange[0].toString());
      params.set("maxSalary", salaryRange[1].toString());

      // Update URL to reflect filters
      router.push(`/jobs?${params.toString()}`);

      // The actual filtering happens server-side in the JobList component
    } catch (error) {
      console.error("Error applying filters:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 p-4 border rounded-lg">
      <h2 className="text-xl font-semibold">Filters</h2>

      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="remote"
            checked={isRemote}
            onCheckedChange={(checked) => setIsRemote(checked as boolean)}
          />
          <Label htmlFor="remote">Remote only</Label>
        </div>

        <div className="space-y-2">
          <Label>Salary Range</Label>
          <div className="pt-4">
            <Slider
              min={0}
              max={200000}
              step={5000}
              value={salaryRange}
              onValueChange={(value) => setSalaryRange(value as number[])}
            />
          </div>
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>${salaryRange[0].toLocaleString()}</span>
            <span>${salaryRange[1].toLocaleString()}</span>
          </div>
        </div>
      </div>

      <Button onClick={handleFilter} className="w-full" disabled={isLoading}>
        {isLoading ? "Applying..." : "Apply Filters"}
      </Button>
    </div>
  );
}
