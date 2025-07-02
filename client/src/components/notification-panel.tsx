import { useEffect, useRef } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { NotificationWithDetails } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";

interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: NotificationWithDetails[];
}

export function NotificationPanel({ isOpen, onClose, notifications }: NotificationPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const markAllAsReadMutation = useMutation({
    mutationFn: () => apiRequest("PUT", "/api/notifications/mark-all-read"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
    },
  });

  const markAsReadMutation = useMutation({
    mutationFn: (id: number) => apiRequest("PUT", `/api/notifications/${id}/read`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
    },
  });

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleMarkAllAsRead = () => {
    markAllAsReadMutation.mutate();
  };

  const handleNotificationClick = (notification: NotificationWithDetails) => {
    if (!notification.isRead) {
      markAsReadMutation.mutate(notification.id);
    }
  };

  return (
    <Card 
      ref={panelRef}
      className="absolute top-12 right-0 w-80 bg-white shadow-xl border border-slate-200 z-40"
    >
      <CardHeader className="p-4 border-b border-slate-200">
        <div className="flex justify-between items-center">
          <h3 className="font-medium text-slate-800">Notifications</h3>
          <Button
            variant="link"
            size="sm"
            onClick={handleMarkAllAsRead}
            className="text-xs text-primary hover:text-blue-700 p-0 h-auto"
            disabled={markAllAsReadMutation.isPending}
          >
            Mark all read
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        <div className="max-h-80 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-4 text-center text-slate-500 text-sm">
              No notifications yet
            </div>
          ) : (
            notifications.map((notification) => (
              <div
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                className={`p-4 border-b border-slate-100 hover:bg-slate-50 transition-colors cursor-pointer ${
                  !notification.isRead ? "bg-blue-50" : "opacity-60"
                }`}
              >
                <div className="flex items-start space-x-3">
                  <div 
                    className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                      notification.isRead ? "bg-slate-300" : "bg-primary"
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${notification.isRead ? "text-slate-600" : "text-slate-800"}`}>
                      <span className="font-medium">{notification.fromUser.username}</span>
                      {notification.type === 'reply' ? " replied to your comment" : " mentioned you in a comment"}
                    </p>
                    <p className={`text-xs mt-1 ${notification.isRead ? "text-slate-400" : "text-slate-500"}`}>
                      {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
        
        {notifications.length > 0 && (
          <div className="p-3 border-t border-slate-200">
            <Button
              variant="link"
              size="sm"
              className="text-xs text-primary hover:text-blue-700 w-full p-0 h-auto"
            >
              View all notifications
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
