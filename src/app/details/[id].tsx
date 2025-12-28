import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import theme, { Box, Text } from '@/theme/theme';
import { useMeta } from '@/api/stremio';
import { useCallback } from 'react';

import { LoadingQuery } from '@/components/basic/LoadingQuery';
import { MediaDetailsSkeleton } from '@/components/media/MediaDetailsSkeleton';
import { EpisodeList } from '@/components/media/EpisodeList';
import { ContentType, MetaVideo } from '@/types/stremio';
import { Container } from '@/components/basic/Container';
import { useMyListStore } from '@/store/my-list.store';
import * as Burnt from 'burnt';
import { TOAST_DURATION_SHORT } from '@/constants/ui';
import { StreamList } from '@/components/media/StreamList';
import { ContinueWatchingCard } from '@/components/media/ContinueWatchingCard';
import { useContinueWatchingForMeta } from '@/hooks/useContinueWatching';
import { useMediaNavigation } from '@/hooks/useMediaNavigation';
import { DetailsShell } from '@/components/media/DetailsShell';
import { MyListHeaderButton } from '@/components/media/MyListHeaderButton';
import { Button } from '@/components/basic/Button';
import FadeIn from '@/components/basic/FadeIn';

export default function MediaDetails() {
  const { id, type = 'movie' } = useLocalSearchParams<{ id: string; type?: ContentType }>();
  const router = useRouter();
  const { pushToStreams } = useMediaNavigation();
  const { data: meta, isLoading, isError } = useMeta(type, id);

  // Get continue watching entry for this specific meta
  const continueWatching = useContinueWatchingForMeta(id, meta);

  const isInMyList = useMyListStore((state) => (id ? state.isInMyList(id, type) : false));
  const toggleMyList = useMyListStore((state) => state.toggleMyList);

  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

  const handleToggleMyList = (mediaName?: string) => {
    if (!id) return;
    const nowInList = toggleMyList({
      id,
      type,
    });
    Burnt.toast({
      title: nowInList ? 'Added to My List' : 'Removed from My List',
      message: mediaName ?? '',
      preset: 'done',
      haptic: 'success',
      duration: TOAST_DURATION_SHORT,
    });
  };

  const handleEpisodePress = (video: MetaVideo) => {
    if (!meta) return;
    pushToStreams({ metaId: id, videoId: video.id, type });
  };

  return (
    <Container disablePadding>
      <Stack.Screen
        options={{
          headerTransparent: true,
          headerTitle: '',
          headerTintColor: theme.colors.mainForeground,
          headerStyle: {
            backgroundColor: 'transparent',
          },
          headerShadowVisible: false,
          headerLeft: () => (
            <Box paddingVertical="s" paddingLeft="m" paddingRight="s">
              <Button variant="secondary" icon="arrow-back" onPress={handleBack} />
            </Box>
          ),
          headerRight: () => (
            <Box paddingVertical="s" paddingRight="m" paddingLeft="s">
              <MyListHeaderButton
                isInMyList={isInMyList}
                onPress={() => handleToggleMyList(meta?.name)}
              />
            </Box>
          ),
        }}
      />

      <LoadingQuery
        isLoading={isLoading}
        isError={isError}
        data={meta}
        loadingMessage="Loading details..."
        loadingComponent={<MediaDetailsSkeleton />}
        errorMessage="Failed to load details">
        {(mediaData) => (
          <DetailsShell media={mediaData}>
            {continueWatching && mediaData.videos && mediaData.videos.length > 1 && (
              <FadeIn>
                <Box gap="m">
                  <Text variant="subheader">Continue watching</Text>
                  <ContinueWatchingCard
                    entry={continueWatching}
                    hasTVPreferredFocus={true}
                    onPress={() => {
                      if (continueWatching.videoId) {
                        pushToStreams({
                          metaId: id,
                          videoId: continueWatching.videoId,
                          type,
                        });
                      }
                    }}
                  />
                </Box>
              </FadeIn>
            )}
            {mediaData.videos && mediaData.videos.length > 1 && (
              <EpisodeList
                metaId={id}
                videos={mediaData.videos}
                onEpisodePress={handleEpisodePress}
              />
            )}
            {mediaData.videos && mediaData.videos.length === 1 && (
              <StreamList
                title={mediaData.name}
                type={type}
                id={id}
                videoId={mediaData.videos[0].id}
              />
            )}
            {(!mediaData.videos || mediaData.videos.length === 0) && (
              <StreamList title={mediaData.name} type={type} id={id} videoId={id} />
            )}
          </DetailsShell>
        )}
      </LoadingQuery>
    </Container>
  );
}
