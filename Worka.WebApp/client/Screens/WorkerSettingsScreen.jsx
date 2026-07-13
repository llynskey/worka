import React, { useState } from 'react';
import { ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const WorkerSettingsScreen = ({ navigation }) => {
  const [jobAlerts, setJobAlerts] = useState(true);
  const [bidAlerts, setBidAlerts] = useState(true);
  const [available, setAvailable] = useState(true);

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.headerCard}>
        <MaterialCommunityIcons name="cog-outline" size={34} color="#111" />
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Professional settings</Text>
          <Text style={styles.subtitle}>Control how Worka surfaces jobs and bid updates.</Text>
        </View>
      </View>

      <View style={styles.card}>
        <View style={styles.settingRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.settingTitle}>Available for work</Text>
            <Text style={styles.settingText}>Show new job opportunities in your marketplace feed.</Text>
          </View>
          <Switch value={available} onValueChange={setAvailable} />
        </View>
        <View style={styles.divider} />
        <View style={styles.settingRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.settingTitle}>Job alerts</Text>
            <Text style={styles.settingText}>Notify me when new customer requests are posted.</Text>
          </View>
          <Switch value={jobAlerts} onValueChange={setJobAlerts} />
        </View>
        <View style={styles.divider} />
        <View style={styles.settingRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.settingTitle}>Bid updates</Text>
            <Text style={styles.settingText}>Notify me when a customer accepts or closes a quote.</Text>
          </View>
          <Switch value={bidAlerts} onValueChange={setBidAlerts} />
        </View>
      </View>

      <TouchableOpacity style={styles.linkCard} onPress={() => navigation.navigate('Account')}>
        <MaterialCommunityIcons name="account-hard-hat-outline" size={24} color="#111" />
        <Text style={styles.linkText}>Manage professional profile</Text>
        <MaterialCommunityIcons name="chevron-right" size={24} color="#111" />
      </TouchableOpacity>

      <View style={styles.card}>
        <Text style={styles.settingTitle}>Support</Text>
        <Text style={styles.settingText}>pros@worka.local</Text>
        <Text style={styles.settingText}>For urgent bid issues, include the job title and quote amount.</Text>
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

export default WorkerSettingsScreen;
