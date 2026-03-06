"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Script } from "@/data/scripts";
import { X } from "lucide-react";

interface ScriptEditDialogProps {
  script?: Script | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (script: Script) => void;
}

const CATEGORIES = [
  "奇幻冒險", "恐怖懸疑", "科幻推理", "懸疑恐怖",
  "現代商業", "冒險探險", "末世生存", "武俠江湖",
  "科幻太空", "民國懸疑", "奇幻魔法", "間諜特工",
  "黑暗童話", "未來科幻", "現實懸疑", "海盜冒險",
  "現代恐怖", "古代宮廷", "藝術懸疑"
];

const DIFFICULTIES = ["簡單", "中等", "困難"];

export function ScriptEditDialog({ script, isOpen, onOpenChange, onSave }: ScriptEditDialogProps) {
  const [formData, setFormData] = useState<Partial<Script>>({
    title: "",
    category: [],
    players: 0,
    duration: 0,
    difficulty: "",
    description: "",
    features: [],
    image: "",
    monthlyRecommended: false,
  });

  const [newFeature, setNewFeature] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Initialize form data when script changes
  useEffect(() => {
    if (script) {
      setFormData(script);
    } else {
      // Reset form for new script
      setFormData({
        title: "",
        category: [],
        players: 0,
        duration: 0,
        difficulty: "",
        description: "",
        features: [],
        image: "",
        monthlyRecommended: false,
      });
    }
    setErrors({});
  }, [script]);

  const handleInputChange = (field: keyof Script, value: string | boolean | string[] | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  const handleAddFeature = () => {
    if (newFeature.trim() && !formData.features?.includes(newFeature.trim())) {
      setFormData(prev => ({
        ...prev,
        features: [...(prev.features || []), newFeature.trim()]
      }));
      setNewFeature("");
    }
  };

  const handleRemoveFeature = (featureToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features?.filter(feature => feature !== featureToRemove) || []
    }));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title?.trim()) newErrors.title = "請輸入劇本標題";
    if (!formData.category || formData.category.length === 0) newErrors.category = "請選擇劇本類別";
    if (!formData.players || formData.players <= 0) newErrors.players = "請輸入遊戲人數";
    if (!formData.duration || formData.duration <= 0) newErrors.duration = "請輸入遊戲時長";
    if (!formData.description?.trim()) newErrors.description = "請輸入劇本描述";
    if (!formData.image?.trim()) newErrors.image = "請輸入劇本圖片路徑";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (validateForm()) {
      const scriptToSave: Script = {
        id: script?.id || Date.now(), // Generate ID for new scripts
        title: formData.title!,
        category: formData.category!,
        players: formData.players!,
        duration: formData.duration!,
        difficulty: formData.difficulty,
        description: formData.description!,
        features: formData.features || [],
        color: script?.color || '#3B82F6', // Default color if not provided
        image: formData.image,
        monthlyRecommended: formData.monthlyRecommended || false,
      };

      onSave(scriptToSave);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {script ? "編輯劇本" : "新增劇本"}
          </DialogTitle>
          <DialogDescription>
            填寫劇本的詳細資訊
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Title */}
          <div>
            <Label htmlFor="title">劇本標題 *</Label>
            <Input
              id="title"
              value={formData.title || ""}
              onChange={(e) => handleInputChange("title", e.target.value)}
              placeholder="請輸入劇本標題"
              className={errors.title ? "border-destructive" : ""}
            />
            {errors.title && <p className="text-sm text-destructive mt-1">{errors.title}</p>}
          </div>

          {/* Category and Difficulty */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="category">類別 *</Label>
              <Select value={formData.category?.[0] || ""} onValueChange={(value) => handleInputChange("category", [value])}>
                <SelectTrigger className={errors.category ? "border-destructive" : ""}>
                  <SelectValue placeholder="選擇類別" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.category && <p className="text-sm text-destructive mt-1">{errors.category}</p>}
            </div>

            <div>
              <Label htmlFor="difficulty">難度</Label>
              <Select value={formData.difficulty || ""} onValueChange={(value) => handleInputChange("difficulty", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="選擇難度" />
                </SelectTrigger>
                <SelectContent>
                  {DIFFICULTIES.map((difficulty) => (
                    <SelectItem key={difficulty} value={difficulty}>
                      {difficulty}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Players and Duration */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="players">遊戲人數 *</Label>
              <Input
                id="players"
                type="number"
                min="1"
                value={formData.players || ""}
                onChange={(e) => handleInputChange("players", parseInt(e.target.value) || 0)}
                placeholder="請輸入人數"
                className={errors.players ? "border-destructive" : ""}
              />
              {errors.players && <p className="text-sm text-destructive mt-1">{errors.players}</p>}
            </div>

            <div>
              <Label htmlFor="duration">遊戲時長 (小時) *</Label>
              <Input
                id="duration"
                type="number"
                min="0.5"
                step="0.5"
                value={formData.duration || ""}
                onChange={(e) => handleInputChange("duration", parseFloat(e.target.value) || 0)}
                placeholder="請輸入時長"
                className={errors.duration ? "border-destructive" : ""}
              />
              {errors.duration && <p className="text-sm text-destructive mt-1">{errors.duration}</p>}
            </div>
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description">劇本描述 *</Label>
            <Textarea
              id="description"
              value={formData.description || ""}
              onChange={(e) => handleInputChange("description", e.target.value)}
              placeholder="請輸入劇本描述"
              rows={3}
              className={errors.description ? "border-destructive" : ""}
            />
            {errors.description && <p className="text-sm text-destructive mt-1">{errors.description}</p>}
          </div>

          {/* Features */}
          <div>
            <Label>遊戲特色</Label>
            <div className="space-y-2">
              <div className="flex gap-2">
                <Input
                  value={newFeature}
                  onChange={(e) => setNewFeature(e.target.value)}
                  placeholder="新增特色標籤"
                  onKeyPress={(e) => e.key === 'Enter' && handleAddFeature()}
                />
                <Button type="button" onClick={handleAddFeature} variant="outline">
                  新增
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.features?.map((feature, index) => (
                  <Badge key={index} variant="secondary" className="gap-1">
                    {feature}
                    <button
                      type="button"
                      onClick={() => handleRemoveFeature(feature)}
                      className="hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          {/* Image */}
          <div>
            <Label htmlFor="image">劇本圖片路徑 *</Label>
            <Input
              id="image"
              value={formData.image || ""}
              onChange={(e) => handleInputChange("image", e.target.value)}
              placeholder="/images/scripts/example.jpg"
              className={errors.image ? "border-destructive" : ""}
            />
            {errors.image && <p className="text-sm text-destructive mt-1">{errors.image}</p>}
          </div>

          {/* Monthly Recommended */}
          <div className="flex items-center space-x-2">
            <Switch
              id="monthlyRecommended"
              checked={formData.monthlyRecommended || false}
              onCheckedChange={(checked) => handleInputChange("monthlyRecommended", checked)}
            />
            <Label htmlFor="monthlyRecommended">月推薦劇本</Label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={handleSave}>
            {script ? "儲存變更" : "新增劇本"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
