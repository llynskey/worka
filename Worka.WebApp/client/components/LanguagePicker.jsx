import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SPOKEN_LANGUAGES, languageLabel } from '../i18n/spokenLanguages';
import SelectField from './SelectField';

const parseCsv = (value) =>
  String(value ?? '')
    .split(',')
    .map((code) => code.trim().toLowerCase())
    .filter(Boolean);

/**
 * Searchable multi-select for spoken languages. Stores a CSV of codes,
 * shows the selected languages as quiet chips under the field.
 */
const LanguagePicker = ({ value, onChange, label = 'Languages you speak' }) => {
  const selected = parseCsv(value);

  return (
    <View style={styles.wrap}>
      <SelectField
        label={label}
        options={SPOKEN_LANGUAGES.map((language) => ({
          value: language.code,
          label: language.label,
        }))}
        value={value}
        onChange={onChange}
        multiple
        placeholder={label}
        searchPlaceholder="Search…"
      />
      {selected.length > 0 ? (
        <View style={styles.chipRow}>
          {selected.map((code) => (
            <View key={code} style={styles.chip}>
              <Text style={styles.chipText}>{languageLabel(code)}</Text>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    marginBottom: 12,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: -4,
    marginBottom: 4,
  },
  chip: {
    borderWidth: 1,
    borderColor: '#e3dfd2',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: '#fbfaf6',
  },
  chipText: {
    color: '#62645c',
    fontSize: 12,
    fontWeight: '800',
  },
});

export default LanguagePicker;
