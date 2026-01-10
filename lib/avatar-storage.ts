import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';

/**
 * Pick image from library or camera and save locally
 * @param source - 'library' or 'camera'
 * @returns Local URI of selected image, or null if cancelled/failed
 */
export async function pickAndUploadAvatar(source: 'library' | 'camera'): Promise<string | null> {
  try {
    console.log('[pickAndUploadAvatar] Requesting permission for:', source);
    const permission =
      source === 'camera'
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();

    console.log('[pickAndUploadAvatar] Permission status:', permission.status);
    if (permission.status !== 'granted') {
      console.warn('[pickAndUploadAvatar] Permission denied');
      return null;
    }

    // Launch picker
    console.log('[pickAndUploadAvatar] Launching picker...');
    let result;
    try {
      if (source === 'camera') {
        console.log('[pickAndUploadAvatar] Calling launchCameraAsync...');
        result = await ImagePicker.launchCameraAsync({
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
        });
      } else {
        console.log('[pickAndUploadAvatar] Calling launchImageLibraryAsync...');
        result = await ImagePicker.launchImageLibraryAsync({
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
        });
      }
      console.log('[pickAndUploadAvatar] Picker result:', JSON.stringify(result, null, 2));
    } catch (pickerError) {
      console.error('[pickAndUploadAvatar] Picker error:', pickerError);
      throw pickerError;
    }

    if (result.canceled || !result.assets || result.assets.length === 0) {
      console.log('[pickAndUploadAvatar] Picker was canceled or no assets');
      return null;
    }

    const asset = result.assets[0];
    console.log('[pickAndUploadAvatar] Selected asset URI:', asset.uri);
    if (!asset.uri) {
      return null;
    }

    // Copy to app's document directory for persistence
    const fileName = `avatar_${Date.now()}.jpg`;
    const destUri = `${FileSystem.documentDirectory}${fileName}`;

    await FileSystem.copyAsync({
      from: asset.uri,
      to: destUri,
    });

    return destUri;
  } catch (error) {
    console.error('Error in pickAndUploadAvatar:', error);
    return null;
  }
}

/**
 * Delete avatar from local storage
 * @param avatarUri - Local URI of the avatar to delete
 */
export async function deleteAvatar(avatarUri: string | null): Promise<void> {
  if (!avatarUri) return;

  try {
    // Only delete if it's in our document directory
    if (avatarUri.startsWith(FileSystem.documentDirectory ?? '')) {
      const fileInfo = await FileSystem.getInfoAsync(avatarUri);
      if (fileInfo.exists) {
        await FileSystem.deleteAsync(avatarUri);
      }
    }
  } catch (error) {
    console.error('Error in deleteAvatar:', error);
  }
}

/**
 * Get avatar URL - just returns the path as-is for local storage
 * @param path - Storage path or URI
 * @returns The same path/URI
 */
export function getAvatarUrl(path: string | null | undefined): string | null {
  return path ?? null;
}
