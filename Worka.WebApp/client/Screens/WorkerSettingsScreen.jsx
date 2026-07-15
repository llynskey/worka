import React, { useContext, useEffect, useState } from 'react';
import { ActivityIndicator, Linking, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthContext } from '../auth/AuthContext';
import { api, getErrorMessage } from '../api/workaApi';
import notify, { confirmAction } from '../Utils/notify';
import { useI18n } from '../i18n/I18nContext';

const WorkerSettingsScreen = ({ navigation }) => {
  const [jobAlerts, setJobAlerts] = useState(true);
  const [bidAlerts, setBidAlerts] = useState(true);
  const [available, setAvailable] = useState(true);


  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleting, setDeleting] = useState(false);
  const { signOut } = useContext(AuthContext);

  // Persist notification preferences locally so choices survive restarts.
  useEffect(() => {
    AsyncStorage.getItem('worka.settings.worker')
      .then((raw) => {
        if (!raw) return;
        const saved = JSON.parse(raw);
        if (typeof saved.jobAlerts === 'boolean') setJobAlerts(saved.jobAlerts);
        if (typeof saved.bidAlerts === 'boolean') setBidAlerts(saved.bidAlerts);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    AsyncStorage.setItem('worka.settings.worker', JSON.stringify({ jobAlerts, bidAlerts })).catch(() => {});
  }, [jobAlerts, bidAlerts]);

  const { t, language, languages, setLanguage } = useI18n();

  const changePassword = async () => {
    if (newPassword.length < 6) {
      notify('Password too short', 'Use at least 6 characters.');
      return;
    }

    try {
      setChangingPassword(true);
      await api.post('/account/changePassword', { currentPassword, newPassword });
      setCurrentPassword('');
      setNewPassword('');
      notify('Password updated', 'Use your new password next time you log in.');
    } catch (error) {
      notify('Could not change password', getErrorMessage(error));
    } finally {
      setChangingPassword(false);
    }
  };

  const deleteAccount = async () => {
    if (!deletePassword) {
      notify('Password needed', 'Enter your password to confirm deletion.');
      return;
    }

    const confirmed = await confirmAction(
      'Delete your account?',
      'Your profile, jobs, and quotes will be permanently removed. This cannot be undone.',
      'Delete forever'
    );
    if (!confirmed) return;

    try {
      setDeleting(true);
      await api.delete('/account', { data: { password: deletePassword } });
      notify('Account deleted', 'Sorry to see you go.');
      await signOut();
    } catch (error) {
      notify('Could not delete account', getErrorMessage(error));
    } finally {
      setDeleting(false);
    }
  };

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
        <Text style={styles.settingTitle}>{t('settings.language')}</Text>
        <Text style={styles.settingText}>{t('settings.languageHint')}</Text>
        <View style={styles.languageRow}>
          {languages.map((lang) => {
            const active = lang.code === language;
            return (
              <TouchableOpacity
                key={lang.code}
                style={[styles.languageChip, active && styles.languageChipActive]}
                onPress={() => setLanguage(lang.code)}
              >
                <Text style={[styles.languageChipText, active && styles.languageChipTextActive]}>
                  {lang.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.settingTitle}>Change password</Text>
        <TextInput
          style={styles.securityInput}
          value={currentPassword}
          onChangeText={setCurrentPassword}
          placeholder="Current password"
          placeholderTextColor="#686b64"
          secureTextEntry
          autoCapitalize="none"
        />
        <TextInput
          style={styles.securityInput}
          value={newPassword}
          onChangeText={setNewPassword}
          placeholder="New password (min 6 characters)"
          placeholderTextColor="#686b64"
          secureTextEntry
          autoCapitalize="none"
        />
        <TouchableOpacity style={styles.securityButton} onPress={changePassword} disabled={changingPassword}>
          {changingPassword ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.securityButtonText}>Update password</Text>
          )}
        </TouchableOpacity>
      </View>

      <View style={[styles.card, styles.dangerCard]}>
        <Text style={styles.settingTitle}>Delete account</Text>
        <Text style={styles.settingText}>
          Permanently removes your account and all associated data. This cannot be undone.
        </Text>
        <TextInput
          style={styles.securityInput}
          value={deletePassword}
          onChangeText={setDeletePassword}
          placeholder="Confirm with your password"
          placeholderTextColor="#686b64"
          secureTextEntry
          autoCapitalize="none"
        />
        <TouchableOpacity style={styles.dangerButton} onPress={deleteAccount} disabled={deleting}>
          {deleting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.securityButtonText}>Delete my account</Text>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <Text style={styles.settingTitle}>Support</Text>
        <Text style={styles.settingText}>pros@worka.site</Text>
        <Text style={styles.settingText}>For urgent bid issues, include the job title and quote amount.</Text>
        <View style={styles.legalLinksRow}>
          <TouchableOpacity onPress={() => Linking.openURL('https://worka.site/privacy.html')}>
            <Text style={styles.legalLink}>Privacy Policy</Text>
          </TouchableOpacity>
          <Text style={styles.settingText}>·</Text>
          <TouchableOpacity onPress={() => Linking.openURL('https://worka.site/terms.html')}>
            <Text style={styles.legalLink}>Terms of Service</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.operatedByText}>
          Worka is operated by Lynskey Software Limited (Company No. 17337667).
        </Text>
      </View>

      <TouchableOpacity style={styles.signOutButton} onPress={signOut}>
        <MaterialCommunityIcons name="logout" size={19} color="#111" />
        <Text style={styles.signOutText}>Sign out</Text>
      </TouchableOpacity>

      <Text style={styles.versionText}>Worka v1.0.0</Text>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  legalLinksRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
  },
  legalLink: {
    color: '#111',
    fontSize: 13,
    fontWeight: '800',
    textDecorationLine: 'underline',
  },
  operatedByText: {
    marginTop: 10,
    color: '#a9aba2',
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '600',
  },
  signOutButton: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#111',
    borderRadius: 8,
    backgroundColor: '#fff',
    marginBottom: 14,
  },
  signOutText: {
    color: '#111',
    fontWeight: '900',
    fontSize: 15,
  },
  versionText: {
    textAlign: 'center',
    color: '#8a8d84',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 8,
  },
  languageRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  languageChip: {
    minHeight: 40,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e3dfd2',
    borderRadius: 999,
    paddingHorizontal: 14,
    backgroundColor: '#fbfaf6',
  },
  languageChipActive: {
    backgroundColor: '#111',
    borderColor: '#111',
  },
  languageChipText: {
    color: '#111',
    fontWeight: '800',
    fontSize: 13,
  },
  languageChipTextActive: {
    color: '#fff',
  },
  securityInput: {
    minHeight: 50,
    borderWidth: 1,
    borderColor: '#d9d5ca',
    borderRadius: 8,
    paddingHorizontal: 13,
    paddingVertical: 12,
    marginTop: 12,
    backgroundColor: '#fbfaf6',
    fontSize: 16,
  },
  securityButton: {
    minHeight: 48,
    marginTop: 12,
    backgroundColor: '#111',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  securityButtonText: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 15,
  },
  dangerCard: {
    borderColor: '#d9b8b8',
  },
  dangerButton: {
    minHeight: 48,
    marginTop: 12,
    backgroundColor: '#8c2f2f',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: 16,
    paddingBottom: 96,
    backgroundColor: '#f7f5ef',
    flexGrow: 1,
    width: '100%',
    maxWidth: 720,
    alignSelf: 'center',
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
