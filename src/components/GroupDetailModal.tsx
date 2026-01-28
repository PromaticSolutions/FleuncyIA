import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { useApp } from '@/contexts/AppContext';
import { 
  Crown, 
  Flame, 
  MessageSquare, 
  Users,
  Copy,
  Check,
  LogOut,
  Trash2,
  Loader2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface GroupMember {
  user_id: string;
  name: string;
  role: string;
  total_conversations: number;
  current_streak: number;
  current_adaptive_level: string;
}

interface GroupDetailModalProps {
  group: {
    id: string;
    name: string;
    description: string | null;
    invite_code: string;
    created_by: string;
    max_members: number;
  } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGroupLeft: () => void;
  onGroupDeleted: () => void;
}

export const GroupDetailModal: React.FC<GroupDetailModalProps> = ({
  group,
  open,
  onOpenChange,
  onGroupLeft,
  onGroupDeleted,
}) => {
  const { authUserId } = useApp();
  const { toast } = useToast();
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (open && group) {
      fetchMembers();
    }
  }, [open, group]);

  const fetchMembers = async () => {
    if (!group) return;
    setIsLoading(true);
    
    try {
      // Get all members of this group
      const { data: memberData, error: memberError } = await supabase
        .from('group_members')
        .select('user_id, role')
        .eq('group_id', group.id);

      if (memberError) throw memberError;

      if (!memberData || memberData.length === 0) {
        setMembers([]);
        setIsLoading(false);
        return;
      }

      // Get user details from rankings view
      const userIds = memberData.map(m => m.user_id);
      const { data: rankingData, error: rankingError } = await supabase
        .from('user_rankings')
        .select('user_id, name, total_conversations, current_streak, current_adaptive_level')
        .in('user_id', userIds);

      if (rankingError) throw rankingError;

      // Combine member data with ranking data
      const combinedMembers: GroupMember[] = memberData.map(member => {
        const ranking = rankingData?.find(r => r.user_id === member.user_id);
        return {
          user_id: member.user_id,
          name: ranking?.name || 'Usuário',
          role: member.role,
          total_conversations: ranking?.total_conversations || 0,
          current_streak: ranking?.current_streak || 0,
          current_adaptive_level: ranking?.current_adaptive_level || 'A1',
        };
      });

      // Sort by conversations (ranking within group)
      combinedMembers.sort((a, b) => b.total_conversations - a.total_conversations);
      setMembers(combinedMembers);
    } catch (error) {
      console.error('Error fetching group members:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os membros do grupo.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const copyInviteCode = () => {
    if (!group) return;
    navigator.clipboard.writeText(group.invite_code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
    toast({
      title: 'Código copiado!',
      description: 'Compartilhe com seus amigos.',
    });
  };

  const handleLeaveGroup = async () => {
    if (!group || !authUserId) return;
    
    setIsLeaving(true);
    try {
      const { error } = await supabase
        .from('group_members')
        .delete()
        .eq('group_id', group.id)
        .eq('user_id', authUserId);

      if (error) throw error;

      toast({
        title: 'Saiu do grupo',
        description: `Você saiu de "${group.name}".`,
      });
      
      onOpenChange(false);
      onGroupLeft();
    } catch (error) {
      console.error('Error leaving group:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível sair do grupo.',
        variant: 'destructive',
      });
    } finally {
      setIsLeaving(false);
    }
  };

  const handleDeleteGroup = async () => {
    if (!group || !authUserId || group.created_by !== authUserId) return;
    
    setIsDeleting(true);
    try {
      // Delete all members first
      await supabase
        .from('group_members')
        .delete()
        .eq('group_id', group.id);

      // Then delete the group
      const { error } = await supabase
        .from('evolution_groups')
        .delete()
        .eq('id', group.id);

      if (error) throw error;

      toast({
        title: 'Grupo excluído',
        description: `O grupo "${group.name}" foi excluído.`,
      });
      
      onOpenChange(false);
      onGroupDeleted();
    } catch (error) {
      console.error('Error deleting group:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível excluir o grupo.',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const isAdmin = group?.created_by === authUserId;

  const getRankIcon = (position: number) => {
    if (position === 1) return <Crown className="w-4 h-4 text-yellow-500" />;
    if (position === 2) return <span className="w-4 h-4 flex items-center justify-center text-xs font-bold text-gray-400">2</span>;
    if (position === 3) return <span className="w-4 h-4 flex items-center justify-center text-xs font-bold text-amber-700">3</span>;
    return <span className="w-4 h-4 flex items-center justify-center text-xs font-bold text-muted-foreground">{position}</span>;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            {group?.name}
          </DialogTitle>
        </DialogHeader>

        {group && (
          <div className="space-y-4">
            {/* Group Info */}
            {group.description && (
              <p className="text-sm text-muted-foreground">{group.description}</p>
            )}

            {/* Invite Code */}
            <div className="flex items-center justify-between bg-muted/50 rounded-lg p-3">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Código de Convite</p>
                <code className="text-sm font-mono font-medium">{group.invite_code}</code>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={copyInviteCode}
                className="h-8 w-8 p-0"
              >
                {copiedCode ? (
                  <Check className="w-4 h-4 text-green-500" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </div>

            {/* Members List */}
            <div>
              <h4 className="font-medium mb-3 flex items-center gap-2 text-sm">
                <Users className="w-4 h-4" />
                Membros ({members.length}/{group.max_members})
              </h4>
              
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {isLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-3 p-2 animate-pulse">
                      <Skeleton className="w-6 h-6 rounded" />
                      <Skeleton className="w-8 h-8 rounded-full" />
                      <div className="flex-1">
                        <Skeleton className="h-4 w-24 mb-1" />
                        <Skeleton className="h-3 w-16" />
                      </div>
                    </div>
                  ))
                ) : members.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Nenhum membro encontrado.
                  </p>
                ) : (
                  members.map((member, index) => (
                    <div
                      key={member.user_id}
                      className={`flex items-center gap-3 p-2 rounded-lg ${
                        member.user_id === authUserId ? 'bg-primary/5' : 'hover:bg-muted/50'
                      }`}
                    >
                      <div className="w-6 flex justify-center">
                        {getRankIcon(index + 1)}
                      </div>
                      
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm">
                        👤
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <p className={`font-medium text-sm truncate ${
                          member.user_id === authUserId ? 'text-primary' : 'text-foreground'
                        }`}>
                          {member.name}
                          {member.role === 'admin' && (
                            <span className="ml-1 text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">
                              Admin
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Nível {member.current_adaptive_level}
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-3 text-xs">
                        <div className="flex items-center gap-1 text-muted-foreground" title="Conversas">
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>{member.total_conversations}</span>
                        </div>
                        <div className="flex items-center gap-1 text-orange-500" title="Sequência">
                          <Flame className="w-3.5 h-3.5" />
                          <span>{member.current_streak}</span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-2 border-t border-border">
              {isAdmin ? (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDeleteGroup}
                  disabled={isDeleting}
                  className="flex-1"
                >
                  {isDeleting ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Trash2 className="w-4 h-4 mr-2" />
                  )}
                  Excluir Grupo
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLeaveGroup}
                  disabled={isLeaving}
                  className="flex-1"
                >
                  {isLeaving ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <LogOut className="w-4 h-4 mr-2" />
                  )}
                  Sair do Grupo
                </Button>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
