import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
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

const WorkerAccountScreen = () => {
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    specialty: '',
    serviceArea: '',
    bio: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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
      });
      setStripeStatus({
        connected: !!account.stripeConnected,
        chargesEnabled: !!account.stripeChargesEnabled,
        payoutsEnabled: !!account.stripePayoutsEnabled,
        detailsSubmitted: !!account.stripeDetailsSubmitted,
        readyForPayments: !!account.stripeChargesEnabled && !!account.stripePayoutsEnabled,
      });
    } catch (error) {
      Alert.alert('Could not load account', getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, []);

  const loadStripeStatus = useCallback(async () => {
    try {
      setStripeError('');
      const response = await api.get('/payments/stripe/status');
      setStripeStatus(unwrap(response.data));
    } catch (error) {
      setStripeError(getErrorMessage(error, 'Could not load payout status.'));
    }
  }, []);

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
          : 'https://worka-uk.online';

      const response = await api.post('/payments/stripe/onboarding', {
        returnUrl: `${origin}/?stripe=return`,
        refreshUrl: `${origin}/?stripe=refresh`,
      });

      const onboarding = unwrap(response.data);
      if (!onboarding?.url) {
        setStripeError('No onboarding link was returned.');
        return;
      }

      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.location.href = onboarding.url;
        return;
      }

      await Linking.openURL(onboarding.url);
    } catch (error) {
      setStripeError(getErrorMessage(error, 'Could not start payout setup.'));
    } finally {
      setStripeLoading(false);
    }
  };

  const save = async () => {
    if (!form.firstName.trim() || !form.lastName.trim() || !form.email.trim()) {
      Alert.alert('Missing details', 'Name and email are required.');
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
      });
      Alert.alert('Account saved', 'Your professional profile is up to date.');
    } catch (error) {
      Alert.alert('Could not save account', getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerState}>
        <ActivityIndicator color="#111" />
        <Text style={styles.mutedText}>Loading account...</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.headerCard}>
        <MaterialCommunityIcons name="briefcase-account-outline" size={34} color="#111" />
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Professional account</Text>
          <Text style={styles.subtitle}>Help customers understand your trade, coverage, and approach.</Text>
        </View>
      </View>

      <View style={styles.payoutCard}>
        <View style={styles.payoutHeader}>
          <MaterialCommunityIcons name="bank-transfer" size={28} color="#111" />
          <View style={{ flex: 1 }}>
            <Text style={styles.payoutTitle}>Payouts</Text>
            <Text style={styles.payoutText}>
              {stripeStatus?.readyForPayments
                ? 'Ready to receive your share when customers pay.'
                : 'Set up Stripe payouts before customers can pay your quotes.'}
            </Text>
          </View>
          <View style={[styles.statusPill, stripeStatus?.readyForPayments && styles.statusPillReady]}>
            <Text style={[styles.statusText, stripeStatus?.readyForPayments && styles.statusTextReady]}>
              {stripeStatus?.readyForPayments ? 'Ready' : 'Action needed'}
            </Text>
          </View>
        </View>

        <View style={styles.payoutChecklist}>
          <Text style={styles.payoutCheck}>Account: {stripeStatus?.connected ? 'connected' : 'not connected'}</Text>
          <Text style={styles.payoutCheck}>Charges: {stripeStatus?.chargesEnabled ? 'enabled' : 'pending'}</Text>
          <Text style={styles.payoutCheck}>Payouts: {stripeStatus?.payoutsEnabled ? 'enabled' : 'pending'}</Text>
        </View>

        {stripeError ? <Text style={styles.payoutError}>{stripeError}</Text> : null}

        <TouchableOpacity style={styles.payoutButton} onPress={startStripeOnboarding} disabled={stripeLoading}>
          {stripeLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <MaterialCommunityIcons name="open-in-new" size={19} color="#fff" />
              <Text style={styles.buttonText}>
                {stripeStatus?.connected ? 'Continue payout setup' : 'Set up payouts'}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.formCard}>
        <TextInput
          style={styles.input}
          value={form.firstName}
          onChangeText={(firstName) => setForm((current) => ({ ...current, firstName }))}
          placeholder="First name"
          placeholderTextColor="#686b64"
        />
        <TextInput
          style={styles.input}
          value={form.lastName}
          onChangeText={(lastName) => setForm((current) => ({ ...current, lastName }))}
          placeholder="Last name"
          placeholderTextColor="#686b64"
        />
        <TextInput
          style={styles.input}
          value={form.email}
          onChangeText={(email) => setForm((current) => ({ ...current, email }))}
          placeholder="Email"
          placeholderTextColor="#686b64"
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <TextInput
          style={styles.input}
          value={form.specialty}
          onChangeText={(specialty) => setForm((current) => ({ ...current, specialty }))}
          placeholder="Specialty"
          placeholderTextColor="#686b64"
        />
        <TextInput
          style={styles.input}
          value={form.serviceArea}
          onChangeText={(serviceArea) => setForm((current) => ({ ...current, serviceArea }))}
          placeholder="Service area"
          placeholderTextColor="#686b64"
        />
        <TextInput
          style={[styles.input, styles.textArea]}
          value={form.bio}
          onChangeText={(bio) => setForm((current) => ({ ...current, bio }))}
          placeholder="Bio"
          placeholderTextColor="#686b64"
          multiline
        />

        <TouchableOpacity style={styles.button} onPress={save} disabled={saving}>
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <MaterialCommunityIcons name="content-save-outline" size={20} color="#fff" />
              <Text style={styles.buttonText}>Save profile</Text>
            </>
          )}
        </TouchableOpacity>
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
