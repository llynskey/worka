import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ImageBackground,
  KeyboardAvoidingView,
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
import { api, getErrorMessage, resolveUploadUrl, unwrap } from '../api/workaApi';
import { lookupLocations } from '../api/locationLookup';
import { useI18n } from '../i18n/I18nContext';
import { categoryLabel } from '../i18n/categories';
import AppFooter from '../components/AppFooter';

const jobTypes = [
  {
    type: 'Plumbing',
    icon: 'water-pump',
    image: 'https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?auto=format&fit=crop&w=900&q=80',
  },
  {
    type: 'Electrical',
    icon: 'lightning-bolt-outline',
    image: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=900&q=80',
  },
  {
    type: 'Painting',
    icon: 'format-paint',
    image: 'https://images.unsplash.com/photo-1562259949-e8e7689d7828?auto=format&fit=crop&w=900&q=80',
  },
  {
    type: 'Cleaning',
    icon: 'spray-bottle',
    image: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=900&q=80',
  },
  {
    type: 'Garden',
    icon: 'flower-outline',
    image: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?auto=format&fit=crop&w=900&q=80',
  },
  {
    type: 'Repairs',
    icon: 'hammer-wrench',
    image: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=900&q=80',
  },
];

const JobTypeScreen = ({ navigation }) => {
  const { t } = useI18n();
  const [selectedType, setSelectedType] = useState(jobTypes[0]);
  const [account, setAccount] = useState(null);
  const [loadingAccount, setLoadingAccount] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [locationSuggestions, setLocationSuggestions] = useState([]);
  const [locationError, setLocationError] = useState('');
  const [form, setForm] = useState({
    jobName: '',
    jobDescription: '',
    address: '',
    locationLabel: '',
    photoUrl: '',
    latitude: null,
    longitude: null,
  });

  useEffect(() => {
    let mounted = true;
    api
      .get('/api/Customer/account')
      .then((response) => {
        if (mounted) setAccount(unwrap(response.data));
      })
      .catch((error) => {
        notify(t('post.accountNeededTitle'), getErrorMessage(error, t('post.accountLoadError')));
      })
      .finally(() => {
        if (mounted) setLoadingAccount(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const updateField = (name, value) => {
    setForm((current) => {
      if (name === 'address') {
        return {
          ...current,
          address: value,
          locationLabel: '',
          latitude: null,
          longitude: null,
        };
      }

      return { ...current, [name]: value };
    });

    if (name === 'address') {
      setLocationError('');
    }
  };

  const searchLocations = async () => {
    if (form.address.trim().length < 3) {
      setLocationError(t('post.minChars'));
      return;
    }

    try {
      setLookupLoading(true);
      setLocationError('');
      const results = await lookupLocations(form.address);
      setLocationSuggestions(results);
      if (results.length === 0) {
        setLocationError(t('post.noLocations'));
      }
    } catch (error) {
      setLocationSuggestions([]);
      setLocationError(getErrorMessage(error, t('post.locationSearchError')));
    } finally {
      setLookupLoading(false);
    }
  };

  const chooseLocation = (location) => {
    setForm((current) => ({
      ...current,
      address: location.address,
      locationLabel: location.label,
      latitude: location.latitude,
      longitude: location.longitude,
    }));
    setLocationSuggestions([]);
    setLocationError('');
  };

  const hasVerifiedLocation = Number.isFinite(form.latitude) && Number.isFinite(form.longitude);

  const getAssetName = (asset) => {
    if (asset.fileName) return asset.fileName;

    const extension = asset.mimeType?.split('/')[1] || 'jpg';
    return `worka-job-photo-${Date.now()}.${extension === 'jpeg' ? 'jpg' : extension}`;
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

  const pickAndUploadJobPhoto = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        notify(t('photo.accessTitle'), t('photo.accessJobText'));
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
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
      const response = await api.post('/uploads/job-photo', upload);
      const uploaded = unwrap(response.data);
      if (!uploaded?.url) {
        notify(t('photo.uploadFailedTitle'), t('photo.noUrl'));
        return;
      }

      setForm((current) => ({ ...current, photoUrl: uploaded.url }));
    } catch (error) {
      notify(t('photo.uploadErrorTitle'), getErrorMessage(error, t('photo.uploadErrorText')));
    } finally {
      setUploadingPhoto(false);
    }
  };

  const submitJob = async () => {
    if (!account?.customerId) {
      notify(t('post.accountNeededTitle'), t('post.accountLoading'));
      return;
    }

    if (!form.jobName.trim()) {
      notify(t('jobs.addTitleTitle'), t('post.addTitleText'));
      return;
    }

    if (!form.jobDescription.trim()) {
      notify(t('post.addDetailsTitle'), t('post.addDetailsText'));
      return;
    }

    if (!form.address.trim()) {
      notify(t('post.addAddressTitle'), t('post.addAddressText'));
      return;
    }

    if (!hasVerifiedLocation) {
      notify(t('post.verifiedLocationTitle'), t('post.verifiedLocationText'));
      return;
    }

    try {
      setSubmitting(true);
      await api.post('/createJob', {
        jobName: form.jobName.trim(),
        jobDescription: form.jobDescription.trim(),
        address: form.address.trim(),
        locationLabel: form.locationLabel || form.address.trim(),
        photoUrl: form.photoUrl.trim(),
        latitude: form.latitude,
        longitude: form.longitude,
        category: selectedType.type,
      });

      setForm({
        jobName: '',
        jobDescription: '',
        address: '',
        locationLabel: '',
        photoUrl: '',
        latitude: null,
        longitude: null,
      });
      notify(t('post.postedTitle'), t('post.postedText'));
      navigation?.navigate('Job List');
    } catch (error) {
      notify(t('post.postErrorTitle'), getErrorMessage(error, t('common.tryAgain')));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <ImageBackground source={{ uri: selectedType.image }} style={styles.hero} imageStyle={styles.heroImage}>
          <View style={styles.heroOverlay}>
            <Text style={styles.eyebrow}>{t('post.newJob')}</Text>
            <Text style={styles.title}>{t('post.heroTitle')}</Text>
            <Text style={styles.subtitle}>{t('post.heroSubtitle')}</Text>
          </View>
        </ImageBackground>

        <Text style={styles.sectionTitle}>{t('jobs.category')}</Text>
        <View style={styles.categoryGrid}>
          {jobTypes.map((job) => {
            const selected = selectedType.type === job.type;
            return (
              <TouchableOpacity
                key={job.type}
                style={[styles.categoryButton, selected && styles.categoryButtonActive]}
                onPress={() => setSelectedType(job)}
              >
                <MaterialCommunityIcons name={job.icon} size={22} color={selected ? '#fff' : '#111'} />
                <Text style={[styles.categoryText, selected && styles.categoryTextActive]}>
                  {categoryLabel(t, job.type)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.formCard}>
          <TextInput
            placeholder={t('jobs.titlePlaceholder')}
            placeholderTextColor="#686b64"
            value={form.jobName}
            onChangeText={(text) => updateField('jobName', text)}
            style={styles.input}
          />
          <TextInput
            placeholder={t('jobs.descPlaceholder')}
            placeholderTextColor="#686b64"
            value={form.jobDescription}
            onChangeText={(text) => updateField('jobDescription', text)}
            style={[styles.input, styles.textArea]}
            multiline
          />

          <View style={styles.photoPanel}>
            <View style={styles.photoHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.photoTitle}>{t('post.photoTitle')}</Text>
                <Text style={styles.photoText}>{t('post.photoText')}</Text>
              </View>
              {form.photoUrl ? (
                <TouchableOpacity style={styles.clearPhotoButton} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} onPress={() => updateField('photoUrl', '')}>
                  <MaterialCommunityIcons name="close" size={18} color="#111" />
                </TouchableOpacity>
              ) : null}
            </View>

            {form.photoUrl ? (
              <ImageBackground source={{ uri: resolveUploadUrl(form.photoUrl) }} style={styles.photoPreview} imageStyle={styles.photoPreviewImage}>
                <View style={styles.photoPreviewOverlay}>
                  <MaterialCommunityIcons name="image-check-outline" size={18} color="#fff" />
                  <Text style={styles.photoPreviewText}>{t('jobs.photoAttached')}</Text>
                </View>
              </ImageBackground>
            ) : (
              <View style={styles.photoEmpty}>
                <MaterialCommunityIcons name="image-plus-outline" size={26} color="#111" />
                <Text style={styles.photoEmptyText}>{t('post.photoEmpty')}</Text>
              </View>
            )}

            <TouchableOpacity
              style={[styles.photoUploadButton, uploadingPhoto && styles.submitButtonDisabled]}
              onPress={pickAndUploadJobPhoto}
              disabled={uploadingPhoto}
            >
              {uploadingPhoto ? (
                <ActivityIndicator color="#111" />
              ) : (
                <>
                  <MaterialCommunityIcons name="image-search-outline" size={20} color="#111" />
                  <Text style={styles.photoUploadButtonText}>{t('post.choosePhoto')}</Text>
                </>
              )}
            </TouchableOpacity>

            <TextInput
              placeholder={t('post.photoUrlPlaceholder')}
              placeholderTextColor="#686b64"
              value={form.photoUrl}
              onChangeText={(text) => updateField('photoUrl', text)}
              autoCapitalize="none"
              style={[styles.input, styles.photoUrlInput]}
            />
          </View>

          <TextInput
            placeholder={t('post.addressPlaceholder')}
            placeholderTextColor="#686b64"
            value={form.address}
            onChangeText={(text) => updateField('address', text)}
            onSubmitEditing={searchLocations}
            style={styles.input}
          />

          <TouchableOpacity
            style={[styles.lookupButton, lookupLoading && styles.submitButtonDisabled]}
            onPress={searchLocations}
            disabled={lookupLoading}
          >
            {lookupLoading ? (
              <ActivityIndicator color="#111" />
            ) : (
              <>
                <MaterialCommunityIcons name="map-search-outline" size={20} color="#111" />
                <Text style={styles.lookupButtonText}>{t('post.searchAddress')}</Text>
              </>
            )}
          </TouchableOpacity>

          {locationError ? (
            <View style={styles.locationMessage}>
              <MaterialCommunityIcons name="alert-circle-outline" size={18} color="#111" />
              <Text style={styles.locationMessageText}>{locationError}</Text>
            </View>
          ) : null}

          {hasVerifiedLocation ? (
            <View style={styles.locationSelected}>
              <MaterialCommunityIcons name="map-marker-check-outline" size={20} color="#111" />
              <View style={{ flex: 1 }}>
                <Text style={styles.locationSelectedTitle}>{t('post.locationSet')}</Text>
                <Text style={styles.locationSelectedText}>{form.locationLabel || form.address}</Text>
              </View>
            </View>
          ) : null}

          {locationSuggestions.length > 0 ? (
            <View style={styles.suggestionList}>
              {locationSuggestions.map((location) => (
                <TouchableOpacity
                  key={location.id}
                  style={styles.suggestionItem}
                  onPress={() => chooseLocation(location)}
                >
                  <MaterialCommunityIcons name="map-marker-outline" size={19} color="#111" />
                  <Text style={styles.suggestionText}>{location.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : null}

          <TouchableOpacity
            style={[styles.submitButton, (loadingAccount || submitting) && styles.submitButtonDisabled]}
            onPress={submitJob}
            disabled={loadingAccount || submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <MaterialCommunityIcons name="send-outline" size={20} color="#fff" />
                <Text style={styles.submitButtonText}>{t('post.submit')}</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        <AppFooter />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minHeight: 0,
    backgroundColor: '#f7f5ef',
  },
  scroll: {
    flex: 1,
    minHeight: 0,
  },
  content: {
    padding: 16,
    paddingBottom: 28,
    flexGrow: 1,
    width: '100%',
    maxWidth: 720,
    alignSelf: 'center',
  },
  hero: {
    minHeight: 190,
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 18,
    justifyContent: 'flex-end',
  },
  heroImage: {
    borderRadius: 8,
  },
  heroOverlay: {
    backgroundColor: 'rgba(0,0,0,0.46)',
    padding: 18,
  },
  eyebrow: {
    color: '#9fd8b6',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  title: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '900',
  },
  subtitle: {
    color: '#edf0ec',
    marginTop: 8,
    fontSize: 15,
    lineHeight: 21,
  },
  sectionTitle: {
    color: '#111',
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 10,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  categoryButton: {
    width: '31%',
    minHeight: 78,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e3dfd2',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  categoryButtonActive: {
    backgroundColor: '#111',
    borderColor: '#111',
  },
  categoryText: {
    color: '#111',
    fontWeight: '800',
    marginTop: 6,
    textAlign: 'center',
  },
  categoryTextActive: {
    color: '#fff',
  },
  formCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e3dfd2',
    padding: 14,
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
    minHeight: 110,
    textAlignVertical: 'top',
  },
  photoPanel: {
    borderWidth: 1,
    borderColor: '#d9d5ca',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    backgroundColor: '#fbfaf6',
  },
  photoHeader: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  photoTitle: {
    color: '#111',
    fontWeight: '900',
  },
  photoText: {
    color: '#62645c',
    marginTop: 3,
    lineHeight: 19,
  },
  clearPhotoButton: {
    width: 34,
    height: 34,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#111',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  photoPreview: {
    minHeight: 170,
    borderRadius: 8,
    overflow: 'hidden',
    justifyContent: 'flex-end',
    marginBottom: 10,
    backgroundColor: '#eee9dd',
  },
  photoPreviewImage: {
    borderRadius: 8,
  },
  photoPreviewOverlay: {
    backgroundColor: 'rgba(0,0,0,0.52)',
    padding: 11,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  photoPreviewText: {
    color: '#fff',
    fontWeight: '900',
  },
  photoEmpty: {
    minHeight: 112,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#bdb7aa',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    marginBottom: 10,
    backgroundColor: '#fff',
  },
  photoEmptyText: {
    color: '#565951',
    textAlign: 'center',
    fontWeight: '700',
    lineHeight: 20,
    marginTop: 7,
  },
  photoUploadButton: {
    minHeight: 46,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#111',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    backgroundColor: '#fff',
    marginBottom: 10,
  },
  photoUploadButtonText: {
    color: '#111',
    fontWeight: '900',
  },
  photoUrlInput: {
    marginBottom: 0,
    backgroundColor: '#fff',
  },
  lookupButton: {
    minHeight: 48,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#111',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
    backgroundColor: '#fff',
  },
  lookupButtonText: {
    color: '#111',
    fontWeight: '900',
    fontSize: 15,
  },
  locationMessage: {
    borderWidth: 1,
    borderColor: '#111',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    flexDirection: 'row',
    gap: 8,
    backgroundColor: '#fff',
  },
  locationMessageText: {
    flex: 1,
    color: '#111',
    fontWeight: '800',
    lineHeight: 20,
  },
  locationSelected: {
    borderWidth: 1,
    borderColor: '#111',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    backgroundColor: '#f3f7f1',
    flexDirection: 'row',
    gap: 10,
  },
  locationSelectedTitle: {
    color: '#111',
    fontWeight: '900',
  },
  locationSelectedText: {
    color: '#4d504b',
    marginTop: 3,
    lineHeight: 19,
  },
  suggestionList: {
    borderWidth: 1,
    borderColor: '#d9d5ca',
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 12,
    backgroundColor: '#fff',
  },
  suggestionItem: {
    minHeight: 50,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ece7dc',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  suggestionText: {
    flex: 1,
    color: '#111',
    fontWeight: '700',
    lineHeight: 19,
  },
  submitButton: {
    backgroundColor: '#111',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  submitButtonDisabled: {
    opacity: 0.68,
  },
  submitButtonText: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 16,
  },
});

export default JobTypeScreen;
