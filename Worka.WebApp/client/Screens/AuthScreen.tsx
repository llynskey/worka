import React, { useContext, useState } from "react";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import { AuthContext } from "../auth/AuthContext";
import { api, getErrorMessage } from "../api/workaApi";

const audienceOptions = [
  "I need help in my language",
  "I can work for expats",
  "I want updates",
];

const launchSignals = [
  {
    value: "Language matched",
    label: "Find people who can explain the work clearly.",
  },
  {
    value: "Local practical help",
    label: "Repairs, cleaning, moving, paperwork, installs, and odd jobs.",
  },
  {
    value: "Built for expats",
    label: "Designed for the moments when local systems feel unfamiliar.",
  },
];

const accountTypes = [
  {
    label: "Customer",
    value: 0,
    icon: "home-search-outline",
    description: "Post jobs and compare quotes.",
  },
  {
    label: "Professional",
    value: 1,
    icon: "briefcase-check-outline",
    description: "Find work and send quotes.",
  },
] as const;

const emptyInterestForm = {
  name: "",
  email: "",
  role: audienceOptions[0],
  language: "",
  location: "",
  message: "",
};

const emptySignupForm = {
  firstName: "",
  lastName: "",
  email: "",
  password: "",
};

type FormFieldProps = {
  label: string;
  children: React.ReactNode;
};

const FormField: React.FC<FormFieldProps> = ({ label, children }) => (
  <View style={styles.field}>
    <Text style={styles.fieldLabel}>{label}</Text>
    {children}
  </View>
);

const AuthScreen: React.FC = () => {
  const { signInWithToken } = useContext(AuthContext);
  const { width } = useWindowDimensions();

  const isPhone = width < 640;
  const isSmallPhone = width < 390;
  const isStacked = width < 1180;
  const horizontalGutter = isPhone ? 16 : width < 1280 ? 24 : 32;

  const [interestForm, setInterestForm] = useState(emptyInterestForm);
  const [interestLoading, setInterestLoading] = useState(false);
  const [interestError, setInterestError] = useState("");
  const [registered, setRegistered] = useState(false);

  const [showLogin, setShowLogin] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [loginEmail, setLoginEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [authError, setAuthError] = useState("");
  const [signupForm, setSignupForm] = useState(emptySignupForm);
  const [accountType, setAccountType] = useState<0 | 1>(0);
  const [signupLoading, setSignupLoading] = useState(false);

  const updateInterestField = (
    name: keyof typeof interestForm,
    value: string,
  ) => {
    setInterestError("");
    setInterestForm((current) => ({ ...current, [name]: value }));
  };

  const updateSignupField = (name: keyof typeof signupForm, value: string) => {
    setAuthError("");
    setSignupForm((current) => ({ ...current, [name]: value }));
  };

  const registerInterest = async () => {
    setInterestError("");

    if (!interestForm.name.trim()) {
      setInterestError("Add your name so we know who to contact.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(interestForm.email.trim())) {
      setInterestError("Enter a valid email address.");
      return;
    }

    if (!interestForm.language.trim()) {
      setInterestError("Tell us which language you need or can offer.");
      return;
    }

    try {
      setInterestLoading(true);
      await api.post("/interest", {
        ...interestForm,
        name: interestForm.name.trim(),
        email: interestForm.email.trim(),
        language: interestForm.language.trim(),
        location: interestForm.location.trim(),
        source: "expat-language-landing",
      });
      setRegistered(true);
    } catch (error) {
      setInterestError(
        getErrorMessage(
          error,
          "Could not register your interest. Please try again.",
        ),
      );
    } finally {
      setInterestLoading(false);
    }
  };

  const onLogin = async () => {
    setAuthError("");

    if (!loginEmail.trim() || !password) {
      setAuthError("Enter your email and password.");
      return;
    }

    try {
      setLoginLoading(true);
      const response = await api.post("/login", {
        email: loginEmail.trim(),
        password,
      });

      const token = response?.data?.token;
      if (!token) {
        setAuthError("No session token was returned.");
        return;
      }

      await signInWithToken(token);
    } catch (error) {
      setAuthError(getErrorMessage(error, "Unable to log in right now."));
    } finally {
      setLoginLoading(false);
    }
  };

  const validateSignup = () => {
    if (!signupForm.firstName.trim()) return "First name is required.";
    if (!signupForm.lastName.trim()) return "Last name is required.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(signupForm.email.trim())) {
      return "Enter a valid email address.";
    }
    if (signupForm.password.length < 6) {
      return "Password must be at least 6 characters.";
    }
    return "";
  };

  const onSignup = async () => {
    setAuthError("");
    const validationError = validateSignup();

    if (validationError) {
      setAuthError(validationError);
      return;
    }

    try {
      setSignupLoading(true);
      const response = await api.post("/signup", {
        firstName: signupForm.firstName.trim(),
        lastName: signupForm.lastName.trim(),
        email: signupForm.email.trim().toLowerCase(),
        password: signupForm.password,
        accountType,
      });

      const token = response?.data?.token;
      if (!token) {
        setAuthError("No session token was returned.");
        return;
      }

      await signInWithToken(token);
    } catch (error) {
      setAuthError(
        getErrorMessage(error, "Unable to create your account right now."),
      );
    } finally {
      setSignupLoading(false);
    }
  };

  const openWaitlist = () => {
    setShowLogin(false);
    setAuthMode("login");
    setAuthError("");
  };

  const openAuth = (mode: "login" | "signup") => {
    setShowLogin(true);
    setAuthMode(mode);
    setAuthError("");
  };

  const renderBenefits = (stacked = false) => (
    <View style={[styles.benefitList, stacked && styles.benefitListStacked]}>
      {launchSignals.map((signal) => (
        <View key={signal.value} style={styles.benefitItem}>
          <View style={styles.benefitIcon}>
            <MaterialCommunityIcons name="check" size={17} color="#fff" />
          </View>
          <View style={styles.benefitCopy}>
            <Text style={styles.benefitTitle}>{signal.value}</Text>
            <Text style={styles.benefitText}>{signal.label}</Text>
          </View>
        </View>
      ))}
    </View>
  );

  const renderError = (message: string) => {
    if (!message) return null;

    return (
      <View style={styles.errorBox} accessibilityRole="alert">
        <MaterialCommunityIcons
          name="alert-circle-outline"
          size={20}
          color="#111"
        />
        <Text style={styles.errorText}>{message}</Text>
      </View>
    );
  };

  const panelShadowStyle =
    Platform.OS === "web"
      ? ({
          boxShadow: isPhone ? "none" : "0 18px 45px rgba(0, 0, 0, 0.10)",
        } as any)
      : null;

  const webPageStyle =
    Platform.OS === "web" ? ({ minHeight: "100vh" } as any) : null;

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.page,
          webPageStyle,
          {
            paddingHorizontal: horizontalGutter,
            paddingTop: isPhone ? 18 : 24,
            paddingBottom: isPhone ? 36 : 28,
          },
        ]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator
      >
        <View style={styles.shell}>
          <View style={[styles.nav, isPhone && styles.navPhone]}>
            <Image
              source={require("../assets/logo.png")}
              style={[styles.logo, isPhone && styles.logoPhone]}
              resizeMode="contain"
              accessibilityLabel="Worka"
            />

            <Pressable
              accessibilityRole="button"
              accessibilityLabel={
                showLogin ? "Open waitlist form" : "Open sign in form"
              }
              onPress={showLogin ? openWaitlist : () => openAuth("login")}
              style={({ pressed }) => [
                styles.navButton,
                pressed && styles.pressed,
              ]}
            >
              <MaterialCommunityIcons
                name={showLogin ? "arrow-left" : "lock-outline"}
                size={17}
                color="#111"
              />
              <Text style={styles.navButtonText}>
                {showLogin ? "Join waitlist" : "Sign in"}
              </Text>
            </Pressable>
          </View>

          <View
            style={[
              styles.main,
              isStacked ? styles.mainStacked : styles.mainDesktop,
            ]}
          >
            <View style={[styles.hero, !isStacked && styles.heroDesktop]}>
              <View style={styles.eyebrowRow}>
                <View style={styles.eyebrowDot} />
                <Text style={styles.eyebrow}>Worka for expats</Text>
              </View>

              <Text
                style={[
                  styles.heroTitle,
                  isPhone
                    ? styles.heroTitlePhone
                    : isStacked
                      ? styles.heroTitleTablet
                      : styles.heroTitleDesktop,
                ]}
              >
                Get things done by someone who speaks your language.
              </Text>

              <Text style={[styles.heroText, isPhone && styles.heroTextPhone]}>
                Find trusted local people for repairs, moving, cleaning,
                paperwork, installs, and everyday jobs—with language fit built
                in from the start.
              </Text>

              {!isStacked && renderBenefits()}
            </View>

            <View
              style={[
                styles.panel,
                isStacked ? styles.panelStacked : styles.panelDesktop,
                isPhone && styles.panelPhone,
                panelShadowStyle,
              ]}
            >
              {showLogin ? (
                <View>
                  <View style={styles.panelHeader}>
                    <Text style={styles.panelKicker}>Worka account</Text>
                    <Text
                      style={[
                        styles.panelTitle,
                        isPhone && styles.panelTitlePhone,
                      ]}
                    >
                      {authMode === "login"
                        ? "Welcome back."
                        : "Create your account."}
                    </Text>
                    <Text style={styles.panelText}>
                      {authMode === "login"
                        ? "Sign in to continue to Worka."
                        : "Choose how you will use Worka, then add your details."}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.tabList,
                      isSmallPhone && styles.tabListStacked,
                    ]}
                  >
                    <Pressable
                      accessibilityRole="tab"
                      accessibilityState={{ selected: authMode === "login" }}
                      onPress={() => {
                        setAuthMode("login");
                        setAuthError("");
                      }}
                      style={({ pressed }) => [
                        styles.tabButton,
                        authMode === "login" && styles.tabButtonActive,
                        pressed && styles.pressed,
                      ]}
                    >
                      <Text
                        style={[
                          styles.tabButtonText,
                          authMode === "login" && styles.tabButtonTextActive,
                        ]}
                      >
                        Log in
                      </Text>
                    </Pressable>

                    <Pressable
                      accessibilityRole="tab"
                      accessibilityState={{ selected: authMode === "signup" }}
                      onPress={() => {
                        setAuthMode("signup");
                        setAuthError("");
                      }}
                      style={({ pressed }) => [
                        styles.tabButton,
                        authMode === "signup" && styles.tabButtonActive,
                        pressed && styles.pressed,
                      ]}
                    >
                      <Text
                        style={[
                          styles.tabButtonText,
                          authMode === "signup" && styles.tabButtonTextActive,
                        ]}
                      >
                        Create account
                      </Text>
                    </Pressable>
                  </View>

                  {renderError(authError)}

                  {authMode === "login" ? (
                    <View>
                      <FormField label="Email">
                        <TextInput
                          accessibilityLabel="Email"
                          style={styles.input}
                          placeholder="you@example.com"
                          placeholderTextColor="#777"
                          value={loginEmail}
                          onChangeText={(value) => {
                            setAuthError("");
                            setLoginEmail(value);
                          }}
                          autoCapitalize="none"
                          keyboardType="email-address"
                          autoCorrect={false}
                        />
                      </FormField>

                      <FormField label="Password">
                        <TextInput
                          accessibilityLabel="Password"
                          style={styles.input}
                          placeholder="Your password"
                          placeholderTextColor="#777"
                          value={password}
                          onChangeText={(value) => {
                            setAuthError("");
                            setPassword(value);
                          }}
                          secureTextEntry
                          autoCapitalize="none"
                          autoCorrect={false}
                          onSubmitEditing={onLogin}
                        />
                      </FormField>

                      <Pressable
                        accessibilityRole="button"
                        onPress={onLogin}
                        disabled={loginLoading}
                        style={({ pressed }) => [
                          styles.primaryButton,
                          loginLoading && styles.disabledButton,
                          pressed &&
                            !loginLoading &&
                            styles.primaryButtonPressed,
                        ]}
                      >
                        {loginLoading ? (
                          <ActivityIndicator color="#fff" />
                        ) : (
                          <>
                            <MaterialCommunityIcons
                              name="login"
                              size={20}
                              color="#fff"
                            />
                            <Text style={styles.primaryButtonText}>Log in</Text>
                          </>
                        )}
                      </Pressable>
                    </View>
                  ) : (
                    <View>
                      <Text style={styles.sectionLabel}>I am joining as</Text>
                      <View
                        style={[
                          styles.accountTypeList,
                          isPhone && styles.accountTypeListPhone,
                        ]}
                      >
                        {accountTypes.map((type) => {
                          const selected = accountType === type.value;

                          return (
                            <Pressable
                              key={type.value}
                              accessibilityRole="radio"
                              accessibilityState={{ selected }}
                              onPress={() => setAccountType(type.value)}
                              style={({ pressed }) => [
                                styles.accountTypeCard,
                                isPhone && styles.accountTypeCardPhone,
                                selected && styles.accountTypeCardActive,
                                pressed && styles.pressed,
                              ]}
                            >
                              <View
                                style={[
                                  styles.accountTypeIcon,
                                  selected && styles.accountTypeIconActive,
                                ]}
                              >
                                <MaterialCommunityIcons
                                  name={type.icon}
                                  size={21}
                                  color={selected ? "#111" : "#fff"}
                                />
                              </View>
                              <View style={styles.accountTypeCopy}>
                                <Text
                                  style={[
                                    styles.accountTypeTitle,
                                    selected && styles.accountTypeTitleActive,
                                  ]}
                                >
                                  {type.label}
                                </Text>
                                <Text
                                  style={[
                                    styles.accountTypeText,
                                    selected && styles.accountTypeTextActive,
                                  ]}
                                >
                                  {type.description}
                                </Text>
                              </View>
                            </Pressable>
                          );
                        })}
                      </View>

                      <FormField label="First name">
                        <TextInput
                          accessibilityLabel="First name"
                          style={styles.input}
                          placeholder="First name"
                          placeholderTextColor="#777"
                          value={signupForm.firstName}
                          onChangeText={(value) =>
                            updateSignupField("firstName", value)
                          }
                          autoCapitalize="words"
                        />
                      </FormField>

                      <FormField label="Last name">
                        <TextInput
                          accessibilityLabel="Last name"
                          style={styles.input}
                          placeholder="Last name"
                          placeholderTextColor="#777"
                          value={signupForm.lastName}
                          onChangeText={(value) =>
                            updateSignupField("lastName", value)
                          }
                          autoCapitalize="words"
                        />
                      </FormField>

                      <FormField label="Email">
                        <TextInput
                          accessibilityLabel="Email"
                          style={styles.input}
                          placeholder="you@example.com"
                          placeholderTextColor="#777"
                          value={signupForm.email}
                          onChangeText={(value) =>
                            updateSignupField("email", value)
                          }
                          autoCapitalize="none"
                          keyboardType="email-address"
                          autoCorrect={false}
                        />
                      </FormField>

                      <FormField label="Password">
                        <TextInput
                          accessibilityLabel="Password"
                          style={styles.input}
                          placeholder="At least 6 characters"
                          placeholderTextColor="#777"
                          value={signupForm.password}
                          onChangeText={(value) =>
                            updateSignupField("password", value)
                          }
                          secureTextEntry
                          autoCapitalize="none"
                          autoCorrect={false}
                          onSubmitEditing={onSignup}
                        />
                      </FormField>

                      <Pressable
                        accessibilityRole="button"
                        onPress={onSignup}
                        disabled={signupLoading}
                        style={({ pressed }) => [
                          styles.primaryButton,
                          signupLoading && styles.disabledButton,
                          pressed &&
                            !signupLoading &&
                            styles.primaryButtonPressed,
                        ]}
                      >
                        {signupLoading ? (
                          <ActivityIndicator color="#fff" />
                        ) : (
                          <>
                            <MaterialCommunityIcons
                              name="account-plus-outline"
                              size={20}
                              color="#fff"
                            />
                            <Text style={styles.primaryButtonText}>
                              Create account
                            </Text>
                          </>
                        )}
                      </Pressable>
                    </View>
                  )}
                </View>
              ) : registered ? (
                <View style={styles.successPanel}>
                  <View style={styles.successIcon}>
                    <MaterialCommunityIcons
                      name="check"
                      size={28}
                      color="#fff"
                    />
                  </View>
                  <Text style={styles.panelKicker}>Registration complete</Text>
                  <Text
                    style={[
                      styles.panelTitle,
                      isPhone && styles.panelTitlePhone,
                    ]}
                  >
                    You are on the list.
                  </Text>
                  <Text style={styles.panelText}>
                    Thanks. We will use your language and location to shape the
                    first Worka launch areas.
                  </Text>

                  <Pressable
                    accessibilityRole="button"
                    onPress={() => {
                      setRegistered(false);
                      setInterestError("");
                      setInterestForm(emptyInterestForm);
                    }}
                    style={({ pressed }) => [
                      styles.secondaryButton,
                      pressed && styles.pressed,
                    ]}
                  >
                    <Text style={styles.secondaryButtonText}>
                      Add another person
                    </Text>
                  </Pressable>

                  <Pressable
                    accessibilityRole="button"
                    onPress={() => openAuth("signup")}
                    style={({ pressed }) => [
                      styles.textButton,
                      pressed && styles.pressed,
                    ]}
                  >
                    <Text style={styles.textButtonText}>
                      Create a Worka account
                    </Text>
                  </Pressable>
                </View>
              ) : (
                <View>
                  <View style={styles.panelHeader}>
                    <Text style={styles.panelKicker}>Register interest</Text>
                    <Text
                      style={[
                        styles.panelTitle,
                        isPhone && styles.panelTitlePhone,
                      ]}
                    >
                      Join the expat waitlist.
                    </Text>
                    <Text style={styles.panelText}>
                      Tell us where you are, which language matters, and whether
                      you need help or can offer it.
                    </Text>
                  </View>

                  {renderError(interestError)}

                  <FormField label="Name">
                    <TextInput
                      accessibilityLabel="Name"
                      style={styles.input}
                      placeholder="Your name"
                      placeholderTextColor="#777"
                      value={interestForm.name}
                      onChangeText={(value) =>
                        updateInterestField("name", value)
                      }
                      autoCapitalize="words"
                    />
                  </FormField>

                  <FormField label="Email">
                    <TextInput
                      accessibilityLabel="Email"
                      style={styles.input}
                      placeholder="you@example.com"
                      placeholderTextColor="#777"
                      value={interestForm.email}
                      onChangeText={(value) =>
                        updateInterestField("email", value)
                      }
                      autoCapitalize="none"
                      keyboardType="email-address"
                    />
                  </FormField>

                  <FormField label="Language">
                    <TextInput
                      accessibilityLabel="Language needed or offered"
                      style={styles.input}
                      placeholder="For example, Spanish or Arabic"
                      placeholderTextColor="#777"
                      value={interestForm.language}
                      onChangeText={(value) =>
                        updateInterestField("language", value)
                      }
                    />
                  </FormField>

                  <FormField label="Location">
                    <TextInput
                      accessibilityLabel="City or country"
                      style={styles.input}
                      placeholder="City / country"
                      placeholderTextColor="#777"
                      value={interestForm.location}
                      onChangeText={(value) =>
                        updateInterestField("location", value)
                      }
                      autoCapitalize="words"
                    />
                  </FormField>

                  <Text style={styles.sectionLabel}>What brings you here?</Text>
                  <View style={styles.choiceList}>
                    {audienceOptions.map((option) => {
                      const selected = interestForm.role === option;

                      return (
                        <Pressable
                          key={option}
                          accessibilityRole="radio"
                          accessibilityState={{ selected }}
                          onPress={() => updateInterestField("role", option)}
                          style={({ pressed }) => [
                            styles.choiceRow,
                            selected && styles.choiceRowActive,
                            pressed && styles.pressed,
                          ]}
                        >
                          <View
                            style={[
                              styles.radioOuter,
                              selected && styles.radioOuterActive,
                            ]}
                          >
                            {selected ? (
                              <View style={styles.radioInner} />
                            ) : null}
                          </View>
                          <Text
                            style={[
                              styles.choiceText,
                              selected && styles.choiceTextActive,
                            ]}
                          >
                            {option}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>

                  <FormField label="Anything else? (optional)">
                    <TextInput
                      accessibilityLabel="Additional details"
                      style={[styles.input, styles.textArea]}
                      placeholder="What work or language gap should Worka solve first?"
                      placeholderTextColor="#777"
                      value={interestForm.message}
                      onChangeText={(value) =>
                        updateInterestField("message", value)
                      }
                      multiline
                    />
                  </FormField>

                  <Pressable
                    accessibilityRole="button"
                    onPress={registerInterest}
                    disabled={interestLoading}
                    style={({ pressed }) => [
                      styles.primaryButton,
                      interestLoading && styles.disabledButton,
                      pressed &&
                        !interestLoading &&
                        styles.primaryButtonPressed,
                    ]}
                  >
                    {interestLoading ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <>
                        <MaterialCommunityIcons
                          name="arrow-right"
                          size={20}
                          color="#fff"
                        />
                        <Text style={styles.primaryButtonText}>
                          Join the list
                        </Text>
                      </>
                    )}
                  </Pressable>

                  <Pressable
                    accessibilityRole="button"
                    onPress={() => openAuth("signup")}
                    style={({ pressed }) => [
                      styles.secondaryButton,
                      pressed && styles.pressed,
                    ]}
                  >
                    <MaterialCommunityIcons
                      name="account-plus-outline"
                      size={20}
                      color="#111"
                    />
                    <Text style={styles.secondaryButtonText}>
                      Create account now
                    </Text>
                  </Pressable>
                </View>
              )}
            </View>

            {isStacked ? (
              <View style={styles.stackedBenefits}>{renderBenefits(true)}</View>
            ) : null}
          </View>

          <View
            style={[
              styles.footer,
              isPhone ? styles.footerPhone : styles.footerDesktop,
            ]}
          >
            <Text style={styles.footerText}>
              Built for expats, language communities, and trusted local helpers.
            </Text>
            <Text style={styles.footerText}>Black. White. Clear.</Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#fff",
  },
  scroll: {
    flex: 1,
    width: "100%",
  },
  page: {
    flexGrow: 1,
    backgroundColor: "#fff",
  },
  shell: {
    width: "100%",
    maxWidth: 1180,
    alignSelf: "center",
  },
  nav: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 52,
  },
  navPhone: {
    marginBottom: 30,
  },
  logo: {
    width: 150,
    height: 60,
  },
  logoPhone: {
    width: 116,
    height: 46,
  },
  navButton: {
    minHeight: 44,
    maxWidth: "55%",
    borderWidth: 1,
    borderColor: "#111",
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  navButtonText: {
    minWidth: 0,
    flexShrink: 1,
    color: "#111",
    fontSize: 14,
    fontWeight: "800",
    textAlign: "center",
  },
  main: {
    width: "100%",
  },
  mainDesktop: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 68,
  },
  mainStacked: {
    flexDirection: "column",
    alignItems: "stretch",
    gap: 32,
  },
  hero: {
    minWidth: 0,
    flex: 1,
  },
  heroDesktop: {
    paddingTop: 20,
  },
  eyebrowRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    marginBottom: 18,
  },
  eyebrowDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#111",
  },
  eyebrow: {
    minWidth: 0,
    flexShrink: 1,
    color: "#111",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 0.7,
    textTransform: "uppercase",
  },
  heroTitle: {
    maxWidth: 720,
    color: "#050505",
    fontWeight: "900",
    letterSpacing: -1.2,
  },
  heroTitleDesktop: {
    fontSize: 58,
  },
  heroTitleTablet: {
    maxWidth: 760,
    fontSize: 48,
  },
  heroTitlePhone: {
    fontSize: 36,
    letterSpacing: -0.7,
  },
  heroText: {
    maxWidth: 650,
    marginTop: 22,
    color: "#333",
    fontSize: 18,
    lineHeight: 28,
  },
  heroTextPhone: {
    marginTop: 16,
    fontSize: 16,
    lineHeight: 24,
  },
  benefitList: {
    width: "100%",
    maxWidth: 640,
    marginTop: 34,
    gap: 18,
  },
  benefitListStacked: {
    marginTop: 0,
  },
  benefitItem: {
    width: "100%",
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  benefitIcon: {
    width: 30,
    height: 30,
    flexShrink: 0,
    borderRadius: 15,
    backgroundColor: "#111",
    alignItems: "center",
    justifyContent: "center",
  },
  benefitCopy: {
    minWidth: 0,
    flex: 1,
    paddingTop: 1,
  },
  benefitTitle: {
    color: "#111",
    fontSize: 15,
    fontWeight: "900",
    marginBottom: 3,
  },
  benefitText: {
    color: "#444",
    fontSize: 14,
    lineHeight: 21,
  },
  stackedBenefits: {
    width: "100%",
    maxWidth: 620,
    alignSelf: "center",
    paddingTop: 4,
  },
  panel: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#111",
    borderRadius: 18,
    backgroundColor: "#fff",
    padding: 28,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 5,
  },
  panelDesktop: {
    maxWidth: 500,
    flexBasis: 500,
    flexGrow: 0,
    flexShrink: 0,
  },
  panelStacked: {
    maxWidth: 620,
    alignSelf: "center",
  },
  panelPhone: {
    padding: 20,
    borderRadius: 14,
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  panelHeader: {
    marginBottom: 24,
  },
  panelKicker: {
    color: "#555",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 0.7,
    textTransform: "uppercase",
    marginBottom: 8,
  },
  panelTitle: {
    color: "#050505",
    fontSize: 30,
    fontWeight: "900",
    letterSpacing: -0.5,
  },
  panelTitlePhone: {
    fontSize: 26,
  },
  panelText: {
    marginTop: 10,
    color: "#444",
    fontSize: 15,
    lineHeight: 23,
  },
  tabList: {
    width: "100%",
    flexDirection: "row",
    alignItems: "stretch",
    gap: 8,
    marginBottom: 20,
  },
  tabListStacked: {
    flexDirection: "column",
  },
  tabButton: {
    minWidth: 0,
    flex: 1,
    borderWidth: 1,
    borderColor: "#111",
    borderRadius: 10,
    backgroundColor: "#fff",
    paddingHorizontal: 12,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  tabButtonActive: {
    backgroundColor: "#111",
  },
  tabButtonText: {
    flexShrink: 1,
    color: "#111",
    fontSize: 14,
    fontWeight: "900",
    textAlign: "center",
  },
  tabButtonTextActive: {
    color: "#fff",
  },
  field: {
    width: "100%",
    marginBottom: 16,
  },
  fieldLabel: {
    color: "#111",
    fontSize: 14,
    fontWeight: "800",
    marginBottom: 7,
  },
  input: {
    width: "100%",
    minHeight: 54,
    borderWidth: 1,
    borderColor: "#777",
    borderRadius: 10,
    backgroundColor: "#fff",
    color: "#050505",
    fontSize: 16,
    paddingHorizontal: 14,
    paddingVertical: Platform.select({
      ios: 13,
      android: 0,
      web: 13,
      default: 13,
    }),
    textAlignVertical: "center",
  },
  textArea: {
    minHeight: 124,
    paddingTop: 14,
    paddingBottom: 14,
    textAlignVertical: "top",
  },
  sectionLabel: {
    color: "#111",
    fontSize: 14,
    fontWeight: "900",
    marginBottom: 9,
  },
  accountTypeList: {
    width: "100%",
    flexDirection: "row",
    alignItems: "stretch",
    gap: 10,
    marginBottom: 18,
  },
  accountTypeListPhone: {
    flexDirection: "column",
  },
  accountTypeCard: {
    minWidth: 0,
    flex: 1,
    borderWidth: 1,
    borderColor: "#111",
    borderRadius: 12,
    backgroundColor: "#fff",
    padding: 13,
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
  },
  accountTypeCardPhone: {
    width: "100%",
    flex: 0,
  },
  accountTypeCardActive: {
    backgroundColor: "#111",
  },
  accountTypeIcon: {
    width: 38,
    height: 38,
    flexShrink: 0,
    borderRadius: 19,
    backgroundColor: "#111",
    alignItems: "center",
    justifyContent: "center",
  },
  accountTypeIconActive: {
    backgroundColor: "#fff",
  },
  accountTypeCopy: {
    minWidth: 0,
    flex: 1,
  },
  accountTypeTitle: {
    color: "#111",
    fontSize: 15,
    fontWeight: "900",
    marginBottom: 3,
  },
  accountTypeTitleActive: {
    color: "#fff",
  },
  accountTypeText: {
    color: "#555",
    fontSize: 12,
    lineHeight: 18,
    fontWeight: "700",
  },
  accountTypeTextActive: {
    color: "#e4e4e4",
  },
  choiceList: {
    width: "100%",
    gap: 9,
    marginBottom: 18,
  },
  choiceRow: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#777",
    borderRadius: 10,
    backgroundColor: "#fff",
    paddingHorizontal: 13,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  choiceRowActive: {
    borderColor: "#111",
    backgroundColor: "#111",
  },
  radioOuter: {
    width: 20,
    height: 20,
    flexShrink: 0,
    borderWidth: 1.5,
    borderColor: "#555",
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  radioOuterActive: {
    borderColor: "#fff",
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#fff",
  },
  choiceText: {
    minWidth: 0,
    flex: 1,
    color: "#111",
    fontSize: 14,
    fontWeight: "800",
  },
  choiceTextActive: {
    color: "#fff",
  },
  errorBox: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#111",
    borderRadius: 10,
    backgroundColor: "#f1f1ed",
    padding: 13,
    marginBottom: 16,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 9,
  },
  errorText: {
    minWidth: 0,
    flex: 1,
    color: "#111",
    fontSize: 14,
    fontWeight: "800",
  },
  primaryButton: {
    width: "100%",
    minHeight: 54,
    borderRadius: 10,
    backgroundColor: "#111",
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
  },
  primaryButtonPressed: {
    opacity: 0.82,
    transform: [{ translateY: 1 }],
  },
  primaryButtonText: {
    minWidth: 0,
    flexShrink: 1,
    color: "#fff",
    fontSize: 16,
    fontWeight: "900",
    textAlign: "center",
  },
  secondaryButton: {
    width: "100%",
    minHeight: 52,
    borderWidth: 1,
    borderColor: "#111",
    borderRadius: 10,
    backgroundColor: "#fff",
    marginTop: 11,
    paddingHorizontal: 16,
    paddingVertical: 13,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
  },
  secondaryButtonText: {
    minWidth: 0,
    flexShrink: 1,
    color: "#111",
    fontSize: 15,
    fontWeight: "900",
    textAlign: "center",
  },
  textButton: {
    alignSelf: "flex-start",
    marginTop: 16,
    paddingVertical: 8,
  },
  textButtonText: {
    color: "#111",
    fontSize: 14,
    fontWeight: "900",
    textDecorationLine: "underline",
  },
  disabledButton: {
    opacity: 0.55,
  },
  pressed: {
    opacity: 0.72,
  },
  successPanel: {
    width: "100%",
    paddingVertical: 8,
  },
  successIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#111",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },
  footer: {
    width: "100%",
    borderTopWidth: 1,
    borderTopColor: "#bbb",
    marginTop: 52,
    paddingTop: 20,
    gap: 8,
  },
  footerDesktop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  footerPhone: {
    flexDirection: "column",
    alignItems: "flex-start",
  },
  footerText: {
    minWidth: 0,
    flexShrink: 1,
    color: "#555",
    fontSize: 13,
    fontWeight: "700",
  },
});

export default AuthScreen;
