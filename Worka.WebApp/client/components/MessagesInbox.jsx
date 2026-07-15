import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
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

const formatWhen = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const now = new Date();
  const sameDay = date.toDateString() === now.toDateString();
  return new Intl.DateTimeFormat('en-GB', sameDay
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
  const { t } = useI18n();
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

  const renderItem = ({ item }) => {
    const { first, last } = splitName(item.counterpartName);
    const unread = item.unreadCount > 0;
    const mine = item.lastSenderRole === role;
    const preview = mine
      ? `${t('messages.you')} ${item.lastMessageBody}`
      : item.lastMessageBody;

    return (
      <TouchableOpacity
        style={[styles.row, unread && styles.rowUnread]}
        activeOpacity={0.85}
        onPress={() => openThread(item)}
      >
        <Avatar photoUrl={item.counterpartPhotoUrl} firstName={first} lastName={last} size={46} />
        <View style={styles.rowBody}>
          <View style={styles.rowTop}>
            <Text style={[styles.counterpart, unread && styles.counterpartUnread]} numberOfLines={1}>
              {item.counterpartName || t('checkout.proFallback')}
            </Text>
            <Text style={styles.time}>{formatWhen(item.lastMessageAt)}</Text>
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
            ) : null}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading && conversations.length === 0) {
    return (
      <View style={styles.centerState}>
        <ActivityIndicator color="#111" />
      </View>
    );
  }

  return (
    <>
      <FlatList
        data={conversations}
        keyExtractor={(item) => `${item.jobId}:${item.professionalId}`}
        renderItem={renderItem}
        contentContainerStyle={
          conversations.length === 0 ? styles.emptyContainer : styles.listContent
        }
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor="#111" />}
        ListEmptyComponent={
          <View style={styles.centerState}>
            <MaterialCommunityIcons name="chat-outline" size={34} color="#62645c" />
            <Text style={styles.emptyTitle}>{t('messages.empty')}</Text>
            <Text style={styles.emptyHint}>{t('messages.emptyHint')}</Text>
          </View>
        }
      />

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
  listContent: {
    padding: 16,
    gap: 10,
  },
  emptyContainer: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  centerState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
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
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e3dfd2',
    borderRadius: 8,
    padding: 12,
  },
  rowUnread: {
    borderColor: '#111',
    backgroundColor: '#fbfaf6',
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
    fontSize: 15,
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
    marginTop: 2,
    color: '#62645c',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  rowBottom: {
    marginTop: 5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  preview: {
    flex: 1,
    color: '#64675f',
    fontSize: 13,
  },
  previewUnread: {
    color: '#111',
    fontWeight: '700',
  },
  badge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    paddingHorizontal: 6,
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
