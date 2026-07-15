import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
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
import { api, CURRENCIES, getErrorMessage, unwrap } from '../api/workaApi';
import AppFooter from '../components/AppFooter';
import Avatar from '../components/Avatar';
import LanguagePicker from '../components/LanguagePicker';
import SelectField from '../components/SelectField';
import { useI18n } from '../i18n/I18nContext';

const emptyForm = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  address: '',
  languages: '',
  photoUrl: '',
  preferredCurrency: 'gbp',
};

const accountToForm = (account) => ({
  firstName: account.firstName ?? '',
  lastName: account.lastName ?? '',
  email: account.email ?? '',
  phone: account.phone ?? '',
  address: account.address ?? '',
  languages: account.languages ?? '',
  photoUrl: account.photoUrl ?? '',
  preferredCurrency: (account.preferredCurrency || 'gbp').toLowerCase(),
});

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

const CustomerAccountScreen = () => {
  const { t } = useI18n();
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const loadAccount = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/Customer/account');
      const account = unwrap(response.data);
      setForm(accountToForm(account));
    } catch (error) {
      notify(t('account.loadErrorTitle'), getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    loadAccount();
  }, [loadAccount]);

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
      const response = await api.put('/api/Customer/account', form);
      const account = unwrap(response.data);
      setForm(accountToForm(account));
      notify(t('account.savedTitle'), t('account.savedCustomerText'));
    } catch (error) {
      notify(t('account.saveErrorTitle'), getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

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
        <MaterialCommunityIcons name="account-circle-outline" size={34} color="#111" />
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{t('account.customerTitle')}</Text>
          <Text style={styles.subtitle}>{t('account.customerSubtitle')}</Text>
        </View>
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
          value={form.phone}
          onChangeText={(phone) => setForm((current) => ({ ...current, phone }))}
          placeholder={t('account.phone')}
          placeholderTextColor="#686b64"
          keyboardType="phone-pad"
        />
        <TextInput
          style={styles.input}
          value={form.address}
          onChangeText={(address) => setForm((current) => ({ ...current, address }))}
          placeholder={t('account.address')}
          placeholderTextColor="#686b64"
        />

        <LanguagePicker
          value={form.languages}
          onChange={(languages) => setForm((current) => ({ ...current, languages }))}
          label={t('account.languagesLabel')}
        />

        <SelectField
          label={t('account.currencyLabel')}
          options={CURRENCIES.map((option) => ({ value: option.code, label: option.label }))}
          value={form.preferredCurrency}
          onChange={(preferredCurrency) => setForm((current) => ({ ...current, preferredCurrency }))}
          placeholder={t('account.currencyLabel')}
          searchPlaceholder={t('common.search')}
        />
        <Text style={styles.currencyHint}>{t('account.currencyHint')}</Text>

        <TouchableOpacity style={styles.button} onPress={save} disabled={saving}>
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <MaterialCommunityIcons name="content-save-outline" size={20} color="#fff" />
              <Text style={styles.buttonText}>{t('account.save')}</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      <AppFooter />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  content: {
    padding: 16,
    paddingBottom: 28,
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
  currencyHint: {
    color: '#62645c',
    fontSize: 13,
    lineHeight: 18,
    marginTop: -4,
    marginBottom: 14,
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

export default CustomerAccountScreen;
