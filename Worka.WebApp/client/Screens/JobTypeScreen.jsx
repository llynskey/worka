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
  const [form, setForm] = useState({
    jobName: '',
    jobDescription: '',
    address: '',
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
    setForm((current) => ({ ...current, [name]: value }));
  };

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

    try {
      setSubmitting(true);
      await api.post('/createJob', {
        jobName: form.jobName.trim(),
        jobDescription: form.jobDescription.trim(),
        address: form.address.trim(),
        category: selectedType.type,
        customerId: account.customerId,
      });

      setForm({ jobName: '', jobDescription: '', address: '' });
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
            placeholder="Address or service area"
            placeholderTextColor="#686b64"
            value={form.address}
            onChangeText={(text) => updateField('address', text)}
            style={styles.input}
          />

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
