import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Send, Loader2 } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";

const Messages = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const teacherId = searchParams.get('teacherId');
  
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    checkUser();
  }, []);

  useEffect(() => {
    if (userId) {
      loadConversations();
    }
  }, [userId]);

  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation);
      markMessagesAsRead(selectedConversation);
      
      // Subscribe to real-time updates
      const channel = supabase
        .channel(`messages-${selectedConversation}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `conversation_id=eq.${selectedConversation}`
          },
          (payload) => {
            const newMsg = payload.new;
            setMessages(prev => [...prev, newMsg]);
            if (newMsg.sender_id !== userId) {
              markMessagesAsRead(selectedConversation);
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [selectedConversation, userId]);

  useEffect(() => {
    if (userId && teacherId) {
      startConversationWithTeacher(teacherId);
    }
  }, [userId, teacherId]);

  const checkUser = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }
      setUserId(session.user.id);
    } catch (error) {
      console.error("Error checking user:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to authenticate",
      });
    } finally {
      setLoading(false);
    }
  };

  const startConversationWithTeacher = async (teacherId: string) => {
    if (!userId) return;
    
    try {
      // Check if conversation exists
      const { data: existing } = await supabase
        .from("conversations")
        .select("id")
        .eq("student_id", userId)
        .eq("teacher_id", teacherId)
        .single();

      if (existing) {
        setSelectedConversation(existing.id);
      } else {
        // Create new conversation
        const { data: newConv, error } = await supabase
          .from("conversations")
          .insert({
            student_id: userId,
            teacher_id: teacherId
          })
          .select()
          .single();

        if (error) throw error;
        
        await loadConversations();
        setSelectedConversation(newConv.id);
      }
    } catch (error) {
      console.error("Error starting conversation:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to start conversation",
      });
    }
  };

  const loadConversations = async () => {
    if (!userId) return;

    try {
      const { data, error } = await supabase
        .from("conversations")
        .select(`
          id,
          student_id,
          teacher_id,
          updated_at
        `)
        .or(`student_id.eq.${userId},teacher_id.eq.${userId}`)
        .order("updated_at", { ascending: false });

      if (error) throw error;

      // Fetch other user details and unread count
      const conversationsWithDetails = await Promise.all(
        data.map(async (conv) => {
          const otherId = conv.student_id === userId ? conv.teacher_id : conv.student_id;
          
          const { data: profile } = await supabase
            .from("profiles")
            .select("full_name, email")
            .eq("id", otherId)
            .single();

          const { count } = await supabase
            .from("messages")
            .select("*", { count: 'exact', head: true })
            .eq("conversation_id", conv.id)
            .eq("is_read", false)
            .neq("sender_id", userId);

          return {
            ...conv,
            other_user: profile || { full_name: "Unknown", email: "" },
            unread_count: count || 0
          };
        })
      );

      setConversations(conversationsWithDetails);
    } catch (error) {
      console.error("Error loading conversations:", error);
    }
  };

  const loadMessages = async (conversationId: string) => {
    try {
      const { data, error } = await supabase
        .from("messages")
        .select(`
          id,
          conversation_id,
          sender_id,
          content,
          is_read,
          created_at,
          sender:profiles!messages_sender_id_fkey(full_name)
        `)
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error("Error loading messages:", error);
    }
  };

  const markMessagesAsRead = async (conversationId: string) => {
    if (!userId) return;

    try {
      await supabase
        .from("messages")
        .update({ is_read: true })
        .eq("conversation_id", conversationId)
        .eq("is_read", false)
        .neq("sender_id", userId);
      
      loadConversations();
    } catch (error) {
      console.error("Error marking messages as read:", error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || !userId) return;

    setSending(true);
    try {
      const { error } = await supabase
        .from("messages")
        .insert({
          conversation_id: selectedConversation,
          sender_id: userId,
          content: newMessage.trim()
        });

      if (error) throw error;

      setNewMessage("");
      loadConversations();
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to send message",
      });
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <h1 className="text-2xl font-bold text-primary">Messages</h1>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
          {/* Conversations List */}
          <Card className="md:col-span-1">
            <ScrollArea className="h-full">
              <div className="p-4 space-y-2">
                <h2 className="font-semibold mb-4">Conversations</h2>
                {conversations.length === 0 ? (
                  <p className="text-muted-foreground text-sm text-center py-8">
                    No conversations yet
                  </p>
                ) : (
                  conversations.map((conv) => (
                    <div
                      key={conv.id}
                      onClick={() => setSelectedConversation(conv.id)}
                      className={`p-3 rounded-lg cursor-pointer transition-colors ${
                        selectedConversation === conv.id
                          ? "bg-primary/10"
                          : "hover:bg-muted"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarFallback>
                            {conv.other_user.full_name[0]?.toUpperCase() || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="font-medium truncate">
                              {conv.other_user.full_name}
                            </p>
                            {conv.unread_count > 0 && (
                              <Badge variant="default" className="ml-2">
                                {conv.unread_count}
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {new Date(conv.updated_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </Card>

          {/* Messages Area */}
          <Card className="md:col-span-2 flex flex-col">
            {selectedConversation ? (
              <>
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-4">
                    {messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex ${
                          msg.sender_id === userId ? "justify-end" : "justify-start"
                        }`}
                      >
                        <div
                          className={`max-w-[70%] rounded-lg px-4 py-2 ${
                            msg.sender_id === userId
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted"
                          }`}
                        >
                          <p className="text-sm">{msg.content}</p>
                          <p className="text-xs opacity-70 mt-1">
                            {new Date(msg.created_at).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>

                <div className="border-t p-4">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Type a message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                      disabled={sending}
                    />
                    <Button onClick={sendMessage} disabled={sending || !newMessage.trim()}>
                      {sending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <p className="text-muted-foreground">Select a conversation to start messaging</p>
              </div>
            )}
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Messages;
