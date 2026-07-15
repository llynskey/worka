import React from 'react';
import { Image, Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

/**
 * Full-screen photo viewer. Tap anywhere outside the image (or the close
 * button) to dismiss.
 */
const PhotoLightbox = ({ uri, label = '', onClose }) => (
  <Modal visible={!!uri} transparent animationType="fade" onRequestClose={onClose}>
    <Pressable style={styles.backdrop} onPress={onClose}>
      {uri ? (
        <Image source={{ uri }} style={styles.image} resizeMode="contain" />
      ) : null}

      <TouchableOpacity
        style={styles.closeButton}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        onPress={onClose}
      >
        <MaterialCommunityIcons name="close" size={24} color="#fff" />
      </TouchableOpacity>

      {label ? (
        <View style={styles.labelWrap} pointerEvents="none">
          <Text style={styles.labelText} numberOfLines={2}>
            {label}
          </Text>
        </View>
      ) : null}
    </Pressable>
  </Modal>
);

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: '100%',
    height: '86%',
  },
  closeButton: {
    position: 'absolute',
    top: 18,
    right: 18,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  labelWrap: {
    position: 'absolute',
    bottom: 26,
    left: 20,
    right: 20,
    alignItems: 'center',
  },
  labelText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 14,
    textAlign: 'center',
  },
});

export default PhotoLightbox;
