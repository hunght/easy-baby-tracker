import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuthActions } from '@convex-dev/auth/react';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';
import * as Haptics from 'expo-haptics';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useState, useRef, useEffect } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Text } from '@/components/ui/text';
import { ModalHeader } from '@/components/ModalHeader';
import { useNotification } from '@/components/NotificationContext';
import { useLocalization } from '@/localization/LocalizationProvider';

type AuthFlow = 'sign-in' | 'sign-up' | 'verify-email' | 'forgot-password' | 'reset-password';

export default function SignInScreen() {
  const { t } = useLocalization();
  const router = useRouter();
  const { mode } = useLocalSearchParams<{ mode?: string }>();
  const { signIn } = useAuthActions();
  const { showNotification } = useNotification();

  // Auth flow state - check for mode=signup query param
  const [flow, setFlow] = useState<AuthFlow>(mode === 'signup' ? 'sign-up' : 'sign-in');

  // Update flow when mode changes
  useEffect(() => {
    if (mode === 'signup') {
      setFlow('sign-up');
    }
  }, [mode]);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [otpCode, setOtpCode] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // OTP input refs
  const otpRefs = useRef<(TextInput | null)[]>([]);

  const isSignUp = flow === 'sign-up';
  const isVerifyEmail = flow === 'verify-email';
  const isForgotPassword = flow === 'forgot-password';
  const isResetPassword = flow === 'reset-password';

  // Get the full OTP code as string
  const getOtpString = () => otpCode.join('');

  // Handle OTP input change
  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) {
      // Handle paste - distribute characters across inputs
      const chars = value.slice(0, 6).split('');
      const newOtp = [...otpCode];
      chars.forEach((char, i) => {
        if (index + i < 6) {
          newOtp[index + i] = char;
        }
      });
      setOtpCode(newOtp);
      // Focus last filled input or next empty
      const nextIndex = Math.min(index + chars.length, 5);
      otpRefs.current[nextIndex]?.focus();
    } else {
      const newOtp = [...otpCode];
      newOtp[index] = value;
      setOtpCode(newOtp);
      // Auto-focus next input
      if (value && index < 5) {
        otpRefs.current[index + 1]?.focus();
      }
    }
  };

  // Handle OTP backspace
  const handleOtpKeyPress = (index: number, key: string) => {
    if (key === 'Backspace' && !otpCode[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  // Reset OTP state
  const resetOtp = () => {
    setOtpCode(['', '', '', '', '', '']);
  };

  // Handle Sign In
  const handleSignIn = async () => {
    if (!email.trim() || !password.trim()) {
      showNotification(
        t('auth.fillAllFields', { defaultValue: 'Please fill in all fields' }),
        'error'
      );
      return;
    }

    setIsLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const formData = new FormData();
      formData.append('email', email.trim().toLowerCase());
      formData.append('password', password);
      formData.append('flow', 'signIn');

      const result = await signIn('password', formData);
      console.log('Sign in result:', result);

      if (result.signingIn) {
        showNotification(
          t('auth.signedIn', { defaultValue: 'Signed in successfully!' }),
          'success'
        );
        router.replace('/(tabs)/tracking');
      } else {
        // Email verification required
        showNotification(
          t('auth.verificationRequired', {
            defaultValue: 'Please verify your email. Check your inbox for a code.',
          }),
          'info'
        );
        setFlow('verify-email');
        resetOtp();
      }
    } catch (error) {
      console.error('Sign in error:', error);
      showNotification(
        t('auth.signInError', { defaultValue: 'Invalid email or password.' }),
        'error'
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Sign Up - sends OTP to email
  const handleSignUp = async () => {
    if (!email.trim() || !password.trim()) {
      showNotification(
        t('auth.fillAllFields', { defaultValue: 'Please fill in all fields' }),
        'error'
      );
      return;
    }

    if (password !== confirmPassword) {
      showNotification(
        t('auth.passwordMismatch', { defaultValue: 'Passwords do not match' }),
        'error'
      );
      return;
    }

    if (password.length < 8) {
      showNotification(
        t('auth.passwordTooShort', {
          defaultValue: 'Password must be at least 8 characters',
        }),
        'error'
      );
      return;
    }

    setIsLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const formData = new FormData();
      formData.append('email', email.trim().toLowerCase());
      formData.append('password', password);
      formData.append('flow', 'signUp');

      const result = await signIn('password', formData);

      if (result.signingIn) {
        // Account created without email verification
        showNotification(
          t('auth.accountCreated', { defaultValue: 'Account created successfully!' }),
          'success'
        );
        router.replace('/(tabs)/tracking');
      } else {
        // Email verification required - show OTP screen
        showNotification(
          t('auth.verificationSent', {
            defaultValue: 'Verification code sent to your email',
          }),
          'success'
        );
        setFlow('verify-email');
        resetOtp();
      }
    } catch (error) {
      console.error('Sign up error:', error);
      // Check if email verification is needed
      const errorMessage = error instanceof Error ? error.message : '';
      if (errorMessage.includes('email-verification')) {
        showNotification(
          t('auth.verificationSent', {
            defaultValue: 'Verification code sent to your email',
          }),
          'success'
        );
        setFlow('verify-email');
        resetOtp();
      } else {
        showNotification(
          t('auth.signUpError', {
            defaultValue: 'Failed to create account. Please try again.',
          }),
          'error'
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Email Verification with OTP
  const handleVerifyEmail = async () => {
    const code = getOtpString();
    if (code.length !== 6) {
      showNotification(
        t('auth.enterFullCode', { defaultValue: 'Please enter the 6-digit code' }),
        'error'
      );
      return;
    }

    setIsLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const formData = new FormData();
      formData.append('email', email.trim().toLowerCase());
      formData.append('code', code);
      formData.append('flow', 'email-verification');

      const result = await signIn('password', formData);

      if (result.signingIn) {
        showNotification(
          t('auth.emailVerified', { defaultValue: 'Email verified successfully!' }),
          'success'
        );
        router.replace('/(tabs)/tracking');
      }
    } catch (error) {
      console.error('Verification error:', error);
      showNotification(
        t('auth.invalidCode', { defaultValue: 'Invalid verification code' }),
        'error'
      );
      resetOtp();
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Forgot Password - sends reset OTP
  const handleForgotPassword = async () => {
    if (!email.trim()) {
      showNotification(t('auth.enterEmail', { defaultValue: 'Please enter your email' }), 'error');
      return;
    }

    setIsLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const formData = new FormData();
      formData.append('email', email.trim().toLowerCase());
      formData.append('flow', 'reset');

      await signIn('password', formData);

      showNotification(
        t('auth.resetCodeSent', {
          defaultValue: 'Password reset code sent to your email',
        }),
        'success'
      );
      setFlow('reset-password');
      resetOtp();
    } catch (error) {
      console.error('Forgot password error:', error);
      // Even if email doesn't exist, show success for security
      showNotification(
        t('auth.resetCodeSent', {
          defaultValue: 'Password reset code sent to your email',
        }),
        'success'
      );
      setFlow('reset-password');
      resetOtp();
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Password Reset with OTP
  const handleResetPassword = async () => {
    const code = getOtpString();
    if (code.length !== 6) {
      showNotification(
        t('auth.enterFullCode', { defaultValue: 'Please enter the 6-digit code' }),
        'error'
      );
      return;
    }

    if (!newPassword.trim()) {
      showNotification(
        t('auth.enterNewPassword', { defaultValue: 'Please enter a new password' }),
        'error'
      );
      return;
    }

    if (newPassword.length < 8) {
      showNotification(
        t('auth.passwordTooShort', {
          defaultValue: 'Password must be at least 8 characters',
        }),
        'error'
      );
      return;
    }

    setIsLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const formData = new FormData();
      formData.append('email', email.trim().toLowerCase());
      formData.append('code', code);
      formData.append('newPassword', newPassword);
      formData.append('flow', 'reset-verification');

      const result = await signIn('password', formData);

      if (result.signingIn) {
        showNotification(
          t('auth.passwordReset', { defaultValue: 'Password reset successfully!' }),
          'success'
        );
        router.replace('/(tabs)/tracking');
      }
    } catch (error) {
      console.error('Reset password error:', error);
      showNotification(t('auth.invalidCode', { defaultValue: 'Invalid or expired code' }), 'error');
      resetOtp();
    } finally {
      setIsLoading(false);
    }
  };

  const handleAppleSignIn = async () => {
    setIsLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
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
        const result = await signIn('apple', {
          idToken: credential.identityToken,
          nonce,
        });

        if (result.signingIn) {
          showNotification(
            t('auth.signedIn', { defaultValue: 'Signed in successfully!' }),
            'success'
          );
          router.replace('/(tabs)/tracking');
        }
      }
    } catch (error) {
      // Check if user canceled the request
      const isCanceled =
        error != null &&
        typeof error === 'object' &&
        'code' in error &&
        error.code === 'ERR_REQUEST_CANCELED';
      if (!isCanceled) {
        console.error('Apple sign in error:', error);
        showNotification(
          t('auth.appleSignInError', {
            defaultValue: 'Apple sign in failed. Please try again.',
          }),
          'error'
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
      const result = await signIn('google');

      if (result.redirect) {
        showNotification(
          t('auth.redirecting', { defaultValue: 'Redirecting to Google...' }),
          'info'
        );
      } else if (result.signingIn) {
        showNotification(
          t('auth.signedIn', { defaultValue: 'Signed in successfully!' }),
          'success'
        );
        router.replace('/(tabs)/tracking');
      }
    } catch (error) {
      console.error('Google sign in error:', error);
      showNotification(
        t('auth.googleSignInError', {
          defaultValue: 'Google sign in failed. Please try again.',
        }),
        'error'
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Get header title based on flow
  const getHeaderTitle = () => {
    switch (flow) {
      case 'sign-up':
        return t('auth.createAccount', { defaultValue: 'Create Account' });
      case 'verify-email':
        return t('auth.verifyEmail', { defaultValue: 'Verify Email' });
      case 'forgot-password':
        return t('auth.forgotPassword', { defaultValue: 'Forgot Password' });
      case 'reset-password':
        return t('auth.resetPassword', { defaultValue: 'Reset Password' });
      default:
        return t('auth.signIn', { defaultValue: 'Sign In' });
    }
  };

  // Render OTP Input
  const renderOtpInput = () => (
    <View className="mb-6">
      <Text className="mb-4 text-center text-base text-muted-foreground">
        {t('auth.enterCodeSentTo', {
          defaultValue: 'Enter the 6-digit code sent to',
        })}
      </Text>
      <Text className="mb-6 text-center text-base font-semibold text-foreground">{email}</Text>

      <View className="flex-row justify-center gap-2">
        {otpCode.map((digit, index) => (
          <TextInput
            key={index}
            ref={(ref) => {
              otpRefs.current[index] = ref;
            }}
            value={digit}
            onChangeText={(value) => handleOtpChange(index, value)}
            onKeyPress={({ nativeEvent }) => handleOtpKeyPress(index, nativeEvent.key)}
            keyboardType="number-pad"
            maxLength={6}
            className="h-14 w-12 rounded-xl border-2 border-border bg-card text-center text-2xl font-bold text-foreground"
            editable={!isLoading}
            selectTextOnFocus
          />
        ))}
      </View>

      <Pressable
        onPress={() => {
          resetOtp();
          if (isVerifyEmail) {
            handleSignUp();
          } else {
            handleForgotPassword();
          }
        }}
        disabled={isLoading}
        className="mt-4 py-2">
        <Text className="text-center text-sm text-primary">
          {t('auth.resendCode', { defaultValue: 'Resend code' })}
        </Text>
      </Pressable>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
        className="bg-background">
        <View className="flex-1 bg-background">
          <ModalHeader
            title={getHeaderTitle()}
            closeLabel={t('common.close')}
            noTopPadding
            onBack={
              flow !== 'sign-in' && flow !== 'sign-up'
                ? () => {
                    setFlow('sign-in');
                    resetOtp();
                    setNewPassword('');
                  }
                : undefined
            }
          />

          <ScrollView
            contentContainerClassName="px-6 pb-10 pt-4"
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled">
            {/* Email Verification Flow */}
            {isVerifyEmail && (
              <>
                {renderOtpInput()}
                <Button
                  onPress={handleVerifyEmail}
                  disabled={isLoading || getOtpString().length !== 6}
                  className="h-12">
                  {isLoading ? (
                    <ActivityIndicator color="#FFF" />
                  ) : (
                    <Text className="text-base font-semibold text-primary-foreground">
                      {t('auth.verifyBtn', { defaultValue: 'Verify Email' })}
                    </Text>
                  )}
                </Button>
              </>
            )}

            {/* Forgot Password Flow */}
            {isForgotPassword && (
              <>
                <View className="mb-6">
                  <Text className="mb-4 text-center text-base text-muted-foreground">
                    {t('auth.forgotPasswordDesc', {
                      defaultValue:
                        "Enter your email and we'll send you a code to reset your password.",
                    })}
                  </Text>
                </View>

                <View className="mb-4">
                  <Label className="mb-2 text-base font-semibold text-muted-foreground">
                    {t('auth.email', { defaultValue: 'Email' })}
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

                <Button
                  onPress={handleForgotPassword}
                  disabled={isLoading || !email.trim()}
                  className="h-12">
                  {isLoading ? (
                    <ActivityIndicator color="#FFF" />
                  ) : (
                    <Text className="text-base font-semibold text-primary-foreground">
                      {t('auth.sendResetCode', { defaultValue: 'Send Reset Code' })}
                    </Text>
                  )}
                </Button>
              </>
            )}

            {/* Reset Password Flow */}
            {isResetPassword && (
              <>
                {renderOtpInput()}

                <View className="mb-4">
                  <Label className="mb-2 text-base font-semibold text-muted-foreground">
                    {t('auth.newPassword', { defaultValue: 'New Password' })}
                  </Label>
                  <View className="relative">
                    <Input
                      value={newPassword}
                      onChangeText={setNewPassword}
                      placeholder="********"
                      secureTextEntry={!showPassword}
                      className="h-12 pr-12 text-base"
                      editable={!isLoading}
                    />
                    <Pressable
                      onPress={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3">
                      <MaterialCommunityIcons
                        name={showPassword ? 'eye-off' : 'eye'}
                        size={24}
                        color="#999"
                      />
                    </Pressable>
                  </View>
                </View>

                <Button
                  onPress={handleResetPassword}
                  disabled={isLoading || getOtpString().length !== 6 || !newPassword.trim()}
                  className="h-12">
                  {isLoading ? (
                    <ActivityIndicator color="#FFF" />
                  ) : (
                    <Text className="text-base font-semibold text-primary-foreground">
                      {t('auth.resetPasswordBtn', { defaultValue: 'Reset Password' })}
                    </Text>
                  )}
                </Button>
              </>
            )}

            {/* Sign In / Sign Up Flow */}
            {(flow === 'sign-in' || flow === 'sign-up') && (
              <>
                {/* Benefits Banner */}
                <View className="mb-6 rounded-2xl bg-primary/10 p-4">
                  <Text className="mb-2 text-center text-base font-semibold text-primary">
                    {t('auth.whySignIn', { defaultValue: 'Why sign in?' })}
                  </Text>
                  <View className="gap-1">
                    <Text className="text-center text-sm text-muted-foreground">
                      {t('auth.benefit1', { defaultValue: 'Sync data across all your devices' })}
                    </Text>
                    <Text className="text-center text-sm text-muted-foreground">
                      {t('auth.benefit2', {
                        defaultValue: "Never lose your baby's precious memories",
                      })}
                    </Text>
                    <Text className="text-center text-sm text-muted-foreground">
                      {t('auth.benefit3', { defaultValue: 'Share access with family members' })}
                    </Text>
                  </View>
                </View>

                {/* Social Sign In Buttons */}
                <View className="mb-6 gap-3">
                  {Platform.OS === 'ios' && (
                    <AppleAuthentication.AppleAuthenticationButton
                      buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
                      buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
                      cornerRadius={12}
                      style={{ height: 50 }}
                      onPress={handleAppleSignIn}
                    />
                  )}

                  <Button
                    variant="outline"
                    className="h-[50px] flex-row items-center justify-center gap-3"
                    onPress={handleGoogleSignIn}
                    disabled={isLoading}>
                    <MaterialCommunityIcons name="google" size={20} color="#4285F4" />
                    <Text className="text-base font-semibold text-foreground">
                      {t('auth.continueWithGoogle', { defaultValue: 'Continue with Google' })}
                    </Text>
                  </Button>
                </View>

                {/* Divider */}
                <View className="mb-6 flex-row items-center gap-4">
                  <View className="h-px flex-1 bg-border" />
                  <Text className="text-sm text-muted-foreground">
                    {t('auth.orContinueWith', { defaultValue: 'or continue with email' })}
                  </Text>
                  <View className="h-px flex-1 bg-border" />
                </View>

                {/* Email Form */}
                <View className="gap-4">
                  <View>
                    <Label className="mb-2 text-base font-semibold text-muted-foreground">
                      {t('auth.email', { defaultValue: 'Email' })}
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
                      {t('auth.password', { defaultValue: 'Password' })}
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
                        className="absolute right-3 top-3">
                        <MaterialCommunityIcons
                          name={showPassword ? 'eye-off' : 'eye'}
                          size={24}
                          color="#999"
                        />
                      </Pressable>
                    </View>
                  </View>

                  {isSignUp && (
                    <View>
                      <Label className="mb-2 text-base font-semibold text-muted-foreground">
                        {t('auth.confirmPassword', { defaultValue: 'Confirm Password' })}
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

                  {/* Forgot Password Link - only show on sign in */}
                  {!isSignUp && (
                    <Pressable
                      onPress={() => {
                        Haptics.selectionAsync();
                        setFlow('forgot-password');
                      }}
                      className="self-end">
                      <Text className="text-sm font-medium text-primary">
                        {t('auth.forgotPassword', { defaultValue: 'Forgot Password?' })}
                      </Text>
                    </Pressable>
                  )}

                  <Button
                    onPress={isSignUp ? handleSignUp : handleSignIn}
                    disabled={isLoading}
                    className="h-12">
                    {isLoading ? (
                      <ActivityIndicator color="#FFF" />
                    ) : (
                      <Text className="text-base font-semibold text-primary-foreground">
                        {isSignUp
                          ? t('auth.createAccountBtn', { defaultValue: 'Create Account' })
                          : t('auth.signInBtn', { defaultValue: 'Sign In' })}
                      </Text>
                    )}
                  </Button>
                </View>

                {/* Toggle Sign In / Sign Up */}
                <Pressable
                  onPress={() => {
                    Haptics.selectionAsync();
                    setFlow(isSignUp ? 'sign-in' : 'sign-up');
                    setConfirmPassword('');
                  }}
                  className="mt-6 py-2">
                  <Text className="text-center text-base text-muted-foreground">
                    {isSignUp
                      ? t('auth.alreadyHaveAccount', { defaultValue: 'Already have an account?' })
                      : t('auth.dontHaveAccount', { defaultValue: "Don't have an account?" })}{' '}
                    <Text className="font-semibold text-primary">
                      {isSignUp
                        ? t('auth.signIn', { defaultValue: 'Sign In' })
                        : t('auth.signUp', { defaultValue: 'Sign Up' })}
                    </Text>
                  </Text>
                </Pressable>

                {/* Privacy Note */}
                <Text className="mt-6 text-center text-xs text-muted-foreground">
                  {t('auth.privacyNote', {
                    defaultValue:
                      'By signing in, you agree to our Terms of Service and Privacy Policy. Your data is encrypted and secure.',
                  })}
                </Text>
              </>
            )}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
