import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, Alert, Text, TouchableOpacity, KeyboardAvoidingView, Platform, StatusBar } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { FAB, Portal, Modal, TextInput, Button } from 'react-native-paper';
import { useIsFocused } from '@react-navigation/native';
import ProfileCard from '../components/ProfileCard';
import GlassmorphismCard from '../components/GlassmorphismCard';
import { supabase } from '../utils/supabase';
import { theme } from '../styles/theme';

const HomeScreen = ({ navigation, route }) => {
  const [profiles, setProfiles] = useState([]);
  const [filteredProfiles, setFilteredProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [profileToDelete, setProfileToDelete] = useState(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [expandedCardId, setExpandedCardId] = useState(null);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [sortBy, setSortBy] = useState('newest');
  const [genderFilter, setGenderFilter] = useState('all');
  
  const isFocused = useIsFocused();

  // Fetch profiles when screen comes into focus or after form submission
  useEffect(() => {
    if (isFocused) {
      fetchProfiles();
    }
  }, [isFocused]);

  // Apply filters and sorting when profiles or filter options change
  useEffect(() => {
    applyFiltersAndSorting();
  }, [profiles, sortBy, genderFilter]);

  // Listen to real-time changes with optimized updates
  useEffect(() => {
    const channel = supabase
      .channel('realtime-profiles')
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'profiles' 
        },
        (payload) => {
          console.log('Realtime change received:', payload);
          
          // Optimized update instead of full re-fetch
          handleRealtimeUpdate(payload);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Handle real-time updates efficiently
  const handleRealtimeUpdate = (payload) => {
    setProfiles(currentProfiles => {
      const { eventType, new: newRecord, old: oldRecord } = payload;
      
      switch (eventType) {
        case 'INSERT':
          return [newRecord, ...currentProfiles];
        
        case 'UPDATE':
          return currentProfiles.map(profile => 
            profile.id === newRecord.id ? newRecord : profile
          );
        
        case 'DELETE':
          return currentProfiles.filter(profile => profile.id !== oldRecord.id);
        
        default:
          return currentProfiles;
      }
    });
  };

  const applyFiltersAndSorting = () => {
    let filtered = [...profiles];

    // Apply gender filter
    if (genderFilter !== 'all') {
      filtered = filtered.filter(profile => 
        profile.gender?.toLowerCase() === genderFilter.toLowerCase()
      );
    }

    // Apply sorting
    switch (sortBy) {
      case 'name_asc':
        filtered.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        break;
      case 'name_desc':
        filtered.sort((a, b) => (b.name || '').localeCompare(a.name || ''));
        break;
      case 'newest':
        filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        break;
      case 'oldest':
        filtered.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
        break;
      default:
        filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }

    setFilteredProfiles(filtered);
  };

  const fetchProfiles = async () => {
    try {
      setLoading(true);
      console.log('Fetching profiles from Supabase...');
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }
      
      console.log('Profiles fetched successfully. Count:', data?.length || 0);
      setProfiles(data || []);
    } catch (error) {
      console.error('Error fetching profiles:', error);
      Alert.alert('Error', 'Failed to load profiles: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProfile = async () => {
    // Convert input to uppercase for case-insensitive comparison
    if (deleteConfirmText.toUpperCase() !== 'DELETE') {
      Alert.alert('Error', 'Please type "DELETE" to confirm');
      return;
    }

    try {
      console.log('Deleting profile:', profileToDelete.id);
      
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', profileToDelete.id);

      if (error) throw error;

      // Delete avatar from storage if exists
      if (profileToDelete.avatar_url && profileToDelete.avatar_url.includes('avatars')) {
        const avatarPath = profileToDelete.avatar_url.split('/').pop();
        await supabase.storage
          .from('avatars')
          .remove([avatarPath]);
      }

      setDeleteModalVisible(false);
      setProfileToDelete(null);
      setDeleteConfirmText('');
      setExpandedCardId(null);
      
      Alert.alert('Success', 'Profile deleted successfully!');
    } catch (error) {
      console.error('Error deleting profile:', error);
      Alert.alert('Error', 'Failed to delete profile: ' + error.message);
    }
  };

  const handleToggleExpand = (profileId) => {
    setExpandedCardId(expandedCardId === profileId ? null : profileId);
  };

  const EmptyState = () => (
    <View style={styles.emptyContainer}>
      <GlassmorphismCard style={styles.emptyCard}>
        <View style={styles.emptyContent}>
          <Text style={styles.emptyTitle}>No Profiles Yet</Text>
          <Text style={styles.emptyDescription}>
            Start by creating your first personal information card
          </Text>
          <Button 
            mode="contained" 
            onPress={() => navigation.navigate('ProfileForm', { 
              profile: null
            })}
            style={styles.emptyButton}
            contentStyle={styles.buttonContent}
          >
            Set Personal Information
          </Button>
        </View>
      </GlassmorphismCard>
    </View>
  );

  const renderProfileCard = ({ item }) => (
    <ProfileCard
      profile={item}
      isExpanded={expandedCardId === item.id}
      onToggleExpand={() => handleToggleExpand(item.id)}
      onEdit={() => {
        navigation.navigate('ProfileForm', { 
          profile: item
        });
      }}
      onDelete={() => {
        setProfileToDelete(item);
        setDeleteModalVisible(true);
      }}
    />
  );

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Fixed Single Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Personal Information</Text>
        </View>

        <TouchableOpacity
          style={styles.filterButtonInline}
          onPress={() => setFilterModalVisible(true)}
        >
          <Feather name="filter" size={20} color={theme.colors.text} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading profiles...</Text>
        </View>
      ) : filteredProfiles.length === 0 ? (
        <EmptyState />
      ) : (
        <FlatList
          data={filteredProfiles}
          renderItem={renderProfileCard}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={true}
          contentContainerStyle={styles.listContent}
          style={styles.list}
        />
      )}

      {filteredProfiles.length > 0 && (
        <FAB
          icon="plus"
          style={styles.fab}
          onPress={() => navigation.navigate('ProfileForm', { 
            profile: null
          })}
          color="#000"
        />
      )}

      {/* Filter Modal */}
      <Portal>
        <Modal
          visible={filterModalVisible}
          onDismiss={() => setFilterModalVisible(false)}
          contentContainerStyle={styles.filterModal}
        >
          <Text style={styles.filterTitle}>Filter & Sort</Text>
          
          {/* Gender Filter */}
          <Text style={styles.filterLabel}>Filter by Gender</Text>
          <View style={styles.filterOptions}>
            {['all', 'male', 'female', 'other'].map((gender) => (
              <TouchableOpacity
                key={gender}
                style={[
                  styles.filterOption,
                  genderFilter === gender && styles.filterOptionSelected
                ]}
                onPress={() => setGenderFilter(gender)}
              >
                <Text style={[
                  styles.filterOptionText,
                  genderFilter === gender && styles.filterOptionTextSelected
                ]}>
                  {gender === 'all' ? 'All' : gender.charAt(0).toUpperCase() + gender.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Sort Options */}
          <Text style={styles.filterLabel}>Sort By</Text>
          <View style={styles.filterOptions}>
            {[
              { value: 'newest', label: 'Newest' },
              { value: 'oldest', label: 'Oldest' },
              { value: 'name_asc', label: 'Name A-Z' },
              { value: 'name_desc', label: 'Name Z-A' }
            ].map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.filterOption,
                  sortBy === option.value && styles.filterOptionSelected
                ]}
                onPress={() => setSortBy(option.value)}
              >
                <Text style={[
                  styles.filterOptionText,
                  sortBy === option.value && styles.filterOptionTextSelected
                ]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.filterButtons}>
            <Button 
              mode="outlined" 
              onPress={() => {
                setSortBy('newest');
                setGenderFilter('all');
              }}
              style={styles.filterButton}
              contentStyle={styles.buttonContent}
            >
              Reset
            </Button>
            <Button 
              mode="contained" 
              onPress={() => setFilterModalVisible(false)}
              style={styles.filterButton}
              contentStyle={styles.buttonContent}
            >
              Apply
            </Button>
          </View>
        </Modal>
      </Portal>

      {/* Delete Confirmation Modal - Fixed case sensitivity */}
      <Portal>
        <Modal
          visible={deleteModalVisible}
          onDismiss={() => setDeleteModalVisible(false)}
          contentContainerStyle={styles.deleteModal}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 20}
          >
            <Text style={styles.deleteTitle}>Confirm Delete</Text>
            <Text style={styles.deleteText}>
              This action cannot be undone. Type "DELETE" to confirm:
            </Text>
            <TextInput
              value={deleteConfirmText}
              onChangeText={(text) => setDeleteConfirmText(text.toUpperCase())}
              style={styles.deleteInput}
              mode="outlined"
              placeholder="Type DELETE here"
              autoCapitalize="characters"
              autoCorrect={false}
              outlineColor="rgba(255,255,255,0.3)"
              activeOutlineColor={theme.colors.error}
              autoFocus={true}
              keyboardType="default"
              returnKeyType="done"
            />
            <View style={styles.deleteButtons}>
              <Button 
                mode="outlined" 
                onPress={() => setDeleteModalVisible(false)}
                style={styles.deleteButton}
                contentStyle={styles.buttonContent}
              >
                Cancel
              </Button>
              <Button 
                mode="contained" 
                onPress={handleDeleteProfile}
                style={styles.deleteButton}
                buttonColor={theme.colors.error}
                contentStyle={styles.buttonContent}
              >
                Delete
              </Button>
            </View>
          </KeyboardAvoidingView>
        </Modal>
      </Portal>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    paddingTop: theme.spacing.xl + (Platform.OS === 'android' ? StatusBar.currentHeight || 24 : 0),
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text,
    letterSpacing: 0.5,
  },
  filterButton: {
    padding: theme.spacing.xs,
  },
  filterIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  filterIcon: {
    fontSize: 18,
    color: theme.colors.text,
    fontWeight: 'bold',
  },
  headerContent: {
    flex: 1,
    justifyContent: 'center',
  },
  filterButtonInline: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: theme.colors.text,
    fontSize: 18,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingVertical: 15,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  emptyCard: {
    width: '100%',
    maxWidth: 400,
    height: 300,
  },
  emptyContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
    textAlign: 'center',
  },
  emptyDescription: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
    lineHeight: 22,
  },
  emptyButton: {
    marginTop: theme.spacing.md,
  },
  fab: {
    position: 'absolute',
    margin: theme.spacing.xl,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.9)', // neon white glass-like
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 12,
  },
  filterModal: {
    backgroundColor: theme.colors.surface,
    margin: theme.spacing.lg,
    padding: theme.spacing.xl,
    borderRadius: theme.borderRadius.lg,
  },
  filterTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.lg,
    textAlign: 'center',
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
    marginTop: theme.spacing.lg,
  },
  filterOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: theme.spacing.md,
  },
  filterOption: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginRight: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  filterOptionSelected: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  filterOptionText: {
    color: theme.colors.text,
    fontSize: 12,
    fontWeight: '500',
  },
  filterOptionTextSelected: {
    color: theme.colors.background,
    fontWeight: '600',
  },
  filterButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: theme.spacing.lg,
  },
  filterButton: {
    flex: 1,
    marginHorizontal: theme.spacing.xs,
  },
  buttonContent: {
    height: 44,
  },
  deleteModal: {
    backgroundColor: theme.colors.surface,
    margin: theme.spacing.xl,
    padding: theme.spacing.xl,
    borderRadius: theme.borderRadius.md,
  },
  deleteTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  deleteText: {
    color: theme.colors.text,
    marginBottom: theme.spacing.lg,
    lineHeight: 20,
    fontSize: 14,
  },
  deleteInput: {
    marginBottom: theme.spacing.lg,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  deleteButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  deleteButton: {
    flex: 1,
    marginHorizontal: theme.spacing.xs,
  },
});

export default HomeScreen;