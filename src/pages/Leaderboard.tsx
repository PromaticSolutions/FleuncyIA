import React, { useState, useEffect, useCallback } from 'react';
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
  Loader2,
  RefreshCw
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

interface RankingUser {
  user_id: string;
  name: string;
  avatar_url: string | null;
  total_conversations: number;
  current_streak: number;
  longest_streak: number;
  current_adaptive_level: string;
}

interface EvolutionGroup {
  id: string;
  name: string;
  description: string | null;
  invite_code: string;
  created_by: string;
  max_members: number;
}

// Skeleton component for ranking rows
const RankingRowSkeleton = () => (
  <div className="flex items-center gap-4 p-4 animate-pulse">
    <Skeleton className="w-8 h-8 rounded" />
    <Skeleton className="w-10 h-10 rounded-full" />
    <div className="flex-1">
      <Skeleton className="h-4 w-24 mb-2" />
      <Skeleton className="h-3 w-16" />
    </div>
    <div className="flex gap-4">
      <Skeleton className="h-4 w-8" />
      <Skeleton className="h-4 w-8" />
    </div>
  </div>
);

const Leaderboard: React.FC = () => {
  const { authUserId } = useApp();
  const { toast } = useToast();
  
  // State
  const [globalRanking, setGlobalRanking] = useState<RankingUser[]>([]);
  const [friendsRanking, setFriendsRanking] = useState<RankingUser[]>([]);
  const [groups, setGroups] = useState<EvolutionGroup[]>([]);
  
  // Loading states
  const [isLoadingGlobal, setIsLoadingGlobal] = useState(true);
  const [isLoadingFriends, setIsLoadingFriends] = useState(true);
  const [isLoadingGroups, setIsLoadingGroups] = useState(true);
  
  // Form states
  const [friendEmail, setFriendEmail] = useState('');
  const [groupName, setGroupName] = useState('');
  const [groupInviteCode, setGroupInviteCode] = useState('');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [isInvitingFriend, setIsInvitingFriend] = useState(false);
  const [isJoiningGroup, setIsJoiningGroup] = useState(false);

  // Fetch global ranking using secure view (excludes sensitive data like email)
  const fetchGlobalRanking = useCallback(async () => {
    if (!authUserId) return;
    setIsLoadingGlobal(true);
    try {
      const { data, error } = await supabase
        .from('user_rankings')
        .select('user_id, name, total_conversations, current_streak, longest_streak, current_adaptive_level')
        .order('total_conversations', { ascending: false })
        .limit(50);

      if (error) throw error;
      // Map to RankingUser with null avatar_url (not exposed in view for privacy)
      setGlobalRanking((data || []).map(d => ({ ...d, avatar_url: null })) as RankingUser[]);
    } catch (error) {
      console.error('Error fetching global ranking:', error);
      toast({
        title: "Erro ao carregar ranking",
        description: "Tente novamente em alguns instantes.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingGlobal(false);
    }
  }, [authUserId, toast]);

  // Fetch friends ranking
  const fetchFriendsRanking = useCallback(async () => {
    if (!authUserId) return;
    setIsLoadingFriends(true);
    try {
      const { data: friendships, error: friendshipsError } = await supabase
        .from('friendships')
        .select('user_id, friend_id')
        .or(`user_id.eq.${authUserId},friend_id.eq.${authUserId}`)
        .eq('status', 'accepted');

      if (friendshipsError) throw friendshipsError;

      if (friendships && friendships.length > 0) {
        const friendIds = friendships.map(f => 
          f.user_id === authUserId ? f.friend_id : f.user_id
        );
        
        // Use secure view for friends ranking (excludes email, exposes only ranking data)
        const { data: profiles, error: profilesError } = await supabase
          .from('user_rankings')
          .select('user_id, name, total_conversations, current_streak, longest_streak, current_adaptive_level')
          .in('user_id', [...friendIds, authUserId])
          .order('total_conversations', { ascending: false });
        
        if (profilesError) throw profilesError;
        setFriendsRanking((profiles || []).map(d => ({ ...d, avatar_url: null })) as RankingUser[]);
      } else {
        // Only show current user if no friends
        const { data: myProfile } = await supabase
          .from('user_rankings')
          .select('user_id, name, total_conversations, current_streak, longest_streak, current_adaptive_level')
          .eq('user_id', authUserId)
          .single();
        
        setFriendsRanking(myProfile ? [{ ...myProfile, avatar_url: null } as RankingUser] : []);
      }
    } catch (error) {
      console.error('Error fetching friends ranking:', error);
    } finally {
      setIsLoadingFriends(false);
    }
  }, [authUserId]);

  // Fetch groups
  const fetchGroups = useCallback(async () => {
    if (!authUserId) return;
    setIsLoadingGroups(true);
    try {
      // Fetch groups user is member of
      const { data: memberGroups } = await supabase
        .from('group_members')
        .select('group_id')
        .eq('user_id', authUserId);

      const groupIds = memberGroups?.map(m => m.group_id) || [];

      // Fetch groups created by user
      const { data: ownedGroups } = await supabase
        .from('evolution_groups')
        .select('*')
        .eq('created_by', authUserId);

      // Fetch groups user is member of
      let memberGroupsData: EvolutionGroup[] = [];
      if (groupIds.length > 0) {
        const { data } = await supabase
          .from('evolution_groups')
          .select('*')
          .in('id', groupIds);
        memberGroupsData = (data || []) as EvolutionGroup[];
      }

      // Combine and dedupe
      const allGroups = [...(ownedGroups || []), ...memberGroupsData] as EvolutionGroup[];
      const uniqueGroups = allGroups.reduce((acc, group) => {
        if (!acc.find(g => g.id === group.id)) {
          acc.push(group);
        }
        return acc;
      }, [] as EvolutionGroup[]);

      setGroups(uniqueGroups);
    } catch (error) {
      console.error('Error fetching groups:', error);
    } finally {
      setIsLoadingGroups(false);
    }
  }, [authUserId]);

  // Initial fetch
  useEffect(() => {
    if (authUserId) {
      fetchGlobalRanking();
      fetchFriendsRanking();
      fetchGroups();
    }
  }, [authUserId, fetchGlobalRanking, fetchFriendsRanking, fetchGroups]);

  const inviteFriend = async () => {
    if (!friendEmail.trim() || !authUserId) return;
    
    setIsInvitingFriend(true);
    try {
      // Use security definer function to find user by email (bypasses RLS)
      const { data: friendUserId, error: lookupError } = await supabase
        .rpc('get_user_id_by_email', { _email: friendEmail.trim() });

      if (lookupError) {
        console.error('Error looking up user:', lookupError);
        throw lookupError;
      }

      if (!friendUserId) {
        toast({
          title: "Usuário não encontrado",
          description: "Não encontramos um usuário com este email.",
          variant: "destructive",
        });
        return;
      }

      if (friendUserId === authUserId) {
        toast({
          title: "Ops!",
          description: "Você não pode adicionar a si mesmo.",
          variant: "destructive",
        });
        return;
      }

      const { data: existing } = await supabase
        .from('friendships')
        .select('id')
        .or(`and(user_id.eq.${authUserId},friend_id.eq.${friendUserId}),and(user_id.eq.${friendUserId},friend_id.eq.${authUserId})`)
        .maybeSingle();

      if (existing) {
        toast({
          title: "Já são amigos",
          description: "Vocês já estão conectados ou há um pedido pendente.",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from('friendships')
        .insert({
          user_id: authUserId,
          friend_id: friendUserId,
          status: 'accepted',
        });

      if (error) throw error;

      toast({
        title: "Amigo adicionado!",
        description: "Vocês agora podem competir juntos.",
      });
      
      setFriendEmail('');
      fetchFriendsRanking();
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
      fetchGroups();
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
    
    setIsJoiningGroup(true);
    try {
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
      fetchGroups();
    } catch (error) {
      console.error('Error joining group:', error);
      toast({
        title: "Erro",
        description: "Não foi possível entrar no grupo.",
        variant: "destructive",
      });
    } finally {
      setIsJoiningGroup(false);
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
            <TabsTrigger value="global" className="gap-2">
              <Trophy className="w-4 h-4" />
              <span className="hidden sm:inline">Global</span>
            </TabsTrigger>
            <TabsTrigger value="friends" className="gap-2">
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">Amigos</span>
            </TabsTrigger>
            <TabsTrigger value="groups" className="gap-2">
              <Target className="w-4 h-4" />
              <span className="hidden sm:inline">Grupos</span>
            </TabsTrigger>
          </TabsList>

          {/* Global Ranking */}
          <TabsContent value="global" className="space-y-4">
            <div className="bg-card rounded-xl border border-border overflow-hidden">
              <div className="p-4 border-b border-border bg-muted/50 flex items-center justify-between">
                <h3 className="font-semibold flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-primary" />
                  Ranking Global - Top 50
                </h3>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  onClick={fetchGlobalRanking}
                  disabled={isLoadingGlobal}
                >
                  <RefreshCw className={`w-4 h-4 ${isLoadingGlobal ? 'animate-spin' : ''}`} />
                </Button>
              </div>
              <div className="divide-y divide-border">
                {isLoadingGlobal ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <RankingRowSkeleton key={i} />
                  ))
                ) : globalRanking.length > 0 ? (
                  globalRanking.map((player, index) => (
                    <RankingRow 
                      key={player.user_id} 
                      player={player} 
                      position={index + 1}
                      isCurrentUser={player.user_id === authUserId}
                      getRankIcon={getRankIcon}
                    />
                  ))
                ) : (
                  <div className="p-8 text-center text-muted-foreground">
                    <Trophy className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>Nenhum usuário no ranking ainda.</p>
                    <p className="text-sm mt-1">Seja o primeiro a praticar!</p>
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
                    onKeyDown={(e) => e.key === 'Enter' && inviteFriend()}
                    className="pl-9"
                  />
                </div>
                <Button onClick={inviteFriend} disabled={isInvitingFriend || !friendEmail.trim()}>
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
              <div className="p-4 border-b border-border bg-muted/50 flex items-center justify-between">
                <h3 className="font-semibold flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  Ranking entre Amigos
                </h3>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  onClick={fetchFriendsRanking}
                  disabled={isLoadingFriends}
                >
                  <RefreshCw className={`w-4 h-4 ${isLoadingFriends ? 'animate-spin' : ''}`} />
                </Button>
              </div>
              <div className="divide-y divide-border">
                {isLoadingFriends ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <RankingRowSkeleton key={i} />
                  ))
                ) : friendsRanking.length > 1 ? (
                  friendsRanking.map((player, index) => (
                    <RankingRow 
                      key={player.user_id} 
                      player={player} 
                      position={index + 1}
                      isCurrentUser={player.user_id === authUserId}
                      getRankIcon={getRankIcon}
                    />
                  ))
                ) : (
                  <div className="p-8 text-center text-muted-foreground">
                    <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p className="font-medium">Adicione amigos para competir!</p>
                    <p className="text-sm mt-1">Use o email deles para conectar.</p>
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
                    onKeyDown={(e) => e.key === 'Enter' && createGroup()}
                  />
                  <Button onClick={createGroup} disabled={isCreatingGroup || !groupName.trim()}>
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
                    onKeyDown={(e) => e.key === 'Enter' && joinGroup()}
                  />
                  <Button onClick={joinGroup} disabled={isJoiningGroup || !groupInviteCode.trim()}>
                    {isJoiningGroup ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      'Entrar'
                    )}
                  </Button>
                </div>
              </div>
            </div>

            {/* My Groups */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold flex items-center gap-2">
                  <Target className="w-5 h-5 text-primary" />
                  Meus Grupos de Evolução
                </h3>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  onClick={fetchGroups}
                  disabled={isLoadingGroups}
                >
                  <RefreshCw className={`w-4 h-4 ${isLoadingGroups ? 'animate-spin' : ''}`} />
                </Button>
              </div>
              
              {isLoadingGroups ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Array.from({ length: 2 }).map((_, i) => (
                    <div key={i} className="bg-card rounded-xl border border-border p-4 animate-pulse">
                      <Skeleton className="h-5 w-32 mb-2" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                  ))}
                </div>
              ) : groups.length === 0 ? (
                <div className="bg-card rounded-xl border border-border p-8 text-center text-muted-foreground">
                  <Target className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="font-medium">Você ainda não faz parte de nenhum grupo.</p>
                  <p className="text-sm mt-1">Crie um ou peça um código de convite!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {groups.map((group) => (
                    <div key={group.id} className="bg-card rounded-xl border border-border p-4 hover:border-primary/50 transition-colors">
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
                        <code className="text-sm bg-muted px-2 py-1 rounded font-mono">
                          {group.invite_code}
                        </code>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => copyInviteCode(group.invite_code)}
                          className="h-8 w-8 p-0"
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
  <div className={`flex items-center gap-4 p-4 ${isCurrentUser ? 'bg-primary/5 border-l-2 border-l-primary' : 'hover:bg-muted/50'} transition-colors`}>
    <div className="w-8 flex justify-center">
      {getRankIcon(position)}
    </div>
    
    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-lg overflow-hidden">
      {player.avatar_url ? (
        <img src={player.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
      ) : (
        '👤'
      )}
    </div>
    
    <div className="flex-1 min-w-0">
      <p className={`font-medium truncate ${isCurrentUser ? 'text-primary' : 'text-foreground'}`}>
        {player.name}
        {isCurrentUser && <span className="text-xs ml-2 opacity-75">(você)</span>}
      </p>
      <p className="text-sm text-muted-foreground">
        Nível {player.current_adaptive_level || 'A1'}
      </p>
    </div>
    
    <div className="flex items-center gap-4 text-sm">
      <div className="flex items-center gap-1 text-muted-foreground" title="Conversas">
        <MessageSquare className="w-4 h-4" />
        <span>{player.total_conversations}</span>
      </div>
      <div className="flex items-center gap-1 text-orange-500" title="Sequência atual">
        <Flame className="w-4 h-4" />
        <span>{player.current_streak || 0}</span>
      </div>
    </div>
  </div>
);

export default Leaderboard;
