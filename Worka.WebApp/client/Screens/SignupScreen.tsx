import React, { useCallback, useContext, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { AuthContext } from '../auth/AuthContext';
import { api, getErrorMessage } from '../api/workaApi';
import { useI18n } from '../i18n/I18nContext';
import styles from '../Utils/styles';

type Props = {
  navigation: any;
};

// `value` 0/1 is the API account type — never translated. Labels and
// descriptions resolve through t() at render time.
const accountTypes = [
  {
    labelKey: 'workspace.customer',
    value: 0,
    icon: 'home-search-outline',
    descriptionKey: 'auth.customerDesc',
  },
  {
    labelKey: 'workspace.professional',
    value: 1,
    icon: 'briefcase-check-outline',
    descriptionKey: 'auth.professionalDesc',
  },
] as const;

const SignupScreen: React.FC<Props> = ({ navigation }) => {
  const { signInWithToken } = useContext(AuthContext);
  const { t } = useI18n();
  const { height: viewportHeight } = useWindowDimensions();
  const [hidePassword, setHidePassword] = useState(true);
  const [loading, setLoading] = useState(false);
  const [accountType, setAccountType] = useState<0 | 1>(0);
  const [errorMessage, setErrorMessage] = useState('');

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
  });

  const handleChangeText = useCallback(
    (name: keyof typeof formData, value: string) => {
      setFormData((prev) => ({ ...prev, [name]: value }));
    },
    []
  );

  const validate = () => {
    if (!formData.firstName.trim()) return t('auth.errFirstName');
    if (!formData.lastName.trim()) return t('auth.errLastName');
    if (!formData.email.trim()) return t('auth.errEmail');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) return t('auth.errEmail');
    if (formData.password.length < 6) return t('auth.errPassword');
    return null;
  };

  const handleSignUp = useCallback(async () => {
    setErrorMessage('');
    const error = validate();
    if (error) {
      setErrorMessage(error);
      return;
    }

    try {
      setLoading(true);
      const response = await api.post('/signup', {
        ...formData,
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim().toLowerCase(),
        accountType,
      });

      const token = response?.data?.token;
      if (!token) {
        setErrorMessage(t('auth.errNoToken'));
        return;
      }

      await signInWithToken(token);
    } catch (error) {
      setErrorMessage(getErrorMessage(error, t('auth.errSignup')));
    } finally {
      setLoading(false);
    }
  }, [accountType, formData, signInWithToken, t]);

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.select({ ios: 'padding', android: undefined })}
      >
        <ScrollView
          style={
            // Measured height, not 100vh — keeps the bottom of the form
            // clear of iPhone Safari's floating toolbar.
            Platform.OS === 'web'
              ? ({ height: viewportHeight, maxHeight: viewportHeight } as any)
              : undefined
          }
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.screenScroll}
        >
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconButton}>
              <MaterialCommunityIcons name="arrow-left" size={24} color="#111" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{t('auth.createAccount')}</Text>
            <View style={styles.iconButtonSpacer} />
          </View>

          <View style={styles.formContainer}>
            <Text style={styles.sectionEyebrow}>{t('auth.joiningAs')}</Text>
            <View style={styles.segmentGrid}>
              {accountTypes.map((type) => {
                const selected = accountType === type.value;
                return (
                  <TouchableOpacity
                    key={type.value}
                    onPress={() => {
                      setAccountType(type.value);
                      setErrorMessage('');
                    }}
                    style={[styles.segmentCard, selected && styles.segmentCardActive]}
                  >
                    <MaterialCommunityIcons
                      name={type.icon}
                      size={24}
                      color={selected ? '#fff' : '#111'}
                    />
                    <Text style={[styles.segmentTitle, selected && styles.segmentTitleActive]}>
                      {t(type.labelKey)}
                    </Text>
                    <Text style={[styles.segmentDescription, selected && styles.segmentDescriptionActive]}>
                      {t(type.descriptionKey)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {errorMessage ? (
              <View style={styles.errorBox}>
                <MaterialCommunityIcons name="alert-circle-outline" size={18} color="#111" />
                <Text style={styles.errorBoxText}>{errorMessage}</Text>
              </View>
            ) : null}

            <TextInput
              style={styles.input}
              placeholder={t('account.firstName')}
              placeholderTextColor="#666"
              value={formData.firstName}
              onChangeText={(text) => handleChangeText('firstName', text)}
              autoCapitalize="words"
              autoCorrect={false}
              maxLength={30}
            />

            <TextInput
              style={styles.input}
              placeholder={t('account.lastName')}
              placeholderTextColor="#666"
              value={formData.lastName}
              onChangeText={(text) => handleChangeText('lastName', text)}
              autoCapitalize="words"
              autoCorrect={false}
              maxLength={30}
            />

            <TextInput
              style={styles.input}
              placeholder={t('account.email')}
              placeholderTextColor="#666"
              value={formData.email}
              onChangeText={(text) => handleChangeText('email', text)}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              maxLength={80}
            />

            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                placeholder={t('auth.password')}
                placeholderTextColor="#666"
                value={formData.password}
                onChangeText={(text) => handleChangeText('password', text)}
                secureTextEntry={hidePassword}
                autoCapitalize="none"
                maxLength={64}
                onSubmitEditing={handleSignUp}
              />
              <TouchableOpacity style={styles.inputIcon} onPress={() => setHidePassword((value) => !value)}>
                <MaterialCommunityIcons name={hidePassword ? 'eye' : 'eye-off'} size={22} color="#111" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              onPress={handleSignUp}
              disabled={loading}
              style={[styles.button, loading && styles.disabledButton]}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <MaterialCommunityIcons name="account-plus-outline" size={20} color="#fff" />
                  <Text style={styles.buttonText}>{t('auth.createAccount')}</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default SignupScreen;
