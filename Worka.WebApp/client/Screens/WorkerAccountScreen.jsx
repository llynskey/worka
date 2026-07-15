import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import notify from '../Utils/notify';
import * as ImagePicker from 'expo-image-picker';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { api, getErrorMessage, unwrap } from '../api/workaApi';
import AppFooter from '../components/AppFooter';
import Avatar from '../components/Avatar';
import LanguagePicker from '../components/LanguagePicker';
import { useI18n } from '../i18n/I18nContext';

const getAssetName = (asset) => {
  if (asset.fileName) return asset.fileName;

  const extension = asset.mimeType?.split('/')[1] || 'jpg';
  return `worka-profile-photo-${Date.now()}.${extension === 'jpeg' ? 'jpg' : extension}`;
};

const getAssetType = (asset) => asset.mimeType || asset.type || 'image/jpeg';

const appendAssetToForm = async (upload, asset) => {
  const fileName = getAssetName(asset);
  const mimeType = getAssetType(asset);

  if (Platform.OS === 'web') {
    if (asset.file) {
      upload.append('file', asset.file, fileName);
      return;
    }

    const response = await fetch(asset.uri);
    const blob = await response.blob();
    upload.append('file', blob, fileName);
    return;
  }

  upload.append('file', {
    uri: asset.uri,
    name: fileName,
    type: mimeType,
  });
};

const WorkerAccountScreen = () => {
  const { t } = useI18n();
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    specialty: '',
    serviceArea: '',
    bio: '',
    languages: '',
    photoUrl: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [stripeStatus, setStripeStatus] = useState(null);
  const [stripeLoading, setStripeLoading] = useState(false);
  const [stripeError, setStripeError] = useState('');

  const loadAccount = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/Professionals/account');
      const account = unwrap(response.data);
      setForm({
        firstName: account.firstName ?? '',
        lastName: account.lastName ?? '',
        email: account.email ?? '',
        specialty: account.specialty ?? '',
        serviceArea: account.serviceArea ?? '',
        bio: account.bio ?? '',
        languages: account.languages ?? '',
        photoUrl: account.photoUrl ?? '',
      });
      setStripeStatus({
        connected: !!account.stripeConnected,
        chargesEnabled: !!account.stripeChargesEnabled,
        payoutsEnabled: !!account.stripePayoutsEnabled,
        detailsSubmitted: !!account.stripeDetailsSubmitted,
        readyForPayments: !!account.stripeChargesEnabled && !!account.stripePayoutsEnabled,
      });
    } catch (error) {
      notify(t('account.loadErrorTitle'), getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [t]);

  const loadStripeStatus = useCallback(async () => {
    try {
      setStripeError('');
      const response = await api.get('/payments/stripe/status');
      setStripeStatus(unwrap(response.data));
    } catch (error) {
      setStripeError(getErrorMessage(error, t('account.payoutStatusError')));
    }
  }, [t]);

  useEffect(() => {
    loadAccount();
  }, [loadAccount]);

  useEffect(() => {
    if (!loading) {
      loadStripeStatus();
    }
  }, [loadStripeStatus, loading]);

  const startStripeOnboarding = async () => {
    try {
      setStripeLoading(true);
      setStripeError('');
      const origin =
        Platform.OS === 'web' && typeof window !== 'undefined'
          ? window.location.origin
          : 'https://worka.site';

      const response = await api.post('/payments/stripe/onboarding', {
        returnUrl: `${origin}/?stripe=return`,
        refreshUrl: `${origin}/?stripe=refresh`,
      });

      const onboarding = unwrap(response.data);
      if (!onboarding?.url) {
        setStripeError(t('account.noOnboardingLink'));
        return;
      }

      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.location.href = onboarding.url;
        return;
      }

      await Linking.openURL(onboarding.url);
    } catch (error) {
      setStripeError(getErrorMessage(error, t('account.payoutSetupError')));
    } finally {
      setStripeLoading(false);
    }
  };

  const pickAndUploadProfilePhoto = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        notify(t('photo.accessTitle'), t('photo.accessProfileText'));
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.86,
      });

      if (result.canceled) return;

      const asset = result.assets?.[0];
      if (!asset?.uri) {
        notify(t('photo.noneTitle'), t('photo.noneText'));
        return;
      }

      if (asset.fileSize && asset.fileSize > 8 * 1024 * 1024) {
        notify(t('photo.tooLargeTitle'), t('photo.tooLargeText'));
        return;
      }

      const upload = new FormData();
      await appendAssetToForm(upload, asset);

      setUploadingPhoto(true);
      const response = await api.post('/uploads/profile-photo', upload);
      const uploaded = unwrap(response.data);
      if (!uploaded?.url) {
        notify(t('photo.uploadFailedTitle'), t('photo.noUrl'));
        return;
      }

      setForm((current) => ({ ...current, photoUrl: uploaded.url }));
    } catch (error) {
      notify(t('photo.uploadErrorTitle'), getErrorMessage(error, t('photo.tryAnother')));
    } finally {
      setUploadingPhoto(false);
    }
  };

  const save = async () => {
    if (!form.firstName.trim() || !form.lastName.trim() || !form.email.trim()) {
      notify(t('account.missingTitle'), t('account.missingText'));
      return;
    }

    try {
      setSaving(true);
      const response = await api.put('/api/Professionals/account', form);
      const account = unwrap(response.data);
      setForm({
        firstName: account.firstName ?? '',
        lastName: account.lastName ?? '',
        email: account.email ?? '',
        specialty: account.specialty ?? '',
        serviceArea: account.serviceArea ?? '',
        bio: account.bio ?? '',
        languages: account.languages ?? '',
        photoUrl: account.photoUrl ?? '',
      });
      notify(t('account.savedTitle'), t('account.savedProText'));
    } catch (error) {
      notify(t('account.saveErrorTitle'), getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const profileStrength = (() => {
    const checks = [
      !!form.firstName.trim(),
      !!form.lastName.trim(),
      !!form.email.trim(),
      !!form.specialty.trim(),
      !!form.serviceArea.trim(),
      form.bio.trim().length >= 40,
      !!stripeStatus?.readyForPayments,
    ];
    const done = checks.filter(Boolean).length;
    return { done, total: checks.length, percent: Math.round((done / checks.length) * 100) };
  })();

  const strengthHint = !stripeStatus?.readyForPayments
    ? t('account.hintPayouts')
    : form.bio.trim().length < 40
      ? t('account.hintBio')
      : !form.serviceArea.trim()
        ? t('account.hintArea')
        : t('account.hintGreat');

  if (loading) {
    return (
      <View style={styles.centerState}>
        <ActivityIndicator color="#111" />
        <Text style={styles.mutedText}>{t('account.loading')}</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.headerCard}>
        <MaterialCommunityIcons name="briefcase-account-outline" size={34} color="#111" />
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{t('account.professionalTitle')}</Text>
          <Text style={styles.subtitle}>{t('account.professionalSubtitle')}</Text>
        </View>
      </View>

      <View style={styles.strengthCard}>
        <View style={styles.strengthHeader}>
          <Text style={styles.strengthTitle}>{t('account.profileStrength')}</Text>
          <Text style={styles.strengthPercent}>{profileStrength.percent}%</Text>
        </View>
        <View style={styles.strengthTrack}>
          <View style={[styles.strengthFill, { width: `${profileStrength.percent}%` }]} />
        </View>
        <Text style={styles.strengthHint}>{strengthHint}</Text>
      </View>

      <View style={styles.payoutCard}>
        <View style={styles.payoutHeader}>
          <MaterialCommunityIcons name="bank-transfer" size={28} color="#111" />
          <View style={{ flex: 1 }}>
            <Text style={styles.payoutTitle}>{t('account.payouts')}</Text>
            <Text style={styles.payoutText}>
              {stripeStatus?.readyForPayments
                ? t('account.payoutsReadyText')
                : t('account.payoutsSetupText')}
            </Text>
          </View>
          <View style={[styles.statusPill, stripeStatus?.readyForPayments && styles.statusPillReady]}>
            <Text style={[styles.statusText, stripeStatus?.readyForPayments && styles.statusTextReady]}>
              {stripeStatus?.readyForPayments ? t('account.ready') : t('account.actionNeeded')}
            </Text>
          </View>
        </View>

        <View style={styles.payoutChecklist}>
          <Text style={styles.payoutCheck}>
            {t('account.accountLabel')}: {stripeStatus?.connected ? t('account.connected') : t('account.notConnected')}
          </Text>
          <Text style={styles.payoutCheck}>
            {t('account.chargesLabel')}: {stripeStatus?.chargesEnabled ? t('account.enabled') : t('account.pendingState')}
          </Text>
          <Text style={styles.payoutCheck}>
            {t('account.payoutsLabel')}: {stripeStatus?.payoutsEnabled ? t('account.enabled') : t('account.pendingState')}
          </Text>
        </View>

        {stripeError ? <Text style={styles.payoutError}>{stripeError}</Text> : null}

        <TouchableOpacity style={styles.payoutButton} onPress={startStripeOnboarding} disabled={stripeLoading}>
          {stripeLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <MaterialCommunityIcons name="open-in-new" size={19} color="#fff" />
              <Text style={styles.buttonText}>
                {stripeStatus?.connected ? t('account.continueSetup') : t('account.setupPayouts')}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.formCard}>
        <View style={styles.photoRow}>
          <Avatar photoUrl={form.photoUrl} firstName={form.firstName} lastName={form.lastName} size={64} />
          <TouchableOpacity
            style={styles.photoButton}
            onPress={pickAndUploadProfilePhoto}
            disabled={uploadingPhoto}
          >
            {uploadingPhoto ? (
              <ActivityIndicator color="#111" />
            ) : (
              <>
                <MaterialCommunityIcons name="camera-outline" size={18} color="#111" />
                <Text style={styles.photoButtonText}>{t('account.changePhoto')}</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        <TextInput
          style={styles.input}
          value={form.firstName}
          onChangeText={(firstName) => setForm((current) => ({ ...current, firstName }))}
          placeholder={t('account.firstName')}
          autoCapitalize="words"
          autoCorrect={false}
          placeholderTextColor="#686b64"
        />
        <TextInput
          style={styles.input}
          value={form.lastName}
          onChangeText={(lastName) => setForm((current) => ({ ...current, lastName }))}
          placeholder={t('account.lastName')}
          autoCapitalize="words"
          autoCorrect={false}
          placeholderTextColor="#686b64"
        />
        <TextInput
          style={styles.input}
          value={form.email}
          onChangeText={(email) => setForm((current) => ({ ...current, email }))}
          placeholder={t('account.email')}
          placeholderTextColor="#686b64"
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <TextInput
          style={styles.input}
          value={form.specialty}
          onChangeText={(specialty) => setForm((current) => ({ ...current, specialty }))}
          placeholder={t('account.specialty')}
          placeholderTextColor="#686b64"
        />
        <TextInput
          style={styles.input}
          value={form.serviceArea}
          onChangeText={(serviceArea) => setForm((current) => ({ ...current, serviceArea }))}
          placeholder={t('account.serviceArea')}
          placeholderTextColor="#686b64"
        />
        <TextInput
          style={[styles.input, styles.textArea]}
          value={form.bio}
          onChangeText={(bio) => setForm((current) => ({ ...current, bio }))}
          placeholder={t('account.bio')}
          placeholderTextColor="#686b64"
          multiline
        />

        <LanguagePicker
          value={form.languages}
          onChange={(languages) => setForm((current) => ({ ...current, languages }))}
          label={t('account.languagesLabel')}
        />

        <TouchableOpacity style={styles.button} onPress={save} disabled={saving}>
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <MaterialCommunityIcons name="content-save-outline" size={20} color="#fff" />
              <Text style={styles.buttonText}>{t('account.saveProfile')}</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      <AppFooter />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  strengthCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e3dfd2',
    padding: 14,
    marginBottom: 14,
  },
  strengthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  strengthTitle: {
    color: '#111',
    fontWeight: '900',
    fontSize: 15,
  },
  strengthPercent: {
    color: '#111',
    fontWeight: '900',
    fontSize: 15,
  },
  strengthTrack: {
    height: 8,
    borderRadius: 999,
    backgroundColor: '#f1ede4',
    overflow: 'hidden',
  },
  strengthFill: {
    height: 8,
    borderRadius: 999,
    backgroundColor: '#111',
  },
  strengthHint: {
    marginTop: 10,
    color: '#62645c',
    lineHeight: 19,
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
  formCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e3dfd2',
    padding: 14,
  },
  photoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 14,
  },
  photoButton: {
    minHeight: 44,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#111',
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#fff',
  },
  photoButtonText: {
    color: '#111',
    fontWeight: '900',
  },
  payoutCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#111',
    padding: 14,
    marginBottom: 14,
  },
  payoutHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  payoutTitle: {
    color: '#111',
    fontSize: 18,
    fontWeight: '900',
  },
  payoutText: {
    color: '#62645c',
    marginTop: 4,
    lineHeight: 20,
  },
  payoutChecklist: {
    borderTopWidth: 1,
    borderTopColor: '#ece7dc',
    marginTop: 13,
    paddingTop: 12,
    gap: 4,
  },
  payoutCheck: {
    color: '#111',
    fontWeight: '800',
  },
  payoutError: {
    color: '#111',
    fontWeight: '800',
    marginTop: 10,
  },
  payoutButton: {
    backgroundColor: '#111',
    borderRadius: 8,
    paddingVertical: 13,
    paddingHorizontal: 14,
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  statusPill: {
    backgroundColor: '#f1ede4',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  statusPillReady: {
    backgroundColor: '#dff4e8',
  },
  statusText: {
    color: '#565951',
    fontWeight: '900',
    fontSize: 12,
  },
  statusTextReady: {
    color: '#24513b',
  },
  input: {
    minHeight: 50,
    borderWidth: 1,
    borderColor: '#d9d5ca',
    borderRadius: 8,
    paddingHorizontal: 13,
    paddingVertical: 12,
    marginBottom: 12,
    backgroundColor: '#fbfaf6',
    fontSize: 16,
  },
  textArea: {
    minHeight: 120,
    textAlignVertical: 'top',
  },
  button: {
    backgroundColor: '#111',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 16,
  },
  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f7f5ef',
  },
  mutedText: {
    color: '#63665f',
    marginTop: 8,
  },
});

export default WorkerAccountScreen;
