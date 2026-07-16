import React from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

/**
 * Reusable search + filter-chips + sort controls for record lists, so screens
 * stay usable with large numbers of jobs/pros. All parts are optional — pass
 * only what a screen needs. Renders as one card above a FlatList; works on
 * desktop and mobile (chip rows scroll horizontally when they overflow).
 */
const Chip = ({ label, active, onPress }) => (
  <TouchableOpacity onPress={onPress} style={[styles.chip, active && styles.chipActive]} activeOpacity={0.8}>
    <Text style={[styles.chipText, active && styles.chipTextActive]} numberOfLines={1}>
      {label}
    </Text>
  </TouchableOpacity>
);

const ListControls = ({
  search,
  onSearch,
  searchPlaceholder,
  categories = [],
  selectedCategory = null,
  onSelectCategory,
  allLabel = 'All',
  languages = [],
  selectedLanguage = null,
  onSelectLanguage,
  languageLabel = 'Language',
  languageAllLabel = 'All',
  sorts = [],
  sortValue,
  onSort,
  sortLabel = 'Sort',
  countLabel,
  viewMode,
  onViewMode,
}) => (
  <View style={styles.wrap}>
    <View style={styles.searchRow}>
      <MaterialCommunityIcons name="magnify" size={20} color="#62645c" />
      <TextInput
        style={styles.searchInput}
        value={search}
        onChangeText={onSearch}
        placeholder={searchPlaceholder}
        placeholderTextColor="#8a8d84"
        returnKeyType="search"
        autoCorrect={false}
      />
      {search ? (
        <TouchableOpacity onPress={() => onSearch('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <MaterialCommunityIcons name="close-circle" size={18} color="#8a8d84" />
        </TouchableOpacity>
      ) : null}
    </View>

    {categories.length > 0 ? (
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
        <Chip label={allLabel} active={!selectedCategory} onPress={() => onSelectCategory?.(null)} />
        {categories.map((c) => (
          <Chip
            key={c.value}
            label={c.label}
            active={selectedCategory === c.value}
            onPress={() => onSelectCategory?.(c.value)}
          />
        ))}
      </ScrollView>
    ) : null}

    {languages.length > 0 ? (
      <View style={styles.sortRow}>
        <Text style={styles.sortLabel}>{languageLabel}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
          <Chip label={languageAllLabel} active={!selectedLanguage} onPress={() => onSelectLanguage?.(null)} />
          {languages.map((l) => (
            <Chip
              key={l.value}
              label={l.label}
              active={selectedLanguage === l.value}
              onPress={() => onSelectLanguage?.(l.value)}
            />
          ))}
        </ScrollView>
      </View>
    ) : null}

    {sorts.length > 0 ? (
      <View style={styles.sortRow}>
        <Text style={styles.sortLabel}>{sortLabel}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
          {sorts.map((s) => (
            <Chip key={s.value} label={s.label} active={sortValue === s.value} onPress={() => onSort?.(s.value)} />
          ))}
        </ScrollView>
      </View>
    ) : null}

    {countLabel || onViewMode ? (
      <View style={styles.footerRow}>
        <Text style={styles.count}>{countLabel || ''}</Text>
        {onViewMode ? (
          <View style={styles.viewToggle}>
            <TouchableOpacity
              onPress={() => onViewMode('list')}
              style={[styles.viewBtn, viewMode === 'list' && styles.viewBtnActive]}
              accessibilityLabel="List view"
            >
              <MaterialCommunityIcons name="view-agenda-outline" size={18} color={viewMode === 'list' ? '#fff' : '#111'} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => onViewMode('grid')}
              style={[styles.viewBtn, viewMode === 'grid' && styles.viewBtnActive]}
              accessibilityLabel="Grid view"
            >
              <MaterialCommunityIcons name="view-grid-outline" size={18} color={viewMode === 'grid' ? '#fff' : '#111'} />
            </TouchableOpacity>
          </View>
        ) : null}
      </View>
    ) : null}
  </View>
);

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e3dfd2',
    borderRadius: 8,
    padding: 12,
    marginBottom: 14,
    gap: 10,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#d9d5ca',
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: '#fbfaf6',
    minHeight: 44,
  },
  searchInput: {
    flex: 1,
    minWidth: 0,
    color: '#111',
    fontSize: 15,
    paddingVertical: 10,
    ...(typeof document !== 'undefined' ? { outlineStyle: 'none' } : null),
  },
  chipRow: {
    flexDirection: 'row',
    gap: 8,
    paddingRight: 4,
  },
  chip: {
    minHeight: 34,
    borderWidth: 1,
    borderColor: '#e3dfd2',
    borderRadius: 999,
    paddingHorizontal: 13,
    justifyContent: 'center',
    backgroundColor: '#fff',
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
  sortRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sortLabel: {
    color: '#62645c',
    fontWeight: '800',
    fontSize: 13,
  },
  count: {
    color: '#62645c',
    fontWeight: '700',
    fontSize: 13,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  viewToggle: {
    flexDirection: 'row',
    gap: 6,
  },
  viewBtn: {
    width: 34,
    height: 30,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: '#e3dfd2',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  viewBtnActive: {
    backgroundColor: '#111',
    borderColor: '#111',
  },
});

export default ListControls;
