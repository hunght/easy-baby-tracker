import * as ImagePicker from 'expo-image-picker';
import { supabase, requireCurrentUserId } from '@/lib/supabase';

const AVATAR_BUCKET = 'avatars';

/**
 * Upload avatar image to Supabase Storage
 * @param imageUri - Local URI of the image to upload
 * @returns Public URL of the uploaded avatar, or null if upload fails
 */
async function uploadAvatar(imageUri: string): Promise<string | null> {
  try {
    const userId = await requireCurrentUserId();

    // Read the image file
    const response = await fetch(imageUri);
    const blob = await response.blob();

    // Generate unique filename: userId/timestamp-random.ext
    const timestamp = Date.now();
    const random = Math.round(Math.random() * 1_000_000);
    const extension = imageUri.split('.').pop()?.toLowerCase() || 'jpg';
    const fileName = `${userId}/${timestamp}-${random}.${extension}`;

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage.from(AVATAR_BUCKET).upload(fileName, blob, {
      contentType: blob.type || 'image/jpeg',
      upsert: false, // Don't overwrite existing files
    });

    if (error) {
      console.error('Error uploading avatar:', error);
      return null;
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(data.path);

    return publicUrl;
  } catch (error) {
    console.error('Error in uploadAvatar:', error);
    return null;
  }
}

/**
 * Delete avatar from Supabase Storage
 * @param avatarUrl - Public URL or path of the avatar to delete
 */
export async function deleteAvatar(avatarUrl: string | null): Promise<void> {
  if (!avatarUrl) return;

  try {
    const userId = await requireCurrentUserId();

    // Extract path from URL if it's a full URL
    let path = avatarUrl;
    if (avatarUrl.includes('/storage/v1/object/public/avatars/')) {
      path = avatarUrl.split('/avatars/')[1];
    } else if (avatarUrl.startsWith('http')) {
      // Try to extract path from any URL format
      const urlParts = avatarUrl.split('/');
      const avatarsIndex = urlParts.findIndex((part) => part === 'avatars');
      if (avatarsIndex >= 0 && avatarsIndex < urlParts.length - 1) {
        path = urlParts.slice(avatarsIndex + 1).join('/');
      }
    }

    // Only delete if the path belongs to this user
    if (path.startsWith(`${userId}/`)) {
      const { error } = await supabase.storage.from(AVATAR_BUCKET).remove([path]);
      if (error) {
        console.error('Error deleting avatar:', error);
      }
    }
  } catch (error) {
    console.error('Error in deleteAvatar:', error);
  }
}

/**
 * Pick image from library or camera and upload to Supabase Storage
 * @param source - 'library' or 'camera'
 * @returns Public URL of uploaded avatar, or null if cancelled/failed
 */
export async function pickAndUploadAvatar(source: 'library' | 'camera'): Promise<string | null> {
  try {
    // Request permissions
    const permission =
      source === 'camera'
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permission.status !== 'granted') {
      return null;
    }

    // Launch picker
    const result =
      source === 'camera'
        ? await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
            mediaTypes: ['images'],
          })
        : await ImagePicker.launchImageLibraryAsync({
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
            mediaTypes: ['images'],
          });

    if (result.canceled || !result.assets || result.assets.length === 0) {
      return null;
    }

    const asset = result.assets[0];
    if (!asset.uri) {
      return null;
    }

    // Upload to Supabase Storage
    return await uploadAvatar(asset.uri);
  } catch (error) {
    console.error('Error in pickAndUploadAvatar:', error);
    return null;
  }
}

/**
 * Get public URL for an avatar path
 * @param path - Storage path (e.g., "userId/filename.jpg")
 * @returns Public URL
 */
export function getAvatarUrl(path: string | null | undefined): string | null {
  if (!path) return null;

  // If it's already a full URL, return it
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }

  // Otherwise, construct the public URL
  const { data } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}
