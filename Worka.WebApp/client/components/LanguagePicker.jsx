import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SPOKEN_LANGUAGES } from '../i18n/spokenLanguages';

const parseCsv = (value) =>
  new Set(
    String(value ?? '')
      .split(',')
      .map((code) => code.trim().toLowerCase())
      .filter(Boolean)
  );

const LanguagePicker = ({ value, onChange, label = 'Languages you speak' }) => {
  const selected = parseCsv(value);

  const toggle = (code) => {
    const next = new Set(selected);
    if (next.has(code)) {
      next.delete(code);
    } else {
      next.add(code);
    }
    onChange?.(Array.from(next).join(','));
  };

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.chipRow}>
        {SPOKEN_LANGUAGES.map((language) => {
          const active = selected.has(language.code);
          return (
            <TouchableOpacity
              key={language.code}
              style={[styles.chip, active && styles.chipActive]}
              onPress={() => toggle(language.code)}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{language.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    marginBottom: 12,
  },
  label: {
    color: '#111',
    fontWeight: '900',
    fontSize: 14,
    marginBottom: 8,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    minHeight: 40,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e3dfd2',
    borderRadius: 999,
    paddingHorizontal: 14,
    backgroundColor: '#fbfaf6',
  },
  chipActive: {
    backgroundColor: '#111',
    borderColor: '#111',
  },
  chipText: {
    color: '#111',
    fontWeight: '800',
    fontSize: 13,
  },
  chipTextActive: {
    color: '#fff',
  },
});

export default LanguagePicker;
