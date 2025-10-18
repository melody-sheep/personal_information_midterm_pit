import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Image, ScrollView, Alert } from 'react-native';
import { TextInput, Button, Text, SegmentedButtons, Portal, Modal } from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../utils/supabase';
import { theme } from '../styles/theme';

const ProfileForm = ({ profile, onCancel, onSave }) => {
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    gender: '',
    email: '',
    phone: '',
    address: '',
    bio: '',
    avatar_url: '',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (profile) {
      setFormData(profile);
    }
  }, [profile]);

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }
    
    if (formData.phone && !/^\d+$/.test(formData.phone)) {
      newErrors.phone = 'Phone must contain only numbers';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const requestPermissions = async () => {
    const { status: libraryStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
    
    if (libraryStatus !== 'granted' || cameraStatus !== 'granted') {
      Alert.alert(
        'Permission required', 
        'Sorry, we need camera and photo library permissions to make this work!'
      );
      return false;
    }
    return true;
  };

  const pickImageFromLibrary = async () => {
    console.log('pickImageFromLibrary called!');
    
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    console.log('Image picker result:', result);

    if (!result.canceled && result.assets && result.assets[0]) {
      setFormData(prev => ({ ...prev, avatar_url: result.assets[0].uri }));
    }
  };

  const takePhotoWithCamera = async () => {
    console.log('takePhotoWithCamera called!');
    
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    let result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    console.log('Camera result:', result);

    if (!result.canceled && result.assets && result.assets[0]) {
      setFormData(prev => ({ ...prev, avatar_url: result.assets[0].uri }));
    }
  };

  const showImageOptions = () => {
    Alert.alert(
      'Select Photo',
      'Choose how to select your profile photo',
      [
        {
          text: 'Take Photo',
          onPress: takePhotoWithCamera,
        },
        {
          text: 'Choose from Gallery',
          onPress: pickImageFromLibrary,
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ],
      { cancelable: true }
    );
  };

  const uploadImage = async (uri) => {
    try {
      console.log('Uploading image from:', uri);
      
      if (!uri.startsWith('file://')) {
        console.log('Image is already a URL, skipping upload');
        return uri;
      }

      const fileExt = uri.split('.').pop()?.toLowerCase() || 'jpg';
      const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;

      console.log('Uploading to Supabase...');

      // Create FormData for file upload
      const formData = new FormData();
      formData.append('file', {
        uri: uri,
        type: `image/${fileExt}`,
        name: fileName,
      });

      const { data, error } = await supabase.storage
        .from('avatars')
        .upload(fileName, formData, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('Supabase upload error:', error);
        throw error;
      }

      console.log('Upload successful, getting public URL...');
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      console.log('Public URL:', publicUrl);
      return publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw new Error('Failed to upload image: ' + error.message);
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      let avatar_url = formData.avatar_url;

      if (avatar_url && avatar_url.startsWith('file://')) {
        console.log('Uploading image...');
        avatar_url = await uploadImage(avatar_url);
        console.log('Image uploaded to:', avatar_url);
      }

      const submitData = {
        ...formData,
        avatar_url,
        updated_at: new Date().toISOString(),
      };

      // Call the onSave prop instead of onSubmit
      if (onSave) {
        await onSave(submitData);
      }
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to save profile');
      console.error('Submit error:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <Portal>
      <Modal
        visible={true}
        onDismiss={onCancel}
        contentContainerStyle={styles.modal}
      >
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
          <Text variant="headlineMedium" style={styles.title}>
            {profile ? 'Edit Profile' : 'Add Profile'}
          </Text>

          <View style={styles.avatarSection}>
            {formData.avatar_url ? (
              <Image source={{ uri: formData.avatar_url }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarPlaceholderText}>No Photo</Text>
              </View>
            )}
            
            <Button 
              mode="outlined" 
              onPress={showImageOptions}
              style={styles.avatarButton}
              icon="camera"
            >
              Choose Photo
            </Button>
          </View>

          <TextInput
            label="Name *"
            value={formData.name}
            onChangeText={(value) => updateField('name', value)}
            error={!!errors.name}
            style={styles.input}
            mode="outlined"
            outlineColor={theme.colors.primary}
            activeOutlineColor={theme.colors.primary}
          />
          {errors.name && <Text style={styles.error}>{errors.name}</Text>}

          <TextInput
            label="Age"
            value={formData.age}
            onChangeText={(value) => updateField('age', value)}
            keyboardType="numeric"
            style={styles.input}
            mode="outlined"
            outlineColor={theme.colors.primary}
            activeOutlineColor={theme.colors.primary}
          />

          <Text style={styles.label}>Gender</Text>
          <SegmentedButtons
            value={formData.gender}
            onValueChange={(value) => updateField('gender', value)}
            buttons={[
              { value: 'male', label: 'Male' },
              { value: 'female', label: 'Female' },
              { value: 'other', label: 'Other' },
            ]}
            style={styles.input}
          />

          <TextInput
            label="Email"
            value={formData.email}
            onChangeText={(value) => updateField('email', value)}
            keyboardType="email-address"
            autoCapitalize="none"
            error={!!errors.email}
            style={styles.input}
            mode="outlined"
            outlineColor={theme.colors.primary}
            activeOutlineColor={theme.colors.primary}
          />
          {errors.email && <Text style={styles.error}>{errors.email}</Text>}

          <TextInput
            label="Phone"
            value={formData.phone}
            onChangeText={(value) => updateField('phone', value)}
            keyboardType="phone-pad"
            error={!!errors.phone}
            style={styles.input}
            mode="outlined"
            outlineColor={theme.colors.primary}
            activeOutlineColor={theme.colors.primary}
          />
          {errors.phone && <Text style={styles.error}>{errors.phone}</Text>}

          <TextInput
            label="Address"
            value={formData.address}
            onChangeText={(value) => updateField('address', value)}
            multiline
            numberOfLines={2}
            style={styles.input}
            mode="outlined"
            outlineColor={theme.colors.primary}
            activeOutlineColor={theme.colors.primary}
          />

          <TextInput
            label="Bio"
            value={formData.bio}
            onChangeText={(value) => updateField('bio', value)}
            multiline
            numberOfLines={3}
            style={styles.input}
            mode="outlined"
            outlineColor={theme.colors.primary}
            activeOutlineColor={theme.colors.primary}
          />

          <View style={styles.buttons}>
            <Button 
              mode="outlined" 
              onPress={onCancel}
              style={styles.button}
            >
              Cancel
            </Button>
            <Button 
              mode="contained" 
              onPress={handleSubmit}
              loading={loading}
              disabled={loading}
              style={styles.button}
            >
              {profile ? 'Update' : 'Create'}
            </Button>
          </View>
        </ScrollView>
      </Modal>
    </Portal>
  );
};

const styles = StyleSheet.create({
  modal: {
    backgroundColor: theme.colors.surface,
    margin: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    maxHeight: '90%',
  },
  container: {
    padding: theme.spacing.lg,
  },
  title: {
    color: theme.colors.text,
    marginBottom: theme.spacing.lg,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: theme.spacing.md,
    borderWidth: 2,
    borderColor: theme.colors.primary,
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginBottom: theme.spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
    borderStyle: 'dashed',
  },
  avatarPlaceholderText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 14,
  },
  avatarButton: {
    marginBottom: theme.spacing.md,
    minWidth: 150,
    minHeight: 50,
  },
  input: {
    marginBottom: theme.spacing.md,
  },
  label: {
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
    fontSize: 16,
    fontWeight: '600',
  },
  error: {
    color: theme.colors.error,
    fontSize: 14,
    marginBottom: theme.spacing.md,
    marginTop: -theme.spacing.sm,
    marginLeft: theme.spacing.sm,
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: theme.spacing.lg,
  },
  button: {
    flex: 1,
    marginHorizontal: theme.spacing.xs,
    minHeight: 50,
  },
});

export default ProfileForm;