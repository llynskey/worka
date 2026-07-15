import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
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

const formatTimestamp = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

/**
 * Job-scoped chat between the customer and one professional. Bodies arrive
 * already redacted by the API until the job is booked with that
 * professional, so this component only has to render what it is given.
 * `role` ('customer' | 'professional') decides which side of the thread the
 * signed-in user sits on.
 */
const ChatModal = ({ visible, onClose, jobId, professionalId, title, subtitle, role = 'customer' }) => {
  const { t } = useI18n();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const scrollRef = useRef(null);

  const loadQuietly = useCallback(async () => {
    if (!visible || !jobId || !professionalId) return;
    const response = await api.get(`/Jobs/${jobId}/messages`, {
      params: { professionalId },
    });
    setMessages(unwrap(response.data) ?? []);
  }, [visible, jobId, professionalId]);

  // Initial (spinner) load whenever the thread opens.
  useEffect(() => {
    if (!visible || !jobId || !professionalId) return undefined;
    let mounted = true;
    setLoading(true);
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
  }, [visible, jobId, professionalId, t]);

  // New messages appear without a manual reload while the thread is open.
  useAutoRefresh(loadQuietly, 5000);

  const send = async () => {
    const body = draft.trim();
    if (!body || sending) return;
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

  return (
    <Modal visible={!!visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboard}
        >
          <View style={styles.card}>
            <View style={styles.header}>
              <View style={styles.headerCopy}>
                <Text style={styles.kicker}>{t('chat.title')}</Text>
                <Text style={styles.title} numberOfLines={1}>
                  {title}
                </Text>
                {subtitle ? (
                  <Text style={styles.subtitle} numberOfLines={1}>
                    {subtitle}
                  </Text>
                ) : null}
              </View>
              <TouchableOpacity
                style={styles.closeButton}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                onPress={onClose}
              >
                <MaterialCommunityIcons name="close" size={22} color="#111" />
              </TouchableOpacity>
            </View>

            <View style={styles.noticeRow}>
              <MaterialCommunityIcons name="shield-lock-outline" size={16} color="#62645c" />
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
                  <MaterialCommunityIcons name="chat-outline" size={30} color="#62645c" />
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
                        <Text style={own ? styles.bubbleOwnText : styles.bubbleOtherText}>
                          {message.body}
                        </Text>
                        <Text style={[styles.timestamp, own && styles.timestampOwn]}>
                          {formatTimestamp(message.createdAt)}
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
                placeholder={t('chat.placeholder')}
                placeholderTextColor="#686b64"
                multiline
                maxLength={2000}
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
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.42)',
    justifyContent: 'flex-end',
  },
  keyboard: {
    // Must own the full backdrop height: the card's percentage height
    // resolves against this container, and an auto-sized parent would
    // collapse it to zero.
    flex: 1,
    justifyContent: 'flex-end',
  },
  card: {
    height: '85%',
    maxHeight: 680,
    backgroundColor: '#fff',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    overflow: 'hidden',
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 10,
  },
  headerCopy: {
    flex: 1,
    minWidth: 0,
  },
  kicker: {
    color: '#62645c',
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  title: {
    color: '#111',
    fontSize: 20,
    fontWeight: '900',
  },
  subtitle: {
    color: '#62645c',
    fontWeight: '700',
    marginTop: 2,
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f1ede4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  noticeRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 7,
    borderWidth: 1,
    borderColor: '#e3dfd2',
    borderRadius: 8,
    backgroundColor: '#fbfaf6',
    padding: 10,
    marginBottom: 10,
  },
  noticeText: {
    flex: 1,
    color: '#62645c',
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 17,
  },
  thread: {
    flex: 1,
  },
  threadContent: {
    paddingVertical: 6,
    gap: 8,
  },
  centerState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 36,
    paddingHorizontal: 12,
  },
  emptyText: {
    marginTop: 10,
    color: '#62645c',
    textAlign: 'center',
    lineHeight: 20,
  },
  bubbleRow: {
    flexDirection: 'row',
  },
  bubbleRowOwn: {
    justifyContent: 'flex-end',
  },
  bubbleRowOther: {
    justifyContent: 'flex-start',
  },
  bubble: {
    maxWidth: '82%',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  bubbleOwn: {
    backgroundColor: '#111',
  },
  bubbleOther: {
    backgroundColor: '#f1ede4',
  },
  bubbleOwnText: {
    color: '#fff',
    lineHeight: 20,
  },
  bubbleOtherText: {
    color: '#111',
    lineHeight: 20,
  },
  timestamp: {
    marginTop: 4,
    color: '#62645c',
    fontSize: 11,
    fontWeight: '700',
  },
  timestampOwn: {
    color: '#c9c7bd',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: '#ece7dc',
    paddingTop: 10,
    marginTop: 8,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    borderWidth: 1,
    borderColor: '#d9d5ca',
    borderRadius: 8,
    paddingHorizontal: 13,
    paddingVertical: 11,
    backgroundColor: '#fbfaf6',
    fontSize: 15,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#111',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default ChatModal;
