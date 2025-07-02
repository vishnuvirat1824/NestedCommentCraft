import { Comment } from "./comment";
import type { CommentWithAuthor } from "@shared/schema";

interface CommentListProps {
  comments: CommentWithAuthor[];
  level?: number;
}

export function CommentList({ comments, level = 0 }: CommentListProps) {
  // Filter and organize comments
  const topLevelComments = comments.filter(comment => !comment.parentId);
  
  const buildCommentTree = (parentId: number): CommentWithAuthor[] => {
    return comments
      .filter(comment => comment.parentId === parentId)
      .map(comment => ({
        ...comment,
        replies: buildCommentTree(comment.id),
      }));
  };

  const commentsWithReplies = topLevelComments.map(comment => ({
    ...comment,
    replies: buildCommentTree(comment.id),
  }));

  if (commentsWithReplies.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-slate-400 text-lg mb-2">💬</div>
        <h3 className="text-lg font-medium text-slate-600 mb-1">No comments yet</h3>
        <p className="text-slate-500 text-sm">Be the first to start the discussion!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {commentsWithReplies.map((comment) => (
        <Comment key={comment.id} comment={comment} level={level} />
      ))}
    </div>
  );
}
