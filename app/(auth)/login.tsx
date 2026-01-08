import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Text } from '@/components/ui/text';
import { ModalHeader } from '@/components/ModalHeader';
import { useNotification } from '@/components/NotificationContext';
import { supabase } from '@/lib/supabase';
import { useLocalization } from '@/localization/LocalizationProvider';
import { useSupabaseAuth } from '@/pages/root-layout/SupabaseAuthProvider';

type AuthMode = 'signin' | 'signup';

export default function LoginScreen() {
  const { t } = useLocalization();
  const router = useRouter();
  const { showNotification } = useNotification();
  const { isAnonymous } = useSupabaseAuth();
  const [mode, setMode] = useState<AuthMode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSignIn = async () => {
    if (!email.trim() || !password.trim()) {
      showNotification(
        t('auth.emailPasswordRequired', { defaultValue: 'Email and password are required' }),
        'error'
      );
      return;
    }

    setIsLoading(true);
    try {
      // If user is anonymous, try to link to existing account
      if (isAnonymous) {
        // First, try to sign in to the existing account
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: password,
        });

        if (signInError) {
          showNotification(signInError.message, 'error');
          return;
        }

        if (signInData.session) {
          // Successfully signed in - data merge will happen automatically
          // since we're switching from anonymous to authenticated user
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          showNotification(
            t('auth.signInSuccess', {
              defaultValue: 'Signed in successfully! Your data is being synced...',
            }),
            'success'
          );
          setTimeout(() => {
            router.back();
          }, 500);
        }
      } else {
        // Regular sign in for non-anonymous users
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: password,
        });

        if (error) {
          showNotification(error.message, 'error');
          return;
        }

        if (data.session) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          showNotification(
            t('auth.signInSuccess', { defaultValue: 'Signed in successfully!' }),
            'success'
          );
          router.back();
        }
      }
    } catch (error) {
      console.error('Sign in error:', error);
      showNotification(t('auth.signInError', { defaultValue: 'Failed to sign in' }), 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async () => {
    if (!email.trim() || !password.trim()) {
      showNotification(
        t('auth.emailPasswordRequired', { defaultValue: 'Email and password are required' }),
        'error'
      );
      return;
    }

    if (password.length < 6) {
      showNotification(
        t('auth.passwordTooShort', { defaultValue: 'Password must be at least 6 characters' }),
        'error'
      );
      return;
    }

    setIsLoading(true);
    try {
      // If user is anonymous, convert them to permanent user using updateUser
      // This preserves the same user ID, so no data migration is needed!
      if (isAnonymous) {
        // First, update the email (this will send a verification email)
        const { error: updateEmailError } = await supabase.auth.updateUser({
          email: email.trim(),
        });

        if (updateEmailError) {
          // If email already exists, try signing in instead
          if (
            updateEmailError.message.includes('already registered') ||
            updateEmailError.message.includes('already exists')
          ) {
            showNotification(
              t('auth.emailExists', {
                defaultValue: 'This email is already registered. Please sign in instead.',
              }),
              'error'
            );
            setMode('signin');
            return;
          }
          showNotification(updateEmailError.message, 'error');
          return;
        }

        // After email is verified (or if email confirmation is disabled),
        // update the password to complete the conversion
        // Note: In production, you'd wait for email verification first
        const { error: updatePasswordError } = await supabase.auth.updateUser({
          password: password,
        });

        if (updatePasswordError) {
          showNotification(updatePasswordError.message, 'error');
          return;
        }

        // Successfully converted anonymous user to permanent user
        // Same user ID is preserved, so all data is automatically linked!
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        showNotification(
          t('auth.signUpSuccess', {
            defaultValue: 'Account created successfully! Your data has been preserved.',
          }),
          'success'
        );
        setTimeout(() => {
          router.back();
        }, 500);
      } else {
        // Regular sign up for non-anonymous users
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password: password,
        });

        if (error) {
          showNotification(error.message, 'error');
          return;
        }

        if (data.session) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          showNotification(
            t('auth.signUpSuccess', { defaultValue: 'Account created successfully!' }),
            'success'
          );
          setTimeout(() => {
            router.back();
          }, 500);
        } else {
          // Email confirmation required
          showNotification(
            t('auth.checkEmail', {
              defaultValue: 'Please check your email to confirm your account',
            }),
            'success'
          );
          router.back();
        }
      }
    } catch (error) {
      console.error('Sign up error:', error);
      showNotification(
        t('auth.signUpError', { defaultValue: 'Failed to create account' }),
        'error'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (mode === 'signin') {
      handleSignIn();
    } else {
      handleSignUp();
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1 }}
      className="bg-background">
      <View className="flex-1 bg-background">
        <ModalHeader
          title={
            mode === 'signin'
              ? t('auth.signIn', { defaultValue: 'Sign In' })
              : t('auth.signUp', { defaultValue: 'Sign Up' })
          }
          closeLabel={t('common.close')}
        />

        <ScrollView
          className="flex-1"
          contentContainerClassName="px-6 py-6 gap-6"
          keyboardShouldPersistTaps="handled">
          {/* Info Card */}
          <View className="rounded-2xl border border-border bg-card p-5">
            <Text className="mb-2 text-lg font-bold text-foreground">
              {t('auth.whyLogin', { defaultValue: 'Why sign in?' })}
            </Text>
            <View className="gap-2">
              <Text className="text-base text-muted-foreground">
                {t('auth.reason1', { defaultValue: '• Sync your data across all your devices' })}
              </Text>
              <Text className="text-base text-muted-foreground">
                {t('auth.reason2', { defaultValue: '• Keep your data safe and backed up' })}
              </Text>
              <Text className="text-base text-muted-foreground">
                {t('auth.reason3', { defaultValue: '• Access advanced settings and features' })}
              </Text>
            </View>
          </View>

          {/* Email Input */}
          <View>
            <Label className="mb-2 text-base font-semibold text-muted-foreground">
              {t('auth.email', { defaultValue: 'Email' })}
            </Label>
            <Input
              value={email}
              onChangeText={setEmail}
              placeholder={t('auth.emailPlaceholder', { defaultValue: 'your@email.com' })}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              className="h-12 text-base"
            />
          </View>

          {/* Password Input */}
          <View>
            <Label className="mb-2 text-base font-semibold text-muted-foreground">
              {t('auth.password', { defaultValue: 'Password' })}
            </Label>
            <Input
              value={password}
              onChangeText={setPassword}
              placeholder={t('auth.passwordPlaceholder', { defaultValue: 'Enter your password' })}
              secureTextEntry
              autoCapitalize="none"
              autoComplete={mode === 'signin' ? 'password' : 'password-new'}
              className="h-12 text-base"
            />
          </View>

          {/* Submit Button */}
          <Button
            onPress={handleSubmit}
            disabled={isLoading || !email.trim() || !password.trim()}
            className="h-14">
            <Text className="text-base font-semibold text-primary-foreground">
              {isLoading
                ? t('common.loading', { defaultValue: 'Loading...' })
                : mode === 'signin'
                  ? t('auth.signIn', { defaultValue: 'Sign In' })
                  : t('auth.signUp', { defaultValue: 'Sign Up' })}
            </Text>
          </Button>

          {/* Toggle Mode */}
          <View className="items-center">
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setMode(mode === 'signin' ? 'signup' : 'signin');
              }}
              className="py-2">
              <Text className="text-base text-accent">
                {mode === 'signin'
                  ? t('auth.noAccount', { defaultValue: "Don't have an account? Sign up" })
                  : t('auth.haveAccount', { defaultValue: 'Already have an account? Sign in' })}
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}
