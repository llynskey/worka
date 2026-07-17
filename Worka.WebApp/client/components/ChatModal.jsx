import React from 'react';
import { KeyboardAvoidingView, Modal, Platform, StyleSheet, View } from 'react-native';
import ChatThread from './ChatThread';

/**
 * Bottom-sheet (mobile) / centred (tablet) wrapper around ChatThread. On the
 * desktop inbox the thread is rendered inline instead, without this modal.
 */
const ChatModal = ({ visible, onClose, jobId, professionalId, title, subtitle, role = 'customer' }) => (
  <Modal visible={!!visible} transparent animationType="slide" onRequestClose={onClose}>
    <View style={styles.backdrop}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.keyboard}>
        <View style={styles.card}>
          <ChatThread
            jobId={jobId}
            professionalId={professionalId}
            title={title}
            subtitle={subtitle}
            role={role}
            onClose={onClose}
          />
        </View>
      </KeyboardAvoidingView>
    </View>
  </Modal>
);

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.42)',
    justifyContent: 'flex-end',
  },
  keyboard: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  card: {
    height: '85%',
    maxHeight: 680,
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
    backgroundColor: '#fff',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    overflow: 'hidden',
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 30 : 16,
  },
});

export default ChatModal;
