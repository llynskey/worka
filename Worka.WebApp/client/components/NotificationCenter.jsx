import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { api, unwrap } from '../api/workaApi';
import useAutoRefresh from '../Utils/useAutoRefresh';
import { useI18n } from '../i18n/I18nContext';
import { colors, radius, shadow } from '../Utils/theme';

const ICONS = {
  quote: 'file-document-outline',
  message: 'chat-outline',
  booking: 'calendar-check-outline',
  completed: 'check-decagram-outline',
  review: 'star-outline',
};
const iconFor = (type) => ICONS[type] || 'bell-outline';

/**
 * The notification bell + panel shown in the workspace header. Polls the unread
 * count while mounted and loads the full list when opened. Cross-platform: the
 * panel is a Modal anchored top-right.
 */
const NotificationCenter = () => {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadCount = useCallback(async () => {
    try {
      const res = await api.get('/notifications/unreadCount');
      const n = unwrap(res.data);
      setUnread(typeof n === 'number' ? n : 0);
    } catch {
      // Non-fatal: the next poll retries.
    }
  }, []);

  useEffect(() => {
    loadCount();
  }, [loadCount]);
  useAutoRefresh(loadCount, 20000);

  const loadList = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/notifications');
      setItems(unwrap(res.data) ?? []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const openPanel = () => {
    setOpen(true);
    loadList();
  };
  const closePanel = () => {
    setOpen(false);
    loadCount();
  };

  const markAll = async () => {
    setItems((cur) => cur.map((n) => ({ ...n, read: true })));
    setUnread(0);
    try {
      await api.post('/notifications/readAll');
    } catch {
      // ignore
    }
  };

  const onItem = async (item) => {
    if (item.read) return;
    setItems((cur) => cur.map((n) => (n.notificationId === item.notificationId ? { ...n, read: true } : n)));
    setUnread((u) => Math.max(0, u - 1));
    try {
      await api.post(`/notifications/${item.notificationId}/read`);
    } catch {
      // ignore
    }
  };

  const hasUnread = items.some((n) => !n.read);

  return (
    <>
      <TouchableOpacity style={styles.bell} onPress={openPanel} accessibilityLabel={t('notif.title')}>
        <MaterialCommunityIcons name="bell-outline" size={22} color={colors.ink} />
        {unread > 0 ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{unread > 9 ? '9+' : unread}</Text>
          </View>
        ) : null}
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="fade" onRequestClose={closePanel}>
        <Pressable style={styles.backdrop} onPress={closePanel}>
          <Pressable style={styles.panel} onPress={() => {}}>
            <View style={styles.panelHeader}>
              <Text style={styles.panelTitle}>{t('notif.title')}</Text>
              <View style={styles.panelHeaderRight}>
                {hasUnread ? (
                  <TouchableOpacity onPress={markAll}>
                    <Text style={styles.markAll}>{t('notif.markAll')}</Text>
                  </TouchableOpacity>
                ) : null}
                <TouchableOpacity onPress={closePanel} style={styles.closeBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <MaterialCommunityIcons name="close" size={18} color={colors.ink} />
                </TouchableOpacity>
              </View>
            </View>

            <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
              {loading ? (
                <View style={styles.center}>
                  <ActivityIndicator color="#111" />
                </View>
              ) : items.length === 0 ? (
                <View style={styles.center}>
                  <MaterialCommunityIcons name="bell-sleep-outline" size={30} color={colors.mutedSoft} />
                  <Text style={styles.empty}>{t('notif.empty')}</Text>
                </View>
              ) : (
                items.map((n) => (
                  <TouchableOpacity
                    key={n.notificationId}
                    style={[styles.row, !n.read && styles.rowUnread]}
                    onPress={() => onItem(n)}
                  >
                    <View style={[styles.rowIcon, !n.read && styles.rowIconUnread]}>
                      <MaterialCommunityIcons name={iconFor(n.type)} size={17} color={!n.read ? '#fff' : colors.ink} />
                    </View>
                    <View style={styles.rowCopy}>
                      <Text style={styles.rowTitle} numberOfLines={1}>{n.title}</Text>
                      {n.body ? <Text style={styles.rowBody} numberOfLines={2}>{n.body}</Text> : null}
                    </View>
                    {!n.read ? <View style={styles.dot} /> : null}
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  bell: {
    width: 44,
    height: 44,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: 6,
    right: 6,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '900',
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.28)',
    alignItems: 'flex-end',
    paddingTop: 62,
    paddingHorizontal: 12,
  },
  panel: {
    width: '100%',
    maxWidth: 380,
    maxHeight: '80%',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    ...shadow.raised,
  },
  panelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSoft,
  },
  panelHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  panelTitle: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: '900',
  },
  markAll: {
    color: colors.muted,
    fontWeight: '800',
    fontSize: 13,
  },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: {
    flexGrow: 0,
  },
  listContent: {
    paddingBottom: 8,
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  empty: {
    marginTop: 10,
    color: colors.muted,
    fontWeight: '700',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  rowUnread: {
    backgroundColor: colors.surfaceAlt,
  },
  rowIcon: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowIconUnread: {
    backgroundColor: colors.ink,
    borderColor: colors.ink,
  },
  rowCopy: {
    flex: 1,
    minWidth: 0,
  },
  rowTitle: {
    color: colors.ink,
    fontWeight: '800',
    fontSize: 14,
  },
  rowBody: {
    color: colors.muted,
    marginTop: 2,
    lineHeight: 18,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.accent,
  },
});

export default NotificationCenter;
