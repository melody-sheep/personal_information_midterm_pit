import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Image, ScrollView, Alert, KeyboardAvoidingView, Platform, TouchableOpacity } from 'react-native';
import { TextInput, Button, Text } from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../utils/supabase';
import { theme } from '../styles/theme';

const ProfileFormScreen = ({ navigation, route }) => {
  const profile = route.params?.profile;

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
    
    // Set navigation title based on mode
    navigation.setOptions({
      title: profile ? 'Edit Profile' : 'Add Profile',
      headerStyle: {
        backgroundColor: theme.colors.surface,
      },
      headerTintColor: theme.colors.text,
    });
  }, [profile, navigation]);

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
      
      // If it's already a URL (not a local file), return as is
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

      // Upload image if it's a local file
      if (avatar_url && avatar_url.startsWith('file://')) {
        console.log('Uploading new image...');
        avatar_url = await uploadImage(avatar_url);
        console.log('Image uploaded successfully:', avatar_url);
      }

      const submitData = {
        ...formData,
        avatar_url,
        updated_at: new Date().toISOString(),
      };

      console.log('Saving profile data...');
      
      // Handle the submission
      await saveProfile(submitData);
      
      Alert.alert('Success', 'Profile saved successfully!');

      // Navigate back - real-time updates will handle the refresh
      navigation.goBack();
    } catch (error) {
      console.error('Submit error:', error);
      Alert.alert('Error', error.message || 'Failed to save profile');
    } finally {
      setLoading(false);
    }
  };

  const saveProfile = async (profileData) => {
    try {
      if (profile?.id) {
        // Update existing profile
        const { data, error } = await supabase
          .from('profiles')
          .update(profileData)
          .eq('id', profile.id)
          .select(); // Return the updated record

        if (error) throw error;
        console.log('Profile updated:', data);
      } else {
        // Create new profile
        const { data, error } = await supabase
          .from('profiles')
          .insert([{ 
            ...profileData, 
            created_at: new Date().toISOString() 
          }])
          .select(); // Return the created record

        if (error) throw error;
        console.log('Profile created:', data);
      }
    } catch (error) {
      console.error('Save profile error:', error);
      throw error;
    }
  };

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
    >
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.content}>
          {/* Photo Section */}
          <View style={styles.avatarSection}>
            <TouchableOpacity onPress={showImageOptions} style={styles.avatarTouchable}>
              {formData.avatar_url ? (
                <Image source={{ uri: formData.avatar_url }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarPlaceholderText}>Tap to add photo</Text>
                </View>
              )}
            </TouchableOpacity>
            
            <Button 
              mode="outlined" 
              onPress={showImageOptions}
              style={styles.avatarButton}
              icon="camera"
              contentStyle={styles.buttonContent}
              labelStyle={styles.buttonLabel}
            >
              Choose Photo
            </Button>
          </View>

          {/* Personal Information Section */}
          <Text style={styles.sectionTitle}>Personal Information</Text>
          
          <TextInput
            label="Name"
            value={formData.name}
            onChangeText={(value) => updateField('name', value)}
            error={!!errors.name}
            style={styles.input}
            mode="outlined"
            outlineColor="rgba(255,255,255,0.3)"
            activeOutlineColor={theme.colors.primary}
            textColor={theme.colors.text}
            backgroundColor="rgba(255,255,255,0.05)"
          />
          {errors.name && <Text style={styles.error}>{errors.name}</Text>}

          <View style={styles.row}>
            <View style={[styles.halfInput, { marginRight: 8 }]}>
              <TextInput
                label="Age"
                value={formData.age}
                onChangeText={(value) => updateField('age', value)}
                keyboardType="numeric"
                style={styles.input}
                mode="outlined"
                outlineColor="rgba(255,255,255,0.3)"
                activeOutlineColor={theme.colors.primary}
                textColor={theme.colors.text}
                backgroundColor="rgba(255,255,255,0.05)"
              />
            </View>
            <View style={[styles.halfInput, { marginLeft: 8 }]}>
              <Text style={styles.label}>Gender</Text>

              <View style={styles.genderOptions}>
                {['male', 'female', 'other'].map((g) => (
                  <TouchableOpacity
                    key={g}
                    style={[
                      styles.genderOption,
                      formData.gender === g && styles.genderOptionActive,
                    ]}
                    onPress={() => updateField('gender', g)}
                    activeOpacity={0.8}
                  >
                    <Text style={[
                      styles.genderOptionText,
                      formData.gender === g && styles.genderOptionTextActive
                    ]}>{g.charAt(0).toUpperCase() + g.slice(1)}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          {/* Contact Information Section */}
          <Text style={styles.sectionTitle}>Contact Information</Text>

          <TextInput
            label="Email"
            value={formData.email}
            onChangeText={(value) => updateField('email', value)}
            keyboardType="email-address"
            autoCapitalize="none"
            error={!!errors.email}
            style={styles.input}
            mode="outlined"
            outlineColor="rgba(255,255,255,0.3)"
            activeOutlineColor={theme.colors.primary}
            textColor={theme.colors.text}
            backgroundColor="rgba(255,255,255,0.05)"
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
            outlineColor="rgba(255,255,255,0.3)"
            activeOutlineColor={theme.colors.primary}
            textColor={theme.colors.text}
            backgroundColor="rgba(255,255,255,0.05)"
          />
          {errors.phone && <Text style={styles.error}>{errors.phone}</Text>}

          <TextInput
            label="Address"
            value={formData.address}
            onChangeText={(value) => updateField('address', value)}
            multiline
            numberOfLines={3}
            style={styles.input}
            mode="outlined"
            outlineColor="rgba(255,255,255,0.3)"
            activeOutlineColor={theme.colors.primary}
            textColor={theme.colors.text}
            backgroundColor="rgba(255,255,255,0.05)"
          />

          {/* Bio Section */}
          <Text style={styles.sectionTitle}>Bio</Text>
          <TextInput
            label="Tell us about yourself"
            value={formData.bio}
            onChangeText={(value) => updateField('bio', value)}
            multiline
            numberOfLines={4}
            style={[styles.input, styles.bioInput]}
            mode="outlined"
            outlineColor="rgba(255,255,255,0.3)"
            activeOutlineColor={theme.colors.primary}
            textColor={theme.colors.text}
            backgroundColor="rgba(255,255,255,0.05)"
          />

          <View style={styles.buttons}>
            <Button 
              mode="outlined" 
              onPress={() => navigation.goBack()}
              style={[styles.button, styles.cancelButton]}
              contentStyle={styles.buttonContent}
              labelStyle={styles.buttonLabel}
            >
              Cancel
            </Button>
            <Button 
              mode="contained" 
              onPress={handleSubmit}
              loading={loading}
              disabled={loading}
              style={[styles.button, styles.submitButton]}
              contentStyle={styles.buttonContent}
              labelStyle={styles.buttonLabel}
            >
              {profile ? 'Update Profile' : 'Create Profile'}
            </Button>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 100, // Extra padding for keyboard
  },
  content: {
    padding: theme.spacing.lg,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  avatarTouchable: {
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  avatar: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 3,
    borderColor: theme.colors.primary,
  },
  avatarPlaceholder: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
    borderStyle: 'dashed',
  },
  avatarPlaceholderText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 14,
    textAlign: 'center',
  },
  avatarButton: {
    minWidth: 160,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
    marginTop: theme.spacing.lg,
    letterSpacing: 0.5,
  },
  input: {
    marginBottom: theme.spacing.md,
  },
  bioInput: {
    minHeight: 100,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfInput: {
    flex: 1,
  },
  label: {
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
    fontSize: 14,
    fontWeight: '500',
    opacity: 0.8,
  },
  genderOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  genderOption: {
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    marginRight: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  genderOptionActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  genderOptionText: {
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: '500',
  },
  genderOptionTextActive: {
    color: theme.colors.background,
  },
  error: {
    color: theme.colors.error,
    fontSize: 12,
    marginBottom: theme.spacing.md,
    marginTop: -theme.spacing.sm,
    marginLeft: theme.spacing.sm,
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: theme.spacing.xl,
    gap: theme.spacing.md,
  },
  button: {
    flex: 1,
  },
  cancelButton: {
    borderColor: 'rgba(255,255,255,0.3)',
  },
  submitButton: {
    backgroundColor: theme.colors.primary,
  },
  buttonContent: {
    height: 52,
  },
  buttonLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
});

export default ProfileFormScreen;