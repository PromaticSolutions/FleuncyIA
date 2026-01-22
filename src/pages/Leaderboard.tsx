import React, { useState, useEffect } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { useApp } from '@/contexts/AppContext';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Trophy, 
  Users, 
  UserPlus, 
  Crown, 
  Flame, 
  MessageSquare,
  Target,
  Copy,
  Check,
  Plus,
  Search,
  Loader2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface RankingUser {
  user_id: string;
  name: string;
  avatar_url: string | null;
  total_conversations: number;
  current_streak: number;
  longest_streak: number;
  current_adaptive_level: string;
}

interface Friend {
  id: string;
  user_id: string;
  friend_id: string;
  status: string;
  friend_name?: string;
  friend_avatar?: string;
}

interface EvolutionGroup {
  id: string;
  name: string;
  description: string | null;
  invite_code: string;
  created_by: string;
  max_members: number;
  member_count?: number;
}

const Leaderboard: React.FC = () => {
  const { authUserId, user } = useApp();
  const { toast } = useToast();
  const [globalRanking, setGlobalRanking] = useState<RankingUser[]>([]);
  const [friendsRanking, setFriendsRanking] = useState<RankingUser[]>([]);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [groups, setGroups] = useState<EvolutionGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [friendEmail, setFriendEmail] = useState('');
  const [groupName, setGroupName] = useState('');
  const [groupInviteCode, setGroupInviteCode] = useState('');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [isInvitingFriend, setIsInvitingFriend] = useState(false);

  useEffect(() => {
    if (authUserId) {
      fetchData();
    }
  }, [authUserId]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch global ranking (top 50)
      const { data: globalData } = await supabase
        .from('user_profiles')
        .select('user_id, name, avatar_url, total_conversations, current_streak, longest_streak, current_adaptive_level')
        .order('total_conversations', { ascending: false })
        .limit(50);

      if (globalData) {
        setGlobalRanking(globalData as RankingUser[]);
      }

      // Fetch friends
      const { data: friendships } = await supabase
        .from('friendships')
        .select('*')
        .or(`user_id.eq.${authUserId},friend_id.eq.${authUserId}`)
        .eq('status', 'accepted');

      if (friendships) {
        setFriends(friendships as Friend[]);
        
        // Fetch friends profiles for ranking
        const friendIds = friendships.map(f => 
          f.user_id === authUserId ? f.friend_id : f.user_id
        );
        
        if (friendIds.length > 0) {
          const { data: friendProfiles } = await supabase
            .from('user_profiles')
            .select('user_id, name, avatar_url, total_conversations, current_streak, longest_streak, current_adaptive_level')
            .in('user_id', [...friendIds, authUserId])
            .order('total_conversations', { ascending: false });
          
          if (friendProfiles) {
            setFriendsRanking(friendProfiles as RankingUser[]);
          }
        }
      }

      // Fetch groups
      const { data: memberGroups } = await supabase
        .from('group_members')
        .select('group_id')
        .eq('user_id', authUserId);

      if (memberGroups && memberGroups.length > 0) {
        const groupIds = memberGroups.map(m => m.group_id);
        const { data: groupData } = await supabase
          .from('evolution_groups')
          .select('*')
          .in('id', groupIds);
        
        if (groupData) {
          setGroups(groupData as EvolutionGroup[]);
        }
      }

      // Also fetch groups created by user
      const { data: ownedGroups } = await supabase
        .from('evolution_groups')
        .select('*')
        .eq('created_by', authUserId);

      if (ownedGroups) {
        setGroups(prev => {
          const existingIds = new Set(prev.map(g => g.id));
          const newGroups = ownedGroups.filter((g: EvolutionGroup) => !existingIds.has(g.id));
          return [...prev, ...(newGroups as EvolutionGroup[])];
        });
      }

    } catch (error) {
      console.error('Error fetching leaderboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const inviteFriend = async () => {
    if (!friendEmail.trim() || !authUserId) return;
    
    setIsInvitingFriend(true);
    try {
      // Find user by email
      const { data: friendProfile } = await supabase
        .from('user_profiles')
        .select('user_id')
        .eq('email', friendEmail.trim())
        .maybeSingle();

      if (!friendProfile) {
        toast({
          title: "Usuário não encontrado",
          description: "Não encontramos um usuário com este email.",
          variant: "destructive",
        });
        return;
      }

      if (friendProfile.user_id === authUserId) {
        toast({
          title: "Ops!",
          description: "Você não pode adicionar a si mesmo.",
          variant: "destructive",
        });
        return;
      }

      // Check if friendship already exists
      const { data: existing } = await supabase
        .from('friendships')
        .select('id')
        .or(`and(user_id.eq.${authUserId},friend_id.eq.${friendProfile.user_id}),and(user_id.eq.${friendProfile.user_id},friend_id.eq.${authUserId})`)
        .maybeSingle();

      if (existing) {
        toast({
          title: "Já são amigos",
          description: "Vocês já estão conectados ou há um pedido pendente.",
          variant: "destructive",
        });
        return;
      }

      // Create friendship request
      const { error } = await supabase
        .from('friendships')
        .insert({
          user_id: authUserId,
          friend_id: friendProfile.user_id,
          status: 'accepted', // Auto-accept for simplicity
        });

      if (error) throw error;

      toast({
        title: "Amigo adicionado!",
        description: "Vocês agora podem competir juntos.",
      });
      
      setFriendEmail('');
      fetchData();
    } catch (error) {
      console.error('Error inviting friend:', error);
      toast({
        title: "Erro",
        description: "Não foi possível adicionar o amigo.",
        variant: "destructive",
      });
    } finally {
      setIsInvitingFriend(false);
    }
  };

  const createGroup = async () => {
    if (!groupName.trim() || !authUserId) return;
    
    setIsCreatingGroup(true);
    try {
      const { data, error } = await supabase
        .from('evolution_groups')
        .insert({
          name: groupName.trim(),
          created_by: authUserId,
        })
        .select()
        .single();

      if (error) throw error;

      // Add creator as admin member
      await supabase
        .from('group_members')
        .insert({
          group_id: data.id,
          user_id: authUserId,
          role: 'admin',
        });

      toast({
        title: "Grupo criado!",
        description: `Compartilhe o código: ${data.invite_code}`,
      });
      
      setGroupName('');
      fetchData();
    } catch (error) {
      console.error('Error creating group:', error);
      toast({
        title: "Erro",
        description: "Não foi possível criar o grupo.",
        variant: "destructive",
      });
    } finally {
      setIsCreatingGroup(false);
    }
  };

  const joinGroup = async () => {
    if (!groupInviteCode.trim() || !authUserId) return;
    
    try {
      // Find group by invite code
      const { data: group } = await supabase
        .from('evolution_groups')
        .select('*')
        .eq('invite_code', groupInviteCode.trim().toLowerCase())
        .maybeSingle();

      if (!group) {
        toast({
          title: "Grupo não encontrado",
          description: "Código de convite inválido.",
          variant: "destructive",
        });
        return;
      }

      // Check if already member
      const { data: existing } = await supabase
        .from('group_members')
        .select('id')
        .eq('group_id', group.id)
        .eq('user_id', authUserId)
        .maybeSingle();

      if (existing) {
        toast({
          title: "Já é membro",
          description: "Você já faz parte deste grupo.",
          variant: "destructive",
        });
        return;
      }

      // Join group
      const { error } = await supabase
        .from('group_members')
        .insert({
          group_id: group.id,
          user_id: authUserId,
        });

      if (error) throw error;

      toast({
        title: "Entrou no grupo!",
        description: `Você agora faz parte de "${group.name}".`,
      });
      
      setGroupInviteCode('');
      fetchData();
    } catch (error) {
      console.error('Error joining group:', error);
      toast({
        title: "Erro",
        description: "Não foi possível entrar no grupo.",
        variant: "destructive",
      });
    }
  };

  const copyInviteCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
    toast({
      title: "Código copiado!",
      description: "Compartilhe com seus amigos.",
    });
  };

  const getRankIcon = (position: number) => {
    switch (position) {
      case 1:
        return <Crown className="w-5 h-5 text-yellow-500" />;
      case 2:
        return <Trophy className="w-5 h-5 text-gray-400" />;
      case 3:
        return <Trophy className="w-5 h-5 text-amber-700" />;
      default:
        return <span className="w-5 h-5 flex items-center justify-center text-sm font-bold text-muted-foreground">{position}</span>;
    }
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-6 lg:p-8 max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground mb-2">
            Ranking e Competição
          </h1>
          <p className="text-muted-foreground">
            Desafie seus amigos e veja quem evolui mais rápido
          </p>
        </div>

        <Tabs defaultValue="global" className="space-y-6">
          <TabsList className="w-full grid grid-cols-3">
            <TabsTrigger value="global">
              <Trophy className="w-4 h-4 mr-2" />
              Global
            </TabsTrigger>
            <TabsTrigger value="friends">
              <Users className="w-4 h-4 mr-2" />
              Amigos
            </TabsTrigger>
            <TabsTrigger value="groups">
              <Target className="w-4 h-4 mr-2" />
              Grupos
            </TabsTrigger>
          </TabsList>

          {/* Global Ranking */}
          <TabsContent value="global" className="space-y-4">
            <div className="bg-card rounded-xl border border-border overflow-hidden">
              <div className="p-4 border-b border-border bg-muted/50">
                <h3 className="font-semibold flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-primary" />
                  Ranking Global - Top 50
                </h3>
              </div>
              <div className="divide-y divide-border">
                {globalRanking.map((player, index) => (
                  <RankingRow 
                    key={player.user_id} 
                    player={player} 
                    position={index + 1}
                    isCurrentUser={player.user_id === authUserId}
                    getRankIcon={getRankIcon}
                  />
                ))}
                {globalRanking.length === 0 && (
                  <div className="p-8 text-center text-muted-foreground">
                    Nenhum usuário no ranking ainda.
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Friends Ranking */}
          <TabsContent value="friends" className="space-y-4">
            {/* Add Friend */}
            <div className="bg-card rounded-xl border border-border p-4">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-primary" />
                Adicionar Amigo
              </h3>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Email do amigo"
                    value={friendEmail}
                    onChange={(e) => setFriendEmail(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Button onClick={inviteFriend} disabled={isInvitingFriend}>
                  {isInvitingFriend ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <UserPlus className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>

            {/* Friends Leaderboard */}
            <div className="bg-card rounded-xl border border-border overflow-hidden">
              <div className="p-4 border-b border-border bg-muted/50">
                <h3 className="font-semibold flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  Ranking entre Amigos
                </h3>
              </div>
              <div className="divide-y divide-border">
                {friendsRanking.map((player, index) => (
                  <RankingRow 
                    key={player.user_id} 
                    player={player} 
                    position={index + 1}
                    isCurrentUser={player.user_id === authUserId}
                    getRankIcon={getRankIcon}
                  />
                ))}
                {friendsRanking.length === 0 && (
                  <div className="p-8 text-center text-muted-foreground">
                    <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>Adicione amigos para competir!</p>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Groups */}
          <TabsContent value="groups" className="space-y-4">
            {/* Create or Join Group */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Create Group */}
              <div className="bg-card rounded-xl border border-border p-4">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Plus className="w-5 h-5 text-primary" />
                  Criar Grupo
                </h3>
                <div className="flex gap-2">
                  <Input
                    placeholder="Nome do grupo"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                  />
                  <Button onClick={createGroup} disabled={isCreatingGroup}>
                    {isCreatingGroup ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      'Criar'
                    )}
                  </Button>
                </div>
              </div>

              {/* Join Group */}
              <div className="bg-card rounded-xl border border-border p-4">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  Entrar em Grupo
                </h3>
                <div className="flex gap-2">
                  <Input
                    placeholder="Código de convite"
                    value={groupInviteCode}
                    onChange={(e) => setGroupInviteCode(e.target.value)}
                  />
                  <Button onClick={joinGroup}>Entrar</Button>
                </div>
              </div>
            </div>

            {/* My Groups */}
            <div className="space-y-4">
              <h3 className="font-semibold flex items-center gap-2">
                <Target className="w-5 h-5 text-primary" />
                Meus Grupos de Evolução
              </h3>
              
              {groups.length === 0 ? (
                <div className="bg-card rounded-xl border border-border p-8 text-center text-muted-foreground">
                  <Target className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Você ainda não faz parte de nenhum grupo.</p>
                  <p className="text-sm mt-1">Crie um ou peça um código de convite!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {groups.map((group) => (
                    <div key={group.id} className="bg-card rounded-xl border border-border p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-semibold text-foreground">{group.name}</h4>
                          {group.description && (
                            <p className="text-sm text-muted-foreground">{group.description}</p>
                          )}
                        </div>
                        {group.created_by === authUserId && (
                          <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">Admin</span>
                        )}
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <code className="text-sm bg-muted px-2 py-1 rounded">
                          {group.invite_code}
                        </code>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => copyInviteCode(group.invite_code)}
                        >
                          {copiedCode === group.invite_code ? (
                            <Check className="w-4 h-4 text-green-500" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

const RankingRow: React.FC<{
  player: RankingUser;
  position: number;
  isCurrentUser: boolean;
  getRankIcon: (position: number) => React.ReactNode;
}> = ({ player, position, isCurrentUser, getRankIcon }) => (
  <div className={`flex items-center gap-4 p-4 ${isCurrentUser ? 'bg-primary/5' : 'hover:bg-muted/50'} transition-colors`}>
    <div className="w-8 flex justify-center">
      {getRankIcon(position)}
    </div>
    
    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-lg">
      {player.avatar_url ? (
        <img src={player.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
      ) : (
        '👤'
      )}
    </div>
    
    <div className="flex-1 min-w-0">
      <p className={`font-medium truncate ${isCurrentUser ? 'text-primary' : 'text-foreground'}`}>
        {player.name}
        {isCurrentUser && <span className="text-xs ml-2">(você)</span>}
      </p>
      <p className="text-sm text-muted-foreground">
        Nível {player.current_adaptive_level || 'A1'}
      </p>
    </div>
    
    <div className="flex items-center gap-4 text-sm">
      <div className="flex items-center gap-1 text-muted-foreground">
        <MessageSquare className="w-4 h-4" />
        <span>{player.total_conversations}</span>
      </div>
      <div className="flex items-center gap-1 text-orange-500">
        <Flame className="w-4 h-4" />
        <span>{player.current_streak}</span>
      </div>
    </div>
  </div>
);

export default Leaderboard;
