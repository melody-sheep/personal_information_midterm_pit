import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const GlassmorphismCard = ({ children, style, gradient = ['#4facfe', '#00f2fe'] }) => {
  // Ensure gradient is always an array of colors
  const gradientColors = Array.isArray(gradient) ? gradient : ['#4facfe', '#00f2fe'];

  return (
    <View style={[styles.container, style]}>
      <LinearGradient
        colors={gradientColors}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.glassmorphism}>
          {children}
        </View>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 12,
  },
  gradient: {
    borderRadius: 16,
    flex: 1,
  },
  glassmorphism: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 16,
    flex: 1,
    padding: 0,
    margin: 0,
  },
});

export default GlassmorphismCard;