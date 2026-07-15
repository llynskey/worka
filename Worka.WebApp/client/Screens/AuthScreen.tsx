import React, { useContext, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Linking,
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
import { useI18n } from "../i18n/I18nContext";
import { translations } from "../i18n/translations";
import LanguageCycler from "../components/LanguageCycler";
import Reveal from "../components/Reveal";

const audienceOptions = [
  "I need help in my language",
  "I can work for expats",
  "I want updates",
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

// Web-only: eases pressed-state changes (scale/opacity/color) instead of
// snapping. Compiled to a CSS transition, so it runs on the compositor.
const webPressTransition =
  Platform.OS === "web"
    ? ({
        transitionProperty: "transform, opacity, background-color, border-color",
        transitionDuration: "160ms",
        transitionTimingFunction: "cubic-bezier(0.2, 0.8, 0.4, 1)",
      } as any)
    : {};

const AuthScreen: React.FC = () => {
  const { signInWithToken } = useContext(AuthContext);
  const { t, language, languages, setLanguage } = useI18n();
  const { width } = useWindowDimensions();

  // Hero headline cycles through every supported language, starting with the
  // visitor's own — a quiet demo of what Worka does.
  const heroTitles = React.useMemo(() => {
    const codes = [language, ...languages.map((l) => l.code).filter((c) => c !== language)];
    return codes.map((code) => translations[code]?.["landing.heroTitle"]).filter(Boolean);
  }, [language, languages]);

  const isPhone = width < 640;
  const isSmallPhone = width < 390;
  const isStacked = width < 1180;
  const horizontalGutter = isPhone ? 16 : width < 1280 ? 24 : 32;

  const [interestForm, setInterestForm] = useState(emptyInterestForm);
  const [interestLoading, setInterestLoading] = useState(false);
  const [interestError, setInterestError] = useState("");
  const [registered, setRegistered] = useState(false);

  const [showLogin, setShowLogin] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "signup" | "forgot" | "reset">("login");
  const [loginEmail, setLoginEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [authError, setAuthError] = useState("");
  const [signupForm, setSignupForm] = useState(emptySignupForm);
  const [accountType, setAccountType] = useState<0 | 1>(0);
  const [signupLoading, setSignupLoading] = useState(false);
  const [authInfo, setAuthInfo] = useState("");
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [resetToken, setResetToken] = useState("");
  const [resetNewPassword, setResetNewPassword] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [scrollTick, setScrollTick] = useState(0);

  // On stacked layouts the auth panel sits below the hero; when the nav
  // button swaps modes we scroll it into view so the tap visibly "does"
  // something.
  const scrollRef = React.useRef<ScrollView>(null);
  const mainYRef = React.useRef(0);
  const panelYRef = React.useRef(0);

  const scrollToPanel = () => {
    if (!isStacked) return;
    setTimeout(() => {
      scrollRef.current?.scrollTo({
        y: Math.max(mainYRef.current + panelYRef.current - 12, 0),
        animated: true,
      });
    }, 80);
  };

  useEffect(() => {
    if (Platform.OS !== "web" || typeof window === "undefined") return;

    const params = new URLSearchParams(window.location.search);
    const token = params.get("reset");
    if (token) {
      setResetToken(token);
      setShowLogin(true);
      setAuthMode("reset");
      window.history.replaceState(null, "", window.location.pathname);
    }
  }, []);

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
    scrollToPanel();
  };

  const openAuth = (mode: "login" | "signup" | "forgot" | "reset") => {
    setShowLogin(true);
    setAuthMode(mode);
    setAuthError("");
    setAuthInfo("");
    scrollToPanel();
  };

  const onForgotPassword = async () => {
    setAuthError("");
    setAuthInfo("");

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(forgotEmail.trim())) {
      setAuthError("Enter a valid email address.");
      return;
    }

    try {
      setForgotLoading(true);
      const response = await api.post("/forgotPassword", { email: forgotEmail.trim() });
      setAuthInfo(
        response?.data?.message ?? "If that email is registered, a reset link is on its way."
      );
    } catch (error) {
      setAuthError(getErrorMessage(error, "Could not send the reset email right now."));
    } finally {
      setForgotLoading(false);
    }
  };

  const onResetPassword = async () => {
    setAuthError("");
    setAuthInfo("");

    if (resetNewPassword.length < 6) {
      setAuthError("Password must be at least 6 characters.");
      return;
    }

    try {
      setResetLoading(true);
      const response = await api.post("/resetPassword", {
        token: resetToken,
        newPassword: resetNewPassword,
      });
      setResetNewPassword("");
      setAuthMode("login");
      setAuthInfo(response?.data?.message ?? "Password reset. You can now log in.");
    } catch (error) {
      setAuthError(getErrorMessage(error, "Could not reset the password."));
    } finally {
      setResetLoading(false);
    }
  };

  const renderLanguageChips = () =>
    languages.map((lang) => {
      const active = lang.code === language;
      return (
        <Pressable
          key={lang.code}
          accessibilityRole="button"
          accessibilityLabel={`Switch language to ${lang.label}`}
          onPress={() => setLanguage(lang.code)}
          style={({ pressed }) => [
            styles.languageChip,
            active && styles.languageChipActive,
            pressed && styles.pressed,
          ]}
        >
          <Text
            style={[
              styles.languageChipText,
              active && styles.languageChipTextActive,
            ]}
          >
            {lang.code.toUpperCase()}
          </Text>
        </Pressable>
      );
    });

  const renderBenefits = (stacked = false) => (
    <View style={[styles.benefitList, stacked && styles.benefitListStacked]}>
      {[1, 2, 3].map((n) => (
        <Reveal key={n} tick={scrollTick} delay={(n - 1) * 130}>
          <View style={styles.benefitItem}>
            <View style={styles.benefitIcon}>
              <MaterialCommunityIcons name="check" size={17} color="#fff" />
            </View>
            <View style={styles.benefitCopy}>
              <Text style={styles.benefitTitle}>{t(`landing.benefit${n}Title`)}</Text>
              <Text style={styles.benefitText}>{t(`landing.benefit${n}Text`)}</Text>
            </View>
          </View>
        </Reveal>
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

  // The app root is pinned to the viewport with overflow hidden, so on web the
  // ScrollView must own an explicit viewport-bounded height or it silently
  // clips instead of scrolling.
  const webScrollStyle =
    Platform.OS === "web"
      ? ({ height: "100vh", maxHeight: "100vh" } as any)
      : null;

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        ref={scrollRef}
        style={[styles.scroll, webScrollStyle]}
        scrollEventThrottle={80}
        onScroll={(event) => {
          const bucket = Math.round(event.nativeEvent.contentOffset.y / 48);
          setScrollTick((current) => (current === bucket ? current : bucket));
        }}
        contentContainerStyle={[
          styles.page,
          webPageStyle,
          {
            paddingHorizontal: horizontalGutter,
            paddingTop: isPhone ? 18 : 24,
            // Phones get extra clearance so the footer never hides behind
            // Safari's floating bottom toolbar (100vh includes that zone).
            paddingBottom: isPhone ? 60 : 32,
          },
        ]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator
      >
        <View style={styles.shell}>
          <View style={[styles.header, isPhone && styles.headerPhone]}>
            <View style={styles.nav}>
              <Image
                source={require("../assets/logo.png")}
                style={[styles.logo, isPhone && styles.logoPhone]}
                resizeMode="contain"
                accessibilityLabel="Worka"
              />

              <View style={styles.navRight}>
                {!isPhone && (
                  <View style={styles.navLangs}>{renderLanguageChips()}</View>
                )}

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
                    color="#fff"
                  />
                  <Text style={styles.navButtonText}>
                    {showLogin ? t("landing.joinWaitlist") : t("landing.signIn")}
                  </Text>
                </Pressable>
              </View>
            </View>

            {isPhone && (
              <View style={styles.languageRow}>
                <MaterialCommunityIcons name="web" size={16} color="#555" />
                {renderLanguageChips()}
              </View>
            )}
          </View>

          <View
            style={[
              styles.main,
              isStacked ? styles.mainStacked : styles.mainDesktop,
            ]}
            onLayout={(event) => {
              mainYRef.current = event.nativeEvent.layout.y;
            }}
          >
            <View style={[styles.hero, !isStacked && styles.heroDesktop]}>
              <View style={styles.eyebrowRow}>
                <View style={styles.eyebrowDot} />
                <Text style={styles.eyebrow}>{t("landing.eyebrow")}</Text>
              </View>

              <LanguageCycler
                items={heroTitles}
                containerStyle={{ minHeight: isPhone ? 130 : isStacked ? 165 : 230 }}
                textStyle={[
                  styles.heroTitle,
                  isPhone
                    ? styles.heroTitlePhone
                    : isStacked
                      ? styles.heroTitleTablet
                      : styles.heroTitleDesktop,
                ]}
              />

              <Text style={[styles.heroText, isPhone && styles.heroTextPhone]}>
                {t("landing.heroText")}
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
              onLayout={(event) => {
                panelYRef.current = event.nativeEvent.layout.y;
              }}
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
                        : authMode === "signup"
                          ? "Create your account."
                          : authMode === "forgot"
                            ? "Reset your password."
                            : "Choose a new password."}
                    </Text>
                    <Text style={styles.panelText}>
                      {authMode === "login"
                        ? "Sign in to continue to Worka."
                        : authMode === "signup"
                          ? "Choose how you will use Worka, then add your details."
                          : authMode === "forgot"
                            ? "Enter your email and we will send you a reset link."
                            : "Enter the new password for your account."}
                    </Text>
                  </View>

                  {(authMode === "login" || authMode === "signup") && (
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
                  )}

                  {renderError(authError)}
                  {authInfo ? (
                    <View style={styles.errorBox}>
                      <MaterialCommunityIcons
                        name="information-outline"
                        size={20}
                        color="#111"
                      />
                      <Text style={styles.errorText}>{authInfo}</Text>
                    </View>
                  ) : null}

                  {authMode === "forgot" ? (
                    <View>
                      <FormField label="Email">
                        <TextInput
                          accessibilityLabel="Email for password reset"
                          style={styles.input}
                          placeholder="you@example.com"
                          placeholderTextColor="#777"
                          value={forgotEmail}
                          onChangeText={(value) => {
                            setAuthError("");
                            setForgotEmail(value);
                          }}
                          autoCapitalize="none"
                          keyboardType="email-address"
                          autoCorrect={false}
                          onSubmitEditing={onForgotPassword}
                        />
                      </FormField>

                      <Pressable
                        accessibilityRole="button"
                        onPress={onForgotPassword}
                        disabled={forgotLoading}
                        style={({ pressed }) => [
                          styles.primaryButton,
                          forgotLoading && styles.disabledButton,
                          pressed && !forgotLoading && styles.primaryButtonPressed,
                        ]}
                      >
                        {forgotLoading ? (
                          <ActivityIndicator color="#fff" />
                        ) : (
                          <Text style={styles.primaryButtonText}>Send reset link</Text>
                        )}
                      </Pressable>

                      <Pressable
                        accessibilityRole="button"
                        onPress={() => openAuth("login")}
                        style={({ pressed }) => [styles.textButton, pressed && styles.pressed]}
                      >
                        <Text style={styles.textButtonText}>Back to log in</Text>
                      </Pressable>
                    </View>
                  ) : authMode === "reset" ? (
                    <View>
                      <FormField label="New password">
                        <TextInput
                          accessibilityLabel="New password"
                          style={styles.input}
                          placeholder="At least 6 characters"
                          placeholderTextColor="#777"
                          value={resetNewPassword}
                          onChangeText={(value) => {
                            setAuthError("");
                            setResetNewPassword(value);
                          }}
                          secureTextEntry
                          autoCapitalize="none"
                          autoCorrect={false}
                          onSubmitEditing={onResetPassword}
                        />
                      </FormField>

                      <Pressable
                        accessibilityRole="button"
                        onPress={onResetPassword}
                        disabled={resetLoading}
                        style={({ pressed }) => [
                          styles.primaryButton,
                          resetLoading && styles.disabledButton,
                          pressed && !resetLoading && styles.primaryButtonPressed,
                        ]}
                      >
                        {resetLoading ? (
                          <ActivityIndicator color="#fff" />
                        ) : (
                          <Text style={styles.primaryButtonText}>Set new password</Text>
                        )}
                      </Pressable>

                      <Pressable
                        accessibilityRole="button"
                        onPress={() => openAuth("login")}
                        style={({ pressed }) => [styles.textButton, pressed && styles.pressed]}
                      >
                        <Text style={styles.textButtonText}>Back to log in</Text>
                      </Pressable>
                    </View>
                  ) : authMode === "login" ? (
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

                      <Pressable
                        accessibilityRole="button"
                        onPress={() => openAuth("forgot")}
                        style={({ pressed }) => [styles.textButton, pressed && styles.pressed]}
                      >
                        <Text style={styles.textButtonText}>Forgot password?</Text>
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
                    <Text style={styles.panelKicker}>{t("waitlist.kicker")}</Text>
                    <Text
                      style={[
                        styles.panelTitle,
                        isPhone && styles.panelTitlePhone,
                      ]}
                    >
                      {t("waitlist.title")}
                    </Text>
                    <Text style={styles.panelText}>
                      {t("waitlist.text")}
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
                          {t("waitlist.join")}
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

          <View style={styles.footer}>
            <View
              style={[
                styles.footerTop,
                isPhone ? styles.footerTopPhone : null,
              ]}
            >
              <View style={styles.footerBrand}>
                <Image
                  source={require("../assets/logo.png")}
                  style={styles.footerLogo}
                  resizeMode="contain"
                  accessibilityLabel="Worka"
                />
                <Text style={styles.footerTagline}>
                  Built for expats, language communities, and trusted local
                  helpers.
                </Text>
              </View>

              <View style={styles.footerContact}>
                <Pressable
                  accessibilityRole="link"
                  onPress={() => Linking.openURL("mailto:support@worka.site")}
                  style={({ pressed }) => [
                    styles.footerLink,
                    pressed && styles.pressed,
                  ]}
                >
                  <MaterialCommunityIcons
                    name="email-outline"
                    size={16}
                    color="#111"
                  />
                  <Text style={styles.footerLinkText}>support@worka.site</Text>
                </Pressable>
                <View style={styles.footerLink}>
                  <MaterialCommunityIcons
                    name="shield-check-outline"
                    size={16}
                    color="#111"
                  />
                  <Text style={styles.footerLinkText}>
                    Payments secured by Stripe
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.footerLegal}>
              <Text style={styles.footerLegalText}>
                © {new Date().getFullYear()} Worka
              </Text>
              <View style={styles.footerLegalLinks}>
                <Pressable
                  accessibilityRole="link"
                  onPress={() => Linking.openURL("https://worka.site/privacy.html")}
                  style={({ pressed }) => [pressed && styles.pressed]}
                >
                  <Text style={styles.footerLegalLink}>Privacy</Text>
                </Pressable>
                <Text style={styles.footerLegalText}>·</Text>
                <Pressable
                  accessibilityRole="link"
                  onPress={() => Linking.openURL("https://worka.site/terms.html")}
                  style={({ pressed }) => [pressed && styles.pressed]}
                >
                  <Text style={styles.footerLegalLink}>Terms</Text>
                </Pressable>
              </View>
              <Text style={styles.footerMark}>LSL</Text>
            </View>
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
  header: {
    width: "100%",
    borderBottomWidth: 1,
    borderBottomColor: "#ece7dc",
    paddingBottom: 18,
    marginBottom: 44,
    gap: 14,
  },
  headerPhone: {
    paddingBottom: 14,
    marginBottom: 30,
  },
  nav: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  navRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    flexShrink: 1,
    minWidth: 0,
  },
  navLangs: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  logo: {
    width: 150,
    height: 60,
    flexShrink: 0,
  },
  logoPhone: {
    width: 116,
    height: 46,
  },
  navButton: {
    ...webPressTransition,
    minHeight: 44,
    flexGrow: 0,
    flexShrink: 0,
    flexBasis: "auto",
    borderWidth: 1,
    borderColor: "#111",
    borderRadius: 999,
    paddingHorizontal: 18,
    paddingVertical: 10,
    backgroundColor: "#111",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  navButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: 0.2,
    textAlign: "center",
  },
  languageRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
  },
  languageChip: {
    ...webPressTransition,
    minHeight: 34,
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 999,
    paddingHorizontal: 12,
    backgroundColor: "#fff",
  },
  languageChipActive: {
    backgroundColor: "#111",
    borderColor: "#111",
  },
  languageChipText: {
    color: "#111",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 0.4,
  },
  languageChipTextActive: {
    color: "#fff",
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
    ...webPressTransition,
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
    ...webPressTransition,
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
    // Not `flex: 0` — react-native-web compiles that to flex-basis: 0%,
    // which collapses the card's HEIGHT inside the stacked (column) list.
    flexGrow: 0,
    flexShrink: 0,
    flexBasis: "auto",
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
    ...webPressTransition,
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
    ...webPressTransition,
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
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
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
    ...webPressTransition,
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
    ...webPressTransition,
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
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
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
    borderTopColor: "#ece7dc",
    marginTop: 60,
    paddingTop: 28,
  },
  footerTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 24,
  },
  footerTopPhone: {
    flexDirection: "column",
    alignItems: "flex-start",
    gap: 18,
  },
  footerBrand: {
    flexShrink: 1,
    minWidth: 0,
    maxWidth: 420,
    gap: 10,
  },
  footerLogo: {
    width: 96,
    height: 38,
    marginLeft: -4,
  },
  footerTagline: {
    color: "#62645c",
    fontSize: 13,
    lineHeight: 20,
    fontWeight: "600",
  },
  footerContact: {
    gap: 10,
    alignItems: "flex-start",
  },
  footerLink: {
    ...webPressTransition,
    minHeight: 32,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  footerLinkText: {
    color: "#111",
    fontSize: 13,
    fontWeight: "800",
  },
  footerLegal: {
    marginTop: 26,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#f1ede4",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  footerLegalText: {
    color: "#8a8d84",
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.2,
  },
  footerMark: {
    color: "#b0b2a9",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 4,
  },
  footerLegalLinks: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  footerLegalLink: {
    color: "#8a8d84",
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.2,
  },
});

export default AuthScreen;
