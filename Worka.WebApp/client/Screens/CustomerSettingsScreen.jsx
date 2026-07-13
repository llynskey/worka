import React, { useState } from 'react';
import { ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const CustomerSettingsScreen = ({ navigation }) => {
  const [quoteAlerts, setQuoteAlerts] = useState(true);
  const [bookingAlerts, setBookingAlerts] = useState(true);

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.headerCard}>
        <MaterialCommunityIcons name="cog-outline" size={34} color="#111" />
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Customer settings</Text>
          <Text style={styles.subtitle}>Tune marketplace alerts and account access.</Text>
        </View>
      </View>

      <View style={styles.card}>
        <View style={styles.settingRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.settingTitle}>Quote alerts</Text>
            <Text style={styles.settingText}>Notify me when a professional sends a quote.</Text>
          </View>
          <Switch value={quoteAlerts} onValueChange={setQuoteAlerts} />
        </View>
        <View style={styles.divider} />
        <View style={styles.settingRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.settingTitle}>Booking updates</Text>
            <Text style={styles.settingText}>Notify me when a job changes status.</Text>
          </View>
          <Switch value={bookingAlerts} onValueChange={setBookingAlerts} />
        </View>
      </View>

      <TouchableOpacity style={styles.linkCard} onPress={() => navigation.navigate('Account')}>
        <MaterialCommunityIcons name="account-edit-outline" size={24} color="#111" />
        <Text style={styles.linkText}>Manage account details</Text>
        <MaterialCommunityIcons name="chevron-right" size={24} color="#111" />
      </TouchableOpacity>

      <View style={styles.card}>
        <Text style={styles.settingTitle}>Support</Text>
        <Text style={styles.settingText}>support@worka.local</Text>
        <Text style={styles.settingText}>Typical response time: one business day.</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  content: {
    padding: 16,
    paddingBottom: 96,
    backgroundColor: '#f7f5ef',
    flexGrow: 1,
  },
  headerCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e3dfd2',
    padding: 16,
    flexDirection: 'row',
    gap: 12,
    marginBottom: 14,
  },
  title: {
    color: '#111',
    fontSize: 22,
    fontWeight: '900',
  },
  subtitle: {
    color: '#62645c',
    lineHeight: 20,
    marginTop: 4,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e3dfd2',
    padding: 14,
    marginBottom: 14,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingTitle: {
    color: '#111',
    fontSize: 16,
    fontWeight: '900',
  },
  settingText: {
    color: '#62645c',
    lineHeight: 20,
    marginTop: 4,
  },
  divider: {
    height: 1,
    backgroundColor: '#ece7dc',
    marginVertical: 14,
  },
  linkCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e3dfd2',
    padding: 14,
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  linkText: {
    flex: 1,
    color: '#111',
    fontWeight: '900',
  },
});

export default CustomerSettingsScreen;
