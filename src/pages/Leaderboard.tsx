import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
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
  RefreshCw,
  ChevronRight
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { GroupDetailModal } from '@/components/GroupDetailModal';

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

// Skeleton component for ranking rows - mobile responsive
const RankingRowSkeleton = () => (
  <div className="flex items-center gap-2 sm:gap-4 p-3 sm:p-4 animate-pulse">
    <Skeleton className="w-6 h-6 sm:w-8 sm:h-8 rounded flex-shrink-0" />
    <Skeleton className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex-shrink-0" />
    <div className="flex-1 min-w-0">
      <Skeleton className="h-4 w-20 sm:w-24 mb-2" />
      <Skeleton className="h-3 w-12 sm:w-16" />
    </div>
    <div className="flex gap-2 sm:gap-4 flex-shrink-0">
      <Skeleton className="h-4 w-6 sm:w-8" />
      <Skeleton className="h-4 w-6 sm:w-8" />
    </div>
  </div>
);

const Leaderboard: React.FC = () => {
  const { t } = useTranslation();
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
  
  // Group detail modal
  const [selectedGroup, setSelectedGroup] = useState<EvolutionGroup | null>(null);
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);

  // Fetch global ranking using secure view (excludes sensitive data like email)
  const fetchGlobalRanking = useCallback(async () => {
    if (!authUserId) return;
    setIsLoadingGlobal(true);
    try {
      const { data, error } = await supabase
        .from('user_rankings')
        .select('user_id, name, avatar_url, total_conversations, current_streak, longest_streak, current_adaptive_level')
        .order('total_conversations', { ascending: false })
        .limit(50);

      if (error) throw error;
      
      setGlobalRanking((data || []).map(u => ({ ...u, avatar_url: u.avatar_url || null })));
    } catch (error) {
      console.error('Error fetching global ranking:', error);
    } finally {
      setIsLoadingGlobal(false);
    }
  }, [authUserId]);

  // Fetch friends ranking
  const fetchFriendsRanking = useCallback(async () => {
    if (!authUserId) return;
    setIsLoadingFriends(true);
    try {
      // Get friendships where current user is involved
      const { data: friendships, error: friendshipsError } = await supabase
        .from('friendships')
        .select('user_id, friend_id, status')
        .or(`user_id.eq.${authUserId},friend_id.eq.${authUserId}`)
        .eq('status', 'accepted');

      if (friendshipsError) throw friendshipsError;

      // Get unique friend IDs
      const friendIds = friendships?.map(f => 
        f.user_id === authUserId ? f.friend_id : f.user_id
      ) || [];

      // Always include current user
      const allIds = [...new Set([...friendIds, authUserId])];

      if (allIds.length === 0) {
        setFriendsRanking([]);
        setIsLoadingFriends(false);
        return;
      }

      // Fetch profiles for friends and current user from secure view
      const { data: profiles, error: profilesError } = await supabase
        .from('user_rankings')
        .select('user_id, name, avatar_url, total_conversations, current_streak, longest_streak, current_adaptive_level')
        .in('user_id', allIds)
        .order('total_conversations', { ascending: false });

      if (profilesError) throw profilesError;

      setFriendsRanking((profiles || []).map(p => ({ ...p, avatar_url: p.avatar_url || null })));
    } catch (error) {
      console.error('Error fetching friends ranking:', error);
    } finally {
      setIsLoadingFriends(false);
    }
  }, [authUserId]);

  // Fetch user's groups
  const fetchGroups = useCallback(async () => {
    if (!authUserId) return;
    setIsLoadingGroups(true);
    try {
      // Get groups the user owns
      const { data: ownedGroups, error: ownedError } = await supabase
        .from('evolution_groups')
        .select('*')
        .eq('created_by', authUserId);

      if (ownedError) throw ownedError;

      // Get groups the user is a member of using RPC
      const { data: groupIds, error: memberError } = await supabase
        .rpc('get_user_group_ids', { _user_id: authUserId });

      if (memberError) throw memberError;

      // Fetch those groups
      let memberGroupsData: EvolutionGroup[] = [];
      if (groupIds && groupIds.length > 0) {
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
          title: t('leaderboard.toast.userNotFound'),
          description: t('leaderboard.toast.userNotFoundDesc'),
          variant: "destructive",
        });
        return;
      }

      if (friendUserId === authUserId) {
        toast({
          title: t('leaderboard.toast.cannotAddSelf'),
          description: t('leaderboard.toast.cannotAddSelfDesc'),
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
          title: t('leaderboard.toast.alreadyFriends'),
          description: t('leaderboard.toast.alreadyFriendsDesc'),
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
        title: t('leaderboard.toast.friendAdded'),
        description: t('leaderboard.toast.friendAddedDesc'),
      });
      
      setFriendEmail('');
      
      // Wait a moment for DB to sync, then refresh the list
      setIsInvitingFriend(false);
      await fetchFriendsRanking();
    } catch (error) {
      console.error('Error inviting friend:', error);
      toast({
        title: t('leaderboard.toast.error'),
        description: t('leaderboard.toast.errorAddFriend'),
        variant: "destructive",
      });
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
        title: t('leaderboard.toast.groupCreated'),
        description: `${t('leaderboard.toast.groupCreatedDesc')} ${data.invite_code}`,
      });
      
      setGroupName('');
      fetchGroups();
    } catch (error) {
      console.error('Error creating group:', error);
      toast({
        title: t('leaderboard.toast.error'),
        description: t('leaderboard.toast.errorCreateGroup'),
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
      // Use security definer function to find group by invite code (bypasses RLS)
      const { data: groups, error: lookupError } = await supabase
        .rpc('get_group_by_invite_code', { _invite_code: groupInviteCode.trim() });

      if (lookupError) {
        console.error('Error looking up group:', lookupError);
        throw lookupError;
      }

      const group = groups?.[0];

      if (!group) {
        toast({
          title: t('leaderboard.toast.groupNotFound'),
          description: t('leaderboard.toast.groupNotFoundDesc'),
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
          title: t('leaderboard.toast.alreadyMember'),
          description: t('leaderboard.toast.alreadyMemberDesc'),
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
        title: t('leaderboard.toast.joinedGroup'),
        description: `${t('leaderboard.toast.joinedGroupDesc')} "${group.name}".`,
      });
      
      setGroupInviteCode('');
      fetchGroups();
    } catch (error) {
      console.error('Error joining group:', error);
      toast({
        title: t('leaderboard.toast.error'),
        description: t('leaderboard.toast.errorJoinGroup'),
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
      title: t('leaderboard.toast.codeCopied'),
      description: t('leaderboard.toast.codeCopiedDesc'),
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
      <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground mb-1 sm:mb-2">
            {t('leaderboard.title')}
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            {t('leaderboard.subtitle')}
          </p>
        </div>

        <Tabs defaultValue="global" className="space-y-4 sm:space-y-6">
          <TabsList className="w-full grid grid-cols-3 h-auto">
            <TabsTrigger value="global" className="gap-1.5 sm:gap-2 py-2 sm:py-2.5 text-xs sm:text-sm">
              <Trophy className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden xs:inline sm:inline">{t('leaderboard.tabs.global')}</span>
            </TabsTrigger>
            <TabsTrigger value="friends" className="gap-1.5 sm:gap-2 py-2 sm:py-2.5 text-xs sm:text-sm">
              <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden xs:inline sm:inline">{t('leaderboard.tabs.friends')}</span>
            </TabsTrigger>
            <TabsTrigger value="groups" className="gap-1.5 sm:gap-2 py-2 sm:py-2.5 text-xs sm:text-sm">
              <Target className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden xs:inline sm:inline">{t('leaderboard.tabs.groups')}</span>
            </TabsTrigger>
          </TabsList>

          {/* Global Ranking */}
          <TabsContent value="global" className="space-y-4">
            <div className="bg-card rounded-xl border border-border overflow-hidden">
              <div className="p-3 sm:p-4 border-b border-border bg-muted/50 flex items-center justify-between">
                <h3 className="font-semibold flex items-center gap-2 text-sm sm:text-base">
                  <Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                  <span className="hidden xs:inline">{t('leaderboard.global.title')}</span>
                  <span className="xs:hidden">{t('leaderboard.tabs.global')}</span>
                  <span className="hidden sm:inline"> - {t('leaderboard.global.top50')}</span>
                </h3>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  onClick={fetchGlobalRanking}
                  disabled={isLoadingGlobal}
                  className="h-8 w-8 p-0"
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
                      t={t}
                    />
                  ))
                ) : (
                  <div className="p-6 sm:p-8 text-center text-muted-foreground">
                    <Trophy className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 opacity-50" />
                    <p className="text-sm sm:text-base">{t('leaderboard.global.empty')}</p>
                    <p className="text-xs sm:text-sm mt-1">{t('leaderboard.global.beFirst')}</p>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Friends Ranking */}
          <TabsContent value="friends" className="space-y-4">
            {/* Add Friend */}
            <div className="bg-card rounded-xl border border-border p-3 sm:p-4">
              <h3 className="font-semibold mb-3 sm:mb-4 flex items-center gap-2 text-sm sm:text-base">
                <UserPlus className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                {t('leaderboard.friends.addFriend')}
              </h3>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder={t('leaderboard.friends.emailPlaceholder')}
                    value={friendEmail}
                    onChange={(e) => setFriendEmail(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && inviteFriend()}
                    className="pl-9 text-sm sm:text-base h-9 sm:h-10"
                  />
                </div>
                <Button onClick={inviteFriend} disabled={isInvitingFriend || !friendEmail.trim()} className="h-9 sm:h-10 px-3 sm:px-4">
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
              <div className="p-3 sm:p-4 border-b border-border bg-muted/50 flex items-center justify-between">
                <h3 className="font-semibold flex items-center gap-2 text-sm sm:text-base">
                  <Users className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                  {t('leaderboard.friends.title')}
                </h3>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  onClick={fetchFriendsRanking}
                  disabled={isLoadingFriends}
                  className="h-8 w-8 p-0"
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
                      t={t}
                    />
                  ))
                ) : (
                  <div className="p-6 sm:p-8 text-center text-muted-foreground">
                    <Users className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 opacity-50" />
                    <p className="font-medium text-sm sm:text-base">{t('leaderboard.friends.empty')}</p>
                    <p className="text-xs sm:text-sm mt-1">{t('leaderboard.friends.useEmail')}</p>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Groups */}
          <TabsContent value="groups" className="space-y-4">
            {/* Create or Join Group */}
            <div className="grid grid-cols-1 gap-3 sm:gap-4">
              {/* Create Group */}
              <div className="bg-card rounded-xl border border-border p-3 sm:p-4">
                <h3 className="font-semibold mb-3 sm:mb-4 flex items-center gap-2 text-sm sm:text-base">
                  <Plus className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                  {t('leaderboard.groups.createGroup')}
                </h3>
                <div className="flex gap-2">
                  <Input
                    placeholder={t('leaderboard.groups.groupNamePlaceholder')}
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && createGroup()}
                    className="text-sm sm:text-base h-9 sm:h-10"
                  />
                  <Button onClick={createGroup} disabled={isCreatingGroup || !groupName.trim()} className="h-9 sm:h-10 px-3 sm:px-4 text-sm">
                    {isCreatingGroup ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      t('leaderboard.groups.create')
                    )}
                  </Button>
                </div>
              </div>

              {/* Join Group */}
              <div className="bg-card rounded-xl border border-border p-3 sm:p-4">
                <h3 className="font-semibold mb-3 sm:mb-4 flex items-center gap-2 text-sm sm:text-base">
                  <Users className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                  {t('leaderboard.groups.joinGroup')}
                </h3>
                <div className="flex gap-2">
                  <Input
                    placeholder={t('leaderboard.groups.inviteCodePlaceholder')}
                    value={groupInviteCode}
                    onChange={(e) => setGroupInviteCode(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && joinGroup()}
                    className="text-sm sm:text-base h-9 sm:h-10"
                  />
                  <Button onClick={joinGroup} disabled={isJoiningGroup || !groupInviteCode.trim()} className="h-9 sm:h-10 px-3 sm:px-4 text-sm">
                    {isJoiningGroup ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      t('leaderboard.groups.join')
                    )}
                  </Button>
                </div>
              </div>
            </div>

            {/* My Groups */}
            <div className="space-y-3 sm:space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold flex items-center gap-2 text-sm sm:text-base">
                  <Target className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                  {t('leaderboard.groups.myGroups')}
                </h3>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  onClick={fetchGroups}
                  disabled={isLoadingGroups}
                  className="h-8 w-8 p-0"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoadingGroups ? 'animate-spin' : ''}`} />
                </Button>
              </div>
              
              {isLoadingGroups ? (
                <div className="grid grid-cols-1 gap-3 sm:gap-4">
                  {Array.from({ length: 2 }).map((_, i) => (
                    <div key={i} className="bg-card rounded-xl border border-border p-3 sm:p-4 animate-pulse">
                      <Skeleton className="h-5 w-32 mb-2" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                  ))}
                </div>
              ) : groups.length === 0 ? (
                <div className="bg-card rounded-xl border border-border p-6 sm:p-8 text-center text-muted-foreground">
                  <Target className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 opacity-50" />
                  <p className="font-medium text-sm sm:text-base">{t('leaderboard.groups.empty')}</p>
                  <p className="text-xs sm:text-sm mt-1">{t('leaderboard.groups.createOrJoin')}</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3 sm:gap-4">
                  {groups.map((group) => (
                    <button 
                      key={group.id} 
                      onClick={() => {
                        setSelectedGroup(group);
                        setIsGroupModalOpen(true);
                      }}
                      className="bg-card rounded-xl border border-border p-3 sm:p-4 hover:border-primary/50 transition-colors text-left w-full"
                    >
                      <div className="flex items-start justify-between mb-2 sm:mb-3">
                        <div className="min-w-0 flex-1">
                          <h4 className="font-semibold text-foreground text-sm sm:text-base truncate">{group.name}</h4>
                          {group.description && (
                            <p className="text-xs sm:text-sm text-muted-foreground truncate">{group.description}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                          {group.created_by === authUserId && (
                            <span className="text-[10px] sm:text-xs bg-primary/10 text-primary px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full">{t('groupModal.admin')}</span>
                          )}
                          <ChevronRight className="w-4 h-4 text-muted-foreground" />
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <code className="text-xs sm:text-sm bg-muted px-2 py-1 rounded font-mono">
                          {group.invite_code}
                        </code>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            copyInviteCode(group.invite_code);
                          }}
                          className="h-7 w-7 sm:h-8 sm:w-8 p-0"
                        >
                          {copiedCode === group.invite_code ? (
                            <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-500" />
                          ) : (
                            <Copy className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          )}
                        </Button>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
        
        {/* Group Detail Modal */}
        <GroupDetailModal
          group={selectedGroup}
          open={isGroupModalOpen}
          onOpenChange={setIsGroupModalOpen}
          onGroupLeft={fetchGroups}
          onGroupDeleted={fetchGroups}
        />
      </div>
    </AppLayout>
  );
};

const RankingRow: React.FC<{
  player: RankingUser;
  position: number;
  isCurrentUser: boolean;
  getRankIcon: (position: number) => React.ReactNode;
  t: (key: string) => string;
}> = ({ player, position, isCurrentUser, getRankIcon, t }) => (
  <div className={`flex items-center gap-2 sm:gap-4 p-3 sm:p-4 ${isCurrentUser ? 'bg-primary/5 border-l-2 border-l-primary' : 'hover:bg-muted/50'} transition-colors`}>
    <div className="w-6 sm:w-8 flex justify-center flex-shrink-0">
      {getRankIcon(position)}
    </div>
    
    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm sm:text-lg overflow-hidden flex-shrink-0">
      {player.avatar_url ? (
        <img src={player.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
      ) : (
        '👤'
      )}
    </div>
    
    <div className="flex-1 min-w-0">
      <p className={`font-medium truncate text-sm sm:text-base ${isCurrentUser ? 'text-primary' : 'text-foreground'}`}>
        {player.name}
        {isCurrentUser && <span className="text-[10px] sm:text-xs ml-1 sm:ml-2 opacity-75">{t('leaderboard.you')}</span>}
      </p>
      <p className="text-xs sm:text-sm text-muted-foreground">
        {t('leaderboard.stats.level')} {player.current_adaptive_level || 'A1'}
      </p>
    </div>
    
    <div className="flex items-center gap-2 sm:gap-4 text-xs sm:text-sm flex-shrink-0">
      <div className="flex items-center gap-0.5 sm:gap-1 text-muted-foreground" title={t('leaderboard.stats.conversations')}>
        <MessageSquare className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        <span>{player.total_conversations}</span>
      </div>
      <div className="flex items-center gap-0.5 sm:gap-1 text-orange-500" title={t('leaderboard.stats.streak')}>
        <Flame className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        <span>{player.current_streak || 0}</span>
      </div>
    </div>
  </div>
);

export default Leaderboard;
