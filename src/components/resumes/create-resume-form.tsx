"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { createResume } from "@/lib/actions/resume.action";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { CloudUpload, Eye, Clock, Lock, FileText, X } from "lucide-react";

interface CreateResumeFormProps {
  userId: string;
}

export function CreateResumeForm({ userId }: CreateResumeFormProps) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [securityOptions, setSecurityOptions] = useState({
    oneTimeView: false,
    timeLimited: false,
    passwordProtected: false,
    password: "",
    expirationDate: "", // We'll handle this if needed, but for now just a toggle as per UI
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.type !== "application/pdf") {
        toast.error("Please upload a PDF file");
        return;
      }
      setFile(selectedFile);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      toast.error("Please select a file");
      return;
    }

    if (securityOptions.passwordProtected && !securityOptions.password) {
      toast.error("Please enter a password");
      return;
    }

    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const result = await createResume(userId, formData, {
        oneTimeView: securityOptions.oneTimeView,
        timeLimited: securityOptions.timeLimited,
        passwordProtected: securityOptions.passwordProtected,
        password: securityOptions.passwordProtected ? securityOptions.password : null,
        expirationDate: securityOptions.timeLimited ? securityOptions.expirationDate : null,
      });

      if (result.success) {
        toast.success("Resume shared successfully");
        router.push("/resumes");
        router.refresh();
      } else {
        toast.error(result.error || "Failed to share resume");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-blue-600 mb-2">Create Resume Share</h2>
        <p className="text-gray-600">Upload your PDF and set advanced security options.</p>
      </div>

      <div className="mb-8">
        {!file ? (
          <div>
            <input
              type="file"
              accept="application/pdf"
              className="hidden"
              ref={fileInputRef}
              onChange={handleFileChange}
            />
            <Button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <CloudUpload className="mr-2 h-4 w-4" />
              Upload PDF
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="w-10 h-10 bg-blue-100 rounded flex items-center justify-center">
              <FileText className="h-5 w-5 text-blue-500" />
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="font-medium text-sm truncate">{file.name}</p>
              <p className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setFile(null)}
              className="text-gray-400 hover:text-red-500"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      <div className="bg-gray-50/50 rounded-lg p-6 mb-8">
        <h3 className="font-semibold text-gray-900 mb-6">Advanced Security Options</h3>
        
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                <Eye className="h-4 w-4" />
              </div>
              <Label htmlFor="one-time" className="font-medium cursor-pointer">One-time viewing</Label>
            </div>
            <Switch
              id="one-time"
              checked={securityOptions.oneTimeView}
              onCheckedChange={(checked) => setSecurityOptions(prev => ({ ...prev, oneTimeView: checked }))}
            />
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                  <Clock className="h-4 w-4" />
                </div>
                <Label htmlFor="time-limited" className="font-medium cursor-pointer">Time-limited access</Label>
              </div>
              <Switch
                id="time-limited"
                checked={securityOptions.timeLimited}
                onCheckedChange={(checked) => setSecurityOptions(prev => ({ ...prev, timeLimited: checked }))}
              />
            </div>

            {securityOptions.timeLimited && (
              <div className="ml-11">
                <Label htmlFor="expiration-date" className="text-xs text-gray-500 mb-1 block">Expiration Date & Time</Label>
                <Input
                  id="expiration-date"
                  type="datetime-local"
                  value={securityOptions.expirationDate}
                  onChange={(e) => setSecurityOptions(prev => ({ ...prev, expirationDate: e.target.value }))}
                  className="max-w-xs"
                  min={new Date().toISOString().slice(0, 16)}
                />
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                  <Lock className="h-4 w-4" />
                </div>
                <Label htmlFor="password-protected" className="font-medium cursor-pointer">Password protection</Label>
              </div>
              <Switch
                id="password-protected"
                checked={securityOptions.passwordProtected}
                onCheckedChange={(checked) => setSecurityOptions(prev => ({ ...prev, passwordProtected: checked }))}
              />
            </div>
            
            {securityOptions.passwordProtected && (
              <div className="ml-11">
                <Input
                  type="password"
                  placeholder="Enter password"
                  value={securityOptions.password}
                  onChange={(e) => setSecurityOptions(prev => ({ ...prev, password: e.target.value }))}
                  className="max-w-xs"
                />
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 p-4 bg-gray-100 rounded text-sm text-gray-600">
          Empower your sharing with one-time view, and password protection, ensure control over access and your information.
        </div>
      </div>

      <Button
        type="submit"
        className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white min-w-[200px]"
        disabled={isLoading}
      >
        {isLoading ? "Sharing..." : "Share Resume"}
      </Button>
    </form>
  );
}
