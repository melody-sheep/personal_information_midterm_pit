import React, { useState } from 'react';
import { View, StyleSheet, Image, Dimensions, TouchableOpacity, Modal } from 'react-native';
import { Text } from 'react-native-paper';
import GlassmorphismCard from './GlassmorphismCard';
import { gradients, theme } from '../styles/theme';

const { width: screenWidth } = Dimensions.get('window');

const ProfileCard = ({ profile, onEdit, onDelete, isExpanded, onToggleExpand }) => {
  const [menuVisible, setMenuVisible] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const [showEmail, setShowEmail] = useState(false);
  const [showPhone, setShowPhone] = useState(false);
  const [showAddress, setShowAddress] = useState(false);

  // Get gradient colors directly as array
  const getGradientColors = () => {
    if (!profile || !profile.gender) return gradients.other;
    
    const gender = profile.gender.toLowerCase();
    switch (gender) {
      case 'male': return gradients.male;
      case 'female': return gradients.female;
      default: return gradients.other;
    }
  };

  const getGenderIcon = () => {
    if (!profile || !profile.gender) return '⚧';
    
    const gender = profile.gender.toLowerCase();
    switch (gender) {
      case 'male': return '♂';
      case 'female': return '♀';
      default: return '⚧';
    }
  };

  const getGenderColor = () => {
    if (!profile || !profile.gender) return '#BB86FC';
    
    const gender = profile.gender.toLowerCase();
    switch (gender) {
      case 'male': return '#ffffffff';
      case 'female': return '#ffffffff';
      default: return '#ffffffff';
    }
  };

  // Fix grammar for age display
  const getAgeDisplay = (age) => {
    if (!age) return 'No age';
    return age === '1' ? '1 year' : `${age} years`;
  };

  // Truncate long names with ellipsis
  const truncateName = (name) => {
    if (name && name.length > 20) {
      return name.substring(0, 20) + '...';
    }
    return name || 'No Name';
  };

  // Truncate bio for compact view
  const truncateBio = (bio) => {
    if (!bio) return 'No bio provided';
    if (bio.length > 90) {
      return bio.substring(0, 90) + '...';
    }
    return bio;
  };

  // Blur sensitive information with dots
  const blurText = (text, isVisible) => {
    if (!text) return 'Not provided';
    if (isVisible) return text;
    return '••••••••••';
  };

  const openMenu = (event) => {
    const touchEvent = event.nativeEvent;
    setMenuPosition({
      x: touchEvent.pageX - 100,
      y: touchEvent.pageY - 40,
    });
    setMenuVisible(true);
  };

  const closeMenu = () => setMenuVisible(false);

  const handleEdit = () => {
    closeMenu();
    onEdit();
  };

  const handleDelete = () => {
    closeMenu();
    onDelete();
  };

  // Reset visibility states when card collapses
  React.useEffect(() => {
    if (!isExpanded) {
      setShowEmail(false);
      setShowPhone(false);
      setShowAddress(false);
    }
  }, [isExpanded]);

  return (
    <GlassmorphismCard gradient={getGradientColors()} style={styles.card}>
      {/* Header with Avatar and Basic Info */}
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          {profile?.avatar_url ? (
            <Image source={{ uri: profile.avatar_url }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>
                {profile?.name ? profile.name.charAt(0).toUpperCase() : '?'}
              </Text>
            </View>
          )}
        </View>
        
        <View style={styles.infoContainer}>
          <Text style={styles.name} numberOfLines={1}>
            {truncateName(profile?.name)}
          </Text>
          
          <View style={styles.ageGenderContainer}>
            <Text style={styles.age}>
              {getAgeDisplay(profile?.age)}
            </Text>
            <Text style={[styles.genderIcon, { color: getGenderColor() }]}>
              {getGenderIcon()}
            </Text>
          </View>
        </View>

        {/* Custom Menu Button */}
        <TouchableOpacity 
          onPress={openMenu} 
          style={styles.menuButton}
        >
          <Text style={styles.menuIcon}>⋮</Text>
        </TouchableOpacity>
      </View>

      {/* Bio Section */}
      <View style={styles.bioContainer}>
        <Text style={styles.bioLabel}>Bio</Text>
        <Text style={styles.bioText} numberOfLines={2}>
          {truncateBio(profile?.bio)}
        </Text>
      </View>

      {/* See Details Button with NEW Dropdown Icon */}
      <TouchableOpacity 
        style={styles.detailsButton}
        onPress={onToggleExpand}
      >
        <Text style={styles.detailsButtonText}>
          {isExpanded ? 'Hide Details' : 'See Details'}
        </Text>
        <Text style={styles.dropdownIcon}>
          {isExpanded ? '❮' : '❯'}
        </Text>
      </TouchableOpacity>

      {/* Expanded Details */}
      {isExpanded && (
        <View style={styles.expandedContent}>
          {/* Personal Information Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Personal Information</Text>
            
            {/* Name */}
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Name:</Text>
              <Text style={styles.detailValue}>{profile?.name || 'Not provided'}</Text>
            </View>

            {/* Age */}
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Age:</Text>
              <Text style={styles.detailValue}>
                {profile?.age ? `${profile.age} ${profile.age === '1' ? 'year old' : 'years old'}` : 'Not provided'}
              </Text>
            </View>

            {/* Gender */}
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Gender:</Text>
              <Text style={styles.detailValue}>
                {profile?.gender ? 
                  profile.gender.charAt(0).toUpperCase() + profile.gender.slice(1) 
                  : 'Not provided'
                }
              </Text>
            </View>
          </View>

          {/* Contact Information Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Contact Information</Text>
            
            {/* Email with show/hide toggle */}
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Email:</Text>
              <View style={styles.sensitiveInfoContainer}>
                <Text style={styles.detailValue}>
                  {blurText(profile?.email, showEmail)}
                </Text>
                <TouchableOpacity 
                  onPress={() => setShowEmail(!showEmail)}
                  style={[
                    styles.showHideButton,
                    showEmail && styles.showHideButtonActive
                  ]}
                >
                  <Text style={styles.showHideText}>
                    {showEmail ? 'Hide' : 'Show'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Phone with show/hide toggle */}
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Phone:</Text>
              <View style={styles.sensitiveInfoContainer}>
                <Text style={styles.detailValue}>
                  {blurText(profile?.phone, showPhone)}
                </Text>
                <TouchableOpacity 
                  onPress={() => setShowPhone(!showPhone)}
                  style={[
                    styles.showHideButton,
                    showPhone && styles.showHideButtonActive
                  ]}
                >
                  <Text style={styles.showHideText}>
                    {showPhone ? 'Hide' : 'Show'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Address with show/hide toggle */}
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Address:</Text>
              <View style={styles.sensitiveInfoContainer}>
                <Text style={styles.detailValue}>
                  {blurText(profile?.address, showAddress)}
                </Text>
                <TouchableOpacity 
                  onPress={() => setShowAddress(!showAddress)}
                  style={[
                    styles.showHideButton,
                    showAddress && styles.showHideButtonActive
                  ]}
                >
                  <Text style={styles.showHideText}>
                    {showAddress ? 'Hide' : 'Show'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Bio Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Bio</Text>
            <View style={styles.detailRow}>
              <Text style={[styles.detailValue, styles.bioFullText]}>
                {profile?.bio || 'No bio provided'}
              </Text>
            </View>
          </View>
          
          {/* Single Edit Button - Same size as Hide Details */}
          <TouchableOpacity 
            style={[styles.actionButton, styles.editButton]}
            onPress={onEdit}
          >
            <Text style={styles.actionButtonText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Custom Menu Modal */}
      <Modal
        visible={menuVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={closeMenu}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={closeMenu}
        >
          <View style={[styles.menuContainer, { 
            position: 'absolute',
            top: menuPosition.y,
            left: menuPosition.x,
          }]}>
            <TouchableOpacity 
              style={styles.menuItem} 
              onPress={handleEdit}
            >
              <Text style={styles.menuItemText}>Edit</Text>
            </TouchableOpacity>
            <View style={styles.menuDivider} />
            <TouchableOpacity 
              style={styles.menuItem} 
              onPress={handleDelete}
            >
              <Text style={[styles.menuItemText, styles.deleteText]}>Delete</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </GlassmorphismCard>
  );
};

const styles = StyleSheet.create({
  card: {
    width: screenWidth - 32,
    minHeight: 180,
    marginHorizontal: 16,
    marginVertical: 8,
    alignSelf: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 16,
  },
  avatarContainer: {
    marginRight: 16,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  avatarPlaceholder: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  infoContainer: {
    flex: 1,
    marginRight: 8,
  },
  name: {
    fontSize: 19,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  ageGenderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  age: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '500',
    marginRight: 12,
  },
  genderIcon: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  menuButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  menuIcon: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    lineHeight: 18,
  },
  bioContainer: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  bioLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '600',
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  bioText: {
    fontSize: 14,
    color: '#FFFFFF',
    lineHeight: 20,
    fontWeight: '400',
  },
  detailsButton: {
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  detailsButtonText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  dropdownIcon: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: 'bold',
    marginLeft: 8,
    transform: [{ rotate: '90deg' }],
  },
  expandedContent: {
    marginTop: 8,
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.15)',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'flex-start',
  },
  detailLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '600',
    width: 80,
    marginRight: 12,
    marginTop: 2,
  },
  detailValue: {
    fontSize: 14,
    color: '#FFFFFF',
    flex: 1,
    fontWeight: '400',
    lineHeight: 20,
  },
  bioFullText: {
    lineHeight: 20,
    textAlign: 'left',
  },
  sensitiveInfoContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  showHideButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  showHideButtonActive: {
    backgroundColor: 'rgba(187, 134, 252, 0.3)',
    borderColor: 'rgba(187, 134, 252, 0.5)',
  },
  showHideText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '600',
  },
  actionButton: {
    marginTop: 10,
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingVertical: 12,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  editButton: {
    backgroundColor: 'rgba(187, 134, 252, 0.3)',
    borderWidth: 1,
    borderColor: 'rgba(187, 134, 252, 0.5)',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  // Custom Modal Menu Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  menuContainer: {
    backgroundColor: 'rgba(50, 50, 70, 0.95)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    width: 120,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  menuItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  menuItemText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  deleteText: {
    color: '#FF6B6B',
  },
  menuDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
});

export default ProfileCard;