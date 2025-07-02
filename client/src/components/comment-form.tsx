import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Info } from "lucide-react";

interface CommentFormProps {
  parentId?: number;
  onCancel?: () => void;
  placeholder?: string;
  buttonText?: string;
}

export function CommentForm({ 
  parentId, 
  onCancel, 
  placeholder = "Share your thoughts...",
  buttonText = "Post Comment"
}: CommentFormProps) {
  const [content, setContent] = useState("");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const createCommentMutation = useMutation({
    mutationFn: (data: { content: string; parentId?: number }) => 
      apiRequest("POST", "/api/comments", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/comments"] });
      setContent("");
      if (onCancel) onCancel();
      toast({
        title: "Comment posted!",
        description: "Your comment has been posted successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to post comment",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    
    createCommentMutation.mutate({
      content: content.trim(),
      parentId,
    });
  };

  if (parentId && onCancel) {
    // Reply form (inline)
    return (
      <div className="mt-4">
        <form onSubmit={handleSubmit} className="space-y-3">
          <Textarea
            placeholder={placeholder}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={3}
            className="resize-none text-sm"
            required
          />
          
          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onCancel}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              className="text-xs bg-primary hover:bg-blue-700"
              disabled={createCommentMutation.isPending || !content.trim()}
            >
              {createCommentMutation.isPending ? "Posting..." : buttonText}
            </Button>
          </div>
        </form>
      </div>
    );
  }

  // Main comment form
  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-lg text-slate-800">Join the Discussion</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="comment" className="text-sm font-medium text-slate-700 mb-2 block">
              Your Comment
            </Label>
            <Textarea
              id="comment"
              placeholder={placeholder}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={4}
              className="resize-none"
              required
            />
          </div>
          
          <div className="flex justify-between items-center">
            <div className="flex items-center text-xs text-slate-500">
              <Info className="h-3 w-3 mr-1" />
              Comments can be edited for 15 minutes after posting
            </div>
            <Button 
              type="submit" 
              className="bg-primary text-white hover:bg-blue-700"
              disabled={createCommentMutation.isPending || !content.trim()}
            >
              {createCommentMutation.isPending ? "Posting..." : buttonText}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
