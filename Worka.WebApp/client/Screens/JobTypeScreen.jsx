import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { api, getErrorMessage, unwrap } from '../api/workaApi';
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
  const [lookupLoading, setLookupLoading] = useState(false);
  const [locationSuggestions, setLocationSuggestions] = useState([]);
  const [locationError, setLocationError] = useState('');
  const [form, setForm] = useState({
    jobName: '',
    jobDescription: '',
    address: '',
    locationLabel: '',
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
        Alert.alert('Account needed', getErrorMessage(error, 'Unable to load your customer account.'));
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

  const submitJob = async () => {
    if (!account?.customerId) {
      Alert.alert('Account needed', 'Your customer account is still loading.');
      return;
    }

    if (!form.jobName.trim()) {
      Alert.alert('Add a title', 'Give professionals a short title for the job.');
      return;
    }

    if (!form.jobDescription.trim()) {
      Alert.alert('Add details', 'Describe the work so professionals can quote accurately.');
      return;
    }

    if (!form.address.trim()) {
      Alert.alert('Add an address', 'Add the job location or service area.');
      return;
    }

    if (!hasVerifiedLocation) {
      Alert.alert('Choose a verified location', 'Search the address and choose one of the location results.');
      return;
    }

    try {
      setSubmitting(true);
      await api.post('/createJob', {
        jobName: form.jobName.trim(),
        jobDescription: form.jobDescription.trim(),
        address: form.address.trim(),
        locationLabel: form.locationLabel || form.address.trim(),
        latitude: form.latitude,
        longitude: form.longitude,
        category: selectedType.type,
        customerId: account.customerId,
      });

      setForm({
        jobName: '',
        jobDescription: '',
        address: '',
        locationLabel: '',
        latitude: null,
        longitude: null,
      });
      Alert.alert('Job posted', 'Professionals can now send quotes.');
      navigation?.navigate('Job List');
    } catch (error) {
      Alert.alert('Could not post job', getErrorMessage(error, 'Try again in a moment.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
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
    backgroundColor: '#f7f5ef',
  },
  content: {
    padding: 16,
    paddingBottom: 96,
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
