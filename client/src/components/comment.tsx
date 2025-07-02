import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { CommentForm } from "./comment-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import type { CommentWithAuthor } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";
import { Reply, Edit, Trash2, Undo2, Heart } from "lucide-react";

interface CommentProps {
  comment: CommentWithAuthor;
  level?: number;
}

export function Comment({ comment, level = 0 }: CommentProps) {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const isOwner = user?.id === comment.authorId;
  const maxNestingLevel = 3;
  const canReply = level < maxNestingLevel;

  // Calculate time-based permissions
  const now = new Date();
  const commentAge = now.getTime() - new Date(comment.createdAt).getTime();
  const fifteenMinutes = 15 * 60 * 1000;
  const canEdit = isOwner && commentAge < fifteenMinutes && !comment.isDeleted;
  const canDelete = isOwner && commentAge < fifteenMinutes && !comment.isDeleted;
  
  let canRestore = false;
  if (comment.isDeleted && comment.deletedAt) {
    const deletionAge = now.getTime() - new Date(comment.deletedAt).getTime();
    canRestore = isOwner && deletionAge < fifteenMinutes;
  }

  const updateCommentMutation = useMutation({
    mutationFn: (content: string) => 
      apiRequest("PUT", `/api/comments/${comment.id}`, { content }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/comments"] });
      setIsEditing(false);
      toast({ title: "Comment updated successfully" });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to update comment",
      });
    },
  });

  const deleteCommentMutation = useMutation({
    mutationFn: () => apiRequest("DELETE", `/api/comments/${comment.id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/comments"] });
      toast({ title: "Comment deleted" });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to delete comment",
      });
    },
  });

  const restoreCommentMutation = useMutation({
    mutationFn: () => apiRequest("POST", `/api/comments/${comment.id}/restore`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/comments"] });
      toast({ title: "Comment restored" });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to restore comment",
      });
    },
  });

  const handleEdit = () => {
    setIsEditing(true);
    setEditContent(comment.content);
  };

  const handleSaveEdit = () => {
    if (editContent.trim() === comment.content) {
      setIsEditing(false);
      return;
    }
    updateCommentMutation.mutate(editContent.trim());
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditContent(comment.content);
  };

  const handleDelete = () => {
    if (confirm("Are you sure you want to delete this comment?")) {
      deleteCommentMutation.mutate();
    }
  };

  const handleRestore = () => {
    restoreCommentMutation.mutate();
  };

  const getInitials = (username: string) => {
    return username.slice(0, 2).toUpperCase();
  };

  const getAvatarColor = (username: string) => {
    const colors = [
      "bg-primary", "bg-success", "bg-warning", "bg-purple-500", 
      "bg-pink-500", "bg-indigo-500", "bg-teal-500"
    ];
    const index = username.charCodeAt(0) % colors.length;
    return colors[index];
  };

  const getTimeRemaining = () => {
    const remaining = fifteenMinutes - commentAge;
    const minutes = Math.floor(remaining / (60 * 1000));
    return `${minutes}m`;
  };

  const marginLeft = level > 0 ? `${level * 3}rem` : "0";

  return (
    <Card className="bg-white shadow-sm border border-slate-200" style={{ marginLeft }}>
      <CardContent className="p-6">
        <div className="flex items-start space-x-4">
          <div 
            className={`w-10 h-10 text-white rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0 ${getAvatarColor(comment.author.username)}`}
          >
            {getInitials(comment.author.username)}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-2 flex-wrap">
              <span className="font-medium text-slate-800">{comment.author.username}</span>
              <span className="text-xs text-slate-500">
                {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
              </span>
              
              {comment.isDeleted && (
                <Badge variant="destructive" className="text-xs">
                  Deleted
                </Badge>
              )}
              
              {canEdit && !comment.isDeleted && (
                <Badge variant="secondary" className="text-xs bg-warning text-white">
                  Editable for {getTimeRemaining()}
                </Badge>
              )}
            </div>
            
            {comment.isDeleted ? (
              <div className="bg-slate-100 rounded-md p-3">
                <p className="text-slate-500 text-xs italic">
                  This comment was deleted and can be restored within{" "}
                  {canRestore ? getTimeRemaining() : "0m"}.
                </p>
                {canRestore && (
                  <Button
                    variant="link"
                    size="sm"
                    onClick={handleRestore}
                    disabled={restoreCommentMutation.isPending}
                    className="text-xs text-primary hover:text-blue-700 mt-2 p-0 h-auto"
                  >
                    <Undo2 className="h-3 w-3 mr-1" />
                    {restoreCommentMutation.isPending ? "Restoring..." : "Restore Comment"}
                  </Button>
                )}
              </div>
            ) : isEditing ? (
              <div className="space-y-3">
                <Textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  rows={3}
                  className="resize-none"
                />
                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    onClick={handleSaveEdit}
                    disabled={updateCommentMutation.isPending || !editContent.trim()}
                    className="text-xs"
                  >
                    {updateCommentMutation.isPending ? "Saving..." : "Save"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCancelEdit}
                    className="text-xs"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <div className="prose prose-sm max-w-none">
                  <p className="text-slate-700 leading-relaxed">{comment.content}</p>
                </div>
                
                <div className="flex items-center space-x-4 mt-4">
                  {canReply && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowReplyForm(!showReplyForm)}
                      className="flex items-center space-x-1 text-slate-500 hover:text-primary p-0 h-auto"
                    >
                      <Reply className="h-4 w-4" />
                      <span className="text-sm">Reply</span>
                    </Button>
                  )}
                  
                  {canEdit && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleEdit}
                      className="flex items-center space-x-1 text-slate-500 hover:text-warning p-0 h-auto"
                    >
                      <Edit className="h-4 w-4" />
                      <span className="text-sm">Edit</span>
                    </Button>
                  )}
                  
                  {canDelete && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleDelete}
                      disabled={deleteCommentMutation.isPending}
                      className="flex items-center space-x-1 text-slate-500 hover:text-error p-0 h-auto"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="text-sm">
                        {deleteCommentMutation.isPending ? "Deleting..." : "Delete"}
                      </span>
                    </Button>
                  )}
                  
                  <div className="flex items-center space-x-1 text-slate-400">
                    <Heart className="h-4 w-4" />
                    <span className="text-sm">0</span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
        
        {showReplyForm && canReply && (
          <div className="mt-4 ml-14">
            <CommentForm
              parentId={comment.id}
              onCancel={() => setShowReplyForm(false)}
              placeholder="Write a reply..."
              buttonText="Reply"
            />
          </div>
        )}
      </CardContent>
      
      {/* Render replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="border-t border-slate-100 bg-slate-50">
          <div className="p-4 space-y-4">
            {comment.replies.map((reply) => (
              <Comment key={reply.id} comment={reply} level={level + 1} />
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}
