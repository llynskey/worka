import React, { useContext, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { AuthContext } from '../auth/AuthContext';
import { api, getErrorMessage } from '../api/workaApi';

const audienceOptions = [
  'I need help in my language',
  'I can work for expats',
  'I want updates',
];

const launchSignals = [
  {
    value: 'Language matched',
    label: 'Find people who can explain the work clearly.',
  },
  {
    value: 'Local practical help',
    label: 'Repairs, cleaning, moving, paperwork, installs, and odd jobs.',
  },
  {
    value: 'Built for expats',
    label: 'Designed for the moments when local systems feel unfamiliar.',
  },
];

const emptyInterestForm = {
  name: '',
  email: '',
  role: audienceOptions[0],
  language: '',
  location: '',
  message: '',
};

const AuthScreen: React.FC = () => {
  const { signInWithToken } = useContext(AuthContext);
  const { width, height } = useWindowDimensions();
  const isNarrow = width < 780;
  const contentWidth = isNarrow ? Math.min(width * 0.74, 322) : Math.min(width * 0.84, 1180);
  const contentShell = {
    width: contentWidth,
    alignSelf: isNarrow ? 'flex-start' : 'center',
    marginLeft: isNarrow ? 24 : 0,
  } as const;

  const [interestForm, setInterestForm] = useState(emptyInterestForm);
  const [interestLoading, setInterestLoading] = useState(false);
  const [registered, setRegistered] = useState(false);

  const [showLogin, setShowLogin] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  const updateInterestField = (name: keyof typeof interestForm, value: string) => {
    setInterestForm((current) => ({ ...current, [name]: value }));
  };

  const registerInterest = async () => {
    if (!interestForm.name.trim()) {
      Alert.alert('Add your name', 'Tell us who to contact.');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(interestForm.email.trim())) {
      Alert.alert('Add a valid email', 'We need an email to send your invite.');
      return;
    }

    if (!interestForm.language.trim()) {
      Alert.alert('Add a language', 'Tell us which language you need or can offer.');
      return;
    }

    try {
      setInterestLoading(true);
      await api.post('/interest', {
        ...interestForm,
        name: interestForm.name.trim(),
        email: interestForm.email.trim(),
        language: interestForm.language.trim(),
        location: interestForm.location.trim(),
        source: 'expat-language-landing',
      });
      setRegistered(true);
    } catch (error) {
      Alert.alert('Could not register interest', getErrorMessage(error, 'Please try again in a moment.'));
    } finally {
      setInterestLoading(false);
    }
  };

  const onLogin = async () => {
    if (!loginEmail.trim() || !password) {
      Alert.alert('Missing info', 'Enter email and password.');
      return;
    }

    try {
      setLoginLoading(true);
      const response = await api.post('/login', {
        email: loginEmail.trim(),
        password,
      });

      const token = response?.data?.token;
      if (!token) {
        Alert.alert('Login failed', 'No session token was returned.');
        return;
      }

      await signInWithToken(token);
    } catch (error) {
      Alert.alert('Login error', getErrorMessage(error, 'Unable to log in right now.'));
    } finally {
      setLoginLoading(false);
    }
  };

  const viewportStyle =
    Platform.OS === 'web'
      ? ({ height: '100vh', maxHeight: '100vh', overflow: 'hidden' } as any)
      : null;

  const scrollStyle =
    Platform.OS === 'web'
      ? ([styles.scroll, { height: '100%', maxHeight: '100%', overflowY: 'auto' }] as any)
      : styles.scroll;

  return (
    <KeyboardAvoidingView
      style={[styles.keyboard, viewportStyle]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={scrollStyle}
        contentContainerStyle={[
          styles.page,
          {
            minHeight: height,
            paddingBottom: isNarrow ? 48 : 24,
          },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator
        nestedScrollEnabled
      >
        <View style={[styles.nav, contentShell, { marginBottom: isNarrow ? 34 : 54 }]}>
          <Image
            source={require('../assets/logo.png')}
            style={[styles.logo, isNarrow && styles.logoMobile]}
            resizeMode="contain"
          />
          <Pressable style={styles.navAction} onPress={() => setShowLogin((value) => !value)}>
            <MaterialCommunityIcons name="lock-outline" size={16} color="#111" />
            <Text style={styles.navActionText}>{showLogin ? 'Waitlist' : 'Early access'}</Text>
          </Pressable>
        </View>

        <View style={[styles.heroGrid, contentShell, { flexDirection: isNarrow ? 'column' : 'row' }]}>
          <View style={styles.heroCopy}>
            <Text style={styles.eyebrow}>Worka for expats</Text>
            <Text
              style={[
                styles.heroTitle,
                {
                  fontSize: isNarrow ? 35 : 58,
                  lineHeight: isNarrow ? 41 : 64,
                  maxWidth: contentWidth,
                },
              ]}
            >
              Get things done by someone who speaks your language.
            </Text>
            <Text style={styles.heroText}>
              Worka helps expats find trusted local people for repairs, moving, cleaning,
              forms, installs, and everyday jobs, with language fit built in from the start.
            </Text>

            {!isNarrow && (
              <View style={[styles.signalRow, { flexDirection: 'row' }]}>
                {launchSignals.map((signal) => (
                  <View key={signal.value} style={styles.signal}>
                    <Text style={styles.signalValue}>{signal.value}</Text>
                    <Text style={styles.signalLabel}>{signal.label}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>

          <View style={[styles.formPanel, !isNarrow && styles.formPanelDesktop]}>
            {showLogin ? (
              <>
                <Text style={styles.panelKicker}>Builder access</Text>
                <Text style={styles.panelTitle}>Sign in to the private app.</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Email"
                  placeholderTextColor="#6b6b6b"
                  value={loginEmail}
                  onChangeText={setLoginEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
                <TextInput
                  style={styles.input}
                  placeholder="Password"
                  placeholderTextColor="#6b6b6b"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                />
                <TouchableOpacity onPress={onLogin} disabled={loginLoading} style={styles.primaryButton}>
                  {loginLoading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <>
                      <MaterialCommunityIcons name="login" size={19} color="#fff" />
                      <Text style={styles.primaryButtonText}>Log in</Text>
                    </>
                  )}
                </TouchableOpacity>
              </>
            ) : registered ? (
              <View style={styles.successPanel}>
                <View style={styles.successIcon}>
                  <MaterialCommunityIcons name="check" size={28} color="#fff" />
                </View>
                <Text style={styles.panelTitle}>You are on the list.</Text>
                <Text style={styles.panelText}>
                  Thanks. I will use your language and location to shape the first Worka launch areas.
                </Text>
                <TouchableOpacity
                  style={styles.secondaryButton}
                  onPress={() => {
                    setRegistered(false);
                    setInterestForm(emptyInterestForm);
                  }}
                >
                  <Text style={styles.secondaryButtonText}>Add another person</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                <Text style={styles.panelKicker}>Register interest</Text>
                <Text style={styles.panelTitle}>Join the expat waitlist.</Text>
                <Text style={styles.panelText}>
                  Tell us where you are, which language matters, and whether you need help or can offer it.
                </Text>

                <TextInput
                  style={styles.input}
                  placeholder="Name"
                  placeholderTextColor="#6b6b6b"
                  value={interestForm.name}
                  onChangeText={(value) => updateInterestField('name', value)}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Email"
                  placeholderTextColor="#6b6b6b"
                  value={interestForm.email}
                  onChangeText={(value) => updateInterestField('email', value)}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
                <TextInput
                  style={styles.input}
                  placeholder="Language needed or offered"
                  placeholderTextColor="#6b6b6b"
                  value={interestForm.language}
                  onChangeText={(value) => updateInterestField('language', value)}
                />
                <TextInput
                  style={styles.input}
                  placeholder="City / country"
                  placeholderTextColor="#6b6b6b"
                  value={interestForm.location}
                  onChangeText={(value) => updateInterestField('location', value)}
                />

                <View style={styles.roleGroup}>
                  {audienceOptions.map((option) => {
                    const selected = interestForm.role === option;
                    return (
                      <Pressable
                        key={option}
                        style={[styles.roleChip, selected && styles.roleChipActive]}
                        onPress={() => updateInterestField('role', option)}
                      >
                        <Text style={[styles.roleChipText, selected && styles.roleChipTextActive]}>{option}</Text>
                      </Pressable>
                    );
                  })}
                </View>

                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="What work or language gap should Worka solve first?"
                  placeholderTextColor="#6b6b6b"
                  value={interestForm.message}
                  onChangeText={(value) => updateInterestField('message', value)}
                  multiline
                />

                <TouchableOpacity
                  onPress={registerInterest}
                  disabled={interestLoading}
                  style={styles.primaryButton}
                >
                  {interestLoading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <>
                      <MaterialCommunityIcons name="arrow-right" size={19} color="#fff" />
                      <Text style={styles.primaryButtonText}>Join the list</Text>
                    </>
                  )}
                </TouchableOpacity>
              </>
            )}
          </View>

          {isNarrow && (
            <View style={[styles.signalRow, { flexDirection: 'column', marginTop: 0 }]}>
              {launchSignals.map((signal) => (
                <View key={signal.value} style={styles.signal}>
                  <Text style={styles.signalValue}>{signal.value}</Text>
                  <Text style={styles.signalLabel}>{signal.label}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        <View style={[styles.footer, contentShell, { flexDirection: isNarrow ? 'column' : 'row' }]}>
          <Text style={styles.footerText}>Built for expats, language communities, and trusted local helpers.</Text>
          <Text style={styles.footerText}>Black. White. Clear.</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  keyboard: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scroll: {
    flex: 1,
    width: '100%',
  },
  page: {
    flexGrow: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 0,
    paddingVertical: 24,
  },
  nav: {
    maxWidth: 1180,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logo: {
    width: 156,
    height: 68,
  },
  logoMobile: {
    width: 126,
    height: 54,
  },
  navAction: {
    borderWidth: 1,
    borderColor: '#111',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 9,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  navActionText: {
    color: '#111',
    fontWeight: '800',
    fontSize: 13,
  },
  heroGrid: {
    maxWidth: 1180,
    alignSelf: 'center',
    alignItems: 'stretch',
    gap: 28,
  },
  heroCopy: {
    flex: 1.14,
    justifyContent: 'center',
    minWidth: 0,
  },
  eyebrow: {
    color: '#111',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0,
    textTransform: 'uppercase',
    marginBottom: 18,
  },
  heroTitle: {
    color: '#000',
    fontWeight: '900',
    letterSpacing: 0,
    maxWidth: 760,
  },
  heroText: {
    color: '#222',
    fontSize: 18,
    lineHeight: 28,
    marginTop: 22,
    maxWidth: 650,
  },
  signalRow: {
    gap: 12,
    marginTop: 34,
  },
  signal: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#111',
    borderRadius: 8,
    padding: 16,
    backgroundColor: '#fff',
  },
  signalValue: {
    color: '#000',
    fontSize: 16,
    fontWeight: '900',
    marginBottom: 6,
  },
  signalLabel: {
    color: '#333',
    lineHeight: 20,
  },
  formPanel: {
    flex: 0.86,
    borderWidth: 1,
    borderColor: '#000',
    borderRadius: 8,
    padding: 22,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 10, height: 10 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  formPanelDesktop: {
    minWidth: 380,
  },
  panelKicker: {
    color: '#111',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  panelTitle: {
    color: '#000',
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '900',
    marginBottom: 10,
  },
  panelText: {
    color: '#333',
    lineHeight: 22,
    marginBottom: 18,
  },
  input: {
    minHeight: 50,
    borderWidth: 1,
    borderColor: '#111',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 12,
    color: '#000',
    backgroundColor: '#fff',
    fontSize: 16,
  },
  textArea: {
    minHeight: 102,
    textAlignVertical: 'top',
  },
  roleGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  roleChip: {
    borderWidth: 1,
    borderColor: '#111',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 9,
    backgroundColor: '#fff',
  },
  roleChipActive: {
    backgroundColor: '#000',
  },
  roleChipText: {
    color: '#111',
    fontWeight: '800',
    fontSize: 13,
  },
  roleChipTextActive: {
    color: '#fff',
  },
  primaryButton: {
    minHeight: 52,
    backgroundColor: '#000',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '900',
  },
  secondaryButton: {
    minHeight: 50,
    borderWidth: 1,
    borderColor: '#111',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  secondaryButtonText: {
    color: '#111',
    fontWeight: '900',
  },
  successPanel: {
    minHeight: 330,
    justifyContent: 'center',
  },
  successIcon: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  footer: {
    maxWidth: 1180,
    alignSelf: 'center',
    borderTopWidth: 1,
    borderTopColor: '#111',
    marginTop: 54,
    paddingTop: 18,
    justifyContent: 'space-between',
    gap: 8,
  },
  footerText: {
    color: '#222',
    fontWeight: '700',
  },
});

export default AuthScreen;
