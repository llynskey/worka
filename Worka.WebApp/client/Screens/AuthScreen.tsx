import React, { useContext, useState } from "react";
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

const AuthScreen: React.FC = () => {
  const { signInWithToken } = useContext(AuthContext);
  const { width, height } = useWindowDimensions();
  const isNarrow = width < 780;
  const isDesktopWeb = Platform.OS === "web" && !isNarrow;
  const isShortDesktop = isDesktopWeb && height < 1020;
  const horizontalGutter = isNarrow ? 16 : 24;
  const contentWidth = Math.min(
    Math.max(width - horizontalGutter * 2, 0),
    1180,
  );
  const contentShell = {
    width: contentWidth,
    alignSelf: "center",
  } as const;
  const inputStyle = [styles.input, isShortDesktop && styles.inputCompact];
  const primaryButtonStyle = [
    styles.primaryButton,
    isShortDesktop && styles.buttonCompact,
  ];
  const secondaryButtonStyle = [
    styles.secondaryButton,
    isShortDesktop && styles.secondaryButtonCompact,
  ];
  const panelTitleStyle = [
    styles.panelTitle,
    isShortDesktop && styles.panelTitleCompact,
  ];
  const desktopPanelMaxHeight = isDesktopWeb
    ? Math.max(420, height - (isShortDesktop ? 82 : 126))
    : undefined;
  const formPanelBodyStyle = isDesktopWeb
    ? ([
        styles.formPanelBody,
        {
          maxHeight: desktopPanelMaxHeight
            ? desktopPanelMaxHeight - (isShortDesktop ? 28 : 44)
            : undefined,
          overflowY: "auto",
        },
      ] as any)
    : styles.formPanelBody;

  const [interestForm, setInterestForm] = useState(emptyInterestForm);
  const [interestLoading, setInterestLoading] = useState(false);
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
    setInterestForm((current) => ({ ...current, [name]: value }));
  };

  const updateSignupField = (name: keyof typeof signupForm, value: string) => {
    setSignupForm((current) => ({ ...current, [name]: value }));
  };

  const registerInterest = async () => {
    if (!interestForm.name.trim()) {
      Alert.alert("Add your name", "Tell us who to contact.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(interestForm.email.trim())) {
      Alert.alert("Add a valid email", "We need an email to send your invite.");
      return;
    }

    if (!interestForm.language.trim()) {
      Alert.alert(
        "Add a language",
        "Tell us which language you need or can offer.",
      );
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
      Alert.alert(
        "Could not register interest",
        getErrorMessage(error, "Please try again in a moment."),
      );
    } finally {
      setInterestLoading(false);
    }
  };

  const onLogin = async () => {
    setAuthError("");
    if (!loginEmail.trim() || !password) {
      setAuthError("Enter email and password.");
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
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(signupForm.email.trim()))
      return "Enter a valid email.";
    if (signupForm.password.length < 6)
      return "Password must be at least 6 characters.";
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

  const viewportStyle =
    Platform.OS === "web"
      ? ({ height: "100vh", maxHeight: "100vh", overflow: "hidden" } as any)
      : null;

  const scrollStyle =
    Platform.OS === "web"
      ? ([
          styles.scroll,
          {
            height: "100%",
            maxHeight: "100%",
            overflowY: isNarrow ? "auto" : "hidden",
          },
        ] as any)
      : styles.scroll;

  return (
    <KeyboardAvoidingView
      style={[styles.keyboard, viewportStyle]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        style={scrollStyle}
        contentContainerStyle={[
          styles.page,
          {
            minHeight: height,
            height: isDesktopWeb ? height : undefined,
            maxHeight: isDesktopWeb ? height : undefined,
            paddingTop: isNarrow ? 24 : isShortDesktop ? 12 : 18,
            paddingBottom: isNarrow ? 48 : isShortDesktop ? 12 : 18,
            overflow: isDesktopWeb ? "hidden" : "visible",
          },
        ]}
        keyboardShouldPersistTaps="handled"
        scrollEnabled={Platform.OS !== "web" || isNarrow}
        showsVerticalScrollIndicator={Platform.OS !== "web" || isNarrow}
        nestedScrollEnabled
      >
        <View
          style={[
            styles.nav,
            contentShell,
            { marginBottom: isNarrow ? 34 : isShortDesktop ? 6 : 26 },
          ]}
        >
          <Image
            source={require("../assets/logo.png")}
            style={[
              styles.logo,
              isNarrow && styles.logoMobile,
              isShortDesktop && styles.logoCompact,
            ]}
            resizeMode="contain"
          />
          <Pressable
            style={styles.navAction}
            onPress={() => {
              setShowLogin((value) => !value);
              setAuthMode("login");
              setAuthError("");
            }}
          >
            <MaterialCommunityIcons
              name="lock-outline"
              size={16}
              color="#111"
            />
            <Text style={styles.navActionText}>
              {showLogin ? "Waitlist" : "Early access"}
            </Text>
          </Pressable>
        </View>

        <View
          style={[
            styles.heroGrid,
            contentShell,
            {
              flexDirection: isNarrow ? "column" : "row",
              flex: isDesktopWeb ? 1 : undefined,
              minHeight: 0,
            },
          ]}
        >
          <View style={styles.heroCopy}>
            <Text
              style={[styles.eyebrow, isShortDesktop && styles.eyebrowCompact]}
            >
              Worka for expats
            </Text>
            <Text
              style={[
                styles.heroTitle,
                {
                  fontSize: isNarrow ? 35 : 58,
                  lineHeight: isNarrow ? 41 : 64,
                  maxWidth: contentWidth,
                },
                isShortDesktop && styles.heroTitleCompact,
              ]}
            >
              Get things done by someone who speaks your language.
            </Text>
            <Text
              style={[
                styles.heroText,
                isShortDesktop && styles.heroTextCompact,
              ]}
            >
              Worka helps expats find trusted local people for repairs, moving,
              cleaning, forms, installs, and everyday jobs, with language fit
              built in from the start.
            </Text>

            {!isNarrow && !isShortDesktop && (
              <View style={[styles.signalRow, { flexDirection: "row" }]}>
                {launchSignals.map((signal) => (
                  <View key={signal.value} style={styles.signal}>
                    <Text style={styles.signalValue}>{signal.value}</Text>
                    <Text style={styles.signalLabel}>{signal.label}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>

          <View
            style={[
              styles.formPanel,
              !isNarrow && styles.formPanelDesktop,
              isShortDesktop && styles.formPanelCompact,
              isDesktopWeb &&
                ({
                  maxHeight: desktopPanelMaxHeight,
                  minHeight: 0,
                  overflow: "hidden",
                } as any),
            ]}
          >
            <ScrollView
              style={formPanelBodyStyle}
              contentContainerStyle={[
                styles.formPanelBodyContent,
                isShortDesktop && styles.formPanelBodyContentCompact,
              ]}
              keyboardShouldPersistTaps="handled"
              nestedScrollEnabled
              scrollEnabled={isDesktopWeb}
              showsVerticalScrollIndicator={false}
            >
              {showLogin ? (
                <>
                  <Text
                    style={[
                      styles.panelKicker,
                      isShortDesktop && styles.panelKickerCompact,
                    ]}
                  >
                    Builder access
                  </Text>
                  <Text style={panelTitleStyle}>
                    {authMode === "login"
                      ? "Sign in to Worka."
                      : "Create your Worka account."}
                  </Text>

                  <View
                    style={[
                      styles.authSwitch,
                      isShortDesktop && styles.authSwitchCompact,
                    ]}
                  >
                    <Pressable
                      style={[
                        styles.authSwitchOption,
                        authMode === "login" && styles.authSwitchOptionActive,
                      ]}
                      onPress={() => {
                        setAuthMode("login");
                        setAuthError("");
                      }}
                    >
                      <Text
                        style={[
                          styles.authSwitchText,
                          authMode === "login" && styles.authSwitchTextActive,
                        ]}
                      >
                        Log in
                      </Text>
                    </Pressable>
                    <Pressable
                      style={[
                        styles.authSwitchOption,
                        authMode === "signup" && styles.authSwitchOptionActive,
                      ]}
                      onPress={() => {
                        setAuthMode("signup");
                        setAuthError("");
                      }}
                    >
                      <Text
                        style={[
                          styles.authSwitchText,
                          authMode === "signup" && styles.authSwitchTextActive,
                        ]}
                      >
                        Create account
                      </Text>
                    </Pressable>
                  </View>

                  {authError ? (
                    <View style={styles.errorBox}>
                      <MaterialCommunityIcons
                        name="alert-circle-outline"
                        size={18}
                        color="#111"
                      />
                      <Text style={styles.errorText}>{authError}</Text>
                    </View>
                  ) : null}

                  {authMode === "login" ? (
                    <>
                      <TextInput
                        style={inputStyle}
                        placeholder="Email"
                        placeholderTextColor="#6b6b6b"
                        value={loginEmail}
                        onChangeText={setLoginEmail}
                        autoCapitalize="none"
                        keyboardType="email-address"
                      />
                      <TextInput
                        style={inputStyle}
                        placeholder="Password"
                        placeholderTextColor="#6b6b6b"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                        onSubmitEditing={onLogin}
                      />
                      <Pressable
                        onPress={onLogin}
                        disabled={loginLoading}
                        style={[
                          styles.primaryButton,
                          isShortDesktop && styles.buttonCompact,
                          loginLoading && styles.disabledButton,
                        ]}
                      >
                        {loginLoading ? (
                          <ActivityIndicator color="#fff" />
                        ) : (
                          <>
                            <MaterialCommunityIcons
                              name="login"
                              size={19}
                              color="#fff"
                            />
                            <Text style={styles.primaryButtonText}>Log in</Text>
                          </>
                        )}
                      </Pressable>
                      <Pressable
                        onPress={() => {
                          setAuthMode("signup");
                          setAuthError("");
                        }}
                        style={secondaryButtonStyle}
                      >
                        <MaterialCommunityIcons
                          name="account-plus-outline"
                          size={19}
                          color="#111"
                        />
                        <Text style={styles.secondaryButtonText}>
                          Create account instead
                        </Text>
                      </Pressable>
                    </>
                  ) : (
                    <>
                      <View style={styles.accountTypeGrid}>
                        {accountTypes.map((type) => {
                          const selected = accountType === type.value;
                          return (
                            <Pressable
                              key={type.value}
                              style={[
                                styles.accountTypeCard,
                                isShortDesktop && styles.accountTypeCardCompact,
                                selected && styles.accountTypeCardActive,
                              ]}
                              onPress={() => setAccountType(type.value)}
                            >
                              <MaterialCommunityIcons
                                name={type.icon}
                                size={isShortDesktop ? 20 : 24}
                                color={selected ? "#fff" : "#111"}
                              />
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
                            </Pressable>
                          );
                        })}
                      </View>

                      <TextInput
                        style={inputStyle}
                        placeholder="First name"
                        placeholderTextColor="#6b6b6b"
                        value={signupForm.firstName}
                        onChangeText={(value) =>
                          updateSignupField("firstName", value)
                        }
                        autoCapitalize="words"
                      />
                      <TextInput
                        style={inputStyle}
                        placeholder="Last name"
                        placeholderTextColor="#6b6b6b"
                        value={signupForm.lastName}
                        onChangeText={(value) =>
                          updateSignupField("lastName", value)
                        }
                        autoCapitalize="words"
                      />
                      <TextInput
                        style={inputStyle}
                        placeholder="Email"
                        placeholderTextColor="#6b6b6b"
                        value={signupForm.email}
                        onChangeText={(value) =>
                          updateSignupField("email", value)
                        }
                        autoCapitalize="none"
                        keyboardType="email-address"
                      />
                      <TextInput
                        style={inputStyle}
                        placeholder="Password"
                        placeholderTextColor="#6b6b6b"
                        value={signupForm.password}
                        onChangeText={(value) =>
                          updateSignupField("password", value)
                        }
                        secureTextEntry
                        onSubmitEditing={onSignup}
                      />

                      <Pressable
                        onPress={onSignup}
                        disabled={signupLoading}
                        style={[
                          styles.primaryButton,
                          isShortDesktop && styles.buttonCompact,
                          signupLoading && styles.disabledButton,
                        ]}
                      >
                        {signupLoading ? (
                          <ActivityIndicator color="#fff" />
                        ) : (
                          <>
                            <MaterialCommunityIcons
                              name="account-plus-outline"
                              size={19}
                              color="#fff"
                            />
                            <Text style={styles.primaryButtonText}>
                              Create account
                            </Text>
                          </>
                        )}
                      </Pressable>
                      <Pressable
                        onPress={() => {
                          setAuthMode("login");
                          setAuthError("");
                        }}
                        style={secondaryButtonStyle}
                      >
                        <MaterialCommunityIcons
                          name="login"
                          size={19}
                          color="#111"
                        />
                        <Text style={styles.secondaryButtonText}>
                          I already have an account
                        </Text>
                      </Pressable>
                    </>
                  )}
                </>
              ) : registered ? (
                <View style={styles.successPanel}>
                  <View style={styles.successIcon}>
                    <MaterialCommunityIcons
                      name="check"
                      size={28}
                      color="#fff"
                    />
                  </View>
                  <Text style={panelTitleStyle}>You are on the list.</Text>
                  <Text style={styles.panelText}>
                    Thanks. I will use your language and location to shape the
                    first Worka launch areas.
                  </Text>
                  <TouchableOpacity
                    style={secondaryButtonStyle}
                    onPress={() => {
                      setRegistered(false);
                      setInterestForm(emptyInterestForm);
                    }}
                  >
                    <Text style={styles.secondaryButtonText}>
                      Add another person
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.linkButton}
                    onPress={() => {
                      setShowLogin(true);
                      setAuthMode("signup");
                      setAuthError("");
                    }}
                  >
                    <Text style={styles.linkButtonText}>
                      Create a Worka account
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <>
                  <Text
                    style={[
                      styles.panelKicker,
                      isShortDesktop && styles.panelKickerCompact,
                    ]}
                  >
                    Register interest
                  </Text>
                  <Text style={panelTitleStyle}>Join the expat waitlist.</Text>
                  <Text
                    style={[
                      styles.panelText,
                      isShortDesktop && styles.panelTextCompact,
                    ]}
                  >
                    Tell us where you are, which language matters, and whether
                    you need help or can offer it.
                  </Text>

                  <TextInput
                    style={inputStyle}
                    placeholder="Name"
                    placeholderTextColor="#6b6b6b"
                    value={interestForm.name}
                    onChangeText={(value) => updateInterestField("name", value)}
                  />
                  <TextInput
                    style={inputStyle}
                    placeholder="Email"
                    placeholderTextColor="#6b6b6b"
                    value={interestForm.email}
                    onChangeText={(value) =>
                      updateInterestField("email", value)
                    }
                    autoCapitalize="none"
                    keyboardType="email-address"
                  />
                  <TextInput
                    style={inputStyle}
                    placeholder="Language needed or offered"
                    placeholderTextColor="#6b6b6b"
                    value={interestForm.language}
                    onChangeText={(value) =>
                      updateInterestField("language", value)
                    }
                  />
                  <TextInput
                    style={inputStyle}
                    placeholder="City / country"
                    placeholderTextColor="#6b6b6b"
                    value={interestForm.location}
                    onChangeText={(value) =>
                      updateInterestField("location", value)
                    }
                  />

                  <View style={styles.roleGroup}>
                    {audienceOptions.map((option) => {
                      const selected = interestForm.role === option;
                      return (
                        <Pressable
                          key={option}
                          style={[
                            styles.roleChip,
                            isShortDesktop && styles.roleChipCompact,
                            selected && styles.roleChipActive,
                          ]}
                          onPress={() => updateInterestField("role", option)}
                        >
                          <Text
                            style={[
                              styles.roleChipText,
                              selected && styles.roleChipTextActive,
                            ]}
                          >
                            {option}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>

                  <TextInput
                    style={[
                      inputStyle,
                      styles.textArea,
                      isShortDesktop && styles.textAreaCompact,
                    ]}
                    placeholder="What work or language gap should Worka solve first?"
                    placeholderTextColor="#6b6b6b"
                    value={interestForm.message}
                    onChangeText={(value) =>
                      updateInterestField("message", value)
                    }
                    multiline
                  />

                  <TouchableOpacity
                    onPress={registerInterest}
                    disabled={interestLoading}
                    style={primaryButtonStyle}
                  >
                    {interestLoading ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <>
                        <MaterialCommunityIcons
                          name="arrow-right"
                          size={19}
                          color="#fff"
                        />
                        <Text style={styles.primaryButtonText}>
                          Join the list
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => {
                      setShowLogin(true);
                      setAuthMode("signup");
                      setAuthError("");
                    }}
                    style={secondaryButtonStyle}
                  >
                    <MaterialCommunityIcons
                      name="account-plus-outline"
                      size={19}
                      color="#111"
                    />
                    <Text style={styles.secondaryButtonText}>
                      Create account now
                    </Text>
                  </TouchableOpacity>
                </>
              )}
            </ScrollView>
          </View>

          {isNarrow && (
            <View
              style={[
                styles.signalRow,
                { flexDirection: "column", marginTop: 0 },
              ]}
            >
              {launchSignals.map((signal) => (
                <View key={signal.value} style={styles.signal}>
                  <Text style={styles.signalValue}>{signal.value}</Text>
                  <Text style={styles.signalLabel}>{signal.label}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {(isNarrow || !isShortDesktop) && (
          <View
            style={[
              styles.footer,
              contentShell,
              { flexDirection: isNarrow ? "column" : "row" },
            ]}
          >
            <Text style={styles.footerText}>
              Built for expats, language communities, and trusted local helpers.
            </Text>
            <Text style={styles.footerText}>Black. White. Clear.</Text>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  keyboard: {
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
    paddingHorizontal: 0,
    paddingVertical: 24,
  },
  nav: {
    maxWidth: 1180,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  logo: {
    width: 156,
    height: 68,
  },
  logoMobile: {
    width: 126,
    height: 54,
  },
  logoCompact: {
    width: 128,
    height: 50,
  },
  navAction: {
    borderWidth: 1,
    borderColor: "#111",
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 9,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  navActionText: {
    color: "#111",
    fontWeight: "800",
    fontSize: 13,
  },
  heroGrid: {
    maxWidth: 1180,
    alignSelf: "center",
    alignItems: "stretch",
    gap: 28,
  },
  heroCopy: {
    flex: 1.14,
    justifyContent: "center",
    minWidth: 0,
  },
  eyebrow: {
    color: "#111",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 0,
    textTransform: "uppercase",
    marginBottom: 18,
  },
  eyebrowCompact: {
    marginBottom: 10,
  },
  heroTitle: {
    color: "#000",
    fontWeight: "900",
    letterSpacing: 0,
    maxWidth: 760,
  },
  heroTitleCompact: {
    fontSize: 42,
    lineHeight: 47,
  },
  heroText: {
    color: "#222",
    fontSize: 18,
    lineHeight: 28,
    marginTop: 22,
    maxWidth: 650,
  },
  heroTextCompact: {
    fontSize: 15,
    lineHeight: 23,
    marginTop: 14,
  },
  signalRow: {
    gap: 12,
    marginTop: 34,
  },
  signal: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#111",
    borderRadius: 8,
    padding: 16,
    backgroundColor: "#fff",
  },
  signalValue: {
    color: "#000",
    fontSize: 16,
    fontWeight: "900",
    marginBottom: 6,
  },
  signalLabel: {
    color: "#333",
    lineHeight: 20,
  },
  formPanel: {
    flex: 0.86,
    borderWidth: 1,
    borderColor: "#000",
    borderRadius: 8,
    padding: 22,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 10, height: 10 },
    shadowOpacity: 1,
    shadowRadius: 0,
    minHeight: 0,
  },
  formPanelDesktop: {
    minWidth: 380,
  },
  formPanelCompact: {
    padding: 14,
    shadowOffset: { width: 8, height: 8 },
  },
  formPanelBody: {
    minHeight: 0,
  },
  formPanelBodyContent: {
    paddingBottom: 2,
  },
  formPanelBodyContentCompact: {
    paddingBottom: 1,
  },
  panelKicker: {
    color: "#111",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 0,
    textTransform: "uppercase",
    marginBottom: 10,
  },
  panelKickerCompact: {
    marginBottom: 6,
  },
  panelTitle: {
    color: "#000",
    fontSize: 28,
    lineHeight: 34,
    fontWeight: "900",
    marginBottom: 10,
  },
  panelTitleCompact: {
    fontSize: 22,
    lineHeight: 27,
    marginBottom: 6,
  },
  panelText: {
    color: "#333",
    lineHeight: 22,
    marginBottom: 18,
  },
  panelTextCompact: {
    lineHeight: 19,
    marginBottom: 10,
  },
  input: {
    minHeight: 50,
    borderWidth: 1,
    borderColor: "#111",
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 12,
    color: "#000",
    backgroundColor: "#fff",
    fontSize: 16,
  },
  inputCompact: {
    minHeight: 34,
    paddingVertical: 6,
    marginBottom: 6,
  },
  textArea: {
    minHeight: 102,
    textAlignVertical: "top",
  },
  textAreaCompact: {
    minHeight: 44,
  },
  roleGroup: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
  },
  roleChip: {
    borderWidth: 1,
    borderColor: "#111",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 9,
    backgroundColor: "#fff",
  },
  roleChipCompact: {
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  roleChipActive: {
    backgroundColor: "#000",
  },
  roleChipText: {
    color: "#111",
    fontWeight: "800",
    fontSize: 13,
  },
  roleChipTextActive: {
    color: "#fff",
  },
  primaryButton: {
    minHeight: 52,
    backgroundColor: "#000",
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  buttonCompact: {
    minHeight: 38,
  },
  disabledButton: {
    opacity: 0.68,
  },
  primaryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "900",
    flexShrink: 1,
    textAlign: "center",
  },
  secondaryButton: {
    minHeight: 50,
    borderWidth: 1,
    borderColor: "#111",
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 14,
    marginTop: 12,
  },
  secondaryButtonCompact: {
    minHeight: 38,
    marginTop: 7,
  },
  secondaryButtonText: {
    color: "#111",
    fontWeight: "900",
    flexShrink: 1,
    textAlign: "center",
  },
  linkButton: {
    alignSelf: "flex-start",
    marginTop: 16,
    paddingVertical: 6,
  },
  linkButtonText: {
    color: "#000",
    fontWeight: "900",
    textDecorationLine: "underline",
  },
  panelHint: {
    color: "#333",
    lineHeight: 20,
    marginTop: 12,
    fontSize: 13,
  },
  authSwitch: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: "#111",
    borderRadius: 8,
    flexDirection: "row",
    marginBottom: 14,
    overflow: "hidden",
  },
  authSwitchCompact: {
    minHeight: 40,
    marginBottom: 9,
  },
  authSwitchOption: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  authSwitchOptionActive: {
    backgroundColor: "#000",
  },
  authSwitchText: {
    color: "#111",
    fontWeight: "900",
  },
  authSwitchTextActive: {
    color: "#fff",
  },
  errorBox: {
    borderWidth: 1,
    borderColor: "#111",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: "#fff",
  },
  errorText: {
    flex: 1,
    color: "#111",
    fontWeight: "800",
    lineHeight: 20,
  },
  accountTypeGrid: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 12,
  },
  accountTypeCard: {
    flex: 1,
    minHeight: 116,
    borderWidth: 1,
    borderColor: "#111",
    borderRadius: 8,
    padding: 12,
    backgroundColor: "#fff",
    justifyContent: "center",
  },
  accountTypeCardCompact: {
    minHeight: 76,
    padding: 9,
  },
  accountTypeCardActive: {
    backgroundColor: "#000",
  },
  accountTypeTitle: {
    color: "#111",
    fontSize: 15,
    fontWeight: "900",
    marginTop: 8,
  },
  accountTypeTitleActive: {
    color: "#fff",
  },
  accountTypeText: {
    color: "#333",
    lineHeight: 18,
    marginTop: 5,
    fontSize: 12,
    fontWeight: "700",
  },
  accountTypeTextActive: {
    color: "#e8e8e8",
  },
  successPanel: {
    minHeight: 330,
    justifyContent: "center",
  },
  successIcon: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: "#000",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  footer: {
    maxWidth: 1180,
    alignSelf: "center",
    borderTopWidth: 1,
    borderTopColor: "#111",
    marginTop: 22,
    paddingTop: 18,
    justifyContent: "space-between",
    gap: 8,
  },
  footerText: {
    color: "#222",
    fontWeight: "700",
  },
});

export default AuthScreen;
