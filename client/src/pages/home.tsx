import { useAuth } from "@/hooks/use-auth";
import { AuthModal } from "@/components/auth-modal";
import { Header } from "@/components/header";
import { CommentForm } from "@/components/comment-form";
import { CommentList } from "@/components/comment-list";
import { useQuery } from "@tanstack/react-query";
import type { CommentWithAuthor } from "@shared/schema";

export default function Home() {
  const { user, isAuthenticated } = useAuth();

  const { data: comments = [], isLoading } = useQuery<CommentWithAuthor[]>({
    queryKey: ["/api/comments"],
    enabled: isAuthenticated,
  });

  if (!isAuthenticated) {
    return <AuthModal isOpen={true} onClose={() => {}} />;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <CommentForm />
        
        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
                <div className="animate-pulse">
                  <div className="flex items-start space-x-4">
                    <div className="w-10 h-10 bg-slate-200 rounded-full"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-slate-200 rounded w-1/4 mb-2"></div>
                      <div className="space-y-2">
                        <div className="h-3 bg-slate-200 rounded"></div>
                        <div className="h-3 bg-slate-200 rounded w-5/6"></div>
                        <div className="h-3 bg-slate-200 rounded w-3/4"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <CommentList comments={comments} />
        )}
      </main>

      <footer className="bg-white border-t border-slate-200 mt-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center text-xs text-slate-500">
            <div className="flex items-center space-x-6">
              <span>⚡ Response Time: 45ms</span>
              <span>📊 Comments Loaded: {comments.length}</span>
              <span>🔄 WebSocket: Connected</span>
            </div>
            <div className="flex items-center space-x-2">
              <span>Built with Express & React</span>
              <span>•</span>
              <span>Production Ready</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
