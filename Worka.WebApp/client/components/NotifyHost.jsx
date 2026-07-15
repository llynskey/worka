import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { registerNotifyHost } from '../Utils/notify';

const TOAST_DURATION = 4200;

const Toast = ({ toast, onDismiss }) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-8)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 180, useNativeDriver: true }),
    ]).start();

    const timer = setTimeout(() => {
      Animated.timing(opacity, { toValue: 0, duration: 220, useNativeDriver: true }).start(
        ({ finished }) => {
          if (finished) onDismiss(toast.id);
        }
      );
    }, TOAST_DURATION);

    return () => clearTimeout(timer);
  }, [onDismiss, opacity, toast.id, translateY]);

  return (
    <Animated.View style={[styles.toast, { opacity, transform: [{ translateY }] }]}>
      <View style={styles.toastIcon}>
        <MaterialCommunityIcons
          name={toast.kind === 'error' ? 'alert-circle-outline' : 'check-circle-outline'}
          size={19}
          color="#fff"
        />
      </View>
      <View style={styles.toastCopy}>
        <Text style={styles.toastTitle}>{toast.title}</Text>
        {toast.message ? <Text style={styles.toastMessage}>{toast.message}</Text> : null}
      </View>
      <TouchableOpacity
        style={styles.toastClose}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        onPress={() => onDismiss(toast.id)}
      >
        <MaterialCommunityIcons name="close" size={16} color="#62645c" />
      </TouchableOpacity>
    </Animated.View>
  );
};

/**
 * Brand-themed replacement for native alerts. Mounted once at the app root;
 * Utils/notify routes notify() and confirmAction() calls here.
 */
const NotifyHost = () => {
  const [toasts, setToasts] = useState([]);
  const [confirm, setConfirm] = useState(null);
  const nextId = useRef(0);

  const dismissToast = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  useEffect(() => {
    registerNotifyHost({
      showToast: ({ title, message, kind }) => {
        nextId.current += 1;
        const id = nextId.current;
        setToasts((current) => [...current.slice(-2), { id, title, message, kind }]);
      },
      showConfirm: ({ title, message, confirmLabel, cancelLabel, resolve }) => {
        setConfirm({ title, message, confirmLabel, cancelLabel, resolve });
      },
    });
    return () => registerNotifyHost(null);
  }, []);

  const closeConfirm = useCallback(
    (result) => {
      if (confirm) confirm.resolve(result);
      setConfirm(null);
    },
    [confirm]
  );

  return (
    <>
      {toasts.length > 0 ? (
        <View pointerEvents="box-none" style={styles.toastLayer}>
          {toasts.map((toast) => (
            <Toast key={toast.id} toast={toast} onDismiss={dismissToast} />
          ))}
        </View>
      ) : null}

      <Modal visible={!!confirm} transparent animationType="fade" onRequestClose={() => closeConfirm(false)}>
        <View style={styles.confirmBackdrop}>
          <View style={styles.confirmCard}>
            <Text style={styles.confirmTitle}>{confirm?.title}</Text>
            {confirm?.message ? <Text style={styles.confirmMessage}>{confirm.message}</Text> : null}
            <View style={styles.confirmActions}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => closeConfirm(false)}>
                <Text style={styles.cancelButtonText}>{confirm?.cancelLabel}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmButton} onPress={() => closeConfirm(true)}>
                <Text style={styles.confirmButtonText}>{confirm?.confirmLabel}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  toastLayer: {
    position: 'absolute',
    top: Platform.OS === 'web' ? 16 : 54,
    left: 16,
    right: 16,
    alignItems: 'center',
    gap: 8,
    zIndex: 9999,
    ...(Platform.OS === 'web' ? { pointerEvents: 'none' } : null),
  },
  toast: {
    width: '100%',
    maxWidth: 440,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e3dfd2',
    borderRadius: 8,
    padding: 13,
    marginBottom: 8,
    ...(Platform.OS === 'web'
      ? { boxShadow: '0 10px 30px rgba(0, 0, 0, 0.14)', pointerEvents: 'auto' }
      : {
          shadowColor: '#000',
          shadowOpacity: 0.14,
          shadowRadius: 14,
          shadowOffset: { width: 0, height: 6 },
          elevation: 7,
        }),
  },
  toastIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#18201d',
    alignItems: 'center',
    justifyContent: 'center',
  },
  toastCopy: {
    flex: 1,
    minWidth: 0,
  },
  toastTitle: {
    color: '#111',
    fontWeight: '900',
    fontSize: 14,
  },
  toastMessage: {
    color: '#4d504b',
    lineHeight: 19,
    marginTop: 2,
    fontSize: 13,
  },
  toastClose: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.42)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  confirmCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e3dfd2',
    padding: 18,
  },
  confirmTitle: {
    color: '#111',
    fontSize: 18,
    fontWeight: '900',
  },
  confirmMessage: {
    color: '#4d504b',
    lineHeight: 21,
    marginTop: 8,
  },
  confirmActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 18,
  },
  cancelButton: {
    minHeight: 44,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d9d5ca',
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  cancelButtonText: {
    color: '#111',
    fontWeight: '800',
  },
  confirmButton: {
    minHeight: 44,
    borderRadius: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#111',
  },
  confirmButtonText: {
    color: '#fff',
    fontWeight: '900',
  },
});

export default NotifyHost;
