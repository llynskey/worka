import React, { useContext, useEffect, useState } from 'react';
import { ActivityIndicator, Linking, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthContext } from '../auth/AuthContext';
import { api, getErrorMessage } from '../api/workaApi';
import notify, { confirmAction } from '../Utils/notify';
import AppFooter from '../components/AppFooter';
import SelectField from '../components/SelectField';
import PaymentsPanel from '../components/PaymentsPanel';
import { useI18n } from '../i18n/I18nContext';
import { useLayout } from '../Utils/theme';

const CustomerSettingsScreen = ({ navigation }) => {
  const { isDesktop } = useLayout();
  const [quoteAlerts, setQuoteAlerts] = useState(true);
  const [bookingAlerts, setBookingAlerts] = useState(true);


  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const { signOut } = useContext(AuthContext);
  const seedEnabled = process.env.EXPO_PUBLIC_ALLOW_SEED === 'true';

  const seedSampleData = async () => {
    try {
      setSeeding(true);
      const res = await api.post('/api/dev/seed');
      notify(t('dev.seededTitle'), res?.data?.data || t('dev.seededText'));
    } catch (error) {
      notify(t('dev.errorTitle'), getErrorMessage(error, t('common.tryAgain')));
    } finally {
      setSeeding(false);
    }
  };

  // Persist notification preferences locally so choices survive restarts.
  useEffect(() => {
    AsyncStorage.getItem('worka.settings.customer')
      .then((raw) => {
        if (!raw) return;
        const saved = JSON.parse(raw);
        if (typeof saved.quoteAlerts === 'boolean') setQuoteAlerts(saved.quoteAlerts);
        if (typeof saved.bookingAlerts === 'boolean') setBookingAlerts(saved.bookingAlerts);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    AsyncStorage.setItem('worka.settings.customer', JSON.stringify({ quoteAlerts, bookingAlerts })).catch(() => {});
  }, [quoteAlerts, bookingAlerts]);

  const { t, language, languages, setLanguage } = useI18n();

  const changePassword = async () => {
    if (newPassword.length < 6) {
      notify(t('settings.passwordShortTitle'), t('settings.passwordShortText'));
      return;
    }

    try {
      setChangingPassword(true);
      await api.post('/account/changePassword', { currentPassword, newPassword });
      setCurrentPassword('');
      setNewPassword('');
      notify(t('settings.passwordUpdatedTitle'), t('settings.passwordUpdatedText'));
    } catch (error) {
      notify(t('settings.passwordErrorTitle'), getErrorMessage(error));
    } finally {
      setChangingPassword(false);
    }
  };

  const deleteAccount = async () => {
    if (!deletePassword) {
      notify(t('settings.passwordNeededTitle'), t('settings.passwordNeededText'));
      return;
    }

    const confirmed = await confirmAction(
      t('settings.deleteConfirmTitle'),
      t('settings.deleteConfirmText'),
      t('settings.deleteForever'),
      t('common.cancel')
    );
    if (!confirmed) return;

    try {
      setDeleting(true);
      await api.delete('/account', { data: { password: deletePassword } });
      notify(t('settings.deletedTitle'), t('settings.deletedText'));
      await signOut();
    } catch (error) {
      notify(t('settings.deleteErrorTitle'), getErrorMessage(error));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={[styles.content, isDesktop && styles.contentWide]}>
      <View style={styles.headerCard}>
        <MaterialCommunityIcons name="cog-outline" size={34} color="#111" />
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{t('settings.customerTitle')}</Text>
          <Text style={styles.subtitle}>{t('settings.customerSubtitle')}</Text>
        </View>
      </View>

      {seedEnabled ? (
        <View style={styles.card}>
          <Text style={styles.settingTitle}>{t('dev.title')}</Text>
          <Text style={styles.settingText}>{t('dev.seedHint')}</Text>
          <TouchableOpacity style={styles.securityButton} onPress={seedSampleData} disabled={seeding}>
            {seeding ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.securityButtonText}>{t('dev.seed')}</Text>
            )}
          </TouchableOpacity>
        </View>
      ) : null}

      <PaymentsPanel mode="history" />

      <View style={isDesktop ? styles.cardsRow : undefined}>
      <View style={[styles.card, isDesktop && styles.cardHalf]}>
        <View style={styles.settingRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.settingTitle}>{t('settings.quoteAlerts')}</Text>
            <Text style={styles.settingText}>{t('settings.quoteAlertsText')}</Text>
          </View>
          <Switch value={quoteAlerts} onValueChange={setQuoteAlerts} />
        </View>
        <View style={styles.divider} />
        <View style={styles.settingRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.settingTitle}>{t('settings.bookingUpdates')}</Text>
            <Text style={styles.settingText}>{t('settings.bookingUpdatesText')}</Text>
          </View>
          <Switch value={bookingAlerts} onValueChange={setBookingAlerts} />
        </View>
      </View>

      <TouchableOpacity style={[styles.linkCard, isDesktop && styles.cardHalf]} onPress={() => navigation.navigate('Account')}>
        <MaterialCommunityIcons name="account-edit-outline" size={24} color="#111" />
        <Text style={styles.linkText}>{t('settings.manageAccount')}</Text>
        <MaterialCommunityIcons name="chevron-right" size={24} color="#111" />
      </TouchableOpacity>



      <View style={[styles.card, isDesktop && styles.cardHalf]}>
        <Text style={styles.settingTitle}>{t('settings.language')}</Text>
        <Text style={styles.settingText}>{t('settings.languageHint')}</Text>
        <View style={styles.languageSelect}>
          <SelectField
            options={languages.map((lang) => ({ value: lang.code, label: lang.label }))}
            value={language}
            onChange={setLanguage}
            placeholder={t('settings.language')}
            searchPlaceholder={t('common.search')}
          />
        </View>
      </View>

      <View style={[styles.card, isDesktop && styles.cardHalf]}>
        <Text style={styles.settingTitle}>{t('settings.changePassword')}</Text>
        <TextInput
          style={styles.securityInput}
          value={currentPassword}
          onChangeText={setCurrentPassword}
          placeholder={t('settings.currentPassword')}
          placeholderTextColor="#686b64"
          secureTextEntry
          autoCapitalize="none"
        />
        <TextInput
          style={styles.securityInput}
          value={newPassword}
          onChangeText={setNewPassword}
          placeholder={t('settings.newPassword')}
          placeholderTextColor="#686b64"
          secureTextEntry
          autoCapitalize="none"
        />
        <TouchableOpacity style={styles.securityButton} onPress={changePassword} disabled={changingPassword}>
          {changingPassword ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.securityButtonText}>{t('settings.updatePassword')}</Text>
          )}
        </TouchableOpacity>
      </View>

      <View style={[styles.card, styles.dangerCard, isDesktop && styles.cardHalf]}>
        <Text style={styles.settingTitle}>{t('settings.deleteAccount')}</Text>
        <Text style={styles.settingText}>{t('settings.deleteAccountText')}</Text>
        <TextInput
          style={styles.securityInput}
          value={deletePassword}
          onChangeText={setDeletePassword}
          placeholder={t('settings.confirmPassword')}
          placeholderTextColor="#686b64"
          secureTextEntry
          autoCapitalize="none"
        />
        <TouchableOpacity style={styles.dangerButton} onPress={deleteAccount} disabled={deleting}>
          {deleting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.securityButtonText}>{t('settings.deleteMyAccount')}</Text>
          )}
        </TouchableOpacity>
      </View>

      <View style={[styles.card, isDesktop && styles.cardHalf]}>
        <Text style={styles.settingTitle}>{t('settings.support')}</Text>
        <Text style={styles.settingText}>support@fixa.site</Text>
        <Text style={styles.settingText}>{t('settings.supportResponse')}</Text>
        <View style={styles.legalLinksRow}>
          <TouchableOpacity onPress={() => Linking.openURL('https://fixa.site/privacy.html')}>
            <Text style={styles.legalLink}>{t('settings.privacyPolicy')}</Text>
          </TouchableOpacity>
          <Text style={styles.settingText}>·</Text>
          <TouchableOpacity onPress={() => Linking.openURL('https://fixa.site/terms.html')}>
            <Text style={styles.legalLink}>{t('settings.terms')}</Text>
          </TouchableOpacity>
        </View>
      </View>
      </View>

      <TouchableOpacity style={styles.signOutButton} onPress={signOut}>
        <MaterialCommunityIcons name="logout" size={19} color="#111" />
        <Text style={styles.signOutText}>{t('common.signOut')}</Text>
      </TouchableOpacity>

      <Text style={styles.versionText}>Fixa v1.0.0</Text>

      <AppFooter />
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
    color: '#8a8d84',
    fontSize: 12,
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
  languageSelect: {
    marginTop: 12,
    marginBottom: -12,
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
    paddingBottom: 28,
    backgroundColor: '#f7f5ef',
    flexGrow: 1,
    width: '100%',
    maxWidth: 720,
    alignSelf: 'center',
  },
  contentWide: {
    maxWidth: 1000,
  },
  cardsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: 14,
  },
  cardHalf: {
    flexGrow: 1,
    flexBasis: '47%',
    minWidth: 300,
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
