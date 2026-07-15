import React, { useMemo, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

/**
 * Brand-styled select. Renders an input-like trigger that opens a modal
 * with a search box and the option list — easy to scan today and it keeps
 * working as the option lists grow (currencies, languages, ...).
 *
 * Props:
 *  - options: [{ value, label, description? }]
 *  - value: selected value (string) or CSV string when multiple
 *  - onChange(nextValue)
 *  - label: field label above the trigger (optional)
 *  - placeholder: trigger text when nothing selected
 *  - searchPlaceholder: text for the search input
 *  - multiple: allow selecting many (value is a CSV string)
 *  - compact: small pill trigger (for headers/toolbars)
 *  - allowClear + clearLabel: optional "any/none" row at the top
 */
const SelectField = ({
  options = [],
  value,
  onChange,
  label,
  placeholder = 'Select…',
  searchPlaceholder = 'Search…',
  multiple = false,
  compact = false,
  allowClear = false,
  clearLabel = '—',
  icon = 'chevron-down',
}) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const selectedValues = useMemo(() => {
    if (multiple) {
      return new Set(
        String(value ?? '')
          .split(',')
          .map((item) => item.trim().toLowerCase())
          .filter(Boolean)
      );
    }
    return new Set(value ? [String(value)] : []);
  }, [multiple, value]);

  const selectedLabels = options
    .filter((option) => selectedValues.has(String(option.value)))
    .map((option) => option.label);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return options;
    return options.filter(
      (option) =>
        option.label.toLowerCase().includes(term) ||
        String(option.value).toLowerCase().includes(term) ||
        (option.description ?? '').toLowerCase().includes(term)
    );
  }, [options, query]);

  const pick = (option) => {
    if (multiple) {
      const next = new Set(selectedValues);
      const key = String(option.value);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      onChange?.(Array.from(next).join(','));
      return;
    }

    onChange?.(option.value);
    close();
  };

  const clear = () => {
    onChange?.(multiple ? '' : '');
    close();
  };

  const close = () => {
    setOpen(false);
    setQuery('');
  };

  const triggerText =
    selectedLabels.length > 0
      ? multiple
        ? selectedLabels.join(', ')
        : selectedLabels[0]
      : placeholder;

  return (
    <View style={compact ? null : styles.wrap}>
      {label && !compact ? <Text style={styles.label}>{label}</Text> : null}

      <TouchableOpacity
        style={compact ? styles.compactTrigger : styles.trigger}
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={label || placeholder}
      >
        <Text
          style={[
            compact ? styles.compactTriggerText : styles.triggerText,
            selectedLabels.length === 0 && styles.triggerPlaceholder,
          ]}
          numberOfLines={1}
        >
          {triggerText}
        </Text>
        <MaterialCommunityIcons name={icon} size={compact ? 16 : 20} color="#62645c" />
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="fade" onRequestClose={close}>
        <KeyboardAvoidingView
          style={styles.backdrop}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.sheet}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle} numberOfLines={1}>
                {label || placeholder}
              </Text>
              <TouchableOpacity
                style={styles.closeButton}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                onPress={close}
              >
                <MaterialCommunityIcons name="close" size={20} color="#111" />
              </TouchableOpacity>
            </View>

            {options.length > 5 ? (
              <View style={styles.searchBox}>
                <MaterialCommunityIcons name="magnify" size={18} color="#62645c" />
                <TextInput
                  style={styles.searchInput}
                  value={query}
                  onChangeText={setQuery}
                  placeholder={searchPlaceholder}
                  placeholderTextColor="#686b64"
                  autoCorrect={false}
                  autoCapitalize="none"
                />
              </View>
            ) : null}

            <FlatList
              data={filtered}
              keyExtractor={(item) => String(item.value)}
              style={styles.list}
              keyboardShouldPersistTaps="handled"
              ListHeaderComponent={
                allowClear ? (
                  <TouchableOpacity style={styles.option} onPress={clear}>
                    <Text style={[styles.optionLabel, styles.optionMuted]}>{clearLabel}</Text>
                    {selectedLabels.length === 0 ? (
                      <MaterialCommunityIcons name="check" size={18} color="#24513b" />
                    ) : null}
                  </TouchableOpacity>
                ) : null
              }
              renderItem={({ item }) => {
                const active = selectedValues.has(String(item.value));
                return (
                  <TouchableOpacity
                    style={[styles.option, active && styles.optionActive]}
                    onPress={() => pick(item)}
                  >
                    <View style={styles.optionCopy}>
                      <Text style={[styles.optionLabel, active && styles.optionLabelActive]}>
                        {item.label}
                      </Text>
                      {item.description ? (
                        <Text style={styles.optionDescription}>{item.description}</Text>
                      ) : null}
                    </View>
                    {active ? (
                      <MaterialCommunityIcons
                        name={multiple ? 'checkbox-marked' : 'check'}
                        size={18}
                        color="#24513b"
                      />
                    ) : multiple ? (
                      <MaterialCommunityIcons name="checkbox-blank-outline" size={18} color="#c9c4b6" />
                    ) : null}
                  </TouchableOpacity>
                );
              }}
              ListEmptyComponent={<Text style={styles.emptyText}>{searchPlaceholder}</Text>}
            />

            {multiple ? (
              <TouchableOpacity style={styles.doneButton} onPress={close}>
                <Text style={styles.doneButtonText}>OK</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
  trigger: {
    minHeight: 50,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#d9d5ca',
    borderRadius: 8,
    paddingHorizontal: 13,
    backgroundColor: '#fbfaf6',
  },
  triggerText: {
    flex: 1,
    minWidth: 0,
    color: '#111',
    fontSize: 16,
    fontWeight: '600',
  },
  triggerPlaceholder: {
    color: '#686b64',
    fontWeight: '500',
  },
  compactTrigger: {
    minHeight: 38,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderWidth: 1,
    borderColor: '#d9d5ca',
    borderRadius: 999,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
  },
  compactTriggerText: {
    color: '#111',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.4,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.42)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  sheet: {
    width: '100%',
    maxWidth: 440,
    maxHeight: '80%',
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e3dfd2',
    padding: 16,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 12,
  },
  sheetTitle: {
    flex: 1,
    color: '#111',
    fontSize: 18,
    fontWeight: '900',
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e3dfd2',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  searchBox: {
    minHeight: 46,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#d9d5ca',
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: '#fbfaf6',
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    minWidth: 0,
    fontSize: 15,
    color: '#111',
    paddingVertical: 10,
  },
  list: {
    flexGrow: 0,
  },
  option: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 10,
    paddingVertical: 9,
    borderRadius: 8,
  },
  optionActive: {
    backgroundColor: '#f2f7f0',
  },
  optionCopy: {
    flex: 1,
    minWidth: 0,
  },
  optionLabel: {
    color: '#111',
    fontSize: 15,
    fontWeight: '700',
  },
  optionLabelActive: {
    fontWeight: '900',
  },
  optionMuted: {
    color: '#62645c',
    fontWeight: '600',
  },
  optionDescription: {
    color: '#62645c',
    fontSize: 12,
    marginTop: 2,
  },
  emptyText: {
    color: '#62645c',
    textAlign: 'center',
    paddingVertical: 18,
  },
  doneButton: {
    minHeight: 46,
    marginTop: 10,
    backgroundColor: '#111',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneButtonText: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 15,
  },
});

export default SelectField;
