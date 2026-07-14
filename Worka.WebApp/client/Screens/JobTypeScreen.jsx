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
        notify('Account needed', getErrorMessage(error, 'Unable to load your customer account.'));
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
      setLocationError('Enter at least 3 characters to search.');
      return;
    }

    try {
      setLookupLoading(true);
      setLocationError('');
      const results = await lookupLocations(form.address);
      setLocationSuggestions(results);
      if (results.length === 0) {
        setLocationError('No matching locations found. Try a fuller address or nearby town.');
      }
    } catch (error) {
      setLocationSuggestions([]);
      setLocationError(getErrorMessage(error, 'Could not search locations right now.'));
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
        notify('Photo access needed', 'Allow photo library access to attach a job image.');
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
        notify('No photo selected', 'Choose an image and try again.');
        return;
      }

      if (asset.fileSize && asset.fileSize > 8 * 1024 * 1024) {
        notify('Image too large', 'Use an image that is 8MB or smaller.');
        return;
      }

      const upload = new FormData();
      await appendAssetToForm(upload, asset);

      setUploadingPhoto(true);
      const response = await api.post('/uploads/job-photo', upload);
      const uploaded = unwrap(response.data);
      if (!uploaded?.url) {
        notify('Upload failed', 'No image URL was returned.');
        return;
      }

      setForm((current) => ({ ...current, photoUrl: uploaded.url }));
    } catch (error) {
      notify('Could not upload photo', getErrorMessage(error, 'Try another image or paste a URL.'));
    } finally {
      setUploadingPhoto(false);
    }
  };

  const submitJob = async () => {
    if (!account?.customerId) {
      notify('Account needed', 'Your customer account is still loading.');
      return;
    }

    if (!form.jobName.trim()) {
      notify('Add a title', 'Give professionals a short title for the job.');
      return;
    }

    if (!form.jobDescription.trim()) {
      notify('Add details', 'Describe the work so professionals can quote accurately.');
      return;
    }

    if (!form.address.trim()) {
      notify('Add an address', 'Add the job location or service area.');
      return;
    }

    if (!hasVerifiedLocation) {
      notify('Choose a verified location', 'Search the address and choose one of the location results.');
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
      notify('Job posted', 'Professionals can now send quotes.');
      navigation?.navigate('Job List');
    } catch (error) {
      notify('Could not post job', getErrorMessage(error, 'Try again in a moment.'));
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
            <Text style={styles.eyebrow}>New job</Text>
            <Text style={styles.title}>Tell Worka what needs doing.</Text>
            <Text style={styles.subtitle}>Clear details help professionals quote faster.</Text>
          </View>
        </ImageBackground>

        <Text style={styles.sectionTitle}>Category</Text>
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
                <Text style={[styles.categoryText, selected && styles.categoryTextActive]}>{job.type}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.formCard}>
          <TextInput
            placeholder="Job title"
            placeholderTextColor="#686b64"
            value={form.jobName}
            onChangeText={(text) => updateField('jobName', text)}
            style={styles.input}
          />
          <TextInput
            placeholder="Describe the work"
            placeholderTextColor="#686b64"
            value={form.jobDescription}
            onChangeText={(text) => updateField('jobDescription', text)}
            style={[styles.input, styles.textArea]}
            multiline
          />

          <View style={styles.photoPanel}>
            <View style={styles.photoHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.photoTitle}>Reference photo</Text>
                <Text style={styles.photoText}>Show the room, repair, appliance, item, or access issue.</Text>
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
                  <Text style={styles.photoPreviewText}>Photo attached</Text>
                </View>
              </ImageBackground>
            ) : (
              <View style={styles.photoEmpty}>
                <MaterialCommunityIcons name="image-plus-outline" size={26} color="#111" />
                <Text style={styles.photoEmptyText}>Add a photo so quotes are faster and more accurate.</Text>
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
                  <Text style={styles.photoUploadButtonText}>Choose photo</Text>
                </>
              )}
            </TouchableOpacity>

            <TextInput
              placeholder="Or paste an image URL"
              placeholderTextColor="#686b64"
              value={form.photoUrl}
              onChangeText={(text) => updateField('photoUrl', text)}
              autoCapitalize="none"
              style={[styles.input, styles.photoUrlInput]}
            />
          </View>

          <TextInput
            placeholder="Start typing the job address"
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
                <Text style={styles.lookupButtonText}>Search address</Text>
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
                <Text style={styles.locationSelectedTitle}>Location set</Text>
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
                <Text style={styles.submitButtonText}>Post job</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
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
    paddingBottom: 96,
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
    color: '#d6f36a',
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
