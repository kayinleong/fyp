"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Settings,
  Loader2,
  RotateCcw,
  Sparkles,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import {
  getSwipeAISettings,
  saveSwipeAISettings,
  resetSwipeAISettings,
} from "@/lib/actions/swipe-settings.action";
import {
  SwipeAISettings,
  PriorityLevel,
  DEFAULT_SWIPE_SETTINGS,
  CATEGORY_CONFIG,
  SubCategoryConfig,
} from "@/lib/domains/swipe-settings.domain";
import { cn } from "@/lib/utils";

interface SwipeSettingsPanelProps {
  userId: string;
  onSettingsChange?: (settings: SwipeAISettings) => void;
}

export default function SwipeSettingsPanel({
  userId,
  onSettingsChange,
}: SwipeSettingsPanelProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [settings, setSettings] = useState<SwipeAISettings | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set()
  );

  // Load settings when dialog opens
  useEffect(() => {
    if (open && !settings) {
      loadSettings();
    }
  }, [open]);

  const loadSettings = async () => {
    setIsLoading(true);
    try {
      const response = await getSwipeAISettings(userId);
      if (response.success && response.settings) {
        setSettings(response.settings);
      } else {
        toast.error(response.error || "Failed to load settings");
      }
    } catch (error) {
      console.error("Error loading settings:", error);
      toast.error("Failed to load AI settings");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!settings) return;

    setIsSaving(true);
    try {
      // Ensure we're saving the complete settings object with user_id
      const settingsToSave: SwipeAISettings = {
        ...settings,
        id: userId,
        user_id: userId,
      };

      const response = await saveSwipeAISettings(settingsToSave);
      if (response.success && response.settings) {
        // Update local state with the saved settings
        const savedSettings = response.settings;
        setSettings(savedSettings);
        toast.success("AI settings saved! Refreshing jobs...");
        setOpen(false);
        // Trigger callback to refresh jobs with the saved settings
        // Use a small delay to ensure state is updated
        setTimeout(() => {
          onSettingsChange?.(savedSettings);
        }, 100);
      } else {
        toast.error(response.error || "Failed to save settings");
      }
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error("Failed to save AI settings");
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async () => {
    setIsSaving(true);
    try {
      const response = await resetSwipeAISettings();
      if (response.success && response.settings) {
        setSettings(response.settings);
        toast.success("Settings reset to defaults");
      } else {
        toast.error(response.error || "Failed to reset settings");
      }
    } catch (error) {
      console.error("Error resetting settings:", error);
      toast.error("Failed to reset settings");
    } finally {
      setIsSaving(false);
    }
  };

  const updateMainCategoryPriority = (
    categoryId: string,
    value: PriorityLevel
  ) => {
    if (!settings) return;
    setSettings({
      ...settings,
      mainCategoryPriorities: {
        ...settings.mainCategoryPriorities,
        [categoryId]: value,
      },
    });
  };

  const updateJobTitlePriority = (jobTitle: string, value: PriorityLevel) => {
    if (!settings) return;
    setSettings({
      ...settings,
      jobTitlePriorities: {
        ...settings.jobTitlePriorities,
        [jobTitle]: value,
      },
    });
  };

  const toggleCategory = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const getPriorityIcon = (priority: PriorityLevel | undefined) => {
    switch (priority) {
      case PriorityLevel.HIGH:
        return <span className="h-2 w-2 rounded-full bg-green-500"></span>;
      case PriorityLevel.MEDIUM:
        return <span className="h-2 w-2 rounded-full bg-yellow-500"></span>;
      case PriorityLevel.LOW:
        return <span className="h-2 w-2 rounded-full bg-gray-400"></span>;
      default:
        return <span className="h-2 w-2 rounded-full bg-gray-400"></span>;
    }
  };

  // Always show the button, even if settings aren't loaded yet
  const currentSettings =
    settings ||
    ({
      id: userId,
      user_id: userId,
      mainCategoryPriorities: DEFAULT_SWIPE_SETTINGS.mainCategoryPriorities,
      jobTitlePriorities: DEFAULT_SWIPE_SETTINGS.jobTitlePriorities,
    } as SwipeAISettings);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="default"
          size="default"
          className="gap-2 bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Settings className="h-4 w-4" />
          AI Settings
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-blue-600" />
            AI Job Matching Settings
          </DialogTitle>
          <DialogDescription>
            Set priority level (High, Medium, Low) for job categories. Expand
            categories to fine-tune specific job titles. Jobs with High priority
            will appear first.
          </DialogDescription>
        </DialogHeader>

        {isLoading && !settings ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
            <span className="ml-2">Loading settings...</span>
          </div>
        ) : (
          <div className="w-full space-y-2">
            {CATEGORY_CONFIG.map((category) => {
              const isExpanded = expandedCategories.has(category.id);
              const mainPriority =
                currentSettings.mainCategoryPriorities?.[category.id] ||
                PriorityLevel.MEDIUM;
              const hasSubCategories =
                category.subCategories && category.subCategories.length > 0;

              return (
                <Card key={category.id} className="overflow-hidden">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 flex-1">
                        {hasSubCategories && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={() => toggleCategory(category.id)}
                          >
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </Button>
                        )}
                        <Label
                          className="text-base font-semibold cursor-pointer"
                          onClick={() =>
                            hasSubCategories && toggleCategory(category.id)
                          }
                        >
                          {category.name}
                        </Label>
                        {getPriorityIcon(mainPriority)}
                      </div>
                      <Select
                        value={mainPriority}
                        onValueChange={(value) =>
                          updateMainCategoryPriority(
                            category.id,
                            value as PriorityLevel
                          )
                        }
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={PriorityLevel.HIGH}>
                            <span className="flex items-center gap-2">
                              <span className="h-2 w-2 rounded-full bg-green-500"></span>
                              High
                            </span>
                          </SelectItem>
                          <SelectItem value={PriorityLevel.MEDIUM}>
                            <span className="flex items-center gap-2">
                              <span className="h-2 w-2 rounded-full bg-yellow-500"></span>
                              Medium
                            </span>
                          </SelectItem>
                          <SelectItem value={PriorityLevel.LOW}>
                            <span className="flex items-center gap-2">
                              <span className="h-2 w-2 rounded-full bg-gray-400"></span>
                              Low
                            </span>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardHeader>
                  {isExpanded && hasSubCategories && (
                    <CardContent className="pt-0 pl-8 space-y-3 border-t">
                      <p className="text-xs text-muted-foreground mt-2 mb-2">
                        Fine-tune priorities for specific job titles (optional):
                      </p>
                      {category.subCategories?.map((subCategory) => {
                        const jobTitlePriority =
                          currentSettings.jobTitlePriorities?.[
                            subCategory.id
                          ] || mainPriority;
                        return (
                          <div
                            key={subCategory.id}
                            className="flex items-center justify-between py-1"
                          >
                            <Label className="text-sm font-normal text-muted-foreground">
                              {subCategory.name}
                            </Label>
                            <Select
                              value={jobTitlePriority}
                              onValueChange={(value) =>
                                updateJobTitlePriority(
                                  subCategory.id,
                                  value as PriorityLevel
                                )
                              }
                            >
                              <SelectTrigger className="w-32">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value={PriorityLevel.HIGH}>
                                  <span className="flex items-center gap-2">
                                    <span className="h-2 w-2 rounded-full bg-green-500"></span>
                                    High
                                  </span>
                                </SelectItem>
                                <SelectItem value={PriorityLevel.MEDIUM}>
                                  <span className="flex items-center gap-2">
                                    <span className="h-2 w-2 rounded-full bg-yellow-500"></span>
                                    Medium
                                  </span>
                                </SelectItem>
                                <SelectItem value={PriorityLevel.LOW}>
                                  <span className="flex items-center gap-2">
                                    <span className="h-2 w-2 rounded-full bg-gray-400"></span>
                                    Low
                                  </span>
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        );
                      })}
                    </CardContent>
                  )}
                </Card>
              );
            })}
          </div>
        )}

        <DialogFooter className="flex justify-between mt-4">
          <Button
            variant="outline"
            onClick={handleReset}
            disabled={isSaving || isLoading}
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset to Defaults
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving || isLoading}>
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Settings"
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
