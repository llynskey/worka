import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import notify from '../Utils/notify';
import useAutoRefresh from '../Utils/useAutoRefresh';
import { api, getErrorMessage, unwrap } from '../api/workaApi';
import { useI18n } from '../i18n/I18nContext';
import Avatar from './Avatar';
import ChatModal from './ChatModal';
import ChatThread from './ChatThread';
import { colors, radius, shadow, space, useLayout } from '../Utils/theme';

const formatWhen = (value, locale) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const now = new Date();
  const sameDay = date.toDateString() === now.toDateString();
  return new Intl.DateTimeFormat(locale || undefined, sameDay
    ? { hour: '2-digit', minute: '2-digit' }
    : { day: 'numeric', month: 'short' }
  ).format(date);
};

const splitName = (name) => {
  const parts = (name || '').trim().split(/\s+/);
  return { first: parts[0] || '', last: parts.slice(1).join(' ') };
};

/**
 * The "Messages" inbox: every (job, professional) chat thread the signed-in
 * user takes part in, newest first, with a last-message preview and an unread
 * badge. Tapping a row opens the shared ChatModal and marks the thread read.
 * `role` ('customer' | 'professional') decides which side of every thread the
 * user sits on and is passed straight through to the chat.
 */
const MessagesInbox = ({ role = 'customer' }) => {
  const { t, language } = useI18n();
  const { isDesktop } = useLayout();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [active, setActive] = useState(null);

  const loadQuietly = useCallback(async () => {
    const response = await api.get('/messages');
    setConversations(unwrap(response.data) ?? []);
  }, []);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    api
      .get('/messages')
      .then((response) => {
        if (mounted) setConversations(unwrap(response.data) ?? []);
      })
      .catch((err) => {
        if (mounted) notify(t('messages.loadError'), getErrorMessage(err, t('common.tryAgain')));
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [t]);

  // Keep unread counts and previews fresh while the inbox is on screen.
  useAutoRefresh(loadQuietly, 10000);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadQuietly();
    } catch (err) {
      notify(t('messages.loadError'), getErrorMessage(err, t('common.tryAgain')));
    } finally {
      setRefreshing(false);
    }
  }, [loadQuietly, t]);

  const openThread = useCallback(async (conversation) => {
    setActive(conversation);
    // Optimistically clear the badge, then tell the server we've read it.
    setConversations((prev) =>
      prev.map((c) =>
        c.jobId === conversation.jobId && c.professionalId === conversation.professionalId
          ? { ...c, unreadCount: 0 }
          : c
      )
    );
    try {
      await api.post(`/Jobs/${conversation.jobId}/messages/read`, {
        professionalId: conversation.professionalId,
      });
    } catch {
      // Non-fatal: the next poll re-reads the true unread state.
    }
  }, []);

  const closeThread = useCallback(() => {
    setActive(null);
    loadQuietly().catch(() => {});
  }, [loadQuietly]);

  const totalUnread = conversations.reduce((sum, c) => sum + (c.unreadCount || 0), 0);

  const renderItem = ({ item }) => {
    const { first, last } = splitName(item.counterpartName);
    const unread = item.unreadCount > 0;
    const mine = item.lastSenderRole === role;
    const preview = mine
      ? `${t('messages.you')} ${item.lastMessageBody}`
      : item.lastMessageBody;
    const selected =
      isDesktop && active && active.jobId === item.jobId && active.professionalId === item.professionalId;

    return (
      <TouchableOpacity
        style={[styles.row, unread && styles.rowUnread, selected && styles.rowSelected]}
        activeOpacity={0.85}
        onPress={() => openThread(item)}
      >
        <Avatar photoUrl={item.counterpartPhotoUrl} firstName={first} lastName={last} size={52} />
        <View style={styles.rowBody}>
          <View style={styles.rowTop}>
            <Text style={[styles.counterpart, unread && styles.counterpartUnread]} numberOfLines={1}>
              {item.counterpartName || t('checkout.proFallback')}
            </Text>
            <Text style={styles.time}>{formatWhen(item.lastMessageAt, language)}</Text>
          </View>
          <Text style={styles.job} numberOfLines={1}>
            {item.jobName}
          </Text>
          <View style={styles.rowBottom}>
            <Text
              style={[styles.preview, unread && styles.previewUnread]}
              numberOfLines={1}
            >
              {preview}
            </Text>
            {unread ? (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{item.unreadCount}</Text>
              </View>
            ) : (
              <MaterialCommunityIcons name="chevron-right" size={22} color="#c4c1b6" />
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const header = (
    <View style={styles.hero}>
      <View style={styles.heroCopy}>
        <Text style={styles.eyebrow}>{t('tabs.messages')}</Text>
        <Text style={styles.heroTitle}>{t('tabs.messagesDesc')}</Text>
      </View>
      {totalUnread > 0 ? (
        <View style={styles.heroBadge}>
          <Text style={styles.heroBadgeText}>{t('messages.unreadCount', { count: totalUnread })}</Text>
        </View>
      ) : null}
    </View>
  );

  const emptyEl = (
    <View style={styles.emptyCard}>
      <MaterialCommunityIcons name="chat-outline" size={34} color={colors.muted} />
      <Text style={styles.emptyTitle}>{t('messages.empty')}</Text>
      <Text style={styles.emptyHint}>{t('messages.emptyHint')}</Text>
    </View>
  );

  const listEl = (
    <FlatList
      data={conversations}
      keyExtractor={(item) => `${item.jobId}:${item.professionalId}`}
      renderItem={renderItem}
      ListHeaderComponent={isDesktop ? null : header}
      contentContainerStyle={isDesktop ? styles.listPaneContent : styles.listContent}
      ItemSeparatorComponent={() => <View style={styles.separator} />}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor="#111" />}
      ListEmptyComponent={emptyEl}
    />
  );

  if (loading && conversations.length === 0) {
    return (
      <View style={styles.loadingWrap}>
        <View style={styles.column}>
          {header}
          <View style={styles.centerState}>
            <ActivityIndicator color="#111" />
          </View>
        </View>
      </View>
    );
  }

  // Desktop: a persistent master-detail — conversation list beside the open
  // thread, so you keep list context while reading. Mobile keeps list -> modal.
  if (isDesktop) {
    return (
      <View style={styles.screen}>
        <View style={styles.deskWrap}>
          {header}
          <View style={styles.twoPane}>
            <View style={styles.listPane}>{listEl}</View>
            <View style={styles.threadPane}>
              {active ? (
                <ChatThread
                  key={`${active.jobId}:${active.professionalId}`}
                  jobId={active.jobId}
                  professionalId={active.professionalId}
                  title={active.jobName}
                  subtitle={active.counterpartName}
                  role={role}
                />
              ) : (
                <View style={styles.placeholder}>
                  <MaterialCommunityIcons name="chat-processing-outline" size={44} color={colors.mutedSoft} />
                  <Text style={styles.placeholderTitle}>{t('messages.selectTitle')}</Text>
                  <Text style={styles.placeholderHint}>{t('messages.selectHint')}</Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </View>
    );
  }

  return (
    <>
      {listEl}
      <ChatModal
        visible={!!active}
        onClose={closeThread}
        jobId={active?.jobId}
        professionalId={active?.professionalId}
        title={active?.jobName}
        subtitle={active?.counterpartName}
        role={role}
      />
    </>
  );
};

const styles = StyleSheet.create({
  loadingWrap: {
    flex: 1,
    backgroundColor: '#f7f5ef',
  },
  screen: {
    flex: 1,
    minHeight: 0,
    backgroundColor: colors.paper,
  },
  deskWrap: {
    flex: 1,
    minHeight: 0,
    width: '100%',
    maxWidth: 1240,
    alignSelf: 'center',
    padding: space.lg,
  },
  twoPane: {
    flex: 1,
    minHeight: 0,
    flexDirection: 'row',
    gap: space.lg,
  },
  listPane: {
    width: 360,
    flexShrink: 0,
    minHeight: 0,
  },
  listPaneContent: {
    paddingBottom: 12,
  },
  threadPane: {
    flex: 1,
    minWidth: 0,
    minHeight: 0,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: space.lg,
    ...shadow.card,
  },
  placeholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  placeholderTitle: {
    marginTop: 12,
    color: colors.ink,
    fontSize: 17,
    fontWeight: '900',
    textAlign: 'center',
  },
  placeholderHint: {
    marginTop: 6,
    color: colors.muted,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 320,
  },
  // Centred, width-capped column so rows stay readable on wide desktops
  // instead of stretching across the whole workspace.
  listContent: {
    padding: 16,
    paddingBottom: 28,
    flexGrow: 1,
    backgroundColor: '#f7f5ef',
    width: '100%',
    maxWidth: 760,
    alignSelf: 'center',
  },
  column: {
    padding: 16,
    width: '100%',
    maxWidth: 760,
    alignSelf: 'center',
  },
  separator: {
    height: 10,
  },
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#18201d',
    borderRadius: 8,
    padding: 18,
    marginBottom: 14,
  },
  heroCopy: {
    flex: 1,
    minWidth: 0,
  },
  eyebrow: {
    color: '#9fd8b6',
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 6,
  },
  heroTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '900',
  },
  heroBadge: {
    backgroundColor: '#9fd8b6',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  heroBadgeText: {
    color: '#18201d',
    fontSize: 13,
    fontWeight: '900',
  },
  emptyCard: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 44,
    paddingHorizontal: 24,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e3dfd2',
    borderRadius: 8,
  },
  centerState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyTitle: {
    marginTop: 12,
    color: '#111',
    fontSize: 16,
    fontWeight: '900',
    textAlign: 'center',
  },
  emptyHint: {
    marginTop: 6,
    color: '#62645c',
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 340,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e3dfd2',
    borderRadius: 8,
    padding: 14,
    ...(Platform.OS === 'web' ? { cursor: 'pointer' } : null),
  },
  rowUnread: {
    borderColor: '#111',
    backgroundColor: '#fbfaf6',
  },
  rowSelected: {
    borderColor: '#111',
    borderWidth: 2,
    backgroundColor: '#fff',
  },
  rowBody: {
    flex: 1,
    minWidth: 0,
  },
  rowTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  counterpart: {
    flex: 1,
    color: '#111',
    fontSize: 16,
    fontWeight: '800',
  },
  counterpartUnread: {
    fontWeight: '900',
  },
  time: {
    color: '#62645c',
    fontSize: 12,
    fontWeight: '700',
  },
  job: {
    marginTop: 3,
    color: '#62645c',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  rowBottom: {
    marginTop: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  preview: {
    flex: 1,
    color: '#64675f',
    fontSize: 14,
    lineHeight: 19,
  },
  previewUnread: {
    color: '#111',
    fontWeight: '700',
  },
  badge: {
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    paddingHorizontal: 7,
    backgroundColor: '#111',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '900',
  },
});

export default MessagesInbox;
