import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useAuthActions } from "@convex-dev/auth/react";
import { useMutation } from "convex/react";
import * as AppleAuthentication from "expo-apple-authentication";
import * as Crypto from "expo-crypto";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  View,
} from "react-native";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Text } from "@/components/ui/text";
import { ModalHeader } from "@/components/ModalHeader";
import { useNotification } from "@/components/NotificationContext";
import { useLocalization } from "@/localization/LocalizationProvider";
import { useConvexAuth } from "@/pages/root-layout/ConvexAuthProvider";
import { api } from "@/convex/_generated/api";

type AuthMode = "sign-in" | "sign-up";

export default function SignInScreen() {
  const { t } = useLocalization();
  const router = useRouter();
  const { signIn } = useAuthActions();
  const { showNotification } = useNotification();
  const { anonymousUserId, clearAnonymousUserId } = useConvexAuth();
  const linkAnonymousData = useMutation(api.accountLinking.linkAnonymousData);

  const [mode, setMode] = useState<AuthMode>("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const isSignUp = mode === "sign-up";

  // Helper function to link anonymous data after successful authentication
  const handleAccountLinking = async () => {
    if (anonymousUserId) {
      try {
        console.log("🔗 Linking anonymous data...", anonymousUserId);
        const result = await linkAnonymousData({ anonymousUserId });
        if (result.linked) {
          console.log("✅ Account linked successfully:", result);
          showNotification(
            t("auth.dataLinked", {
              defaultValue: "Your existing data has been linked to your account!",
            }),
            "success"
          );
        }
        await clearAnonymousUserId();
      } catch (error) {
        console.error("Failed to link anonymous data:", error);
        // Don't block the sign-in flow if linking fails
      }
    }
  };

  const handleEmailAuth = async () => {
    if (!email.trim() || !password.trim()) {
      showNotification(
        t("auth.fillAllFields", { defaultValue: "Please fill in all fields" }),
        "error"
      );
      return;
    }

    if (isSignUp && password !== confirmPassword) {
      showNotification(
        t("auth.passwordMismatch", { defaultValue: "Passwords do not match" }),
        "error"
      );
      return;
    }

    if (password.length < 8) {
      showNotification(
        t("auth.passwordTooShort", {
          defaultValue: "Password must be at least 8 characters",
        }),
        "error"
      );
      return;
    }

    setIsLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const formData = new FormData();
      formData.append("email", email.trim().toLowerCase());
      formData.append("password", password);
      formData.append("flow", isSignUp ? "signUp" : "signIn");

      const result = await signIn("password", formData);

      if (result.signingIn) {
        // Link anonymous data to the new account
        await handleAccountLinking();

        showNotification(
          isSignUp
            ? t("auth.accountCreated", {
                defaultValue: "Account created successfully!",
              })
            : t("auth.signedIn", { defaultValue: "Signed in successfully!" }),
          "success"
        );
        router.replace("/(tabs)/tracking");
      }
    } catch (error: any) {
      console.error("Email auth error:", error);
      const message =
        error?.message || isSignUp
          ? t("auth.signUpError", {
              defaultValue: "Failed to create account. Please try again.",
            })
          : t("auth.signInError", {
              defaultValue: "Invalid email or password.",
            });
      showNotification(message, "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAppleSignIn = async () => {
    setIsLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      // Generate nonce for security
      const nonce = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        Math.random().toString()
      );

      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
        nonce,
      });

      if (credential.identityToken) {
        const result = await signIn("apple", {
          idToken: credential.identityToken,
          nonce,
        });

        if (result.signingIn) {
          // Link anonymous data to the new account
          await handleAccountLinking();

          showNotification(
            t("auth.signedIn", { defaultValue: "Signed in successfully!" }),
            "success"
          );
          router.replace("/(tabs)/tracking");
        }
      }
    } catch (error: any) {
      if (error.code !== "ERR_REQUEST_CANCELED") {
        console.error("Apple sign in error:", error);
        showNotification(
          t("auth.appleSignInError", {
            defaultValue: "Apple sign in failed. Please try again.",
          }),
          "error"
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      // For Google Sign In, we'll use the OAuth redirect flow
      const result = await signIn("google");

      if (result.redirect) {
        // Open the redirect URL in browser for OAuth
        // This will be handled by the Convex auth callback
        showNotification(
          t("auth.redirecting", { defaultValue: "Redirecting to Google..." }),
          "info"
        );
      } else if (result.signingIn) {
        // Link anonymous data to the new account
        await handleAccountLinking();

        showNotification(
          t("auth.signedIn", { defaultValue: "Signed in successfully!" }),
          "success"
        );
        router.replace("/(tabs)/tracking");
      }
    } catch (error: any) {
      console.error("Google sign in error:", error);
      showNotification(
        t("auth.googleSignInError", {
          defaultValue: "Google sign in failed. Please try again.",
        }),
        "error"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={{ flex: 1 }}
      className="bg-background"
    >
      <View className="flex-1 bg-background">
        <ModalHeader
          title={
            isSignUp
              ? t("auth.createAccount", { defaultValue: "Create Account" })
              : t("auth.signIn", { defaultValue: "Sign In" })
          }
          closeLabel={t("common.close")}
        />

        <ScrollView
          contentContainerClassName="px-6 pb-10 pt-4"
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Benefits Banner */}
          <View className="mb-6 rounded-2xl bg-primary/10 p-4">
            <Text className="mb-2 text-center text-base font-semibold text-primary">
              {t("auth.whySignIn", { defaultValue: "Why sign in?" })}
            </Text>
            <View className="gap-1">
              <Text className="text-center text-sm text-muted-foreground">
                {t("auth.benefit1", {
                  defaultValue: "Sync data across all your devices",
                })}
              </Text>
              <Text className="text-center text-sm text-muted-foreground">
                {t("auth.benefit2", {
                  defaultValue: "Never lose your baby's precious memories",
                })}
              </Text>
              <Text className="text-center text-sm text-muted-foreground">
                {t("auth.benefit3", {
                  defaultValue: "Share access with family members",
                })}
              </Text>
            </View>
          </View>

          {/* Social Sign In Buttons */}
          <View className="mb-6 gap-3">
            {Platform.OS === "ios" && (
              <AppleAuthentication.AppleAuthenticationButton
                buttonType={
                  AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN
                }
                buttonStyle={
                  AppleAuthentication.AppleAuthenticationButtonStyle.BLACK
                }
                cornerRadius={12}
                style={{ height: 50 }}
                onPress={handleAppleSignIn}
              />
            )}

            <Button
              variant="outline"
              className="h-[50px] flex-row items-center justify-center gap-3"
              onPress={handleGoogleSignIn}
              disabled={isLoading}
            >
              <MaterialCommunityIcons name="google" size={20} color="#4285F4" />
              <Text className="text-base font-semibold text-foreground">
                {t("auth.continueWithGoogle", {
                  defaultValue: "Continue with Google",
                })}
              </Text>
            </Button>
          </View>

          {/* Divider */}
          <View className="mb-6 flex-row items-center gap-4">
            <View className="h-px flex-1 bg-border" />
            <Text className="text-sm text-muted-foreground">
              {t("auth.orContinueWith", { defaultValue: "or continue with email" })}
            </Text>
            <View className="h-px flex-1 bg-border" />
          </View>

          {/* Email Form */}
          <View className="gap-4">
            <View>
              <Label className="mb-2 text-base font-semibold text-muted-foreground">
                {t("auth.email", { defaultValue: "Email" })}
              </Label>
              <Input
                value={email}
                onChangeText={setEmail}
                placeholder="you@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                className="h-12 text-base"
                editable={!isLoading}
              />
            </View>

            <View>
              <Label className="mb-2 text-base font-semibold text-muted-foreground">
                {t("auth.password", { defaultValue: "Password" })}
              </Label>
              <View className="relative">
                <Input
                  value={password}
                  onChangeText={setPassword}
                  placeholder="********"
                  secureTextEntry={!showPassword}
                  className="h-12 pr-12 text-base"
                  editable={!isLoading}
                />
                <Pressable
                  onPress={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3"
                >
                  <MaterialCommunityIcons
                    name={showPassword ? "eye-off" : "eye"}
                    size={24}
                    color="#999"
                  />
                </Pressable>
              </View>
            </View>

            {isSignUp && (
              <View>
                <Label className="mb-2 text-base font-semibold text-muted-foreground">
                  {t("auth.confirmPassword", {
                    defaultValue: "Confirm Password",
                  })}
                </Label>
                <Input
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="********"
                  secureTextEntry={!showPassword}
                  className="h-12 text-base"
                  editable={!isLoading}
                />
              </View>
            )}

            <Button
              onPress={handleEmailAuth}
              disabled={isLoading}
              className="h-12"
            >
              {isLoading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text className="text-base font-semibold text-primary-foreground">
                  {isSignUp
                    ? t("auth.createAccountBtn", {
                        defaultValue: "Create Account",
                      })
                    : t("auth.signInBtn", { defaultValue: "Sign In" })}
                </Text>
              )}
            </Button>
          </View>

          {/* Toggle Sign In / Sign Up */}
          <Pressable
            onPress={() => {
              Haptics.selectionAsync();
              setMode(isSignUp ? "sign-in" : "sign-up");
              setConfirmPassword("");
            }}
            className="mt-6 py-2"
          >
            <Text className="text-center text-base text-muted-foreground">
              {isSignUp
                ? t("auth.alreadyHaveAccount", {
                    defaultValue: "Already have an account?",
                  })
                : t("auth.dontHaveAccount", {
                    defaultValue: "Don't have an account?",
                  })}{" "}
              <Text className="font-semibold text-primary">
                {isSignUp
                  ? t("auth.signIn", { defaultValue: "Sign In" })
                  : t("auth.signUp", { defaultValue: "Sign Up" })}
              </Text>
            </Text>
          </Pressable>

          {/* Privacy Note */}
          <Text className="mt-6 text-center text-xs text-muted-foreground">
            {t("auth.privacyNote", {
              defaultValue:
                "By signing in, you agree to our Terms of Service and Privacy Policy. Your data is encrypted and secure.",
            })}
          </Text>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}
