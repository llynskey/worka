import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import notify from '../Utils/notify';
import useAutoRefresh from '../Utils/useAutoRefresh';
import { api, getErrorMessage, unwrap } from '../api/workaApi';
import { useI18n } from '../i18n/I18nContext';
import { colors, radius } from '../Utils/theme';

const formatTimestamp = (value, locale) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat(locale || undefined, {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

/**
 * The chat surface for one (job, professional) thread — header, message list and
 * composer — with no outer chrome. Reused by ChatModal (mobile bottom sheet) and
 * by the desktop two-pane inbox (inline right pane). Bodies arrive redacted by
 * the API until the job is booked, so this only renders what it is given.
 */
const ChatThread = ({ jobId, professionalId, title, subtitle, role = 'customer', onClose, style }) => {
  const { t, language } = useI18n();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const scrollRef = useRef(null);

  const active = !!(jobId && professionalId);

  const loadQuietly = useCallback(async () => {
    if (!active) return;
    const response = await api.get(`/Jobs/${jobId}/messages`, { params: { professionalId } });
    setMessages(unwrap(response.data) ?? []);
  }, [active, jobId, professionalId]);

  // Spinner load whenever the selected thread changes; opening also marks read.
  useEffect(() => {
    if (!active) {
      setMessages([]);
      return undefined;
    }
    let mounted = true;
    setLoading(true);
    setDraft('');
    api.post(`/Jobs/${jobId}/messages/read`, { professionalId }).catch(() => {});
    api
      .get(`/Jobs/${jobId}/messages`, { params: { professionalId } })
      .then((response) => {
        if (mounted) setMessages(unwrap(response.data) ?? []);
      })
      .catch((err) => {
        if (mounted) notify(t('chat.loadError'), getErrorMessage(err, t('common.tryAgain')));
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [active, jobId, professionalId, t]);

  useAutoRefresh(loadQuietly, 5000);

  const send = async () => {
    const body = draft.trim();
    if (!body || sending || !active) return;
    try {
      setSending(true);
      await api.post(`/Jobs/${jobId}/messages`, { professionalId, body });
      setDraft('');
      await loadQuietly();
    } catch (err) {
      notify(t('chat.sendError'), getErrorMessage(err, t('common.tryAgain')));
    } finally {
      setSending(false);
    }
  };

  // Web: Enter sends, Shift+Enter inserts a newline.
  const onKeyPress = (event) => {
    if (Platform.OS !== 'web') return;
    const e = event.nativeEvent;
    if (e.key === 'Enter' && !e.shiftKey) {
      event.preventDefault?.();
      send();
    }
  };

  return (
    <View style={[styles.wrap, style]}>
      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <Text style={styles.kicker}>{t('chat.title')}</Text>
          <Text style={styles.title} numberOfLines={1}>{title}</Text>
          {subtitle ? (
            <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text>
          ) : null}
        </View>
        {onClose ? (
          <TouchableOpacity
            style={styles.closeButton}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            onPress={onClose}
          >
            <MaterialCommunityIcons name="close" size={22} color="#111" />
          </TouchableOpacity>
        ) : null}
      </View>

      <View style={styles.noticeRow}>
        <MaterialCommunityIcons name="shield-lock-outline" size={16} color={colors.muted} />
        <Text style={styles.noticeText}>{t('chat.hiddenNotice')}</Text>
      </View>

      <ScrollView
        ref={scrollRef}
        style={styles.thread}
        contentContainerStyle={styles.threadContent}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}
      >
        {loading && messages.length === 0 ? (
          <View style={styles.centerState}>
            <ActivityIndicator color="#111" />
          </View>
        ) : messages.length === 0 ? (
          <View style={styles.centerState}>
            <MaterialCommunityIcons name="chat-outline" size={30} color={colors.muted} />
            <Text style={styles.emptyText}>{t('chat.empty')}</Text>
          </View>
        ) : (
          messages.map((message) => {
            const own = message.senderRole === role;
            return (
              <View
                key={message.jobMessageId}
                style={[styles.bubbleRow, own ? styles.bubbleRowOwn : styles.bubbleRowOther]}
              >
                <View style={[styles.bubble, own ? styles.bubbleOwn : styles.bubbleOther]}>
                  <Text style={own ? styles.bubbleOwnText : styles.bubbleOtherText}>{message.body}</Text>
                  <Text style={[styles.timestamp, own && styles.timestampOwn]}>
                    {formatTimestamp(message.createdAt, language)}
                  </Text>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={draft}
          onChangeText={setDraft}
          onKeyPress={onKeyPress}
          placeholder={t('chat.placeholder')}
          placeholderTextColor="#686b64"
          multiline
          maxLength={2000}
          editable={active}
        />
        <TouchableOpacity
          style={styles.sendButton}
          onPress={send}
          disabled={sending || !draft.trim()}
          accessibilityLabel={t('chat.send')}
        >
          {sending ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <MaterialCommunityIcons name="send-outline" size={20} color="#fff" />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: { flex: 1, minHeight: 0 },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 10,
  },
  headerCopy: { flex: 1, minWidth: 0 },
  kicker: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  title: { color: colors.ink, fontSize: 20, fontWeight: '900' },
  subtitle: { color: colors.muted, fontWeight: '700', marginTop: 2 },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noticeRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 7,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceAlt,
    padding: 10,
    marginBottom: 10,
  },
  noticeText: { flex: 1, color: colors.muted, fontSize: 12, fontWeight: '700', lineHeight: 17 },
  thread: { flex: 1, minHeight: 0 },
  threadContent: { paddingVertical: 6, gap: 8 },
  centerState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 36, paddingHorizontal: 12 },
  emptyText: { marginTop: 10, color: colors.muted, textAlign: 'center', lineHeight: 20 },
  bubbleRow: { flexDirection: 'row' },
  bubbleRowOwn: { justifyContent: 'flex-end' },
  bubbleRowOther: { justifyContent: 'flex-start' },
  bubble: { maxWidth: '82%', borderRadius: radius.sm, paddingHorizontal: 12, paddingVertical: 9 },
  bubbleOwn: { backgroundColor: colors.ink },
  bubbleOther: { backgroundColor: colors.line },
  bubbleOwnText: { color: '#fff', lineHeight: 20 },
  bubbleOtherText: { color: colors.ink, lineHeight: 20 },
  timestamp: { marginTop: 4, color: colors.muted, fontSize: 11, fontWeight: '700' },
  timestampOwn: { color: '#c9c7bd' },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: colors.borderSoft,
    paddingTop: 10,
    marginTop: 8,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    borderWidth: 1,
    borderColor: '#d9d5ca',
    borderRadius: radius.sm,
    paddingHorizontal: 13,
    paddingVertical: 11,
    backgroundColor: colors.surfaceAlt,
    fontSize: 15,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: radius.sm,
    backgroundColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default ChatThread;
