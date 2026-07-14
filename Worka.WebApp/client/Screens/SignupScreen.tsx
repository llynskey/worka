import React, { useCallback, useContext, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { AuthContext } from '../auth/AuthContext';
import { api, getErrorMessage } from '../api/workaApi';
import styles from '../Utils/styles';

type Props = {
  navigation: any;
};

const accountTypes = [
  {
    label: 'Customer',
    value: 0,
    icon: 'home-search-outline',
    description: 'Post jobs and hire local professionals.',
  },
  {
    label: 'Professional',
    value: 1,
    icon: 'briefcase-check-outline',
    description: 'Find work and send quotes.',
  },
] as const;

const SignupScreen: React.FC<Props> = ({ navigation }) => {
  const { signInWithToken } = useContext(AuthContext);
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
    if (!formData.firstName.trim()) return 'First name is required.';
    if (!formData.lastName.trim()) return 'Last name is required.';
    if (!formData.email.trim()) return 'Email is required.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) return 'Enter a valid email.';
    if (formData.password.length < 6) return 'Password must be at least 6 characters.';
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
        setErrorMessage('No session token was returned.');
        return;
      }

      await signInWithToken(token);
    } catch (error) {
      setErrorMessage(getErrorMessage(error, 'Unable to create your account right now.'));
    } finally {
      setLoading(false);
    }
  }, [accountType, formData, signInWithToken]);

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.select({ ios: 'padding', android: undefined })}
      >
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.screenScroll}>
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconButton}>
              <MaterialCommunityIcons name="arrow-left" size={24} color="#111" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Create account</Text>
            <View style={styles.iconButtonSpacer} />
          </View>

          <View style={styles.formContainer}>
            <Text style={styles.sectionEyebrow}>I want to use Worka as a</Text>
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
                      {type.label}
                    </Text>
                    <Text style={[styles.segmentDescription, selected && styles.segmentDescriptionActive]}>
                      {type.description}
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
              placeholder="First name"
              placeholderTextColor="#666"
              value={formData.firstName}
              onChangeText={(text) => handleChangeText('firstName', text)}
              autoCapitalize="words"
              autoCorrect={false}
              maxLength={30}
            />

            <TextInput
              style={styles.input}
              placeholder="Last name"
              placeholderTextColor="#666"
              value={formData.lastName}
              onChangeText={(text) => handleChangeText('lastName', text)}
              autoCapitalize="words"
              autoCorrect={false}
              maxLength={30}
            />

            <TextInput
              style={styles.input}
              placeholder="Email"
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
                placeholder="Password"
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
                  <Text style={styles.buttonText}>Create account</Text>
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
