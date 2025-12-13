"use client";

import { useState, useEffect } from "react";
import { Label } from "../ui/label";
import { Checkbox } from "../ui/checkbox";
import { Button } from "../ui/button";
import { useRouter, useSearchParams } from "next/navigation";

export default function JobFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Initialize state from URL parameters
  const [isRemote, setIsRemote] = useState(
    searchParams.get("remote") === "true"
  );
  const [salaryRange, setSalaryRange] = useState<(number | string)[]>([
    searchParams.get("minSalary") ? parseInt(searchParams.get("minSalary") || "0") : ("" as string),
    searchParams.get("maxSalary") ? parseInt(searchParams.get("maxSalary") || "200000") : ("" as string),
  ]);
  const [currency, setCurrency] = useState<string>(
    (searchParams.get("currency") as string) || ""
  );
  const [location, setLocation] = useState(searchParams.get("location") || "");
  const [company, setCompany] = useState(searchParams.get("company") || "");
  const [skills, setSkills] = useState(searchParams.get("skills") || "");
  const [jobType, setJobType] = useState(searchParams.get("jobType") || "");
  const [isLoading, setIsLoading] = useState(false);

  // Keep local state in sync when the URL search params change (e.g. after navigation)
  useEffect(() => {
    setIsRemote(searchParams.get("remote") === "true");
    setSalaryRange([
      searchParams.get("minSalary") ? parseInt(searchParams.get("minSalary") || "0") : ("" as string),
      searchParams.get("maxSalary") ? parseInt(searchParams.get("maxSalary") || "200000") : ("" as string),
    ]);
    setCurrency((searchParams.get("currency") as string) || "");
    setLocation(searchParams.get("location") || "");
    setCompany(searchParams.get("company") || "");
    setSkills(searchParams.get("skills") || "");
    setJobType(searchParams.get("jobType") || "");
  }, [searchParams?.toString()]);

  const handleFilter = async () => {
    setIsLoading(true);

    try {
      // Create URL with filter parameters
      const params = new URLSearchParams();
      if (isRemote) params.set("remote", "true");
      if (salaryRange[0] !== "") params.set("minSalary", salaryRange[0].toString());
      if (salaryRange[1] !== "") params.set("maxSalary", salaryRange[1].toString());
      if (currency && currency.trim() !== "") params.set("currency", currency);
      if (location.trim() !== "") params.set("location", location.trim());
      if (company.trim() !== "") params.set("company", company.trim());

  if (skills.trim() !== "") params.set("skills", skills.trim());
  if (jobType.trim() !== "") params.set("jobType", jobType.trim());

      // Update URL to reflect filters
      router.push(`/jobs?${params.toString()}`);

      // The actual filtering happens server-side in the JobList component
    } catch (error) {
      console.error("Error applying filters:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    // Reset all local filter state to defaults
    setIsRemote(false);
    setSalaryRange(["", ""]);
    setLocation("");
    setCompany("");
    setSkills("");
    setJobType("");
    setCurrency("");

    // Navigate to base jobs page (clears URL params)
    router.push(`/jobs`);
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
          <Label>Location</Label>
          <input
            type="text"
            className="w-full border rounded px-3 py-2"
            placeholder="Enter location (e.g. Kuala Lumpur)"
            value={location}
            onChange={e => setLocation(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label>Company</Label>
          <input
            type="text"
            className="w-full border rounded px-3 py-2"
            placeholder="Enter company name"
            value={company}
            onChange={e => setCompany(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label>Skills</Label>
          <input
            type="text"
            className="w-full border rounded px-3 py-2"
            placeholder="Enter skills (comma separated)"
            value={skills}
            onChange={e => setSkills(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label>Job Type</Label>
          <select
            className="w-full border rounded px-3 py-2"
            value={jobType}
            onChange={e => setJobType(e.target.value)}
          >
            <option value="">Any</option>
            <option value="Full-time">Full-time</option>
            <option value="Part-time">Part-time</option>
            <option value="Contract">Contract</option>
            <option value="Temporary">Temporary</option>
            <option value="Internship">Internship</option>
            <option value="Freelance">Freelance</option>
          </select>
        </div>

        <div className="space-y-2">
          <Label>Salary Range</Label>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Currency</Label>
              <select
                className="w-full border rounded px-3 py-2 text-sm"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
              >
                <option value="">Any</option>
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
                <option value="SGD">SGD (S$)</option>
                <option value="MYR">MYR (RM)</option>
                <option value="AUD">AUD (A$)</option>
                <option value="CAD">CAD (C$)</option>
                <option value="JPY">JPY (¥)</option>
                <option value="CNY">CNY (¥)</option>
                <option value="INR">INR (₹)</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1 min-w-0">
                <Label htmlFor="minSalary" className="text-xs text-muted-foreground">
                  Minimum ({currency || "Any"})
                </Label>
                <input
                  id="minSalary"
                  type="number"
                  min="0"
                  className="w-full min-w-0 border rounded px-3 py-2 text-sm"
                  placeholder={`Min (${currency || "Any"})`}
                  value={salaryRange[0] === "" ? "" : salaryRange[0]}
                  onChange={(e) => {
                    const value = e.target.value === "" ? "" : (parseInt(e.target.value) || "");
                    setSalaryRange([value, salaryRange[1]]);
                  }}
                />
              </div>

              <div className="space-y-1 min-w-0">
                <Label htmlFor="maxSalary" className="text-xs text-muted-foreground">
                  Maximum ({currency || "Any"})
                </Label>
                <input
                  id="maxSalary"
                  type="number"
                  min="0"
                  className="w-full min-w-0 border rounded px-3 py-2 text-sm"
                  placeholder={`Max (${currency || "Any"})`}
                  value={salaryRange[1] === "" ? "" : salaryRange[1]}
                  onChange={(e) => {
                    const value = e.target.value === "" ? "" : (parseInt(e.target.value) || "");
                    setSalaryRange([salaryRange[0], value]);
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="flex gap-3">
        <Button
          variant="outline"
          onClick={handleReset}
          className="flex-1"
          disabled={isLoading}
        >
          Reset
        </Button>
        <Button onClick={handleFilter} className="flex-1" disabled={isLoading}>
          {isLoading ? "Applying..." : "Apply Filters"}
        </Button>
      </div>
    </div>
  );
}
